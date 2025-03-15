import os
import argparse
from stravalib.client import Client
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
import time
import requests
from dotenv import load_dotenv
import glob
import re
import sys


def get_latest_activity_time(runs_dir):
    try:
        if not os.path.exists(runs_dir):
            return None
        
        files = glob.glob(os.path.join(runs_dir, '*_*.md'))
        if not files:
            return None
        
        latest_time = None
        for file in files:
            # 从文件名中提取时间戳
            match = re.search(r'\d+_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.md$', file)
            if match:
                time_str = match.group(1)
                # 将第二个和第三个连字符替换为冒号
                parts = time_str.split('T')
                if len(parts) == 2:
                    date_part = parts[0]  # 保持日期部分不变
                    time_part = parts[1].replace('-', ':')  # 只替换时间部分的连字符
                    time_str = f"{date_part} {time_part}"
                    activity_time = datetime.fromisoformat(time_str)
                    if latest_time is None or activity_time > latest_time:
                        latest_time = activity_time
        
        return latest_time
    except Exception as e:
        print(f'获取最新活动时间失败: {str(e)}')
        return None

def refresh_access_token(client_id, client_secret, refresh_token, max_retries=3, initial_delay=1):
    # 验证参数
    if not all([client_id, client_secret, refresh_token]):
        raise ValueError('client_id、client_secret和refresh_token都不能为空')

    current_delay = initial_delay
    last_exception = None

    for attempt in range(max_retries):
        try:
            response = requests.post(
                'https://www.strava.com/oauth/token',
                data={
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token'
                },
                timeout=10  # 设置10秒超时
            )
            
            if response.status_code == 200:
                token_data = response.json()
                return token_data['access_token'], token_data['refresh_token']
            else:
                error_msg = f'刷新access_token失败，HTTP状态码：{response.status_code}'
                if response.text:
                    try:
                        error_data = response.json()
                        error_msg += f'，错误信息：{error_data.get("message", "未知错误")}'                        
                    except:
                        error_msg += f'，响应内容：{response.text}'
                raise Exception(error_msg)
                
        except requests.exceptions.Timeout:
            last_exception = Exception(f'请求超时（第{attempt + 1}次尝试）')
        except requests.exceptions.ConnectionError as e:
            last_exception = Exception(f'连接错误：{str(e)}（第{attempt + 1}次尝试）')
        except Exception as e:
            last_exception = e
        
        if attempt < max_retries - 1:
            print(f'第{attempt + 1}次请求失败，{current_delay}秒后重试...')
            time.sleep(current_delay)
            current_delay *= 2  # 指数退避
        
    raise last_exception or Exception('刷新access_token失败，重试次数已用完')

def fetch_strava_activities(client_id, client_secret, refresh_token, fetch_all=False, max_retries=3):
    access_token, new_refresh_token = refresh_access_token(client_id, client_secret, refresh_token)
    client = Client(access_token=access_token)
    
    # 验证token
    try:
        athlete = client.get_athlete()
        print(f'认证成功，当前用户: {athlete.firstname} {athlete.lastname}')
    except Exception as e:
        print(f'认证失败: {str(e)}')
        raise
    
    # 检查是否存在跑步数据文件
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    runs_dir = os.path.join(project_root, 'content', 'runs')
    has_existing_data = os.path.exists(runs_dir) and len(os.listdir(runs_dir)) > 0
    
    # 确定获取数据的起始时间
    # 如果没有现有数据，即使没有传入fetch_all参数也获取所有历史数据
    after_time = None if (fetch_all or not has_existing_data) else get_latest_activity_time(runs_dir)
    if after_time:
        print(f'从{after_time.isoformat()}开始获取新数据')
    else:
        print('获取所有历史数据')
    
    for attempt in range(max_retries):
        try:
            all_activities = []
            # 使用时间窗口来获取活动数据
            current_time = datetime.now()
            if after_time:
                start_time = after_time
            else:
                # 如果没有起始时间，从1年前开始获取
                start_time = current_time - relativedelta(years=1)
            
            while start_time < current_time:
                # 设置30天的时间窗口
                end_time = min(start_time + timedelta(days=30), current_time)
                activities = list(client.get_activities(after=start_time, before=end_time))
                if not activities:
                    if not after_time:  # 如果是获取所有历史数据，继续往前查找
                        start_time = start_time - relativedelta(years=1)
                        if start_time < current_time - relativedelta(years=10):  # 最多获取10年的数据
                            break
                        continue
                    else:  # 如果是增量更新，没有新数据就退出
                        break
                
                all_activities.extend(activities)
                print(f'已获取{start_time.date()}至{end_time.date()}的数据，共{len(all_activities)}条记录')
                start_time = end_time
            
            return all_activities, new_refresh_token, access_token
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f'第{attempt + 1}次获取数据失败，等待重试...')
            time.sleep(5)

def create_markdown(activity):
    try:
        start_time = activity.start_date_local
        if not start_time:
            raise ValueError('活动开始时间不能为空')

        avg_speed = float(getattr(activity, 'average_speed', 0) or 0) * 3.6
        max_speed = float(getattr(activity, 'max_speed', 0) or 0) * 3.6
        distance = float(getattr(activity, 'distance', 0) or 0)
        elevation = float(getattr(activity, 'total_elevation_gain', 0) or 0)
        moving_time = getattr(activity, 'moving_time', None)
        moving_time = moving_time.total_seconds() if moving_time else 0
        avg_heartrate = float(getattr(activity, 'average_heartrate', 0) or 0)
        max_heartrate = float(getattr(activity, 'max_heartrate', 0) or 0)
        calories = float(getattr(activity, 'calories', 0) or 0)

        avg_pace = 60 / avg_speed if avg_speed > 0 else 0
        max_pace = 60 / max_speed if max_speed > 0 else 0

        time_str = str(timedelta(seconds=int(moving_time)))
        avg_pace_min = int(avg_pace)
        avg_pace_sec = int((avg_pace % 1) * 60)
        max_pace_min = int(max_pace)
        max_pace_sec = int((max_pace % 1) * 60)

        return f'''---
date: {start_time.strftime('%Y-%m-%d')}
distance: {distance:.2f}
duration: {moving_time}
elevation: {elevation}
avg_speed: {avg_speed:.2f}
max_speed: {max_speed:.2f}
avg_pace: {avg_pace:.2f}
max_pace: {max_pace:.2f}
avg_heartrate: {avg_heartrate:.1f}
max_heartrate: {max_heartrate:.1f}
calories: {calories:.1f}
---

# {start_time.strftime('%Y年%m月%d日')} 跑步数据

- 距离：{distance/1000:.2f}公里
- 时长：{time_str}
- 海拔：{elevation}米
- 平均配速：{avg_pace_min}:{avg_pace_sec:02d}/公里
- 最快配速：{max_pace_min}:{max_pace_sec:02d}/公里
- 平均心率：{avg_heartrate:.1f}次/分钟
- 最大心率：{max_heartrate:.1f}次/分钟
- 卡路里消耗：{calories:.1f}千卡
- 活动链接：https://www.strava.com/activities/{activity.id}
'''
    except Exception as e:
        print(f'处理活动数据时出错: {str(e)}')
        raise

def main():
    parser = argparse.ArgumentParser(description='从Strava获取跑步数据')
    parser.add_argument('--client-id', required=True, help='Strava API的client ID')
    parser.add_argument('--client-secret', required=True, help='Strava API的client secret')
    parser.add_argument('--refresh-token', required=True, help='Strava API的refresh token')
    parser.add_argument('--fetch-all', action='store_true', help='是否获取所有历史数据')
    
    args = parser.parse_args()
    
    try:
        activities, new_refresh_token, access_token = fetch_strava_activities(
            args.client_id,
            args.client_secret,
            args.refresh_token,
            args.fetch_all
        )
        
        # 创建runs目录
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        runs_dir = os.path.join(project_root, 'content', 'runs')
        os.makedirs(runs_dir, exist_ok=True)
        
        # 保存活动数据
        for activity in activities:
            if activity.type != 'Run':
                continue
            
            # 生成markdown文件名
            start_time = activity.start_date_local
            file_name = f"{activity.id}_{start_time.strftime('%Y-%m-%dT%H-%M-%S')}.md"
            file_path = os.path.join(runs_dir, file_name)
            
            # 生成markdown内容并保存
            try:
                content = create_markdown(activity)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'已保存活动数据：{file_name}')
            except Exception as e:
                print(f'保存活动 {activity.id} 失败: {str(e)}')
    
        
        print('\n数据同步完成！')
        
    except Exception as e:
        print('数据同步失败:', str(e))
        print('错误详情:')
        import traceback
        print(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()
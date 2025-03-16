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

def fetch_strava_activities(client_id, client_secret, refresh_token, start_date, end_date, max_retries=3):
    access_token, new_refresh_token = refresh_access_token(client_id, client_secret, refresh_token)
    client = Client(access_token=access_token)
    
    # 验证token
    try:
        athlete = client.get_athlete()
        print(f'认证成功，当前用户: {athlete.firstname} {athlete.lastname}')
    except Exception as e:
        print(f'认证失败: {str(e)}')
        raise
    
    for attempt in range(max_retries):
        try:
            all_activities = []
            current_time = start_date
            
            while current_time < end_date:
                # 设置30天的时间窗口
                window_end = min(current_time + timedelta(days=30), end_date)
                activities = list(client.get_activities(after=current_time, before=window_end))
                
                if activities:
                    all_activities.extend(activities)
                    print(f'已获取{current_time.date()}至{window_end.date()}的数据，共{len(all_activities)}条记录')
                
                current_time = window_end
            
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
        if moving_time:
            try:
                moving_time = moving_time.total_seconds()
            except AttributeError:
                # 如果total_seconds()方法不可用，尝试直接使用秒数
                moving_time = getattr(moving_time, 'seconds', 0)
        else:
            moving_time = 0
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
    parser = argparse.ArgumentParser(description='从Strava获取指定日期范围内的跑步数据')
    parser.add_argument('--client-id', required=True, help='Strava API的client ID')
    parser.add_argument('--client-secret', required=True, help='Strava API的client secret')
    parser.add_argument('--refresh-token', required=True, help='Strava API的refresh token')
    parser.add_argument('--start-date', required=True, help='开始日期 (YYYY-MM-DD格式)')
    parser.add_argument('--end-date', required=True, help='结束日期 (YYYY-MM-DD格式)')
    
    args = parser.parse_args()
    
    try:
        # 解析日期字符串
        try:
            start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
            end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
            
            # 确保结束日期不超过当前日期
            current_date = datetime.now()
            if end_date > current_date:
                end_date = current_date
                print(f'结束日期已调整为当前日期: {end_date.strftime("%Y-%m-%d")}')
            
            # 确保开始日期不晚于结束日期
            if start_date > end_date:
                raise ValueError('开始日期不能晚于结束日期')
                
        except ValueError as e:
            print(f'日期格式错误: {str(e)}')
            sys.exit(1)
        
        activities, new_refresh_token, access_token = fetch_strava_activities(
            args.client_id,
            args.client_secret,
            args.refresh_token,
            start_date,
            end_date
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
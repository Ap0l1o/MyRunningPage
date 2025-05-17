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
from process_laps_with_streams import process_laps, process_laps_with_streams


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
    
    for attempt in range(max_retries):
        try:
            # 获取最新活动时间
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            runs_dir = os.path.join(project_root, 'content', 'runs')
            
            if fetch_all:
                print('获取所有历史数据')
                # 获取所有活动
                all_activities = list(client.get_activities())
            else:
                latest_time = get_latest_activity_time(runs_dir)
<<<<<<< HEAD
                            break
                        continue
                    else:  # 如果是增量更新，没有新数据就退出
                        break
                
                all_activities.extend(activities)
                print(f'已获取{start_time.date()}至{end_time.date()}的数据，共{len(all_activities)}条记录')
                start_time = end_time
=======
                # 获取最新活动
                print(f'获取最新活动数据')
                all_activities = list(client.get_activities(after=latest_time))
                print(f'已获取{len(all_activities)}条新记录')
>>>>>>> main
            
            return all_activities, new_refresh_token, access_token
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f'第{attempt + 1}次获取数据失败，等待重试...')
            time.sleep(5)

def get_activity_details(client, activity_id, max_retries=3):
    """获取活动的详细信息，包括分段数据"""
    for attempt in range(max_retries):
        try:
            # 获取活动详情，包括分段数据
            activity_detail = client.get_activity(activity_id, include_all_efforts=True)
            return activity_detail
        except Exception as e:
            if attempt == max_retries - 1:
                print(f'获取活动 {activity_id} 详情失败: {str(e)}')
                raise e
            print(f'第{attempt + 1}次获取活动详情失败，等待重试...')
            time.sleep(5)

def get_activity_streams(client, activity_id, max_retries=3):
    """获取活动的流数据，包括心率、配速和海拔数据"""
    for attempt in range(max_retries):
        try:
            # 获取活动流数据
            streams = client.get_activity_streams(
                activity_id, 
                types=['time', 'distance', 'heartrate', 'altitude', 'velocity_smooth', 'cadence'],
                resolution='medium'
            )
            return streams
        except Exception as e:
            if attempt == max_retries - 1:
                print(f'获取活动 {activity_id} 流数据失败: {str(e)}')
                return None  # 返回None而不是抛出异常，因为流数据不是必需的
            print(f'第{attempt + 1}次获取活动流数据失败，等待重试...')
            time.sleep(5)

def process_segment_efforts(segment_efforts):
    """处理分段数据，提取关键信息"""
    if not segment_efforts:
        return []
    
    processed_segments = []
    for effort in segment_efforts:
        segment = effort.segment
        
        # 提取分段信息
        segment_data = {
            'name': effort.name,
            'distance': float(effort.distance),
            'elapsed_time': effort.elapsed_time.total_seconds() if hasattr(effort.elapsed_time, 'total_seconds') else float(effort.elapsed_time),
            'moving_time': effort.moving_time.total_seconds() if hasattr(effort.moving_time, 'total_seconds') else float(effort.moving_time),
            'average_heartrate': float(getattr(effort, 'average_heartrate', 0) or 0),
            'max_heartrate': float(getattr(effort, 'max_heartrate', 0) or 0),
            'average_grade': float(getattr(segment, 'average_grade', 0) or 0),
            'maximum_grade': float(getattr(segment, 'maximum_grade', 0) or 0),
            'elevation_difference': float(getattr(segment, 'elevation_high', 0) or 0) - float(getattr(segment, 'elevation_low', 0) or 0)
        }
        
        processed_segments.append(segment_data)
    
    return processed_segments

def process_stream_data(streams):
    """处理流数据，生成图表数据"""
    if not streams:
        return {
            'heartrate_data': [],
            'pace_data': [],
            'elevation_data': []
        }
    
    heartrate_data = []
    pace_data = []
    elevation_data = []
    
    # 处理心率数据
    if 'heartrate' in streams and 'time' in streams:
        times = streams['time'].data
        heartrates = streams['heartrate'].data
        
        for i in range(0, len(times), 10):  # 每10个数据点取一个，减少数据量
            heartrate_data.append({
                'x': times[i],  # 时间（秒）
                'y': heartrates[i]  # 心率
            })
    
    # 处理配速数据（从速度计算）
    if 'velocity_smooth' in streams and 'time' in streams:
        times = streams['time'].data
        velocities = streams['velocity_smooth'].data
        
        for i in range(0, len(times), 10):  # 每10个数据点取一个
            if velocities[i] > 0:
                # 计算配速（分钟/公里）
                pace_min_per_km = 16.6667 / velocities[i]  # 1000 / 60 / velocity
                
                pace_data.append({
                    'x': times[i],  # 时间（秒）
                    'y': pace_min_per_km  # 配速（分钟/公里）
                })
    
    # 处理海拔数据
    if 'altitude' in streams and 'time' in streams:
        times = streams['time'].data
        altitudes = streams['altitude'].data
        
        for i in range(0, len(times), 10):  # 每10个数据点取一个
            elevation_data.append({
                'x': times[i],  # 时间（秒）
                'y': altitudes[i]  # 海拔（米）
            })
    
    return {
        'heartrate_data': heartrate_data,
        'pace_data': pace_data,
        'elevation_data': elevation_data
    }

def get_activity_splits(client, activity_id):
    """获取活动的公里分割数据"""
    # 获取完整的活动详情，包括分割数据
    activity_detail = client.get_activity(activity_id=activity_id, include_all_efforts=True)
    return activity_detail

def process_splits(activity):
    """处理公里分割数据"""
    splits = []
    
    # 获取公里分割数据
    if hasattr(activity, 'splits_metric') and activity.splits_metric:
        for i, split in enumerate(activity.splits_metric):
            # 处理elapsed_time和moving_time，可能是timedelta对象
            elapsed_time = getattr(split, 'elapsed_time', 0) or 0
            if hasattr(elapsed_time, 'total_seconds'):
                elapsed_time = elapsed_time.total_seconds()
                
            moving_time = getattr(split, 'moving_time', 0) or 0
            if hasattr(moving_time, 'total_seconds'):
                moving_time = moving_time.total_seconds()
            
            split_data = {
                'distance': float(getattr(split, 'distance', 0) or 0),
                'elapsed_time': float(elapsed_time),
                'moving_time': float(moving_time),
                'average_speed': float(getattr(split, 'average_speed', 0) or 0),
                'pace': 16.6667 / float(getattr(split, 'average_speed', 0) or 1) if float(getattr(split, 'average_speed', 0) or 0) > 0 else 0,
                'average_heartrate': float(getattr(split, 'average_heartrate', 0) or 0),
                'elevation_difference': float(getattr(split, 'elevation_difference', 0) or 0),
                'split_number': i + 1
            }
            splits.append(split_data)
    
    return splits

<<<<<<< HEAD
def create_markdown(activity, segments=None, stream_data=None, splits=None):
=======
def create_markdown(activity, segments=None, stream_data=None, splits=None, laps=None):
>>>>>>> main
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

        # 构建frontmatter
        frontmatter_lines = [
            f"date: {start_time.strftime('%Y-%m-%d')}",
            f"distance: {distance:.2f}",
            f"duration: {moving_time}",
            f"elevation: {elevation}",
            f"avg_speed: {avg_speed:.2f}",
            f"max_speed: {max_speed:.2f}",
            f"avg_pace: {avg_pace:.2f}",
            f"max_pace: {max_pace:.2f}",
            f"avg_heartrate: {avg_heartrate:.1f}",
            f"max_heartrate: {max_heartrate:.1f}",
            f"calories: {calories:.1f}"
        ]
        
        # 添加分段数据
        if segments:
            frontmatter_lines.append(f"segments: {json.dumps(segments)}")
            
        # 添加公里分割数据
        if splits:
            frontmatter_lines.append(f"splits: {json.dumps(splits)}")
<<<<<<< HEAD
=======
            
        # 添加分圈数据
        if laps:
            frontmatter_lines.append(f"laps: {json.dumps(laps)}")
>>>>>>> main
        
        # 添加流数据
        if stream_data:
            if stream_data.get('heartrate_data'):
                frontmatter_lines.append(f"heartrate_data: {json.dumps(stream_data['heartrate_data'])}")
            if stream_data.get('pace_data'):
                frontmatter_lines.append(f"pace_data: {json.dumps(stream_data['pace_data'])}")
            if stream_data.get('elevation_data'):
                frontmatter_lines.append(f"elevation_data: {json.dumps(stream_data['elevation_data'])}")
        
        # 构建frontmatter部分
        frontmatter = "---\n" + "\n".join(frontmatter_lines) + "\n---\n\n"
        
        # 构建Markdown内容
        content = f"# {start_time.strftime('%Y年%m月%d日')} 跑步数据\n\n"
        content += f"- 距离：{distance/1000:.2f}公里\n"
        content += f"- 时长：{time_str}\n"
        content += f"- 海拔：{elevation}米\n"
        content += f"- 平均配速：{avg_pace_min}:{avg_pace_sec:02d}/公里\n"
        content += f"- 最快配速：{max_pace_min}:{max_pace_sec:02d}/公里\n"
        content += f"- 平均心率：{avg_heartrate:.1f}次/分钟\n"
        content += f"- 最大心率：{max_heartrate:.1f}次/分钟\n"
        content += f"- 卡路里消耗：{calories:.1f}千卡\n"
        content += f"- 活动链接：https://www.strava.com/activities/{activity.id}\n"
        
        # 添加公里分割数据描述
        if splits and len(splits) > 0:
            content += "\n## 公里分割\n\n"
            content += "| 公里 | 用时 | 配速 | 心率 | 海拔变化 |\n"
            content += "|------|------|------|------|------|\n"
            
            for split in splits:
                split_time = str(timedelta(seconds=int(split['moving_time'])))
                pace_min = int(split['pace'])
                pace_sec = int((split['pace'] % 1) * 60)
                pace_str = f"{pace_min}:{pace_sec:02d}"
                
                content += f"| {split['split_number']} | {split_time} | {pace_str}/km | {int(split['average_heartrate'])} | {split['elevation_difference']:.1f}m |\n"
            
            content += "\n"
        
        # 添加分段数据描述
        if segments and len(segments) > 0:
            content += "\n## 分段数据\n\n"
            for i, segment in enumerate(segments):
                content += f"### {i+1}. {segment['name']}\n\n"
                content += f"- 距离：{segment['distance']/1000:.2f}公里\n"
                segment_time = str(timedelta(seconds=int(segment['elapsed_time'])))
                content += f"- 用时：{segment_time}\n"
                
                if segment['average_grade']:
                    content += f"- 平均坡度：{segment['average_grade']:.1f}%\n"
                
                if segment['maximum_grade']:
                    content += f"- 最大坡度：{segment['maximum_grade']:.1f}%\n"
                
                if segment['average_heartrate']:
                    content += f"- 平均心率：{segment['average_heartrate']:.1f}次/分钟\n"
                
                if segment['max_heartrate']:
                    content += f"- 最大心率：{segment['max_heartrate']:.1f}次/分钟\n"
                
                content += "\n"
        
        return frontmatter + content
    except Exception as e:
        print(f'处理活动数据时出错: {str(e)}')
        raise

def main():
    parser = argparse.ArgumentParser(description='从Strava获取跑步数据')
    parser.add_argument('--client-id', required=True, help='Strava API的client ID')
    parser.add_argument('--client-secret', required=True, help='Strava API的client secret')
    parser.add_argument('--refresh-token', required=True, help='Strava API的refresh token')
    parser.add_argument('--fetch-all', action='store_true', help='是否获取所有历史数据')
    parser.add_argument('--no-segments', action='store_true', help='不获取分段数据')
    parser.add_argument('--no-splits', action='store_true', help='不获取公里分割数据')
<<<<<<< HEAD
    parser.add_argument('--include-streams', action='store_true', help='是否包含流数据（心率、配速、海拔）')
=======
    parser.add_argument('--no-laps', action='store_true', help='不获取分圈数据')
    parser.add_argument('--no-streams', action='store_true', help='不获取流数据（心率、配速、海拔）')
>>>>>>> main
    
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
        
        # 创建客户端
        client = Client(access_token=access_token)
        
        # 保存活动数据
        for activity in activities:
            if activity.type != 'Run':
                continue
            
            # 生成markdown文件名
            start_time = activity.start_date_local
            file_name = f"{activity.id}_{start_time.strftime('%Y-%m-%dT%H-%M-%S')}.md"
            file_path = os.path.join(runs_dir, file_name)
            
            # 获取详细数据
            segments = None
            stream_data = None
            
            if not args.no_segments:
                try:
                    # 获取活动详情，包括分段数据
                    activity_detail = get_activity_details(client, activity.id)
                    segments = process_segment_efforts(activity_detail.segment_efforts)
                    print(f'已获取活动 {activity.id} 的分段数据，共 {len(segments)} 个分段')
                except Exception as e:
                    print(f'获取活动 {activity.id} 分段数据失败: {str(e)}')
            
            if not args.no_streams:
                try:
                    # 获取活动流数据
                    streams = get_activity_streams(client, activity.id)
                    if streams:
                        stream_data = process_stream_data(streams)
                        print(f'已获取活动 {activity.id} 的流数据')
                except Exception as e:
                    print(f'获取活动 {activity.id} 流数据失败: {str(e)}')
            
            # 获取公里分割数据
            splits = None
            detailed_activity = None
            if not args.no_splits:
                try:
                    # 获取详细的活动数据，包括分割信息
                    detailed_activity = get_activity_splits(client, activity.id)
                    splits = process_splits(detailed_activity)
                    if splits:
                        print(f'已获取活动 {activity.id} 的公里分割数据，共 {len(splits)} 个分割')
                except Exception as e:
                    print(f'获取活动 {activity.id} 公里分割数据失败: {str(e)}')
            
            # 获取分圈数据
            laps = None
            if not args.no_laps:
                try:
                    # 使用正确的API调用获取分圈数据
                    if not detailed_activity:
                        detailed_activity = client.get_activity(activity.id, include_all_efforts=True)
                    
                    # 如果有流数据，使用流数据计算分圈的心率
                    if stream_data and 'heartrate_data' in stream_data and stream_data['heartrate_data']:
                        # 使用流数据计算分圈的心率
                        # 将流数据转换为process_laps_with_streams函数需要的格式
                        streams = {}
                        if 'heartrate_data' in stream_data and stream_data['heartrate_data']:
                            times = [point['x'] for point in stream_data['heartrate_data']]
                            heartrates = [point['y'] for point in stream_data['heartrate_data']]
                            
                            # 创建流数据对象
                            class StreamData:
                                def __init__(self, data):
                                    self.data = data
                                    
                            streams['time'] = StreamData(times)
                            streams['heartrate'] = StreamData(heartrates)
                            
                            # 使用流数据处理分圈数据
                            laps = process_laps_with_streams(detailed_activity, streams)
                        else:
                            # 如果没有心率流数据，使用普通方法
                            laps = process_laps(detailed_activity)
                    else:
                        # 如果没有流数据，使用普通方法
                        laps = process_laps(detailed_activity)
                        
                    if laps:
                        print(f'已获取活动 {activity.id} 的分圈数据，共 {len(laps)} 个分圈')
                except Exception as e:
                    print(f'获取活动 {activity.id} 分圈数据失败: {str(e)}')
            
            # 生成markdown内容并保存
            try:
                content = create_markdown(activity, segments, stream_data, splits, laps)
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
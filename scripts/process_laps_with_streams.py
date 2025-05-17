def process_laps_with_streams(activity, streams=None):
    """
    处理分圈数据，并使用流数据计算每个分圈的平均心率和最大心率
    
    参数:
        activity: Strava活动对象
        streams: 活动的流数据，包含心率、时间等信息
    
    返回:
        分圈数据列表
    """
    laps = []
    
    # 如果没有流数据，则使用默认方法处理
    if not streams or 'heartrate' not in streams or 'time' not in streams:
        print("\n没有流数据或流数据不完整，使用默认方法处理分圈数据")
        return process_laps(activity)
    
    # 提取心率和时间数据
    times = streams['time'].data
    heartrates = streams['heartrate'].data
    
    print(f"\n找到流数据: {len(times)}个时间点, {len(heartrates)}个心率数据点")
    
    # 打印部分流数据例子
    print("\n流数据示例:")
    for i in range(min(5, len(times))):
        print(f"  时间: {times[i]}秒, 心率: {heartrates[i]}次/分钟")
    
    # 获取分圈数据
    if hasattr(activity, 'laps') and activity.laps:
        print(f"\n找到 {len(activity.laps)} 个分圈")
        for i, lap in enumerate(activity.laps):
            # 处理elapsed_time和moving_time，可能是timedelta对象
            elapsed_time = getattr(lap, 'elapsed_time', 0) or 0
            if hasattr(elapsed_time, 'total_seconds'):
                elapsed_time = elapsed_time.total_seconds()
                
            moving_time = getattr(lap, 'moving_time', 0) or 0
            if hasattr(moving_time, 'total_seconds'):
                moving_time = moving_time.total_seconds()
            
            # 计算配速 (分钟/公里)
            avg_speed = float(getattr(lap, 'average_speed', 0) or 0)
            pace = 16.6667 / avg_speed if avg_speed > 0 else 0
            
            # 获取分圈的开始时间（相对于活动开始的秒数）
            start_index = getattr(lap, 'start_index', 0) or 0
            end_index = getattr(lap, 'end_index', 0) or 0
            
            # 如果没有start_index或end_index，尝试使用时间计算
            if start_index == 0 or end_index == 0:
                # 获取分圈和活动的开始时间
                lap_start_time = getattr(lap, 'start_date', None)
                activity_start_time = getattr(activity, 'start_date', None)
                
                if lap_start_time and activity_start_time:
                    # 计算分圈开始时间相对于活动开始时间的偏移（秒）
                    try:
                        time_offset = (lap_start_time - activity_start_time).total_seconds()
                        # 找到最接近这个时间偏移的时间点索引
                        for j, t in enumerate(times):
                            if t >= time_offset:
                                start_index = j
                                break
                        # 结束索引 = 开始索引 + 持续时间对应的数据点数
                        end_index = start_index
                        for j in range(start_index, len(times)):
                            if times[j] >= time_offset + elapsed_time:
                                end_index = j
                                break
                    except Exception as e:
                        print(f"计算分圈 {i+1} 的时间偏移失败: {str(e)}")
            
            # 计算分圈的心率数据
            avg_hr = 0
            max_hr = 0
            hr_data_points = []
            
            # 获取分圈的开始和结束时间
            lap_start_time = getattr(lap, 'start_date', None)
            activity_start_time = getattr(activity, 'start_date', None)
            
            if lap_start_time and activity_start_time:
                try:
                    # 计算分圈开始时间相对于活动开始时间的偏移（秒）
                    start_offset = (lap_start_time - activity_start_time).total_seconds()
                    end_offset = start_offset + elapsed_time
                    
                    print(f"分圈 {i+1}: 开始时间偏移 = {start_offset:.1f}秒, 结束时间偏移 = {end_offset:.1f}秒")
                    
                    # 从流数据中提取对应时间范围内的心率数据
                    for j in range(len(times)):
                        if times[j] >= start_offset and times[j] <= end_offset:
                            hr_data_points.append(heartrates[j])
                    
                    if hr_data_points:
                        avg_hr = sum(hr_data_points) / len(hr_data_points)
                        max_hr = max(hr_data_points)
                        print(f"分圈 {i+1}: 找到 {len(hr_data_points)} 个心率数据点，平均心率: {avg_hr:.1f}, 最大心率: {max_hr:.1f}")
                    else:
                        print(f"分圈 {i+1}: 在流数据中未找到对应时间范围的心率数据")
                except Exception as e:
                    print(f"分圈 {i+1}: 计算心率数据时出错: {str(e)}")
            
            # 如果没有从流数据中获取到心率，尝试从分圈对象或活动对象中获取
            if avg_hr == 0:
                # 检查多种可能的心率字段名
                possible_avg_hr_fields = ['average_heartrate', 'avg_heartrate', 'average_heart_rate', 'avg_heart_rate']
                possible_max_hr_fields = ['max_heartrate', 'maximum_heartrate', 'max_heart_rate', 'maximum_heart_rate']
                
                for field in possible_avg_hr_fields:
                    if hasattr(lap, field) and getattr(lap, field) is not None:
                        avg_hr = float(getattr(lap, field))
                        print(f"分圈 {i+1}: 使用分圈对象的平均心率: {avg_hr:.1f}")
                        break
                        
                for field in possible_max_hr_fields:
                    if hasattr(lap, field) and getattr(lap, field) is not None:
                        max_hr = float(getattr(lap, field))
                        print(f"分圈 {i+1}: 使用分圈对象的最大心率: {max_hr:.1f}")
                        break
                
                # 如果还是没有找到心率数据，尝试从活动对象获取
                if avg_hr == 0 and hasattr(activity, 'average_heartrate') and activity.average_heartrate:
                    avg_hr = float(activity.average_heartrate)
                    print(f"分圈 {i+1}: 使用活动的平均心率: {avg_hr:.1f}")
                    
                if max_hr == 0 and hasattr(activity, 'max_heartrate') and activity.max_heartrate:
                    max_hr = float(activity.max_heartrate)
                    print(f"分圈 {i+1}: 使用活动的最大心率: {max_hr:.1f}")
            
            lap_data = {
                'lap_number': i + 1,
                'name': getattr(lap, 'name', f"Lap {i + 1}"),
                'distance': float(getattr(lap, 'distance', 0) or 0),
                'elapsed_time': float(elapsed_time),
                'moving_time': float(moving_time),
                'average_speed': avg_speed,
                'pace': pace,
                'average_heartrate': avg_hr,
                'max_heartrate': max_hr,
                'start_date': str(getattr(lap, 'start_date_local', '')),
                'elevation_difference': float(getattr(lap, 'total_elevation_gain', 0) or 0)
            }
            laps.append(lap_data)
    else:
        print("\n活动对象中没有分圈数据，使用默认方法处理")
        return process_laps(activity)
    
    return laps

def process_laps(activity):
    """处理分圈数据（不使用流数据）"""
    laps = []
    
    # 获取分圈数据
    if hasattr(activity, 'laps') and activity.laps:
        print(f"\n找到 {len(activity.laps)} 个分圈")
        for i, lap in enumerate(activity.laps):
            # 处理elapsed_time和moving_time，可能是timedelta对象
            elapsed_time = getattr(lap, 'elapsed_time', 0) or 0
            if hasattr(elapsed_time, 'total_seconds'):
                elapsed_time = elapsed_time.total_seconds()
                
            moving_time = getattr(lap, 'moving_time', 0) or 0
            if hasattr(moving_time, 'total_seconds'):
                moving_time = moving_time.total_seconds()
            
            # 计算配速 (分钟/公里)
            avg_speed = float(getattr(lap, 'average_speed', 0) or 0)
            pace = 16.6667 / avg_speed if avg_speed > 0 else 0
            
            # 尝试获取心率数据，检查多种可能的字段名
            avg_hr = 0
            max_hr = 0
            
            # 检查多种可能的心率字段名
            possible_avg_hr_fields = ['average_heartrate', 'avg_heartrate', 'average_heart_rate', 'avg_heart_rate']
            possible_max_hr_fields = ['max_heartrate', 'maximum_heartrate', 'max_heart_rate', 'maximum_heart_rate']
            
            for field in possible_avg_hr_fields:
                if hasattr(lap, field) and getattr(lap, field) is not None:
                    avg_hr = float(getattr(lap, field))
                    break
                    
            for field in possible_max_hr_fields:
                if hasattr(lap, field) and getattr(lap, field) is not None:
                    max_hr = float(getattr(lap, field))
                    break
            
            # 如果还是没有找到心率数据，尝试从其他数据源获取
            if avg_hr == 0 and hasattr(activity, 'average_heartrate') and activity.average_heartrate:
                avg_hr = float(activity.average_heartrate)
                
            if max_hr == 0 and hasattr(activity, 'max_heartrate') and activity.max_heartrate:
                max_hr = float(activity.max_heartrate)
            
            lap_data = {
                'lap_number': i + 1,
                'name': getattr(lap, 'name', f"Lap {i + 1}"),
                'distance': float(getattr(lap, 'distance', 0) or 0),
                'elapsed_time': float(elapsed_time),
                'moving_time': float(moving_time),
                'average_speed': avg_speed,
                'pace': pace,
                'average_heartrate': avg_hr,
                'max_heartrate': max_hr,
                'start_date': str(getattr(lap, 'start_date_local', '')),
                'elevation_difference': float(getattr(lap, 'total_elevation_gain', 0) or 0)
            }
            laps.append(lap_data)
    else:
        print("\n活动对象中没有分圈数据")
        if hasattr(activity, 'splits_metric') and activity.splits_metric:
            print(f"\n活动有 {len(activity.splits_metric)} 个公里分割数据，尝试使用这些数据作为分圈数据")
            # 如果没有分圈数据，尝试使用公里分割数据
            for i, split in enumerate(activity.splits_metric):
                # 处理elapsed_time和moving_time
                elapsed_time = getattr(split, 'elapsed_time', 0) or 0
                if hasattr(elapsed_time, 'total_seconds'):
                    elapsed_time = elapsed_time.total_seconds()
                    
                moving_time = getattr(split, 'moving_time', 0) or 0
                if hasattr(moving_time, 'total_seconds'):
                    moving_time = moving_time.total_seconds()
                
                # 计算配速
                avg_speed = float(getattr(split, 'average_speed', 0) or 0)
                pace = 16.6667 / avg_speed if avg_speed > 0 else 0
                
                # 获取心率数据
                avg_hr = float(getattr(split, 'average_heartrate', 0) or 0)
                
                lap_data = {
                    'lap_number': i + 1,
                    'name': f"Split {i + 1}",
                    'distance': float(getattr(split, 'distance', 0) or 0),
                    'elapsed_time': float(elapsed_time),
                    'moving_time': float(moving_time),
                    'average_speed': avg_speed,
                    'pace': pace,
                    'average_heartrate': avg_hr,
                    'max_heartrate': 0,  # 分割数据通常没有最大心率
                    'start_date': '',  # 分割数据通常没有开始时间
                    'elevation_difference': float(getattr(split, 'elevation_difference', 0) or 0)
                }
                laps.append(lap_data)
    
    return laps

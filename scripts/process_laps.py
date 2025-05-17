def process_laps(activity):
    """处理分圈数据"""
    laps = []
    
    # 打印活动对象的属性，检查分圈数据的位置
    print("\n\n检查活动对象的属性:")
    for attr in dir(activity):
        if not attr.startswith('_'):
            print(f"- {attr}")
    
    # 获取分圈数据
    if hasattr(activity, 'laps') and activity.laps:
        print(f"\n找到 {len(activity.laps)} 个分圈")
        for i, lap in enumerate(activity.laps):
            print(f"\n分圈 {i+1} 的属性:")
            for attr in dir(lap):
                if not attr.startswith('_') and attr not in ['from_dict', 'to_dict']:
                    try:
                        value = getattr(lap, attr)
                        print(f"- {attr}: {value}")
                    except Exception as e:
                        print(f"- {attr}: 无法获取值 ({str(e)})")
            
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
                    print(f"\n找到平均心率字段: {field} = {avg_hr}")
                    break
                    
            for field in possible_max_hr_fields:
                if hasattr(lap, field) and getattr(lap, field) is not None:
                    max_hr = float(getattr(lap, field))
                    print(f"找到最大心率字段: {field} = {max_hr}")
                    break
            
            # 如果还是没有找到心率数据，尝试从其他数据源获取
            if avg_hr == 0 and hasattr(activity, 'average_heartrate') and activity.average_heartrate:
                avg_hr = float(activity.average_heartrate)
                print(f"\n使用活动的平均心率: {avg_hr}")
                
            if max_hr == 0 and hasattr(activity, 'max_heartrate') and activity.max_heartrate:
                max_hr = float(activity.max_heartrate)
                print(f"使用活动的最大心率: {max_hr}")
            
            lap_data = {
                'lap_number': i + 1,
                'name': f"Lap {i + 1}",
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
                print(f"\n公里分割 {i+1} 的属性:")
                for attr in dir(split):
                    if not attr.startswith('_') and attr not in ['from_dict', 'to_dict']:
                        try:
                            value = getattr(split, attr)
                            print(f"- {attr}: {value}")
                        except Exception as e:
                            print(f"- {attr}: 无法获取值 ({str(e)})")
                
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

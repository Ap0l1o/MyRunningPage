require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Strava API 配置
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const RUNS_DIRECTORY = path.join(__dirname, '../content/runs');

// 确保目录存在
if (!fs.existsSync(RUNS_DIRECTORY)) {
  fs.mkdirSync(RUNS_DIRECTORY, { recursive: true });
}

// 获取新的访问令牌
async function getAccessToken() {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    throw error;
  }
}

// 获取活动列表
async function getActivities(accessToken, page = 1, perPage = 30) {
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { page, per_page: perPage }
    });
    return response.data;
  } catch (error) {
    console.error('获取活动列表失败:', error);
    throw error;
  }
}

// 获取活动详情，包括分段数据
async function getActivityDetails(accessToken, activityId) {
  try {
    // 获取活动基本信息，包括分段努力
    const activityResponse = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    // 获取活动流数据（时间序列数据）
    const streamsResponse = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=time,distance,heartrate,cadence,watts,temp,moving,altitude&key_by_type=true`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    return {
      activity: activityResponse.data,
      streams: streamsResponse.data
    };
  } catch (error) {
    console.error(`获取活动 ${activityId} 详情失败:`, error);
    throw error;
  }
}

// 处理分段数据
function processSegmentEfforts(segmentEfforts) {
  if (!segmentEfforts || !Array.isArray(segmentEfforts)) {
    return [];
  }
  
  return segmentEfforts.map(effort => ({
    name: effort.name,
    distance: effort.distance,
    elapsed_time: effort.elapsed_time,
    moving_time: effort.moving_time,
    average_heartrate: effort.average_heartrate,
    max_heartrate: effort.max_heartrate,
    average_grade: effort.segment?.average_grade,
    maximum_grade: effort.segment?.maximum_grade,
    elevation_difference: effort.segment?.elevation_high - effort.segment?.elevation_low
  }));
}

// 处理流数据，生成图表数据
function processStreamData(streams) {
  if (!streams) {
    return {
      heartrate_data: [],
      pace_data: [],
      elevation_data: []
    };
  }
  
  const heartrate_data = [];
  const pace_data = [];
  const elevation_data = [];
  
  // 处理心率数据
  if (streams.heartrate && streams.time) {
    const times = streams.time.data;
    const heartrates = streams.heartrate.data;
    
    for (let i = 0; i < times.length; i++) {
      if (i % 10 === 0) { // 每10个数据点取一个，减少数据量
        heartrate_data.push({
          x: times[i], // 时间（秒）
          y: heartrates[i] // 心率
        });
      }
    }
  }
  
  // 处理配速数据（从距离和时间计算）
  if (streams.distance && streams.time) {
    const times = streams.time.data;
    const distances = streams.distance.data;
    
    for (let i = 1; i < times.length; i++) {
      if (i % 10 === 0) { // 每10个数据点取一个
        const timeDiff = times[i] - times[i-1];
        const distanceDiff = distances[i] - distances[i-1];
        
        if (timeDiff > 0 && distanceDiff > 0) {
          // 计算配速（分钟/公里）
          const speedMps = distanceDiff / timeDiff; // 米/秒
          const paceMinPerKm = 16.6667 / speedMps; // 1000 / 60 / speedMps
          
          pace_data.push({
            x: times[i], // 时间（秒）
            y: paceMinPerKm // 配速（分钟/公里）
          });
        }
      }
    }
  }
  
  // 处理海拔数据
  if (streams.altitude && streams.time) {
    const times = streams.time.data;
    const altitudes = streams.altitude.data;
    
    for (let i = 0; i < times.length; i++) {
      if (i % 10 === 0) { // 每10个数据点取一个
        elevation_data.push({
          x: times[i], // 时间（秒）
          y: altitudes[i] // 海拔（米）
        });
      }
    }
  }
  
  return {
    heartrate_data,
    pace_data,
    elevation_data
  };
}

// 将活动数据保存为Markdown文件
function saveActivityAsMarkdown(activity, streams, segmentEfforts) {
  const date = new Date(activity.start_date);
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const formattedTime = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
  
  // 处理分段数据
  const segments = processSegmentEfforts(segmentEfforts);
  
  // 处理流数据
  const streamData = processStreamData(streams);
  
  // 创建Markdown内容
  const frontmatter = {
    date: activity.start_date,
    distance: activity.distance,
    duration: activity.moving_time,
    elevation: activity.total_elevation_gain,
    avg_speed: activity.average_speed,
    max_speed: activity.max_speed,
    avg_pace: 1000 / 60 / activity.average_speed, // 转换为分钟/公里
    max_pace: 1000 / 60 / activity.max_speed, // 转换为分钟/公里
    avg_heartrate: activity.average_heartrate,
    max_heartrate: activity.max_heartrate,
    calories: activity.calories,
    segments: segments,
    heartrate_data: streamData.heartrate_data,
    pace_data: streamData.pace_data,
    elevation_data: streamData.elevation_data
  };
  
  // 格式化配速显示
  const formatPace = (pace) => {
    const paceMin = Math.floor(pace);
    const paceSec = Math.round((pace - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
  };
  
  // 格式化时长显示
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 创建Markdown内容
  let markdownContent = `---
date: ${activity.start_date}
distance: ${activity.distance.toFixed(2)}
duration: ${activity.moving_time.toFixed(1)}
elevation: ${activity.total_elevation_gain.toFixed(1)}
avg_speed: ${activity.average_speed.toFixed(2)}
max_speed: ${activity.max_speed.toFixed(2)}
avg_pace: ${(1000 / 60 / activity.average_speed).toFixed(2)}
max_pace: ${(1000 / 60 / activity.max_speed).toFixed(2)}
avg_heartrate: ${activity.average_heartrate?.toFixed(1) || 0}
max_heartrate: ${activity.max_heartrate?.toFixed(1) || 0}
calories: ${activity.calories?.toFixed(1) || 0}
segments: ${JSON.stringify(segments)}
---

# ${formattedDate} 跑步数据

- 距离：${(activity.distance / 1000).toFixed(2)}公里
- 时长：${formatDuration(activity.moving_time)}
- 海拔：${activity.total_elevation_gain.toFixed(1)}米
- 平均配速：${formatPace(1000 / 60 / activity.average_speed)}/公里
- 最快配速：${formatPace(1000 / 60 / activity.max_speed)}/公里
- 平均心率：${activity.average_heartrate?.toFixed(1) || 0}次/分钟
- 最大心率：${activity.max_heartrate?.toFixed(1) || 0}次/分钟
- 卡路里消耗：${activity.calories?.toFixed(1) || 0}千卡
`;

  // 添加分段数据信息
  if (segments && segments.length > 0) {
    markdownContent += `\n\n## 分段数据\n\n`;
    segments.forEach((segment, index) => {
      markdownContent += `### ${index + 1}. ${segment.name}\n\n`;
      markdownContent += `- 距离：${(segment.distance / 1000).toFixed(2)}公里\n`;
      markdownContent += `- 用时：${formatDuration(segment.elapsed_time)}\n`;
      
      if (segment.average_grade) {
        markdownContent += `- 平均坡度：${segment.average_grade.toFixed(1)}%\n`;
      }
      
      if (segment.maximum_grade) {
        markdownContent += `- 最大坡度：${segment.maximum_grade.toFixed(1)}%\n`;
      }
      
      if (segment.average_heartrate) {
        markdownContent += `- 平均心率：${segment.average_heartrate.toFixed(1)}次/分钟\n`;
      }
      
      if (segment.max_heartrate) {
        markdownContent += `- 最大心率：${segment.max_heartrate.toFixed(1)}次/分钟\n`;
      }
      
      markdownContent += '\n';
    });
  }
  
  // 保存文件
  const fileName = `${activity.id}_${formattedDate}T${formattedTime}.md`;
  const filePath = path.join(RUNS_DIRECTORY, fileName);
  
  fs.writeFileSync(filePath, markdownContent);
  console.log(`保存活动 ${activity.id} 到 ${filePath}`);
}

// 主函数
async function main() {
  try {
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 获取最近的活动
    const activities = await getActivities(accessToken);
    
    // 只处理跑步活动
    const runActivities = activities.filter(activity => activity.type === 'Run');
    
    // 获取每个活动的详细信息并保存
    for (const activity of runActivities) {
      try {
        console.log(`处理活动 ${activity.id}...`);
        
        // 检查文件是否已存在
        const existingFiles = fs.readdirSync(RUNS_DIRECTORY);
        const activityFileExists = existingFiles.some(file => file.startsWith(`${activity.id}_`));
        
        if (activityFileExists) {
          console.log(`活动 ${activity.id} 已存在，跳过`);
          continue;
        }
        
        // 获取活动详情
        const { activity: activityDetails, streams } = await getActivityDetails(accessToken, activity.id);
        
        // 保存为Markdown
        saveActivityAsMarkdown(activityDetails, streams, activityDetails.segment_efforts);
        
        // 避免API限制，添加延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`处理活动 ${activity.id} 时出错:`, error);
      }
    }
    
    console.log('所有活动处理完成');
  } catch (error) {
    console.error('主程序出错:', error);
  }
}

// 运行主函数
main();

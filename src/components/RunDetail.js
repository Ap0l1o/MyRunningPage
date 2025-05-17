import React from 'react'
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryContainer, VictoryArea } from 'victory'

const RunDetail = ({ runData, segments, splits: propsSplits }) => {
  // 检测是否为移动端 - 必须在组件顶层调用Hooks
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!runData) {
    return <div>加载中...</div>
  }
  
  // 获取公里分割数据 - 优先使用直接传递的props数据
  let splits = [];
  
  if (propsSplits && propsSplits.length > 0) {
    splits = propsSplits;
    console.log('Using props splits data:', splits);
  } else if (runData.frontmatter && runData.frontmatter.splits) {
    // 如果是字符串，尝试解析
    if (typeof runData.frontmatter.splits === 'string') {
      try {
        splits = JSON.parse(runData.frontmatter.splits);
        console.log('Parsed frontmatter splits data:', splits);
      } catch (e) {
        console.error('Error parsing frontmatter splits data:', e);
      }
    } else {
      splits = runData.frontmatter.splits;
      console.log('Using frontmatter splits data:', splits);
    }
  }
  
  // 调试输出
  console.log('Final splits data:', splits);
  console.log('Splits data type:', typeof splits);
  console.log('Splits data length:', splits ? splits.length : 0);
  console.log('Splits data is array:', Array.isArray(splits));
  
  // Strava风格的样式
  const stravaStyles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#333',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: isMobile ? '15px' : '20px',
      backgroundColor: '#fff',
      borderRadius: isMobile ? '8px' : '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    section: {
      marginBottom: isMobile ? '20px' : '30px',
      padding: isMobile ? '15px' : '24px',
      backgroundColor: '#f9f9f9',
      borderRadius: isMobile ? '8px' : '12px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    sectionTitle: {
      fontSize: isMobile ? '18px' : '20px',
      fontWeight: '600',
      marginBottom: isMobile ? '15px' : '20px',
      color: '#333',
      letterSpacing: '-0.01em',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '10px' : '20px',
      marginBottom: isMobile ? '15px' : '20px',
    },
    statCard: {
      backgroundColor: '#fff',
      padding: isMobile ? '12px' : '16px',
      borderRadius: isMobile ? '8px' : '10px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s ease',
      cursor: 'default',
    },
    statLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px',
      fontWeight: '500',
    },
    statValue: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '600',
      color: '#fc4c02',  // Strava橙色
    },
    statUnit: {
      fontSize: '14px',
      color: '#666',
      marginLeft: '4px',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      backgroundColor: '#fff',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    tableHeader: {
      backgroundColor: '#f5f5f7',
      color: '#1d1d1f',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'left',
      padding: '12px 16px',
      borderBottom: '1px solid #e6e6e6',
    },
    tableHeaderCenter: {
      backgroundColor: '#f5f5f7',
      color: '#1d1d1f',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid #e6e6e6',
    },
    tableHeaderRight: {
      backgroundColor: '#f5f5f7',
      color: '#1d1d1f',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'right',
      padding: '12px 16px',
      borderBottom: '1px solid #e6e6e6',
    },
    tableCell: {
      padding: '12px 16px',
      borderBottom: '1px solid #f5f5f7',
      fontSize: '14px',
      color: '#1d1d1f',
    },
    tableCellCenter: {
      padding: '12px 16px',
      borderBottom: '1px solid #f5f5f7',
      fontSize: '14px',
      color: '#1d1d1f',
      textAlign: 'center',
    },
    tableCellRight: {
      padding: '12px 16px',
      borderBottom: '1px solid #f5f5f7',
      fontSize: '14px',
      color: '#1d1d1f',
      textAlign: 'right',
    },
    tableCellHighlight: {
      padding: '12px 16px',
      borderBottom: '1px solid #f5f5f7',
      fontSize: '14px',
      color: '#1d1d1f',
      fontWeight: '500',
    },
    link: {
      color: '#fc4c02',  // Strava橙色
      textDecoration: 'none',
      transition: 'color 0.2s ease',
    },
  }

  const formatPace = (pace) => {
<<<<<<< HEAD
    // 检查pace是否为有效数字
    if (pace === undefined || pace === null || isNaN(pace)) {
      return '-';
    }
    const paceMin = Math.floor(pace);
    const paceSec = Math.round((pace % 1) * 60);
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}`;
=======
    const paceMin = Math.floor(pace)
    const paceSec = Math.round((pace % 1) * 60)
    return `${paceMin}'${paceSec.toString().padStart(2, '0')}`
>>>>>>> main
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 从文件路径中提取时间信息的辅助函数
  const getTimeFromPath = (path) => {
    if (!path) return '';
    const match = path.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  
  // 提取日期和时间
  const date = new Date(runData.frontmatter.date)
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  
  // 从文件路径中提取时间信息
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const timeInfo = getTimeFromPath(runData.fileAbsolutePath);
  
  // 如果有文件名中提取的时间信息，优先使用它
  if (timeInfo) {
    const timePart = timeInfo.split('T')[1];
    if (timePart) {
      const [h, m] = timePart.split('-');
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }
  }
  
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const formattedDateTime = `${formattedDate} ${formattedTime}`

  // 假设我们有心率、配速和海拔的时间序列数据
  // 在实际应用中，这些数据应该从API获取
  const heartRateData = segments?.heartrate_data || []
  const paceData = segments?.pace_data || []
  const elevationData = segments?.elevation_data || []

  return (
    <div style={stravaStyles.container}>
      <h2 style={{ 
        margin: isMobile ? '0 0 15px 0' : '0 0 24px 0', 
        color: '#333', 
        fontSize: isMobile ? '22px' : '28px', 
        fontWeight: '600', 
        letterSpacing: '-0.02em',
        wordBreak: 'break-word'
      }}>
        {formattedDateTime} 跑步记录
      </h2>
      
      {/* 第一栏: 跑步汇总数据 */}
      <div style={stravaStyles.section}>
        <h3 style={stravaStyles.sectionTitle}>跑步数据汇总</h3>
        
        <div style={stravaStyles.statsGrid}>
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>距离</div>
            <div>
              <span style={stravaStyles.statValue}>{(runData.frontmatter.distance / 1000).toFixed(2)}</span>
              <span style={stravaStyles.statUnit}>公里</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>时长</div>
            <div>
              <span style={stravaStyles.statValue}>{formatDuration(runData.frontmatter.duration)}</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>平均配速</div>
            <div>
              <span style={stravaStyles.statValue}>{formatPace(runData.frontmatter.avg_pace)}</span>
              <span style={stravaStyles.statUnit}>/公里</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>最快配速</div>
            <div>
              <span style={stravaStyles.statValue}>{formatPace(runData.frontmatter.max_pace)}</span>
              <span style={stravaStyles.statUnit}>/公里</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>平均心率</div>
            <div>
              <span style={stravaStyles.statValue}>{Math.round(runData.frontmatter.avg_heartrate)}</span>
              <span style={stravaStyles.statUnit}>次/分钟</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>最大心率</div>
            <div>
              <span style={stravaStyles.statValue}>{Math.round(runData.frontmatter.max_heartrate)}</span>
              <span style={stravaStyles.statUnit}>次/分钟</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>海拔</div>
            <div>
              <span style={stravaStyles.statValue}>{Math.round(runData.frontmatter.elevation)}</span>
              <span style={stravaStyles.statUnit}>米</span>
            </div>
          </div>
          
          <div style={stravaStyles.statCard}>
            <div style={stravaStyles.statLabel}>卡路里</div>
            <div>
              <span style={stravaStyles.statValue}>{Math.round(runData.frontmatter.calories)}</span>
              <span style={stravaStyles.statUnit}>千卡</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <a 
            href={`https://www.strava.com/activities/${runData.frontmatter.strava_id || (runData.fileAbsolutePath ? runData.fileAbsolutePath.split('/').pop().split('_')[0] : '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={stravaStyles.link}
          >
            在 Strava 上查看活动
          </a>
        </div>
      </div>

      {/* 第二栏: 公里分割数据 */}
      <div style={stravaStyles.section}>
        <h3 style={stravaStyles.sectionTitle}>公里分割数据</h3>
        
        {splits && Array.isArray(splits) && splits.length > 0 ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{...stravaStyles.table, fontSize: isMobile ? '14px' : '16px'}}>
              <thead>
                <tr>
                  <th style={stravaStyles.tableHeaderCenter}>公里</th>
                  <th style={stravaStyles.tableHeaderCenter}>用时</th>
                  <th style={stravaStyles.tableHeaderCenter}>配速</th>
                  <th style={stravaStyles.tableHeaderCenter}>心率</th>
                  <th style={stravaStyles.tableHeaderCenter}>海拔变化</th>
                </tr>
              </thead>
              <tbody>
                {splits.map((split, index) => {
                  // 计算配速与平均配速的差异百分比
                  const avgPace = runData.frontmatter.avg_pace;
                  const splitPace = split.pace;
                  const paceVariation = avgPace > 0 ? ((splitPace - avgPace) / avgPace) * 100 : 0;
                  
                  // 根据配速差异确定单元格背景色
                  let paceCellStyle = {...stravaStyles.tableCellCenter};
                  if (paceVariation < -5) {
                    // 配速明显快于平均
                    paceCellStyle.backgroundColor = 'rgba(252, 76, 2, 0.1)';
                    paceCellStyle.color = '#fc4c02';
                  } else if (paceVariation > 5) {
                    // 配速明显慢于平均
                    paceCellStyle.backgroundColor = 'rgba(102, 102, 102, 0.1)';
                    paceCellStyle.color = '#666';
                  }
                  
                  return (
                    <tr key={index}>
                      <td style={stravaStyles.tableCellHighlight}>
                        {split.split_number}
                      </td>
                      <td style={stravaStyles.tableCellCenter}>
                        {formatDuration(split.moving_time)}
                      </td>
                      <td style={paceCellStyle}>
                        {formatPace(split.pace)}/km
                      </td>
                      <td style={stravaStyles.tableCellCenter}>
                        {Math.round(split.average_heartrate || 0)}
                      </td>
                      <td style={stravaStyles.tableCellCenter}>
                        <span style={split.elevation_difference > 0 ? {color: '#fc4c02'} : {color: '#666'}}>
                          {split.elevation_difference > 0 ? '+' : ''}{split.elevation_difference.toFixed(1)}m
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: isMobile ? '20px' : '30px', 
            textAlign: 'center', 
            background: '#f9f9f9', 
            borderRadius: isMobile ? '8px' : '10px',
            color: '#666'
          }}>
            <p>暂无公里分割数据</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              此跑步活动没有记录公里分割数据，或者数据尚未加载。
            </p>
          </div>
        )}
      </div>

      {/* 分圈数据 */}
      {runData.frontmatter.laps && runData.frontmatter.laps.length > 0 ? (
        <div style={stravaStyles.section}>
          <h3 style={stravaStyles.sectionTitle}>分圈数据</h3>
          
          <div style={{ overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' }}>
            <table style={{...stravaStyles.table, fontSize: isMobile ? '14px' : '16px'}}>
              <thead>
                <tr>
                  <th style={stravaStyles.tableHeader}>圈数</th>
                  <th style={stravaStyles.tableHeaderRight}>距离 (km)</th>
                  <th style={stravaStyles.tableHeaderRight}>用时</th>
                  <th style={stravaStyles.tableHeaderRight}>配速</th>
                  <th style={stravaStyles.tableHeaderRight}>平均心率</th>
                  <th style={stravaStyles.tableHeaderRight}>最大心率</th>
                  <th style={stravaStyles.tableHeaderRight}>爬升 (m)</th>
                </tr>
              </thead>
              <tbody>
                {runData.frontmatter.laps.map((lap, index) => (
                  <tr key={index}>
                    <td style={stravaStyles.tableCell}>
                      {lap.name || `第 ${lap.lap_number} 圈`}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {(lap.distance / 1000).toFixed(2)}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {formatDuration(lap.elapsed_time)}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {lap.elapsed_time && lap.distance ? 
                        `${formatPace(lap.elapsed_time / 60 / (lap.distance / 1000))}/km` : 
                        '-'}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {lap.average_heartrate ? (
                        <span style={{ 
                          color: lap.average_heartrate > 160 ? '#ff4d4d' : 
                                 lap.average_heartrate > 140 ? '#ff8c00' : 
                                 lap.average_heartrate > 120 ? '#2ecc71' : 
                                 '#3498db'
                        }}>
                          {Math.round(lap.average_heartrate)}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {lap.max_heartrate ? (
                        <span style={{ 
                          color: lap.max_heartrate > 180 ? '#ff4d4d' : 
                                 lap.max_heartrate > 160 ? '#ff8c00' : 
                                 lap.max_heartrate > 140 ? '#2ecc71' : 
                                 '#3498db'
                        }}>
                          {Math.round(lap.max_heartrate)}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {Math.round(lap.elevation_difference || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* 第三栏: 路线数据 (原分段数据) */}
      {segments && segments.segment_efforts && segments.segment_efforts.length > 0 && (
        <div style={stravaStyles.section}>
          <h3 style={stravaStyles.sectionTitle}>路线数据</h3>
          
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{...stravaStyles.table, fontSize: isMobile ? '14px' : '16px'}}>
              <thead>
                <tr>
                  <th style={stravaStyles.tableHeader}>分段名称</th>
                  <th style={stravaStyles.tableHeaderRight}>距离 (km)</th>
                  <th style={stravaStyles.tableHeaderRight}>时长</th>
                  <th style={stravaStyles.tableHeaderRight}>平均配速</th>
                  <th style={stravaStyles.tableHeaderRight}>平均心率</th>
                  <th style={stravaStyles.tableHeaderRight}>爬升 (m)</th>
                </tr>
              </thead>
              <tbody>
                {segments.segment_efforts.map((segment, index) => (
                  <tr key={index}>
                    <td style={stravaStyles.tableCell}>
                      {segment && segment.segment ? (
                        <a 
                          href={`https://www.strava.com/segments/${segment.segment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={stravaStyles.link}
                        >
                          {segment.name}
                        </a>
                      ) : (
                        <span>{segment && segment.name || `片段 ${index + 1}`}</span>
                      )}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {(segment.distance / 1000).toFixed(2)}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {formatDuration(segment.elapsed_time)}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {segment && segment.elapsed_time && segment.distance ? 
                        `${formatPace(segment.elapsed_time / 60 / (segment.distance / 1000))}/km` : 
                        '-'}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {Math.round(segment.average_heartrate || 0)}
                    </td>
                    <td style={stravaStyles.tableCellRight}>
                      {Math.round(segment.elevation_difference || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 如果没有分段数据，显示提示信息 */}
      {(!segments || !segments.segment_efforts || segments.segment_efforts.length === 0) && (
        <div style={{ 
          padding: '30px', 
          textAlign: 'center', 
          background: '#f9f9f9', 
          borderRadius: '10px',
          color: '#666'
        }}>
          <p>暂无分段数据</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            此跑步活动没有记录分段数据，或者数据尚未加载。
          </p>
        </div>
      )}
      
      {/* 数据分析图表 */}
      {(heartRateData.length > 0 || paceData.length > 0 || elevationData.length > 0) && (
        <div style={stravaStyles.section}>
          <h3 style={stravaStyles.sectionTitle}>数据分析</h3>
          
          <div style={{ display: 'grid', gap: isMobile ? '15px' : '20px' }}>
            {/* 心率图表 */}
            {heartRateData.length > 0 && (
              <div style={{ height: isMobile ? '200px' : '250px', background: '#f9f9f9', padding: isMobile ? '15px' : '20px', borderRadius: isMobile ? '8px' : '10px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>心率</h4>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={200}
                  padding={{ top: 10, bottom: 30, left: 50, right: 20 }}
                  containerComponent={<VictoryContainer responsive={true} />}
                >
                  <VictoryArea
                    style={{
                      data: { 
                        fill: "rgba(252, 76, 2, 0.1)", 
                        stroke: "#fc4c02",
                        strokeWidth: 2
                      }
                    }}
                    data={heartRateData}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                </VictoryChart>
              </div>
            )}
            
            {/* 配速图表 */}
            {paceData.length > 0 && (
              <div style={{ height: isMobile ? '200px' : '250px', background: '#f9f9f9', padding: isMobile ? '15px' : '20px', borderRadius: isMobile ? '8px' : '10px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>配速</h4>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={200}
                  padding={{ top: 10, bottom: 30, left: 50, right: 20 }}
                  containerComponent={<VictoryContainer responsive={true} />}
                >
                  <VictoryLine
                    style={{
                      data: { 
                        stroke: "#fc4c02",
                        strokeWidth: 2
                      }
                    }}
                    data={paceData}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                </VictoryChart>
              </div>
            )}
            
            {/* 海拔图表 */}
            {elevationData.length > 0 && (
              <div style={{ height: isMobile ? '200px' : '250px', background: '#f9f9f9', padding: isMobile ? '15px' : '20px', borderRadius: isMobile ? '8px' : '10px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>海拔</h4>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={200}
                  padding={{ top: 10, bottom: 30, left: 50, right: 20 }}
                  containerComponent={<VictoryContainer responsive={true} />}
                >
                  <VictoryArea
                    style={{
                      data: { 
                        fill: "rgba(252, 76, 2, 0.1)", 
                        stroke: "#fc4c02",
                        strokeWidth: 2
                      }
                    }}
                    data={elevationData}
                  />
                  <VictoryAxis
                    dependentAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#ccc" },
                      tickLabels: { fontSize: 10, padding: 5, fill: '#666' }
                    }}
                  />
                </VictoryChart>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RunDetail

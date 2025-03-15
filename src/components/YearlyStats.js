import React from 'react'

const YearlyStats = ({ runs }) => {
  // 获取当前年份
  const currentYear = new Date().getFullYear()
  
  // 筛选当年的跑步数据
  const currentYearRuns = runs.filter(run => {
    const runDate = new Date(run.frontmatter.date)
    return runDate.getFullYear() === currentYear
  })
  
  // 计算当年的总距离 (km)
  const totalDistance = currentYearRuns.reduce((sum, run) => {
    return sum + (run.frontmatter.distance / 1000)
  }, 0)
  
  // 计算当年的总时长 (秒)
  const totalDuration = currentYearRuns.reduce((sum, run) => {
    return sum + (run.frontmatter.duration || 0)
  }, 0)
  
  // 计算当年的总爬升 (米)
  const totalElevation = currentYearRuns.reduce((sum, run) => {
    return sum + (run.frontmatter.elevation || 0)
  }, 0)
  
  // 计算平均配速 (分钟/公里)
  const averagePace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0
  const paceMinutes = Math.floor(averagePace)
  const paceSeconds = Math.floor((averagePace - paceMinutes) * 60)
  
  // 格式化总时长
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(4, 1fr)', 
      gap: '20px', 
      marginTop: '20px',
      marginBottom: '30px'
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3>📏 年度总距离</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {totalDistance.toFixed(1)} km
        </p>
      </div>
      
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3>🏃 平均配速</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {paceMinutes}'{paceSeconds.toString().padStart(2, '0')}"/km
        </p>
      </div>
      
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3>⏱️ 年度总时长</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {hours}小时{minutes}分钟
        </p>
      </div>
      
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3>⛰️ 年度总爬升</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {totalElevation.toFixed(0)} 米
        </p>
      </div>
    </div>
  )
}

export default YearlyStats
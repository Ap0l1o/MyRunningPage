import React from 'react'

const StatsSummary = ({ runs, isMobile }) => {
  // 筛选当前年份的数据
  const filteredRuns = runs.filter(run => {
    const runDate = new Date(run.frontmatter.date)
    const now = new Date()
    return runDate.getFullYear() === now.getFullYear()
  })

  // 计算总距离
  const totalDistance = filteredRuns.reduce((sum, run) => sum + run.frontmatter.distance / 1000, 0)
  
  // 计算总时长
  const totalDuration = filteredRuns.reduce((sum, run) => sum + (run.frontmatter.duration || 0), 0)
  
  // 计算总爬升
  const totalElevation = filteredRuns.reduce((sum, run) => sum + (run.frontmatter.elevation || 0), 0)
  
  // 计算平均配速
  const avgPace = filteredRuns.length > 0 
    ? filteredRuns.reduce((sum, run) => sum + (run.frontmatter.avg_pace || 0), 0) / filteredRuns.length
    : 0
  
  const paceMinutes = Math.floor(avgPace)
  const paceSeconds = Math.floor((avgPace - paceMinutes) * 60)
  const formattedPace = filteredRuns.length > 0 
    ? `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}"`
    : "0'00\""

  return (
    <div className="summary-cards" style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '20px', 
      marginTop: '20px' 
    }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>📏 总距离</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {totalDistance.toFixed(1)} km
        </p>
      </div>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>⏱️ 总时长</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {Math.floor(totalDuration / 3600)}小时{Math.floor((totalDuration % 3600)/60)}分钟
        </p>
      </div>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>⛰️ 总爬升</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {Math.floor(totalElevation)} 米
        </p>
      </div>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>🏃 平均配速</h3>
        <p style={{ fontSize: '24px', color: '#fc4c02' }}>
          {formattedPace}/KM
        </p>
      </div>
    </div>
  )
}

export default StatsSummary

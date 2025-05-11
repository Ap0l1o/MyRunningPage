import React, { useState, useEffect } from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer } from 'victory'
import { graphql } from 'gatsby'
import WeeklyChart from '../components/WeeklyChart'
import MonthlyHeatmap from '../components/MonthlyHeatmap'
import YearlyChart from '../components/YearlyChart'
import Profile from '../components/Profile'

export const query = graphql`
  query {
    allMarkdownRemark {
      nodes {
        frontmatter {
          date
          distance
          duration
          elevation
          avg_speed
          max_speed
          avg_pace
          max_pace
          avg_heartrate
          max_heartrate
          calories
        }
        fileAbsolutePath
      }
    }
  }
`

const IndexPage = ({ data }) => {
  const runs = data.allMarkdownRemark.nodes
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRange, setSelectedRange] = useState('week')
  const [isMobile, setIsMobile] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // 添加移动端样式
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.innerHTML = `
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          main {
            padding: 10px !important;
          }
          .dashboard-cards {
            display: flex !important;
            flex-direction: column !important;
          }
          .dashboard-cards > * {
            margin-bottom: 15px;
            min-height: 300px !important;
            height: auto !important;
          }
          .summary-cards {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .summary-cards > div {
            padding: 15px !important;
          }
          .summary-cards h3 {
            font-size: 14px !important;
          }
          .summary-cards p {
            font-size: 18px !important;
          }
          /* 优化本周跑量图表在移动端的显示 */
          .weekly-chart-container {
            overflow: visible !important;
          }
          .weekly-chart-container svg {
            transform: scale(0.9) !important;
            transform-origin: center !important;
            margin-left: -10px !important;
          }
          /* 移动端个人简介和PB信息显示 */
          .profile-container {
            overflow: visible !important;
          }
          .profile-intro, .profile-pb {
            display: block !important;
            visibility: visible !important;
          }
          .profile-pb-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            height: auto !important;
            min-height: 150px !important;
            overflow: visible !important;
          }
          .profile-pb {
            height: auto !important;
            min-height: 200px !important;
            overflow: visible !important;
          }
          /* 所有设备上都确保完整显示 */
          @media (min-width: 769px) {
            .weekly-chart-container svg {
              transform: none !important;
              margin-left: 0 !important;
              width: 100% !important;
            }
            .weekly-chart-container > div {
              width: 100% !important;
            }
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  const processData = () => {
    const now = new Date()
    // 首先过滤符合时间范围的跑步数据
    const filteredData = runs.filter(run => {
      const runDate = new Date(run.frontmatter.date)
      const timeDiff = now - runDate
      
      switch(selectedRange) {
        case 'week':
          return timeDiff < 7 * 86400000
        case 'month':
          return runDate.getMonth() === now.getMonth() && 
                 runDate.getFullYear() === now.getFullYear()
        case 'year':
          return runDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
    
    // 按日期分组数据
    const groupedByDate = {}
    
    filteredData.forEach(run => {
      const date = new Date(run.frontmatter.date)
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      if (!groupedByDate[formattedDate]) {
        groupedByDate[formattedDate] = []
      }
      
      groupedByDate[formattedDate].push(run)
    })
    
    // 合并每天的数据
    return Object.entries(groupedByDate).map(([date, dayRuns]) => {
      // 计算总距离
      const totalDistance = dayRuns.reduce((sum, run) => sum + run.frontmatter.distance / 1000, 0)
      
      // 计算加权平均配速
      let totalWeightedPace = 0
      let totalHeartRate = 0
      let totalHeartRateWeight = 0
      
      dayRuns.forEach(run => {
        const distance = run.frontmatter.distance / 1000
        if (run.frontmatter.avg_pace) {
          totalWeightedPace += run.frontmatter.avg_pace * distance
        }
        
        if (run.frontmatter.avg_heartrate) {
          totalHeartRate += run.frontmatter.avg_heartrate * distance
          totalHeartRateWeight += distance
        }
      })
      
      // 计算平均配速和心率
      const avgPace = totalDistance > 0 ? totalWeightedPace / totalDistance : 0
      const avgHeartRate = totalHeartRateWeight > 0 ? totalHeartRate / totalHeartRateWeight : 0
      
      // 添加跑步次数信息
      const runsCount = dayRuns.length
      
      return {
        x: date,
        y: parseFloat(totalDistance.toFixed(2)), // 保持精度一致，保留两位小数
        pace: avgPace > 0 ? `${Math.floor(avgPace)}:${Math.floor((avgPace % 1) * 60).toString().padStart(2, '0')}` : '-',
        heartrate: avgHeartRate > 0 ? Math.round(avgHeartRate) : '-',
        runsCount: runsCount
      }
    })
  }

  const filteredRuns = processData()
  
  // 根据当前选择的时间范围筛选原始数据
  const filteredOriginalRuns = runs.filter(run => {
    const runDate = new Date(run.frontmatter.date)
    const now = new Date()
    return runDate.getFullYear() === now.getFullYear()
  })

  const totalDistance = filteredOriginalRuns.reduce((sum, run) => sum + run.frontmatter.distance / 1000, 0)
  const totalDuration = filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.duration || 0), 0)

  // 处理月度日历数据 - 使用与周视图相同的处理方式
  // 首先按日期分组原始数据
  const calendarGroupedByDate = {}
  
  runs.forEach(run => {
    const date = new Date(run.frontmatter.date)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    if (!calendarGroupedByDate[formattedDate]) {
      calendarGroupedByDate[formattedDate] = []
    }
    
    calendarGroupedByDate[formattedDate].push(run)
  })
  
  // 合并每天的数据
  const calendarData = Object.entries(calendarGroupedByDate).map(([date, dayRuns]) => {
    // 计算总距离
    const totalDistance = dayRuns.reduce((sum, run) => sum + run.frontmatter.distance / 1000, 0)
    
    // 计算加权平均配速和心率
    let totalWeightedPace = 0
    let totalHeartRate = 0
    let totalHeartRateWeight = 0
    
    dayRuns.forEach(run => {
      const distance = run.frontmatter.distance / 1000
      if (run.frontmatter.avg_pace) {
        totalWeightedPace += run.frontmatter.avg_pace * distance
      }
      
      if (run.frontmatter.avg_heartrate) {
        totalHeartRate += run.frontmatter.avg_heartrate * distance
        totalHeartRateWeight += distance
      }
    })
    
    // 计算平均配速和心率
    const avgPace = totalDistance > 0 ? totalWeightedPace / totalDistance : 0
    const avgHeartRate = totalHeartRateWeight > 0 ? totalHeartRate / totalHeartRateWeight : 0
    
    // 添加跑步次数信息
    const runsCount = dayRuns.length
    
    return {
      day: date,
      value: parseFloat(totalDistance.toFixed(2)), // 保留两位小数，保持精度一致
      pace: avgPace,
      heartrate: avgHeartRate,
      runsCount: runsCount
    }
  }).sort((a, b) => new Date(a.day) - new Date(b.day));

  // 获取当前日期范围
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startDate = new Date(currentYear, currentMonth, 1) // 从当前月份开始
  const endDate = new Date(currentYear, currentMonth + 1, 0) // 到当前月底结束

  // 获取数据中的最大跑步距离
  const maxDistance = Math.max(...calendarData.filter(data => {
    const date = new Date(data.day)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).map(data => data.value))

  // 处理年度数据
  const yearlyData = runs.reduce((acc, run) => {
    const date = new Date(run.frontmatter.date)
    const currentYear = new Date().getFullYear()
    if (date.getFullYear() === currentYear) {
      const monthIdx = date.getMonth() // 0-11
      if (!acc[monthIdx]) acc[monthIdx] = 0
      acc[monthIdx] += run.frontmatter.distance / 1000
    }
    return acc
  }, {})

  // 生成完整的12个月份数据
  const monthLabels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const yearlyChartData = monthLabels.map((label, idx) => ({
    x: label,
    y: yearlyData[idx] || 0
  }))

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div className="dashboard-cards" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <Profile />
        <WeeklyChart data={filteredRuns} />
        <MonthlyHeatmap 
          startDate={startDate} 
          endDate={endDate} 
          calendarData={calendarData.filter(item => {
            const date = new Date(item.day);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })} 
          maxDistance={maxDistance} 
        />
        <YearlyChart data={yearlyChartData} runs={runs} />
      </div>

      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
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
            {Math.floor(filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.elevation || 0), 0))} 米
          </p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🏃 平均配速</h3>
          <p style={{ fontSize: '24px', color: '#fc4c02' }}>
            {filteredOriginalRuns.length > 0 ? (() => {
              const avgPace = filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.avg_pace || 0), 0) / filteredOriginalRuns.length;
              const minutes = Math.floor(avgPace);
              const seconds = Math.floor((avgPace - minutes) * 60);
              return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
            })() : "0'00\""}/KM
          </p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>详细数据</h3>
        <div style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '600px' : 'auto' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>日期</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>距离 (km)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>时长</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>配速</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>心率</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>海拔 (m)</th>
              {/* <th style={{ padding: '12px', textAlign: 'right' }}>卡路里</th>  // 删除此行 */}
            </tr>
          </thead>
          <tbody>
            {[...runs]
              .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((run) => {
                const duration = run.frontmatter.duration
                const hours = Math.floor(duration / 3600)
                const minutes = Math.floor((duration % 3600) / 60)
                const avgPaceMin = Math.floor(run.frontmatter.avg_pace)
                const avgPaceSec = Math.round((run.frontmatter.avg_pace % 1) * 60)
                return (
                  <tr key={run.frontmatter.date} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px', fontWeight: 500 }}>
                      {
                        (() => {
                          // 从文件路径中提取时间信息
                          // 例如 .../14321775190_2025-04-29T19-57-36.md
                          const match = run.fileAbsolutePath && run.fileAbsolutePath.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/)
                          if (match) {
                            const [date, time] = match[1].split('T')
                            return `${date} ${time.replace('-', ':')}`
                          }
                          // fallback：只显示日期
                          const date = new Date(run.frontmatter.date)
                          const y = date.getFullYear()
                          const m = (date.getMonth() + 1).toString().padStart(2, '0')
                          const d = date.getDate().toString().padStart(2, '0')
                          return `${y}-${m}-${d}`
                        })()
                      }
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{(run.frontmatter.distance / 1000).toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{hours}小时{minutes}分钟</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{avgPaceMin}'{avgPaceSec.toString().padStart(2, '0')}/km</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{Math.round(run.frontmatter.avg_heartrate || 0)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{Math.round(run.frontmatter.elevation || 0)}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ 
              padding: '8px 16px', 
              margin: '0 5px', 
              background: currentPage === 1 ? '#e0e0e0' : '#fc4c02', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            上一页
          </button>
          <span style={{ padding: '8px 16px' }}>第 {currentPage} 页</span>
          <button 
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * itemsPerPage >= runs.length}
            style={{ 
              padding: '8px 16px', 
              margin: '0 5px', 
              background: currentPage * itemsPerPage >= runs.length ? '#e0e0e0' : '#fc4c02', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: currentPage * itemsPerPage >= runs.length ? 'not-allowed' : 'pointer'
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </main>
  )
}

export default IndexPage

export const Head = () => <title>跑步数据看板</title>

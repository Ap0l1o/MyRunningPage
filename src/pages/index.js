import React, { useState } from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer } from 'victory'
import { graphql } from 'gatsby'
import Avatar from '../components/Avatar'
import WeeklyChart from '../components/WeeklyChart'
import MonthlyHeatmap from '../components/MonthlyHeatmap'
import YearlyChart from '../components/YearlyChart'

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
      }
    }
  }
`

const IndexPage = ({ data }) => {
  const runs = data.allMarkdownRemark.nodes
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRange, setSelectedRange] = useState('week')
  const itemsPerPage = 10

  const processData = () => {
    const now = new Date()
    return runs.filter(run => {
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
    }).map(run => ({
      x: new Date(run.frontmatter.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      y: run.frontmatter.distance / 1000,
      pace: `${Math.floor(run.frontmatter.avg_pace)}:${Math.floor((run.frontmatter.avg_pace % 1) * 60).toString().padStart(2, '0')}`,
      heartrate: Math.round(run.frontmatter.avg_heartrate || 0)
    }))
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

  // 处理月度日历数据
  const calendarData = runs.map(run => {
    // 确保日期格式为YYYY-MM-DD
    const date = new Date(run.frontmatter.date);
    const formattedDate = date.toISOString().split('T')[0]; // 转换为YYYY-MM-DD格式
    return {
      day: formattedDate,
      value: parseFloat((run.frontmatter.distance / 1000).toFixed(2))
    };
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
      const monthKey = date.toLocaleDateString('zh-CN', { month: 'short' })
      if (!acc[monthKey]) acc[monthKey] = 0
      acc[monthKey] += run.frontmatter.distance / 1000
    }
    return acc
  }, {})

  const yearlyChartData = Object.entries(yearlyData).map(([month, distance]) => ({
    x: month,
    y: distance
  }))

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'nowrap' }}>
        <div style={{ width: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Avatar />
        </div>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '20px' }}>
          <WeeklyChart data={filteredRuns} />
          <MonthlyHeatmap 
            startDate={startDate} 
            endDate={endDate} 
            calendarData={calendarData.filter(item => {
              const date = new Date(item.day);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })} 
            runs={runs} 
            maxDistance={maxDistance} 
          />
          <YearlyChart data={yearlyChartData} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
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
            {filteredOriginalRuns.length > 0 ? `${Math.floor(filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.avg_pace || 0), 0) / filteredOriginalRuns.length)}:${Math.floor((filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.avg_pace || 0), 0) % 1) * 60 / filteredOriginalRuns.length)}` : '0:00'}/公里
          </p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>❤️ 平均心率</h3>
          <p style={{ fontSize: '24px', color: '#fc4c02' }}>
            {filteredOriginalRuns.length > 0 ? Math.round(filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.avg_heartrate || 0), 0) / filteredOriginalRuns.length) : 0} 次/分钟
          </p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🔥 总消耗</h3>
          <p style={{ fontSize: '24px', color: '#fc4c02' }}>
            {filteredOriginalRuns.reduce((sum, run) => sum + (run.frontmatter.calories || 0), 0).toFixed(1)} 千卡
          </p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>详细数据</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>日期</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>距离 (km)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>时长</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>配速</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>心率</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>海拔 (m)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>卡路里</th>
            </tr>
          </thead>
          <tbody>
            {runs
              .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((run) => {
                const duration = run.frontmatter.duration
                const hours = Math.floor(duration / 3600)
                const minutes = Math.floor((duration % 3600) / 60)
                const avgPaceMin = Math.floor(run.frontmatter.avg_pace)
                const avgPaceSec = Math.floor((run.frontmatter.avg_pace % 1) * 60)
                return (
                  <tr key={run.frontmatter.date} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{new Date(run.frontmatter.date).toLocaleDateString('zh-CN')}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{(run.frontmatter.distance / 1000).toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{hours}小时{minutes}分钟</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{avgPaceMin}:{avgPaceSec.toString().padStart(2, '0')}/公里</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(run.frontmatter.avg_heartrate || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{run.frontmatter.elevation}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(run.frontmatter.calories || 0)}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              background: currentPage === 1 ? '#f0f0f0' : '#fc4c02',
              color: currentPage === 1 ? '#666' : 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            上一页
          </button>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage * itemsPerPage >= runs.length}
            style={{
              padding: '8px 16px',
              background: currentPage * itemsPerPage >= runs.length ? '#f0f0f0' : '#fc4c02',
              color: currentPage * itemsPerPage >= runs.length ? '#666' : 'white',
              border: 'none',
              borderRadius: '5px',
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

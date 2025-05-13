import React, { useState, useEffect } from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer } from 'victory'
import { graphql } from 'gatsby'
import WeeklyChart from '../components/WeeklyChart'
import MonthlyHeatmap from '../components/MonthlyHeatmap'
import YearlyChart from '../components/YearlyChart'
import Profile from '../components/Profile'
import DetailedData from '../components/DetailedData'
import StatsSummary from '../components/StatsSummary'
import '../styles/mobile.css'

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
  const [selectedRange, setSelectedRange] = useState('week')
  const [isMobile, setIsMobile] = useState(false)


  
  useEffect(() => {
    // 确保只在浏览器环境中执行
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      
      handleResize()
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  // 移动端样式已移至外部 CSS 文件 src/styles/mobile.css

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
  
  // 根据当前选择的时间范围筛选原始数据 - 这部分逻辑已移到 StatsSummary 组件中

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

      <StatsSummary runs={runs} isMobile={isMobile} />

      <DetailedData runs={runs} />
    </main>
  )
}

export default IndexPage

export const Head = () => <title>跑步数据看板</title>

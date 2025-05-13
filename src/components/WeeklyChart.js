import React from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer, VictoryTooltip } from 'victory'

const getWeekDates = () => {
  // 获取本周周一到周日的日期字符串（格式与 data.x 一致）
  const now = new Date()
  const day = now.getDay() || 7 // 周日为0，转为7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    // 格式化为 yyyy-mm-dd
    return d.toISOString().slice(0, 10)
  })
}

const WeeklyChart = ({ data }) => {
  // 生成本周完整日期
  const weekDates = getWeekDates()
  // 将原始数据映射到本周日期，缺失的补0
  const dataMap = Object.fromEntries(
    data.map(d => {
      // 尝试将 d.x 统一为 yyyy-mm-dd 格式
      let dateStr = ''
      if (typeof d.x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.x)) {
        dateStr = d.x
      } else {
        const dt = new Date(d.x)
        if (!isNaN(dt)) {
          dateStr = dt.toISOString().slice(0, 10)
        } else {
          dateStr = String(d.x).slice(0, 10)
        }
      }
      return [dateStr, d]
    })
  )
  const filledData = weekDates.map(date => {
    const d = dataMap[date]
    return d
      ? { ...d, x: date }
      : { x: date, y: 0, pace: '-', heartrate: '-' }
  })

  return (
    <div style={{ flex: '1 1 100%', minWidth: '280px', maxWidth: '100%', background: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '17px', fontWeight: '600' }}>本周跑量</h3>
      <div className="weekly-chart-container" style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', height: '250px', padding: '5px 0', width: '100%' }}>
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 20 }}
          height={250}
          width={300}
          containerComponent={<VictoryContainer responsive={true}/>}
          padding={{ top: 30, bottom: 60, left: 25, right: 25 }}
        >
          <VictoryBar
            data={filledData}
            // Apple 风格的 VictoryBar 样式配置
            cornerRadius={{ top: 8 }}
            barWidth={20}
            style={{
              data: {
                fill: ({ datum }) => datum.y > 0 ? '#fc4c02' : '#f0f0f0',
                strokeWidth: 0,
                // 添加渐变效果
                fillOpacity: 0.9,
                filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))',
              }
            }}
            labelComponent={
              <VictoryTooltip
                style={{ fontSize: 12 }}
                flyoutStyle={{ stroke: 'rgba(252, 76, 2, 0.3)', strokeWidth: 1, fill: 'white', borderRadius: 8, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
                flyoutPadding={{ top: 5, bottom: 5, left: 10, right: 10 }}
                constrainToVisibleArea
                activateData={true}
              />
            }
            labels={({ datum }) => datum.y > 0 ? `${datum.y.toFixed(1)}km${datum.runsCount > 1 ? ` (${datum.runsCount}次跑步)` : ''}
平均配速: ${datum.pace}'/km
平均心率: ${datum.heartrate}次/分钟` : '无数据'}
          />
          <VictoryAxis
            tickValues={weekDates}
            tickFormat={d => {
              // 显示为 周一、周二...周日
              const weekMap = ['一','二','三','四','五','六','日']
              const idx = weekDates.indexOf(d)
              return idx !== -1 ? `周${weekMap[idx]}` : d
            }}
            style={{
              tickLabels: { fontSize: 11, padding: 5, angle: 0, textAnchor: 'middle', fontWeight: 500, fill: '#555' },
              grid: { stroke: 'none' },
              axis: { stroke: '#f0f0f0', strokeWidth: 1 }
            }}
            tickLabelComponent={<VictoryLabel dy={0} dx={0} />}
          />
          <VictoryAxis dependentAxis
            style={{
              tickLabels: { fontSize: 11, padding: 5, fill: '#555', fontWeight: 500 },
              grid: { stroke: '#f7f7f7', strokeWidth: 1, strokeDasharray: '4, 4' },
              axis: { stroke: '#f0f0f0', strokeWidth: 1 }
            }}
          />
        </VictoryChart>
      </div>
    </div>
  )
}

export default WeeklyChart
import React from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer, VictoryTooltip } from 'victory'

const YearlyChart = ({ data, runs }) => {
  // 计算每月的平均配速和心率
  const monthlyStats = data.map(monthData => {
    const monthRuns = runs.filter(run => {
      const runDate = new Date(run.frontmatter.date);
      const monthIndex = runDate.getMonth();
      const monthName = monthData.x.replace('月', '');
      return monthIndex === parseInt(monthName) - 1;
    });
    
    if (monthRuns.length > 0) {
      // 计算平均配速
      const avgPace = monthRuns.reduce((sum, run) => sum + (run.frontmatter.avg_pace || 0), 0) / monthRuns.length;
      const paceMin = Math.floor(avgPace);
      const paceSec = Math.round((avgPace - paceMin) * 60);
      
      // 计算平均心率
      const avgHeartRate = monthRuns.reduce((sum, run) => sum + (run.frontmatter.avg_heartrate || 0), 0) / monthRuns.length;
      
      return {
        ...monthData,
        pace: `${paceMin}'${paceSec.toString().padStart(2, '0')}"`,
        heartrate: Math.round(avgHeartRate)
      };
    }
    return monthData;
  });
  return (
    <div style={{ flex: '1 1 100%', minWidth: '280px', maxWidth: '100%', background: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '17px', fontWeight: '600' }}>年度统计</h3>
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', height: '250px', padding: '5px 0' }}>
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 30 }}
          height={250}
          containerComponent={<VictoryContainer responsive={false}/>}
          padding={{ top: 30, bottom: 40, left: 30, right: 30 }}
        >
          <VictoryBar
            data={data}
            // Apple 风格的 VictoryBar 样式配置
            cornerRadius={{ top: 8 }}
            barWidth={20}
            style={{ 
              data: { 
                fill: '#fc4c02', 
                strokeWidth: 0,
                // 添加渐变和阴影效果
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
            labels={({ datum }) => {
              const stats = monthlyStats.find(m => m.x === datum.x);
              return datum.y > 0
                ? `${datum.x}: ${datum.y.toFixed(1)}km\n配速: ${stats.pace || '-'}/km\n心率: ${stats.heartrate || '-'}次/分钟`
                : `${datum.x}: 无跑步记录`;
            }}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 11, padding: 5, angle: -45, textAnchor: 'end', fontWeight: 500, fill: '#555' },
              grid: { stroke: 'none' },
              axis: { stroke: '#f0f0f0', strokeWidth: 1 }
            }}
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

export default YearlyChart
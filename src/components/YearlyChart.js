import React from 'react'
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLabel, VictoryAxis, VictoryContainer, VictoryTooltip } from 'victory'

const YearlyChart = ({ data }) => {
  return (
    <div style={{ flex: '1 1 300px', minWidth: '300px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>年度统计</h3>
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', height: '250px', padding: '5px 0' }}>
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 30 }}
          height={250}
          containerComponent={<VictoryContainer responsive={false}/>}
          padding={{ top: 30, bottom: 40, left: 40, right: 40 }}
        >
          <VictoryBar
            data={data}
            style={{ 
              data: { fill: '#fc4c02', width: 15, strokeWidth: 0 }
            }}
            labelComponent={
              <VictoryTooltip
                style={{ fontSize: 12 }}
                flyoutStyle={{ stroke: '#fc4c02', strokeWidth: 1, fill: 'white' }}
                flyoutPadding={{ top: 5, bottom: 5, left: 10, right: 10 }}
                constrainToVisibleArea
                activateData={true}
              />
            }
            labels={({ datum }) => `${datum.x}: ${datum.y.toFixed(1)}km`}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 12, padding: 5, angle: -45, textAnchor: 'end' },
              grid: { stroke: 'none' }
            }}
          />
          <VictoryAxis dependentAxis
            style={{
              tickLabels: { fontSize: 12, padding: 5 },
              grid: { stroke: 'none' }
            }}
          />
        </VictoryChart>
      </div>
    </div>
  )
}

export default YearlyChart
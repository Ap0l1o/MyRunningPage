import React, { useState } from 'react'
import '../styles/calendar-heatmap.css'

const MonthlyHeatmap = ({ startDate, endDate, calendarData, maxDistance }) => {
  // 获取当前月份的第一天是星期几（0是星期日，1是星期一，以此类推）
  const firstDayOfMonth = new Date(startDate).getDay();
  // 调整为周一为一周的第一天（0是周一，6是周日）
  const firstWeekdayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // 获取当月的总天数
  const daysInMonth = new Date(endDate).getDate();
  
  // 创建日历网格数据
  const calendarGrid = [];
  // 添加前导空白格子
  for (let i = 0; i < firstWeekdayOfMonth; i++) {
    calendarGrid.push(null);
  }
  
  // 计算每天的累积跑步距离和平均配速
  const dailyTotalDistances = {};
  const dailyAvgPace = {};
  const dailyAvgHeartRate = {};
  
  for (let day = 1; day <= daysInMonth; day++) {
    // 使用本地时间创建日期，避免时区问题
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), day);
    // 使用本地日期格式化，避免时区偏移
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayRuns = calendarData.filter(item => item.day === formattedDate);
    
    if (dayRuns.length > 0) {
      // 计算总距离
      const totalDistance = dayRuns.reduce((sum, run) => sum + run.value, 0);
      dailyTotalDistances[formattedDate] = totalDistance;
      
      // 计算加权平均配速 - 根据距离加权
      let totalWeightedPace = 0;
      let totalHeartRate = 0;
      let totalHeartRateWeight = 0;
      
      dayRuns.forEach(run => {
        if (run.pace) {
          totalWeightedPace += run.pace * run.value;
        }
        
        if (run.heartrate) {
          totalHeartRate += run.heartrate * run.value;
          totalHeartRateWeight += run.value;
        }
      });
      
      // 计算平均配速
      if (totalDistance > 0) {
        dailyAvgPace[formattedDate] = totalWeightedPace / totalDistance;
      }
      
      // 计算平均心率
      if (totalHeartRateWeight > 0) {
        dailyAvgHeartRate[formattedDate] = totalHeartRate / totalHeartRateWeight;
      }
    } else {
      dailyTotalDistances[formattedDate] = 0;
    }
  }
  
  // 获取当月所有天中最大的累积跑步距离
  const maxDailyDistance = Math.max(...Object.values(dailyTotalDistances));
  
  // 添加当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    // 使用本地时间创建日期，避免时区问题
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), day);
    // 使用本地日期格式化，避免时区偏移
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    calendarGrid.push({
      day,
      date: formattedDate,
      value: dailyTotalDistances[formattedDate] || 0,
      pace: dailyAvgPace[formattedDate] || null,
      heartrate: dailyAvgHeartRate[formattedDate] || null
    });
  }
  
  // 计算需要多少行来显示日历
  const numRows = Math.ceil((firstWeekdayOfMonth + daysInMonth) / 7);
  
  // 生成日历行
  const calendarRows = [];
  for (let row = 0; row < numRows; row++) {
    const weekDays = [];
    for (let col = 0; col < 7; col++) {
      const index = row * 7 + col;
      weekDays.push(calendarGrid[index] || null);
    }
    calendarRows.push(weekDays);
  }
  
  // 渲染日历单元格
  const [activeTooltip, setActiveTooltip] = useState(null);

  // 处理触摸事件
  const handleDayClick = (dayData, event) => {
    event.preventDefault();
    if (!dayData || !dayData.value) {
      setActiveTooltip(null);
      return;
    }
    
    // 如果点击的是当前激活的日期，则关闭提示
    if (activeTooltip && activeTooltip.day === dayData.day) {
      setActiveTooltip(null);
      return;
    }
    
    // 计算提示框的位置
    const rect = event.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      ...dayData,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };
  
  const renderDay = (dayData) => {
    if (!dayData) {
      return <div className="calendar-day empty"></div>;
    }
    
    const { day, value } = dayData;
    
    // 计算圆点大小，基于当天累积跑步距离
    const baseSize = 8; // 基础大小
    const maxSize = 16; // 最大大小
    const minSize = 6; // 最小大小
    const size = value ? Math.max(minSize, Math.min(maxSize, baseSize + (value / maxDailyDistance) * (maxSize - baseSize))) : 0;
    
    // 获取配速和心率信息
    let paceInfo = '-';
    let heartRateInfo = '-';
    if (dayData.pace) {
      paceInfo = `${Math.floor(dayData.pace)}'${Math.floor((dayData.pace % 1) * 60).toString().padStart(2, '0')}/km`;
    }
    if (dayData.heartrate) {
      heartRateInfo = `${Math.round(dayData.heartrate)}次/分钟`;
    }
    
    // 获取当天跑步次数
    const runsCount = dayData.runsCount || 1;
    
    // 确定圆点颜色类
    let colorClass = '';
    if (value) {
      const intensity = Math.min(Math.floor(value / (maxDistance / 4)), 3);
      colorClass = `color-scale-${intensity}`;
    }
    
    // 生成提示框文本
    const tooltipText = value ? `${day}日: ${value.toFixed(2)}km${runsCount > 1 ? ` (${runsCount}次跑步)` : ''}
平均配速: ${paceInfo}
平均心率: ${heartRateInfo}` : `${day}日: 无跑步记录`;
    
    return (
      <div 
        className="calendar-day" 
        title={tooltipText}
        onClick={(e) => handleDayClick(dayData, e)}
        onTouchStart={(e) => handleDayClick(dayData, e)}
      >
        <div className="day-number">{day}</div>
        {value > 0 && (
          <div 
            className={`run-dot ${colorClass}`} 
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              marginTop: '2px' // 添加上边距，确保圆点在数字下方
            }}
          ></div>
        )}
      </div>
    );
  };
  
  return (
    <div style={{ flex: '1 1 100%', minWidth: '280px', maxWidth: '100%', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>本月概览</h3>
      <div className="calendar-container" style={{ fontSize: '12px' }}>
        <div className="weekday-header">
          <div className="weekday-label">周一</div>
          <div className="weekday-label">周二</div>
          <div className="weekday-label">周三</div>
          <div className="weekday-label">周四</div>
          <div className="weekday-label">周五</div>
          <div className="weekday-label">周六</div>
          <div className="weekday-label">周日</div>
        </div>
        <div className="calendar-grid">
          {calendarRows.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={`day-${weekIndex}-${dayIndex}`} className="calendar-day-wrapper">
                  {renderDay(day)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 移动端点击提示框 */}
      {activeTooltip && (
        <div 
          style={{
            position: 'fixed',
            top: `${activeTooltip.y}px`,
            left: `${activeTooltip.x}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'white',
            border: '1px solid #fc4c02',
            borderRadius: '4px',
            padding: '8px 12px',
            zIndex: 1000,
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            maxWidth: '200px',
            whiteSpace: 'pre-line'
          }}
          onClick={() => setActiveTooltip(null)}
        >
          {activeTooltip.value ? (
            <>
              {activeTooltip.day}日: {activeTooltip.value.toFixed(2)}km
              {activeTooltip.runsCount > 1 ? ` (${activeTooltip.runsCount}次跑步)` : ''}<br/>
              平均配速: {activeTooltip.pace ? `${Math.floor(activeTooltip.pace)}'${Math.floor((activeTooltip.pace % 1) * 60).toString().padStart(2, '0')}/km` : '-'}<br/>
              平均心率: {activeTooltip.heartrate ? `${Math.round(activeTooltip.heartrate)}次/分钟` : '-'}
            </>
          ) : (
            `${activeTooltip.day}日: 无跑步记录`
          )}
        </div>
      )}
    </div>
  )
}

export default MonthlyHeatmap
import React from 'react'
import '../styles/calendar-heatmap.css'

const MonthlyHeatmap = ({ startDate, endDate, calendarData, runs, maxDistance }) => {
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
  // 添加当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), day);
    const formattedDate = date.toISOString().split('T')[0];
    const runData = calendarData.find(item => item.day === formattedDate);
    calendarGrid.push({
      day,
      date: formattedDate,
      value: runData ? runData.value : 0,
      run: runs.find(r => r.frontmatter.date === formattedDate)
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
  const renderDay = (dayData) => {
    if (!dayData) {
      return <div className="calendar-day empty"></div>;
    }
    
    const { day, value } = dayData;
    
    // 计算圆点大小，基于跑步距离
    const baseSize = 10; // 基础大小，从14减小到10
    const maxSize = 18; // 最大大小，从28减小到18
    const minSize = 8; // 最小大小，从10减小到8
    const size = value ? Math.max(minSize, Math.min(maxSize, baseSize + (value / maxDistance) * (maxSize - baseSize))) : 0;
    
    // 计算配速（如果有跑步数据）
    let paceInfo = '';
    if (dayData.run) {
      const pace = (dayData.run.frontmatter.duration / 60) / (dayData.run.frontmatter.distance / 1000);
      const paceMin = Math.floor(pace);
      const paceSec = Math.round((pace - paceMin) * 60);
      paceInfo = `配速: ${paceMin}'${paceSec.toString().padStart(2, '0')}"/km`;
    }
    
    // 确定圆点颜色类
    let colorClass = '';
    if (value) {
      const intensity = Math.min(Math.floor(value / (maxDistance / 4)), 3);
      colorClass = `color-scale-${intensity}`;
    }
    
    return (
      <div className="calendar-day" title={value ? `${day}日: ${value.toFixed(2)}km
${paceInfo}` : `${day}日: 无跑步记录`}>
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
    <div style={{ flex: '1 1 300px', minWidth: '300px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>月度概览</h3>
      <div className="calendar-container">
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
    </div>
  )
}

export default MonthlyHeatmap
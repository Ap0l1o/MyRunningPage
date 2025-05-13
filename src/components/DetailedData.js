import React, { useState, useEffect } from 'react'

const DetailedData = ({ runs }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortedRunData, setSortedRunData] = useState([])
  const itemsPerPage = 10
  const isMobile = window.innerWidth <= 768
  
  // 从文件路径中提取时间信息的辅助函数
  const getTimeFromPath = (path) => {
    if (!path) return '';
    const match = path.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  // 在组件挂载时对数据进行排序
  useEffect(() => {
    // 创建一个带有唯一ID和时间信息的数据副本
    const processedData = runs.map((run, index) => {
      // 从文件路径提取时间信息
      const timeInfo = getTimeFromPath(run.fileAbsolutePath);
      
      // 创建日期对象和格式化日期
      const date = new Date(run.frontmatter.date);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // 格式化时间显示
      let displayTime = formattedDate;
      if (timeInfo) {
        const [datePart, timePart] = timeInfo.split('T');
        displayTime = `${datePart} ${timePart.replace('-', ':')}`;
      }
      
      return {
        ...run,
        _id: index,  // 唯一标识符
        _date: date, // 日期对象
        _timeInfo: timeInfo, // 原始时间信息
        _displayTime: displayTime, // 用于显示的格式化时间
        _dateString: formattedDate // 统一格式的日期字符串
      };
    });
    
    // 按日期、时间和唯一ID排序
    const sortedData = processedData.sort((a, b) => {
      // 首先按日期降序排序
      const dateCompare = b._date - a._date;
      if (dateCompare !== 0) return dateCompare;
      
      // 如果日期相同，按时间信息排序
      if (a._timeInfo && b._timeInfo) {
        return b._timeInfo.localeCompare(a._timeInfo);
      }
      
      // 如果时间信息缺失，按距离排序
      const distanceCompare = b.frontmatter.distance - a.frontmatter.distance;
      if (distanceCompare !== 0) return distanceCompare;
      
      // 最后使用唯一ID确保排序稳定性
      return a._id - b._id;
    });
    
    setSortedRunData(sortedData);
    setCurrentPage(1); // 重置当前页码
  }, [runs]);

  return (
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
            </tr>
          </thead>
          <tbody>
            {sortedRunData
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((run) => {
                const duration = run.frontmatter.duration
                const hours = Math.floor(duration / 3600)
                const minutes = Math.floor((duration % 3600) / 60)
                const avgPaceMin = Math.floor(run.frontmatter.avg_pace)
                const avgPaceSec = Math.round((run.frontmatter.avg_pace % 1) * 60)
                
                return (
                  <tr key={run._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px', fontWeight: 500 }}>
                      {run._displayTime}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {(run.frontmatter.distance / 1000).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {hours}小时{minutes}分钟
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {avgPaceMin}'{avgPaceSec.toString().padStart(2, '0')}/km
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {Math.round(run.frontmatter.avg_heartrate || 0)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {Math.round(run.frontmatter.elevation || 0)}
                    </td>
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
        
        <span style={{ padding: '8px 16px' }}>
          第 {currentPage} 页 / 共 {Math.ceil(sortedRunData.length / itemsPerPage)} 页
        </span>
        
        <button 
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage >= Math.ceil(sortedRunData.length / itemsPerPage)}
          style={{ 
            padding: '8px 16px', 
            margin: '0 5px', 
            background: currentPage >= Math.ceil(sortedRunData.length / itemsPerPage) ? '#e0e0e0' : '#fc4c02', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: currentPage >= Math.ceil(sortedRunData.length / itemsPerPage) ? 'not-allowed' : 'pointer'
          }}
        >
          下一页
        </button>
      </div>
    </div>
  )
}

export default DetailedData

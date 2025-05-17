import React, { useState, useEffect } from 'react'
import { window } from 'browser-monads'
import { Link } from 'gatsby'

const AllRunsData = ({ runs }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortedRunData, setSortedRunData] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const itemsPerPage = 10
  
  // 检测移动设备
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 从文件路径中提取时间信息的辅助函数
  const getTimeFromPath = (path) => {
    if (!path) return '';
    const match = path.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  
  // 格式化日期时间为 YYYY-MM-DD HH:MM 格式
  const formatDateTime = (dateStr, timeInfo) => {
    const date = new Date(dateStr);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    // 如果有文件名中提取的时间信息，优先使用它
    if (timeInfo) {
      const timePart = timeInfo.split('T')[1];
      if (timePart) {
        const [h, m] = timePart.split('-');
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
      }
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 在组件挂载时对数据进行排序
  useEffect(() => {
    // 创建一个带有唯一ID和时间信息的数据副本
    const processedData = runs.map((run, index) => {
      // 从文件路径提取时间信息
      const timeInfo = getTimeFromPath(run.fileAbsolutePath);
      
      // 使用新的格式化函数处理日期时间
      const date = new Date(run.frontmatter.date);
      const displayTime = formatDateTime(run.frontmatter.date, timeInfo);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
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

  // 从文件路径中提取活动ID
  const getActivityIdFromPath = (path) => {
    if (!path) return '';
    const match = path.match(/\/([0-9]+)_/);
    return match ? match[1] : '';
  };

  return (
    <div style={{ 
      background: 'white', 
      padding: isMobile ? '15px' : '20px', 
      borderRadius: isMobile ? '8px' : '10px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
      marginTop: isMobile ? '20px' : '30px' 
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        color: '#333',
        fontSize: isMobile ? '18px' : '20px' 
      }}>所有数据</h3>
      <div style={{ 
        overflowX: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        marginBottom: '10px'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          minWidth: isMobile ? '600px' : 'auto',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left' }}>日期</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right' }}>距离 (km)</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right' }}>时长</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right' }}>配速</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right' }}>心率</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right' }}>海拔 (m)</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'center' }}>详情</th>
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
                
                // 提取活动ID用于详情页链接
                const activityId = getActivityIdFromPath(run.fileAbsolutePath);
                
                return (
                  <tr key={run._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontWeight: 500 }}>
                      {run._displayTime}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>
                      {(run.frontmatter.distance / 1000).toFixed(2)}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>
                      {hours}小时{minutes}分钟
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>
                      {avgPaceMin}'{avgPaceSec.toString().padStart(2, '0')}/km
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>
                      {Math.round(run.frontmatter.avg_heartrate || 0)}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>
                      {Math.round(run.frontmatter.elevation || 0)}
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center' }}>
                      <Link 
                        to={`/run/${activityId}`} 
                        style={{ 
                          display: 'inline-block',
                          padding: isMobile ? '4px 8px' : '5px 10px',
                          backgroundColor: '#fc4c02',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      
      <div style={{ 
        marginTop: isMobile ? '15px' : '20px', 
        display: 'flex', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {Array(Math.ceil(sortedRunData.length / itemsPerPage)).fill(null).map((_, index) => (
          <button 
            onClick={() => setCurrentPage(index + 1)}
            style={{
              margin: isMobile ? '0 3px 6px' : '0 5px',
              padding: isMobile ? '4px 8px' : '5px 10px',
              backgroundColor: currentPage === index + 1 ? '#fc4c02' : '#f0f0f0',
              color: currentPage === index + 1 ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '16px',
              minWidth: isMobile ? '30px' : '36px'
            }}
            key={index}
          >
            {index + 1}
          </button>
        ))}
        
        <span style={{ padding: '8px 16px' }}>
          第 {currentPage} 页 / 共 {Math.ceil(sortedRunData.length / itemsPerPage)} 页
        </span>
        
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage >= Math.ceil(sortedRunData.length / itemsPerPage)}
          style={{ 
            padding: isMobile ? '4px 8px' : '8px 16px', 
            margin: '0 5px', 
            background: currentPage >= Math.ceil(sortedRunData.length / itemsPerPage) ? '#e0e0e0' : '#fc4c02', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: currentPage >= Math.ceil(sortedRunData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          下一页
        </button>
      </div>
    </div>
  )
}

export default AllRunsData

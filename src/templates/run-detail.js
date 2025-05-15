import React from 'react'
import { graphql, Link } from 'gatsby'
import RunDetail from '../components/RunDetail'

// 跑步详情页面模板
const RunDetailTemplate = ({ data }) => {
  const { markdownRemark } = data
  const { frontmatter, html } = markdownRemark
  
  // 从 frontmatter 中提取分段数据、公里分割数据和流数据
  const segmentData = {
    segment_efforts: frontmatter.segments || [],
    heartrate_data: frontmatter.heartrate_data || [],
    pace_data: frontmatter.pace_data || [],
    elevation_data: frontmatter.elevation_data || []
  }
  
  // 确保将splits数据正确解析并传递给RunDetail组件
  // 如果splits是字符串，尝试解析为JSON对象
  let splitsData = [];
  try {
    if (frontmatter.splits) {
      if (typeof frontmatter.splits === 'string') {
        splitsData = JSON.parse(frontmatter.splits);
      } else {
        splitsData = frontmatter.splits;
      }
    }
  } catch (e) {
    console.error('Error parsing splits data:', e);
  }

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/" 
          style={{ 
            color: '#fc4c02', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '16px'
          }}
        >
          ← 返回首页
        </Link>
      </div>
      
      {/* 直接传递已解析的splits数据给RunDetail组件 */}
      <RunDetail 
        runData={markdownRemark} 
        segments={segmentData} 
        splits={splitsData} 
      />
      
      {/* 移除Markdown内容的显示，因为RunDetail组件已经包含了所有数据 */}
    </main>
  )
}

export const pageQuery = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
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
        splits {
          distance
          elapsed_time
          moving_time
          average_speed
          pace
          average_heartrate
          elevation_difference
          split_number
        }
        segments {
          name
          distance
          elapsed_time
          moving_time
          average_heartrate
          max_heartrate
          average_grade
          maximum_grade
          elevation_difference
        }
      }
      fileAbsolutePath
    }
  }
`

export default RunDetailTemplate
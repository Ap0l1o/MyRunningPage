import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { StaticImage } from 'gatsby-plugin-image'

const Profile = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/src/profile/profile.md$/"}}) {
        nodes {
          frontmatter {
            title
            name
            location
            occupation
            goal
            description
            pb_1500m
            pb_5km
            pb_half
            pb_full
          }
          html
        }
      }
    }
  `)

  const profileData = data.allMarkdownRemark.nodes[0] || {}
  const { frontmatter = {} } = profileData

  // 从 frontmatter 中获取个人最好成绩数据
  const personalBests = [
    { icon: '🏃', label: '1500米', value: frontmatter.pb_1500m || '5:30' },
    { icon: '🏃', label: '5公里', value: frontmatter.pb_5km || '24:30' },
    { icon: '🏃', label: '半马', value: frontmatter.pb_half || '1:45:00' },
    { icon: '🏃', label: '全马', value: frontmatter.pb_full || '4:10:30' }
  ]
  
  const personalIntro = frontmatter.goal || 'NOW OR NEVER.'

  return (
    <div style={{ flex: '1 1 100%', minWidth: '280px', maxWidth: '100%', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      {/* 头像区域 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '8px',
        flex: '0 0 auto'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #fc4c02',
          marginBottom: '5px'
        }}>
          <StaticImage
            src="../images/running.png"
            alt="头像"
            width={100}
            height={100}
            style={{
              borderRadius: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', height: '250px', padding: '2px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* 个人简介 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '8px',
          flex: '0 0 auto',
          boxSizing: 'border-box'
        }}>
          <h3 style={{
            margin: '0 0 5px 0',
            fontSize: '14px',
            color: '#fc4c02',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🏆</span> 个人简介
          </h3>
          <div style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#444',
            textAlign: 'center',
            fontWeight: '500',
            fontStyle: 'italic'
          }}>
            {personalIntro}
          </div>
        </div>
        
        {/* 个人最好成绩 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '8px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}>
          <h3 style={{
            margin: '0 0 5px 0',
            fontSize: '14px',
            color: '#fc4c02',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⏱️</span> 我的 PB
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            height: '100%',
            boxSizing: 'border-box',
            padding: '3px',
            alignItems: 'center'
          }}>
            {personalBests.map((item, index) => (
              <div 
                key={`pb-${index}`} 
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '8px 3px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  height: '100%',
                  boxSizing: 'border-box',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  marginBottom: '2px',
                  color: '#fc4c02',
                  fontWeight: 500
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#333',
                  background: 'rgba(252, 76, 2, 0.1)',
                  padding: '1px 3px',
                  borderRadius: '4px',
                  minWidth: '30px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
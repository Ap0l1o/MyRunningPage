import React from 'react'
import { StaticImage } from 'gatsby-plugin-image'

const Avatar = () => {
  return (
    <div style={{ flex: '0 1 200px', minWidth: '200px' }}>
      <StaticImage
        src="../images/running.png"
        alt="头像"
        width={100}
        height={100}
        style={{
          borderRadius: '50%',
          border: '3px solid #fc4c02'
        }}
      />
    </div>
  )
}

export default Avatar
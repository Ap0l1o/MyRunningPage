import React from 'react'

const Avatar = () => {
  return (
    <div style={{ flex: '0 1 200px', minWidth: '200px' }}>
      <img 
        src="../images/running.png" 
        alt="头像"
        style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%',
          border: '3px solid #fc4c02'
        }} 
      />
    </div>
  )
}

export default Avatar
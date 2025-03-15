import React from 'react'

const Avatar = () => {
  return (
    <div style={{ flex: '0 1 200px', minWidth: '200px' }}>
      <img 
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
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
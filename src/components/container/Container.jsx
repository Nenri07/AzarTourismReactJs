import React from 'react'

function Container({children, clasName=''}) {
  return (
    <div className={clasName}>{children}</div>
  )
}

export default Container
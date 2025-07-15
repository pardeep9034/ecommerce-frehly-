import { useState } from 'react'
import Navbar from './components/common/navbar.jsx'

import React from 'react'
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Navbar />
      </div>
    </>
  )
}

export default App 

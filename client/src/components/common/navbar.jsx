import React from 'react'
import { useState } from 'react'
import '../../styles/navbar.css' // Assuming you have a CSS file for styling

const navbar = () => {
const navoptions = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' }
]
const [active, setActive] = useState(navoptions[0].name)
  return (
    <div id='navbar' >
        <div id="logo"></div>
        
        <nav className='p-4'>
            <ul className='flex space-x-4'>
            {navoptions.map((option) => (
                <li key={option.name}>
                <a
                    href={option.path}
                    className={`text-white ${active === option.name ? 'font-bold underline' : ''}`}
                    onClick={() => setActive(option.name)}
                >
                    {option.name}
                </a>
                </li>
            ))}
            </ul>
        </nav>
      
    </div>
  )
}

export default navbar

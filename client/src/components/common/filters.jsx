import React from 'react'
import { useState } from 'react';
import {CategorySelect,PriceSelect} from '../filters/filter'
import '../../styles/filters.css'

const filters = () => {
     const [category, setCategory] = useState('');

  const handleChange = (e) => {
    setCategory(e.target.value);
  };
  return (
    <div className='filter-container'>
      <div className="filter">
        <div className="filter1">
            <CategorySelect />
                        <PriceSelect />

        </div>
        <div className="filter2">
                 <CategorySelect  />
                        <CategorySelect  />
        </div>
      </div>
    </div>
  )
}

export default filters

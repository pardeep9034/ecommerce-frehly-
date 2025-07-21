import React from 'react'
import '../../styles/popularCate.css' ; 

export const PopularCategories = () => {
    const categories = [
        {
            id: 1,
            name: 'fruits',
            image: 'https://example.com/fruits.jpg'
        },
        {
            id: 2,
            name: 'greens vegetables',
            image: 'https://example.com/greens.jpg'
        },
        {
            id: 3,
            name: 'organic vegetables',
            image: 'https://example.com/organic.jpg'
        },
        {
            id: 4,
            name: 'high nutrients vegetables',
            image: 'https://example.com/high-nutrients.jpg'
        }
        ,{
            id: 5,
            name: 'high nutrients fruits',
            image: 'https://example.com/fresh.jpg'
        }
    ]
  return (
    <div className='popular-categories-container'>
    <div className="popular-cate-header">
          <h2>Popular Categories</h2>
      <button>See All</button>
    </div>
      <div className='popular-categories'>
        {categories.map((category) => (
          <div key={category.id} className='category-card'>
            <img src={category.image} alt={category.name} />
            <h3>{category.name}</h3>


          </div>
        ))}
      </div>
    </div>
  )
}

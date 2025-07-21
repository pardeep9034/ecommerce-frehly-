import React from 'react'
import '../../styles/popularProducts.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
export const PopularProducts = () => {
    const products = [
        {
        id: 1,
        name: 'Organic Apples',
        image: 'https://example.com/apples.jpg',
        price: '$2.99/lb'
        },
        {
        id: 2,
        name: 'Fresh Spinach',
        image: 'https://example.com/spinach.jpg',
        price: '$1.99/bunch'
        },
        {
        id: 3,
        name: 'Local Carrots',
        image: 'https://example.com/carrots.jpg',
        price: '$0.99/lb'
        },
        {
        id: 4,
        name: 'Ripe Bananas',
        image: 'https://example.com/bananas.jpg',
        price: '$0.59/lb'
        },
        {        id: 5,
        name: 'Cherry Tomatoes',
        image: 'https://example.com/tomatoes.jpg',
        price: '$3.49/pint'
        }
    ];
  return (
    <div className='popular-products-container'>
      <div className="popular-products-header">
        <h2>Popular Products</h2>
        <button>See All</button>
      </div>
      <div className='popular-products'>
        {products.map((product) => (
          <div key={product.id} className='product-card'>
           <div className="product-details">
             <img src={product.image} alt={product.name} />
             <h3>{product.name}</h3>
             <p>{product.price}</p>
             <p className='product-rating'>Rating: 4.5/5</p>

           </div>
           
          </div>

        ))}
      </div>
    </div>
  )
}

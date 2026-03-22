import React from 'react'
import '../../styles/popularProducts.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
export const PopularProducts = () => {
    const products = [
    {
      id: 1,
      name: 'Organic Honeycrisp Apples',
      price: '₹2.99/lb', // Replaced $ with ₹
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 2,
      name: 'Fresh Organic Spinach',
      price: '₹1.99/bunch', // Replaced $ with ₹
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 3,
      name: 'Ripe Hass Avocados',
      price: '₹0.99/lb', // Replaced $ with ₹
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 4,
      name: 'Organic Sweet Carrots',
      price: '₹0.59/lb', // Replaced $ with ₹
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 5,
      name: 'Fresh Cherry Tomatoes',
      price: '₹3.49/pint', // Replaced $ with ₹
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
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

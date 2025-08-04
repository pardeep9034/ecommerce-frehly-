// productDetails.js
import React from 'react';

const ProductDetailCard = ({ product }) => {
  return (
    <div className="product-detail-card">
      <img src={product.image} alt={product.name} />
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>${product.price} <span style={{ textDecoration: 'line-through' }}>${product.oldPrice}</span></p>
      <p>Status: {product.status}</p>
      <p>Category: {product.category}</p>
      <p>Tags: {product.tags.join(', ')}</p>
    </div>
  );
};

export default ProductDetailCard;

import React from 'react'
import '../../styles/offerBanner.css';

export const OfferBanner = () => {
    const offer={
        title: "Special Offer",
        discount: "20% Off",
        description: "Get 20% off on your first purchase!"
    }
  return (
    <div className="offer-banner">
      <div className="offer">
        <h2>{offer.title}</h2>
        <h3>{offer.discount}</h3>
        <p>{offer.description}</p>
        <button>Shop Now</button>
      </div>
    </div>
  )
}

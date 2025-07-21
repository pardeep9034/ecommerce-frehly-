import React from "react";
import "../../styles/offerSection.css";


export const OfferSection = () => {
  const offers = [
    {
      id: 1,
      title: "best deals",
      title2: "sale of the month",
      discount: " start from 25Jul - 31Jul",
      description: "On selected organic fruits",
     
    },
    {
      id: 2,
      title: " Welcome Offer",
      title2:"50% Off",
      discount: "On your first order",
      description: "On your first order",
    },
    {
      id: 3,
      title: "Summer Sale",
      title2: "100% fresh fruit",
      discount: "15% Off",
      description: "On orders above $50",
    },
  ];
  return (
    <div className="offer-section-container">
      <div className={`offer-item1 offer-item`}>
        <h3>{offers[0].title}</h3>
        <h2>{offers[0].title2}</h2>
        <p>{offers[0].discount}</p>
        <button>Shop Now</button>
      </div>
      <div className={`offer-item2 offer-item`}>
        <h3>{offers[1].title}</h3>
        <h2>{offers[1].title2}</h2>
        <p>{offers[1].discount}</p>
          <button>Shop Now</button>
      </div>
      <div className={`offer-item3 offer-item`}>
        <h3>{offers[2].title}</h3>
        <h2>{offers[2].title2}</h2>
        <p>up to <span className="highlight">{offers[2].discount}</span></p>
        <button>Shop Now</button>
      </div>
    </div>
  );
};

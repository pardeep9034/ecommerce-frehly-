import React from "react";
import "../styles/heroSection.css"; 


const HeroSection = () => {
  return (
    <section className="hero-container">
      <div className="hero-left">
        <div className="hero-content">
          <h1>Fresh & Healthy<br />Organic Food</h1>
          <div className="hero-offer">
          <p className="discount">
            Sale up to <span>30% OFF</span>
          </p>
          <p className="shipping">Free shipping on all your order</p>
          </div>
          <button className="btn">Shop now →</button>
        </div>
        <img src="HeroImage.png" alt="Fresh Food" className="hero-img" />
      </div>

      <div className="hero-right">
        <div className="offer-card offer1">
          <div className="offer-text">
            <h4>Summer Sale</h4>
            <h2>75% OFF</h2>
            <p>Only Fruit & Vegetable</p>
            <a href="#" className="shop-now">Shop now →</a>
          </div>
          {/* <img src="sale.png" alt="Offer" /> */}
        </div>

        <div className="offer-card offer2">
          <div className="offer-text">
            <h4>Best Deal</h4>
            <h2>Special Products<br />Deal of the Month</h2>
            <a href="#" className="shop-now">Shop now →</a>
          </div>
         
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

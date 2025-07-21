import React from 'react';
import '../../styles/offerdServices.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const OfferedServices = () => {
  const services = [
    {
      iconClass: 'fas fa-truck fa-xl  ',
      title: 'Free Shipping',
      description: 'Free delivery on orders above ₹500'
    },
    {
      iconClass: 'fas fa-money-bill-wave fa-xl',
      title: 'Money Back Guarantee',
      description: '100% refund within 7 days'
    },
    {
      iconClass: 'fas fa-headset fa-xl',
      title: '24/7 Customer Support',
      description: 'Always here to help you'
    },
    {
      iconClass: 'fas fa-gift fa-xl',
      title: 'Exclusive Offers',
      description: 'Special deals for members'
    },
  ];

  return (
    <section className="services-section">
      <div className="">
        <div className="services-container">
          {services.map((service, index) => (
            <div className="service-card" key={index}>
              <div className="service-icon">
                <i className={service.iconClass} style={{color:'green',}} ></i>
              </div>
              <div className="service-content">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferedServices;
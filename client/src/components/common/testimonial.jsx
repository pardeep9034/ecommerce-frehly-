import React from 'react'
import '../../styles/testimonial.css';

export const Testimonial = () => {
    // Sample testimonials data
    const testimonials = [
        {
            id: 1,
            name: "John Doe",
            feedback: "Great service and fresh products!",
            rating: 5
        },
        {
            id: 2,
            name: "Jane Smith",
            feedback: "Loved the variety of organic fruits available.",
            rating: 4
        },
        {
            id: 3,
            name: "Alice Johnson",
            feedback: "Fast delivery and excellent customer support.",
            rating: 5
        }
    ];
  return (
    <div className="testimonial-container">
        <h2>What Our Customers Say</h2>
        <div className="testimonial-list">
            {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-item">
                    <h3>{testimonial.name}</h3>
                    <p>{testimonial.feedback}</p>
                    <p>Rating: {testimonial.rating} stars</p>
                </div>
            ))}
        </div>
    </div>
  )
}

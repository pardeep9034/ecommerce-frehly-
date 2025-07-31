import React from 'react'
import '../../styles/hotDeals.css';

export const HotDeals = () => {
    const deals = [
        {
            id: 1,
            name:"apple",
            price:"$2.99/lb",
            imageUrl: "path/to/apple-image.jpg"
        }
        ,
        {
            id: 2,
            name:"banana",
            price:"$1.99/lb",
            imageUrl: "path/to/banana-image.jpg"
        },
        {
            id: 3,
            name:"orange",
            price:"$3.49/lb",
            imageUrl: "path/to/orange-image.jpg"
        }
        ,
        {
            id: 4,
            name:"grapes",
            price:"$4.99/lb",
            imageUrl: "path/to/grapes-image.jpg"
        }
        ,
        {
            id: 5,
            name:"mango",
            price:"$5.99/lb",
            imageUrl: "path/to/mango-image.jpg"
        },
        {
            id: 6,
            name:"kiwi",
            price:"$6.99/lb",
            imageUrl: "path/to/kiwi-image.jpg"
        },
        {
            id: 7,
            name:"pineapple",
            price:"$7.99/lb",
            imageUrl: "path/to/pineapple-image.jpg"
        }
    ]
  return (
   <div className="hot-deals-container">
        <div className="hot-deals-header">
            <h2>Hot Deals</h2>
            <button>See All</button>
        </div>
        <div className="hot-deals">
            {deals.map((deal) => (
                <div key={deal.id} className="deal-card">
                    <img src={deal.imageUrl} alt={deal.name} />
                    <h3>{deal.name}</h3>
                    <p>{deal.price}</p>
                </div>
            ))}
        </div>
   </div>
   
  )
}

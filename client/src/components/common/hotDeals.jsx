import React from 'react'
import '../../styles/hotDeals.css';
import ProductDetailCard from './productDetails ';

export const HotDeals = () => {
    const deals = [
        {
            id: 1,
           name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        }
        ,
        {
            id: 2,
            name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        },
        {
            id: 3,
           name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        }
        ,
        {
            id: 4,
            name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        }
        ,
        {
            id: 5,
            name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        },
        {
            id: 6,
           name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        },
        {
            id: 7,
           name: "Chinese Cabbage",
    rating: 4,
    price: 17.28,
    oldPrice: 24.00,
    status: "In Stock",
    image: "/sale.png", // Replace with your image path
    description:
      "Chinese cabbage (Napa cabbage) is a leafy vegetable used in many Asian cuisines. It's rich in vitamins, low-calorie, and perfect for healthy diets.",
    category: "Vegetables",
    tags: ["Vegetables", "Healthy", "Chinese", "Cabbage", "Green Cabbage"],
        }
    ]
const [selectedProduct, setSelectedProduct] = React.useState(null);
    const handleSelectProduct = (product) => {
        // Logic to handle product selection
        console.log("Selected Product:", product);
    }
  return (
   <div className="hot-deals-container">
        <div className="hot-deals-header">
            <h2>Hot Deals</h2>
            <button>See All</button>
        </div>
        <div className="hot-deals">
            {deals.map((deal) => (
                <div key={deal.id} className="deal-card" onClick={() => handleSelectProduct(deal)}>
                    
                  <div className="image">  <img src={deal.image} alt={deal.name} /></div>
                    <h3>{deal.name}</h3>
                    <p>{deal.price}</p>
                    <p>review {deal.rating}</p>
                </div>
            ))}
        </div>
       {selectedProduct && (
        <ProductDetailCard product={selectedProduct} />
       )}
   </div>
   
  )
}

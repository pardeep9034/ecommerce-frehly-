import React from 'react'
import '../../styles/footer.css';

export const Footer = () => {
    const footerLinks = [
        {
            title: "About Us",
            url: "/about"
        },
        {
            title: "Contact",
            url: "/contact"
        },
        {
            title: "Privacy Policy",
            url: "/privacy"
        }
    ]
  return (
    <div className="footer-container">
        <div className="footer-links">
            {footerLinks.map((link, index) => (
                <a key={index} href={link.url}>{link.title}</a>
            ))}
        </div>
        <div className="footer-info">
            <p>&copy; 2023 Ecommerce Frehly. All rights reserved.</p>
        </div>

    </div>
  )
}

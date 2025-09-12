import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const COLORS = [
  '#22C6D4', // teal
  '#B1D007', // lime
  '#FFB347', // orange
  '#FF6F61', // coral
  '#8F6ED5', // purple
  '#F67280', // pink
  '#4ECDC4', // turquoise
  '#5567FF', // blue
];

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/documentation/products.json')
      .then(res => res.json())
      .then(setProducts);
  }, []);
  return (
    <div className="landing-container">
      <header className="main-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src="/vite.svg" alt="ZenV Innovations Logo" className="logo" />
            <span className="logo-text">ZenV Innovations</span>
          </Link>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <h1 className="main-title">Documentation</h1>
          <div className="products-list">
            {products.map((product, idx) => (
              <Link
                to={`/docs/${product.id}/overview.md`}
                className="product-item"
                key={product.id}
                style={{ borderLeft: `6px solid ${COLORS[idx % COLORS.length]}` }}
              >
                <h2 className="product-name">{product.name}</h2>
                <p className="product-description">{product.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} ZenV Innovations. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
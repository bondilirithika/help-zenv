import React from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/ProductData';
import './LandingPage.css';

const LandingPage = () => {
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
            {products.map(product => (
              <Link to={`/docs/${product.id}/overview`} className="product-item" key={product.id} style={{ borderLeft: `3px solid ${product.color}` }}>
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
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import DocumentationPage from './components/DocumentationPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs/:productId/*" element={<DocumentationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

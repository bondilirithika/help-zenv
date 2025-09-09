// components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

function Sidebar({ currentView, setCurrentView }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/vite.svg" alt="RFID System Logo" className="logo" />
        <h2>RFID System</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li 
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentView('dashboard')}
          >
            <i className="icon">📊</i> Dashboard
          </li>
          <li 
            className={currentView === 'users' ? 'active' : ''}
            onClick={() => setCurrentView('users')}
          >
            <i className="icon">👥</i> User Management
          </li>
          <li 
            className={currentView === 'cards' ? 'active' : ''}
            onClick={() => setCurrentView('cards')}
          >
            <i className="icon">💳</i> Card Management
          </li>
          <li 
            className={currentView === 'logs' ? 'active' : ''}
            onClick={() => setCurrentView('logs')}
          >
            <i className="icon">📝</i> Access Logs
          </li>
          <li 
            className={currentView === 'config' ? 'active' : ''}
            onClick={() => setCurrentView('config')}
          >
            <i className="icon">⚙️</i> System Configuration
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>v1.0.0</p>
        <p>© 2025 Zenvinnovations</p>
      </div>
    </div>
  );
}

export default Sidebar;
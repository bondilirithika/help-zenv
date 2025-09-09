// components/Dashboard.jsx
import React from 'react';
import './Dashboard.css';

function Dashboard() {
  // Mock data for demonstration
  const stats = {
    totalUsers: 145,
    activeCards: 132,
    accessToday: 78,
    pendingRequests: 3
  };

  const recentActivity = [
    { id: 1, user: "John Doe", cardId: "A2F45C", area: "Main Entrance", timestamp: "2025-09-08 15:42:18", status: "Granted" },
    { id: 2, user: "Jane Smith", cardId: "B7D32E", area: "Server Room", timestamp: "2025-09-08 15:30:05", status: "Denied" },
    { id: 3, user: "Bob Johnson", cardId: "C9E76F", area: "Office Area", timestamp: "2025-09-08 15:15:22", status: "Granted" },
    { id: 4, user: "Alice Brown", cardId: "D1H98G", area: "Main Entrance", timestamp: "2025-09-08 14:58:41", status: "Granted" },
    { id: 5, user: "Charlie Wilson", cardId: "E3K27L", area: "Conference Room", timestamp: "2025-09-08 14:45:12", status: "Granted" }
  ];

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon users-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon cards-icon">💳</div>
          <div className="stat-info">
            <h3>Active Cards</h3>
            <p className="stat-value">{stats.activeCards}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon access-icon">🚪</div>
          <div className="stat-info">
            <h3>Access Today</h3>
            <p className="stat-value">{stats.accessToday}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending Requests</h3>
            <p className="stat-value">{stats.pendingRequests}</p>
          </div>
        </div>
      </div>
      
      <div className="card recent-activity">
        <h3>Recent Activity</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Card ID</th>
              <th>Area</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map(activity => (
              <tr key={activity.id}>
                <td>{activity.user}</td>
                <td>{activity.cardId}</td>
                <td>{activity.area}</td>
                <td>{activity.timestamp}</td>
                <td>
                  <span className={`status-badge ${activity.status === "Granted" ? "status-active" : "status-inactive"}`}>
                    {activity.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="dashboard-actions">
        <button className="btn btn-primary">View All Logs</button>
        <button className="btn btn-success">Register New Card</button>
        <button className="btn btn-warning">System Status</button>
      </div>
    </div>
  );
}

export default Dashboard;
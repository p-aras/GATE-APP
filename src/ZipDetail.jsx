import React from 'react';
import { useNavigate } from 'react-router-dom';

const ZipDetail = () => {
  const navigate = useNavigate();

  return (
    <div className="detail-container">
      <button className="detail-back-btn" onClick={() => navigate('/')}>
        <span className="back-icon">←</span> Back to Dashboard
      </button>
      
      <div className="detail-hero" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
        <div className="detail-hero-content">
          <div className="detail-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <span className="detail-icon" style={{ color: '#6366f1' }}>📍</span>
          </div>
          <h1 className="detail-title">Zip Code Management</h1>
          <p className="detail-description">Comprehensive zip code management system with real-time tracking</p>
        </div>
        <div className="detail-hero-bg"></div>
      </div>

      <div className="detail-body">
        <div className="metrics-section">
          <h3 className="detail-section-title">Key Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <span className="metric-value">24</span>
              <span className="metric-label">Active Zones</span>
              <span className="metric-change positive">+12%</span>
            </div>
            <div className="metric-card" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <span className="metric-value">15,000 km²</span>
              <span className="metric-label">Coverage Area</span>
              <span className="metric-change positive">+5%</span>
            </div>
            <div className="metric-card" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <span className="metric-value">3,245</span>
              <span className="metric-label">Delivery Points</span>
              <span className="metric-change positive">+8%</span>
            </div>
            <div className="metric-card" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <span className="metric-value">98.5%</span>
              <span className="metric-label">Success Rate</span>
              <span className="metric-change positive">+2%</span>
            </div>
          </div>
        </div>

        <div className="activities-section">
          <h3 className="detail-section-title">Recent Activities</h3>
          <div className="detail-activities-list">
            <div className="detail-activity-item">
              <div className="activity-indicator" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}></div>
              <span className="detail-activity-text">New zip code 90210 added</span>
              <span className="detail-activity-time">Just now</span>
            </div>
            <div className="detail-activity-item">
              <div className="activity-indicator" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}></div>
              <span className="detail-activity-text">Zone optimization completed</span>
              <span className="detail-activity-time">2 min ago</span>
            </div>
            <div className="detail-activity-item">
              <div className="activity-indicator" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}></div>
              <span className="detail-activity-text">3 delivery routes updated</span>
              <span className="detail-activity-time">5 min ago</span>
            </div>
          </div>
        </div>

        <div className="action-section">
          <button className="action-primary" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            Take Action →
          </button>
          <button className="action-secondary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #0f172a;
          min-height: 100vh;
        }

        .detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 32px;
        }

        .detail-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 20px;
          border-radius: 40px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 32px;
          transition: all 0.2s ease;
        }

        .detail-back-btn:hover {
          background: rgba(30, 41, 59, 0.9);
          transform: translateX(-4px);
        }

        .detail-hero {
 border-radius: 40px;
          padding: 48px;
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
        }

        .detail-hero-content {
          position: relative;
          z-index: 2;
        }

        .detail-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .detail-icon {
          font-size: 44px;
        }

        .detail-title {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .detail-description {
          font-size: 16px;
          color: #94a3b8;
          max-width: 500px;
          line-height: 1.5;
        }

        .detail-hero-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent);
          border-radius: 50%;
          pointer-events: none;
        }

        .detail-body {
          background: rgba(30, 41, 59, 0.4);
          border-radius: 32px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .detail-section-title {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin-bottom: 24px;
        }

        .metrics-section {
          margin-bottom: 40px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .metric-card {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
        }

        .metric-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .metric-label {
          display: block;
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .metric-change {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .metric-change.positive {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .metric-change.negative {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .activities-section {
          margin-bottom: 40px;
        }

        .detail-activities-list {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 24px;
          overflow: hidden;
        }

        .detail-activity-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .detail-activity-item:last-child {
          border-bottom: none;
        }

        .activity-indicator {
          width: 3px;
          height: 24px;
          border-radius: 4px;
        }

        .detail-activity-text {
          flex: 1;
          font-size: 14px;
          color: #e2e8f0;
          margin-left: 16px;
        }

        .detail-activity-time {
          font-size: 12px;
          color: #475569;
        }

        .action-section {
          display: flex;
          gap: 16px;
        }

        .action-primary {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 60px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .action-secondary {
          flex: 1;
          padding: 14px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 60px;
          font-size: 15px;
          font-weight: 500;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-secondary:hover {
          background: rgba(30, 41, 59, 0.9);
          color: white;
        }

        @media (max-width: 1100px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .detail-container {
            padding: 16px;
          }
          
          .detail-body {
            padding: 24px;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .action-section {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ZipDetail;
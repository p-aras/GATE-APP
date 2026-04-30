import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoriDetail = () => {
  const navigate = useNavigate();

  return (
    <>
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
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
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
          background: rgba(255, 255, 255, 0.1);
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
          color: rgba(255, 255, 255, 0.8);
          max-width: 500px;
          line-height: 1.5;
        }

        .detail-hero-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent);
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
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
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
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
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
          
          .detail-hero {
            padding: 32px 24px;
          }
          
          .detail-title {
            font-size: 28px;
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

      <div className="detail-container">
        <button className="detail-back-btn" onClick={() => navigate('/')}>
          <span className="back-icon">←</span> Back to Dashboard
        </button>
        
        <div className="detail-hero">
          <div className="detail-hero-content">
            <div className="detail-icon-wrapper">
              <span className="detail-icon">🚚</span>
            </div>
            <h1 className="detail-title">Delivery Tracking</h1>
            <p className="detail-description">Real-time delivery tracking and route optimization system</p>
          </div>
          <div className="detail-hero-bg"></div>
        </div>

        <div className="detail-body">
          <div className="metrics-section">
            <h3 className="detail-section-title">Key Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-value">12</span>
                <span className="metric-label">Active Deliveries</span>
                <span className="metric-change positive">+3</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">94.2%</span>
                <span className="metric-label">On-Time Rate</span>
                <span className="metric-change positive">+5%</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">847 km</span>
                <span className="metric-label">Total Distance</span>
                <span className="metric-change negative">-2%</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">32 min</span>
                <span className="metric-label">Avg Delivery Time</span>
                <span className="metric-change negative">-8%</span>
              </div>
            </div>
          </div>

          <div className="activities-section">
            <h3 className="detail-section-title">Recent Activities</h3>
            <div className="detail-activities-list">
              <div className="detail-activity-item">
                <div className="activity-indicator"></div>
                <span className="detail-activity-text">Route optimization completed</span>
                <span className="detail-activity-time">Just now</span>
              </div>
              <div className="detail-activity-item">
                <div className="activity-indicator"></div>
                <span className="detail-activity-text">New delivery assigned to Zone A</span>
                <span className="detail-activity-time">3 min ago</span>
              </div>
              <div className="detail-activity-item">
                <div className="activity-indicator"></div>
                <span className="detail-activity-text">Driver performance updated</span>
                <span className="detail-activity-time">8 min ago</span>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button className="action-primary">Track Deliveries →</button>
            <button className="action-secondary" onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoriDetail;
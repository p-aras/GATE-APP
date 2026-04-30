import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ZipEntrance.css';

const ZipEntrance = () => {
  const navigate = useNavigate();

  const handleZipGateIn = () => {
    navigate('/zip-gate-in');
  };

  const handleZipReceivedBy = () => {
    navigate('/zip-received-by');
  };

  const handleBack = () => {
   navigate('/');
  };

  return (
    <div className="zip-entrance-container">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      {/* Paper-style Header with theoretical info */}
      <div className="paper-header">
        <div className="header-content">
          <div className="header-badge">ZIP Management System</div>
          <h1 className="header-title">Zone Inventory Process Entrance</h1>
          <div className="header-theory">
            <div className="theory-text">
              <p>The Zone Inventory Process (ZIP) is a streamlined workflow for managing 
              material gate entry and zone-specific receipt tracking. It ensures proper documentation 
              of incoming materials, quality verification, and real-time inventory reconciliation 
              across designated warehouse zones.</p>
            </div>
            {/* <div className="theory-stats">
              <div className="stat">
                <span className="stat-number">30+ zones</span>
                <span className="stat-label">inventory zones managed</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.5%</span>
                <span className="stat-label">inventory accuracy</span>
              </div>
            </div> */}
          </div>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-line"></div>
        </div>
      </div>

      {/* Action Cards - Two options */}
      <div className="cards-container two-cards">
        {/* ZIP Gate In Card */}
        <div className="card" onClick={handleZipGateIn}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" fill="none"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeLinecap="round"/>
              <path d="M6 20h12" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="8" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
              <path d="M4 8h2M18 8h2" stroke="currentColor" strokeLinecap="round"/>
              <path d="M3 3l2 2M21 3l-2 2M3 21l2-2M21 21l-2-2" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            </svg>
          </div>
          <div className="card-number">01</div>
          <h2>ZIP Gate In</h2>
          <div className="divider"></div>
          <p>Register vehicle entry, record gate timing, capture vehicle details, and assign incoming materials to specific warehouse zones.</p>
          <div className="card-theory">
            <span className="theory-tag">🚛 Gate Entry</span>
            <span className="theory-tag">✓ Zone Assignment</span>
            <span className="theory-tag">📋 Vehicle Registration</span>
          </div>
          <div className="card-arrow">→</div>
        </div>

        {/* ZIP Received By Card */}
        <div className="card" onClick={handleZipReceivedBy}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7L12 12 4 7 12 2 20 7z" stroke="currentColor" fill="none"/>
              <path d="M4 12l8 5 8-5M4 17l8 5 8-5" stroke="currentColor" fill="none"/>
              <path d="M12 12v10" stroke="currentColor"/>
              <path d="M8 9l-2 1M16 9l2 1" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
              <path d="M7 16l2-2M17 16l-2-2" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-number">02</div>
          <h2>ZIP Received By</h2>
          <div className="divider"></div>
          <p>Record material receipt, assign receiving personnel, capture quantities, perform quality inspection, and update zone inventory levels.</p>
          <div className="card-theory">
            <span className="theory-tag">📦 Material Receiving</span>
            <span className="theory-tag">👤 Personnel Assignment</span>
            <span className="theory-tag">🔍 Quality Check</span>
          </div>
          <div className="card-arrow">→</div>
        </div>
      </div>

      {/* Footer Theory Section */}
      <div className="footer-theory">
        <div className="footer-theory-content">
          <div className="theory-block">
            <h4>🏭 Zone Inventory Process (ZIP)</h4>
            <p>Streamlines inbound material flow from gate entry to zone-specific storage, ensuring real-time inventory tracking and zone allocation efficiency.</p>
          </div>
          <div className="theory-block">
            <h4>📊 Gate In Process</h4>
            <p>Comprehensive gate entry documentation including vehicle logs, material manifests, and zone assignment for seamless warehouse operations.</p>
          </div>
          <div className="theory-block">
            <h4>✅ Receiving & Verification</h4>
            <p>Dedicated receiving personnel verify quantities, inspect material condition, and update zone inventory records for accurate stock management.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZipEntrance;
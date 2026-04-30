import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DoriEntrance.css';

const DoriEntrance = () => {
  const navigate = useNavigate();

  const handleDoriGateIn = () => {
    navigate('/dori-gate-in');
  };

  const handleDoriReceivedBy = () => {
    navigate('/dori-received-by');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="dori-entrance-container">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      {/* Paper-style Header with theoretical info */}
      <div className="paper-header">
        <div className="header-content">
          <div className="header-badge">DORI Management System</div>
          <h1 className="header-title">Dori/Cord Material Process Entrance</h1>
          <div className="header-theory">
            <div className="theory-text">
              <p>The Dori/Cord Process manages incoming cord, drawstring, and elastic materials 
              from gate entry to zone-specific storage. It ensures proper documentation of material 
              quantities, quality verification, and real-time inventory tracking across designated 
              production zones.</p>
            </div>
          </div>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-line"></div>
        </div>
      </div>

      {/* Action Cards - Two options */}
      <div className="cards-container two-cards">
        {/* DORI Gate In Card */}
        <div className="card" onClick={handleDoriGateIn}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" fill="none"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeLinecap="round"/>
              <path d="M6 20h12" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="8" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
              <path d="M4 8h2M18 8h2" stroke="currentColor" strokeLinecap="round"/>
              <path d="M3 3l2 2M21 3l-2 2M3 21l2-2M21 21l-2-2" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
              <path d="M7 7l2 2M17 7l-2 2" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-number">01</div>
          <h2>DORI Gate In</h2>
          <div className="divider"></div>
          <p>Register vehicle entry for dori/cord materials, record gate timing, capture delivery details, and assign materials to specific production zones.</p>
          <div className="card-theory">
            <span className="theory-tag">🚛 Gate Entry</span>
            <span className="theory-tag">✓ Zone Assignment</span>
            <span className="theory-tag">📦 Dori/Cord Receiving</span>
          </div>
          <div className="card-arrow">→</div>
        </div>

        {/* DORI Received By Card */}
        <div className="card" onClick={handleDoriReceivedBy}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7L12 12 4 7 12 2 20 7z" stroke="currentColor" fill="none"/>
              <path d="M4 12l8 5 8-5M4 17l8 5 8-5" stroke="currentColor" fill="none"/>
              <path d="M12 12v10" stroke="currentColor"/>
              <path d="M8 9l-2 1M16 9l2 1" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
              <path d="M7 16l2-2M17 16l-2-2" stroke="currentColor" strokeLinecap="round"/>
              <path d="M10 4h4M12 2v2" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-number">02</div>
          <h2>DORI Received By</h2>
          <div className="divider"></div>
          <p>Record dori/cord material receipt, assign receiving personnel, capture quantities, perform quality inspection, and update inventory levels.</p>
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
            <h4>🧵 Dori/Cord Material Process</h4>
            <p>Streamlines inbound dori, drawstring, and elastic material flow from gate entry to zone-specific storage for production use.</p>
          </div>
          <div className="theory-block">
            <h4>📊 Gate In Process</h4>
            <p>Comprehensive gate entry documentation including delivery notes, material manifests, and quality inspection scheduling.</p>
          </div>
          <div className="theory-block">
            <h4>✅ Receiving & Verification</h4>
            <p>Dedicated receiving personnel verify quantities, inspect material quality, and update inventory records for accurate stock management.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoriEntrance;
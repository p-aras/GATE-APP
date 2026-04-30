import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PoEntrance.css';

const PoEntrance = () => {
  const navigate = useNavigate();

  const handleGateInEntry = () => {
    navigate('/gate-in-entry');
  };

  const handleMaterialReceivedEntry = () => {
    navigate('/material-received-entry');
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="po-entrance-container">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      {/* Paper-style Header with theoretical info */}
      <div className="paper-header">
        <div className="header-content">
          <div className="header-badge">PO Management System</div>
          <h1 className="header-title">Purchase Order Entrance</h1>
          <div className="header-theory">
            <div className="theory-text">
              <p>The Purchase Order (PO) process is a critical component of supply chain management, 
              serving as a legally binding document between a buyer and a supplier. It establishes 
              the terms, conditions, and specifications for goods or services to be purchased.</p>
            </div>
            <div className="theory-stats">
              <div className="stat">
                <span className="stat-number">~85%</span>
                <span className="stat-label">of B2B transactions use POs</span>
              </div>
              <div className="stat">
                <span className="stat-number">3-5 days</span>
                <span className="stat-label">average PO processing time</span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-line"></div>
        </div>
      </div>

      {/* Information Cards - commented out as per your code
      <div className="info-cards">
        <div className="info-card">
          <div className="info-icon">📋</div>
          <div className="info-content">
            <h3>What is a PO?</h3>
            <p>A Purchase Order is an official commercial document issued by a buyer to a seller, 
            indicating types, quantities, and agreed prices for products or services.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">⚡</div>
          <div className="info-content">
            <h3>PO Workflow</h3>
            <p>Creation → Approval → Issuance → Receipt → Matching → Payment → Closure</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">✓</div>
          <div className="info-content">
            <h3>Key Benefits</h3>
            <p>✓ Budget Control &nbsp; ✓ Legal Protection &nbsp; ✓ Inventory Tracking &nbsp; ✓ Audit Trail</p>
          </div>
        </div>
      </div> */}

      {/* Action Cards */}
      <div className="cards-container">
        {/* Gate In Entry Card */}
        <div className="card" onClick={handleGateInEntry}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" fill="none"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeLinecap="round"/>
              <path d="M16 2v2M8 2v2M4 8h2M18 8h2" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="card-number">01</div>
          <h2>Gate In Entry</h2>
          <div className="divider"></div>
          <p>Register vehicle entry, capture loading/unloading details, and record gate timing for incoming materials.</p>
          <div className="card-theory">
            <span className="theory-tag">📦 Receiving</span>
            <span className="theory-tag">🚛 Logistics</span>
          </div>
          <div className="card-arrow">→</div>
        </div>

        {/* Material Received Entry Card */}
        <div className="card" onClick={handleMaterialReceivedEntry}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7L12 12 4 7 12 2 20 7z" stroke="currentColor" fill="none"/>
              <path d="M4 12l8 5 8-5M4 17l8 5 8-5" stroke="currentColor" fill="none"/>
              <path d="M12 12v10" stroke="currentColor"/>
            </svg>
          </div>
          <div className="card-number">02</div>
          <h2>Material Received Entry</h2>
          <div className="divider"></div>
          <p>Record material quantities, inspect quality, match with PO, and update inventory status in real-time.</p>
          <div className="card-theory">
            <span className="theory-tag">📊 Inventory</span>
            <span className="theory-tag">✓ Quality Check</span>
          </div>
          <div className="card-arrow">→</div>
        </div>
      </div>

      {/* Footer Theory Section */}
      <div className="footer-theory">
        <div className="footer-theory-content">
          <div className="theory-block">
            <h4>📌 Three-Way Matching</h4>
            <p>The foundation of PO accuracy: matching Purchase Order → Goods Receipt Note → Supplier Invoice before payment processing.</p>
          </div>
          <div className="theory-block">
            <h4>⏱️ PO Lifecycle</h4>
            <p>From requisition to closure, average PO takes 5-7 days. Digital systems reduce this by 60% while improving accuracy.</p>
          </div>
          <div className="theory-block">
            <h4>📊 Compliance</h4>
            <p>POs provide audit trails for SOX compliance and help prevent maverick spending through controlled procurement.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoEntrance;
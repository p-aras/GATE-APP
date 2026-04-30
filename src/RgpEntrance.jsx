import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RgpEntrance.css';

const RgpEntrance = () => {
  const navigate = useNavigate();

  const handleRgpOut = () => {
    navigate('/rgp-out');
  };

  const handleRgpGateIn = () => {
    navigate('/rgp-gate-in');
  };

  const handleRgpMaterialIn = () => {
    navigate('/rgp-material-in');
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="rgp-entrance-container">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      {/* Paper-style Header with theoretical info */}
      <div className="paper-header">
        <div className="header-content">
          <div className="header-badge">RGP Management System</div>
          <h1 className="header-title">Return Goods Process Entrance</h1>
          <div className="header-theory">
            <div className="theory-text">
              <p>The Return Goods Process (RGP) is a critical reverse logistics workflow managing 
              supplier returns, credit notes, and material reconciliation. It ensures proper documentation 
              of returned goods, quality checks, and financial adjustments between buyer and supplier.</p>
            </div>
            <div className="theory-stats">
              <div className="stat">
                <span className="stat-number">~8-10%</span>
                <span className="stat-label">of B2B orders involve returns</span>
              </div>
              <div className="stat">
                <span className="stat-number">2-4 days</span>
                <span className="stat-label">average RGP processing time</span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-line"></div>
        </div>
      </div>

      {/* Action Cards - Three options */}
      <div className="cards-container">
        {/* RGP Out Card */}
        <div className="card" onClick={handleRgpOut}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v12M8 11l4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" stroke="currentColor" strokeLinecap="round"/>
              <rect x="3" y="5" width="18" height="10" rx="1" stroke="currentColor" fill="none"/>
              <circle cx="7.5" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="16.5" cy="10" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="card-number">01</div>
          <h2>RGP Out</h2>
          <div className="divider"></div>
          <p>Initiate return process, record return quantities, capture reason codes, and generate credit/debit notes for supplier reconciliation.</p>
          <div className="card-theory">
            <span className="theory-tag">📤 Returns</span>
            <span className="theory-tag">💰 Credit Notes</span>
          </div>
          <div className="card-arrow">→</div>
        </div>

        {/* RGP Gate In Card */}
        <div className="card" onClick={handleRgpGateIn}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" fill="none"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeLinecap="round"/>
              <path d="M6 20h12" stroke="currentColor" strokeLinecap="round"/>
              <circle cx="8" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
              <path d="M4 8h2M18 8h2" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-number">02</div>
          <h2>RGP Gate In</h2>
          <div className="divider"></div>
          <p>Register returned vehicle entry, record gate timing, capture RGP reference numbers, and validate return authorization.</p>
          <div className="card-theory">
            <span className="theory-tag">🚛 Gate Entry</span>
            <span className="theory-tag">✓ Authorization</span>
          </div>
          <div className="card-arrow">→</div>
        </div>

        {/* RGP Material In Card */}
        <div className="card" onClick={handleRgpMaterialIn}>
          <div className="card-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7L12 12 4 7 12 2 20 7z" stroke="currentColor" fill="none"/>
              <path d="M4 12l8 5 8-5M4 17l8 5 8-5" stroke="currentColor" fill="none"/>
              <path d="M12 12v10" stroke="currentColor"/>
              <path d="M8 9l-2 1M16 9l2 1" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-number">03</div>
          <h2>RGP Material In</h2>
          <div className="divider"></div>
          <p>Receive returned materials, inspect quality/condition, verify against RGP, and update reverse inventory status.</p>
          <div className="card-theory">
            <span className="theory-tag">📦 Receiving</span>
            <span className="theory-tag">🔍 Quality Inspection</span>
          </div>
          <div className="card-arrow">→</div>
        </div>
      </div>

      {/* Footer Theory Section */}
      <div className="footer-theory">
        <div className="footer-theory-content">
          <div className="theory-block">
            <h4>🔄 Reverse Logistics</h4>
            <p>RGP streamlines the return process from customer to supplier, including inspection, restocking, repair, or disposal of returned goods.</p>
          </div>
          <div className="theory-block">
            <h4>📋 Return Reasons</h4>
            <p>Common RGP triggers: Defective products, incorrect shipments, over-supply, damage during transit, or quality non-conformance.</p>
          </div>
          <div className="theory-block">
            <h4>💰 Financial Impact</h4>
            <p>Proper RGP documentation ensures accurate credit notes, debit adjustments, and prevents financial leakage in procurement cycles.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RgpEntrance;
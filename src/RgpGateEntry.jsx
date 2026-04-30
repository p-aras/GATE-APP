import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbwAB7EHZu-ztnJhzmY-pY5BMW6EySqsUd8T0Cs18ocMAo9eTWoP6faBqZOCJJ6bIvkqlg/exec";
const SHEET_ID = "1BZ-ufmxeqa9XdU-jkuIgeNxHvhnYKjWj4UpnI3bHJKo";
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

const RGP_HEADER_RANGE = "Fabric_RGP!A:W";
const RGP_ITEMS_RANGE = "Fabric_RGP_Items!A:J";

const RgpGateEntry = () => {
  const navigate = useNavigate();
  
  const [rgpNumber, setRgpNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [rgpData, setRgpData] = useState(null);
  const [rgpItems, setRgpItems] = useState([]);
  const [error, setError] = useState('');
  const [gateInPerson, setGateInPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Function to fetch RGP header data
  const fetchRGPHeader = async (rgpNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RGP_HEADER_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) throw new Error('No data found in sheet');
    
    const headers = values[0];
    const rgpColumnIndex = headers.findIndex(h => h === 'RGP No');
    
    if (rgpColumnIndex === -1) throw new Error('RGP No column not found');
    
    const rgpRow = values.slice(1).find(row => row[rgpColumnIndex] === rgpNumber);
    
    if (!rgpRow) {
      throw new Error(`RGP ${rgpNumber} not found`);
    }
    
    const rgpDetails = {};
    headers.forEach((header, index) => {
      rgpDetails[header] = rgpRow[index] || '';
    });
    
    return rgpDetails;
  };

  // Function to fetch RGP line items
  const fetchRGPItems = async (rgpNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RGP_ITEMS_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) return [];
    
    const headers = values[0];
    const rgpColumnIndex = headers.findIndex(h => h === 'RGP No');
    
    if (rgpColumnIndex === -1) throw new Error('RGP No column not found in items');
    
    const items = values
      .slice(1)
      .filter(row => row[rgpColumnIndex] === rgpNumber)
      .map(row => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index] || '';
        });
        return item;
      });
    
    return items;
  };

  // Get user's current location
  const captureLocation = () => {
    setCapturingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCaptured({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setCapturingLocation(false);
        },
        (error) => {
          console.warn('Location error:', error);
          setLocationCaptured(null);
          setCapturingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setCapturingLocation(false);
    }
  };

  // Handle RGP number submission
  const handleFetchRGP = async () => {
    if (!rgpNumber.trim()) {
      setError('Please enter an RGP number');
      return;
    }
    
    setLoading(true);
    setError('');
    setRgpData(null);
    setRgpItems([]);
    
    try {
      const [headerData, itemsData] = await Promise.all([
        fetchRGPHeader(rgpNumber.trim()),
        fetchRGPItems(rgpNumber.trim())
      ]);
      
      // Check if already Gate In done
      if (headerData['Gate In At'] && headerData['Gate In At'] !== '') {
        setError(`RGP ${rgpNumber} has already been gated in on ${headerData['Gate In At']}`);
        setRgpData(null);
        setRgpItems([]);
        setLoading(false);
        return;
      }
      
      setRgpData({ header: headerData });
      setRgpItems(itemsData);
      
    } catch (err) {
      console.error('Error fetching RGP:', err);
      setError(err.message);
      setRgpData(null);
      setRgpItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Submit Gate Entry using iframe (bypasses CORS, no new tab)
  const handleConfirmGateIn = () => {
    if (!gateInPerson.trim()) {
      setError('Please enter the gate-in person name');
      return;
    }
    
    setSubmitting(true);
    setShowPersonDialog(false);
    setError('');
    
    try {
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.name = 'hiddenFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create a hidden form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = WEB_APP_BASE;
      form.target = 'hiddenFrame';
      form.style.display = 'none';
      
      // Add all parameters as hidden inputs
      const params = {
        mode: 'entry',
        action: 'submit',
        rgp: rgpNumber,
        name: gateInPerson
      };
      
      if (locationCaptured) {
        params.lat = locationCaptured.lat.toString();
        params.lng = locationCaptured.lng.toString();
      }
      
      Object.keys(params).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
      // Clean up after submission
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
      
      const successMsg = `✅ Gate Entry (IN) Recorded Successfully!

RGP Number: ${rgpNumber}
Gate In By: ${gateInPerson}
Gate In Time: ${new Date().toLocaleString()}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}

Gate entry has been recorded. You can now proceed with Material In.`;
      
      setSuccessMessage(successMsg);
      
      // Refresh the RGP data to show updated status
      setTimeout(async () => {
        try {
          const [headerData, itemsData] = await Promise.all([
            fetchRGPHeader(rgpNumber),
            fetchRGPItems(rgpNumber)
          ]);
          setRgpData({ header: headerData });
          setRgpItems(itemsData);
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
      
      // Reset form after success
      setTimeout(() => {
        setRgpNumber('');
        setRgpData(null);
        setRgpItems([]);
        setGateInPerson('');
        setLocationCaptured(null);
        setSubmitting(false);
        setSuccessMessage('');
        navigate('/rgp');
      }, 4000);
      
    } catch (err) {
      console.error('Gate Entry error:', err);
      setError('Unable to record gate entry. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <button 
        onClick={() => navigate('/rgp')}
        style={{ 
          marginBottom: '1rem',
          padding: '10px 20px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← Back to RGP
      </button>
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>🚪 Gate Entry (IN)</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record when vehicle enters the gate with material</p>
      
      {successMessage && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          backgroundColor: '#d1fae5', 
          color: '#065f46',
          borderRadius: '8px',
          borderLeft: '4px solid #10b981',
          whiteSpace: 'pre-line'
        }}>
          {successMessage}
        </div>
      )}
      
      {error && !successMessage && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          borderRadius: '8px',
          borderLeft: '4px solid #dc2626'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <div style={{ 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Enter RGP Number for Gate Entry</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter RGP Number (e.g., RGP/2025/0001)"
            value={rgpNumber}
            onChange={(e) => setRgpNumber(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              flex: 1,
              minWidth: '200px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleFetchRGP()}
            disabled={loading || submitting}
          />
          <button
            onClick={handleFetchRGP}
            disabled={loading || submitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || submitting) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: (loading || submitting) ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Loading...' : '🔍 Fetch RGP Details'}
          </button>
        </div>
      </div>
      
      {rgpData && (
        <div>
          {/* Header Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>
              📄 RGP Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div><strong>RGP No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{rgpData.header['RGP No']}</span></div>
              <div><strong>Vendor / Party:</strong> {rgpData.header['Vendor / Party']}</div>
              <div><strong>Date:</strong> {rgpData.header['Date']}</div>
              <div><strong>Department:</strong> {rgpData.header['Department']}</div>
              <div><strong>Quantity Sent:</strong> {rgpData.header['Quantity Sent']}</div>
              <div><strong>UOM:</strong> {rgpData.header['UOM']}</div>
              <div><strong>Purpose:</strong> {rgpData.header['Purpose']}</div>
              <div><strong>Authorized By:</strong> {rgpData.header['Authorized By']}</div>
              {rgpData.header['Gate In At'] && rgpData.header['Gate In At'] !== '' && (
                <div><strong>Gate In At:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{rgpData.header['Gate In At']}</span></div>
              )}
              {rgpData.header['Gate In By'] && rgpData.header['Gate In By'] !== '' && (
                <div><strong>Gate In By:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{rgpData.header['Gate In By']}</span></div>
              )}
            </div>
          </div>
          
          {/* Items Information */}
          {rgpItems.length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                📦 RGP Items ({rgpItems.length} items)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Line #</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Lot No</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Qty1</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Qty2</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>UOM</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rgpItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{item['Line #']}</td>
                        <td style={{ padding: '10px' }}>{item['Lot No']}</td>
                        <td style={{ padding: '10px' }}>{item.Description}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(item.Qty1).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(item.Qty2).toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>{item.UOM}</td>
                        <td style={{ padding: '10px' }}>{item.Department}</td>
                        <td style={{ padding: '10px' }}>{item.Purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Gate Entry Button - Hide if already gated in */}
          {(!rgpData.header['Gate In At'] || rgpData.header['Gate In At'] === '') && (
            <div style={{
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪➡️</div>
              <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Ready for Gate Entry (IN)</h3>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Confirm that vehicle has entered the gate with material
              </p>
              <button
                onClick={() => {
                  setShowPersonDialog(true);
                  captureLocation();
                }}
                disabled={submitting}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Confirm Gate Entry (IN)'}
              </button>
            </div>
          )}
          
          {/* Show success message if already gated in */}
          {rgpData.header['Gate In At'] && rgpData.header['Gate In At'] !== '' && (
            <div style={{
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
              <h3 style={{ color: '#065f46' }}>Gate Entry Already Recorded</h3>
              <p style={{ color: '#065f46' }}>
                This RGP was gated in on {rgpData.header['Gate In At']} by {rgpData.header['Gate In By']}
              </p>
              <p style={{ color: '#065f46', marginTop: '8px', fontSize: '14px' }}>
                You can now proceed with Material In.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showPersonDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Confirm Gate Entry (IN)</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Confirm gate entry for RGP <strong>{rgpNumber}</strong>
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Gate-in person name"
                value={gateInPerson}
                onChange={(e) => setGateInPerson(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && gateInPerson.trim() && handleConfirmGateIn()}
              />
            </div>
            
            <div style={{ 
              marginBottom: '24px', 
              padding: '8px 12px', 
              backgroundColor: locationCaptured ? '#d1fae5' : '#fef3c7',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              {capturingLocation ? '📍 Capturing location...' : 
               locationCaptured ? `📍 Location captured: ${locationCaptured.lat.toFixed(4)}, ${locationCaptured.lng.toFixed(4)}` : 
               '📍 Location not captured (optional)'}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPersonDialog(false);
                  setGateInPerson('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGateIn}
                disabled={!gateInPerson.trim() || submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (gateInPerson.trim() && !submitting) ? 'pointer' : 'not-allowed',
                  opacity: (gateInPerson.trim() && !submitting) ? 1 : 0.6
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Confirm Gate Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RgpGateEntry;
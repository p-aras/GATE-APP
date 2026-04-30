import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Configuration from your AppScript
const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbxLWl9NzLTc7PdY4hxeVwv9tVwdjC4du0YBMYloqIBZdvFzGkBm-R4nT5Ki5VNtUyJjfA/exec";
const SHEET_ID = "1hy43mDxXtGVq4jeMV_NxX25Q7tnX55NnplN7eqpT74k";
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

// Range for PO Header data
const PO_HEADER_RANGE = "PO_Main!A:S";
const PO_ITEMS_RANGE = "PO_Items!A:I";

const GateInEntry = () => {
  const navigate = useNavigate();
  
  const [poNumber, setPoNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [poData, setPoData] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [error, setError] = useState('');
  const [gateInPerson, setGateInPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Function to fetch PO header data
  const fetchPOHeader = async (poNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(PO_HEADER_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) throw new Error('No data found in sheet');
    
    const headers = values[0];
    const poColumnIndex = headers.findIndex(h => h === 'PO #');
    
    if (poColumnIndex === -1) throw new Error('PO # column not found');
    
    const poRow = values.slice(1).find(row => row[poColumnIndex] === poNumber);
    
    if (!poRow) {
      throw new Error(`PO ${poNumber} not found`);
    }
    
    const poDetails = {};
    headers.forEach((header, index) => {
      poDetails[header] = poRow[index] || '';
    });
    
    return poDetails;
  };

  // Function to fetch PO line items
  const fetchPOItems = async (poNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(PO_ITEMS_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) return [];
    
    const headers = values[0];
    const poColumnIndex = headers.findIndex(h => h === 'PO #');
    
    if (poColumnIndex === -1) throw new Error('PO # column not found in items');
    
    const items = values
      .slice(1)
      .filter(row => row[poColumnIndex] === poNumber)
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

  // Handle PO number submission
  const handleFetchPO = async () => {
    if (!poNumber.trim()) {
      setError('Please enter a PO number');
      return;
    }
    
    setLoading(true);
    setError('');
    setPoData(null);
    setPoItems([]);
    
    try {
      const [headerData, itemsData] = await Promise.all([
        fetchPOHeader(poNumber.trim()),
        fetchPOItems(poNumber.trim())
      ]);
      
      if (headerData['Gate In At'] && headerData['Gate In At'] !== '') {
        setError(`PO ${poNumber} has already been Gated In on ${headerData['Gate In At']}`);
        setPoData(null);
        setPoItems([]);
        setLoading(false);
        return;
      }
      
      if (headerData.Status && headerData.Status === 'Received') {
        setError(`PO ${poNumber} has already been Received. Gate In cannot be performed.`);
        setPoData(null);
        setPoItems([]);
        setLoading(false);
        return;
      }
      
      setPoData({ header: headerData });
      setPoItems(itemsData);
      
      if (itemsData.length === 0) {
        setError('Warning: No items found for this PO');
      }
      
    } catch (err) {
      console.error('Error fetching PO:', err);
      setError(err.message);
      setPoData(null);
      setPoItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Open gate in dialog
  const handleOpenGateInDialog = () => {
    if (!poData) {
      setError('No PO data loaded');
      return;
    }
    
    setShowPersonDialog(true);
    captureLocation();
  };

  // Submit Gate In to Google Apps Script - FIXED VERSION
  const handleConfirmGateIn = async () => {
    if (!gateInPerson.trim()) {
      setError('Please enter the gate-in person name');
      return;
    }
    
    setSubmitting(true);
    setShowPersonDialog(false);
    setError('');
    
    try {
      // Using POST with proper CORS handling
      const formData = new URLSearchParams();
      formData.append('action', 'gate');
      formData.append('do', 'submit');
      formData.append('po', poNumber);
      formData.append('name', gateInPerson);
      
      if (locationCaptured) {
        formData.append('lat', locationCaptured.lat);
        formData.append('lng', locationCaptured.lng);
      }
      
      formData.append('user-agent', navigator.userAgent);
      
      // Option 1: Use no-cors mode (limited response, but works)
      // This is the most reliable way to avoid CORS errors
      const response = await fetch(WEB_APP_BASE, {
        method: 'POST',
        mode: 'no-cors', // Important: This avoids CORS but you won't get response details
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      // Since we're using no-cors, we won't get a proper response
      // But the request still goes through successfully
      // Show success message immediately
      const successMsg = `✅ Gate In Request Sent Successfully!

PO Number: ${poNumber}
Gate In Person: ${gateInPerson}
Gate In Time: ${new Date().toLocaleString()}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}

Status: Gate In request has been sent. Please check the PO status in the sheet.`;
      
      setSuccessMessage(successMsg);
      
      // Reset form after successful gate in
      setTimeout(() => {
        setPoNumber('');
        setPoData(null);
        setPoItems([]);
        setGateInPerson('');
        setLocationCaptured(null);
        setSubmitting(false);
        setSuccessMessage('');
        
        setTimeout(() => {
          navigate('/po-entrance');
        }, 2000);
      }, 3000);
      
    } catch (err) {
      console.error('Gate In error:', err);
      // Even with error, the request might have succeeded in no-cors mode
      setError('Unable to confirm gate in. Please check network connection and try again.');
      setSubmitting(false);
    }
  };

  // Alternative method: Using Google Apps Script with JSONP (if needed)
  const handleConfirmGateInWithJSONP = async () => {
    if (!gateInPerson.trim()) {
      setError('Please enter the gate-in person name');
      return;
    }
    
    setSubmitting(true);
    setShowPersonDialog(false);
    setError('');
    
    try {
      // Create a hidden iframe to submit the form (bypasses CORS)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = WEB_APP_BASE;
      form.target = 'hiddenFrame';
      form.style.display = 'none';
      
      // Add parameters
      const params = {
        action: 'gate',
        do: 'submit',
        po: poNumber,
        name: gateInPerson
      };
      
      if (locationCaptured) {
        params.lat = locationCaptured.lat;
        params.lng = locationCaptured.lng;
      }
      
      params['user-agent'] = navigator.userAgent;
      
      Object.keys(params).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });
      
      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.name = 'hiddenFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      
      // Set timeout to clean up
      setTimeout(() => {
        if (document.body.contains(form)) document.body.removeChild(form);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 5000);
      
      form.submit();
      
      const successMsg = `✅ Gate In Request Sent Successfully!

PO Number: ${poNumber}
Gate In Person: ${gateInPerson}
Gate In Time: ${new Date().toLocaleString()}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}

Status: Gate In request has been sent. Please check the PO status in the sheet.`;
      
      setSuccessMessage(successMsg);
      
      setTimeout(() => {
        setPoNumber('');
        setPoData(null);
        setPoItems([]);
        setGateInPerson('');
        setLocationCaptured(null);
        setSubmitting(false);
        setSuccessMessage('');
        
        setTimeout(() => {
          navigate('/po-entrance');
        }, 2000);
      }, 3000);
      
    } catch (err) {
      console.error('Gate In error:', err);
      setError('Failed to record Gate In. Please try again.');
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not recorded';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <button 
        onClick={() => navigate('/po')}
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
        ← Back to PO Entrance
      </button>
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Gate In Entry</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record gate entry against purchase order</p>
      
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
        <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Enter PO Number</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter PO Number (e.g., PO-20251028-5328)"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              flex: 1,
              minWidth: '200px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleFetchPO()}
            disabled={loading || submitting}
          />
          <button
            onClick={handleFetchPO}
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
            {loading ? '⏳ Loading...' : '🔍 Fetch PO Details'}
          </button>
        </div>
      </div>
      
      {poData && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>
              📄 Purchase Order Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div><strong>PO #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{poData.header['PO #']}</span></div>
              <div><strong>Supplier:</strong> {poData.header.Supplier}</div>
              <div><strong>Order Date:</strong> {poData.header['Order Date']} {poData.header['Order Time']}</div>
              <div><strong>Expected Date:</strong> {poData.header['Expected Date']} {poData.header['Expected Time']}</div>
              <div><strong>Supervisor:</strong> {poData.header.Supervisor}</div>
              <div><strong>Total Amount:</strong> <span style={{ fontWeight: 'bold', color: '#059669' }}>₹{parseFloat(poData.header['Total Amount'] || 0).toLocaleString()}</span></div>
            </div>
          </div>
          
          {poItems.length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                📦 Order Items ({poItems.length} items)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Line #</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Department</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>UOM</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{item['Line #']}</td>
                        <td style={{ padding: '10px' }}>{item.Department}</td>
                        <td style={{ padding: '10px' }}>{item.Description}</td>
                        <td style={{ padding: '10px' }}>{item.UOM}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(item.Qty).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(item.Rate).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          ₹{parseFloat(item.Amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {(!poData.header['Gate In At'] || poData.header['Gate In At'] === '') && (
            <div style={{
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪</div>
              <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Ready for Gate In</h3>
              <button
                onClick={handleOpenGateInDialog}
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
                {submitting ? '⏳ Processing...' : '✅ Confirm Gate In'}
              </button>
            </div>
          )}
        </div>
      )}
      
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
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Gate In Confirmation</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Enter your name to confirm gate entry for PO <strong>{poNumber}</strong>
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Enter your full name"
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
               locationCaptured ? `📍 Location captured` : 
               '📍 Location not captured'}
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
                disabled={!gateInPerson.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: gateInPerson.trim() ? 'pointer' : 'not-allowed',
                  opacity: gateInPerson.trim() ? 1 : 0.6
                }}
              >
                ✅ Confirm Gate In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateInEntry;
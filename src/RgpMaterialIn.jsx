import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbwAB7EHZu-ztnJhzmY-pY5BMW6EySqsUd8T0Cs18ocMAo9eTWoP6faBqZOCJJ6bIvkqlg/exec";
const SHEET_ID = "1BZ-ufmxeqa9XdU-jkuIgeNxHvhnYKjWj4UpnI3bHJKo";
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

const RGP_HEADER_RANGE = "Fabric_RGP!A:W";
const RGP_ITEMS_RANGE = "Fabric_RGP_Items!A:J";

const RgpMaterialIn = () => {
  const navigate = useNavigate();
  
  const [rgpNumber, setRgpNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [rgpData, setRgpData] = useState(null);
  const [rgpItems, setRgpItems] = useState([]);
  const [error, setError] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  
  // Material receipt states
  const [receiptType, setReceiptType] = useState('partial');
  const [partialQuantity, setPartialQuantity] = useState('');
  const [pendingQuantity, setPendingQuantity] = useState(0);
  const [quantitySent, setQuantitySent] = useState(0);
  const [returnedSoFar, setReturnedSoFar] = useState(0);

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
      
      // Check if Gate Entry exists
      if (!headerData['Gate In At'] || headerData['Gate In At'] === '') {
        setError(`RGP ${rgpNumber} has not been Gated In yet. Please perform Gate Entry first.`);
        setRgpData(null);
        setRgpItems([]);
        setLoading(false);
        return;
      }
      
      // Check if already fully received
      const sent = parseFloat(headerData['Quantity Sent'] || 0);
      const returned = parseFloat(headerData['Returned Quantity'] || 0);
      
      if (returned >= sent && sent > 0) {
        setError(`RGP ${rgpNumber} has already been fully received. Total Received: ${returned} of ${sent}`);
        setRgpData(null);
        setRgpItems([]);
        setLoading(false);
        return;
      }
      
      setRgpData({ header: headerData });
      setRgpItems(itemsData);
      setQuantitySent(sent);
      setReturnedSoFar(returned);
      setPendingQuantity(sent - returned);
      
    } catch (err) {
      console.error('Error fetching RGP:', err);
      setError(err.message);
      setRgpData(null);
      setRgpItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Open material receipt dialog
  const handleOpenMaterialDialog = () => {
    if (!rgpData) {
      setError('No RGP data loaded');
      return;
    }
    
    setReceiptType('partial');
    setPartialQuantity('');
    setShowMaterialDialog(true);
    captureLocation();
  };

  // Submit Material In using iframe (bypasses CORS, no new tab)
  const handleConfirmMaterialIn = () => {
    if (!receivedBy.trim()) {
      setError('Please enter the receiver name');
      return;
    }
    
    let qtyToReceive = 0;
    
    if (receiptType === 'complete') {
      qtyToReceive = pendingQuantity;
    } else {
      const parsed = parseFloat(partialQuantity);
      if (isNaN(parsed) || parsed <= 0) {
        setError('Please enter a valid quantity greater than 0');
        return;
      }
      if (parsed > pendingQuantity) {
        setError(`Quantity cannot exceed pending quantity (${pendingQuantity})`);
        return;
      }
      qtyToReceive = parsed;
    }
    
    setSubmitting(true);
    setShowMaterialDialog(false);
    setError('');
    
    try {
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.name = 'hiddenFrameMaterialIn';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create a hidden form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = WEB_APP_BASE;
      form.target = 'hiddenFrameMaterialIn';
      form.style.display = 'none';
      
      // Add all parameters as hidden inputs
      const params = {
        mode: 'return',
        action: 'submit',
        rgp: rgpNumber,
        rtype: receiptType,
        qty: qtyToReceive.toString(),
        name: receivedBy
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
      
      const newReturnedTotal = returnedSoFar + qtyToReceive;
      const newPending = quantitySent - newReturnedTotal;
      const isComplete = newPending === 0;
      
      const successMsg = `✅ Material In Recorded Successfully!

RGP Number: ${rgpNumber}
Received By: ${receivedBy}
Receipt Type: ${receiptType === 'complete' ? 'Complete' : 'Partial'}
${receiptType === 'partial' ? `Quantity Received: ${qtyToReceive}` : ''}
Total Received: ${newReturnedTotal} of ${quantitySent}
Pending Quantity: ${newPending}
${isComplete ? '🎉 RGP is now COMPLETE!' : ''}
Receipt Time: ${new Date().toLocaleString()}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}`;
      
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
          setQuantitySent(parseFloat(headerData['Quantity Sent'] || 0));
          setReturnedSoFar(parseFloat(headerData['Returned Quantity'] || 0));
          setPendingQuantity(parseFloat(headerData['Quantity Sent'] || 0) - parseFloat(headerData['Returned Quantity'] || 0));
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
      
      // Reset form after success
      setTimeout(() => {
        setRgpNumber('');
        setRgpData(null);
        setRgpItems([]);
        setReceivedBy('');
        setLocationCaptured(null);
        setSubmitting(false);
        setSuccessMessage('');
        navigate('/rgp');
      }, 4000);
      
    } catch (err) {
      console.error('Material In error:', err);
      setError('Unable to record material receipt. Please try again.');
      setSubmitting(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = quantitySent > 0 ? (returnedSoFar / quantitySent) * 100 : 0;

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
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>📦 Material In (Receipt)</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record received material against RGP</p>
      
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
        <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Enter RGP Number for Material Receipt</h3>
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
              <div><strong>Quantity Sent:</strong> <span style={{ fontWeight: 'bold' }}>{quantitySent}</span></div>
              <div><strong>Quantity Received:</strong> <span style={{ fontWeight: 'bold', color: '#059669' }}>{returnedSoFar}</span></div>
              <div><strong>Pending Quantity:</strong> <span style={{ fontWeight: 'bold', color: pendingQuantity > 0 ? '#f59e0b' : '#059669' }}>{pendingQuantity}</span></div>
              <div><strong>UOM:</strong> {rgpData.header['UOM']}</div>
              <div><strong>Purpose:</strong> {rgpData.header['Purpose']}</div>
              <div><strong>Authorized By:</strong> {rgpData.header['Authorized By']}</div>
              <div><strong>Gate In At:</strong> {rgpData.header['Gate In At'] || 'Not recorded'}</div>
              <div><strong>Gate In By:</strong> {rgpData.header['Gate In By'] || 'Not recorded'}</div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Receipt Progress</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div style={{ 
                height: '10px', 
                backgroundColor: '#e2e8f0', 
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${progressPercentage}%`, 
                  height: '100%', 
                  backgroundColor: '#10b981',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
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
          
          {/* Material In Button - Hide if fully received */}
          {pendingQuantity > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Record Material Receipt</h3>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Pending to receive: <strong style={{ color: '#8b5cf6', fontSize: '18px' }}>{pendingQuantity}</strong> {rgpData.header['UOM']}
              </p>
              <button
                onClick={handleOpenMaterialDialog}
                disabled={submitting}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Record Material In'}
              </button>
            </div>
          )}
          
          {/* Show completion message if fully received */}
          {pendingQuantity === 0 && quantitySent > 0 && (
            <div style={{
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ color: '#065f46' }}>RGP Complete!</h3>
              <p style={{ color: '#065f46' }}>
                All material has been received. Total Received: {returnedSoFar} of {quantitySent} {rgpData.header['UOM']}
              </p>
              {rgpData.header['Gate Out At'] && rgpData.header['Gate Out At'] !== '' ? (
                <p style={{ color: '#065f46', marginTop: '8px', fontSize: '14px' }}>
                  Gate Out completed on {rgpData.header['Gate Out At']}
                </p>
              ) : (
                <p style={{ color: '#065f46', marginTop: '8px', fontSize: '14px' }}>
                  Don't forget to record Gate Out when vehicle exits
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Material Receipt Dialog */}
      {showMaterialDialog && (
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
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Record Material Receipt</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Record received quantity for RGP <strong>{rgpNumber}</strong>
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receiptType"
                    value="complete"
                    checked={receiptType === 'complete'}
                    onChange={() => setReceiptType('complete')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Complete ({pendingQuantity})</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receiptType"
                    value="partial"
                    checked={receiptType === 'partial'}
                    onChange={() => setReceiptType('partial')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Partial</span>
                </label>
              </div>
              
              {receiptType === 'partial' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Quantity to Receive (Max: {pendingQuantity})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={pendingQuantity}
                    value={partialQuantity}
                    onChange={(e) => setPartialQuantity(e.target.value)}
                    placeholder={`Enter quantity (max ${pendingQuantity})`}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Received By (Name)</label>
              <input
                type="text"
                placeholder="Enter receiver name"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && receivedBy.trim() && handleConfirmMaterialIn()}
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
                  setShowMaterialDialog(false);
                  setReceivedBy('');
                  setReceiptType('partial');
                  setPartialQuantity('');
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
                onClick={handleConfirmMaterialIn}
                disabled={!receivedBy.trim() || (receiptType === 'partial' && (!partialQuantity || parseFloat(partialQuantity) <= 0))}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (receivedBy.trim() && (receiptType === 'complete' || (partialQuantity && parseFloat(partialQuantity) > 0))) ? 'pointer' : 'not-allowed',
                  opacity: (receivedBy.trim() && (receiptType === 'complete' || (partialQuantity && parseFloat(partialQuantity) > 0))) ? 1 : 0.6
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Confirm Material Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RgpMaterialIn;
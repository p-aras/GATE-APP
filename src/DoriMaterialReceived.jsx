import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbz11wxZ0SgGKMPlhrGX0chMNJhD1Xz0Eq7F85pqJFzAMwcLCyj2ibY2iNdqMl0Nz7AZ/exec";
const SHEET_ID = "1LjwZqU26F0xwL1tEyps8txsM1qS8LLUuE-sy_4CQK6k"; // Dori sheet ID
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

// DORI Sheet ranges
const DORI_HEADER_RANGE = "DoriPurchaseOrders!A:U";

const DoriMaterialReceived = () => {
  const navigate = useNavigate();
  
  const [lotNumber, setLotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [doriEntries, setDoriEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReceiverDialog, setShowReceiverDialog] = useState(false);
  const [showLotSelector, setShowLotSelector] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Function to fetch ALL DORI entries for a Lot Number
  const fetchAllDoriEntries = async (lotNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(DORI_HEADER_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) throw new Error('No data found in sheet');
    
    const headers = values[0];
    const lotColumnIndex = headers.findIndex(h => h === 'Lot Number');
    
    if (lotColumnIndex === -1) throw new Error('Lot Number column not found');
    
    // Find ALL rows matching this lot number
    const matchingRows = values.slice(1).filter(row => 
      String(row[lotColumnIndex] || '').trim() === String(lotNumber).trim()
    );
    
    if (matchingRows.length === 0) {
      throw new Error(`Lot Number ${lotNumber} not found`);
    }
    
    // Process each entry
    const entries = matchingRows.map((row, idx) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] || '';
      });
      
      const timestamp = entry['Timestamp'] || new Date().toISOString();
      const uniqueKey = `${lotNumber}_${timestamp}_${idx}`;
      
      // Get the actual total pieces from the sheet
      const originalTotalPieces = parseInt(entry['Total Pieces']) || 0;
      
      let hasValidSelections = false;
      let selectedColorsCount = 0;
      let validTotalPieces = 0;
      
      try {
        const zipSelections = entry['Zip Selections'] ? JSON.parse(entry['Zip Selections']) : {};
        const selectedColors = Object.entries(zipSelections).filter(([_, zipColor]) => zipColor && zipColor.trim() !== '');
        hasValidSelections = selectedColors.length > 0;
        selectedColorsCount = selectedColors.length;
        
        if (hasValidSelections) {
          validTotalPieces = originalTotalPieces;
        }
      } catch (e) {
        hasValidSelections = false;
      }
      
      return {
        ...entry,
        uniqueKey,
        hasValidSelections,
        originalTotalPieces,
        displayTotalPieces: originalTotalPieces,
        validTotalPieces,
        selectedColorsCount,
        rowIndex: idx
      };
    });
    
    // Sort entries: those with valid selections first
    entries.sort((a, b) => {
      if (a.hasValidSelections !== b.hasValidSelections) {
        return b.hasValidSelections ? 1 : -1;
      }
      return new Date(b['Timestamp']) - new Date(a['Timestamp']);
    });
    
    return entries;
  };

  // Format zip selections for display
  const formatZipSelections = (zipSelectionsJson) => {
    if (!zipSelectionsJson) return 'No selections';
    try {
      const selections = JSON.parse(zipSelectionsJson);
      if (typeof selections === 'object') {
        const selectedColors = Object.entries(selections)
          .filter(([_, zipColor]) => zipColor && zipColor.trim() !== '')
          .map(([color, zipColor]) => `${color}: ${zipColor}`);
        
        if (selectedColors.length === 0) return 'No colors selected';
        if (selectedColors.length > 3) {
          return `${selectedColors.slice(0, 3).join(', ')} +${selectedColors.length - 3} more`;
        }
        return selectedColors.join(', ');
      }
      return zipSelectionsJson;
    } catch (e) {
      return zipSelectionsJson;
    }
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

  // Handle Lot Number submission
  const handleFetchDori = async () => {
    if (!lotNumber.trim()) {
      setError('Please enter a Lot Number');
      return;
    }
    
    setLoading(true);
    setError('');
    setDoriEntries([]);
    setSelectedEntry(null);
    setShowLotSelector(false);
    
    try {
      const entries = await fetchAllDoriEntries(lotNumber.trim());
      
      // Filter entries that have gate entry completed but material not yet received
      const availableEntries = entries.filter(entry => 
        entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '' &&
        (!entry['Material Received Date'] || entry['Material Received Date'] === '')
      );
      
      if (availableEntries.length === 0) {
        const hasGateEntry = entries.some(e => e['Gate Entry Date'] && e['Gate Entry Date'] !== '');
        const allReceived = entries.every(e => e['Material Received Date'] && e['Material Received Date'] !== '');
        
        if (allReceived) {
          setError(`Material for Lot Number ${lotNumber} has already been received for all orders.`);
        } else if (!hasGateEntry) {
          setError(`⚠️ Gate entry must be completed before material can be received for Lot Number ${lotNumber}.`);
        } else {
          setError(`No pending material receipt found for Lot Number ${lotNumber}.`);
        }
        setDoriEntries([]);
        setLoading(false);
        return;
      }
      
      if (availableEntries.length === 1) {
        setSelectedEntry(availableEntries[0]);
        setDoriEntries([]);
      } else {
        setDoriEntries(availableEntries);
        setShowLotSelector(true);
        setError(`⚠️ Found ${availableEntries.length} orders ready for material receipt. Please select the correct one.`);
      }
      
    } catch (err) {
      console.error('Error fetching DORI data:', err);
      setError(err.message);
      setDoriEntries([]);
      setSelectedEntry(null);
    } finally {
      setLoading(false);
    }
  };


const handleConfirmMaterialReceived = () => {
  if (!receiverName.trim()) {
    setError('Please enter the receiver name');
    return;
  }
  
  setSubmitting(true);
  setShowReceiverDialog(false);
  setError('');
  
  try {
    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrameDoriMaterial';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = WEB_APP_BASE;
    form.target = 'hiddenFrameDoriMaterial';
    form.style.display = 'none';
    
    const params = {
      action: 'saveMaterialReceived',
      lotNumber: lotNumber,
      receiverName: receiverName,
      totalPieces: selectedEntry.displayTotalPieces.toString() // ← Send Total Pieces
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
    
    setTimeout(() => {
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
    
    const successMsg = `✅ DORI Material Received Successfully!

Lot Number: ${lotNumber}
Total Pieces: ${selectedEntry.displayTotalPieces}
Received By: ${receiverName}
Receipt Time: ${new Date().toLocaleString()}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}

Material receipt has been recorded.`;
    
    setSuccessMessage(successMsg);
    
    setTimeout(() => {
      setLotNumber('');
      setSelectedEntry(null);
      setReceiverName('');
      setLocationCaptured(null);
      setSubmitting(false);
      setSuccessMessage('');
      navigate('/dori');
    }, 4000);
    
  } catch (err) {
    console.error('Material Received error:', err);
    setError('Unable to record material receipt. Please try again.');
    setSubmitting(false);
  }
};

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <button 
        onClick={() => navigate('/dori')}
        style={{ 
          marginBottom: '1rem',
          padding: '10px 20px',
          backgroundColor: '#8b5cf6',
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
        ← Back to DORI
      </button>
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>📦 DORI Material Received</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record material receipt in storage for DORI/Lot material</p>
      
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
        <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Enter Lot Number for Material Receipt</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter Lot Number (e.g., 11733)"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              flex: 1,
              minWidth: '200px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleFetchDori()}
            disabled={loading || submitting}
          />
          <button
            onClick={handleFetchDori}
            disabled={loading || submitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || submitting) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: (loading || submitting) ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Loading...' : '🔍 Fetch Lot Details'}
          </button>
        </div>
      </div>
      
      {/* Multiple Entries Selector */}
      {showLotSelector && doriEntries.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#92400e' }}>
            ⚠️ Multiple Orders Ready for Material Receipt
          </h3>
          <p style={{ marginBottom: '16px', color: '#64748b' }}>
            Please select the correct order for material receipt:
          </p>
          
          {doriEntries.map((entry, idx) => (
            <div
              key={entry.uniqueKey}
              style={{
                border: '2px solid #10b981',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                backgroundColor: '#f0fdf4',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                setSelectedEntry(entry);
                setShowLotSelector(false);
                setError('');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <strong>Order #{idx + 1}</strong>
                    <span style={{ 
                      backgroundColor: '#10b981', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      GATE COMPLETED
                    </span>
                    {entry.hasValidSelections && (
                      <span style={{ 
                        backgroundColor: '#8b5cf6', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    <div>📅 Order Date: {new Date(entry['Timestamp']).toLocaleDateString() || 'N/A'}</div>
                    <div>📦 Total Pieces: <strong style={{ color: '#059669', fontSize: '16px' }}>
                      {entry.displayTotalPieces.toLocaleString()}
                    </strong></div>
                    {entry.hasValidSelections && entry.validTotalPieces !== entry.displayTotalPieces && (
                      <div>✅ Valid Pieces (with selections): {entry.validTotalPieces.toLocaleString()}</div>
                    )}
                    <div>🎨 Selected Colors: {entry.selectedColorsCount}</div>
                    <div>👕 Garment: {entry['Garment Type'] || 'N/A'} - {entry['Style'] || 'N/A'}</div>
                    <div>🚪 Gate Entry Date: {entry['Gate Entry Date']}</div>
                    <div>👤 Gate Entry By: {entry['Gate Entry Person']}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(entry);
                    setShowLotSelector(false);
                    setError('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Select This Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Selected Entry Display */}
      {selectedEntry && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid #8b5cf6',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #8b5cf6', paddingLeft: '12px' }}>
              📄 Selected Order Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div><strong>Order Date:</strong> {new Date(selectedEntry['Timestamp']).toLocaleString() || 'N/A'}</div>
              <div><strong>Lot Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#8b5cf6' }}>{selectedEntry['Lot Number']}</span></div>
              <div><strong>Garment Type:</strong> {selectedEntry['Garment Type'] || 'N/A'}</div>
              <div><strong>Style:</strong> {selectedEntry['Style'] || 'N/A'}</div>
              <div><strong>Fabric:</strong> {selectedEntry['Fabric'] || 'N/A'}</div>
              <div><strong>Total Pieces:</strong> <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '18px' }}>{selectedEntry.displayTotalPieces.toLocaleString()}</span></div>
              {selectedEntry.hasValidSelections && selectedEntry.validTotalPieces !== selectedEntry.displayTotalPieces && (
                <div><strong>Valid Pieces (with selections):</strong> {selectedEntry.validTotalPieces.toLocaleString()}</div>
              )}
              <div><strong>Selected Colors:</strong> {selectedEntry.selectedColorsCount}</div>
              <div><strong>Gate Entry Date:</strong> {selectedEntry['Gate Entry Date']}</div>
              <div><strong>Gate Entry By:</strong> {selectedEntry['Gate Entry Person']}</div>
              <div><strong>Total Cost:</strong> {selectedEntry['Total Cost (₹)'] ? `₹${parseInt(selectedEntry['Total Cost (₹)']).toLocaleString()}` : 'N/A'}</div>
            </div>
          </div>
          
          {/* Material Received Button */}
          <div style={{
            background: 'white',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦✅</div>
            <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Ready for Material Receipt</h3>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              Confirm material receipt for Lot Number: <strong>{lotNumber}</strong>
            </p>
            <div style={{ 
              background: '#f0fdf4', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#059669' }}>✓ Gate entry completed on {selectedEntry['Gate Entry Date']}</span><br/>
              <span style={{ color: '#059669' }}>✓ Total Pieces: {selectedEntry.displayTotalPieces.toLocaleString()}</span>
              {selectedEntry.hasValidSelections && selectedEntry.validTotalPieces !== selectedEntry.displayTotalPieces && (
                <><br/><span style={{ color: '#f59e0b' }}>✓ Valid Pieces: {selectedEntry.validTotalPieces.toLocaleString()}</span></>
              )}
            </div>
            <button
              onClick={() => {
                setShowReceiverDialog(true);
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
              {submitting ? '⏳ Processing...' : '✅ Confirm Material Received'}
            </button>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showReceiverDialog && (
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
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Confirm DORI Material Received</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Confirm material receipt for Lot Number: <strong>{lotNumber}</strong>
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Receiver name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && receiverName.trim() && handleConfirmMaterialReceived()}
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
                  setShowReceiverDialog(false);
                  setReceiverName('');
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
                onClick={handleConfirmMaterialReceived}
                disabled={!receiverName.trim() || submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (receiverName.trim() && !submitting) ? 'pointer' : 'not-allowed',
                  opacity: (receiverName.trim() && !submitting) ? 1 : 0.6
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Confirm Material Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoriMaterialReceived;
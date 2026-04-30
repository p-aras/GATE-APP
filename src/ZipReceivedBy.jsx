import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbzeNcbiXb6dOwiFlkT2RcF-bWAVFxAKBYGoUJ2raDXjUMlocup8M6VZlxaeo1RN6uEs/exec";
const SHEET_ID = "16mifNw0WMIlnZ1XRHsuH_8kVUm_6Y1O3uVsoM-Hjppo";
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

// ZIP Sheet ranges
const ZIP_HEADER_RANGE = "ZipPurchaseOrders!A:W";

const ZipReceivedBy = () => {
  const navigate = useNavigate();
  
  const [lotNumber, setLotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [zipEntries, setZipEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [showLotSelector, setShowLotSelector] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Function to fetch ALL ZIP entries for a Lot Number
  const fetchAllZipEntries = async (lotNumber) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(ZIP_HEADER_RANGE)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
    const data = await resp.json();
    const values = data.values || [];
    
    if (values.length === 0) throw new Error('No data found in sheet');
    
    const headers = values[0];
    const lotColumnIndex = headers.findIndex(h => h === 'Lot Number');
    const totalPiecesIndex = headers.findIndex(h => h === 'Total Pieces');
    const timestampIndex = headers.findIndex(h => h === 'Timestamp');
    const gateEntryDateIndex = headers.findIndex(h => h === 'Gate Entry Date');
    const gateEntryPersonIndex = headers.findIndex(h => h === 'Gate Entry Person');
    const materialReceivedDateIndex = headers.findIndex(h => h === 'Material Received Date');
    const materialReceivedByIndex = headers.findIndex(h => h === 'Material Received By');
    
    if (lotColumnIndex === -1) throw new Error('Lot Number column not found');
    if (totalPiecesIndex === -1) throw new Error('Total Pieces column not found');
    
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
      
      const totalPieces = parseInt(entry['Total Pieces']) || 0;
      const timestamp = entry['Timestamp'] || new Date().toISOString();
      const uniqueKey = `${lotNumber}_${totalPieces}_${idx}`;
      
      // Check if this entry has valid selections
      let hasValidSelections = false;
      let selectedColorsCount = 0;
      
      try {
        const zipSelections = entry['Zip Selections'] ? JSON.parse(entry['Zip Selections']) : {};
        const selectedColors = Object.entries(zipSelections).filter(([_, zipColor]) => zipColor && zipColor.trim() !== '');
        hasValidSelections = selectedColors.length > 0;
        selectedColorsCount = selectedColors.length;
      } catch (e) {
        hasValidSelections = false;
      }
      
      // Determine status
      let status = 'pending';
      let statusColor = '#f59e0b';
      let statusText = 'Pending Gate Entry';
      
      if (entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '') {
        if (entry['Material Received Date'] && entry['Material Received Date'] !== '') {
          status = 'completed';
          statusColor = '#10b981';
          statusText = 'Completed (Material Received)';
        } else {
          status = 'gate_completed';
          statusColor = '#3b82f6';
          statusText = 'Gate Entry Completed - Ready for Material Receipt';
        }
      } else {
        status = 'pending_gate';
        statusColor = '#f59e0b';
        statusText = 'Pending Gate Entry';
      }
      
      return {
        ...entry,
        uniqueKey,
        totalPieces,
        hasValidSelections,
        selectedColorsCount,
        status,
        statusColor,
        statusText,
        isSelected: false,
        rowIndex: idx
      };
    });
    
    // Sort entries: active orders first, then by total pieces
    entries.sort((a, b) => {
      // Active orders (with valid selections) first
      if (a.hasValidSelections !== b.hasValidSelections) {
        return b.hasValidSelections ? 1 : -1;
      }
      // Then by status (gate completed, pending, etc.)
      if (a.status !== b.status) {
        const statusOrder = { gate_completed: 1, pending_gate: 2, completed: 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      }
      // Then by total pieces (highest first)
      return b.totalPieces - a.totalPieces;
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

  // Handle Lot Number submission - SHOW ALL ENTRIES
  const handleFetchZip = async () => {
    if (!lotNumber.trim()) {
      setError('Please enter a Lot Number');
      return;
    }
    
    setLoading(true);
    setError('');
    setZipEntries([]);
    setSelectedEntry(null);
    setShowLotSelector(false);
    
    try {
      const entries = await fetchAllZipEntries(lotNumber.trim());
      
      // Show ALL entries, let user select which one to work with
      setZipEntries(entries);
      setShowLotSelector(true);
      
      if (entries.length === 1) {
        setError(`Found 1 order for Lot ${lotNumber}. Please select it to proceed.`);
      } else {
        setError(`Found ${entries.length} orders for Lot ${lotNumber}. Please select the correct one.`);
      }
      
    } catch (err) {
      console.error('Error fetching ZIP data:', err);
      setError(err.message);
      setZipEntries([]);
      setSelectedEntry(null);
    } finally {
      setLoading(false);
    }
  };

  // Select specific entry from multiple
  const handleSelectEntry = (entry) => {
    // Check if gate entry is completed
    if (!entry['Gate Entry Date'] || entry['Gate Entry Date'] === '') {
      setError(`⚠️ Gate entry must be completed before material can be received for this order (${entry.totalPieces} pieces). Please complete gate entry first.`);
      return;
    }
    
    // Check if already material received
    if (entry['Material Received Date'] && entry['Material Received Date'] !== '') {
      setError(`❌ Material has already been received for this order (${entry.totalPieces} pieces) on ${entry['Material Received Date']}`);
      return;
    }
    
    setSelectedEntry(entry);
    setShowLotSelector(false);
    setError('');
    setZipEntries([]);
  };

  // Submit Material Received using iframe with Total Pieces as unique key
  const handleConfirmReceived = () => {
    if (!receiverName.trim()) {
      setError('Please enter the receiver name');
      return;
    }
    
    setSubmitting(true);
    setShowPersonDialog(false);
    setError('');
    
    try {
      const iframe = document.createElement('iframe');
      iframe.name = 'hiddenFrameZipReceive';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = WEB_APP_BASE;
      form.target = 'hiddenFrameZipReceive';
      form.style.display = 'none';
      
      const params = {
        action: 'saveMaterialReceived',
        lotNumber: lotNumber,
        receiverName: receiverName,
        totalPieces: selectedEntry.totalPieces.toString()
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
      
      const successMsg = `✅ Material Received Recorded Successfully!

Lot Number: ${lotNumber}
Total Pieces: ${selectedEntry.totalPieces}
Received By: ${receiverName}
Receipt Time: ${new Date().toLocaleString()}
Selected Colors: ${selectedEntry.selectedColorsCount}
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
        navigate('/zip');
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
        onClick={() => navigate('/zip')}
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
        ← Back to ZIP
      </button>
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>📦 Material Received</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record material receipt for ZIP/Lot</p>
      
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
            placeholder="Enter Lot Number (e.g., 61183)"
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
            onKeyPress={(e) => e.key === 'Enter' && handleFetchZip()}
            disabled={loading || submitting}
          />
          <button
            onClick={handleFetchZip}
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
            {loading ? '⏳ Loading...' : '🔍 Fetch Lot Details'}
          </button>
        </div>
      </div>
      
      {/* ALL Entries Selector - Shows every entry for the lot */}
      {showLotSelector && zipEntries.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #6366f1',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>
            📋 All Orders for Lot {lotNumber}
          </h3>
          <p style={{ marginBottom: '16px', color: '#64748b' }}>
            Found {zipEntries.length} order(s). Please select the correct order for material receipt:
          </p>
          
          {zipEntries.map((entry, idx) => (
            <div
              key={entry.uniqueKey}
              style={{
                border: `2px solid ${entry.statusColor}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                cursor: entry.status === 'gate_completed' ? 'pointer' : 'not-allowed',
                backgroundColor: entry.status === 'gate_completed' ? '#f0fdf4' : '#fef3c7',
                opacity: entry.status === 'gate_completed' ? 1 : 0.7,
                transition: 'all 0.2s'
              }}
              onClick={() => {
                if (entry.status === 'gate_completed') {
                  handleSelectEntry(entry);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <strong>Order #{idx + 1}</strong>
                    <span style={{ 
                      backgroundColor: entry.statusColor, 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {entry.statusText}
                    </span>
                    {entry.hasValidSelections && (
                      <span style={{ 
                        backgroundColor: '#6366f1', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        ACTIVE ORDER
                      </span>
                    )}
                    {!entry.hasValidSelections && (
                      <span style={{ 
                        backgroundColor: '#f59e0b', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        DRAFT/CANCELLED
                      </span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    <div>📅 Order Date: {new Date(entry['Timestamp']).toLocaleDateString() || 'N/A'}</div>
                    <div>📦 Total Pieces: <strong style={{ color: entry.hasValidSelections ? '#059669' : '#dc2626', fontSize: '16px' }}>
                      {entry.totalPieces.toLocaleString()}
                    </strong></div>
                    <div>🎨 Selected Colors: {entry.selectedColorsCount}</div>
                    <div>👕 Garment: {entry['Garment Type'] || 'N/A'} - {entry['Style'] || 'N/A'}</div>
                    <div>🎨 Zip Selections: {formatZipSelections(entry['Zip Selections'])}</div>
                    
                    {entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '' && (
                      <>
                        <div>🚪 Gate Entry Date: {entry['Gate Entry Date']}</div>
                        <div>👤 Gate Entry By: {entry['Gate Entry Person']}</div>
                      </>
                    )}
                    
                    {entry['Material Received Date'] && entry['Material Received Date'] !== '' && (
                      <div>✅ Material Received Date: {entry['Material Received Date']}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (entry.status === 'gate_completed') {
                      handleSelectEntry(entry);
                    }
                  }}
                  disabled={entry.status !== 'gate_completed'}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: entry.status === 'gate_completed' ? '#6366f1' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: entry.status === 'gate_completed' ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {entry.status === 'gate_completed' ? 'Select for Receipt' : 'Not Available'}
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
            border: '2px solid #6366f1',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderLeft: '4px solid #6366f1', paddingLeft: '12px' }}>
              📄 Selected Order Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div><strong>Order Date:</strong> {new Date(selectedEntry['Timestamp']).toLocaleString() || 'N/A'}</div>
              <div><strong>Lot Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#6366f1' }}>{selectedEntry['Lot Number']}</span></div>
              <div><strong>Garment Type:</strong> {selectedEntry['Garment Type'] || 'N/A'}</div>
              <div><strong>Style:</strong> {selectedEntry['Style'] || 'N/A'}</div>
              <div><strong>Fabric:</strong> {selectedEntry['Fabric'] || 'N/A'}</div>
              <div><strong>Total Pieces:</strong> <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '18px' }}>{selectedEntry.totalPieces.toLocaleString()}</span></div>
              <div><strong>Selected Colors:</strong> {selectedEntry.selectedColorsCount}</div>
              <div><strong>Gate Entry Date:</strong> {selectedEntry['Gate Entry Date']}</div>
              <div><strong>Gate Entry By:</strong> {selectedEntry['Gate Entry Person']}</div>
              <div><strong>Total Cost:</strong> {selectedEntry['Total Cost (₹)'] ? `₹${parseInt(selectedEntry['Total Cost (₹)']).toLocaleString()}` : 'N/A'}</div>
              <div><strong>Supplier Name:</strong> {selectedEntry['Supplier Name'] || 'Not entered yet'}</div>
            </div>
          </div>
          
          {/* Material Received Button */}
          <div style={{
            background: 'white',
            border: '2px solid #8b5cf6',
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
              <span style={{ color: '#059669' }}>✓ Total Pieces: {selectedEntry.totalPieces.toLocaleString()}</span>
              {selectedEntry.selectedColorsCount > 0 && (
                <><br/><span style={{ color: '#059669' }}>✓ Selected Colors: {selectedEntry.selectedColorsCount}</span></>
              )}
            </div>
            <button
              onClick={() => {
                setShowPersonDialog(true);
                captureLocation();
              }}
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
              {submitting ? '⏳ Processing...' : '✅ Confirm Material Receipt'}
            </button>
          </div>
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
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Confirm Material Receipt</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Confirm material receipt for Lot Number: <strong>{lotNumber}</strong>
            </p>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              Total Pieces: <strong>{selectedEntry?.totalPieces.toLocaleString()}</strong>
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
                onKeyPress={(e) => e.key === 'Enter' && receiverName.trim() && handleConfirmReceived()}
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
                onClick={handleConfirmReceived}
                disabled={!receiverName.trim() || submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (receiverName.trim() && !submitting) ? 'pointer' : 'not-allowed',
                  opacity: (receiverName.trim() && !submitting) ? 1 : 0.6
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

export default ZipReceivedBy;
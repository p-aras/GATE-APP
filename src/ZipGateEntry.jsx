import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEB_APP_BASE = "https://script.google.com/macros/s/AKfycbzeNcbiXb6dOwiFlkT2RcF-bWAVFxAKBYGoUJ2raDXjUMlocup8M6VZlxaeo1RN6uEs/exec";
const SHEET_ID = "16mifNw0WMIlnZ1XRHsuH_8kVUm_6Y1O3uVsoM-Hjppo";
const SUPERVISOR_SHEET_ID = "1Hj3JeJEKB43aYYWv8gk2UhdU6BWuEQfCg5pBlTdBMNA"; // ← REPLACE WITH YOUR ACTUAL SUPERVISOR SHEET ID
const API_KEY = "AIzaSyAomDFBkOySlIxKWSKGHe6ATv9gvaBr7uk";

// ZIP Sheet ranges
const ZIP_HEADER_RANGE = "ZipPurchaseOrders!A:W";
// SUPERVISOR Sheet range - adjust sheet name and range as needed
const SUPERVISOR_RANGE = "Index!A:J"; // Change "Sheet1" to your actual sheet name

const ZipGateEntry = () => {
  const navigate = useNavigate();
  
  const [lotNumber, setLotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [zipEntries, setZipEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState('');
  const [gateInPerson, setGateInPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [showLotSelector, setShowLotSelector] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [supervisorData, setSupervisorData] = useState(null);

  // Function to fetch supervisor data for a Lot Number from the separate sheet
  const fetchSupervisorData = async (lotNumber) => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SUPERVISOR_SHEET_ID}/values/${encodeURIComponent(SUPERVISOR_RANGE)}?key=${API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Sheets API error: ${resp.status}`);
      const data = await resp.json();
      const values = data.values || [];
      
      if (values.length === 0) return null;
      
      const headers = values[0];
      const lotColumnIndex = headers.findIndex(h => h === 'Lot Number');
      const supervisorColumnIndex = headers.findIndex(h => h === 'Supervisor');
      const dateOfIssueIndex = headers.findIndex(h => h === 'Date of Issue');
      const fabricIndex = headers.findIndex(h => h === 'Fabric');
      const garmentTypeIndex = headers.findIndex(h => h === 'Garment Type');
      const styleIndex = headers.findIndex(h => h === 'Style');
      
      if (lotColumnIndex === -1) {
        console.warn('Lot Number column not found in supervisor sheet');
        return null;
      }
      
      // Find row matching this lot number
      const matchingRow = values.slice(1).find(row => 
        String(row[lotColumnIndex] || '').trim() === String(lotNumber).trim()
      );
      
      if (matchingRow) {
        return {
          supervisorName: supervisorColumnIndex !== -1 ? matchingRow[supervisorColumnIndex] || 'Not assigned' : 'Not found',
          dateOfIssue: dateOfIssueIndex !== -1 ? matchingRow[dateOfIssueIndex] || '' : '',
          fabric: fabricIndex !== -1 ? matchingRow[fabricIndex] || '' : '',
          garmentType: garmentTypeIndex !== -1 ? matchingRow[garmentTypeIndex] || '' : '',
          style: styleIndex !== -1 ? matchingRow[styleIndex] || '' : '',
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching supervisor data:', err);
      return null;
    }
  };

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
      
      return {
        ...entry,
        uniqueKey,
        totalPieces,
        hasValidSelections,
        selectedColorsCount,
        isSelected: false,
        rowIndex: idx
      };
    });
    
    // Sort entries: those with valid selections first, then by total pieces (highest first)
    entries.sort((a, b) => {
      if (a.hasValidSelections !== b.hasValidSelections) {
        return b.hasValidSelections ? 1 : -1;
      }
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

  // Handle Lot Number submission
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
    setSupervisorData(null);
    
    try {
      // Fetch both ZIP entries and Supervisor data in parallel
      const [entries, supervisor] = await Promise.all([
        fetchAllZipEntries(lotNumber.trim()),
        fetchSupervisorData(lotNumber.trim())
      ]);
      
      // Set supervisor data
      if (supervisor) {
        setSupervisorData(supervisor);
      } else {
        setSupervisorData(null);
      }
      
      // Filter entries that are not already gated in
      const availableEntries = entries.filter(entry => 
        !entry['Gate Entry Date'] || entry['Gate Entry Date'] === ''
      );
      
      if (availableEntries.length === 0) {
        setError(`All entries for Lot Number ${lotNumber} have already been gated in.`);
        setZipEntries([]);
        setLoading(false);
        return;
      }
      
      if (availableEntries.length === 1) {
        // Single entry - select it directly
        setSelectedEntry(availableEntries[0]);
        setZipEntries([]);
      } else {
        // Multiple entries - show selector
        setZipEntries(availableEntries);
        setShowLotSelector(true);
        setError(`⚠️ Found ${availableEntries.length} entries for Lot ${lotNumber}. Please select the correct one.`);
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
    setSelectedEntry(entry);
    setShowLotSelector(false);
    setError('');
    setZipEntries([]);
  };

  // Submit Gate Entry using iframe with Total Pieces as unique key
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
      iframe.name = 'hiddenFrameZip';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create a hidden form
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = WEB_APP_BASE;
      form.target = 'hiddenFrameZip';
      form.style.display = 'none';
      
      // Add all parameters including total pieces as unique key
      const params = {
        action: 'saveGateEntry',
        lotNumber: lotNumber,
        gatePerson: gateInPerson,
        totalPieces: selectedEntry.totalPieces.toString() // ← Send Total Pieces as unique key
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
      
      const successMsg = `✅ ZIP Gate Entry Recorded Successfully!

Lot Number: ${lotNumber}
Total Pieces: ${selectedEntry.totalPieces}
Gate Entry By: ${gateInPerson}
Gate Entry Time: ${new Date().toLocaleString()}
Selected Colors: ${selectedEntry.selectedColorsCount}
${supervisorData ? `👨‍💼 Stitching Supervisor: ${supervisorData.supervisorName}` : ''}
${locationCaptured ? `📍 Location: ${locationCaptured.lat.toFixed(6)}, ${locationCaptured.lng.toFixed(6)}` : '📍 Location: Not captured'}

Gate entry has been recorded.`;
      
      setSuccessMessage(successMsg);
      
      // Refresh the data to show updated status
      setTimeout(async () => {
        try {
          const entries = await fetchAllZipEntries(lotNumber);
          const updatedEntry = entries.find(e => e.totalPieces === selectedEntry.totalPieces);
          if (updatedEntry) {
            setSelectedEntry(updatedEntry);
          }
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
      
      // Reset form after success
      setTimeout(() => {
        setLotNumber('');
        setSelectedEntry(null);
        setGateInPerson('');
        setLocationCaptured(null);
        setSupervisorData(null);
        setSubmitting(false);
        setSuccessMessage('');
        navigate('/zip');
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
      
      <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>🚪 ZIP Gate Entry (IN)</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Record gate entry for ZIP/Lot material</p>
      
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
        <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Enter Lot Number for Gate Entry</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter Lot Number (e.g., 11142)"
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

      {/* Supervisor Info Display - New Section */}
      {supervisorData && !showLotSelector && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>👨‍💼</span>
            <strong style={{ color: '#92400e' }}>Stitching Supervisor Information</strong>
          </div>
          <div style={{ fontSize: '15px', color: '#78350f' }}>
            <strong>Supervisor Name:</strong> {supervisorData.supervisorName}
            {supervisorData.dateOfIssue && (
              <> &nbsp;| <strong>Date of Issue:</strong> {supervisorData.dateOfIssue}</>
            )}
          </div>
          {(supervisorData.fabric || supervisorData.garmentType || supervisorData.style) && (
            <div style={{ fontSize: '13px', color: '#92400e', marginTop: '6px' }}>
              {supervisorData.fabric && <span>🧵 Fabric: {supervisorData.fabric}</span>}
              {supervisorData.garmentType && <span> &nbsp;| 👕 Garment: {supervisorData.garmentType}</span>}
              {supervisorData.style && <span> &nbsp;| 🎽 Style: {supervisorData.style}</span>}
            </div>
          )}
        </div>
      )}
      
      {/* Multiple Entries Selector */}
      {showLotSelector && zipEntries.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#92400e' }}>
            ⚠️ Multiple Orders Found for Lot {lotNumber}
          </h3>
          <p style={{ marginBottom: '16px', color: '#64748b' }}>
            Please select the correct order for gate entry:
          </p>
          
          {zipEntries.map((entry, idx) => (
            <div
              key={entry.uniqueKey}
              style={{
                border: entry.hasValidSelections ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                backgroundColor: entry.hasValidSelections ? '#f0fdf4' : '#fef3c7',
                transition: 'all 0.2s'
              }}
              onClick={() => handleSelectEntry(entry)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <strong>Order #{idx + 1}</strong>
                    {entry.hasValidSelections && (
                      <span style={{ 
                        backgroundColor: '#10b981', 
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
                    {/* <div>🎨 Zip Selections: {formatZipSelections(entry['Zip Selections'])}</div> */}
                    <div>👕 Garment: {entry['Garment Type'] || 'N/A'} - {entry['Style'] || 'N/A'}</div>
                    {supervisorData && (
                      <div style={{ color: '#92400e', marginTop: '4px' }}>
                        👨‍💼 Supervisor: {supervisorData.supervisorName}
                      </div>
                    )}
                    {entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '' && (
                      <div style={{ color: '#dc2626', marginTop: '8px' }}>
                        ⚠️ Already gated in on {entry['Gate Entry Date']}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectEntry(entry);
                  }}
                  disabled={entry['Gate Entry Date'] && entry['Gate Entry Date'] !== ''}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '') ? '#94a3b8' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (entry['Gate Entry Date'] && entry['Gate Entry Date'] !== '') ? 'not-allowed' : 'pointer',
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
              {/* <div><strong>Style:</strong> {selectedEntry['Style'] || 'N/A'}</div> */}
              {/* <div><strong>Fabric:</strong> {selectedEntry['Fabric'] || 'N/A'}</div> */}
              <div><strong>Total Pieces:</strong> <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '18px' }}>{selectedEntry.totalPieces.toLocaleString()}</span></div>
              {/* <div><strong>Selected Colors:</strong> {selectedEntry.selectedColorsCount}</div> */}
              <div><strong>Issue Date:</strong> {selectedEntry['Issue Date'] || 'N/A'}</div>
              <div><strong>Supervisor:</strong> {selectedEntry['Supervisor'] || (supervisorData?.supervisorName || 'N/A')}</div>
              {/* <div><strong>Zip Selections:</strong> {formatZipSelections(selectedEntry['Zip Selections'])}</div> */}
              <div><strong>Total Cost:</strong> {selectedEntry['Total Cost (₹)'] ? `₹${parseInt(selectedEntry['Total Cost (₹)']).toLocaleString()}` : 'N/A'}</div>
              <div><strong>Supplier Name:</strong> {selectedEntry['Supplier Name'] || 'Not entered yet'}</div>
            </div>
            
            {/* Display Supervisor Info inside selected entry if not already shown */}
            {supervisorData && !showLotSelector && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <strong style={{ color: '#92400e' }}>👨‍💼 Stitching Supervisor:</strong>{' '}
                <span style={{ color: '#78350f' }}>{supervisorData.supervisorName}</span>
                {supervisorData.dateOfIssue && (
                  <span style={{ color: '#78350f', marginLeft: '16px' }}>
                    📅 Issue Date: {supervisorData.dateOfIssue}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Gate Entry Button */}
          {(!selectedEntry['Gate Entry Date'] || selectedEntry['Gate Entry Date'] === '') && (
            <div style={{
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪➡️</div>
              <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>Ready for ZIP Gate Entry</h3>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Confirm gate entry for Lot Number: <strong>{lotNumber}</strong>
              </p>
              <div style={{ 
                background: '#f0fdf4', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#059669' }}>✓ Order Date: {new Date(selectedEntry['Timestamp']).toLocaleDateString()}</span><br/>
                <span style={{ color: '#059669' }}>✓ Total Pieces: {selectedEntry.totalPieces.toLocaleString()}</span>
                {selectedEntry.selectedColorsCount > 0 && (
                  <><br/><span style={{ color: '#059669' }}>✓ Selected Colors: {selectedEntry.selectedColorsCount}</span></>
                )}
                {supervisorData && (
                  <><br/><span style={{ color: '#059669' }}>✓ Supervisor: {supervisorData.supervisorName}</span></>
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
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {submitting ? '⏳ Processing...' : '✅ Confirm Gate Entry'}
              </button>
            </div>
          )}
          
          {/* Show if already gated in */}
          {selectedEntry['Gate Entry Date'] && selectedEntry['Gate Entry Date'] !== '' && (
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
                This order was gated in on {selectedEntry['Gate Entry Date']} by {selectedEntry['Gate Entry Person']}
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
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Confirm ZIP Gate Entry</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Confirm gate entry for Lot Number: <strong>{lotNumber}</strong>
            </p>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              Total Pieces: <strong>{selectedEntry?.totalPieces.toLocaleString()}</strong>
            </p>
            {supervisorData && (
              <p style={{ color: '#92400e', marginBottom: '20px', fontSize: '14px', background: '#fef3c7', padding: '8px', borderRadius: '6px' }}>
                👨‍💼 Supervisor: {supervisorData.supervisorName}
              </p>
            )}
            
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

export default ZipGateEntry;
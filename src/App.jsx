import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GateSplashScreen from './GateSplashScreen.jsx';
import Dashboard from './Dashboard.jsx';
// import ZipDetail from './ZipDetail.jsx';
import DoriDetail from './DoriDetail.jsx';
import PoEntrance from './PoEntrance.jsx';
import GateInEntry from './GateInEntry.jsx';
import MaterialReceivedEntry from './MaterialReceivedEntry.jsx';
import RgpEntrance from './RgpEntrance.jsx';
import RgpGateOut from './RgpGateOut.jsx';
import RgpGateEntry from './RgpGateEntry.jsx';
import RgpMaterialIn from './RgpMaterialIn.jsx';
import ZipEntrance from './ZipEntrance.jsx';
import ZipGateEntry from './ZipGateEntry.jsx';
import ZipReceivedBy from './ZipReceivedBy.jsx';
import DoriEntrance from './DoriEntrance.jsx';
import DoriGateEntry from './DoriGateEntry.jsx';
import DoriMaterialReceived from './DoriMaterialReceived.jsx';
// import DoriEntrance from './DoriEntrance.jsx';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleSplashFinish = () => {
    console.log('Splash screen finished');
    setShowDashboard(true);
  };

  return (
    <Router>
      {!showDashboard && (
        <GateSplashScreen 
          duration={2800} 
          onFinish={handleSplashFinish}
          logoUrl={null}
        />
      )}
      
      {showDashboard && (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zip" element={<ZipEntrance />} />
          {/* <Route path="/dori" element={<DoriDetail />} /> */}
          <Route path="/po" element={<PoEntrance />} />
          <Route path="/gate-in-entry" element={<GateInEntry />} />
          <Route path="/material-received-entry" element={<MaterialReceivedEntry />} />
          <Route path="/rgp" element={<RgpEntrance />} />
            <Route path="/rgp-out" element={<RgpGateOut />} />
              <Route path="/rgp-gate-in" element={<RgpGateEntry />} />
                <Route path="/rgp-material-in" element={<RgpMaterialIn />} />
                    <Route path="/zip-gate-in" element={<ZipGateEntry />} />
                     <Route path="/zip-received-by" element={<ZipReceivedBy />} />
                     <Route path="/dori" element={<DoriEntrance />} />
                     <Route path="/dori-gate-in" element={<DoriGateEntry />} />
                      <Route path="/dori-received-by" element={<DoriMaterialReceived />} />
        </Routes>
      )}
    </Router>
  );
}

export default App; 
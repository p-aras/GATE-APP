import React, { useEffect, useState } from 'react';

const GateSplashScreen = ({ duration = 2500, onFinish, logoUrl }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (duration / 50);
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onFinish]);

  if (!isVisible) return null;

  // Industrial/Factory theme styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a1a',
      backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Segoe UI', 'Roboto', system-ui, sans-serif",
    },
    container: {
      textAlign: 'center',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
      margin: '0 auto',
    },
    logoWrapper: {
      marginBottom: '32px',
    },
    logo: {
      width: 'clamp(100px, 30vw, 150px)',
      height: 'auto',
      marginBottom: '16px',
      filter: 'drop-shadow(0 0 20px rgba(52, 152, 219, 0.3))',
    },
    title: {
      fontSize: 'clamp(32px, 8vw, 48px)',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #3498db 0%, #2ecc71 50%, #3498db 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: 'clamp(14px, 4vw, 18px)',
      color: '#bdc3c7',
      fontWeight: 500,
      letterSpacing: '1px',
    },
    factoryBadge: {
      display: 'inline-block',
      backgroundColor: 'rgba(52, 152, 219, 0.15)',
      backdropFilter: 'blur(8px)',
      borderRadius: '40px',
      padding: '6px 18px',
      marginTop: '16px',
      fontSize: 'clamp(11px, 3.5vw, 13px)',
      fontWeight: 600,
      color: '#3498db',
      border: '1px solid rgba(52, 152, 219, 0.3)',
    },
    loadingSection: {
      marginTop: '48px',
      width: '100%',
    },
    progressBarContainer: {
      width: '100%',
      height: '6px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '16px',
    },
    progressFill: {
      width: `${progress}%`,
      height: '100%',
      background: 'linear-gradient(90deg, #3498db, #2ecc71)',
      borderRadius: '10px',
      transition: 'width 0.05s linear',
    },
    loadingText: {
      fontSize: 'clamp(12px, 3.5vw, 14px)',
      color: '#95a5a6',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    footer: {
      position: 'absolute',
      bottom: 'clamp(20px, 6vh, 40px)',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 'clamp(10px, 3vw, 12px)',
      color: '#7f8c8d',
    },
    poweredBy: {
      opacity: 0.7,
    },
  };

  const keyframesStyle = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }
  `;

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={{ ...styles.logoWrapper, animation: 'fadeInUp 0.6s ease-out' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Factory Logo" style={styles.logo} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <svg
                  width="clamp(90px, 25vw, 130px)"
                  height="clamp(90px, 25vw, 130px)"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ margin: '0 auto', display: 'block' }}
                >
                  {/* Factory building icon */}
                  <rect x="20" y="50" width="80" height="50" fill="rgba(52,152,219,0.2)" stroke="#3498db" strokeWidth="2" rx="2"/>
                  <rect x="35" y="65" width="15" height="20" fill="#3498db" opacity="0.6"/>
                  <rect x="55" y="65" width="15" height="20" fill="#3498db" opacity="0.6"/>
                  <rect x="75" y="65" width="15" height="20" fill="#3498db" opacity="0.6"/>
                  <rect x="45" y="25" width="30" height="25" fill="rgba(46,204,113,0.3)" stroke="#2ecc71" strokeWidth="2"/>
                  <rect x="50" y="35" width="8" height="15" fill="#2ecc71" opacity="0.7"/>
                  <rect x="62" y="35" width="8" height="15" fill="#2ecc71" opacity="0.7"/>
                  {/* Smoke from chimney */}
                  <circle cx="60" cy="20" r="4" fill="#95a5a6" opacity="0.4">
                    <animate attributeName="cy" values="20;10;5" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="60" cy="20" r="3" fill="#95a5a6" opacity="0.3">
                    <animate attributeName="cy" values="20;8;2" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0.1;0" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  {/* Gate icon */}
                  <path d="M30 100 L30 85 L90 85 L90 100" stroke="#2ecc71" strokeWidth="2" fill="none" strokeDasharray="5,5">
                    <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite"/>
                  </path>
                </svg>
              </div>
            )}
            <h1 style={styles.title}>Factory<span style={{ fontSize: '0.7em', marginLeft: '4px' }}>Gate</span></h1>
            <p style={styles.subtitle}>Industrial Access Management System</p>
            <div style={styles.factoryBadge}>
              🏭 Secure Entry • Real-time Monitoring • Access Control
            </div>
          </div>

          <div style={styles.loadingSection}>
            <div style={styles.progressBarContainer}>
              <div style={styles.progressFill} />
            </div>
            <p style={styles.loadingText}>
              {progress < 30 && "🔐 Initializing security protocols..."}
              {progress >= 30 && progress < 70 && "🚪 Synchronizing gate systems..."}
              {progress >= 70 && progress < 100 && "⚙️ Loading employee database..."}
              {progress === 100 && "✅ Gate ready!"}
            </p>
          </div>

          <div style={styles.footer}>
            <p style={styles.poweredBy}>Factory Gate Security System v2.0 | Authorized access only</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GateSplashScreen;
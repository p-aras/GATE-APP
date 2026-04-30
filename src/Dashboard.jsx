import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Card data configuration
  const cards = [
    {
      id: 'zip',
      title: 'Zip',
      path: '/zip',
      subtitle: 'Manage zip codes & regions',
      icon: '📍',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      stats: '24 active',
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.1)',
      detailContent: {
        title: 'Zip Code Management',
        description: 'Comprehensive zip code management system with real-time tracking',
        metrics: [
          { label: 'Active Zones', value: '24', change: '+12%' },
          { label: 'Coverage Area', value: '15,000 km²', change: '+5%' },
          { label: 'Delivery Points', value: '3,245', change: '+8%' },
          { label: 'Success Rate', value: '98.5%', change: '+2%' }
        ],
        recentActivities: [
          'New zip code 90210 added',
          'Zone optimization completed',
          '3 delivery routes updated'
        ]
      }
    },
    {
      id: 'dori',
      title: 'Dori',
      path: '/dori',
      subtitle: 'Track deliveries & routes',
      icon: '🚚',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      stats: '12 ongoing',
      color: '#3b82f6',
      bgLight: 'rgba(59, 130, 246, 0.1)',
      detailContent: {
        title: 'Delivery Tracking',
        description: 'Real-time delivery tracking and route optimization system',
        metrics: [
          { label: 'Active Deliveries', value: '12', change: '+3' },
          { label: 'On-Time Rate', value: '94.2%', change: '+5%' },
          { label: 'Total Distance', value: '847 km', change: '-2%' },
          { label: 'Avg Delivery Time', value: '32 min', change: '-8%' }
        ],
        recentActivities: [
          'Route optimization completed',
          'New delivery assigned to Zone A',
          'Driver performance updated'
        ]
      }
    },
    {
      id: 'rgp',
      title: 'RGP',
      path: '/rgp',
      subtitle: 'Resource management',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      stats: '86% efficient',
      color: '#3b82f6',
      bgLight: 'rgba(96, 165, 250, 0.1)',
      detailContent: {
        title: 'Resource Management',
        description: 'Efficient resource allocation and performance tracking',
        metrics: [
          { label: 'Efficiency', value: '86%', change: '+7%' },
          { label: 'Resources Used', value: '1,234', change: '+15%' },
          { label: 'Cost Savings', value: '$45.2K', change: '+23%' },
          { label: 'Team Members', value: '48', change: '+4' }
        ],
        recentActivities: [
          'Resource allocation optimized',
          'New team member onboarded',
          'Budget review completed'
        ]
      }
    },
    {
      id: 'po',
      title: 'PO',
      path: '/po',
      subtitle: 'Purchase orders',
      icon: '📋',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      stats: '156 orders',
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.1)',
      detailContent: {
        title: 'Purchase Orders',
        description: 'Complete purchase order management and tracking system',
        metrics: [
          { label: 'Total Orders', value: '156', change: '+18%' },
          { label: 'Pending Approval', value: '23', change: '-5%' },
          { label: 'Total Value', value: '$234K', change: '+32%' },
          { label: 'Suppliers', value: '34', change: '+2' }
        ],
        recentActivities: [
          'New PO #PO-2024-001 created',
          '3 orders approved for shipment',
          'Supplier evaluation completed'
        ]
      }
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            min-height: 100vh;
          }

          .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px 32px;
          }

          .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background: #ffffff;
            border-radius: 80px;
            margin-bottom: 18px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .nav-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .logo-icon {
            font-size: 28px;
          }

          .logo-text {
            font-size: 22px;
            font-weight: 700;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .nav-links {
            display: flex;
            gap: 8px;
          }

          .nav-link {
            padding: 8px 20px;
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            border-radius: 40px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .nav-link.active {
            background: #eff6ff;
            color: #2563eb;
          }

          .nav-link:hover {
            background: #f8fafc;
            color: #1e40af;
          }

          .avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
          }

          .hero-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-radius: 48px;
            padding: 60px 48px;
            margin-bottom: 56px;
            position: relative;
            overflow: hidden;
            border: 1px solid #bfdbfe;
          }

          .hero-content {
            position: relative;
            z-index: 2;
          }

          .hero-badge {
            display: inline-block;
            padding: 6px 14px;
            background: #ffffff;
            border: 1px solid #bfdbfe;
            border-radius: 40px;
            font-size: 13px;
            color: #2563eb;
            margin-bottom: 24px;
          }

          .hero-title {
            font-size: 52px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
            margin-bottom: 20px;
          }

          .hero-gradient {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .hero-subtitle {
            font-size: 18px;
            color: #475569;
            max-width: 500px;
            margin-bottom: 32px;
            line-height: 1.5;
          }

          .hero-stats {
            display: flex;
            gap: 40px;
          }

          .hero-stat {
            display: flex;
            flex-direction: column;
          }

          .hero-stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
          }

          .hero-stat-label {
            font-size: 13px;
            color: #64748b;
          }

          .hero-decoration {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            pointer-events: none;
          }

          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
          }

          .orb-1 {
            width: 300px;
            height: 300px;
            background: #3b82f6;
            top: -100px;
            right: -50px;
            opacity: 0.15;
          }

          .orb-2 {
            width: 200px;
            height: 200px;
            background: #60a5fa;
            bottom: -50px;
            right: 100px;
            opacity: 0.1;
          }

          .orb-3 {
            width: 150px;
            height: 150px;
            background: #2563eb;
            bottom: 50px;
            left: -50px;
            opacity: 0.08;
          }

          .section-header {
            margin-bottom: 32px;
          }

          .section-title {
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
          }

          .section-subtitle {
            font-size: 15px;
            color: #64748b;
          }

          .cards-section {
            margin-bottom: 56px;
          }

          .cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }

          .card {
            background: #ffffff;
            border-radius: 28px;
            padding: 28px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .card:hover {
            transform: translateY(-6px);
            border-color: #bfdbfe;
            box-shadow: 0 20px 25px -12px rgba(37, 99, 235, 0.15);
          }

          .card-glow {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .card:hover .card-glow {
            opacity: 1;
          }

          .card-icon-wrapper {
            width: 56px;
            height: 56px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }

          .card-icon {
            font-size: 28px;
          }

          .card-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 6px;
          }

          .card-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 16px;
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .card-stats {
            font-size: 12px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: 30px;
          }

          .card-arrow {
            font-size: 18px;
            color: #94a3b8;
            transition: transform 0.2s ease;
          }

          .card:hover .card-arrow {
            transform: translateX(4px);
            color: #2563eb;
          }

          .recent-section {
            background: #f8fafc;
            border-radius: 32px;
            padding: 32px;
            border: 1px solid #e2e8f0;
          }

          .activity-timeline {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .timeline-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .timeline-item:last-child {
            border-bottom: none;
          }

          .timeline-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          .timeline-content {
            flex: 1;
          }

          .timeline-text {
            font-size: 14px;
            color: #334155;
            margin-bottom: 4px;
          }

          .timeline-module {
            font-size: 12px;
            font-weight: 500;
          }

          .timeline-time {
            font-size: 12px;
            color: #94a3b8;
          }

          @media (max-width: 1100px) {
            .cards-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .dashboard-container {
              padding: 16px;
            }
            
            .hero-title {
              font-size: 36px;
            }
            
            .hero-section {
              padding: 40px 24px;
            }
            
            .cards-grid {
              gap: 16px;
            }
            
            .card {
              padding: 20px;
            }
          }

          @media (max-width: 610px) {
            .nav-links {
              display: none;
            }
            
            .cards-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      
      <div className="dashboard-container">
        <nav className="navbar">
          <div className="nav-brand">
            <div className="logo-icon">✨</div>
            <span className="logo-text">GATEAPP</span>
          </div>
          <div className="nav-links">
            <button className="nav-link active">Dashboard</button>
            <button className="nav-link">Analytics</button>
            <button className="nav-link">Settings</button>
          </div>
          <div className="nav-avatar">
            <div className="avatar">MH</div>
          </div>
        </nav>

        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">✨ Welcome back, John</div>
            <h1 className="hero-title">
              Manage your workflow<br />
              <span className="hero-gradient">efficiently</span>
            </h1>
            {/* <p className="hero-subtitle">
              Get a complete overview of your operations with real-time insights and analytics.
            </p> */}
            {/* <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">98%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">24/7</span>
                <span className="hero-stat-label">Support</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">4</span>
                <span className="hero-stat-label">Modules</span>
              </div>
            </div> */}
          </div>
          <div className="hero-decoration">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
        </div>

        <div className="cards-section">
          <div className="section-header">
            <h2 className="section-title">Core Modules</h2>
            <p className="section-subtitle">Access and manage your key business modules</p>
          </div>
          <div className="cards-grid">
            {cards.map((card) => (
              <div
                key={card.id}
                className="card"
                onClick={() => handleCardClick(card.path)}
              >
                <div className="card-glow" style={{ background: card.gradient }}></div>
                <div className="card-icon-wrapper" style={{ background: card.bgLight }}>
                  <span className="card-icon" style={{ color: card.color }}>{card.icon}</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-subtitle">{card.subtitle}</p>
                  <div className="card-footer">
                    <span className="card-stats" style={{ background: card.bgLight, color: card.color }}>
                      {card.stats}
                    </span>
                    <span className="card-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <p className="section-subtitle">Latest updates across all modules</p>
          </div>
          <div className="activity-timeline">
            {cards.flatMap(card => 
              card.detailContent.recentActivities.slice(0, 2).map((activity, idx) => ({
                activity,
                icon: card.icon,
                color: card.color,
                bgLight: card.bgLight,
                module: card.title
              }))
            ).slice(0, 6).map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-icon" style={{ background: item.bgLight }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <div className="timeline-content">
                  <p className="timeline-text">{item.activity}</p>
                  <span className="timeline-module" style={{ color: item.color }}>{item.module}</span>
                </div>
                <div className="timeline-time">2 min ago</div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Dashboard;
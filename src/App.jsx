import React, { useState, useEffect } from 'react';
import { 
  TrafficCone, Rocket, LogIn, Eye, EyeOff, User, 
  UserCheck, Shield, Mail, Lock, Phone, MapPin, 
  AlertTriangle, Star, CheckCircle, Info, Menu, 
  Satellite, Bell, BarChart3, Users, Route, Activity,
  LayoutDashboard, Sliders, ToggleLeft, Layers, Settings,
  Search, FileText, Database, Server, HardDrive, Play,
  Pause, RefreshCw, Power
} from 'lucide-react';
import './App.css';

// ══════════════════════════════════════════
// DATA MODEL & INITIAL CONFIGS
// ══════════════════════════════════════════
const initialIntersections = [
  { id: 1, name: 'Main St & 1st Ave',    signal: 'green',  congestion: 'Low',      vehicles: 14, wait: 18 },
  { id: 2, name: 'Park Rd & Central',    signal: 'red',    congestion: 'High',     vehicles: 47, wait: 85 },
  { id: 3, name: 'Harbor Blvd & 5th',    signal: 'yellow', congestion: 'Moderate', vehicles: 31, wait: 42 },
  { id: 4, name: 'Station Rd & Market',  signal: 'green',  congestion: 'Low',      vehicles: 9,  wait: 14 },
  { id: 5, name: 'Airport Rd & Ring Rd', signal: 'red',    congestion: 'High',     vehicles: 58, wait: 120 },
];

const demoUsers = [
  { email: 'public@demo.com',   password: 'demo123', role: 'public',   name: 'Alex Johnson',    avatar: 'AJ' },
  { email: 'operator@demo.com', password: 'demo123', role: 'operator', name: 'Sarah Chen',       avatar: 'SC' },
  { email: 'admin@demo.com',    password: 'demo123', role: 'admin',    name: 'Dr. Raj Patel',    avatar: 'RP' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'login', 'register'
  const [loginRole, setLoginRole] = useState('public');
  const [loginEmail, setLoginEmail] = useState('public@demo.com');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Registration States
  const [regFName, setRegFName] = useState('');
  const [regLName, setRegLName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regTerms, setRegTerms] = useState(false);
  const [regAlerts, setRegAlerts] = useState(true);
  const [pwdStrength, setPwdStrength] = useState({ score: 0, text: '', class: '' });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Admin Dashboard States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ruleAdaptive, setRuleAdaptive] = useState(true);
  const [ruleEmergency, setRuleEmergency] = useState(true);
  const [ruleCongestion, setRuleCongestion] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({
    database: true,
    backend: true,
    sumo: true,
    websocket: true
  });
  const [ruleAlerts, setRuleAlerts] = useState([
    { id: 1, type: 'critical', text: 'Intersection Main St & 1st Ave: Wait time exceeded 120s', time: '19:40:12' },
    { id: 2, type: 'warning', text: 'SUMO Simulator latency spike: 230ms response threshold reached', time: '19:35:45' },
    { id: 3, type: 'critical', text: 'Controller Park Rd & Central offline. Initiating backup sequence', time: '19:12:03' }
  ]);
  const [controllerLogs, setControllerLogs] = useState([
    { time: '19:42:15', event: 'Applied Adaptive Green timing recommending 45s (Main St)' },
    { time: '19:40:02', event: 'Priority Preemption triggered: Emergency vehicle detected (Harbor Blvd)' },
    { time: '19:38:44', event: 'Database connection pools optimized (Active sessions: 14)' },
    { time: '19:35:10', event: 'SUMO simulation step sync complete (Step: 45000)' },
    { time: '19:30:00', event: 'Automated health audit: All nodes check passed (Uptime: 45h)' }
  ]);

  // Simulation State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [vehiclesCount, setVehiclesCount] = useState(159);
  const [isScrolled, setIsScrolled] = useState(false);

  // ══════════════════════════════════════════
  // SIMULATION TICKER & SCROLL EVENT
  // ══════════════════════════════════════════
  useEffect(() => {
    // Timer
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Random Traffic Fluctuations
    const trafficInterval = setInterval(() => {
      setVehiclesCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(140, Math.min(prev + delta, 260));
      });
    }, 4000);

    // Scroll Navbar effect
    const handleScroll = () => {
      if (window.scrollY > 30) setIsScrolled(true);
      else setIsScrolled(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(timer);
      clearInterval(trafficInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ══════════════════════════════════════════
  // HELPER ACTIONS
  // ══════════════════════════════════════════
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const getCongestionClass = (level) => {
    if (level === 'Low') return 'congestion-low';
    if (level === 'Moderate') return 'congestion-moderate';
    return 'congestion-high';
  };

  const handleRoleTabChange = (role) => {
    setLoginRole(role);
    const demo = demoUsers.find(u => u.role === role);
    if (demo) {
      setLoginEmail(demo.email);
      setLoginPassword(demo.password);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    addToast('Authenticating...', 'info');

    setTimeout(() => {
      const match = demoUsers.find(u => u.email === loginEmail && u.password === loginPassword);
      if (match) {
        addToast(`Success! Welcome, ${match.name}.`, 'success');
        setTimeout(() => {
          if (match.role === 'admin') {
            setCurrentPage('admin_dashboard');
          } else {
            setCurrentPage('landing');
          }
        }, 1000);
      } else {
        addToast('Invalid credentials. Please try demo settings.', 'error');
      }
    }, 800);
  };

  const checkPasswordStrength = (val) => {
    setRegPassword(val);
    if (!val) {
      setPwdStrength({ score: 0, text: '', class: '' });
      return;
    }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
      setPwdStrength({ score, text: 'Weak password', class: 'weak' });
    } else if (score <= 2) {
      setPwdStrength({ score, text: 'Medium password', class: 'medium' });
    } else {
      setPwdStrength({ score, text: 'Strong password ✓', class: 'strong' });
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regFName || !regLName) { addToast('Please enter your full name.', 'error'); return; }
    if (!regEmail.includes('@')) { addToast('Please enter a valid email address.', 'error'); return; }
    if (regPassword.length < 6) { addToast('Password must be at least 6 characters.', 'error'); return; }
    if (regPassword !== regConfirm) { addToast('Passwords do not match.', 'error'); return; }
    if (!regTerms) { addToast('Please accept the Terms of Service.', 'error'); return; }

    addToast('Creating your account...', 'info');
    setTimeout(() => {
      addToast(`Account created for ${regFName}! Logged in successfully.`, 'success');
      setTimeout(() => {
        setCurrentPage('landing');
      }, 1000);
    }, 1200);
  };

  const smoothScroll = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Toast Alert List */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              {t.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success)' }} />}
              {t.type === 'error' && <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />}
              {t.type === 'info' && <Info size={18} style={{ color: 'var(--primary)' }} />}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ──────────────────────────────────────────
          PAGE ROUTER
          ────────────────────────────────────────── */}
      {currentPage === 'landing' && (
        <div className="page-enter">
          {/* Header */}
          <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-inner">
              <div className="logo" onClick={() => setCurrentPage('landing')}>
                <div className="logo-icon">
                  <i className="fas fa-traffic-light"></i>
                </div>
                <span className="logo-text">Urban<span>Flow</span></span>
              </div>
              <div className="nav-links">
                <a className="nav-link" onClick={() => smoothScroll('features')}>Features</a>
                <a className="nav-link" onClick={() => smoothScroll('how-it-works')}>How It Works</a>
                <a className="nav-link" onClick={() => smoothScroll('roles')}>User Roles</a>
              </div>
              <div className="nav-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('login')}>
                  <LogIn size={15} /> Sign In
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('register')}>
                  Get Started
                </button>
              </div>
            </div>
          </nav>

          {/* HERO */}
          <section className="hero">
            <div className="hero-bg"></div>
            <div className="hero-grid-overlay"></div>
            <div className="container">
              <div className="hero-inner">
                <div className="hero-content animate-fade-up">
                  <div className="hero-badge">
                    <span className="dot"></span>
                    <span>Live Traffic Monitoring Active</span>
                  </div>
                  <h1 className="hero-title">
                    Smart Traffic<br/>
                    <span className="highlight">Signal Control</span><br/>
                    for Modern Cities
                  </h1>
                  <p className="hero-desc">
                    UrbanFlow monitors real-time traffic conditions across multiple intersections, 
                    optimizes signal timings adaptively, and manages incidents to keep your city 
                    moving efficiently.
                  </p>
                  <div className="hero-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('register')}>
                      <Rocket size={18} /> Get Started Free
                    </button>
                    <button className="btn btn-ghost btn-lg" onClick={() => setCurrentPage('login')}>
                      <LogIn size={18} /> Sign In
                    </button>
                  </div>
                  <div className="hero-stats">
                    <div className="hero-stat-item">
                      <span className="hero-stat-value" style={{ color: 'var(--primary)' }}>5</span>
                      <span className="hero-stat-label">Intersections</span>
                    </div>
                    <div className="hero-stat-item">
                      <span className="hero-stat-value" style={{ color: 'var(--success)' }}>{vehiclesCount}</span>
                      <span className="hero-stat-label">Vehicles Now</span>
                    </div>
                    <div className="hero-stat-item">
                      <span className="hero-stat-value" style={{ color: 'var(--warning-dark)' }}>24/7</span>
                      <span className="hero-stat-label">Monitoring</span>
                    </div>
                    <div className="hero-stat-item">
                      <span className="hero-stat-value" style={{ color: 'var(--primary)' }}>99.9%</span>
                      <span className="hero-stat-label">Uptime</span>
                    </div>
                  </div>
                </div>

                <div className="hero-visual animate-slide-right">
                  {/* Top row: stats side-by-side */}
                  <div className="hero-visual-row">
                    <div className="floating-card floating-card-1">
                      <div className="floating-label">Active Incidents</div>
                      <div className="floating-value" style={{ color: '#ef4444' }}>3</div>
                      <div className="floating-change">Under Review</div>
                    </div>
                    <div className="floating-card floating-card-2">
                      <div className="floating-label">Avg Wait Time</div>
                      <div className="floating-value">34s</div>
                      <div className="floating-change">-12% today</div>
                    </div>
                  </div>

                  {/* Centre Dashboard Card */}
                  <div className="hero-dashboard-card">
                    <div className="hero-dashboard-topbar">
                      <span className="hero-dashboard-title">
                        <i className="fas fa-traffic-light"></i> Traffic Control Centre
                      </span>
                      <span className="hero-dashboard-time">{currentTime}</span>
                    </div>
                    <div className="hero-dashboard-body">
                      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Live Intersections
                      </div>
                      <div className="intersection-row">
                        {initialIntersections.slice(0, 4).map(i => (
                          <div key={i.id} className="intersection-item">
                            <div className={`intersection-signal ${i.signal}`}></div>
                            <span className="intersection-name">{i.name}</span>
                            <span className="intersection-count">{i.vehicles}v</span>
                            <span className={`intersection-congestion ${getCongestionClass(i.congestion)}`}>{i.congestion}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <div style={{ flex: 1, background: 'var(--success-50)', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success-dark)' }}>3</div>
                          <div style={{ fontSize: '11px', color: 'var(--success-dark)', fontWeight: 600 }}>Clear</div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--warning-50)', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning-dark)' }}>1</div>
                          <div style={{ fontSize: '11px', color: 'var(--warning-dark)', fontWeight: 600 }}>Moderate</div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--danger-50)', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger-dark)' }}>2</div>
                          <div style={{ fontSize: '11px', color: 'var(--danger-dark)', fontWeight: 600 }}>High</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row status badge */}
                  <div className="hero-visual-row" style={{ justifyContent: 'flex-end' }}>
                    <div className="floating-card floating-card-3" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'unset' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.2', textAlign: 'left' }}>
                        <span style={{ fontWeight: 700, color: 'var(--success-dark)', display: 'block' }}>FLOWING</span>
                        Main St &amp; 1st Ave
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="section" id="features">
            <div className="container">
              <div style={{ textAlign: 'center' }}>
                <div className="section-label"><Star size={12} /> Features</div>
                <h2 className="section-title">Everything You Need to Control<br/>City Traffic Effectively</h2>
                <p className="section-desc" style={{ margin: '0 auto' }}>
                  A comprehensive platform with real-time monitoring, adaptive signal control, 
                  and incident management — all in one place.
                </p>
              </div>
              <div className="features-grid">
                {[
                  { icon: <Satellite size={22} />, color: 'blue',   bg: 'var(--primary-50)',  title: 'Live Traffic Monitoring',    desc: 'Monitor vehicle count, queue length, waiting time, and congestion level across all intersections in real-time.' },
                  { icon: <TrafficCone size={22} />, color: 'green',  bg: 'var(--success-50)',  title: 'Adaptive Signal Control',    desc: 'Intelligent signal timing recommendations based on traffic density. Operators can accept or manually override.' },
                  { icon: <AlertTriangle size={22} />, color: 'yellow', bg: 'var(--warning-50)', title: 'Incident Reporting',   desc: 'Public users can report accidents, roadblocks, and breakdowns. Operators verify and manage responses.' },
                  { icon: <Bell size={22} />,           color: 'red',    bg: 'var(--danger-50)',   title: 'Real-Time Alerts',           desc: 'Instant notifications for traffic incidents, congestion warnings, and signal status changes.' },
                  { icon: <BarChart3 size={22} />,     color: 'blue',   bg: 'var(--primary-50)',  title: 'Traffic Analytics',          desc: 'Detailed reports with traffic trends, vehicle flow charts, and signal performance metrics.' },
                  { icon: <Shield size={22} />,     color: 'green',  bg: 'var(--success-50)',  title: 'Role-Based Access',          desc: 'Secure role-based authentication for public users, traffic operators, and system administrators.' },
                ].map((f, idx) => (
                  <div key={idx} className="feature-card">
                    <div className="feature-icon" style={{ background: f.bg, color: `var(--${f.color === 'blue' ? 'primary' : f.color === 'green' ? 'success' : f.color === 'yellow' ? 'warning-dark' : 'danger'})` }}>
                      {f.icon}
                    </div>
                    <div className="feature-title">{f.title}</div>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROCESS */}
          <section className="how-it-works" id="how-it-works">
            <div className="container hiw-inner">
              <div style={{ textAlign: 'center' }}>
                <div className="section-label hiw-section-label"><Activity size={12} /> Process</div>
                <h2 className="section-title hiw-title">How UrbanFlow Works</h2>
                <p className="section-desc" style={{ margin: '0 auto', color: 'rgba(255,255,255,0.6)' }}>
                  From data collection to adaptive signal optimization — a seamless intelligent pipeline.
                </p>
              </div>
              <div className="hiw-steps">
                {[
                  { num: '01', icon: <Satellite size={22} />, title: 'Data Collection',       desc: 'Cameras and sensors collect vehicle counts, queue lengths, and wait times at every intersection.' },
                  { num: '02', icon: <Activity size={22} />,  title: 'Adaptive Analysis',     desc: 'The Adaptive Controller processes congestion levels and calculates optimal green signal durations.' },
                  { num: '03', icon: <TrafficCone size={22} />, title: 'Signal Optimization',   desc: 'Operators review recommendations and apply optimal timings — or override manually when needed.' },
                  { num: '04', icon: <BarChart3 size={22} />, title: 'Reporting & Review',    desc: 'Generate detailed traffic reports and review analytics to continuously improve signal performance.' },
                ].map((s, idx) => (
                  <div key={idx} className="hiw-step">
                    <div className="hiw-step-num">{s.num}</div>
                    <div className="hiw-step-icon" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.icon}</div>
                    <div className="hiw-step-title">{s.title}</div>
                    <p className="hiw-step-desc">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ROLES */}
          <section className="section" id="roles">
            <div className="container">
              <div style={{ textAlign: 'center' }}>
                <div className="section-label"><Users size={12} /> User Roles</div>
                <h2 className="section-title">Built for Every Stakeholder</h2>
                <p className="section-desc" style={{ margin: '0 auto' }}>Three distinct roles with tailored access and capabilities.</p>
              </div>
              <div className="roles-grid">
                {/* Public */}
                <div className="role-card">
                  <div className="role-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                    <User size={26} />
                  </div>
                  <div className="role-title">Public User</div>
                  <p className="role-desc">Citizens who want to stay informed about traffic conditions and contribute incident reports.</p>
                  <div className="role-features">
                    {['View live traffic status', 'Check signal status', 'Report incidents', 'Receive traffic alerts', 'Track my reports'].map((f, idx) => (
                      <div key={idx} className="role-feature-item"><CheckCircle size={14} style={{ color: 'var(--success)' }} /><span>{f}</span></div>
                    ))}
                  </div>
                  <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setCurrentPage('register')}>
                    Register Now
                  </button>
                </div>
                {/* Operator */}
                <div className="role-card featured">
                  <div className="role-icon" style={{ background: 'var(--primary)', color: 'white' }}>
                    <UserCheck size={26} />
                  </div>
                  <div className="role-title">Traffic Operator</div>
                  <p className="role-desc">Control centre operators who monitor intersections and manage traffic signal timing in real time.</p>
                  <div className="role-features">
                    {['Monitor assigned intersections', 'View adaptive recommendations', 'Manual signal override', 'Verify incidents', 'Generate traffic reports', 'View analytics dashboard'].map((f, idx) => (
                      <div key={idx} className="role-feature-item"><CheckCircle size={14} style={{ color: 'var(--success)' }} /><span>{f}</span></div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setCurrentPage('login'); handleRoleTabChange('operator'); }}>
                    Operator Login
                  </button>
                </div>
                {/* Admin */}
                <div className="role-card">
                  <div className="role-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-dark)' }}>
                    <Shield size={26} />
                  </div>
                  <div className="role-title">System Administrator</div>
                  <p className="role-desc">Administrators who manage users, intersections, and system-wide configuration.</p>
                  <div className="role-features">
                    {['Manage operators & users', 'Configure intersections', 'View traffic statistics', 'System settings', 'Manage all reports'].map((f, idx) => (
                      <div key={idx} className="role-feature-item"><CheckCircle size={14} style={{ color: 'var(--success)' }} /><span>{f}</span></div>
                    ))}
                  </div>
                  <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setCurrentPage('login'); handleRoleTabChange('admin'); }}>
                    Admin Login
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta-section">
            <div className="container cta-inner">
              <div className="section-label hiw-section-label" style={{ margin: '0 auto 20px' }}>
                <Rocket size={12} /> Get Started
              </div>
              <h2 className="cta-title">Ready to Optimize Your<br/>City's Traffic Flow?</h2>
              <p className="cta-desc">Join UrbanFlow today and experience intelligent, real-time traffic management.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-white btn-lg" onClick={() => setCurrentPage('register')}>
                  Create Account
                </button>
                <button className="btn btn-white-outline btn-lg" onClick={() => setCurrentPage('login')}>
                  Sign In
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="footer-grid">
                <div className="footer-brand">
                  <div className="logo" style={{ marginBottom: '12px' }}>
                    <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                    <span className="logo-text">Urban<span>Flow</span></span>
                  </div>
                  <p className="footer-desc">AI-Based Smart Traffic Signal Optimization and Incident Management System for modern cities.</p>
                </div>
                <div>
                  <div className="footer-heading">Platform</div>
                  <div className="footer-links">
                    <a className="footer-link">Live Monitoring</a>
                    <a className="footer-link">Signal Control</a>
                    <a className="footer-link">Incident Reports</a>
                  </div>
                </div>
                <div>
                  <div className="footer-heading">Users</div>
                  <div className="footer-links">
                    <a className="footer-link" onClick={() => { setCurrentPage('login'); handleRoleTabChange('public'); }}>Public Access</a>
                    <a className="footer-link" onClick={() => { setCurrentPage('login'); handleRoleTabChange('operator'); }}>Operators</a>
                    <a className="footer-link" onClick={() => { setCurrentPage('login'); handleRoleTabChange('admin'); }}>Administrators</a>
                  </div>
                </div>
                <div>
                  <div className="footer-heading">Support</div>
                  <div className="footer-links">
                    <a className="footer-link">Documentation</a>
                    <a className="footer-link">Privacy Policy</a>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© 2025 UrbanFlow. Smart Traffic Management System.</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span>All systems operational</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {currentPage === 'login' && (
        <div className="auth-page page-enter">
          {/* Left Visual panel */}
          <div className="auth-visual">
            <div className="auth-visual-inner">
              <div className="auth-visual-logo">
                <div className="logo" onClick={() => setCurrentPage('landing')}>
                  <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                  <span className="logo-text">Urban<span>Flow</span></span>
                </div>
              </div>
              <h2 className="auth-visual-title">Traffic Control<br/>at Your Fingertips</h2>
              <p className="auth-visual-desc">
                Access real-time traffic data, monitor intersections, manage incidents, and optimize 
                signal timings — all from one unified platform.
              </p>
              <div className="auth-mockup" style={{ marginBottom: '32px' }}>
                <div className="auth-mockup-header">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  Live Status Monitor
                </div>
                {initialIntersections.slice(0, 3).map(i => (
                  <div key={i.id} className="auth-mockup-row">
                    <div className="auth-mockup-dot" style={{ background: i.signal === 'green' ? '#10b981' : i.signal === 'yellow' ? '#f59e0b' : '#ef4444' }}></div>
                    <span className="auth-mockup-label">{i.name}</span>
                    <span className={`auth-mockup-badge ${getCongestionClass(i.congestion)}`}>{i.congestion}</span>
                  </div>
                ))}
              </div>
              <div className="auth-trust-badges">
                <div className="auth-trust-badge"><Shield size={14} /> Secure Access</div>
                <div className="auth-trust-badge"><UserCheck size={14} /> Audited Logs</div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-panel">
            <div className="auth-form-scroll">
              <div className="logo" onClick={() => setCurrentPage('landing')} style={{ marginBottom: '32px' }}>
                <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                <span className="logo-text">Urban<span>Flow</span></span>
              </div>

              <div className="auth-form-header">
                <h1 className="auth-form-title">Welcome Back</h1>
                <p className="auth-form-subtitle">Sign in to your account to access the traffic dashboard.</p>
              </div>

              {/* Role Selectors */}
              <div className="role-tabs">
                <button className={`role-tab ${loginRole === 'public' ? 'active' : ''}`} onClick={() => handleRoleTabChange('public')}>
                  Public
                </button>
                <button className={`role-tab ${loginRole === 'operator' ? 'active' : ''}`} onClick={() => handleRoleTabChange('operator')}>
                  Operator
                </button>
                <button className={`role-tab ${loginRole === 'admin' ? 'active' : ''}`} onClick={() => handleRoleTabChange('admin')}>
                  Admin
                </button>
              </div>

              {/* Demo Helpbox */}
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                <Info size={16} />
                <span>Demo: <strong>{loginEmail}</strong> / <strong>demo123</strong></span>
              </div>

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div className="input-icon">
                    <Mail className="icon" size={16} />
                    <input className="form-control" type="email" id="login-email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <a className="forgot-link" href="#" onClick={e => e.preventDefault()}>Forgot?</a>
                  </div>
                  <div className="input-icon">
                    <Lock className="icon" size={16} />
                    <input className="form-control" type={showPassword ? 'text' : 'password'} id="login-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="remember-me" defaultChecked />
                  <label htmlFor="remember-me">Remember me for 30 days</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  Sign In
                </button>
              </form>

              <div className="auth-footer-text">
                Don't have an account? <span onClick={() => setCurrentPage('register')}>Create one</span>
              </div>
              <p style={{ textAlign: 'center', marginTop: '12px' }}>
                <span onClick={() => setCurrentPage('landing')} style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
                  ← Back to Home
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'register' && (
        <div className="auth-page page-enter">
          {/* Left panel Visual */}
          <div className="auth-visual" style={{ background: 'linear-gradient(155deg, #064e3b, #065f46, #059669)' }}>
            <div className="auth-visual-inner">
              <div className="auth-visual-logo">
                <div className="logo" onClick={() => setCurrentPage('landing')}>
                  <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><i className="fas fa-traffic-light"></i></div>
                  <span className="logo-text">Urban<span style={{ color: '#6ee7b7' }}>Flow</span></span>
                </div>
              </div>
              <h2 className="auth-visual-title">Join UrbanFlow<br/>Today</h2>
              <p className="auth-visual-desc">
                Create a citizen account to access real-time status details, report roadblocks, accidents, or breakdowns, and stay updated.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {[
                  { text: 'View live traffic status at intersections' },
                  { text: 'Receive traffic notifications' },
                  { text: 'Submit road incident reports' },
                ].map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={14} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{b.text}</span>
                  </div>
                ))}
              </div>
              <div className="auth-trust-badges">
                <div className="auth-trust-badge">Free Tier Access</div>
                <div className="auth-trust-badge">Secure Accounts</div>
              </div>
            </div>
          </div>

          {/* Right panel Form */}
          <div className="auth-form-panel" style={{ overflowY: 'auto' }}>
            <div className="auth-form-scroll" style={{ padding: '24px 0' }}>
              <div className="logo" onClick={() => setCurrentPage('landing')} style={{ marginBottom: '28px' }}>
                <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                <span className="logo-text">Urban<span>Flow</span></span>
              </div>

              <div className="auth-form-header">
                <h1 className="auth-form-title">Create Account</h1>
                <p className="auth-form-subtitle">Register to submit incidents and view current traffic updates.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-fname">First Name</label>
                    <div className="input-icon">
                      <User className="icon" size={16} />
                      <input className="form-control" type="text" id="reg-fname" value={regFName} onChange={(e) => setRegFName(e.target.value)} placeholder="Alex" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-lname">Last Name</label>
                    <input className="form-control" type="text" id="reg-lname" value={regLName} onChange={(e) => setRegLName(e.target.value)} placeholder="Smith" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <div className="input-icon">
                    <Mail className="icon" size={16} />
                    <input className="form-control" type="email" id="reg-email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="alex@example.com" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                  <div className="input-icon">
                    <Phone className="icon" size={16} />
                    <input className="form-control" type="tel" id="reg-phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-city">City</label>
                  <div className="input-icon">
                    <MapPin className="icon" size={16} />
                    <input className="form-control" type="text" id="reg-city" value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="e.g. Kochi" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <div className="input-icon">
                    <Lock className="icon" size={16} />
                    <input className="form-control" type={showRegPassword ? 'text' : 'password'} id="reg-password" value={regPassword} onChange={(e) => checkPasswordStrength(e.target.value)} placeholder="At least 6 characters" required />
                    <button type="button" className="password-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwdStrength.text && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div className={`strength-fill ${pwdStrength.class}`}></div>
                      </div>
                      <span className="strength-text" style={{ color: pwdStrength.class === 'strong' ? 'var(--success-dark)' : pwdStrength.class === 'medium' ? 'var(--warning-dark)' : 'var(--danger)' }}>
                        {pwdStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                  <div className="input-icon">
                    <Lock className="icon" size={16} />
                    <input className="form-control" type={showRegConfirm ? 'text' : 'password'} id="reg-confirm" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat password" required />
                    <button type="button" className="password-toggle" onClick={() => setShowRegConfirm(!showRegConfirm)}>
                      {showRegConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="checkbox-row">
                  <input type="checkbox" id="reg-terms" checked={regTerms} onChange={(e) => setRegTerms(e.target.checked)} required />
                  <label htmlFor="reg-terms">I accept the Terms of Service & Privacy Policy</label>
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  Create Account
                </button>
              </form>

              <div className="auth-footer-text">
                Already have an account? <span onClick={() => setCurrentPage('login')}>Sign in</span>
              </div>
              <p style={{ textAlign: 'center', marginTop: '12px' }}>
                <span onClick={() => setCurrentPage('landing')} style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
                  ← Back to Home
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'admin_dashboard' && (
        <div className="admin-theme page-enter">
          {/* Collapsible Left Navigation */}
          <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-logo">
                <div className="logo-icon">
                  <TrafficCone size={18} />
                </div>
                <span className="logo-text" style={{ color: 'var(--admin-text-main)' }}>Urban<span style={{ color: 'var(--admin-accent-cyan)' }}>Flow</span></span>
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <Menu size={18} />
              </button>
            </div>

            <nav className="admin-menu-list">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                { id: 'intersections', label: 'Intersection Management', icon: <Route size={18} /> },
                { id: 'controllers', label: 'Traffic Controllers', icon: <Sliders size={18} /> },
                { id: 'users', label: 'Users', icon: <Users size={18} /> },
                { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
                { id: 'rule_engine', label: 'Rule Engine', icon: <ToggleLeft size={18} /> },
                { id: 'monitoring', label: 'System Monitoring', icon: <Activity size={18} /> },
                { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
              ].map(item => (
                <button
                  key={item.id}
                  className={`admin-menu-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  <span className="admin-menu-text">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ width: '100%', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--admin-text-muted)' }}
                onClick={() => {
                  addToast('Signing out...', 'info');
                  setTimeout(() => {
                    setCurrentPage('landing');
                    setActiveTab('dashboard');
                  }, 800);
                }}
              >
                <Power size={14} />
                <span className="admin-menu-text">Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Layout Area */}
          <div className="admin-layout-main">
            {/* Topbar */}
            <header className="admin-topbar">
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--admin-text-main)' }}>
                  Intelligent Transportation System (ITS) Command Centre
                </h2>
              </div>
              <div className="admin-topbar-actions">
                <div className="admin-search-wrapper">
                  <Search className="icon" size={16} />
                  <input className="admin-search-input" type="text" placeholder="Global system search..." />
                </div>

                <button style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', position: 'relative' }}>
                  <Bell size={18} />
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '6px', height: '6px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                </button>

                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--admin-border)' }}></div>

                <div className="admin-profile-btn">
                  <div className="admin-profile-avatar">RP</div>
                  <div style={{ textAlign: 'left' }} className="admin-menu-text">
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Dr. Raj Patel</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>System Administrator</div>
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard Contents */}
            <main className="admin-content-area">
              <div className="admin-title-row">
                <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                  ITS Dashboard Control Panel
                </h1>
                <div className="admin-subtitle">
                  Real-time status overview of active nodes and adaptive signal controllers.
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="admin-stats-grid">
                {[
                  { label: 'Total Intersections', value: '12 Active', icon: <Route size={18} />, color: 'var(--admin-accent-blue)', bg: 'rgba(59, 130, 246, 0.1)' },
                  { label: 'Active Controllers', value: '12 / 12', icon: <Sliders size={18} />, color: 'var(--admin-accent-cyan)', bg: 'rgba(6, 182, 212, 0.1)' },
                  { label: 'Active Vehicles', value: vehiclesCount, icon: <Activity size={18} />, color: 'var(--admin-accent-purple)', bg: 'rgba(168, 85, 247, 0.1)' },
                  { label: 'Adaptive Signals', value: ruleAdaptive ? 'Enabled' : 'Disabled', icon: <ToggleLeft size={18} />, color: 'var(--admin-accent-green)', bg: 'rgba(16, 185, 129, 0.1)' },
                  { label: 'System Health', value: '100% OK', icon: <Server size={18} />, color: 'var(--admin-accent-cyan)', bg: 'rgba(6, 182, 212, 0.1)' },
                  { label: 'Traffic Efficiency', value: '+14.2%', icon: <Star size={18} />, color: 'var(--admin-accent-green)', bg: 'rgba(16, 185, 129, 0.1)' },
                ].map((stat, idx) => (
                  <div key={idx} className="admin-stat-card">
                    <div className="admin-stat-card-header">
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                      <div className="admin-stat-icon-box" style={{ background: stat.bg, color: stat.color }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="admin-stat-card-value">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Middle Section Layout */}
              <div className="admin-middle-grid">
                {/* Left panel: Traffic Map & List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <Route size={16} style={{ color: 'var(--admin-accent-cyan)' }} /> City Traffic Simulation Overview
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }}>
                          <RefreshCw size={12} /> Sync SUMO
                        </button>
                      </div>
                    </div>
                    {/* Simulated SUMO Environment */}
                    <div style={{ height: '240px', background: '#09111e', border: '1px solid var(--admin-border)', borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--admin-accent-cyan) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      {/* Grid Roads */}
                      <div style={{ position: 'absolute', height: '40px', left: 0, right: 0, background: '#122035', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 100px' }}>
                        <div style={{ borderTop: '2px dashed var(--admin-text-muted)', width: '100%', height: '1px' }}></div>
                      </div>
                      <div style={{ position: 'absolute', width: '40px', top: 0, bottom: 0, background: '#122035', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '100px 0' }}>
                        <div style={{ borderLeft: '2px dashed var(--admin-text-muted)', height: '100%', width: '1px' }}></div>
                      </div>
                      {/* Crossroad Junction Center */}
                      <div style={{ position: 'absolute', width: '60px', height: '60px', background: '#1b2d49', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }}></div>
                        </div>
                      </div>
                      {/* Interactive top-down vehicle icons */}
                      <div style={{ position: 'absolute', left: '20%', top: '48%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }} title="Passenger Car">🚗</div>
                      <div style={{ position: 'absolute', left: '35%', top: '45%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }} title="Bus">🚌</div>
                      <div style={{ position: 'absolute', right: '25%', top: '48%', transform: 'translateY(-50%) rotate(180deg)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }} title="Truck">🚚</div>
                      <div style={{ position: 'absolute', left: '46%', top: '15%', transform: 'translateX(-50%) rotate(90deg)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }} title="Ambulance">🚑</div>
                      <span style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '11px', color: 'var(--admin-text-muted)', fontFamily: 'var(--font-mono)' }}>SUMO Net Map Mode (2D Canvas View)</span>
                    </div>
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <Sliders size={16} style={{ color: 'var(--admin-accent-cyan)' }} /> Active Intersection Status
                      </span>
                    </div>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Intersection Name</th>
                            <th>Signal Mode</th>
                            <th>Flow Rate</th>
                            <th>Wait Time</th>
                            <th>Congestion Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Main St & 1st Ave', mode: 'Adaptive Controller', flow: '45 veh/min', wait: '18s', status: 'smooth', label: 'Smooth' },
                            { name: 'Park Rd & Central', mode: 'Adaptive Controller', flow: '82 veh/min', wait: '85s', status: 'heavy', label: 'Heavy' },
                            { name: 'Harbor Blvd & 5th', mode: 'Emergency Preempt', flow: '61 veh/min', wait: '42s', status: 'moderate', label: 'Moderate' },
                            { name: 'Airport Rd & Ring Rd', mode: 'Manual Override', flow: '94 veh/min', wait: '120s', status: 'congested', label: 'Congested' },
                          ].map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600' }}>{row.name}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{row.mode}</td>
                              <td>{row.flow}</td>
                              <td>{row.wait}</td>
                              <td>
                                <span className={`semantic-badge ${row.status}`}>{row.label}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right panel: Active alerts & Connections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <Activity size={16} style={{ color: 'var(--admin-accent-purple)' }} /> Connected Services
                      </span>
                    </div>
                    <div className="service-indicator-grid">
                      {[
                        { name: 'Database', status: serviceStatus.database, label: 'PostgreSQL Active' },
                        { name: 'Backend API', status: serviceStatus.backend, label: 'FastAPI REST' },
                        { name: 'SUMO Sim', status: serviceStatus.sumo, label: 'TraCI Port 8813' },
                        { name: 'WebSocket', status: serviceStatus.websocket, label: 'Live Server' },
                      ].map((service, idx) => (
                        <div key={idx} className="service-card">
                          <div className={`service-status-dot ${service.status ? 'active' : 'inactive'}`}></div>
                          <div className="service-details">
                            <span className="service-name">{service.name}</span>
                            <span className="service-status-label">{service.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Active Center Alerts
                      </span>
                    </div>
                    <div className="dashboard-alert-list">
                      {ruleAlerts.map(alert => (
                        <div key={alert.id} className={`dashboard-alert-item ${alert.type === 'warning' ? 'warning' : 'critical'}`}>
                          <div className="dashboard-alert-content">
                            <span style={{ fontWeight: '600' }}>{alert.type === 'warning' ? 'Warning Alert' : 'Critical Event'}</span>
                            <span>{alert.text}</span>
                            <span className="dashboard-alert-time">{alert.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <ToggleLeft size={16} style={{ color: 'var(--admin-accent-green)' }} /> Command Rule Engine
                      </span>
                    </div>
                    <div className="rule-engine-widget">
                      {[
                        { label: 'Adaptive Signal Optimization', desc: 'Enable TraCI adaptive algorithm control', state: ruleAdaptive, setState: setRuleAdaptive },
                        { label: 'Emergency Preemption Override', desc: 'Prioritize emergency responders', state: ruleEmergency, setState: setRuleEmergency },
                        { label: 'High Congestion Alert Rules', desc: 'Notify operator of queues > 15 vehicles', state: ruleCongestion, setState: setRuleCongestion },
                      ].map((rule, idx) => (
                        <div key={idx} className="rule-toggle-row">
                          <div className="rule-info">
                            <span className="rule-name">{rule.label}</span>
                            <span className="rule-desc">{rule.desc}</span>
                          </div>
                          <button 
                            onClick={() => {
                              rule.setState(!rule.state);
                              addToast(`${rule.label} is now ${!rule.state ? 'Enabled' : 'Disabled'}`, 'info');
                            }}
                            className={`btn btn-sm ${rule.state ? 'btn-success' : 'btn-ghost'}`}
                            style={{ padding: '6px 12px' }}
                          >
                            {rule.state ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <span className="admin-panel-title">
                      <FileText size={16} style={{ color: 'var(--admin-accent-cyan)' }} /> Real-time Controller Log
                    </span>
                    <button 
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => {
                        setControllerLogs(prev => [
                          { time: new Date().toLocaleTimeString(), event: 'Manual logs sync completed successfully.' },
                          ...prev
                        ]);
                        addToast('Controller logs synced', 'success');
                      }}
                    >
                      Sync Log
                    </button>
                  </div>
                  <div className="activity-log-list">
                    {controllerLogs.map((log, idx) => (
                      <div key={idx} className="activity-log-item">
                        <span>{log.event}</span>
                        <span className="activity-log-time">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        <Settings size={16} style={{ color: 'var(--admin-accent-purple)' }} /> Quick Commands
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      <button className="btn btn-outline" onClick={() => addToast('System diagnostic completed: 0 errors found.', 'success')}>
                        Run Diagnostic
                      </button>
                      <button className="btn btn-outline" onClick={() => addToast('All database backup files compiled successfully.', 'success')}>
                        Create DB Backup
                      </button>
                      <button className="btn btn-ghost" onClick={() => addToast('SUMO controller re-initialized.', 'info')}>
                        Reload SUMO Config
                      </button>
                      <button className="btn btn-ghost" onClick={() => addToast('All notifications muted.', 'info')}>
                        Clear Alert History
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>Automated DB Backups</div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Last run: today, 12:00 PM (100% success)</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-accent-green)' }}>AUTO-SYNC ON</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

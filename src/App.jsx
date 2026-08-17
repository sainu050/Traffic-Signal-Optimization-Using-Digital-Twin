import React, { useState, useEffect } from 'react';
import { 
  TrafficCone, Rocket, LogIn, Eye, EyeOff, User, 
  UserCheck, Shield, Mail, Lock, Phone, MapPin, 
  AlertTriangle, Star, CheckCircle, Info, Menu, 
  Satellite, Bell, BarChart3, Users, Route, Activity,
  LayoutDashboard, Sliders, ToggleLeft, Layers, Settings,
  Search, FileText, Database, Server, HardDrive, Play,
  Pause, RefreshCw, Power, Compass, MessageSquare
} from 'lucide-react';
import './App.css';
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';

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



export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.role === 'admin') return 'admin_dashboard';
      if (user.role === 'public' || user.role === 'operator') return 'public_dashboard';
    }
    return 'landing';
  });
  const [loginRole, setLoginRole] = useState('public');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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

  // First Login Reset Password States
  const [firstLoginCurrentPwd, setFirstLoginCurrentPwd] = useState('');
  const [firstLoginNewPwd, setFirstLoginNewPwd] = useState('');
  const [firstLoginConfirmPwd, setFirstLoginConfirmPwd] = useState('');
  const [showFirstLoginCurrent, setShowFirstLoginCurrent] = useState(false);
  const [showFirstLoginNew, setShowFirstLoginNew] = useState(false);
  const [showFirstLoginConfirm, setShowFirstLoginConfirm] = useState(false);

  // Admin Dashboard States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [intersections, setIntersections] = useState(initialIntersections);
  const [controllers, setControllers] = useState([
    { id: 'CTRL-A01', name: 'Westside Controller (TraCI Model A)', type: 'Adaptive', status: 'Online', assignedTo: 1 },
    { id: 'CTRL-A02', name: 'Central Hub Controller (Model A+)', type: 'Adaptive', status: 'Online', assignedTo: 2 },
    { id: 'CTRL-B01', name: 'Harbor Edge Controller (Model B)', type: 'Rule-Based', status: 'Online', assignedTo: 3 },
    { id: 'CTRL-B02', name: 'Expressway Bypass Controller (Model B)', type: 'Manual Override', status: 'Online', assignedTo: 5 },
    { id: 'CTRL-C01', name: 'Downtown Backup Unit (Model C)', type: 'Fail-Safe Mode', status: 'Offline', assignedTo: null },
    { id: 'CTRL-C02', name: 'Suburban Loop Controller', type: 'Adaptive', status: 'Online', assignedTo: null },
  ]);
  const [selectedIntersectionId, setSelectedIntersectionId] = useState('');
  const [selectedControllerId, setSelectedControllerId] = useState('');
  
  // Public Dashboard States
  const [publicActiveTab, setPublicActiveTab] = useState('dashboard');
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [feedbackType, setFeedbackType] = useState('issue');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackLocation, setFeedbackLocation] = useState('');
  const [publicAlerts, setPublicAlerts] = useState([
    { id: 1, type: 'critical', text: 'Main St & 1st Ave closed for bridge repair. Use Expressway bypass.', time: '10 mins ago' },
    { id: 2, type: 'warning', text: 'Heavy congestion build-up near Airport Rd & Ring Rd.', time: '25 mins ago' },
    { id: 3, type: 'info', text: 'Scheduled signal maintenance on Harbor Blvd tonight at 11 PM.', time: '1 hr ago' }
  ]);

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
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    addToast('Authenticating...', 'info');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        addToast(`Success! Welcome, ${data.user.name}.`, 'success');
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setTimeout(() => {
          if (data.user.role === 'admin') {
            setCurrentPage('admin_dashboard');
          } else if (data.user.role === 'public' || data.user.role === 'operator') {
            setCurrentPage('public_dashboard');
          } else {
            setCurrentPage('landing');
          }
        }, 1000);
      } else {
        addToast(data.detail || 'Invalid credentials.', 'error');
      }
    } catch (error) {
      addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
    }
  };

  const handleFirstLoginPasswordReset = (e) => {
    e.preventDefault();
    if (firstLoginNewPwd !== firstLoginConfirmPwd) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (firstLoginNewPwd.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    fetch('http://localhost:8000/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        current_password: firstLoginCurrentPwd,
        new_password: firstLoginNewPwd
      })
    }).then(res => {
      if (res.ok) {
        return res.json();
      }
      return res.json().then(data => { throw new Error(data.detail || 'Failed to change password.'); });
    }).then(() => {
      addToast('Password updated successfully! Welcome to UrbanFlow.', 'success');
      const updatedUser = { ...currentUser, is_first_login: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setFirstLoginCurrentPwd('');
      setFirstLoginNewPwd('');
      setFirstLoginConfirmPwd('');
    }).catch(err => {
      addToast(err.message || 'Error updating password.', 'error');
    });
  };

  const handleAssignController = (e) => {
    e.preventDefault();
    if (!selectedIntersectionId || !selectedControllerId) {
      addToast('Please select both an intersection and a controller.', 'error');
      return;
    }

    setControllers(prev => prev.map(c => {
      // Clear assignment if already assigned to this intersection
      if (c.assignedTo === parseInt(selectedIntersectionId)) {
        return { ...c, assignedTo: null };
      }
      // Assign the selected controller
      if (c.id === selectedControllerId) {
        return { ...c, assignedTo: parseInt(selectedIntersectionId) };
      }
      return c;
    }));

    const intersectionName = intersections.find(i => i.id === parseInt(selectedIntersectionId))?.name || 'Intersection';
    
    addToast(`Successfully assigned ${selectedControllerId} to ${intersectionName}!`, 'success');
    
    // Add to activity log
    setControllerLogs(prev => [
      { time: new Date().toLocaleTimeString(), event: `Assigned controller ${selectedControllerId} to intersection "${intersectionName}"` },
      ...prev
    ]);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackDesc) {
      addToast('Please enter a feedback description.', 'error');
      return;
    }
    addToast('Feedback successfully submitted to City Traffic Command Center.', 'success');
    setFeedbackDesc('');
    setFeedbackLocation('');
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFName || !regLName) { addToast('Please enter your full name.', 'error'); return; }
    if (!regEmail.includes('@')) { addToast('Please enter a valid email address.', 'error'); return; }
    if (regPassword.length < 6) { addToast('Password must be at least 6 characters.', 'error'); return; }
    if (regPassword !== regConfirm) { addToast('Passwords do not match.', 'error'); return; }
    if (!regTerms) { addToast('Please accept the Terms of Service.', 'error'); return; }

    addToast('Creating your account...', 'info');

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${regFName} ${regLName}`,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          city: regCity,
          role: 'PUBLIC'
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        addToast(`Account created for ${regFName}! Please log in.`, 'success');
        setTimeout(() => {
          setCurrentPage('login');
        }, 1200);
      } else {
        addToast(data.detail || 'Registration failed.', 'error');
      }
    } catch (error) {
      addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
    }
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
        <LandingPage 
          onNavigate={setCurrentPage} 
          onRoleLogin={(role) => { 
            setCurrentPage('login'); 
            handleRoleTabChange(role); 
          }} 
        />
      )}

      {currentPage === 'login' && (
        <div className="auth-page page-enter dark">
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

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div className="input-icon">
                    <Mail className="icon" size={16} />
                    <input className="form-control" type="email" id="login-email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Enter email address" required />
                  </div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <a className="forgot-link" href="#" onClick={e => e.preventDefault()}>Forgot?</a>
                  </div>
                  <div className="input-icon">
                    <Lock className="icon" size={16} />
                    <input className="form-control" type={showPassword ? 'text' : 'password'} id="login-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password" required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
        <div className="auth-page page-enter dark">
          {/* Left panel Visual */}
          <div className="auth-visual">
            <div className="auth-visual-inner">
              <div className="auth-visual-logo">
                <div className="logo" onClick={() => setCurrentPage('landing')}>
                  <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                  <span className="logo-text">Urban<span>Flow</span></span>
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
        <AdminDashboard 
          intersections={intersections}
          setIntersections={setIntersections}
          controllers={controllers}
          setControllers={setControllers}
          vehiclesCount={vehiclesCount}
          addToast={addToast}
          currentUser={currentUser}
        />
      )}

      {currentPage === 'public_dashboard' && (
        <div className="admin-theme page-enter">
          {/* Collapsible Left Navigation */}
          <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-logo">
                <div className="logo-icon">
                  <i className="fas fa-traffic-light"></i>
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
                { id: 'live_traffic', label: 'Live Traffic', icon: <Route size={18} /> },
                { id: 'conditions', label: 'Road Conditions', icon: <Activity size={18} /> },
                { id: 'planner', label: 'Travel Planner', icon: <Compass size={18} /> },
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
                { id: 'feedback', label: 'Feedback & Reports', icon: <MessageSquare size={18} /> },
                { id: 'profile', label: 'My Profile', icon: <Users size={18} /> },
              ].map(item => (
                <button
                  key={item.id}
                  className={`admin-menu-item ${publicActiveTab === item.id ? 'active' : ''}`}
                  onClick={() => setPublicActiveTab(item.id)}
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
                    localStorage.removeItem('currentUser');
                    setCurrentUser(null);
                    setCurrentPage('landing');
                    setPublicActiveTab('dashboard');
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="admin-search-wrapper" style={{ width: '260px' }}>
                  <Search className="icon" size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                  <input 
                    className="admin-search-input" 
                    type="text" 
                    placeholder="Search roads or intersections..." 
                    style={{ paddingLeft: '36px' }}
                    value={publicSearchQuery}
                    onChange={(e) => setPublicSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-topbar-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span>⛅ 24°C Cloudy</span>
                </div>

                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--admin-border)' }}></div>

                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {currentTime}
                </div>

                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--admin-border)' }}></div>

                <div className="admin-profile-btn">
                  <div className="admin-profile-avatar" style={{ background: 'linear-gradient(135deg, var(--admin-accent-cyan), var(--admin-accent-blue))' }}>
                    {currentUser?.avatar || 'AJ'}
                  </div>
                  <div style={{ textAlign: 'left' }} className="admin-menu-text">
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser?.name || 'Alex Johnson'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                      {currentUser?.role === 'public' ? 'Public User' : (currentUser?.role === 'operator' ? 'Traffic Operator' : 'Sys Admin')}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard Contents */}
            <main className="admin-content-area">
              {publicActiveTab === 'dashboard' && (
                <>
                  <div className="admin-title-row">
                    <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                      Smart City Public Traffic Hub
                    </h1>
                    <div className="admin-subtitle">
                      Live public city transit status, weather updates, and signal conditions.
                    </div>
                  </div>

                  {/* Public Stats Cards */}
                  <div className="admin-stats-grid">
                    {[
                      { label: 'Traffic Status', value: 'Normal Flow', icon: <Activity size={18} />, color: 'var(--admin-accent-green)', bg: 'rgba(16, 185, 129, 0.1)' },
                      { label: 'Congested Roads', value: '2 Active', icon: <Sliders size={18} />, color: 'var(--admin-accent-cyan)', bg: 'rgba(6, 182, 212, 0.1)' },
                      { label: 'Road Closures', value: '1 Closure', icon: <Power size={18} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                      { label: 'Avg Travel Time', value: '14.5 min', icon: <Star size={18} />, color: 'var(--admin-accent-blue)', bg: 'rgba(59, 130, 246, 0.1)' },
                    ].map((stat, idx) => (
                      <div key={idx} className="admin-stat-card">
                        <div className="admin-stat-card-header">
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                          <div className="admin-stat-icon-box" style={{ background: stat.bg, color: stat.color }}>
                            {stat.icon}
                          </div>
                        </div>
                        <div className="admin-stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Center Panel Traffic Map & Sidebar Grid */}
                  <div className="admin-middle-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Large Center Map Panel */}
                      <div className="admin-panel">
                        <div className="admin-panel-header">
                          <span className="admin-panel-title">
                            <Route size={16} style={{ color: 'var(--admin-accent-cyan)' }} /> Interactive City Traffic Network Map
                          </span>
                        </div>
                        <div style={{ height: '320px', background: '#09111e', border: '1px solid var(--admin-border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--admin-accent-cyan) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                          
                          {/* Map Roads layout */}
                          {/* Main Street */}
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '40px', background: '#122035', transform: 'translateY(-50%)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ borderTop: '2px dashed var(--admin-accent-green)', width: '100%', height: '1px', position: 'absolute', top: '50%', opacity: 0.6 }}></div>
                          </div>
                          
                          {/* Ring Road */}
                          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '40px', background: '#122035', transform: 'translateX(-50%)', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ borderLeft: '2px dashed #ef4444', height: '100%', width: '1px', position: 'absolute', left: '50%', opacity: 0.6 }}></div>
                          </div>

                          {/* Harbor Boulevard */}
                          <div style={{ position: 'absolute', left: '15%', top: 0, bottom: 0, width: '30px', background: '#122035', borderLeft: '1px solid rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.02)' }}>
                            <div style={{ borderLeft: '2px dashed var(--admin-accent-cyan)', height: '100%', width: '1px', position: 'absolute', left: '50%', opacity: 0.6 }}></div>
                          </div>

                          {/* Traffic Lights */}
                          <div style={{ position: 'absolute', left: '52%', top: '35%', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} title="Signal Red"></div>
                          <div style={{ position: 'absolute', left: '16.5%', top: '35%', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} title="Signal Green"></div>

                          {/* Vehicles Markers */}
                          <div style={{ position: 'absolute', left: '30%', top: '48%', fontSize: '16px' }} title="Bus 🚌">🚌</div>
                          <div style={{ position: 'absolute', left: '49%', top: '20%', fontSize: '16px' }} title="Congested Queue 🚗">🚗</div>
                          <div style={{ position: 'absolute', left: '49%', top: '12%', fontSize: '16px' }} title="Congested Queue 🚗">🚗</div>
                          <div style={{ position: 'absolute', left: '70%', top: '45%', fontSize: '16px' }} title="Car 🚗">🚗</div>

                          <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(6, 12, 22, 0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '2px', background: 'var(--admin-accent-green)' }}></span>
                              <span>Smooth Flow (Main St)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '2px', background: '#ef4444' }}></span>
                              <span>Heavy Congestion (Ring Rd)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '2px', background: 'var(--admin-accent-cyan)' }}></span>
                              <span>Moderate Flow (Harbor Blvd)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel widgets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="admin-panel">
                        <div className="admin-panel-header">
                          <span className="admin-panel-title">
                            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Public Traffic Alerts
                          </span>
                        </div>
                        <div className="dashboard-alert-list">
                          {publicAlerts.map(alert => (
                            <div key={alert.id} className={`dashboard-alert-item ${alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'info'}`} style={{ borderColor: alert.type === 'info' ? 'rgba(59, 130, 246, 0.2)' : '', backgroundColor: alert.type === 'info' ? 'rgba(59, 130, 246, 0.05)' : '' }}>
                              <div className="dashboard-alert-content">
                                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{alert.type} Alert</span>
                                <span>{alert.text}</span>
                                <span className="dashboard-alert-time">{alert.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Weather Forecast Info Card */}
                      <div className="admin-panel">
                        <div className="admin-panel-header">
                          <span className="admin-panel-title">
                            ⛅ Hourly Weather & Transit
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--admin-border)', fontSize: '13px' }}>
                          <span>08:00 PM - Cloudy</span>
                          <span style={{ fontWeight: '700' }}>24°C</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--admin-border)', fontSize: '13px' }}>
                          <span>10:00 PM - Light Rain 🌧️</span>
                          <span style={{ fontWeight: '700' }}>22°C</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px' }}>
                          <span>12:00 AM - Clear Sky</span>
                          <span style={{ fontWeight: '700' }}>21°C</span>
                        </div>
                      </div>

                      {/* Emergency Notifications */}
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: '12px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          ⚠️ Emergency Notice
                        </div>
                        High winds warning issued for Harbor district until midnight. Heavy vehicles drive with extreme caution.
                      </div>
                    </div>
                  </div>

                  {/* Lower Section */}
                  <div className="admin-middle-grid" style={{ marginBottom: '20px' }}>
                    <div className="admin-panel">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">
                          🗺️ Route Planners & Alternate Options
                        </span>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Origin / Destination</th>
                              <th>Default Path</th>
                              <th>Suggested Alternate Route</th>
                              <th>Estimated Time Savings</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: '600' }}>North Gate to Airport</td>
                              <td>Ring Rd Highway</td>
                              <td style={{ color: 'var(--admin-accent-cyan)' }}>West Bypass Link Road</td>
                              <td style={{ color: 'var(--admin-accent-green)', fontWeight: '700' }}>- 12 Mins</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Downtown to Harbor District</td>
                              <td>Main Street</td>
                              <td style={{ color: 'var(--admin-accent-cyan)' }}>5th Ave Viaduct</td>
                              <td style={{ color: 'var(--admin-accent-green)', fontWeight: '700' }}>- 4 Mins</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: '600' }}>Suburban Hub to Westside</td>
                              <td>Central Expressway</td>
                              <td style={{ color: 'var(--admin-accent-cyan)' }}>Metro Ring Loop Line</td>
                              <td style={{ color: 'var(--admin-accent-green)', fontWeight: '700' }}>- 9 Mins</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="admin-panel">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">
                          📈 Hourly Peak Traffic Load
                        </span>
                      </div>
                      {/* CSS 2D Load chart */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', padding: '10px 0 0 0' }}>
                        {[
                          { hour: '8 AM', height: '80%' },
                          { hour: '12 PM', height: '40%' },
                          { hour: '4 PM', height: '60%' },
                          { hour: '6 PM', height: '95%' },
                          { hour: '8 PM', height: '50%' }
                        ].map((bar, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15%', gap: '8px' }}>
                            <div style={{ height: bar.height, width: '100%', background: 'linear-gradient(to top, var(--admin-accent-cyan), var(--admin-accent-blue))', borderRadius: '4px 4px 0 0' }}></div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-text-muted)' }}>{bar.hour}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Public Announcements */}
                  <div className="admin-panel" style={{ marginBottom: '24px' }}>
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        📢 Recent Public Announcements
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Upcoming Smart Signal Installation Work</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>The Traffic Management Bureau will be installing smart adaptive signal cameras at the Harbor Blvd & 5th intersection. Expect temporary lane shifts from July 30th to August 2nd.</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Digital Twin System Beta Launching</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>UrbanFlow Digital Twin platform version 1.2 is now accessible to the public, allowing users to plan city routes using real-time predictive simulation data.</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section: Feedback Panel */}
                  <div className="admin-panel" id="public-feedback-panel">
                    <div className="admin-panel-header">
                      <span className="admin-panel-title">
                        📨 Submit Public Report & Signal Feedback
                      </span>
                    </div>
                    <form onSubmit={handleFeedbackSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>Report Type</label>
                        <select 
                          className="form-control" 
                          style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                        >
                          <option value="issue">Report Traffic Issue</option>
                          <option value="signal">Report Damaged Signal</option>
                          <option value="accident">Report Road Accident</option>
                          <option value="suggestion">Submit Transit Suggestion</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>Description & Details</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Traffic light timer broken, lane divider knocked over..."
                          style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                          value={feedbackDesc}
                          onChange={(e) => setFeedbackDesc(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>Junction / Location</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Airport Rd & Ring Rd"
                          style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                          value={feedbackLocation}
                          onChange={(e) => setFeedbackLocation(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ height: '42px', justifySelf: 'stretch', justifyContent: 'center' }}>
                        Submit Report
                      </button>
                    </form>
                  </div>
                </>
              )}

              {['live_traffic', 'conditions', 'planner', 'notifications', 'feedback', 'profile'].includes(publicActiveTab) && (
                <div style={{ padding: '60px', textAlign: 'center' }} className="admin-panel page-enter">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text-main)' }}>
                    {publicActiveTab.charAt(0).toUpperCase() + publicActiveTab.slice(1).replace('_', ' ')}
                  </h2>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', marginTop: '8px', maxWidth: '380px', margin: '8px auto' }}>
                    This public information service module is updated live by the Smart Traffic Bureau. Use alternative options inside the main dashboard panel to configure routes.
                  </p>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: '16px', borderColor: 'var(--admin-border)' }} onClick={() => setPublicActiveTab('dashboard')}>
                    Return to Hub Home
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Forced Password Reset Modal for First Login */}
      {currentUser && currentUser.is_first_login && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#38bdf8' }}>First-Time Login Security Setup</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px', lineHeight: '1.5' }}>
              Welcome to UrbanFlow! For security purposes, you are required to change your temporary password before accessing the system.
            </p>
            <form onSubmit={handleFirstLoginPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Temporary Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFirstLoginCurrent ? "text" : "password"} 
                    value={firstLoginCurrentPwd} 
                    onChange={(e) => setFirstLoginCurrentPwd(e.target.value)} 
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFirstLoginCurrent(!showFirstLoginCurrent)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showFirstLoginCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFirstLoginNew ? "text" : "password"} 
                    value={firstLoginNewPwd} 
                    onChange={(e) => setFirstLoginNewPwd(e.target.value)} 
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFirstLoginNew(!showFirstLoginNew)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showFirstLoginNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFirstLoginConfirm ? "text" : "password"} 
                    value={firstLoginConfirmPwd} 
                    onChange={(e) => setFirstLoginConfirmPwd(e.target.value)} 
                    style={{ width: '100%', padding: '10px', paddingRight: '40px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFirstLoginConfirm(!showFirstLoginConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showFirstLoginConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, #0ea5e9, #06b6d4)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Update Password & Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

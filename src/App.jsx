import React, { useState, useEffect, useRef } from 'react';
import { 
  TrafficCone, Rocket, LogIn, Eye, EyeOff, User, 
  UserCheck, Shield, Mail, Lock, Phone, MapPin, 
  AlertTriangle, Star, CheckCircle, Info, Menu, 
  Satellite, Bell, BarChart3, Users, Route, Activity,
  LayoutDashboard, Sliders, ToggleLeft, Layers, Settings,
  Search, FileText, Database, Server, HardDrive, Play,
  Pause, RefreshCw, Power, MessageSquare, HelpCircle,
  Clock, ChevronDown, ChevronUp, Check, AlertOctagon,
  Wrench, HardHat, ZapOff, Gauge, ShieldAlert, Grid, List,
  CloudRain, ExternalLink, Filter, Calendar, Save, CheckCheck, Key
} from 'lucide-react';
import './App.css';
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';
import OperatorDashboard from './OperatorDashboard';
import SimulationCanvas from './SimulationCanvas';
import UrbanFlowLogo from './UrbanFlowLogo';
import { API_BASE_URL } from './config';

// ══════════════════════════════════════════
// INCIDENT REPORTING DEFINITIONS & DROPDOWN
// ══════════════════════════════════════════

// Official incident types for UrbanFlow incident reporting
// Strictly NO EMOJIS - Clean SaaS design with subtle monochromatic Lucide icons
export const INCIDENT_TYPES = [
  { value: 'Accident', label: 'Accident', icon: AlertOctagon, color: '#ef4444' },
  { value: 'Roadblock', label: 'Roadblock', icon: TrafficCone, color: '#f97316' },
  { value: 'Vehicle Breakdown', label: 'Vehicle Breakdown', icon: Wrench, color: '#eab308' },
  { value: 'Construction', label: 'Construction', icon: HardHat, color: '#f59e0b' },
  { value: 'Road Hazard', label: 'Road Hazard', icon: AlertTriangle, color: '#eab308' },
  { value: 'Signal Failure', label: 'Signal Failure', icon: ZapOff, color: '#8b5cf6' },
  { value: 'Over-Speeding', label: 'Over-Speeding', icon: Gauge, color: '#06b6d4' },
  { value: 'Rash Driving', label: 'Rash Driving', icon: ShieldAlert, color: '#ec4899' },
];

export const getIncidentTypeMeta = (type) => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('speed')) {
    return { label: 'Over-Speeding', icon: Gauge, color: '#06b6d4' };
  }
  if (normalized.includes('rash')) {
    return { label: 'Rash Driving', icon: ShieldAlert, color: '#ec4899' };
  }
  if (normalized.includes('accident')) {
    return { label: 'Accident', icon: AlertOctagon, color: '#ef4444' };
  }
  if (normalized.includes('roadblock')) {
    return { label: 'Roadblock', icon: TrafficCone, color: '#f97316' };
  }
  if (normalized.includes('breakdown')) {
    return { label: 'Vehicle Breakdown', icon: Wrench, color: '#eab308' };
  }
  if (normalized.includes('construction')) {
    return { label: 'Construction', icon: HardHat, color: '#f59e0b' };
  }
  if (normalized.includes('hazard')) {
    return { label: 'Road Hazard', icon: AlertTriangle, color: '#eab308' };
  }
  if (normalized.includes('signal')) {
    return { label: 'Signal Failure', icon: ZapOff, color: '#8b5cf6' };
  }
  return { label: type || 'Incident', icon: AlertTriangle, color: '#f59e0b' };
};

// Accessible, modern SaaS Incident Type Dropdown
function IncidentTypeSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedItem = INCIDENT_TYPES.find(t => t.value === value);

  const handleSelect = (item) => {
    onChange(item.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = INCIDENT_TYPES.findIndex(t => t.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % INCIDENT_TYPES.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = INCIDENT_TYPES.findIndex(t => t.value === value);
        setHighlightedIndex(idx >= 0 ? idx : INCIDENT_TYPES.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + INCIDENT_TYPES.length) % INCIDENT_TYPES.length);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = INCIDENT_TYPES.findIndex(t => t.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else {
        if (highlightedIndex >= 0 && highlightedIndex < INCIDENT_TYPES.length) {
          handleSelect(INCIDENT_TYPES[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Incident Type"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            const idx = INCIDENT_TYPES.findIndex(t => t.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isOpen ? '#0c1626' : '#09111e',
          border: isOpen ? '1.5px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border)',
          borderRadius: '10px',
          padding: '10px 14px',
          color: 'white',
          fontSize: '13.5px',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(6, 182, 212, 0.15), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedItem ? (
            <>
              <selectedItem.icon size={15} style={{ color: selectedItem.color, flexShrink: 0 }} />
              <span style={{ color: '#ffffff', fontWeight: '600' }}>{selectedItem.label}</span>
            </>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Select incident type</span>
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: isOpen ? 'var(--admin-accent-cyan)' : 'rgba(255, 255, 255, 0.45)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#0b1424',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(6, 182, 212, 0.15)',
            backdropFilter: 'blur(16px)',
            padding: '6px',
            maxHeight: '320px',
            overflowY: 'auto'
          }}
        >
          {INCIDENT_TYPES.map((type, idx) => {
            const isSelected = value === type.value;
            const isHighlighted = highlightedIndex === idx;
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(type)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(6, 182, 212, 0.14)'
                    : isHighlighted
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'transparent',
                  border: isSelected ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid transparent',
                  transition: 'background 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={15} style={{ color: type.color, opacity: isSelected ? 1 : 0.85, flexShrink: 0 }} />
                  <span
                    style={{
                      color: isSelected ? '#ffffff' : (isHighlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.82)'),
                      fontSize: '13px',
                      fontWeight: isSelected ? '600' : '500'
                    }}
                  >
                    {type.label}
                  </span>
                </div>
                {isSelected && (
                  <Check size={14} style={{ color: 'var(--admin-accent-cyan)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      if (user.role === 'operator') return 'operator_dashboard';
      if (user.role === 'public') return 'public_dashboard';
    }
    return 'landing';
  });
  const [loginRole, setLoginRole] = useState('public');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginEmailTouched, setLoginEmailTouched] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Security Q, 3: Reset Pwd
  const [forgotSecurityQuestion, setForgotSecurityQuestion] = useState('');
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Registration States
  const [regFName, setRegFName] = useState('');
  const [regLName, setRegLName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmailTouched, setRegEmailTouched] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPhoneTouched, setRegPhoneTouched] = useState(false);
  const [regCity, setRegCity] = useState('');
  const [regSecurityQuestion, setRegSecurityQuestion] = useState('What was the name of your first pet?');
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');
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
  const [firstLoginName, setFirstLoginName] = useState('');
  const [firstLoginPhone, setFirstLoginPhone] = useState('');
  const [firstLoginPhoneTouched, setFirstLoginPhoneTouched] = useState(false);
  const [firstLoginCity, setFirstLoginCity] = useState('');
  const [firstLoginLoading, setFirstLoginLoading] = useState(false);
  const [firstLoginError, setFirstLoginError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFirstLoginName(currentUser.name || '');
      setFirstLoginPhone(currentUser.phone || '');
      setFirstLoginCity(currentUser.city || '');
    }
  }, [currentUser]);

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
  const [publicMetrics, setPublicMetrics] = useState({
    vehicleCount: 15,
    avgWait: 8,
    congestion: 'Low'
  });

  const handlePublicMetricsUpdate = (metrics) => {
    setPublicMetrics(metrics);
  };
  
  // Public Incident Reporting States
  const [incidentType, setIncidentType] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('Baker Jn');
  const [incidentCustomLocation, setIncidentCustomLocation] = useState('');
  const [incidentPriority, setIncidentPriority] = useState('Moderate');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentPhone, setIncidentPhone] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [publicIncidents, setPublicIncidents] = useState([]);
  const [incidentViewMode, setIncidentViewMode] = useState('cards'); // 'cards' | 'table'

  const fetchPublicIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setPublicIncidents(data);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  };

  useEffect(() => {
    fetchPublicIncidents();
  }, [currentPage]);

  // Real-time Kottayam, Kerala Weather & Transit State
  const [kottayamWeather, setKottayamWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const fetchKottayamWeather = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/kottayam`);
      if (res.ok) {
        const data = await res.json();
        setKottayamWeather(data);
      }
    } catch (err) {
      console.error('Failed to fetch Kottayam weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchKottayamWeather();
    const interval = setInterval(fetchKottayamWeather, 300000); // 5 min sync
    return () => clearInterval(interval);
  }, []);

  // ─── Public Notifications State & Handlers ───
  const [publicNotifications, setPublicNotifications] = useState([]);
  const [publicNotificationFilter, setPublicNotificationFilter] = useState('all');
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`urbanflow_read_notifs_${currentUser?.email || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchPublicNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/notifications?user_name=${encodeURIComponent(currentUser?.name || '')}`);
      if (res.ok) {
        const data = await res.json();
        setPublicNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load public notifications:', err);
    }
  };

  useEffect(() => {
    fetchPublicNotifications();
    const interval = setInterval(fetchPublicNotifications, 20000); // 20s live sync
    return () => clearInterval(interval);
  }, [currentUser]);

  const markNotificationAsRead = (id) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(`urbanflow_read_notifs_${currentUser?.email || 'guest'}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    const allIds = publicNotifications.map(n => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem(`urbanflow_read_notifs_${currentUser?.email || 'guest'}`, JSON.stringify(allIds));
    } catch {}
    addToast('All notifications marked as read.', 'info');
  };

  const unreadNotificationCount = publicNotifications.filter(n => !readNotificationIds.includes(n.id)).length;

  // ─── Public Profile State & Handlers ───
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileCity, setProfileCity] = useState(currentUser?.city || 'Kottayam, Kerala');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileCity(currentUser.city || 'Kottayam, Kerala');
    }
  }, [currentUser]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      addToast('Name cannot be empty.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const identifier = currentUser?.id ? String(currentUser.id) : (currentUser?.email || '1');
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(identifier)}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          phone: profilePhone.trim(),
          city: profileCity.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = {
          ...currentUser,
          ...data.user
        };
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        addToast('Profile updated successfully!', 'success');
      } else {
        addToast(data.detail || data.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      addToast(`Error updating profile: ${err.message}`, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Profile Password Change State
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfilePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwdCurrent) {
      addToast('Please enter your current password.', 'error');
      return;
    }
    if (pwdNew.length < 6) {
      addToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          current_password: pwdCurrent,
          new_password: pwdNew
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Password updated successfully!', 'success');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
      } else {
        addToast(data.detail || 'Incorrect current password or update failed.', 'error');
      }
    } catch (err) {
      addToast(`Password update error: ${err.message}`, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  };

  const isValidPhone = (phone) => {
    if (!phone) return false;
    const trimmed = phone.trim();
    if (!trimmed.startsWith('+')) return false;
    const cleaned = trimmed.replace(/[\s-]/g, '');
    return /^\+[1-9]\d{0,2}\d{10}$/.test(cleaned);
  };

  const getPhoneValidationMessage = (phone) => {
    if (!phone || phone.trim() === '') return '';
    const trimmed = phone.trim();
    if (!trimmed.startsWith('+')) {
      return "Include '+' and country code (e.g. +91 9876543210)";
    }
    const cleaned = trimmed.replace(/[\s-]/g, '');
    const digits = cleaned.slice(1);
    if (!/^\d+$/.test(digits)) {
      return "Only digits allowed after '+'";
    }
    if (digits.length < 11) {
      const remaining = 10 - Math.max(0, digits.length - 2);
      return `Enter country code & 10-digit number (${remaining > 0 ? remaining + ' digits remaining' : 'incomplete'})`;
    }
    if (!/^\+[1-9]\d{0,2}\d{10}$/.test(cleaned)) {
      return "Invalid format. Enter country code (1-3 digits) & 10-digit mobile number";
    }
    return "✓ Valid mobile number";
  };

  const handleRoleTabChange = (role) => {
    setLoginRole(role);
    setLoginEmailTouched(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginEmailTouched(true);
    if (!isValidEmail(loginEmail)) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    addToast('Authenticating...', 'info');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
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
          } else if (data.user.role === 'operator') {
            setCurrentPage('operator_dashboard');
          } else if (data.user.role === 'public') {
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
    setFirstLoginError('');

    if (!firstLoginName || !firstLoginName.trim()) {
      setFirstLoginError('Please enter your full name.');
      addToast('Please enter your full name.', 'error');
      return;
    }

    if (!firstLoginPhone || !isValidPhone(firstLoginPhone)) {
      setFirstLoginPhoneTouched(true);
      setFirstLoginError('Please enter a valid mobile number with country code and 10 digits (e.g. +91 9876543210).');
      addToast('Please enter a valid mobile number with country code and 10 digits.', 'error');
      return;
    }

    if (!firstLoginCity || !firstLoginCity.trim()) {
      setFirstLoginError('Please enter your city.');
      addToast('Please enter your city.', 'error');
      return;
    }

    if (!firstLoginCurrentPwd) {
      setFirstLoginError('Please enter your temporary password.');
      addToast('Please enter your temporary password.', 'error');
      return;
    }

    if (firstLoginNewPwd.length < 6) {
      setFirstLoginError('New password must be at least 6 characters.');
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (firstLoginNewPwd !== firstLoginConfirmPwd) {
      setFirstLoginError('New passwords do not match.');
      addToast('New passwords do not match.', 'error');
      return;
    }

    const emailToUse = currentUser?.email || (localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser'))?.email : '') || loginEmail;
    if (!emailToUse) {
      setFirstLoginError('Session email missing. Please log in again.');
      addToast('Session email missing. Please log in again.', 'error');
      return;
    }

    setFirstLoginLoading(true);

    fetch(`${API_BASE_URL}/api/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailToUse,
        current_password: firstLoginCurrentPwd,
        new_password: firstLoginNewPwd,
        name: firstLoginName.trim(),
        phone: firstLoginPhone.trim(),
        city: firstLoginCity.trim()
      })
    }).then(async res => {
      if (res.ok) {
        return res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to change password.');
    }).then((data) => {
      addToast('Password and profile details updated successfully! Welcome to UrbanFlow.', 'success');
      const updatedUser = data.user;
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setFirstLoginCurrentPwd('');
      setFirstLoginNewPwd('');
      setFirstLoginConfirmPwd('');
      setFirstLoginLoading(false);
      setFirstLoginError('');
    }).catch(err => {
      setFirstLoginLoading(false);
      setFirstLoginError(err.message || 'Error updating password.');
      addToast(err.message || 'Error updating password.', 'error');
    });
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    addToast('Looking up account...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSecurityQuestion(data.question);
        setForgotStep(2);
        addToast('Account verified! Answer your security question.', 'success');
      } else {
        addToast(data.detail || 'Email lookup failed.', 'error');
      }
    } catch (err) {
      addToast('Connection error to server.', 'error');
    }
  };

  const handleForgotAnswerSubmit = async (e) => {
    e.preventDefault();
    addToast('Verifying answer...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, answer: forgotSecurityAnswer })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStep(3);
        addToast('Verification successful! You can now reset your password.', 'success');
      } else {
        addToast(data.detail || 'Incorrect answer.', 'error');
      }
    } catch (err) {
      addToast('Connection error to server.', 'error');
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (forgotNewPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }
    addToast('Resetting password...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          answer: forgotSecurityAnswer,
          new_password: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Password reset successfully! Log in with your new password.', 'success');
        // Clear all forgot states
        setForgotEmail('');
        setForgotSecurityQuestion('');
        setForgotSecurityAnswer('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotStep(1);
        setCurrentPage('login');
      } else {
        addToast(data.detail || 'Password reset failed.', 'error');
      }
    } catch (err) {
      addToast('Connection error to server.', 'error');
    }
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

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!incidentType) {
      addToast('Please select an incident type.', 'error');
      return;
    }
    const finalLocation = incidentLocation === 'Other' ? incidentCustomLocation.trim() : incidentLocation;
    if (!finalLocation) {
      addToast('Please specify the incident location or intersection.', 'error');
      return;
    }
    if (!incidentDesc.trim()) {
      addToast('Please describe the situation in the details field.', 'error');
      return;
    }

    setIsSubmittingIncident(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: incidentType,
          location: finalLocation,
          priority: incidentPriority,
          description: incidentDesc.trim(),
          reported_by: currentUser?.name || 'Public Citizen',
          status: 'Pending'
        })
      });

      if (res.ok) {
        const data = await res.json();
        addToast(`Incident ${data.id} submitted! Traffic Controllers and Admins have been notified.`, 'success');
        setIncidentType('');
        setIncidentDesc('');
        setIncidentCustomLocation('');
        fetchPublicIncidents();
      } else {
        addToast('Failed to submit incident report. Please try again.', 'error');
      }
    } catch (err) {
      addToast(`Server connection error: ${err.message}`, 'error');
    } finally {
      setIsSubmittingIncident(false);
    }
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
    if (!isValidEmail(regEmail)) { 
      setRegEmailTouched(true);
      addToast('Please enter a valid email address.', 'error'); 
      return; 
    }
    if (!regPhone || !isValidPhone(regPhone)) {
      setRegPhoneTouched(true);
      addToast('Please enter a valid mobile number with country code and 10 digits (e.g. +91 9876543210).', 'error');
      return;
    }
    if (regPassword.length < 6) { addToast('Password must be at least 6 characters.', 'error'); return; }
    if (regPassword !== regConfirm) { addToast('Passwords do not match.', 'error'); return; }
    if (!regTerms) { addToast('Please accept the Terms of Service.', 'error'); return; }

    addToast('Creating your account...', 'info');

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${regFName} ${regLName}`,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          city: regCity,
          role: 'PUBLIC',
          security_question: regSecurityQuestion,
          security_answer: regSecurityAnswer
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
                <UrbanFlowLogo onClick={() => setCurrentPage('landing')} />
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
              <UrbanFlowLogo onClick={() => setCurrentPage('landing')} style={{ marginBottom: '32px' }} />

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
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Mail className="icon" size={16} />
                    <input 
                      className="form-control" 
                      type="email" 
                      id="login-email" 
                      value={loginEmail} 
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (!loginEmailTouched && e.target.value.length > 0) {
                          setLoginEmailTouched(true);
                        }
                      }} 
                      onBlur={() => {
                        if (loginEmail.length > 0) setLoginEmailTouched(true);
                      }}
                      placeholder="Enter email address" 
                      style={{
                        paddingRight: '40px',
                        borderColor: loginEmailTouched && loginEmail.length > 0 
                          ? (isValidEmail(loginEmail) ? '#10b981' : '#ef4444') 
                          : undefined,
                        boxShadow: loginEmailTouched && loginEmail.length > 0 
                          ? (isValidEmail(loginEmail) ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(239, 68, 68, 0.15)') 
                          : undefined
                      }}
                      required 
                    />
                    {loginEmailTouched && loginEmail.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        {isValidEmail(loginEmail) ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <AlertTriangle size={16} color="#ef4444" />
                        )}
                      </div>
                    )}
                  </div>
                  {loginEmailTouched && loginEmail.length > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      color: isValidEmail(loginEmail) ? '#10b981' : '#ef4444',
                      fontWeight: 500
                    }}>
                      {isValidEmail(loginEmail) ? (
                        <span>✓ Valid email address</span>
                      ) : (
                        <span>Please enter a valid email format (e.g. name@domain.com)</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <a className="forgot-link" href="#" onClick={e => { e.preventDefault(); setCurrentPage('forgot_password'); }}>Forgot?</a>
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
      )}      {currentPage === 'forgot_password' && (
        <div className="auth-page page-enter dark">
          {/* Left Visual panel */}
          <div className="auth-visual">
            <div className="auth-visual-inner">
              <div className="auth-visual-logo">
                <UrbanFlowLogo onClick={() => { setCurrentPage('landing'); setForgotStep(1); }} />
              </div>
              <h2 className="auth-visual-title">Reset Your<br/>Account Password</h2>
              <p className="auth-visual-desc">
                UrbanFlow uses security questions to protect your account. Answer the question you set 
                during registration to reset your password instantly.
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-panel">
            <div className="auth-form-scroll">
              <UrbanFlowLogo onClick={() => { setCurrentPage('landing'); setForgotStep(1); }} style={{ marginBottom: '32px' }} />

              <div className="auth-form-header">
                <h1 className="auth-form-title">Forgot Password</h1>
                <p className="auth-form-subtitle">
                  {forgotStep === 1 && "Enter your email below to verify your account."}
                  {forgotStep === 2 && "Answer the security question you configured."}
                  {forgotStep === 3 && "Configure a new secure password for your account."}
                </p>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleForgotEmailSubmit} className="auth-form" style={{ marginTop: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-email">Email Address</label>
                    <div className="input-icon">
                      <Mail className="icon" size={16} />
                      <input className="form-control" type="email" id="forgot-email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="alex@example.com" required />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '16px' }}>
                    Verify Email
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleForgotAnswerSubmit} className="auth-form" style={{ marginTop: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Your Security Question</label>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', margin: '4px 0 16px', color: '#38bdf8' }}>
                      {forgotSecurityQuestion}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-answer">Your Answer</label>
                    <div className="input-icon">
                      <HelpCircle className="icon" size={16} />
                      <input className="form-control" type="text" id="forgot-answer" value={forgotSecurityAnswer} onChange={(e) => setForgotSecurityAnswer(e.target.value)} placeholder="Enter your answer" required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setForgotStep(1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '13px' }}>
                      Verify Answer
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleForgotResetSubmit} className="auth-form" style={{ marginTop: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-new-pwd">New Password</label>
                    <div className="input-icon">
                      <Lock className="icon" size={16} />
                      <input className="form-control" type={showForgotNewPassword ? 'text' : 'password'} id="forgot-new-pwd" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} placeholder="Enter new password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}>
                        {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-confirm-pwd">Confirm New Password</label>
                    <div className="input-icon">
                      <Lock className="icon" size={16} />
                      <input className="form-control" type={showForgotConfirmPassword ? 'text' : 'password'} id="forgot-confirm-pwd" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}>
                        {showForgotConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '16px' }}>
                    Reset Password
                  </button>
                </form>
              )}

              <div className="auth-footer-text" style={{ marginTop: '24px' }}>
                Remember your password? <span onClick={() => { setCurrentPage('login'); setForgotStep(1); }} style={{ cursor: 'pointer', color: '#0ea5e9', fontWeight: 600 }}>Log In</span>
              </div>
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
                <UrbanFlowLogo onClick={() => setCurrentPage('landing')} />
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
              <UrbanFlowLogo onClick={() => setCurrentPage('landing')} style={{ marginBottom: '28px' }} />

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
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Mail className="icon" size={16} />
                    <input 
                      className="form-control" 
                      type="email" 
                      id="reg-email" 
                      value={regEmail} 
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (!regEmailTouched && e.target.value.length > 0) {
                          setRegEmailTouched(true);
                        }
                      }} 
                      onBlur={() => {
                        if (regEmail.length > 0) setRegEmailTouched(true);
                      }}
                      placeholder="alex@example.com" 
                      style={{
                        paddingRight: '40px',
                        borderColor: regEmailTouched && regEmail.length > 0 
                          ? (isValidEmail(regEmail) ? '#10b981' : '#ef4444') 
                          : undefined,
                        boxShadow: regEmailTouched && regEmail.length > 0 
                          ? (isValidEmail(regEmail) ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(239, 68, 68, 0.15)') 
                          : undefined
                      }}
                      required 
                    />
                    {regEmailTouched && regEmail.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        {isValidEmail(regEmail) ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <AlertTriangle size={16} color="#ef4444" />
                        )}
                      </div>
                    )}
                  </div>
                  {regEmailTouched && regEmail.length > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      color: isValidEmail(regEmail) ? '#10b981' : '#ef4444',
                      fontWeight: 500
                    }}>
                      {isValidEmail(regEmail) ? (
                        <span>✓ Valid email address</span>
                      ) : (
                        <span>Please enter a valid email format (e.g. alex@example.com)</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Mobile Number</label>
                  <div className="input-icon" style={{ position: 'relative' }}>
                    <Phone className="icon" size={16} />
                    <input 
                      className="form-control" 
                      type="tel" 
                      id="reg-phone" 
                      value={regPhone} 
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (!regPhoneTouched && e.target.value.length > 0) {
                          setRegPhoneTouched(true);
                        }
                      }} 
                      onBlur={() => {
                        if (regPhone.length > 0) setRegPhoneTouched(true);
                      }}
                      placeholder="+91 98765 43210" 
                      style={{
                        paddingRight: '40px',
                        borderColor: regPhoneTouched && regPhone.length > 0 
                          ? (isValidPhone(regPhone) ? '#10b981' : '#ef4444') 
                          : undefined,
                        boxShadow: regPhoneTouched && regPhone.length > 0 
                          ? (isValidPhone(regPhone) ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(239, 68, 68, 0.15)') 
                          : undefined
                      }}
                      required 
                    />
                    {regPhoneTouched && regPhone.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        {isValidPhone(regPhone) ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <AlertTriangle size={16} color="#ef4444" />
                        )}
                      </div>
                    )}
                  </div>
                  {regPhoneTouched && regPhone.length > 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      color: isValidPhone(regPhone) ? '#10b981' : '#ef4444',
                      fontWeight: 500
                    }}>
                      <span>{getPhoneValidationMessage(regPhone)}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-city">City</label>
                  <div className="input-icon">
                    <MapPin className="icon" size={16} />
                    <input className="form-control" type="text" id="reg-city" value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="e.g. Kochi" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-security-question">Security Question</label>
                  <select 
                    className="form-control" 
                    id="reg-security-question" 
                    value={regSecurityQuestion} 
                    onChange={(e) => setRegSecurityQuestion(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '8px', width: '100%' }}
                  >
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What school did you attend for sixth grade?">What school did you attend for sixth grade?</option>
                    <option value="What was the make of your first car?">What was the make of your first car?</option>
                    <option value="What is your favorite city?">What is your favorite city?</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-security-answer">Security Answer</label>
                  <div className="input-icon">
                    <HelpCircle className="icon" size={16} />
                    <input className="form-control" type="text" id="reg-security-answer" value={regSecurityAnswer} onChange={(e) => setRegSecurityAnswer(e.target.value)} placeholder="Enter your answer" required />
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

      {currentPage === 'operator_dashboard' && (
        <OperatorDashboard 
          addToast={addToast}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      {currentPage === 'public_dashboard' && (
        <div className="admin-theme page-enter">
          {/* Collapsible Left Navigation */}
          <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-logo">
                <UrbanFlowLogo showText={!isSidebarCollapsed} textColor="var(--admin-text-main)" />
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
                { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
                { id: 'incidents', label: 'Report Incidents', icon: <AlertTriangle size={18} /> },
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
              <div></div>

              <div className="admin-topbar-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span>{kottayamWeather?.current ? `${kottayamWeather.current.icon} ${kottayamWeather.current.temp}°C • Kottayam, Kerala` : '⛅ 30°C • Kottayam, Kerala'}</span>
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
                      { 
                        label: 'Traffic Status', 
                        value: `${publicMetrics.congestion} Flow`, 
                        icon: <Activity size={18} />, 
                        color: publicMetrics.congestion === 'High' ? '#ef4444' : (publicMetrics.congestion === 'Moderate' ? 'var(--admin-accent-cyan)' : 'var(--admin-accent-green)'), 
                        bg: publicMetrics.congestion === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' 
                      },
                      { 
                        label: 'Active Vehicles', 
                        value: `${publicMetrics.vehicleCount} Vehicles`, 
                        icon: <Sliders size={18} />, 
                        color: 'var(--admin-accent-cyan)', 
                        bg: 'rgba(6, 182, 212, 0.1)' 
                      },
                      { 
                        label: 'Avg Signal Delay', 
                        value: `${Math.round(publicMetrics.avgWait)}s Wait`, 
                        icon: <Clock size={18} />, 
                        color: 'var(--admin-accent-blue)', 
                        bg: 'rgba(59, 130, 246, 0.1)' 
                      },
                      { 
                        label: 'Delay Reduction', 
                        value: '-28.9% Delay', 
                        icon: <Star size={18} />, 
                        color: '#8b5cf6', 
                        bg: 'rgba(139, 92, 246, 0.1)' 
                      },
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
                      {/* Large Center Map Panel - Digital Twin Simulation Canvas */}
                      <div className="admin-panel">
                        <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Route size={16} style={{ color: 'var(--admin-accent-cyan)' }} /> Digital Twin Live Traffic Simulation Map
                            </span>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                              Baker Jn Real-Time Adaptive Telemetry Canvas Sync
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              color: 'var(--admin-accent-cyan)', 
                              background: 'rgba(6, 182, 212, 0.1)', 
                              border: '1px solid rgba(6, 182, 212, 0.25)', 
                              padding: '3px 10px', 
                              borderRadius: '12px', 
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-accent-cyan)' }}></span>
                              Live Simulation Active
                            </span>
                          </div>
                        </div>

                        <div style={{ 
                          height: '480px', 
                          background: '#070a13', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          borderRadius: '12px', 
                          position: 'relative', 
                          overflow: 'hidden', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <SimulationCanvas onMetricsUpdate={handlePublicMetricsUpdate} />
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Real-time Weather & Transit for Kottayam, Kerala */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="admin-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <div>
                            <span className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>⛅</span> Hourly Weather & Transit
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--admin-accent-cyan)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📍</span> Kottayam, Kerala, India • Baker Jn Hub
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: '10.5px', 
                            padding: '3px 8px', 
                            borderRadius: '10px', 
                            background: 'rgba(16, 185, 129, 0.1)', 
                            color: '#10b981', 
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontWeight: '600'
                          }}>
                            Live IMD Feed
                          </span>
                        </div>

                        {/* Real-time Hero Weather Card */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.08))',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          marginBottom: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '32px' }}>{kottayamWeather?.current?.icon || '⛅'}</span>
                              <div>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: 'white', lineHeight: '1.1' }}>
                                  {kottayamWeather?.current?.temp !== undefined ? `${kottayamWeather.current.temp}°C` : '30.5°C'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-accent-cyan)', fontWeight: '600' }}>
                                  {kottayamWeather?.current?.condition || 'Tropical Cloudy'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                            <div>💧 Humidity: <span style={{ color: 'white', fontWeight: '600' }}>{kottayamWeather?.current?.humidity ?? 76}%</span></div>
                            <div style={{ marginTop: '3px' }}>💨 Wind: <span style={{ color: 'white', fontWeight: '600' }}>{kottayamWeather?.current?.wind ?? 9.2} km/h</span></div>
                          </div>
                        </div>

                        {/* Transit Advisory Banner */}
                        <div style={{ 
                          background: 'rgba(15, 23, 42, 0.6)', 
                          border: '1px solid rgba(255, 255, 255, 0.06)', 
                          borderRadius: '8px', 
                          padding: '10px 12px', 
                          fontSize: '11.5px', 
                          color: 'var(--admin-text-main)', 
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '14px' }}>🚦</span>
                          <span>{kottayamWeather?.current?.advisory || 'Standard transit conditions across Baker Jn and MC Road corridor.'}</span>
                        </div>

                        {/* Hourly Weather Forecast Rows */}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                          Upcoming Hourly Forecast & Road Conditions
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {(kottayamWeather?.hourly || [
                            { time: '11:00 AM', temp: 31.0, condition: 'Partly Cloudy', icon: '⛅', transit_status: 'Dry roads • Optimal transit', transit_color: '#10b981' },
                            { time: '01:00 PM', temp: 32.4, condition: 'Warm & Humid', icon: '🌤️', transit_status: 'Dry roads • Optimal transit', transit_color: '#10b981' },
                            { time: '03:00 PM', temp: 31.5, condition: 'Passing Showers', icon: '🌦️', transit_status: 'Damp roads • Normal flow', transit_color: '#f59e0b' },
                            { time: '05:00 PM', temp: 29.8, condition: 'Light Drizzle', icon: '🌦️', transit_status: 'Damp roads • Normal flow', transit_color: '#f59e0b' },
                            { time: '07:00 PM', temp: 28.2, condition: 'Scattered Rain', icon: '🌧️', transit_status: 'Wet roads • Drive carefully', transit_color: '#ef4444' }
                          ]).map((h, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '8px 10px', 
                              background: 'rgba(255, 255, 255, 0.02)', 
                              border: '1px solid rgba(255, 255, 255, 0.04)', 
                              borderRadius: '8px', 
                              fontSize: '12px' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>{h.icon}</span>
                                <span style={{ fontWeight: '600', color: 'white', minWidth: '60px' }}>{h.time}</span>
                                <span style={{ color: 'var(--admin-text-muted)', fontSize: '11.5px' }}>{h.condition}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: '700', color: 'white' }}>{h.temp}°C</span>
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '6px', 
                                  background: `${h.transit_color || '#10b981'}15`, 
                                  color: h.transit_color || '#10b981',
                                  border: `1px solid ${h.transit_color || '#10b981'}30`,
                                  fontWeight: '600'
                                }}>
                                  {h.transit_status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Kottayam Transit Hub Corridors */}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                          Kottayam Key Transit Corridors
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[
                            { name: 'MC Road (SH 1)', desc: 'Baker Jn Center', status: 'Normal Flow', color: '#10b981' },
                            { name: 'KK Road (NH 183)', desc: 'Kanjikuzhy Jn', status: 'Moderate (+2m)', color: '#f59e0b' },
                            { name: 'Nagampadam Stand', desc: 'Overbridge Hub', status: 'Regular', color: '#06b6d4' },
                            { name: 'KSRTC Central', desc: 'TB Road Terminal', status: 'On Schedule', color: '#10b981' }
                          ].map((corridor, idx) => (
                            <div key={idx} style={{ 
                              background: 'rgba(15, 23, 42, 0.4)', 
                              border: '1px solid rgba(255, 255, 255, 0.05)', 
                              borderRadius: '8px', 
                              padding: '8px 10px' 
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: 'white' }}>{corridor.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)' }}>{corridor.desc}</div>
                              <div style={{ fontSize: '10px', color: corridor.color, fontWeight: '600', marginTop: '2px' }}>● {corridor.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Peak Traffic Load (Project Data: Baker Jn Corridor) */}
                  <div className="admin-panel" style={{ marginBottom: '20px' }}>
                    <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <span className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📈 Hourly Peak Traffic Load — Baker Jn Corridor
                        </span>
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                          Calibrated with UrbanFlow Digital Twin multi-flow simulation & live TraCI telemetry (Kottayam)
                        </div>
                      </div>
                      {/* Live Sim Telemetry Badges */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '3px 9px', borderRadius: '12px', fontWeight: '600' }}>
                          🚗 {publicMetrics.vehicleCount} Active Vehicles
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '3px 9px', borderRadius: '12px', fontWeight: '600' }}>
                          ⏱️ {Math.round(publicMetrics.avgWait)}s Avg Wait
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '3px 9px', borderRadius: '12px', fontWeight: '600' }}>
                          ⚡ -28.9% Delay Reduction
                        </span>
                      </div>
                    </div>

                    {/* Interactive 8-Period Hourly Traffic Load Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '16px 8px 4px', gap: '10px' }}>
                      {[
                        { hour: '06 AM', label: '06:00 - 08:00 AM', name: 'Early Commute', load: 32, veh: 48, wait: '8s', peak: false },
                        { hour: '08 AM', label: '08:00 - 10:00 AM', name: 'Morning Rush', load: 88, veh: 138, wait: '34s', peak: true },
                        { hour: '10 AM', label: '10:00 - 12:00 PM', name: 'Midday Transit', load: 54, veh: 82, wait: '16s', peak: false, isCurrent: true },
                        { hour: '12 PM', label: '12:00 - 02:00 PM', name: 'Intercity Flow', load: 49, veh: 74, wait: '14s', peak: false },
                        { hour: '02 PM', label: '02:00 - 04:00 PM', name: 'School/Autos', load: 64, veh: 96, wait: '22s', peak: false },
                        { hour: '04 PM', label: '04:00 - 06:00 PM', name: 'Evening Rush', load: 84, veh: 128, wait: '31s', peak: true },
                        { hour: '06 PM', label: '06:00 - 08:00 PM', name: 'Core Evening Peak', load: 98, veh: 156, wait: '39s', peak: true, max: true },
                        { hour: '08 PM', label: '08:00 - 10:00 PM', name: 'Night Transit', load: 41, veh: 62, wait: '11s', peak: false }
                      ].map((bar, idx) => {
                        const barColor = bar.max 
                          ? 'linear-gradient(to top, #ef4444, #f97316)' 
                          : (bar.peak 
                              ? 'linear-gradient(to top, #f59e0b, #eab308)' 
                              : (bar.isCurrent 
                                  ? 'linear-gradient(to top, var(--admin-accent-cyan), #38bdf8)' 
                                  : 'linear-gradient(to top, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.6))'));
                        return (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            flex: 1, 
                            height: '100%', 
                            justifyContent: 'flex-end',
                            position: 'relative'
                          }}>
                            {/* Value badge */}
                            <span style={{ 
                              fontSize: '9.5px', 
                              fontWeight: '700', 
                              color: bar.max ? '#ef4444' : (bar.peak ? '#f59e0b' : (bar.isCurrent ? '#38bdf8' : 'var(--admin-text-muted)')), 
                              marginBottom: '4px' 
                            }}>
                              {bar.isCurrent ? `${publicMetrics.vehicleCount} Sim` : `${bar.load}%`}
                            </span>

                            {/* Bar container */}
                            <div style={{
                              width: '100%',
                              maxWidth: '36px',
                              height: `${bar.isCurrent ? Math.min(100, Math.max(25, publicMetrics.vehicleCount * 3)) : bar.load}%`,
                              background: barColor,
                              borderRadius: '5px 5px 0 0',
                              border: bar.isCurrent ? '1.5px solid #38bdf8' : 'none',
                              boxShadow: bar.isCurrent ? '0 0 12px rgba(56, 189, 248, 0.4)' : (bar.max ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'),
                              transition: 'height 0.4s ease',
                              position: 'relative'
                            }}>
                              {bar.isCurrent && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-18px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: '#0284c7',
                                  color: 'white',
                                  fontSize: '8px',
                                  fontWeight: '800',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  LIVE
                                </div>
                              )}
                            </div>

                            {/* Hour label */}
                            <span style={{ fontSize: '10.5px', fontWeight: bar.isCurrent ? '700' : '600', color: bar.isCurrent ? '#38bdf8' : 'white', marginTop: '6px' }}>
                              {bar.hour}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--admin-text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {bar.name.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Project Data Split Footer */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      fontSize: '11.5px'
                    }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Baker Jn Directional Flow:</span>
                        <span style={{ color: '#06b6d4', fontWeight: '600' }}>North MC Rd (32%)</span>
                        <span style={{ color: '#3b82f6', fontWeight: '600' }}>South MC Rd (28%)</span>
                        <span style={{ color: '#8b5cf6', fontWeight: '600' }}>East KK Rd (23%)</span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>West TB Rd (17%)</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: '600' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span> Max Peak: 06-08 PM (156 veh/h)
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span> Morning Rush: 08-10 AM (138 veh/h)
                        </span>
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
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Upcoming Smart Signal Calibration Work</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>The Traffic Management Bureau is calibrating smart adaptive signal sensors along the Baker Junction & MC Road corridor. Real-time telemetry is actively synced to the Digital Twin.</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Digital Twin System Live in Kottayam</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>UrbanFlow Digital Twin platform is actively monitoring Baker Junction, providing live queue mitigation, adaptive signal control, and real-time weather & transit telemetry.</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {publicActiveTab === 'incidents' && (
                <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Title Row */}
                  <div className="admin-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={24} style={{ color: '#ef4444' }} /> Report Traffic Incident
                      </h1>
                      <div className="admin-subtitle">
                        Submit road disruptions, accidents, and hazards. Directly notified to City Traffic Controllers and Admins in real time.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--admin-accent-green)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-accent-green)' }}></span>
                        Command Center Live Sync
                      </span>
                    </div>
                  </div>

                  {/* Incident Form and Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                    {/* Left: Incident Reporting Form */}
                    <div className="admin-panel" style={{ padding: '24px' }}>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: 0 }}>Incident Details & Telemetry Form</h2>
                        <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>Provide accurate information to facilitate rapid controller dispatch and emergency response.</p>
                      </div>

                      <form onSubmit={handleIncidentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Incident Type & Location */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group">
                            <label id="incident-type-label" className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                              Incident Type *
                            </label>
                            <IncidentTypeSelect
                              value={incidentType}
                              onChange={(val) => setIncidentType(val)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                              Junction / Intersection *
                            </label>
                            <select
                              className="form-control"
                              style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                              value={incidentLocation}
                              onChange={(e) => setIncidentLocation(e.target.value)}
                            >
                              <option value="Baker Jn">Baker Jn</option>
                              <option value="Airport Rd & Ring Rd">Airport Rd & Ring Rd</option>
                              <option value="Harbor Blvd & 5th">Harbor Blvd & 5th</option>
                              <option value="Main St & 1st Ave">Main St & 1st Ave</option>
                              <option value="Park Rd & Central">Park Rd & Central</option>
                              <option value="Station Rd & Market">Station Rd & Market</option>
                              <option value="North Highway Interchange">North Highway Interchange</option>
                              <option value="Other">Custom Location / Street...</option>
                            </select>
                          </div>
                        </div>

                        {incidentLocation === 'Other' && (
                          <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                              Specific Street Name / Landmark *
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Near Central Park Metro Exit 3"
                              style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                              value={incidentCustomLocation}
                              onChange={(e) => setIncidentCustomLocation(e.target.value)}
                              required={incidentLocation === 'Other'}
                            />
                          </div>
                        )}

                        {/* Priority / Severity Level */}
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                            Priority & Urgency Level *
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {[
                              { level: 'Critical', desc: 'Emergency / Immediate Threat', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
                              { level: 'Heavy', desc: 'Severe Hazard / Disruption', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
                              { level: 'Moderate', desc: 'Moderate Flow Issue', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
                              { level: 'Low', desc: 'Minor Advisory', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
                            ].map(p => (
                              <button
                                key={p.level}
                                type="button"
                                onClick={() => setIncidentPriority(p.level)}
                                style={{
                                  padding: '10px 8px',
                                  borderRadius: '8px',
                                  background: incidentPriority === p.level ? p.bg : 'rgba(255,255,255,0.03)',
                                  border: incidentPriority === p.level ? `1.5px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                                  color: incidentPriority === p.level ? p.color : 'rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ fontSize: '13px', fontWeight: '700' }}>{p.level}</div>
                                <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>{p.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Situation Description */}
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                            Situation Details & Observation Description *
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Detail what was observed (e.g. vehicle was driving at very high speed near the junction, or vehicle was repeatedly changing lanes aggressively and driving dangerously)..."
                            style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px', resize: 'vertical' }}
                            value={incidentDesc}
                            onChange={(e) => setIncidentDesc(e.target.value)}
                            required
                          />
                        </div>

                        {/* Reporter Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                              Reporter Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentUser?.name || 'Public Citizen'}
                              disabled
                              style={{ background: '#070c16', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                              Contact Phone (Optional)
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. +91 98765 43210"
                              value={incidentPhone || currentUser?.phone || ''}
                              onChange={(e) => setIncidentPhone(e.target.value)}
                              style={{ background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingIncident}
                          className="btn btn-primary"
                          style={{
                            height: '46px',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            borderColor: '#ef4444',
                            marginTop: '8px',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer'
                          }}
                        >
                          <AlertTriangle size={16} />
                          {isSubmittingIncident ? 'Transmitting to Command Center...' : 'Dispatch Incident Alert to Controllers & Admin'}
                        </button>
                      </form>
                    </div>

                    {/* Right: Protocol & Helplines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="admin-panel" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <Shield size={20} style={{ color: 'var(--admin-accent-cyan)' }} />
                          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Incident Response Protocol</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'rgba(255,255,255,0.7)' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#06b6d4', fontWeight: '700' }}>1.</span>
                            <span><strong>Direct Telemetry Broadcast:</strong> As soon as you click dispatch, an alert pops up on the active Traffic Operator's terminal and System Admin console.</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#06b6d4', fontWeight: '700' }}>2.</span>
                            <span><strong>Controller Verification:</strong> The assigned junction operator verifies the report and overrides signal cycles to clear congestion or dispatch field units.</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#06b6d4', fontWeight: '700' }}>3.</span>
                            <span><strong>Status Tracking:</strong> Follow your report's progression from Pending to Verified & Resolved in real time below.</span>
                          </div>
                        </div>
                      </div>

                      <div className="admin-panel" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Emergency Helplines</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--admin-text-muted)' }}>Traffic Control</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginTop: '2px' }}>103 / 112</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--admin-text-muted)' }}>Ambulance Dispatch</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', marginTop: '2px' }}>108</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--admin-text-muted)' }}>Highway Patrol</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginTop: '2px' }}>1033</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--admin-text-muted)' }}>Road Breakdown</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b', marginTop: '2px' }}>1073</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Live Incident Status Tracker & Community Feed */}
                  <div className="admin-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: 0 }}>City Incident Feed & Verification Status</h2>
                        <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>Live status of community-reported disruptions and response actions taken by traffic controllers.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                          <button
                            type="button"
                            onClick={() => setIncidentViewMode('cards')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: incidentViewMode === 'cards' ? 'var(--admin-accent-cyan)' : 'transparent',
                              color: incidentViewMode === 'cards' ? '#000000' : 'rgba(255,255,255,0.6)',
                              fontWeight: '600',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Grid size={12} /> Cards
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncidentViewMode('table')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: incidentViewMode === 'table' ? 'var(--admin-accent-cyan)' : 'transparent',
                              color: incidentViewMode === 'table' ? '#000000' : 'rgba(255,255,255,0.6)',
                              fontWeight: '600',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <List size={12} /> Table
                          </button>
                        </div>
                        <button
                          onClick={fetchPublicIncidents}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderColor: 'var(--admin-border)' }}
                        >
                          <RefreshCw size={13} />
                          Refresh Feed
                        </button>
                      </div>
                    </div>

                    {publicIncidents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                        No incidents reported yet. All corridors clear.
                      </div>
                    ) : incidentViewMode === 'cards' ? (
                      /* Community Incident Cards Grid */
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {publicIncidents.map(inc => {
                          const meta = getIncidentTypeMeta(inc.type);
                          const IconComponent = meta.icon;
                          const isCritical = inc.priority === 'Critical';
                          const isHeavy = inc.priority === 'Heavy' || inc.priority === 'High';
                          return (
                            <div
                              key={inc.id}
                              style={{
                                background: 'rgba(15, 23, 42, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '12px',
                                padding: '16px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <IconComponent size={16} style={{ color: meta.color }} />
                                  <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.04em', color: 'white' }}>
                                    {inc.type.toUpperCase()}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  color: 'var(--admin-accent-cyan)',
                                  background: 'rgba(6, 182, 212, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(6, 182, 212, 0.25)',
                                  fontWeight: '600'
                                }}>
                                  {inc.id}
                                </span>
                              </div>

                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                fontSize: '12px'
                              }}>
                                <div>
                                  <div style={{ color: 'var(--admin-text-muted)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '600' }}>Intersection</div>
                                  <div style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {inc.location}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--admin-text-muted)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '600' }}>Urgency</div>
                                  <div style={{ marginTop: '2px' }}>
                                    <span style={{
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      background: isCritical ? 'rgba(239, 68, 68, 0.15)' : isHeavy ? 'rgba(249, 115, 22, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: isCritical ? '#ef4444' : isHeavy ? '#f97316' : '#f59e0b',
                                      border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
                                    }}>
                                      {inc.priority}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--admin-text-muted)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
                                  <div style={{ marginTop: '2px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      background: inc.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : (inc.status === 'Verifying' || inc.status === 'Verified') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: inc.status === 'Resolved' ? '#10b981' : (inc.status === 'Verifying' || inc.status === 'Verified') ? '#3b82f6' : '#f59e0b',
                                      border: `1px solid ${inc.status === 'Resolved' ? '#10b981' : (inc.status === 'Verifying' || inc.status === 'Verified') ? '#3b82f6' : '#f59e0b'}`
                                    }}>
                                      ● {inc.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {inc.description && (
                                <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: '1.4' }}>
                                  "{inc.description}"
                                </div>
                              )}

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.45)',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                paddingTop: '8px'
                              }}>
                                <span>Reported by: <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{inc.reportedBy}</strong></span>
                                <span>{inc.time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Table View */
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '10px 14px' }}>ID</th>
                              <th style={{ padding: '10px 14px' }}>Type</th>
                              <th style={{ padding: '10px 14px' }}>Location</th>
                              <th style={{ padding: '10px 14px' }}>Priority</th>
                              <th style={{ padding: '10px 14px' }}>Reported By</th>
                              <th style={{ padding: '10px 14px' }}>Time</th>
                              <th style={{ padding: '10px 14px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {publicIncidents.map(inc => {
                              const meta = getIncidentTypeMeta(inc.type);
                              const IconComponent = meta.icon;
                              const isCritical = inc.priority === 'Critical';
                              const isHeavy = inc.priority === 'Heavy' || inc.priority === 'High';
                              return (
                                <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#06b6d4', fontWeight: '700' }}>{inc.id}</td>
                                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <IconComponent size={14} style={{ color: meta.color }} />
                                      <span>{inc.type}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.85)' }}>{inc.location}</td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      background: isCritical ? 'rgba(239, 68, 68, 0.15)' : isHeavy ? 'rgba(249, 115, 22, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: isCritical ? '#ef4444' : isHeavy ? '#f97316' : '#f59e0b',
                                      border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
                                    }}>
                                      {inc.priority}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{inc.reportedBy}</td>
                                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '11.5px' }}>{inc.time}</td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontSize: '11.5px',
                                      fontWeight: '700',
                                      background: inc.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : (inc.status === 'Verifying' || inc.status === 'Verified') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      color: inc.status === 'Resolved' ? '#10b981' : (inc.status === 'Verifying' || inc.status === 'Verified') ? '#3b82f6' : '#f59e0b',
                                      border: `1px solid ${inc.status === 'Resolved' ? '#10b981' : (inc.status === 'Verifying' || inc.status === 'Verified') ? '#3b82f6' : '#f59e0b'}`
                                    }}>
                                      ● {inc.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {publicActiveTab === 'notifications' && (
                <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Title & Actions Bar */}
                  <div className="admin-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={24} style={{ color: 'var(--admin-accent-cyan)' }} /> Public Traffic Advisories & Notifications
                      </h1>
                      <div className="admin-subtitle">
                        Live corridor alerts, verified citizen incident updates, transit optimizations, and official bulletins for Kottayam.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '12px',
                        color: unreadNotificationCount > 0 ? '#38bdf8' : 'var(--admin-text-muted)',
                        background: unreadNotificationCount > 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: unreadNotificationCount > 0 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--admin-border)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px'
                      }}>
                        {unreadNotificationCount > 0 && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span>
                        )}
                        {unreadNotificationCount > 0 ? `${unreadNotificationCount} Unread Advisories` : 'All Advisories Read'}
                      </span>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                        >
                          <CheckCheck size={14} /> Mark All as Read
                        </button>
                      )}
                      <button
                        onClick={fetchPublicNotifications}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                        title="Check for new notifications"
                      >
                        <RefreshCw size={13} /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Filter Chips Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'All Advisories', count: publicNotifications.length },
                      { id: 'incident', label: 'Incident Updates', count: publicNotifications.filter(n => n.category === 'incident').length },
                      { id: 'transit', label: 'Signal & Corridors', count: publicNotifications.filter(n => n.category === 'transit').length },
                      { id: 'weather', label: 'Weather & Roads', count: publicNotifications.filter(n => n.category === 'weather').length },
                      { id: 'announcement', label: 'System Bulletins', count: publicNotifications.filter(n => n.category === 'announcement').length },
                    ].map(f => {
                      const isActive = publicNotificationFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setPublicNotificationFilter(f.id)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: isActive ? '700' : '500',
                            border: isActive ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid var(--admin-border)',
                            background: isActive ? 'rgba(6, 182, 212, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                            color: isActive ? '#38bdf8' : 'var(--admin-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>{f.label}</span>
                          <span style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                            color: isActive ? '#ffffff' : 'var(--admin-text-muted)',
                            fontWeight: '700'
                          }}>
                            {f.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Notification List Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const filtered = publicNotifications.filter(n =>
                        publicNotificationFilter === 'all' || n.category === publicNotificationFilter
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="admin-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <Bell size={36} style={{ color: 'var(--admin-text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--admin-text-main)', margin: '0 0 6px' }}>
                              No Notifications Found
                            </h3>
                            <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                              {publicNotificationFilter === 'all'
                                ? "There are currently no active public alerts or advisories for Kottayam corridors."
                                : `No notifications currently logged in the '${publicNotificationFilter}' category.`}
                            </p>
                            {publicNotificationFilter !== 'all' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: '16px', borderColor: 'var(--admin-border)' }}
                                onClick={() => setPublicNotificationFilter('all')}
                              >
                                View All Notifications
                              </button>
                            )}
                          </div>
                        );
                      }

                      return filtered.map(notif => {
                        const isRead = readNotificationIds.includes(notif.id);

                        // Icon and accent colors based on category and status
                        let IconComp = Bell;
                        let iconColor = '#06b6d4';
                        let iconBg = 'rgba(6, 182, 212, 0.12)';
                        let categoryLabel = 'TRAFFIC ALERT';

                        if (notif.category === 'incident') {
                          categoryLabel = `INCIDENT ${notif.status ? notif.status.toUpperCase() : 'UPDATE'}`;
                          if (notif.status === 'Resolved') {
                            IconComp = CheckCircle;
                            iconColor = '#10b981';
                            iconBg = 'rgba(16, 185, 129, 0.14)';
                          } else if (notif.status === 'Verified') {
                            IconComp = CheckCircle;
                            iconColor = '#06b6d4';
                            iconBg = 'rgba(6, 182, 212, 0.14)';
                          } else {
                            IconComp = Clock;
                            iconColor = '#f59e0b';
                            iconBg = 'rgba(245, 158, 11, 0.14)';
                          }
                        } else if (notif.category === 'transit') {
                          categoryLabel = 'TRANSIT & SIGNALS';
                          IconComp = Activity;
                          iconColor = '#38bdf8';
                          iconBg = 'rgba(56, 189, 248, 0.14)';
                        } else if (notif.category === 'weather') {
                          categoryLabel = 'WEATHER & ROAD CONDITIONS';
                          IconComp = CloudRain;
                          iconColor = '#0ea5e9';
                          iconBg = 'rgba(14, 165, 233, 0.14)';
                        } else if (notif.category === 'announcement') {
                          categoryLabel = 'SYSTEM BULLETIN';
                          IconComp = Info;
                          iconColor = '#a855f7';
                          iconBg = 'rgba(168, 85, 247, 0.14)';
                        }

                        const isHighPriority = notif.priority === 'Critical' || notif.priority === 'High';

                        return (
                          <div
                            key={notif.id}
                            className="admin-panel"
                            style={{
                              padding: '18px 20px',
                              background: isRead
                                ? 'rgba(11, 20, 36, 0.7)'
                                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(11, 20, 36, 0.95) 100%)',
                              border: isRead
                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                : '1px solid rgba(6, 182, 212, 0.35)',
                              boxShadow: isRead ? 'none' : '0 4px 20px rgba(6, 182, 212, 0.08)',
                              borderRadius: '12px',
                              display: 'flex',
                              gap: '16px',
                              alignItems: 'flex-start',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Icon Avatar */}
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <IconComp size={20} style={{ color: iconColor }} />
                            </div>

                            {/* Main Body */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '10.5px',
                                    fontWeight: '800',
                                    letterSpacing: '0.06em',
                                    color: iconColor,
                                    background: iconBg,
                                    padding: '2px 8px',
                                    borderRadius: '5px'
                                  }}>
                                    {categoryLabel}
                                  </span>

                                  {notif.priority && (
                                    <span style={{
                                      fontSize: '10.5px',
                                      fontWeight: '700',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      background: isHighPriority ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                      color: isHighPriority ? '#ef4444' : 'rgba(255, 255, 255, 0.65)'
                                    }}>
                                      {notif.priority} Priority
                                    </span>
                                  )}

                                  {notif.status && (
                                    <span style={{
                                      fontSize: '10.5px',
                                      fontWeight: '600',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      background: notif.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : (notif.status === 'Verified' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                                      color: notif.status === 'Resolved' ? '#10b981' : (notif.status === 'Verified' ? '#38bdf8' : '#f59e0b')
                                    }}>
                                      {notif.status}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '11.5px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> {notif.time || 'Recent'}
                                  </span>
                                  {!isRead && (
                                    <span style={{
                                      fontSize: '9.5px',
                                      fontWeight: '800',
                                      letterSpacing: '0.05em',
                                      background: '#0284c7',
                                      color: '#ffffff',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}>
                                      NEW
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3 style={{
                                fontSize: '14.5px',
                                fontWeight: '700',
                                color: isRead ? 'rgba(255, 255, 255, 0.9)' : '#ffffff',
                                margin: '0 0 6px'
                              }}>
                                {notif.title}
                              </h3>

                              <p style={{
                                fontSize: '13px',
                                lineHeight: '1.5',
                                color: isRead ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.85)',
                                margin: '0 0 10px'
                              }}>
                                {notif.message}
                              </p>

                              {/* Footer Details & Quick Action Buttons */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px',
                                paddingTop: '8px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                  {notif.location && (
                                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <MapPin size={13} style={{ color: 'var(--admin-accent-cyan)' }} />
                                      {notif.location}
                                    </span>
                                  )}
                                  {notif.incident_id && (
                                    <span style={{
                                      fontSize: '11px',
                                      fontFamily: 'monospace',
                                      fontWeight: '700',
                                      padding: '1px 6px',
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      borderRadius: '4px',
                                      color: 'rgba(255, 255, 255, 0.8)'
                                    }}>
                                      {notif.incident_id}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {notif.category === 'incident' && (
                                    <button
                                      onClick={() => {
                                        setPublicActiveTab('incidents');
                                        addToast('Switched to Incident Tracker view.', 'info');
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(6, 182, 212, 0.3)',
                                        color: '#38bdf8',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                      }}
                                    >
                                      Track in Feed <ExternalLink size={11} />
                                    </button>
                                  )}

                                  {!isRead ? (
                                    <button
                                      onClick={() => markNotificationAsRead(notif.id)}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        fontSize: '11.5px',
                                        fontWeight: '500',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Check size={12} /> Mark Read
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <CheckCircle size={11} /> Read
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {publicActiveTab === 'profile' && (
                <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Title & Info */}
                  <div className="admin-title-row">
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={24} style={{ color: 'var(--admin-accent-cyan)' }} /> Citizen Profile & Settings
                      </h1>
                      <div className="admin-subtitle">
                        Manage your public commuter profile, security credentials, and track your submitted traffic incident reports.
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const userIncidents = publicIncidents.filter(inc => {
                      if (!currentUser) return false;
                      const cName = (currentUser.name || '').trim().toLowerCase();
                      const cEmail = (currentUser.email || '').trim().toLowerCase();
                      const rep = (inc.reportedBy || '').trim().toLowerCase();
                      return rep && (rep === cName || rep === cEmail);
                    });
                    const userResolved = userIncidents.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length;
                    const userVerified = userIncidents.filter(i => (i.status || '').toUpperCase() === 'VERIFIED').length;

                    // Derive initials for avatar
                    const initials = (currentUser?.name || currentUser?.email || 'U')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '20px', alignItems: 'start' }}>
                        {/* LEFT COLUMN: Identity Hero + Personal Information Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Identity Hero Card */}
                          <div className="admin-panel" style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                              <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                fontWeight: '800',
                                letterSpacing: '0.05em',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>

                              <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                                    {currentUser?.name || 'Citizen Commuter'}
                                  </h2>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    background: 'rgba(16, 185, 129, 0.14)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Shield size={11} /> Verified Citizen
                                  </span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                  {currentUser?.email || 'citizen@urbanflow.local'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={12} style={{ color: 'var(--admin-accent-cyan)' }} />
                                  {currentUser?.city || 'Kottayam, Kerala'} &bull; Baker Jn Corridor
                                </div>
                              </div>
                            </div>

                            {/* Citizen Impact Stats */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '12px',
                              marginTop: '20px',
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
                                  {userIncidents.length}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                  Reports Filed
                                </div>
                              </div>

                              <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                                  {userVerified + userResolved}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                  Handled / Resolved
                                </div>
                              </div>

                              <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#a855f7' }}>
                                  100%
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                  Community Trust
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Personal Information Form */}
                          <div className="admin-panel" style={{ padding: '24px' }}>
                            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '14px', marginBottom: '18px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserCheck size={18} style={{ color: 'var(--admin-accent-cyan)' }} /> Personal Information
                              </h3>
                              <p style={{ fontSize: '12.5px', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
                                Keep your contact details up to date for emergency alerts and incident verifications.
                              </p>
                            </div>

                            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                  Full Name *
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ paddingLeft: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                  Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} />
                                  <input
                                    type="email"
                                    className="form-control"
                                    style={{ paddingLeft: '36px', background: '#070c16', border: '1px solid rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', cursor: 'not-allowed' }}
                                    value={currentUser?.email || ''}
                                    disabled
                                  />
                                </div>
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px', display: 'block' }}>
                                  Official account email tied to your UrbanFlow login credentials.
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div className="form-group">
                                  <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                    Phone Number
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ paddingLeft: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                      placeholder="+91 98765 43210"
                                      value={profilePhone}
                                      onChange={(e) => setProfilePhone(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                    Primary Region / City
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ paddingLeft: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                      placeholder="Kottayam, Kerala"
                                      value={profileCity}
                                      onChange={(e) => setProfileCity(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="btn btn-primary"
                                style={{
                                  height: '42px',
                                  marginTop: '6px',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSavingProfile ? (
                                  <>
                                    <RefreshCw size={14} className="spin" /> Saving Changes...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} /> Save Profile Changes
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Password & Security + User Incident Reports History */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Security & Password Card */}
                          <div className="admin-panel" style={{ padding: '24px' }}>
                            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '14px', marginBottom: '18px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Key size={18} style={{ color: 'var(--admin-accent-cyan)' }} /> Security & Password
                              </h3>
                              <p style={{ fontSize: '12.5px', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
                                Update your commuter account password to protect access.
                              </p>
                            </div>

                            <form onSubmit={handleProfilePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                  Current Password *
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                  <input
                                    type={showPwdCurrent ? 'text' : 'password'}
                                    className="form-control"
                                    style={{ paddingLeft: '36px', paddingRight: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                    placeholder="Enter current password"
                                    value={pwdCurrent}
                                    onChange={(e) => setPwdCurrent(e.target.value)}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPwdCurrent(!showPwdCurrent)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                                  >
                                    {showPwdCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                  New Password *
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                  <input
                                    type={showPwdNew ? 'text' : 'password'}
                                    className="form-control"
                                    style={{ paddingLeft: '36px', paddingRight: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                    placeholder="Minimum 6 characters"
                                    value={pwdNew}
                                    onChange={(e) => setPwdNew(e.target.value)}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPwdNew(!showPwdNew)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                                  >
                                    {showPwdNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                  Confirm New Password *
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                                  <input
                                    type={showPwdConfirm ? 'text' : 'password'}
                                    className="form-control"
                                    style={{ paddingLeft: '36px', paddingRight: '36px', background: '#09111e', border: '1px solid var(--admin-border)', color: 'white', fontSize: '13px' }}
                                    placeholder="Re-enter new password"
                                    value={pwdConfirm}
                                    onChange={(e) => setPwdConfirm(e.target.value)}
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPwdConfirm(!showPwdConfirm)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                                  >
                                    {showPwdConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                                {pwdConfirm && (
                                  <span style={{
                                    fontSize: '11px',
                                    marginTop: '4px',
                                    display: 'block',
                                    color: pwdNew === pwdConfirm ? '#10b981' : '#ef4444'
                                  }}>
                                    {pwdNew === pwdConfirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                                  </span>
                                )}
                              </div>

                              <button
                                type="submit"
                                disabled={isUpdatingPassword || (pwdConfirm && pwdNew !== pwdConfirm)}
                                className="btn btn-ghost"
                                style={{
                                  height: '40px',
                                  marginTop: '4px',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  borderColor: 'var(--admin-border)',
                                  color: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                {isUpdatingPassword ? (
                                  <>
                                    <RefreshCw size={14} className="spin" /> Updating Password...
                                  </>
                                ) : (
                                  <>
                                    <Lock size={14} /> Update Password
                                  </>
                                )}
                              </button>
                            </form>
                          </div>

                          {/* My Reported Incidents History Card */}
                          <div className="admin-panel" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '14px', marginBottom: '16px' }}>
                              <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <FileText size={18} style={{ color: 'var(--admin-accent-cyan)' }} /> My Incident Reports
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '3px 0 0' }}>
                                  Track status updates on your community contributions.
                                </p>
                              </div>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: '#38bdf8',
                                fontWeight: '700'
                              }}>
                                {userIncidents.length} Submitted
                              </span>
                            </div>

                            {userIncidents.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                                <AlertTriangle size={32} style={{ color: 'var(--admin-text-muted)', opacity: 0.4, marginBottom: '8px' }} />
                                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
                                  No Reports Submitted Yet
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '4px auto 14px', maxWidth: '300px' }}>
                                  Notice congestion, signal failures, rash driving, or road hazards in Kottayam? Report them directly to Traffic Control.
                                </p>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setPublicActiveTab('incidents')}
                                  style={{ fontSize: '12px', margin: '0 auto' }}
                                >
                                  Report an Incident Now
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                                {userIncidents.map(inc => {
                                  const meta = getIncidentTypeMeta(inc.type);
                                  const IconComponent = meta.icon;
                                  const statusUpper = (inc.status || '').toUpperCase();
                                  const isResolved = statusUpper === 'RESOLVED';
                                  const isVerified = statusUpper === 'VERIFIED';

                                  return (
                                    <div
                                      key={inc.id}
                                      style={{
                                        padding: '12px 14px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <IconComponent size={14} style={{ color: meta.color }} />
                                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                                            {inc.type}
                                          </span>
                                        </div>
                                        <span style={{
                                          fontSize: '10.5px',
                                          fontWeight: '700',
                                          padding: '2px 7px',
                                          borderRadius: '5px',
                                          background: isResolved ? 'rgba(16, 185, 129, 0.15)' : (isVerified ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                                          color: isResolved ? '#10b981' : (isVerified ? '#38bdf8' : '#f59e0b')
                                        }}>
                                          {isResolved ? 'Resolved' : (isVerified ? 'Verified' : 'Pending')}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--admin-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <MapPin size={11} style={{ color: 'var(--admin-accent-cyan)' }} />
                                          {inc.location}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <Clock size={11} />
                                          {inc.time || 'Recent'}
                                        </span>
                                      </div>

                                      {inc.description && (
                                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                                          {inc.description}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Forced Password Reset Modal for First Login */}
      {currentUser && currentUser.role === 'operator' && currentUser.is_first_login && (
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" 
                  value={firstLoginName} 
                  onChange={(e) => setFirstLoginName(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    value={firstLoginPhone} 
                    onChange={(e) => {
                      setFirstLoginPhone(e.target.value);
                      if (!firstLoginPhoneTouched && e.target.value.length > 0) {
                        setFirstLoginPhoneTouched(true);
                      }
                    }} 
                    onBlur={() => {
                      if (firstLoginPhone.length > 0) setFirstLoginPhoneTouched(true);
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px 40px 10px 10px', 
                      background: '#0f172a', 
                      border: `1px solid ${firstLoginPhoneTouched && firstLoginPhone.length > 0
                        ? (isValidPhone(firstLoginPhone) ? '#10b981' : '#ef4444')
                        : 'rgba(255, 255, 255, 0.1)'}`, 
                      boxShadow: firstLoginPhoneTouched && firstLoginPhone.length > 0
                        ? (isValidPhone(firstLoginPhone) ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(239, 68, 68, 0.15)')
                        : undefined,
                      borderRadius: '8px', 
                      color: 'white' 
                    }}
                    placeholder="+91 98765 43210"
                    required
                  />
                  {firstLoginPhoneTouched && firstLoginPhone.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none'
                    }}>
                      {isValidPhone(firstLoginPhone) ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <AlertTriangle size={16} color="#ef4444" />
                      )}
                    </div>
                  )}
                </div>
                {firstLoginPhoneTouched && firstLoginPhone.length > 0 && (
                  <div style={{ 
                    fontSize: '11.5px', 
                    marginTop: '5px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: isValidPhone(firstLoginPhone) ? '#10b981' : '#ef4444',
                    fontWeight: 500 
                  }}>
                    <span>{getPhoneValidationMessage(firstLoginPhone)}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>City</label>
                <input 
                  type="text" 
                  value={firstLoginCity} 
                  onChange={(e) => setFirstLoginCity(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white' }}
                  placeholder="e.g. Kochi"
                  required
                />
              </div>
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
              {firstLoginError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{firstLoginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={firstLoginLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: firstLoginLoading ? 'rgba(14, 165, 233, 0.5)' : 'linear-gradient(to right, #0ea5e9, #06b6d4)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: 'white', 
                  fontWeight: 700, 
                  cursor: firstLoginLoading ? 'not-allowed' : 'pointer', 
                  marginTop: '8px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {firstLoginLoading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  'Update Password & Login'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

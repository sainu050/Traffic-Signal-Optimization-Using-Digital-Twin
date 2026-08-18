import { useState, useEffect } from 'react'
import SimulationCanvas from './SimulationCanvas'
import {
  Sliders, Route, Users, Activity, FileText, 
  Settings, Power, Bell, Shield, UserCheck, Info,
  CheckCircle, AlertTriangle, RefreshCw,
  Search, Play, Pause, Database, Server, ChevronRight,
  Clock, ToggleLeft, User, Eye, Lock
} from 'lucide-react'

export default function OperatorDashboard({ 
  addToast,
  currentUser,
  setCurrentUser
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Dynamic Lists with state from DB
  const [operators, setOperators] = useState([])
  const [incidents, setIncidents] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [localIntersections, setLocalIntersections] = useState([])
  
  // Form/Modal States
  const [showModal, setShowModal] = useState(null) // 'incident'
  const [selectedIntId, setSelectedIntId] = useState('')
  const [selectedOpId, setSelectedOpId] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileCity, setProfileCity] = useState('')

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '')
      setProfilePhone(currentUser.phone || '')
      setProfileCity(currentUser.city || '')
    }
  }, [currentUser])

  // Timing Override Form States
  const [overrideTargetId, setOverrideTargetId] = useState('')
  const [overrideGreen, setOverrideGreen] = useState(45)
  const [overrideRed, setOverrideRed] = useState(60)
  const [overrideDirection, setOverrideDirection] = useState('north_green')

  // System States
  const [sumoSyncing, setSumoSyncing] = useState(false)
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString())

  // Load active operational database resources on mount
  const fetchData = async () => {
    try {
      const resInt = await fetch('http://localhost:8000/api/intersections')
      if (resInt.ok) {
        const dataInt = await resInt.json()
        setLocalIntersections(dataInt)
        if (dataInt.length > 0) {
          setSelectedIntId(dataInt[0].id)
          setOverrideTargetId(dataInt[0].id)
        }
      }
      
      const resOp = await fetch('http://localhost:8000/api/operators')
      if (resOp.ok) {
        const dataOp = await resOp.json()
        setOperators(dataOp)
      }

      const resInc = await fetch('http://localhost:8000/api/incidents')
      if (resInc.ok) {
        const dataInc = await resInc.json()
        setIncidents(dataInc)
      }

      const resLogs = await fetch('http://localhost:8000/api/logs')
      if (resLogs.ok) {
        const dataLogs = await resLogs.json()
        setAuditLogs(dataLogs.map(l => ({
          time: l.time,
          user: l.user_name,
          action: l.action,
          target: l.target
        })))
      }
    } catch (err) {
      console.error("Fetch operational database resources failed: ", err)
    }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleMetricsUpdate = (metrics) => {
    setLocalIntersections(prev => prev.map(int => {
      if (int.name === 'Baker Jn' || int.id === 1) {
        return {
          ...int,
          vehicles: metrics.vehicleCount,
          wait: Math.round(metrics.avgWait),
          congestion: metrics.congestion
        }
      }
      return int
    }))
  }

  // Helper to post audit logs to PostgreSQL
  const logAction = (action, target, user = currentUser ? `${currentUser.name} (Operator)` : 'Traffic Controller') => {
    const time = new Date().toLocaleTimeString()
    const newEntry = { time, user, action, target }
    setAuditLogs(prev => [newEntry, ...prev])
    
    fetch('http://localhost:8000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: user,
        action: action,
        target: target
      })
    }).catch(err => console.error("Post audit logs to PostgreSQL failed:", err))
  }

  // Monitor operations Control API
  const controlMonitor = async (action) => {
    try {
      const res = await fetch(`http://localhost:8000/api/simulation/${action}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(`Traffic simulator ${action} command sent successfully.`, 'success')
        logAction(`Triggered simulator ${action} command`, `Baker Jn Junction`)
      } else {
        addToast(data.message || `Failed to send simulator ${action} command`, 'error')
      }
    } catch (err) {
      addToast(`Connection error to simulation daemon: ${err.message}`, 'error')
    }
  }

  // Handle manual override API call
  const handleManualOverrideSubmit = async (e) => {
    e.preventDefault()
    if (!overrideTargetId) {
      addToast("Please select an intersection.", "error")
      return
    }

    try {
      const targetId = parseInt(overrideTargetId)
      const targetInt = localIntersections.find(i => i.id === targetId)
      const res = await fetch(`http://localhost:8000/api/intersections/${targetId}/override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wait: parseInt(overrideGreen),
          signal: overrideDirection
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(`Manual timing override set for ${targetInt?.name || 'Baker Jn'}.`, "success")
        logAction("Set manual green override", `${targetInt?.name || 'Baker Jn'} (${overrideDirection.replace('_', ' ').toUpperCase()} for ${overrideGreen}s)`)
        fetchData()
      } else {
        addToast(data.message || "Failed to set manual override.", "error")
      }
    } catch (err) {
      addToast(`Failed to establish connection: ${err.message}`, "error")
    }
  }

  // Release manual override back to AUTO mode
  const handleReleaseOverride = async (intId) => {
    try {
      const targetInt = localIntersections.find(i => i.id === intId)
      const res = await fetch(`http://localhost:8000/api/intersections/${intId}/release`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(`Released manual override for ${targetInt?.name || 'Baker Jn'} back to AUTO mode.`, "success")
        logAction("Released manual override to AUTO mode", targetInt?.name || 'Baker Jn')
        fetchData()
      } else {
        addToast(data.message || "Failed to release override.", "error")
      }
    } catch (err) {
      addToast(`Failed to release override: ${err.message}`, "error")
    }
  }

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault()
    const userId = currentUser?.id || currentUser?.user_id
    if (!userId) {
      addToast("Error: User session ID not found.", "error")
      return
    }
    
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          city: profileCity
        })
      })
      const data = await res.json()
      if (res.ok && (data.success || data.user)) {
        addToast("Profile details updated successfully.", "success")
        if (setCurrentUser) {
          setCurrentUser(data.user)
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        }
        setShowProfileModal(false)
      } else {
        addToast(data.detail || data.message || "Failed to update profile.", "error")
      }
    } catch (err) {
      addToast(`Connection error: ${err.message}`, "error")
    }
  }

  // Verify and resolve reported incidents
  const handleVerifyIncident = async (incidentId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/incidents/${incidentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, verified_by: currentUser?.name || 'Traffic Operator' })
      })
      if (res.ok) {
        addToast(`Incident state set to ${newStatus}.`, 'success')
        logAction(`Incident status set to ${newStatus}`, `Incident ID: ${incidentId}`)
        fetchData()
      }
    } catch (err) {
      addToast(`Incident update failed: ${err.message}`, 'error')
    }
  }

  // Generate Report downloads
  const triggerReportDownload = (reportType) => {
    addToast(`Generating traffic performance report (${reportType})...`, 'info')
    
    // Call backend API to log report generation
    fetch('http://localhost:8000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generated_by: currentUser?.id || 2,
        report_type: reportType
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addToast("Report logged to PostgreSQL. Starting download...", "success")
        logAction(`Generated traffic report (${reportType})`, `Baker Jn Junction`)
      }
    })
    .catch(err => console.error("Report logging failed:", err))

    // Formulate a clean mock download
    const element = document.createElement("a")
    const file = new Blob([
      `==================================================\n`,
      ` URBANFLOW DIGITAL TWIN REPORT: ${reportType.toUpperCase()}\n`,
      ` Generated At: ${new Date().toLocaleString()}\n`,
      ` Operator: ${currentUser?.name || 'Traffic Controller'} (${currentUser?.email})\n`,
      `==================================================\n\n`,
      `1. SIMULATION JUNCTION OVERVIEW\n`,
      ` - Active Node: Baker Jn (Digital Twin Intersection ID 1)\n`,
      ` - Controller Mode: 4-Phase Queue-Based Adaptive Controller\n`,
      ` - Telemetry frequency: 20Hz\n\n`,
      `2. PERFORMANCE METRICS\n`,
      ` - Average waiting time: 8.5 seconds\n`,
      ` - Average queue length: 2.1 vehicles\n`,
      ` - Average delay reduction: 28.9% (vs. Conventional Fixed-Timer)\n`,
      ` - Intersection throughput: 142 vehicles/hour\n\n`,
      `3. AUDIT LOG DETAILS\n`,
      ` - System Mode: Online\n`,
      ` - Active Override Status: Auto mode active\n`
    ], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `urbanflow_${reportType}_report.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    window.location.reload()
  }

  const activeIntersection = localIntersections.find(i => i.id === selectedIntId)

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#090d16',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      overflowX: 'hidden'
    }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 260,
        background: 'rgba(5, 8, 22, 0.95)',
        borderRight: '1px solid rgba(6, 182, 212, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        top: 0,
        bottom: 0,
        zIndex: 90
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 38 }}>
          <div className="logo">
            <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
            <span className="logo-text" style={{ color: 'white' }}>Urban<span style={{ color: '#06b6d4' }}>Flow</span></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
            { id: 'incidents', label: 'Traffic Incidents', icon: <AlertTriangle size={18} /> },
            { id: 'monitoring', label: 'System Monitoring', icon: <Sliders size={18} /> },
          ].map(item => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  background: active ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '3px solid #06b6d4' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0',
                  color: active ? '#06b6d4' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Profile Card & Logout */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 16,
          marginTop: 'auto'
        }}>
          <div 
            onClick={() => setShowProfileModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'background 0.2s',
              background: 'rgba(255,255,255,0.02)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            title="Edit Profile Details"
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14
            }}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'O'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser?.name || 'Traffic Operator'}</div>
              <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                Traffic Controller <span style={{ fontSize: 9, color: '#38bdf8' }}>(Edit)</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Power size={14} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{
        flex: 1,
        marginLeft: 260,
        padding: '32px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        {/* Header bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 20
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'incidents' && 'Citizen Incidents'}
              {activeTab === 'logs' && 'Activity Logs'}
              {activeTab === 'monitoring' && 'System Monitoring'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
              Traffic Control Centre Portal
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>CONTROL STATION TIME</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace' }}>{sysTime}</span>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 20,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: '#10b981'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Telemetry Online
            </div>
          </div>
        </header>

        {/* ── TAB CONTENT ── */}
        
        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>MONITORED INTERSECTIONS</span>
                    <h3 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 0', color: '#06b6d4' }}>{localIntersections.length}</h3>
                  </div>
                  <div style={{ padding: 8, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 8, color: '#06b6d4' }}>
                    <Route size={20} />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>ACTIVE OPERATORS</span>
                    <h3 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 0', color: '#8b5cf6' }}>
                      {operators.filter(o => o.status === 'Online').length} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>/ {operators.length}</span>
                    </h3>
                  </div>
                  <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, color: '#8b5cf6' }}>
                    <UserCheck size={20} />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>UNRESOLVED INCIDENTS</span>
                    <h3 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 0', color: '#f59e0b' }}>
                      {incidents.filter(i => i.status.toLowerCase() === 'pending').length}
                    </h3>
                  </div>
                  <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#f59e0b' }}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Split Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              {/* Telemetry Visualizer Card */}
              <div style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Digital Twin Live Map</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Baker Jn Telemetry Canvas Sync</p>
                  </div>
                </div>
                
                <div style={{
                  background: '#070a13',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  height: 480
                }}>
                  <SimulationCanvas onMetricsUpdate={handleMetricsUpdate} />
                </div>
              </div>

              {/* Sidebar Intersections Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Assigned Junctions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {localIntersections.map(int => (
                      <div
                        key={int.id}
                        onClick={() => setSelectedIntId(int.id)}
                        style={{
                          padding: 14,
                          background: selectedIntId === int.id ? 'rgba(6, 182, 212, 0.08)' : '#1f2937',
                          border: selectedIntId === int.id ? '1px solid #06b6d4' : '1px solid transparent',
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{int.name}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: int.congestion === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: int.congestion === 'High' ? '#ef4444' : '#10b981'
                          }}>
                            {int.congestion} Flow
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          <div>Vehicles: <strong style={{ color: 'white' }}>{int.vehicles}</strong></div>
                          <div>Avg Wait: <strong style={{ color: 'white' }}>{int.wait}s</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Report Generation Section */}
                <div style={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 24
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Traffic Analysis Reports</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Download real-time intersection audits logged to PostgreSQL.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => triggerReportDownload('throughput')} className="btn btn-primary" style={{ width: '100%', padding: 10, fontSize: 12, fontWeight: 700 }}>
                      Download Vehicle Throughput Report
                    </button>
                    <button onClick={() => triggerReportDownload('congestion')} className="btn btn-secondary" style={{ width: '100%', padding: 10, fontSize: 12, fontWeight: 700 }}>
                      Download Congestion Index Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Traffic Incidents Tab */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 24
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Citizen-Reported Traffic Disruptions</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>ID</th>
                      <th style={{ padding: '12px 16px' }}>Location</th>
                      <th style={{ padding: '12px 16px' }}>Incident Type</th>
                      <th style={{ padding: '12px 16px' }}>Reporter</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#06b6d4' }}>{inc.id}</td>
                        <td style={{ padding: '16px' }}>{inc.location}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: inc.type === 'Accident' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: inc.type === 'Accident' ? '#ef4444' : '#f59e0b',
                            fontSize: 11,
                            fontWeight: 700
                          }}>
                            {inc.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{inc.reportedBy}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: inc.status === 'Pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: inc.status === 'Pending' ? '#f59e0b' : '#10b981',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            {inc.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {inc.status.toLowerCase() === 'pending' ? (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleVerifyIncident(inc.id.replace('INC-', ''), 'VERIFIED')}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: 11, background: '#10b981', borderColor: '#10b981' }}
                              >
                                Verify & Dispatch
                              </button>
                              <button
                                onClick={() => handleVerifyIncident(inc.id.replace('INC-', ''), 'RESOLVED')}
                                className="btn btn-ghost"
                                style={{ padding: '6px 12px', fontSize: 11, borderColor: 'rgba(255,255,255,0.1)' }}
                              >
                                Reject/Clear
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Verified & Logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* 4. System Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Override Timing Panel */}
            <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              {/* Manual Override controls */}
              <div style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 24
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Manual Signal Override</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  Take control of light patterns during heavy gridlocks or VIP transits.
                </p>
                <form onSubmit={handleManualOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Target Junction</label>
                    <select
                      value={overrideTargetId}
                      onChange={(e) => setOverrideTargetId(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
                    >
                      {localIntersections.map(int => (
                        <option key={int.id} value={int.id}>{int.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Directional Phase Lock (Force Green)</label>
                    <select
                      value={overrideDirection}
                      onChange={(e) => setOverrideDirection(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
                    >
                      <option value="north_green">North (Green) - South/East/West (Red)</option>
                      <option value="east_green">East (Green) - North/South/West (Red)</option>
                      <option value="south_green">South (Green) - North/East/West (Red)</option>
                      <option value="west_green">West (Green) - North/South/East (Red)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Override Duration (seconds)</label>
                    <input
                      type="number"
                      value={overrideGreen}
                      onChange={(e) => setOverrideGreen(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, fontWeight: 700, marginTop: 8 }}>
                    Inject Override Sequence
                  </button>
                </form>
              </div>
            </div>

            {/* Active Override Table */}
            <div style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 24
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Signal Control Status</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Junction ID</th>
                      <th style={{ padding: '12px 16px' }}>Intersection Name</th>
                      <th style={{ padding: '12px 16px' }}>Current State</th>
                      <th style={{ padding: '12px 16px' }}>Signal Mode</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localIntersections.map(int => (
                      <tr key={int.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#06b6d4' }}>INT-{int.id}</td>
                        <td style={{ padding: '16px' }}>{int.name}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: int.signal === 'green' || int.signal === 'north_green' ? 'rgba(16, 185, 129, 0.15)' : (int.signal === 'yellow' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: int.signal === 'green' || int.signal === 'north_green' ? '#10b981' : (int.signal === 'yellow' ? '#f59e0b' : '#ef4444'),
                            fontSize: 11,
                            fontWeight: 700
                          }}>
                            {int.signal.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: int.mode === 'MANUAL' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: int.mode === 'MANUAL' ? '#ef4444' : '#10b981',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            {int.mode || 'AUTO'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {int.mode === 'MANUAL' ? (
                            <button
                              onClick={() => handleReleaseOverride(int.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 11, borderColor: '#ef4444', color: '#ef4444' }}
                            >
                              Release Lock
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Auto Regulation Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }}>
          <div style={{
            background: '#1f2937',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#06b6d4' }}>Edit Profile Settings</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Update your contact information and regional settings.</p>
            
            <form onSubmit={handleProfileUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={profilePhone} 
                  onChange={(e) => setProfilePhone(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>City</label>
                <input 
                  type="text" 
                  value={profileCity} 
                  onChange={(e) => setProfileCity(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  placeholder="e.g. Kochi"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)}
                  style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: 12, background: 'linear-gradient(to right, #0891b2, #06b6d4)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Sliders, Route, Users, Activity, FileText, 
  Settings, Power, Bell, Shield, UserCheck, Info,
  Trash2, Plus, CheckCircle, AlertTriangle, RefreshCw,
  Search, Play, Pause, Database, Server, ChevronRight,
  Clock, ToggleLeft, User, Eye, Lock
} from 'lucide-react'

// Initial Mock Data
const initialOperators = [
  { id: 'OP-001', name: 'Sarah Chen', status: 'Online', assignedIntersection: 'Main St & 1st Ave', email: 'operator@demo.com', phone: '+1 555-0192', activeTime: '4h 12m' },
  { id: 'OP-002', name: 'David Miller', status: 'Online', assignedIntersection: 'Park Rd & Central', email: 'david@demo.com', phone: '+1 555-0143', activeTime: '6h 45m' },
  { id: 'OP-003', name: 'Elena Rostova', status: 'Offline', assignedIntersection: 'Harbor Blvd & 5th', email: 'elena@demo.com', phone: '+1 555-0177', activeTime: '0m' },
  { id: 'OP-004', name: 'Marcus Brody', status: 'Online', assignedIntersection: 'Station Rd & Market', email: 'marcus@demo.com', phone: '+1 555-0158', activeTime: '1h 30m' },
]

const initialCitizens = [
  { id: 'CIT-101', name: 'John Doe', email: 'john.doe@gmail.com', status: 'Active', reportsCount: 4, joinedDate: '2026-01-12' },
  { id: 'CIT-102', name: 'Jane Smith', email: 'jane.smith@yahoo.com', status: 'Active', reportsCount: 2, joinedDate: '2026-02-18' },
  { id: 'CIT-103', name: 'Robert Lee', email: 'robert.lee@outlook.com', status: 'Suspended', reportsCount: 7, joinedDate: '2026-03-05' },
  { id: 'CIT-104', name: 'Alice Wong', email: 'alice.w@gmail.com', status: 'Active', reportsCount: 1, joinedDate: '2026-04-20' },
  { id: 'CIT-105', name: 'Tom Hiddles', email: 'tom.h@gmail.com', status: 'Active', reportsCount: 0, joinedDate: '2026-05-11' },
]

const initialIncidents = [
  { id: 'INC-201', location: 'Main St & 1st Ave', type: 'Accident', priority: 'Critical', reportedBy: 'John Doe', status: 'Pending', time: '10m ago' },
  { id: 'INC-202', location: 'Airport Rd & Ring Rd', type: 'Roadblock', priority: 'Heavy', reportedBy: 'Sarah Chen', status: 'Verifying', time: '25m ago' },
  { id: 'INC-203', location: 'Harbor Blvd & 5th', type: 'Breakdown', priority: 'Moderate', reportedBy: 'Jane Smith', status: 'Resolved', time: '1h ago' },
  { id: 'INC-204', location: 'Park Rd & Central', type: 'Construction', priority: 'Heavy', reportedBy: 'David Miller', status: 'Pending', time: '2h ago' },
]

const initialLogs = [
  { time: '17:10:02', user: 'Dr. Raj Patel (Admin)', action: 'Logged in to Command Centre', target: 'System Session' },
  { time: '16:55:12', user: 'Sarah Chen (Operator)', action: 'Manual override timing update', target: 'Main St & 1st Ave (Green duration set to 50s)' },
  { time: '16:32:44', user: 'Elena Rostova (Operator)', action: 'Logged out', target: 'Junction Terminal B' },
  { time: '15:10:20', user: 'Dr. Raj Patel (Admin)', action: 'Assigned operator Sarah Chen', target: 'Main St & 1st Ave' },
  { time: '14:25:05', user: 'System Watchdog', action: 'Digital Twin Simulation synchronized with TraCI API', target: 'SUMO Port 8813' },
]

export default function AdminDashboard({ 
  intersections = [], 
  setIntersections, 
  controllers = [], 
  setControllers,
  vehiclesCount = 120,
  addToast,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Dynamic Lists with state from DB
  const [operators, setOperators] = useState([])
  const [citizens, setCitizens] = useState([])
  const [incidents, setIncidents] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [localIntersections, setLocalIntersections] = useState([])
  
  // Form/Modal States
  const [showModal, setShowModal] = useState(null) // 'operator', 'intersection', 'assign', 'incident'
  const [selectedIntId, setSelectedIntId] = useState('')
  const [selectedOpId, setSelectedOpId] = useState('')

  // Timing Override Form States
  const [overrideTargetId, setOverrideTargetId] = useState('')
  const [overrideGreen, setOverrideGreen] = useState(45)
  const [overrideRed, setOverrideRed] = useState(60)

  // New item form state
  const [newOpName, setNewOpName] = useState('')
  const [newOpEmail, setNewOpEmail] = useState('')
  const [newOpPhone, setNewOpPhone] = useState('')
  const [newOpInt, setNewOpInt] = useState('')

  const [newIntName, setNewIntName] = useState('')
  const [newIntCongestion, setNewIntCongestion] = useState('Low')
  const [newIntVehicles, setNewIntVehicles] = useState(15)
  const [newIntWait, setNewIntWait] = useState(20)

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
        if (setIntersections) setIntersections(dataInt)
      }
      
      const resOp = await fetch('http://localhost:8000/api/operators')
      if (resOp.ok) {
        const dataOp = await resOp.json()
        setOperators(dataOp)
        if (dataOp.length > 0) {
          setSelectedOpId(dataOp[0].id)
        }
      }

      const resCit = await fetch('http://localhost:8000/api/citizens')
      if (resCit.ok) {
        const dataCit = await resCit.json()
        setCitizens(dataCit)
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
      console.error("Error loading operational lists from backend:", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Sync intersections prop changes
  useEffect(() => {
    if (intersections && intersections.length > 0) {
      setLocalIntersections(intersections)
    }
  }, [intersections])

  // Helper actions - logs action in backend DB
  const logAction = (action, target, user = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Dr. Raj Patel (Admin)') => {
    const time = new Date().toLocaleTimeString()
    
    fetch('http://localhost:8000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: user, action, target })
    }).then(res => {
      if (res.ok) {
        fetch('http://localhost:8000/api/logs')
          .then(r => r.json())
          .then(dataLogs => {
            setAuditLogs(dataLogs.map(l => ({
              time: l.time,
              user: l.user_name,
              action: l.action,
              target: l.target
            })))
          })
      }
    })
  }

  const handleOverrideSubmit = (e) => {
    e.preventDefault()
    const targetId = parseInt(overrideTargetId)
    
    fetch(`http://localhost:8000/api/intersections/${targetId}/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wait: overrideGreen, signal: 'green' })
    }).then(res => {
      if (res.ok) {
        const updated = localIntersections.map(item => {
          if (item.id === targetId) {
            return { ...item, wait: overrideGreen, signal: 'green' }
          }
          return item
        })
        setLocalIntersections(updated)
        if (setIntersections) setIntersections(updated)
        
        const intersectionName = localIntersections.find(i => i.id === targetId)?.name || 'Junction'
        logAction('Manual Timing Override Applied', `${intersectionName} (Green: ${overrideGreen}s, Red: ${overrideRed}s)`)
        addToast(`Successfully overrode signal timings for ${intersectionName}.`, 'success')
      } else {
        addToast('Failed to update timing in database.', 'error')
      }
    }).catch(() => {
      addToast('Failed to connect to backend.', 'error')
    })
  }

  const handleAddOperator = (e) => {
    e.preventDefault()
    if (!newOpName || !newOpEmail) {
      addToast('Please fill out name and email.', 'error')
      return
    }
    
    const assignedInt = newOpInt || 'Unassigned'
    
    fetch('http://localhost:8000/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newOpName,
        email: newOpEmail,
        password: 'password123',
        phone: newOpPhone || '+1 555-0100',
        assignedIntersection: assignedInt
      })
    }).then(res => {
      if (res.ok) {
        fetch('http://localhost:8000/api/operators')
          .then(r => r.json())
          .then(dataOp => setOperators(dataOp))
          
        logAction('Registered Operator', `${newOpName}`)
        addToast(`Operator ${newOpName} added successfully.`, 'success')
        setShowModal(null)
        setNewOpName('')
        setNewOpEmail('')
        setNewOpPhone('')
      } else {
        addToast('Failed to save operator to database.', 'error')
      }
    }).catch(() => {
      addToast('Server offline. Cannot create operator.', 'error')
    })
  }

  const handleAddIntersection = (e) => {
    e.preventDefault()
    if (!newIntName) {
      addToast('Please enter intersection name.', 'error')
      return
    }
    
    fetch('http://localhost:8000/api/intersections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newIntName })
    }).then(res => {
      if (res.ok) {
        fetch('http://localhost:8000/api/intersections')
          .then(r => r.json())
          .then(dataInt => {
            setLocalIntersections(dataInt)
            if (setIntersections) setIntersections(dataInt)
          })
          
        logAction('Created New Intersection', `${newIntName}`)
        addToast(`Junction ${newIntName} initialized.`, 'success')
        setShowModal(null)
        setNewIntName('')
      } else {
        addToast('Failed to save intersection to database.', 'error')
      }
    }).catch(() => {
      addToast('Server offline. Cannot create intersection.', 'error')
    })
  }

  const handleAssignOperator = (e) => {
    e.preventDefault()
    const op = operators.find(o => o.id === selectedOpId)
    const intersection = localIntersections.find(i => i.id === parseInt(selectedIntId))
    if (!op || !intersection) return

    fetch(`http://localhost:8000/api/operators/${op.db_id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedIntersection: intersection.name })
    }).then(res => {
      if (res.ok) {
        setOperators(prev => prev.map(o => {
          if (o.id === op.id) {
            return { ...o, assignedIntersection: intersection.name }
          }
          return o
        }))
        logAction('Assigned Operator to Intersection', `${op.name} assigned to ${intersection.name}`)
        addToast(`Assigned ${op.name} to ${intersection.name}.`, 'success')
        setShowModal(null)
      } else {
        addToast('Failed to update operator assignment.', 'error')
      }
    }).catch(() => {
      addToast('Server offline.', 'error')
    })
  }

  const handleGenerateReport = () => {
    let content = "=== URBANFLOW SYSTEM AUDIT REPORT ===\n"
    content += `Generated on: ${new Date().toLocaleString()}\n`
    content += `Total Logs Count: ${auditLogs.length}\n\n`
    
    auditLogs.forEach((log, idx) => {
      content += `[${log.time}] - ${log.action}\n`
      content += `  Target: ${log.target}\n`
      content += `  Triggered By: ${log.user}\n`
      content += "---------------------------------------\n"
    })
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `urbanflow_audit_report_${Date.now()}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('Successfully generated and downloaded audit log report file.', 'success')
  }

  const handleIncidentResolve = (incId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incId) {
        return { ...inc, status: 'Resolved' }
      }
      return inc
    }))
    const inc = incidents.find(i => i.id === incId)
    logAction('Resolved Reported Traffic Incident', `${inc?.type} at ${inc?.location}`)
    addToast(`Incident ${incId} marked as resolved.`, 'success')
  }

  const handleIncidentVerify = (incId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incId) {
        return { ...inc, status: 'Verifying' }
      }
      return inc
    }))
    const inc = incidents.find(i => i.id === incId)
    logAction('Began Incident Verification', `${inc?.type} at ${inc?.location}`)
    addToast(`Verifying incident ${incId}. Dispatching crew.`, 'info')
  }

  const toggleCitizenStatus = (citId) => {
    setCitizens(prev => prev.map(cit => {
      if (cit.id === citId) {
        const nextStatus = cit.status === 'Active' ? 'Suspended' : 'Active'
        addToast(`Citizen account ${cit.name} is now ${nextStatus}.`, 'info')
        logAction('Updated Citizen Status', `${cit.name} set to ${nextStatus}`)
        return { ...cit, status: nextStatus }
      }
      return cit
    }))
  }

  const triggerSumoSync = () => {
    setSumoSyncing(true)
    addToast('Synchronizing TraCI connections with local SUMO simulation...', 'info')
    setTimeout(() => {
      setSumoSyncing(false)
      addToast('SUMO Digital Twin Simulation successfully synchronized.', 'success')
      logAction('Synchronized Digital Twin', 'SUMO Engine synced on port 8813')
    }, 2000)
  }

  // Get semantic colors
  const getCongestionColor = (level) => {
    if (level === 'Low') return '#10b981' // Green (Normal)
    if (level === 'Moderate') return '#f59e0b' // Yellow (Moderate)
    if (level === 'Heavy') return '#f97316' // Orange (Heavy)
    return '#ef4444' // Red (Critical)
  }

  const handleLogout = () => {
    addToast('Signing out from Command Center...', 'info')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div style={{
      background: '#050816',
      minHeight: '100vh',
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
            { id: 'operators', label: 'Operators', icon: <UserCheck size={18} /> },
            { id: 'intersections', label: 'Intersection Management', icon: <Route size={18} /> },
            { id: 'citizens', label: 'Citizen Accounts', icon: <Users size={18} /> },
            { id: 'incidents', label: 'Traffic Incidents', icon: <AlertTriangle size={18} /> },
            { id: 'logs', label: 'Activity Logs', icon: <FileText size={18} /> },
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
                  color: active ? '#06b6d4' : 'rgba(255,255,255,0.65)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  borderRadius: '0 8px 8px 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#06b6d4' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
        >
          <Power size={18} />
          Logout
        </button>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{
        marginLeft: 260,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#050816'
      }}>
        {/* ── TOP NAV ── */}
        <header style={{
          height: 72,
          borderBottom: '1px solid rgba(6, 182, 212, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          position: 'sticky',
          top: 0,
          background: 'rgba(5, 8, 22, 0.88)',
          backdropFilter: 'blur(20px)',
          zIndex: 80
        }}>
          {/* Section Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Admin Centre</span>
            <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 13, color: '#06b6d4', fontWeight: 600, textTransform: 'capitalize' }}>{activeTab}</span>
          </div>

          {/* Center Search / System Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 100,
              padding: '6px 14px',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.6)'
            }}>
              <span className="animate-ping-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              SUMO Digital Twin Active
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {sysTime}
            </div>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Notifications */}
            <button style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              position: 'relative'
            }} onClick={() => addToast('No new notifications.', 'info')}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            </button>

            {/* Admin Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'white',
                fontSize: 14
              }}>
                {currentUser?.avatar || 'RP'}
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'white' }}>{currentUser?.name || 'Dr. Raj Patel'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                  {currentUser?.role === 'admin' ? 'Sys Admin' : (currentUser?.role === 'operator' ? 'Traffic Operator' : 'Public User')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN SCROLLING CONTENT AREA ── */}
        <main style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* TAB 1: DASHBOARD HOME */}
          {activeTab === 'dashboard' && (
            <>
              {/* Header Titles */}
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Intelligent Command Dashboard
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Digital twin metrics, active operators, and adaptive traffic controllers.
                </p>
              </div>

              {/* STATS OVERVIEW CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
                {[
                  { label: 'Total Intersections', value: localIntersections.length, sub: 'Active junctions', icon: <Route size={18} />, color: '#06b6d4' },
                  { label: 'Active Operators', value: operators.filter(o => o.status === 'Online').length, sub: 'Controllers online', icon: <UserCheck size={18} />, color: '#3b82f6' },
                  { label: 'Active Citizens', value: citizens.filter(c => c.status === 'Active').length, sub: 'Reporting active', icon: <Users size={18} />, color: '#10b981' },
                  { label: 'Reported Incidents', value: incidents.filter(i => i.status !== 'Resolved').length, sub: 'Pending action', icon: <AlertTriangle size={18} />, color: '#ef4444' },
                  { label: 'System Health', value: '98%', sub: 'No critical errors', icon: <Server size={18} />, color: '#8b5cf6' },
                  { label: 'Controllers Online', value: controllers.filter(c => c.status === 'Online').length, sub: 'TraCI active nodes', icon: <Sliders size={18} />, color: '#f59e0b' }
                ].map((s, idx) => (
                  <div key={idx} className="glass" style={{ padding: '16px 20px', cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                      <div style={{ color: s.color }}>{s.icon}</div>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.sub}</span>
                  </div>
                ))}
              </div>

              {/* MAIN CONTENT SPLIT GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, alignItems: 'start' }}>
                
                {/* Left Column Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* City Overview & Intersection Status */}
                  <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Route size={16} style={{ color: '#06b6d4' }} /> Digital Twin City Overview
                      </span>
                      <button className="glow-btn" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={triggerSumoSync} disabled={sumoSyncing}>
                        <RefreshCw size={12} className={sumoSyncing ? 'animate-spin' : ''} /> {sumoSyncing ? 'Syncing...' : 'Sync SUMO'}
                      </button>
                    </div>

                    <div style={{ 
                      height: 240, 
                      background: 'rgba(5, 8, 22, 0.6)', 
                      border: '1px solid rgba(255,255,255,0.06)', 
                      borderRadius: 14, 
                      position: 'relative', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      
                      {/* Interactive Junctions list map layout */}
                      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                        <path d="M 50 120 L 500 120 M 270 10 L 270 230" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
                        <path d="M 50 120 L 500 120 M 270 10 L 270 230" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="5,5" />
                      </svg>
                      
                      {localIntersections.slice(0, 4).map((item, idx) => {
                        const coords = [
                          { x: 160, y: 120 },
                          { x: 270, y: 70 },
                          { x: 380, y: 120 },
                          { x: 270, y: 170 }
                        ][idx] || { x: 200, y: 100 }
                        return (
                          <div 
                            key={item.id}
                            style={{
                              position: 'absolute',
                              left: coords.x,
                              top: coords.y,
                              transform: 'translate(-50%, -50%)',
                              background: '#070e20',
                              border: `1px solid rgba(255,255,255,0.12)`,
                              borderRadius: 12,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              setSelectedIntId(item.id)
                              setActiveTab('intersections')
                              addToast(`Selected ${item.name} for timing controls`, 'info')
                            }}
                          >
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: getCongestionColor(item.congestion),
                              boxShadow: `0 0 8px ${getCongestionColor(item.congestion)}`
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>{item.name.split(' & ')[0]}</span>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{item.wait}s wait · {item.congestion}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Active Operators Table */}
                  <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserCheck size={16} style={{ color: '#3b82f6' }} /> Traffic Operators Control Status
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</th>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Junction</th>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session Uptime</th>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operators.slice(0, 3).map((op) => (
                            <tr key={op.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{op.id}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600 }}>{op.name}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{op.assignedIntersection}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{op.activeTime}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13 }}>
                                <span style={{
                                  background: op.status === 'Online' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${op.status === 'Online' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                  color: op.status === 'Online' ? '#22c55e' : 'rgba(255,255,255,0.4)',
                                  padding: '2px 8px',
                                  borderRadius: 100,
                                  fontSize: 11.5,
                                  fontWeight: 500
                                }}>
                                  {op.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Quick Actions Panel */}
                  <div className="glass" style={{ padding: '24px' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 20 }}>
                      Quick Operations Panel
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Add Operator', action: 'operator', color: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.2)', icon: <Plus size={14} /> },
                        { label: 'Add Intersection', action: 'intersection', color: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', icon: <Plus size={14} /> },
                        { label: 'Assign Operator', action: 'assign', color: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)', icon: <UserCheck size={14} /> },
                        { label: 'Manage Citizens', action: 'citizensTab', color: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', icon: <Users size={14} /> },
                        { label: 'Review Incident', action: 'incidentsTab', color: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', icon: <AlertTriangle size={14} /> },
                        { label: 'View Reports', action: 'logsTab', color: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: <FileText size={14} /> },
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (btn.action.endsWith('Tab')) {
                              setActiveTab(btn.action.replace('Tab', ''))
                            } else {
                              setShowModal(btn.action)
                            }
                          }}
                          style={{
                            background: btn.color,
                            border: `1px solid ${btn.border}`,
                            color: 'white',
                            borderRadius: 12,
                            padding: '12px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                        >
                          {btn.icon}
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Reports / Incidents */}
                  <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: 20 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} style={{ color: '#ef4444' }} /> Recent Traffic Incidents
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {incidents.slice(0, 3).map((row) => (
                        <div key={row.id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{row.id}</span>
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: row.priority === 'Critical' ? '#ef4444' : row.priority === 'Heavy' ? '#f97316' : '#f59e0b'
                              }} />
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{row.type}</span>
                            </div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{row.time}</span>
                          </div>

                          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                            Location: {row.location} · Reported by: {row.reportedBy}
                          </p>

                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {row.status !== 'Resolved' ? (
                              <>
                                <button 
                                  className="glow-btn"
                                  style={{ padding: '6px 12px', fontSize: 11.5, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: 'none' }}
                                  onClick={() => handleIncidentResolve(row.id)}
                                >
                                  Resolve
                                </button>
                                {row.status !== 'Verifying' && (
                                  <button 
                                    style={{
                                      background: 'rgba(255,255,255,0.05)',
                                      border: '1px solid rgba(255,255,255,0.12)',
                                      color: 'white',
                                      borderRadius: 8,
                                      padding: '6px 12px',
                                      fontSize: 11.5,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleIncidentVerify(row.id)}
                                  >
                                    Verify
                                  </button>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={12} /> Resolved
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* TWO PANEL SECOND ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                
                {/* System Activity Log timeline */}
                <div className="glass" style={{ padding: '24px' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <FileText size={16} style={{ color: '#f59e0b' }} /> Audit Trail &amp; Activity Log
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 300, overflowY: 'auto' }}>
                    {auditLogs.slice(0, 5).map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                        {idx < 4 && <div style={{ position: 'absolute', left: 23, top: 24, bottom: -16, width: 2, background: 'rgba(255,255,255,0.06)' }} />}
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: 11,
                          flexShrink: 0
                        }}>
                          {log.time.split(':')[0]}:{log.time.split(':')[1]}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{log.action}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Target: {log.target}</span>
                          <span style={{ fontSize: 10.5, color: '#06b6d4', fontWeight: 500 }}>Operator: {log.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roles and Permissions overview */}
                <div className="glass" style={{ padding: '24px' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Shield size={16} style={{ color: '#8b5cf6' }} /> Roles &amp; Permissions Overview
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { role: 'Admin', color: '#06b6d4', desc: 'Read-write access, assign operators, timing override, add operators/junctions.' },
                      { role: 'Traffic Controller (Operator)', color: '#8b5cf6', desc: 'Read-only node overview, timing overrides for assigned junctions, incident verification.' },
                      { role: 'Public User', color: '#10b981', desc: 'View current congestion rates, check active alerts, report incident details.' }
                    ].map((role) => (
                      <div key={role.role} style={{
                        padding: '14px 18px',
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${role.color}18`,
                        borderRadius: 14
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: role.color }} />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: role.color }}>{role.role}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
                          {role.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: OPERATORS MANAGEMENT */}
          {activeTab === 'operators' && (
            <div className="glass page-enter" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Active Traffic Operators</h2>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Registered command center operators monitoring signals.</p>
                </div>
                <button className="glow-btn" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => setShowModal('operator')}>
                  <Plus size={16} /> Add Operator
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Operator ID</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Intersection</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((op) => (
                      <tr key={op.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{op.id}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>{op.name}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{op.email}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{op.phone}</td>
                        <td style={{ padding: '8px 16px' }}>
                          <select
                            value={localIntersections.find(i => i.name === op.assignedIntersection)?.id || ''}
                            onChange={(e) => {
                              const selectedId = parseInt(e.target.value)
                              const selectedInt = localIntersections.find(i => i.id === selectedId)
                              const nextName = selectedInt ? selectedInt.name : 'Unassigned'
                              
                              fetch(`http://localhost:8000/api/operators/${op.db_id}/assign`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ assignedIntersection: nextName })
                              }).then(res => {
                                if (res.ok) {
                                  setOperators(prev => prev.map(o => {
                                    if (o.id === op.id) {
                                      return { ...o, assignedIntersection: nextName }
                                    }
                                    return o
                                  }))
                                  logAction('Updated Operator Assigned Intersection', `${op.name} assigned to ${nextName}`)
                                  addToast(`Updated assignment for ${op.name} to ${nextName}.`, 'success')
                                } else {
                                  addToast('Failed to update operator assignment in database.', 'error')
                                }
                              }).catch(() => {
                                addToast('Server connection error.', 'error')
                              })
                            }}
                            style={{
                              background: 'rgba(5, 8, 22, 0.6)',
                              border: '1px solid rgba(6, 182, 212, 0.25)',
                              color: '#06b6d4',
                              fontSize: 13,
                              padding: '6px 10px',
                              borderRadius: 8,
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="" style={{ background: '#050816', color: '#fff' }}>Unassigned</option>
                            {localIntersections.map(int => (
                              <option key={int.id} value={int.id} style={{ background: '#050816', color: '#fff' }}>{int.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13 }}>
                          <span style={{
                            background: op.status === 'Online' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${op.status === 'Online' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            color: op.status === 'Online' ? '#22c55e' : 'rgba(255,255,255,0.4)',
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontSize: 11.5,
                            fontWeight: 500
                          }}>
                            {op.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#ef4444',
                              borderRadius: 8,
                              padding: '5px 10px',
                              fontSize: 12,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setOperators(prev => prev.filter(o => o.id !== op.id))
                              logAction('Deleted Operator Account', `${op.name} (${op.id})`)
                              addToast(`Operator ${op.name} deleted.`, 'info')
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INTERSECTION TIMINGS OVERRIDES */}
          {activeTab === 'intersections' && (
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, alignItems: 'start' }} className="page-enter">
              
              {/* Timing control table */}
              <div className="glass" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>Signal Control Override</h2>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>Active timings for controllers. Overriding timings sets manual mode.</p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Intersection Name</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Flow</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Delay</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Congestion</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localIntersections.map((row) => (
                        <tr key={row.id} style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: selectedIntId === row.id ? 'rgba(6,182,212,0.04)' : 'transparent'
                        }}>
                          <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13 }}>{row.vehicles * 3} v/hr</td>
                          <td style={{ padding: '14px 16px', fontSize: 13 }}>{row.wait}s average</td>
                          <td style={{ padding: '14px 16px', fontSize: 13 }}>
                            <span style={{
                              background: `${getCongestionColor(row.congestion)}12`,
                              border: `1px solid ${getCongestionColor(row.congestion)}30`,
                              color: getCongestionColor(row.congestion),
                              padding: '2px 8px',
                              borderRadius: 100,
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              {row.congestion}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              style={{
                                background: 'rgba(6, 182, 212, 0.08)',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                color: '#06b6d4',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 12.5,
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onClick={() => {
                                setSelectedIntId(row.id)
                                setOverrideTargetId(row.id)
                                setOverrideGreen(row.wait)
                              }}
                            >
                              Override
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timing override form card */}
              <div className="glass" style={{ padding: '32px' }}>
                <span style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Override Timing Details
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 24 }}>
                  Apply manual override configuration parameters to active intersection controllers.
                </span>

                <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Selected Junction</label>
                    <select 
                      className="form-control"
                      value={overrideTargetId}
                      onChange={(e) => {
                        const nextId = parseInt(e.target.value)
                        setOverrideTargetId(nextId)
                        const intObj = localIntersections.find(i => i.id === nextId)
                        if (intObj) setOverrideGreen(intObj.wait)
                      }}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    >
                      {localIntersections.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label className="form-label">Manual Green Phase duration</label>
                      <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 14 }}>{overrideGreen} seconds</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="120"
                      value={overrideGreen}
                      onChange={(e) => setOverrideGreen(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label className="form-label">Manual Red Phase duration</label>
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{overrideRed} seconds</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="120"
                      value={overrideRed}
                      onChange={(e) => setOverrideRed(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="glow-btn"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 14 }}
                  >
                    Apply Override Timing
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: CITIZEN ACCOUNTS */}
          {activeTab === 'citizens' && (
            <div className="glass page-enter" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Citizen Accounts Directory</h2>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Public users reporting traffic incidents and viewing updates.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Citizen ID</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Reports Filed</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Registration Date</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citizens.map((cit) => (
                      <tr key={cit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{cit.id}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>{cit.name}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{cit.email}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{cit.reportsCount}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{cit.joinedDate}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13 }}>
                          <span style={{
                            background: cit.status === 'Active' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${cit.status === 'Active' ? 'rgba(34,197,94,0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            color: cit.status === 'Active' ? '#22c55e' : '#ef4444',
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontSize: 11.5,
                            fontWeight: 500
                          }}>
                            {cit.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            style={{
                              background: 'transparent',
                              border: `1px solid ${cit.status === 'Active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                              color: cit.status === 'Active' ? '#ef4444' : '#10b981',
                              borderRadius: 8,
                              padding: '5px 12px',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            onClick={() => toggleCitizenStatus(cit.id)}
                          >
                            {cit.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TRAFFIC INCIDENTS */}
          {activeTab === 'incidents' && (
            <div className="glass page-enter" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Incident Alert Dashboard</h2>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Review incident alerts generated by public user reports and verify signal overrides.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Incident ID</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Junction Location</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Priority</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Reported By</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Time</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{row.id}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>{row.type}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13.5, color: 'rgba(255,255,255,0.8)' }}>{row.location}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13 }}>
                          <span style={{
                            background: row.priority === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : row.priority === 'Heavy' ? 'rgba(249, 115, 22, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            border: `1px solid ${row.priority === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : row.priority === 'Heavy' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            color: row.priority === 'Critical' ? '#ef4444' : row.priority === 'Heavy' ? '#f97316' : '#f59e0b',
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontSize: 11.5,
                            fontWeight: 600
                          }}>
                            {row.priority}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{row.reportedBy}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{row.time}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13 }}>
                          <span style={{
                            color: row.status === 'Resolved' ? '#10b981' : row.status === 'Verifying' ? '#3b82f6' : '#f59e0b',
                            fontWeight: 600,
                            fontSize: 12.5
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {row.status !== 'Resolved' ? (
                              <>
                                <button
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: 6,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                  onClick={() => handleIncidentResolve(row.id)}
                                >
                                  Resolve
                                </button>
                                {row.status !== 'Verifying' && (
                                  <button
                                    style={{
                                      background: 'rgba(255,255,255,0.05)',
                                      border: '1px solid rgba(255,255,255,0.12)',
                                      color: 'white',
                                      borderRadius: 6,
                                      padding: '5px 10px',
                                      fontSize: 12,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleIncidentVerify(row.id)}
                                  >
                                    Verify
                                  </button>
                                )}
                              </>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="glass page-enter" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>System Audit Trail</h2>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Timeline sequence of all manual overrides, registrations, and sync triggers.</p>
                </div>
                <button 
                  className="glow-btn" 
                  style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={handleGenerateReport}
                >
                  <FileText size={16} /> Generate Report File
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {auditLogs.map((log, idx) => (
                  <div key={idx} style={{
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: 10,
                        padding: '8px 14px',
                        color: '#06b6d4',
                        fontWeight: 600,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Clock size={14} />
                        {log.time}
                      </div>
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{log.action}</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Target: {log.target}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block' }}>Triggered By</span>
                      <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{log.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM MONITORING */}
          {activeTab === 'monitoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
              
              {/* Performance grids */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                {[
                  { name: 'API Server', latency: '12ms', uptime: '99.9%', status: 'Operational', icon: <Activity size={20} />, color: '#06b6d4' },
                  { name: 'Database', latency: '4ms', uptime: '100%', status: 'Operational', icon: <Database size={20} />, color: '#3b82f6' },
                  { name: 'Backend Services', latency: '15ms', uptime: '99.95%', status: 'Operational', icon: <Server size={20} />, color: '#8b5cf6' },
                  { name: 'WebSocket Streams', latency: '2ms', uptime: '100%', status: '8 Channels Active', icon: <RefreshCw size={20} />, color: '#10b981' },
                  { name: 'SUMO Engine', latency: '110ms', uptime: '98.4%', status: 'TraCI Syncing', icon: <Sliders size={20} />, color: '#f59e0b' }
                ].map((item, idx) => (
                  <div key={idx} className="glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ color: item.color }}>{item.icon}</div>
                      <span style={{ fontSize: 11, background: `${item.color}15`, color: item.color, padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{item.uptime}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, display: 'block', color: 'white', marginBottom: 4 }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>Latency: {item.latency}</span>
                    <span style={{ fontSize: 12.5, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* System Diagnostics Terminal panel */}
              <div className="glass" style={{ padding: '24px' }}>
                <span style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 20 }}>
                  SUMO TraCI Live Diagnostic Logs
                </span>
                <div style={{
                  background: '#070e20',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: 12.5,
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  maxHeight: 280,
                  overflowY: 'auto'
                }}>
                  <div style={{ color: '#06b6d4' }}>[17:12:00] TraCI Version 20 initialized successfully. API target version: 2.</div>
                  <div style={{ color: '#10b981' }}>[17:12:01] SUMO client synchronized on port 8813 (Loop sync latency: 12ms).</div>
                  <div>[17:12:02] Loading network topology and route boundaries. (Vehicles currently active in sim: 120).</div>
                  <div>[17:12:03] Adaptive light cycle optimization check complete. (All 5 intersections green-light synchronization score: 94.2%).</div>
                  <div style={{ color: '#f59e0b' }}>[17:12:04] Warning: Delay threshold reached on Airport Rd &amp; Ring Rd (Junction ID: 5). Requesting phase adapt.</div>
                  <div style={{ color: '#06b6d4' }}>[17:12:05] Socket pools verified. Active connections: 4. WebSocket buffer rate: 0.1kb/sec.</div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 22, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          animation: 'fadeUp 0.3s ease'
        }}>
          {/* Modal Content Card */}
          <div className="glass" style={{
            width: 460,
            padding: '32px',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '0 0 32px rgba(6,182,212,0.15)',
            position: 'relative'
          }}>
            <button 
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 20,
                cursor: 'pointer'
              }}
              onClick={() => setShowModal(null)}
            >
              &times;
            </button>

            {/* MODAL 1: ADD OPERATOR */}
            {showModal === 'operator' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Add Traffic Operator</h3>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Create credentials and assign an operator to an active junction.</p>
                <form onSubmit={handleAddOperator} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Sarah Chen"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="operator@demo.com"
                      value={newOpEmail}
                      onChange={(e) => setNewOpEmail(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="+1 555-0192"
                      value={newOpPhone}
                      onChange={(e) => setNewOpPhone(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Junction</label>
                    <select 
                      className="form-control"
                      value={newOpInt}
                      onChange={(e) => setNewOpInt(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    >
                      <option value="">Unassigned</option>
                      {localIntersections.map(i => (
                        <option key={i.id} value={i.name}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="glow-btn" style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 12 }}>
                    Create Operator Account
                  </button>
                </form>
              </>
            )}

            {/* MODAL 2: ADD INTERSECTION */}
            {showModal === 'intersection' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Initialize Intersection Node</h3>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Add a physical junction node into the Digital Twin network.</p>
                <form onSubmit={handleAddIntersection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Junction Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Broadway &amp; 42nd St"
                      value={newIntName}
                      onChange={(e) => setNewIntName(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Congestion Initial State</label>
                    <select 
                      className="form-control"
                      value={newIntCongestion}
                      onChange={(e) => setNewIntCongestion(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    >
                      <option value="Low">Low (Normal)</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Heavy">Heavy</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Vehicles Active</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={newIntVehicles}
                        onChange={(e) => setNewIntVehicles(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Wait Time (s)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={newIntWait}
                        onChange={(e) => setNewIntWait(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="glow-btn" style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 12 }}>
                    Initialize Node
                  </button>
                </form>
              </>
            )}

            {/* MODAL 3: ASSIGN OPERATOR */}
            {showModal === 'assign' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Assign Operator to Intersection</h3>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Assign an online operator to actively manage traffic control rules.</p>
                <form onSubmit={handleAssignOperator} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Select Operator</label>
                    <select 
                      className="form-control"
                      value={selectedOpId}
                      onChange={(e) => setSelectedOpId(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    >
                      {operators.map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Intersection</label>
                    <select 
                      className="form-control"
                      value={selectedIntId}
                      onChange={(e) => setSelectedIntId(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: 8, width: '100%' }}
                    >
                      {localIntersections.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="glow-btn" style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 12 }}>
                    Confirm Assignment
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

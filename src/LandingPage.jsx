import { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   Hooks
═══════════════════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCounter(target, duration, active) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration, active])
  return value
}

/* ═══════════════════════════════════════════════════════════════════
   Navbar
═══════════════════════════════════════════════════════════════════ */
function NavLink({ label, href, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onClick={onClick}
      style={{
        color: hovered ? '#06b6d4' : 'rgba(255,255,255,0.6)',
        textDecoration: 'none', fontSize: 15, fontWeight: 500,
        transition: 'color 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  )
}

function Navbar({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const smoothScroll = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: 72, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 3.5rem',
      background: scrolled ? 'rgba(5,8,22,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(6,182,212,0.1)' : 'none',
      transition: 'all 0.35s ease',
    }}>
      {/* Logo */}
      <div 
        className="logo" 
        onClick={(e) => smoothScroll(e, 'platform')} 
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div className="logo-icon">
          <i className="fas fa-traffic-light"></i>
        </div>
        <span className="logo-text" style={{ color: 'white' }}>Urban<span style={{ color: '#06b6d4' }}>Flow</span></span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <NavLink label="Platform" href="#platform" onClick={(e) => smoothScroll(e, 'platform')} />
        <NavLink label="Features" href="#features" onClick={(e) => smoothScroll(e, 'features')} />
        <NavLink label="Contact" href="#contact" onClick={(e) => smoothScroll(e, 'contact')} />
        <button 
          className="glow-btn" 
          style={{ padding: '10px 24px', fontSize: 15 }}
          onClick={() => onNavigate('login')}
        >
          Login
        </button>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   City Animation — hero illustration
═══════════════════════════════════════════════════════════════════ */
function TrafficLight({ x, y, ns, phase }) {
  // NS lights: green 0–75, yellow 75–85, red 85–160
  // EW lights: red 0–85, green 85–150, yellow 150–160
  let color;
  if (ns) {
    color = phase < 75 ? '#22c55e' : phase < 85 ? '#f59e0b' : '#ef4444';
  } else {
    color = phase < 85 ? '#ef4444' : phase < 150 ? '#22c55e' : '#f59e0b';
  }
  const isGreen = color === '#22c55e';
  const isRed = color === '#ef4444';
  const isYellow = color === '#f59e0b';

  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={0} width={10} height={28} rx={2} fill="#060d1f" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      <circle cx={5} cy={5.5} r={3.5} fill={isRed ? '#ef4444' : '#1c2440'} />
      <circle cx={5} cy={14} r={3.5} fill={isYellow ? '#f59e0b' : '#1c2440'} />
      <circle cx={5} cy={22.5} r={3.5} fill={isGreen ? '#22c55e' : '#1c2440'} />
      {isGreen && <circle cx={5} cy={22.5} r={7} fill="rgba(34,197,94,0.2)" />}
      {isRed && <circle cx={5} cy={5.5} r={7} fill="rgba(239,68,68,0.2)" />}
    </g>
  )
}

function CityAnimation() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 160), 100)
    return () => clearInterval(id)
  }, [])

  const nsGreen = phase < 75
  const ewGreen = phase >= 85 && phase < 150

  return (
    <div style={{ position: 'relative', width: 560, height: 500, flexShrink: 0 }}>
      {/* Ambient glow blobs behind SVG */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24,
        background: 'radial-gradient(ellipse 60% 50% at 55% 48%, rgba(6,182,212,0.12) 0%, transparent 70%)',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
        bottom: 60, right: 40, filter: 'blur(30px)',
      }} />

      {/* SVG Intersection */}
      <svg
        width={560} height={500} viewBox="0 0 560 500"
        style={{ position: 'absolute', top: 0, left: 0, borderRadius: 24, overflow: 'hidden' }}
        overflow="hidden"
      >
        <defs>
          <pattern id="cgrid" width={24} height={24} patternUnits="userSpaceOnUse">
            <path d="M24 0L0 0 0 24" fill="none" stroke="rgba(6,182,212,0.07)" strokeWidth={0.5} />
          </pattern>
          <filter id="cglow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="sglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0)" />
            <stop offset="45%" stopColor="rgba(6,182,212,0.12)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0)" />
          </linearGradient>
          <clipPath id="svgClip">
            <rect width={560} height={500} rx={24} />
          </clipPath>
        </defs>

        <g clipPath="url(#svgClip)">
          {/* Background */}
          <rect width={560} height={500} fill="#070e20" />
          <rect width={560} height={500} fill="url(#cgrid)" />

          {/* ── Road surfaces ── */}
          <rect x={0} y={202} width={560} height={88} fill="#0c1428" />
          <rect x={218} y={0} width={114} height={500} fill="#0c1428" />
          {/* Intersection */}
          <rect x={218} y={202} width={114} height={88} fill="#10192e" />

          {/* Road edges */}
          <rect x={0} y={202} width={560} height={1} fill="rgba(255,255,255,0.09)" />
          <rect x={0} y={289} width={560} height={1} fill="rgba(255,255,255,0.09)" />
          <rect x={218} y={0} width={1} height={500} fill="rgba(255,255,255,0.09)" />
          <rect x={331} y={0} width={1} height={500} fill="rgba(255,255,255,0.09)" />

          {/* Center dashes – horizontal */}
          {[0, 50, 100, 150, 270, 340, 390, 440, 490].map((x, i) => (
            <rect key={`hd${i}`} x={x} y={245} width={30} height={2} rx={1} fill="rgba(255,255,255,0.16)" />
          ))}
          {/* Center dashes – vertical */}
          {[0, 50, 100, 150, 208, 308, 360, 410, 455].map((y, i) => (
            <rect key={`vd${i}`} x={274} y={y} width={2} height={30} rx={1} fill="rgba(255,255,255,0.16)" />
          ))}

          {/* Stop lines */}
          {[[0, 202, 217, 2], [333, 202, 227, 2], [0, 288, 217, 2], [333, 288, 227, 2]].map(([x, y, w, h], i) => (
            <rect key={`sl${i}`} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.3)" />
          ))}
          {[[218, 0, 2, 201], [330, 0, 2, 201], [218, 290, 2, 210], [330, 290, 2, 210]].map(([x, y, w, h], i) => (
            <rect key={`slv${i}`} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.3)" />
          ))}

          {/* ── Phase zone highlights ── */}
          {nsGreen && <>
            <rect x={218} y={0} width={114} height={201} fill="rgba(34,197,94,0.035)" />
            <rect x={218} y={290} width={114} height={210} fill="rgba(34,197,94,0.035)" />
          </>}
          {ewGreen && <>
            <rect x={0} y={202} width={217} height={88} fill="rgba(34,197,94,0.035)" />
            <rect x={333} y={202} width={227} height={88} fill="rgba(34,197,94,0.035)" />
          </>}

          {/* ── Corner curb circles ── */}
          {[[218, 202], [331, 202], [218, 290], [331, 290]].map(([cx, cy], i) => (
            <circle key={`cb${i}`} cx={cx} cy={cy} r={4} fill="#0c1428" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          ))}

          {/* ── Building blocks ── */}
          {/* NW */}
          <rect x={18} y={28} width={174} height={148} rx={8} fill="rgba(12,20,40,0.9)" stroke="rgba(6,182,212,0.07)" strokeWidth={1} />
          <rect x={32} y={42} width={72} height={54} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={116} y={42} width={60} height={38} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={32} y={108} width={56} height={54} rx={4} fill="rgba(59,130,246,0.04)" />
          <rect x={100} y={96} width={76} height={66} rx={4} fill="rgba(59,130,246,0.04)" />
          {/* NE */}
          <rect x={358} y={28} width={178} height={148} rx={8} fill="rgba(12,20,40,0.9)" stroke="rgba(6,182,212,0.07)" strokeWidth={1} />
          <rect x={372} y={42} width={80} height={58} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={465} y={42} width={56} height={38} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={372} y={112} width={56} height={50} rx={4} fill="rgba(59,130,246,0.04)" />
          <rect x={440} y={98} width={80} height={64} rx={4} fill="rgba(59,130,246,0.04)" />
          {/* SW */}
          <rect x={18} y={318} width={174} height={154} rx={8} fill="rgba(12,20,40,0.9)" stroke="rgba(6,182,212,0.07)" strokeWidth={1} />
          <rect x={32} y={332} width={72} height={62} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={116} y={342} width={62} height={52} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={32} y={408} width={148} height={52} rx={4} fill="rgba(59,130,246,0.04)" />
          {/* SE */}
          <rect x={358} y={318} width={178} height={154} rx={8} fill="rgba(12,20,40,0.9)" stroke="rgba(6,182,212,0.07)" strokeWidth={1} />
          <rect x={372} y={332} width={80} height={58} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={466} y={348} width={56} height={48} rx={4} fill="rgba(6,182,212,0.04)" />
          <rect x={372} y={404} width={148} height={56} rx={4} fill="rgba(59,130,246,0.04)" />

          {/* ── Vehicles moving RIGHT (upper lane y≈215) ── */}
          {[0, 1.9, 3.8].map((d, i) => (
            <rect key={`vr${i}`} x={-36} y={212} width={30} height={14} rx={4} fill="#06b6d4" filter="url(#cglow)" opacity={0.92}>
              <animateTransform attributeName="transform" type="translate"
                from={`0 0`} to={`596 0`} dur="5.2s" repeatCount="indefinite" begin={`${d}s`} />
            </rect>
          ))}

          {/* ── Vehicles moving LEFT (lower lane y≈263) ── */}
          {[0, 2.1, 4.2].map((d, i) => (
            <rect key={`vl${i}`} x={566} y={263} width={30} height={14} rx={4} fill="#3b82f6" filter="url(#cglow)" opacity={0.92}>
              <animateTransform attributeName="transform" type="translate"
                from={`0 0`} to={`-602 0`} dur="5.8s" repeatCount="indefinite" begin={`${d}s`} />
            </rect>
          ))}

          {/* ── Vehicles moving DOWN (left lane x≈232) ── */}
          {[0, 2.8].map((d, i) => (
            <rect key={`vd${i}`} x={232} y={-34} width={14} height={28} rx={4} fill="#8b5cf6" filter="url(#cglow)" opacity={0.88}>
              <animateTransform attributeName="transform" type="translate"
                from={`0 0`} to={`0 534`} dur="6.4s" repeatCount="indefinite" begin={`${d}s`} />
            </rect>
          ))}

          {/* ── Vehicles moving UP (right lane x≈302) ── */}
          {[0, 3.2].map((d, i) => (
            <rect key={`vu${i}`} x={302} y={506} width={14} height={28} rx={4} fill="#10b981" filter="url(#cglow)" opacity={0.88}>
              <animateTransform attributeName="transform" type="translate"
                from={`0 0`} to={`0 -542`} dur="6.8s" repeatCount="indefinite" begin={`${d}s`} />
            </rect>
          ))}

          {/* ── Traffic lights ── */}
          <TrafficLight x={204} y={183} ns={true} phase={phase} />
          <TrafficLight x={340} y={183} ns={false} phase={phase} />
          <TrafficLight x={204} y={296} ns={false} phase={phase} />
          <TrafficLight x={340} y={296} ns={true} phase={phase} />

          {/* ── Scan line ── */}
          <rect x={0} y={-90} width={560} height={90} fill="url(#scanGrad)">
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to="0 590" dur="3.5s" repeatCount="indefinite" />
          </rect>

          {/* ── Corner rings ── */}
          <circle cx={48} cy={452} r={28} fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth={1} />
          <circle cx={48} cy={452} r={18} fill="none" stroke="rgba(6,182,212,0.07)" strokeWidth={1} />
          <circle cx={512} cy={48} r={22} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={1} />
          <circle cx={512} cy={48} r={13} fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth={1} />

          {/* Frame */}
          <rect x={0} y={0} width={560} height={500} rx={24}
            fill="none" stroke="rgba(6,182,212,0.14)" strokeWidth={1} />
        </g>
      </svg>

      {/* ── Floating metrics cards ── */}
      {/* Flow Rate — top-right */}
      <div className="animate-float glass" style={{
        position: 'absolute', top: 22, right: 8,
        background: 'rgba(5,8,22,0.8)', padding: '14px 18px', width: 170,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <div className="animate-ping-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Flow Rate</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>2,847</div>
        <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 3, fontWeight: 500 }}>vehicles / hour</div>
        <div style={{ marginTop: 12, height: 28, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          {[55, 70, 52, 78, 65, 82, 88, 74, 85, 95].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: 2,
              background: i === 9 ? '#06b6d4' : `rgba(6,182,212,${0.15 + h * 0.003})`,
            }} />
          ))}
        </div>
      </div>

      {/* Signal Sync — bottom-left */}
      <div className="animate-float-b glass" style={{
        position: 'absolute', bottom: 38, left: 4,
        background: 'rgba(5,8,22,0.8)', padding: '14px 18px', width: 164,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Signal Sync</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
          94.2<span style={{ fontSize: 16, color: '#3b82f6', fontWeight: 700 }}>%</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>adaptive efficiency</div>
        <div style={{ marginTop: 10, height: 4, background: 'rgba(59,130,246,0.15)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: '94%', borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
        </div>
      </div>

      {/* Digital Twin — mid-left */}
      <div className="animate-float-c glass" style={{
        position: 'absolute', top: 145, left: 0,
        background: 'rgba(5,8,22,0.8)', padding: '13px 16px', width: 155,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Digital Twin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div className="animate-pulse-ring" style={{ width: 9, height: 9, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Active</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 10 }}>SUMO sim running</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 18, borderRadius: 2,
              background: i < 6 ? `rgba(139,92,246,${0.3 + i * 0.07})` : 'rgba(139,92,246,0.1)',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Buttons
═══════════════════════════════════════════════════════════════════ */
function PrimaryBtn({ label, large, onClick }) {
  return (
    <button className="glow-btn" style={{ padding: large ? '16px 44px' : '14px 32px', fontSize: large ? 17 : 15 }} onClick={onClick}>
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Hero Section
═══════════════════════════════════════════════════════════════════ */
function HeroSection({ onNavigate }) {
  return (
    <section id="platform" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      padding: '72px 3.5rem 0', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div className="animate-blob" style={{
        position: 'absolute', width: 720, height: 720, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        top: '-15%', left: '-8%', filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div className="animate-blob-b" style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        top: '20%', right: '-6%', filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        bottom: '5%', left: '32%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto', width: '100%',
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '4rem 0',
      }}>
        {/* Left */}
        <div style={{ flex: '0 0 auto', maxWidth: 540 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 100, padding: '7px 18px', marginBottom: 32,
          }}>
            <div className="animate-ping-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 13, color: '#06b6d4', fontWeight: 500 }}>v2.0 · Digital Twin Simulation Now Live</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 72, fontWeight: 800, lineHeight: 1.03,
            letterSpacing: '-0.035em', color: 'white', margin: '0 0 26px',
          }}>
            Smarter Traffic.<br />
            <span className="gradient-text">Better Flow.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 18, lineHeight: 1.72, color: 'rgba(255,255,255,0.56)',
            margin: '0 0 44px', maxWidth: 472,
          }}>
            Monitor, simulate, and optimize urban traffic with digital twin simulation and adaptive traffic signal control.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <PrimaryBtn label="Login" onClick={() => onNavigate('login')} />
          </div>

          {/* Feature tags */}
          <div style={{ display: 'flex', gap: 20, marginTop: 48, flexWrap: 'nowrap', alignItems: 'center' }}>
            {['Real-time Monitoring', 'Rule-Based Optimization', 'Digital Twin', 'Manual Override'].map(tag => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#06b6d4' }} />
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Right – city animation */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <CityAnimation />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Stats Bar
═══════════════════════════════════════════════════════════════════ */
const STATS = [
  { value: 127, suffix: '+', label: 'Cities Deployed' },
  { value: 2847, suffix: '', label: 'Avg Vehicles / Hour' },
  { value: 94, suffix: '%', label: 'Signal Efficiency' },
  { value: 38, suffix: '%', label: 'Congestion Reduced' },
]

function StatCard({ value, suffix, label, active }) {
  const count = useCounter(value, 2200, active)
  const [h, setH] = useState(false)
  return (
    <div
      style={{
        textAlign: 'center', padding: '2.2rem 1.5rem', borderRadius: 20,
        background: h ? 'rgba(6,182,212,0.05)' : 'transparent',
        border: `1px solid ${h ? 'rgba(6,182,212,0.18)' : 'transparent'}`,
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      <div style={{
        fontSize: 54, fontWeight: 800, letterSpacing: '-0.045em',
        lineHeight: 1, color: 'white',
      }}>
        <span className="gradient-text-b">{active ? count.toLocaleString() : '0'}</span>
        <span className="gradient-text" style={{ fontSize: 36 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.42)', fontWeight: 500, marginTop: 8, letterSpacing: '0.01em' }}>
        {label}
      </div>
    </div>
  )
}

function StatsSection() {
  const { ref, visible } = useScrollReveal()
  return (
    <section ref={ref} style={{
      padding: '1rem 3.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
      }}>
        {STATS.map((s, i) => <StatCard key={i} {...s} active={visible} />)}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Features Section
═══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="#06b6d4" strokeWidth="2" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
        <path d="M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    color: '#06b6d4',
    title: 'Real-time Traffic Monitoring',
    desc: 'Live sensor data aggregation across intersections, highways, and transit corridors with sub-second latency and 99.9% uptime.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="#3b82f6" strokeWidth="2" />
        <path d="M7 21h10M12 17v4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10l3 3 4-4 3 2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#3b82f6',
    title: 'Digital Twin Simulation',
    desc: 'Full city replica powered by the SUMO engine. Safely test infrastructure changes, policy scenarios, and emergency protocols.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    color: '#8b5cf6',
    title: 'Adaptive Signal Control',
    desc: 'Rule-based traffic light optimization responding to real-time conditions. Configured thresholds dynamically adjust phases.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 10h16M4 14h16M8 8v4M16 12v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#f59e0b',
    title: 'Manual Override Controller',
    desc: 'Allows operators to manually control signal lights for emergency routing, construction, or custom traffic needs.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#10b981" strokeWidth="2"/>
        <path d="M9 17V9M15 17v-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#10b981',
    title: 'Traffic Management Dashboard',
    desc: 'A unified interface tracking queue lengths, vehicle count, and waiting times at each intersection in real-time.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#ef4444',
    title: 'Analytics',
    desc: 'Detailed reporting and visualization of intersection wait times, congestion indexes, and cumulative traffic flow patterns.',
  },
]

function FeatureCard({ icon, color, title, desc, delay, visible }) {
  const [h, setH] = useState(false)
  return (
    <div
      className={`glass reveal${visible ? ' visible' : ''} reveal-delay-${delay}`}
      style={{ padding: '2rem', cursor: 'default' }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, marginBottom: 20,
        background: `${color}14`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: h ? `0 0 24px ${color}35` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.48)', margin: 0 }}>
        {desc}
      </p>
    </div>
  )
}

function FeaturesSection() {
  const { ref, visible } = useScrollReveal(0.05)
  return (
    <section id="features" style={{ padding: '7rem 3.5rem', position: 'relative' }}>
      {/* Background gradient accent */}
      <div style={{
        position: 'absolute', width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
        left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform Features</span>
          </div>
          <h2 style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 18px', color: 'white' }}>
            Everything you need to{' '}
            <span className="gradient-text">manage urban flow</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            A complete platform purpose-built for cities, traffic authorities, and operators.
          </p>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} delay={(i + 1)} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   How It Works
═══════════════════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: '01',
    color: '#06b6d4',
    title: 'Simulation',
    desc: 'SUMO-powered digital twin ingests real city topology, signal timing, and live sensor feeds to construct a full virtual replica.',
  },
  {
    num: '02',
    color: '#3b82f6',
    title: 'Analysis',
    desc: 'Rule-based optimization processes traffic flows, detects anomalies, and surfaces congestion patterns across the entire network.',
  },
  {
    num: '03',
    color: '#8b5cf6',
    title: 'Adaptive Control',
    desc: 'TraCI-driven signal controllers dynamically adjust phase timing across intersections in under 500ms based on rules and configuration.',
  },
  {
    num: '04',
    color: '#10b981',
    title: 'Monitoring',
    desc: 'Continuous real-time dashboards provide operators with live KPIs, incident alerts, and intervention tools across all active zones.',
  },
]

function HowItWorksSection() {
  const { ref, visible } = useScrollReveal(0.05)
  return (
    <section id="how-it-works" style={{ padding: '7rem 3.5rem', background: 'rgba(6,182,212,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>How It Works</span>
          </div>
          <h2 style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px', color: 'white' }}>
            From data to{' '}
            <span className="gradient-text">real-world impact</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Four integrated stages working continuously to keep your city moving.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          {STEPS.map((step, i) => (
            <StepCard key={i} {...step} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ num, color, title, desc, index, visible }) {
  const [h, setH] = useState(false)
  return (
    <div
      className={`reveal${visible ? ' visible' : ''} reveal-delay-${index + 1}`}
      style={{ position: 'relative' }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {/* Connector line */}
      {index < 3 && (
        <div style={{
          position: 'absolute', top: 28, left: 'calc(100% - 0px)', right: 0,
          height: 1, width: '100%', zIndex: 0,
          background: `linear-gradient(90deg, ${color}60, transparent)`,
          pointerEvents: 'none',
        }} />
      )}

      <div className="glass" style={{
        padding: '2rem',
        background: h ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderColor: h ? `${color}30` : 'rgba(255,255,255,0.07)',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}>
        {/* Number badge */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, marginBottom: 20,
          border: `1px solid ${color}40`,
          background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color, letterSpacing: '0.02em',
          boxShadow: h ? `0 0 20px ${color}35` : 'none',
          transition: 'box-shadow 0.3s ease',
        }}>
          {num}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.68, color: 'rgba(255,255,255,0.46)', margin: 0 }}>{desc}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   CTA Section
═══════════════════════════════════════════════════════════════════ */
function CTASection({ onNavigate, onRoleLogin }) {
  const { ref, visible } = useScrollReveal(0.1)
  return (
    <section id="contact" style={{ padding: '7rem 3.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', width: 800, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
        left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div
        ref={ref}
        className={`reveal${visible ? ' visible' : ''}`}
        style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}
      >
        <div className="glass" style={{ padding: '5rem 4rem', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative corner rings */}
          <div className="animate-spin-slow" style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            border: '1px solid rgba(6,182,212,0.12)',
          }} />
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 140, height: 140, borderRadius: '50%',
            border: '1px solid rgba(6,182,212,0.08)',
          }} />
          <div className="animate-spin-slow" style={{
            position: 'absolute', bottom: -50, left: -50,
            width: 160, height: 160, borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.1)',
            animationDirection: 'reverse',
          }} />

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 100, padding: '6px 18px', marginBottom: 28,
          }}>
            <div className="animate-ping-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 13, color: '#06b6d4', fontWeight: 500 }}>Platform Access · Role-based Authentication</span>
          </div>

          <h2 style={{
            fontSize: 56, fontWeight: 800, letterSpacing: '-0.035em',
            color: 'white', margin: '0 0 20px', lineHeight: 1.05,
          }}>
            Access the{' '}
            <span className="gradient-text">UrbanFlow Platform</span>
          </h2>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7,
            margin: '0 0 44px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Three roles, one platform. City administrators, traffic controllers, and public users — each with purpose-built views and tools.
          </p>

          {/* Role cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: 44 }}>
            {[
              { role: 'Admin', icon: '⚙', desc: 'Full system access, configuration, and analytics', color: '#06b6d4', key: 'admin' },
              { role: 'Traffic Controller', icon: '🔴', desc: 'Real-time intersection management and signal override', color: '#8b5cf6', key: 'operator' },
              { role: 'Public User', icon: '🗺', desc: 'Live traffic conditions and route recommendations', color: '#10b981', key: 'public' },
            ].map(r => (
              <div 
                key={r.role} 
                style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${r.color}20`,
                  borderRadius: 14, padding: '1.25rem', cursor: 'pointer'
                }}
                onClick={() => onRoleLogin(r.key)}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.role}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn label="Login to Platform" large onClick={() => onNavigate('login')} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Footer
═══════════════════════════════════════════════════════════════════ */
function Footer({ onNavigate, onRoleLogin }) {
  const smoothScroll = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{
      padding: '3rem 3.5rem 2.5rem',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div className="logo">
                <div className="logo-icon"><i className="fas fa-traffic-light"></i></div>
                <span className="logo-text" style={{ color: 'white' }}>Urban<span style={{ color: '#06b6d4' }}>Flow</span></span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, margin: 0 }}>
              Smart traffic management for smarter cities. Powered by simulation, driven by data.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
            {[
              { heading: 'Platform', links: [
                { label: 'Dashboard', href: '#platform', scrollId: 'platform' },
                { label: 'Simulation', href: '#how-it-works', scrollId: 'how-it-works' },
              ] },
              { heading: 'Company', links: [
                { label: 'About', href: '#' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' }
              ] },
              { heading: 'Support', links: [
                { label: 'Documentation', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Contact', href: '#contact', scrollId: 'contact' }
              ] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                  {col.heading}
                </div>
                {col.links.map(l => (
                  <div key={l.label} style={{ marginBottom: 10 }}>
                    <a href={l.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', textDecoration: 'none', fontWeight: 500 }}
                      onClick={l.scrollId ? (e) => smoothScroll(e, l.scrollId) : undefined}
                      onMouseEnter={e => (e.currentTarget.style.color = '#06b6d4')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
                    >
                      {l.label}
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
            © 2026 UrbanFlow Technologies. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Preferences'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Root App
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onNavigate, onRoleLogin }) {
  return (
    <div style={{ background: '#050816', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Navbar onNavigate={onNavigate} />
      <HeroSection onNavigate={onNavigate} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onNavigate={onNavigate} onRoleLogin={onRoleLogin} />
      <Footer onNavigate={onNavigate} onRoleLogin={onRoleLogin} />
    </div>
  )
}

import React from 'react';

export default function UrbanFlowLogo({ 
  size = 38, 
  fontSize = 20, 
  showText = true, 
  textColor = 'white', 
  subtitle = null, 
  className = '', 
  style = {},
  onClick = null 
}) {
  return (
    <div 
      className={`logo ${className}`} 
      onClick={onClick}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 10, 
        textDecoration: 'none', 
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style 
      }}
    >
      <div 
        className="logo-icon" 
        style={{ 
          width: size, 
          height: size, 
          background: 'none', 
          boxShadow: 'none', 
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg 
          viewBox="0 0 128 128" 
          width={size} 
          height={size} 
          style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(6, 182, 212, 0.35))' }}
        >
          <defs>
            <linearGradient id="ufLogoCyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="ufLogoGreenCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="ufNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Squircle Background Badge */}
          <rect width="128" height="128" rx="28" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />

          {/* Traffic Flow Paths */}
          <g transform="translate(16, 16)">
            <path 
              d="M 28 20 C 28 54, 46 72, 70 72 C 78 72, 84 68, 84 58 C 84 46, 66 38, 50 38 C 36 38, 28 46, 28 58 C 28 76, 46 84, 70 84"
              fill="none" 
              stroke="url(#ufLogoCyanBlue)" 
              strokeWidth="7.5" 
              strokeLinecap="round" 
              filter="url(#ufNeonGlow)" 
            />
            <path 
              d="M 50 16 C 50 36, 66 48, 84 48" 
              fill="none" 
              stroke="url(#ufLogoGreenCyan)" 
              strokeWidth="6.5" 
              strokeLinecap="round" 
            />
            {/* Signal Indicator Nodes */}
            <circle cx="28" cy="20" r="5" fill="#10b981" />
            <circle cx="50" cy="16" r="4.5" fill="#06b6d4" />
            <circle cx="70" cy="84" r="5" fill="#3b82f6" />
            <circle cx="84" cy="48" r="4" fill="#f59e0b" />
          </g>
        </svg>
      </div>

      {showText && (
        <span className="logo-text" style={{ color: textColor, fontSize: fontSize, display: 'inline-flex', alignItems: 'center' }}>
          Urban<span style={{ 
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            color: '#06b6d4'
          }}>Flow</span>
        </span>
      )}
    </div>
  );
}

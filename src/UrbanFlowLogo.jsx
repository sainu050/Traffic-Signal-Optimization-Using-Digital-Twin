import React from 'react';
import urbanflowLogoImg from './assets/urbanflow_logo.jpg';

export default function UrbanFlowLogo({ 
  size = 40, 
  fontSize = 20, 
  showText = true, 
  textColor = 'white', 
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
        gap: 12, 
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
        <img 
          src={urbanflowLogoImg} 
          alt="UrbanFlow Logo" 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '10px', 
            objectFit: 'cover',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            boxShadow: '0 2px 10px rgba(6, 182, 212, 0.35)',
            display: 'block'
          }} 
        />
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

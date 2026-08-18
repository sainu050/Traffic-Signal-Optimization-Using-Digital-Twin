import React, { useEffect, useRef, useState } from 'react'

export default function SimulationCanvas({ onMetricsUpdate }) {
  const canvasRef = useRef(null)
  const [simulationState, setSimulationState] = useState({
    signals: { horizontal: 'green', vertical: 'red' },
    timers: { horizontal: 12, vertical: 15 },
    vehicles: []
  })
  const [isConnected, setIsConnected] = useState(false)

  // Establish WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/simulation/ws')

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data)
        setSimulationState(state)
        
        // Trigger parent callback if provided
        if (onMetricsUpdate) {
          onMetricsUpdate({
            vehicleCount: state.vehicle_count || state.vehicles?.length || 0,
            avgWait: state.avg_wait || 0,
            congestion: (state.vehicles?.length || 0) >= 10 ? 'High' : ((state.vehicles?.length || 0) >= 4 ? 'Moderate' : 'Low')
          })
        }
      } catch (err) {
        console.error('WS parse error:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, 600, 600)

    // 1. Draw Grid Background
    ctx.fillStyle = '#050816'
    ctx.fillRect(0, 0, 600, 600)
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.lineWidth = 1
    const gridSize = 30
    for (let x = 0; x < 600; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 600)
      ctx.stroke()
    }
    for (let y = 0; y < 600; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(600, y)
      ctx.stroke()
    }

    // 2. Draw Roads (Grey asphalt)
    // Horizontal road centered at y = 300 (width = 80, y range 260 to 340)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 260, 600, 80)
    
    // Vertical road centered at x = 300 (width = 80, x range 260 to 340)
    ctx.fillRect(260, 0, 80, 600)

    // Central junction box
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(260, 260, 80, 80)

    // 3. Draw Center Dividers (Double Yellow Lines)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1.5
    
    // Horizontal Dividers (skip central junction box)
    // Left side divider
    ctx.beginPath()
    ctx.moveTo(0, 298)
    ctx.lineTo(260, 298)
    ctx.moveTo(0, 302)
    ctx.lineTo(260, 302)
    ctx.stroke()
    // Right side divider
    ctx.beginPath()
    ctx.moveTo(340, 298)
    ctx.lineTo(600, 298)
    ctx.moveTo(340, 302)
    ctx.lineTo(600, 302)
    ctx.stroke()

    // Vertical Dividers (skip central junction box)
    // Top side divider
    ctx.beginPath()
    ctx.moveTo(298, 0)
    ctx.lineTo(298, 260)
    ctx.moveTo(302, 0)
    ctx.lineTo(302, 260)
    ctx.stroke()
    // Bottom side divider
    ctx.beginPath()
    ctx.moveTo(298, 340)
    ctx.lineTo(298, 600)
    ctx.moveTo(302, 340)
    ctx.lineTo(302, 600)
    ctx.stroke()

    // 4. Draw Lane Stopping Lines (Solid White Lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 4
    
    // West to East stopping line (bottom-left entry, stop at x = 260)
    ctx.beginPath()
    ctx.moveTo(260, 300)
    ctx.lineTo(260, 340)
    ctx.stroke()
    
    // East to West stopping line (top-right entry, stop at x = 340)
    ctx.beginPath()
    ctx.moveTo(340, 260)
    ctx.lineTo(340, 300)
    ctx.stroke()

    // North to South stopping line (top-right entry, stop at y = 260)
    ctx.beginPath()
    ctx.moveTo(300, 260)
    ctx.lineTo(340, 260)
    ctx.stroke()

    // South to North stopping line (bottom-left entry, stop at y = 340)
    ctx.beginPath()
    ctx.moveTo(260, 340)
    ctx.lineTo(300, 340)
    ctx.stroke()

    // 5. Draw Detailed Traffic Light Housings (Red, Yellow, Green stacked) with LED Timer
    const drawRealTrafficLight = (cx, cy, state, remainingSeconds) => {
      ctx.save()
      ctx.translate(cx, cy)

      // 1. Draw light housing (Dark grey box with yellow retroreflective border)
      ctx.fillStyle = '#1e293b' // Dark grey housing
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(-8, -18, 16, 36, 4)
      ctx.fill()
      ctx.stroke()
      
      // Yellow backing border
      ctx.strokeStyle = '#eab308'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(-7.5, -17.5, 15, 35, 3)
      ctx.stroke()

      // 2. Draw three light lenses (Red, Yellow, Green)
      // Red lens (top)
      const rActive = state === 'red'
      ctx.fillStyle = rActive ? '#ef4444' : '#450a0a'
      if (rActive) {
        ctx.shadowBlur = 12
        ctx.shadowColor = '#ef4444'
      }
      ctx.beginPath()
      ctx.arc(0, -9, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0 // Reset shadow

      // Yellow lens (middle)
      const yActive = state === 'yellow'
      ctx.fillStyle = yActive ? '#f59e0b' : '#422006'
      if (yActive) {
        ctx.shadowBlur = 12
        ctx.shadowColor = '#f59e0b'
      }
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0

      // Green lens (bottom)
      const gActive = state === 'green'
      ctx.fillStyle = gActive ? '#10b981' : '#052e16'
      if (gActive) {
        ctx.shadowBlur = 12
        ctx.shadowColor = '#10b981'
      }
      ctx.beginPath()
      ctx.arc(0, 9, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0

      // 3. Draw Digital LED Timer box below housing
      ctx.fillStyle = '#090d16'
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(-12, 21, 24, 13, 2.5)
      ctx.fill()
      ctx.stroke()

      // Glow color matches active light color
      const glowColor = rActive ? '#ef4444' : (yActive ? '#f59e0b' : '#10b981')
      ctx.fillStyle = glowColor
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const secondsVal = remainingSeconds !== undefined ? remainingSeconds : 0
      const text = secondsVal < 10 ? '0' + secondsVal : secondsVal.toString()
      ctx.fillText(text, 0, 28)
      
      ctx.restore()
    }

    // Get independent countdown values and signal states
    const timers = simulationState.timers || { north: 12, east: 15, south: 30, west: 45 }
    const signals = simulationState.signals || { north: 'green', east: 'red', south: 'red', west: 'red' }

    // West incoming light (controls West-to-East, bottom-left corner)
    drawRealTrafficLight(250, 350, signals.west || 'red', timers.west || 0)
    // East incoming light (controls East-to-West, top-right corner)
    drawRealTrafficLight(350, 250, signals.east || 'red', timers.east || 0)
    // North incoming light (controls North-to-South, top-left corner)
    drawRealTrafficLight(250, 250, signals.north || 'red', timers.north || 0)
    // South incoming light (controls South-to-North, bottom-right corner)
    drawRealTrafficLight(350, 350, signals.south || 'red', timers.south || 0)

    // 5. Calculate and Draw Lane Vehicle Count Badges
    let northCount = 0
    let southCount = 0
    let westCount = 0
    let eastCount = 0

    simulationState.vehicles.forEach((veh) => {
      const scale = 5.0
      let canvasX = 300 + (veh.x - 300) * scale
      let canvasY = 300 - (veh.y - 300) * scale

      if (canvasY < 260 && canvasX >= 260 && canvasX <= 300) {
        northCount++
      } else if (canvasY > 340 && canvasX >= 300 && canvasX <= 340) {
        southCount++
      } else if (canvasX < 260 && canvasY >= 300 && canvasY <= 340) {
        westCount++
      } else if (canvasX > 340 && canvasY >= 260 && canvasY <= 300) {
        eastCount++
      }
    })

    const drawLaneCountBadge = (x, y, count) => {
      ctx.save()
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x - 20, y - 9, 40, 18, 5)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#06b6d4'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${count} Veh`, x, y)
      ctx.restore()
    }

    drawLaneCountBadge(225, 180, northCount)
    drawLaneCountBadge(375, 420, southCount)
    drawLaneCountBadge(180, 375, westCount)
    drawLaneCountBadge(420, 225, eastCount)

    // 6. Draw Simulated Vehicles
    simulationState.vehicles.forEach((veh) => {
      ctx.save()
      const scale = 5.0
      let canvasX = 300 + (veh.x - 300) * scale
      let canvasY = 300 - (veh.y - 300) * scale



      ctx.translate(canvasX, canvasY)
      ctx.rotate((veh.angle * Math.PI) / 180)

      // Draw detailed top-down vehicle sprite
      const w = 15 // vehicle width
      const h = veh.size // vehicle length (determines type)
      
      // 1. Tires (4 black rectangles offset from body)
      ctx.fillStyle = '#0a0a0c'
      const tireW = 3.5
      const tireH = 7
      // Front-left
      ctx.fillRect(-w/2 - tireW + 1, -h/2 + 3, tireW, tireH)
      // Front-right
      ctx.fillRect(w/2 - 1, -h/2 + 3, tireW, tireH)
      // Rear-left
      ctx.fillRect(-w/2 - tireW + 1, h/2 - 10, tireW, tireH)
      // Rear-right
      ctx.fillRect(w/2 - 1, h/2 - 10, tireW, tireH)

      // 2. Headlight beams (Glowing yellow cones pointing forward)
      ctx.save()
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(253, 224, 71, 0.6)'
      ctx.fillStyle = 'rgba(253, 224, 71, 0.25)'
      ctx.beginPath()
      // Left headlight beam
      ctx.moveTo(-w/4, -h/2)
      ctx.lineTo(-w/2 - 8, -h/2 - 18)
      ctx.lineTo(0, -h/2 - 18)
      ctx.fill()
      ctx.beginPath()
      // Right headlight beam
      ctx.moveTo(w/4, -h/2)
      ctx.lineTo(w/2 + 8, -h/2 - 18)
      ctx.lineTo(0, -h/2 - 18)
      ctx.fill()
      ctx.restore()

      // 3. Side Mirrors (Body color matching wings)
      ctx.fillStyle = veh.color
      ctx.fillRect(-w/2 - 2, -h/2 + 6, 2.5, 2)
      ctx.fillRect(w/2 - 0.5, -h/2 + 6, 2.5, 2)

      // 4. Main Body Paint
      ctx.fillStyle = veh.color
      ctx.beginPath()
      ctx.roundRect(-w / 2, -h / 2, w, h, 3.5)
      ctx.fill()
      
      // 5. Windows and Glass cabin
      ctx.fillStyle = '#1e293b' // Dark tint glass
      // Front windshield
      ctx.beginPath()
      ctx.roundRect(-w/2 + 1.5, -h/2 + 4, w - 3, 5, 1.5)
      ctx.fill()
      
      // Windshield light reflection sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.fillRect(-w/2 + 3, -h/2 + 5, 3, 2)

      // Side/Rear cabin windows
      ctx.fillStyle = '#1e293b'
      const cabinLength = h * 0.45
      ctx.beginPath()
      ctx.roundRect(-w/2 + 1.5, -h/2 + 11, w - 3, cabinLength, 1.5)
      ctx.fill()
      
      // Rear windshield
      ctx.beginPath()
      ctx.roundRect(-w/2 + 2, -h/2 + 12 + cabinLength, w - 4, 3, 1)
      ctx.fill()

      // 6. Tail lights (Red glowing stripes at rear corners)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(-w/2 + 1, h/2 - 2, 3, 1.5)
      ctx.fillRect(w/2 - 4, h/2 - 2, 3, 1.5)

      ctx.restore()
    })

    // 7. Connection indicator dot
    ctx.fillStyle = isConnected ? '#10b981' : '#ef4444'
    ctx.beginPath()
    ctx.arc(20, 20, 5, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px monospace'
    ctx.fillText(isConnected ? 'LIVE SUMO TWIN' : 'DISCONNECTED', 30, 23)

  }, [simulationState, isConnected])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '1/1'
        }}
      />
    </div>
  )
}

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

    // 6. Draw Simulated Vehicles (Multi-Vehicle Rendering: Car, Motorcycle, Auto-Rickshaw, SUV, Bus, Truck, Ambulance)
    simulationState.vehicles.forEach((veh) => {
      ctx.save()
      const scale = 5.0
      let canvasX = 300 + (veh.x - 300) * scale
      let canvasY = 300 - (veh.y - 300) * scale

      ctx.translate(canvasX, canvasY)
      ctx.rotate((veh.angle * Math.PI) / 180)

      const vType = veh.type || 'car'
      const vColor = veh.color || '#3b82f6'

      if (vType === 'motorcycle') {
        // --- 1. MOTORCYCLE / BIKE ---
        const w = 7
        const h = 16

        // Wheels (Front & Rear on center axis)
        ctx.fillStyle = '#0a0a0c'
        ctx.fillRect(-1.5, -h/2, 3, 5)
        ctx.fillRect(-1.5, h/2 - 5, 3, 5)

        // Handlebars
        ctx.fillStyle = '#475569'
        ctx.fillRect(-w/2 - 2, -h/2 + 4, w + 4, 1.5)

        // Bike Body / Tank
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-2.5, -h/2 + 2, 5, 9, 2)
        ctx.fill()

        // Rider Body (Leather jacket)
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.arc(0, 0, 3.5, 0, 2 * Math.PI)
        ctx.fill()

        // Helmet with Visor
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(0, -2, 2.8, 0, 2 * Math.PI)
        ctx.fill()

        // Visor reflection
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(-1.5, -4.5, 3, 1)

        // Headlight beam
        ctx.save()
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(253, 224, 71, 0.7)'
        ctx.fillStyle = 'rgba(253, 224, 71, 0.3)'
        ctx.beginPath()
        ctx.moveTo(0, -h/2)
        ctx.lineTo(-4, -h/2 - 14)
        ctx.lineTo(4, -h/2 - 14)
        ctx.fill()
        ctx.restore()

        // Tail light
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-1.5, h/2 - 1, 3, 1.5)

      } else if (vType === 'rickshaw') {
        // --- 2. AUTO-RICKSHAW ---
        const w = 13
        const h = 19

        // 3 Wheels (1 front, 2 rear)
        ctx.fillStyle = '#0a0a0c'
        ctx.fillRect(-1.5, -h/2, 3, 4)
        ctx.fillRect(-w/2 - 2, h/2 - 5, 2.5, 5)
        ctx.fillRect(w/2 - 0.5, h/2 - 5, 2.5, 5)

        // Front cowl (Dark hood)
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.moveTo(0, -h/2 + 1)
        ctx.lineTo(-w/2 + 1, -h/2 + 7)
        ctx.lineTo(w/2 - 1, -h/2 + 7)
        ctx.fill()

        // Windshield
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'
        ctx.fillRect(-w/2 + 2, -h/2 + 5, w - 4, 2)

        // Yellow/Green Canopy Roof
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2 + 6, w, h - 8, 3)
        ctx.fill()

        // Roof Accent Stripe
        ctx.fillStyle = '#facc15'
        ctx.fillRect(-w/4, -h/2 + 7, w/2, h - 10)

        // Headlight
        ctx.fillStyle = '#fde047'
        ctx.fillRect(-1.5, -h/2, 3, 1.5)

        // Tail lights
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2 + 1, h/2 - 3, 2, 1.5)
        ctx.fillRect(w/2 - 3, h/2 - 3, 2, 1.5)

      } else if (vType === 'bus') {
        // --- 3. TRANSIT BUS ---
        const w = 17
        const h = 42

        // 6 Heavy-duty Wheels
        ctx.fillStyle = '#0a0a0c'
        const tw = 3.5
        const th = 7
        ctx.fillRect(-w/2 - tw + 1, -h/2 + 4, tw, th)
        ctx.fillRect(w/2 - 1, -h/2 + 4, tw, th)
        ctx.fillRect(-w/2 - tw + 1, h/2 - 18, tw, th)
        ctx.fillRect(w/2 - 1, h/2 - 18, tw, th)
        ctx.fillRect(-w/2 - tw + 1, h/2 - 9, tw, th)
        ctx.fillRect(w/2 - 1, h/2 - 9, tw, th)

        // Main Bus Body
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2, w, h, 4)
        ctx.fill()

        // Front Destination Display Screen (Amber LED)
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(-w/2 + 2.5, -h/2 + 1.5, w - 5, 2)

        // Panoramic Front Windshield
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-w/2 + 2, -h/2 + 4, w - 4, 4.5)

        // Passenger Side Windows (Rows of glass panes)
        ctx.fillStyle = '#1e293b'
        for (let i = 0; i < 4; i++) {
          const winY = -h/2 + 11 + i * 6.5
          ctx.fillRect(-w/2 + 1.5, winY, 3, 4.5)
          ctx.fillRect(w/2 - 4.5, winY, 3, 4.5)
        }

        // Roof Air Conditioning Unit
        ctx.fillStyle = '#f1f5f9'
        ctx.beginPath()
        ctx.roundRect(-w/3, -4, (w*2)/3, 14, 2)
        ctx.fill()

        // Headlights
        ctx.fillStyle = '#fde047'
        ctx.fillRect(-w/2 + 2, -h/2, 3, 1.5)
        ctx.fillRect(w/2 - 5, -h/2, 3, 1.5)

        // Tail lights
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2 + 1, h/2 - 2, 3.5, 2)
        ctx.fillRect(w/2 - 4.5, h/2 - 2, 3.5, 2)

      } else if (vType === 'truck') {
        // --- 4. CARGO TRUCK ---
        const w = 18
        const h = 46

        // Wheels
        ctx.fillStyle = '#0a0a0c'
        const tw = 3.5
        const th = 7.5
        ctx.fillRect(-w/2 - tw + 1, -h/2 + 4, tw, th)
        ctx.fillRect(w/2 - 1, -h/2 + 4, tw, th)
        ctx.fillRect(-w/2 - tw + 1, h/2 - 16, tw, th)
        ctx.fillRect(w/2 - 1, h/2 - 16, tw, th)
        ctx.fillRect(-w/2 - tw + 1, h/2 - 8, tw, th)
        ctx.fillRect(w/2 - 1, h/2 - 8, tw, th)

        // Tractor Cab (Front)
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2, w, 13, 3)
        ctx.fill()

        // Cab Windshield
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-w/2 + 2, -h/2 + 3, w - 4, 3.5)

        // Chrome bumper
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(-w/2 + 3, -h/2, w - 6, 1.5)

        // Cargo Flatbed / Container (Rear)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(-w/2 + 0.5, -h/2 + 15, w - 1, 30, 2)
        ctx.fill()

        // Container Ribs
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 1
        for (let y = -h/2 + 18; y < h/2 - 3; y += 4) {
          ctx.beginPath()
          ctx.moveTo(-w/2 + 2, y)
          ctx.lineTo(w/2 - 2, y)
          ctx.stroke()
        }

        // Headlights
        ctx.fillStyle = '#fde047'
        ctx.fillRect(-w/2 + 1, -h/2, 2.5, 1.5)
        ctx.fillRect(w/2 - 3.5, -h/2, 2.5, 1.5)

        // Tail lights
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2 + 1, h/2 - 2, 4, 2)
        ctx.fillRect(w/2 - 5, h/2 - 2, 4, 2)

      } else if (vType === 'ambulance') {
        // --- 5. EMERGENCY AMBULANCE ---
        const w = 15
        const h = 28

        // Tires
        ctx.fillStyle = '#0a0a0c'
        ctx.fillRect(-w/2 - 2.5, -h/2 + 3, 3, 6)
        ctx.fillRect(w/2 - 0.5, -h/2 + 3, 3, 6)
        ctx.fillRect(-w/2 - 2.5, h/2 - 9, 3, 6)
        ctx.fillRect(w/2 - 0.5, h/2 - 9, 3, 6)

        // White Van Body
        ctx.fillStyle = '#f8fafc'
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2, w, h, 3.5)
        ctx.fill()

        // Red Side Stripes
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2, -h/2 + 8, 1.5, h - 12)
        ctx.fillRect(w/2 - 1.5, -h/2 + 8, 1.5, h - 12)

        // Windshield
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-w/2 + 1.5, -h/2 + 3.5, w - 3, 4)

        // Red Cross on Roof
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-4, 0, 8, 2.5)
        ctx.fillRect(-1.25, -2.75, 2.5, 8)

        // Alternating Flashing Emergency Strobe (Red / Blue)
        const strobe = Math.floor(Date.now() / 120) % 2 === 0
        ctx.save()
        ctx.shadowBlur = 14
        ctx.shadowColor = strobe ? '#ef4444' : '#3b82f6'
        ctx.fillStyle = strobe ? '#ef4444' : '#3b82f6'
        ctx.beginPath()
        ctx.arc(strobe ? -3 : 3, -h/2 + 9, 2.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()

        // Headlights
        ctx.fillStyle = '#fde047'
        ctx.fillRect(-w/2 + 1.5, -h/2, 2.5, 1.5)
        ctx.fillRect(w/2 - 4, -h/2, 2.5, 1.5)

      } else if (vType === 'suv') {
        // --- 6. SUV ---
        const w = 15.5
        const h = 26

        // 4 Wide Tires
        ctx.fillStyle = '#0a0a0c'
        ctx.fillRect(-w/2 - 2.5, -h/2 + 3, 3, 6.5)
        ctx.fillRect(w/2 - 0.5, -h/2 + 3, 3, 6.5)
        ctx.fillRect(-w/2 - 2.5, h/2 - 9.5, 3, 6.5)
        ctx.fillRect(w/2 - 0.5, h/2 - 9.5, 3, 6.5)

        // Main Body
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2, w, h, 4)
        ctx.fill()

        // Front Windshield
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-w/2 + 1.5, -h/2 + 4, w - 3, 4.5)

        // Panoramic Sunroof
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(-w/2 + 2.5, -h/2 + 10, w - 5, 8)

        // Twin Silver Roof Rack Rails
        ctx.fillStyle = '#cbd5e1'
        ctx.fillRect(-w/2 + 2, -h/2 + 9, 1.5, 11)
        ctx.fillRect(w/2 - 3.5, -h/2 + 9, 1.5, 11)

        // Rear Glass
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-w/2 + 2, h/2 - 4.5, w - 4, 2)

        // Headlights
        ctx.fillStyle = '#fde047'
        ctx.fillRect(-w/2 + 1.5, -h/2, 2.5, 1.5)
        ctx.fillRect(w/2 - 4, -h/2, 2.5, 1.5)

        // Tail lights
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2 + 1, h/2 - 2, 3, 1.5)
        ctx.fillRect(w/2 - 4, h/2 - 2, 3, 1.5)

      } else {
        // --- 7. STANDARD CAR / SEDAN ---
        const w = 14
        const h = veh.size || 22

        // Tires
        ctx.fillStyle = '#0a0a0c'
        const tireW = 3
        const tireH = 6.5
        ctx.fillRect(-w/2 - tireW + 1, -h/2 + 3, tireW, tireH)
        ctx.fillRect(w/2 - 1, -h/2 + 3, tireW, tireH)
        ctx.fillRect(-w/2 - tireW + 1, h/2 - 9.5, tireW, tireH)
        ctx.fillRect(w/2 - 1, h/2 - 9.5, tireW, tireH)

        // Headlight beams
        ctx.save()
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(253, 224, 71, 0.6)'
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)'
        ctx.beginPath()
        ctx.moveTo(-w/4, -h/2)
        ctx.lineTo(-w/2 - 8, -h/2 - 18)
        ctx.lineTo(0, -h/2 - 18)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(w/4, -h/2)
        ctx.lineTo(w/2 + 8, -h/2 - 18)
        ctx.lineTo(0, -h/2 - 18)
        ctx.fill()
        ctx.restore()

        // Side Mirrors
        ctx.fillStyle = vColor
        ctx.fillRect(-w/2 - 2, -h/2 + 5, 2.5, 2)
        ctx.fillRect(w/2 - 0.5, -h/2 + 5, 2.5, 2)

        // Main Body Paint
        ctx.fillStyle = vColor
        ctx.beginPath()
        ctx.roundRect(-w/2, -h/2, w, h, 3.5)
        ctx.fill()

        // Front Windshield
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.roundRect(-w/2 + 1.5, -h/2 + 3.5, w - 3, 4.5, 1.5)
        ctx.fill()

        // Windshield light sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(-w/2 + 3, -h/2 + 4.5, 3, 1.5)

        // Cabin Roof & Rear Glass
        const cabinLength = h * 0.45
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.roundRect(-w/2 + 1.5, -h/2 + 9.5, w - 3, cabinLength, 1.5)
        ctx.fill()

        ctx.beginPath()
        ctx.roundRect(-w/2 + 2, -h/2 + 10.5 + cabinLength, w - 4, 2.5, 1)
        ctx.fill()

        // Tail lights
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(-w/2 + 1, h/2 - 2, 2.5, 1.5)
        ctx.fillRect(w/2 - 3.5, h/2 - 2, 2.5, 1.5)
      }

      ctx.restore()
    })

    // 7. Status & Active Fleet Mix Legend
    ctx.fillStyle = isConnected ? '#10b981' : '#ef4444'
    ctx.beginPath()
    ctx.arc(20, 20, 5, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = 'bold 10px monospace'
    ctx.fillText(isConnected ? 'LIVE SUMO TWIN (SPEED: 2X)' : 'DISCONNECTED', 32, 23)

    // Vehicle Types Legend banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(14, 568, 572, 20, 5)
    ctx.fill()
    ctx.stroke()

    ctx.font = '9.5px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.fillText('Fleet: 🚗 Cars • 🏍️ Bikes • 🛺 Auto-Rickshaws • 🚙 SUVs • 🚌 Buses • 🚛 Cargo Trucks • 🚑 Ambulances', 22, 582)

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

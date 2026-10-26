import { useEffect, useRef, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import './Page.css';
import './LiveCamera.css';

// Simulated objects that drift around the frame
const SIM_OBJECTS = [
  { id: 'desk',    label: 'Desk',        color: '#22d3ee', x: 18, y: 22, w: 22, h: 14 },
  { id: 'chair',   label: 'Chair',       color: '#a78bfa', x: 55, y: 55, w: 12, h: 18 },
  { id: 'sofa',    label: 'Sofa',        color: '#f59e0b', x: 62, y: 30, w: 24, h: 16 },
  { id: 'tv',      label: 'TV',          color: '#3b82f6', x: 38, y: 10, w: 18, h: 14 },
  { id: 'bookshelf',label: 'Bookshelf',  color: '#10b981', x:  8, y: 38, w: 10, h: 24 },
  { id: 'plant',   label: 'Plant',       color: '#4ade80', x: 80, y: 60, w:  8, h: 20 },
  { id: 'lamp',    label: 'Lamp',        color: '#fbbf24', x:  6, y: 55, w:  6, h: 22 },
  { id: 'bed',     label: 'Bed',         color: '#64748b', x: 62, y: 18, w: 28, h: 22 },
];

function randBetween(a: number, b: number) { return a + Math.random() * (b - a); }

interface Box { id: string; label: string; color: string; x: number; y: number; w: number; h: number; conf: number }

export function LiveCamera() {
  const { detections } = useWS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const boxStateRef = useRef<Box[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [fps, setFps] = useState(28);
  const [frameCount, setFrameCount] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [streamOk, setStreamOk] = useState(false);

  const STREAM_URL = `${window.location.origin.replace('5173', '8000')}/api/vision/stream`;

  // Try to connect to a real MJPEG stream
  useEffect(() => {
    const img = new Image();
    img.onload = () => setStreamOk(true);
    img.onerror = () => setStreamOk(false);
    img.src = STREAM_URL;
    const timer = setTimeout(() => setStreamOk(false), 2000);
    return () => clearTimeout(timer);
  }, [STREAM_URL]);

  // Init simulated boxes
  useEffect(() => {
    const initial: Box[] = SIM_OBJECTS.map(o => ({
      ...o,
      x: o.x + randBetween(-2, 2),
      y: o.y + randBetween(-2, 2),
      conf: randBetween(0.82, 0.99),
    }));
    boxStateRef.current = initial;
    setBoxes(initial);
  }, []);

  // Animated canvas background (scan effect)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let t = 0;
    let last = performance.now();
    let frameAcc = 0;
    let fpsTimer = 0;

    function draw(now: number) {
      animRef.current = requestAnimationFrame(draw);
      if (document.hidden) return;           // pause when tab not visible
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;
      frameAcc++;
      fpsTimer += dt;
      if (fpsTimer > 1) {                    // state updates max once/sec
        setFps(Math.round(frameAcc / fpsTimer));
        setFrameCount(f => f + frameAcc);
        setScanLine(Math.floor((t * 60) % 100));
        frameAcc = 0; fpsTimer = 0;
      }

      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      const W = canvas!.width, H = canvas!.height;

      // Background gradient (dark room)
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.75);
      bg.addColorStop(0, '#0f1e30');
      bg.addColorStop(1, '#050a10');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(34,211,238,0.05)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Scan line
      const scanY = ((t * 80) % (H + 40)) - 20;
      const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
      scanGrad.addColorStop(0, 'rgba(34,211,238,0)');
      scanGrad.addColorStop(0.5, 'rgba(34,211,238,0.18)');
      scanGrad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 12, W, 24);

      // Noise overlay
      for (let i = 0; i < 80; i++) {
        const nx = Math.random() * W, ny = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
        ctx.fillRect(nx, ny, 1, 1);
      }

      // Room silhouette elements
      // Floor line
      ctx.strokeStyle = 'rgba(148,163,184,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, H * 0.72); ctx.lineTo(W, H * 0.72); ctx.stroke();
      // Wall corner perspective
      ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.15); ctx.lineTo(0, H * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.15); ctx.lineTo(W, H * 0.72); ctx.stroke();

      // Drift boxes slightly
      const liveBoxes = boxStateRef.current.map(b => {
        const drift = 0.12;
        return {
          ...b,
          x: Math.max(2, Math.min(88, b.x + (Math.random() - 0.5) * drift)),
          y: Math.max(2, Math.min(82, b.y + (Math.random() - 0.5) * drift)),
          conf: Math.max(0.72, Math.min(0.99, b.conf + (Math.random() - 0.5) * 0.004)),
        };
      });
      boxStateRef.current = liveBoxes;
      if (Math.round(t * 6) % 6 === 0) setBoxes([...liveBoxes]);

      // Draw detection boxes on canvas
      liveBoxes.forEach(b => {
        const bx = (b.x / 100) * W, by = (b.y / 100) * H;
        const bw = (b.w / 100) * W, bh = (b.h / 100) * H;

        // Glow
        ctx.shadowColor = b.color; ctx.shadowBlur = 8;
        ctx.strokeStyle = b.color; ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur = 0;

        // Corner brackets
        const cs = Math.min(bw, bh) * 0.25;
        ctx.strokeStyle = b.color; ctx.lineWidth = 2.5;
        [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]].forEach(([cx, cy], i) => {
          const sx = i % 2 === 0 ? 1 : -1, sy = i < 2 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(cx, cy + sy * cs); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * cs, cy);
          ctx.stroke();
        });

        // Label background
        const labelH = 16, labelW = ctx.measureText(b.label).width + 52;
        ctx.fillStyle = b.color + 'cc';
        ctx.fillRect(bx, by - labelH, labelW, labelH);

        // Label text
        ctx.fillStyle = '#000'; ctx.font = 'bold 10px monospace';
        ctx.fillText(`${b.label} ${(b.conf * 100).toFixed(0)}%`, bx + 4, by - 4);

        // Track ID badge
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx + bw - 22, by, 22, 14);
        ctx.fillStyle = b.color; ctx.font = '9px monospace';
        ctx.fillText(`#${(b.id.charCodeAt(0) % 20) + 1}`, bx + bw - 20, by + 10);
      });

      // HUD overlay
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = 'rgba(239,68,68,0.95)';
      ctx.fillText('⬤ REC', 12, 20);
      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.fillText(`${fps} FPS`, W - 54, 20);
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.fillText(`FRAME ${frameAcc + Math.floor(t * fps)}`, W / 2 - 30, 20);
      ctx.fillText(`${liveBoxes.length} OBJECTS`, 12, H - 12);
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      ctx.fillText('SIMULATED FEED · YOLOv11 ACTIVE', W / 2 - 90, H - 12);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [fps]);

  // Use real WS detections if available
  const wsBoxes = (detections?.detections as Array<{ class_name: string; confidence: number; track_id: number; bbox: { x: number; y: number; w: number; h: number } }>) || [];

  return (
    <div className="page">
      <h1 className="page-title">Live Camera</h1>
      <div className="page-grid">
        <Card
          title="Camera Feed"
          subtitle={streamOk ? '🟢 Live stream connected' : `🟡 Simulation · ${fps} FPS · ${wsBoxes.length || boxes.length} objects`}
          className="span-full"
        >
          <div className="camera-view-wrap">
            {streamOk ? (
              <img src={STREAM_URL} className="live-stream" alt="Live camera feed" onError={() => setStreamOk(false)} />
            ) : (
              <div className="camera-sim-wrap">
                <canvas ref={canvasRef} className="camera-sim-canvas" width={800} height={480} />
                <div className="scan-badge">📡 VISION SIM</div>
              </div>
            )}
          </div>
        </Card>

        {/* Detection cards */}
        <Card title="Detected Objects" subtitle={`${wsBoxes.length || boxes.length} tracked`} className="span-full">
          {wsBoxes.length > 0 ? (
            <div className="det-cards">
              {wsBoxes.map((d, i) => (
                <div key={i} className="det-chip">
                  <span className="det-chip-name">{d.class_name}</span>
                  <span className="det-chip-conf">{(d.confidence * 100).toFixed(0)}%</span>
                  <span className="det-chip-id">#{d.track_id ?? i}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="det-cards">
              {boxes.map((b, i) => (
                <div key={i} className="det-chip" style={{ borderColor: b.color + '55' }}>
                  <span className="det-chip-name" style={{ color: b.color }}>{b.label}</span>
                  <span className="det-chip-conf">{(b.conf * 100).toFixed(0)}%</span>
                  <span className="det-chip-id">#{(b.id.charCodeAt(0) % 20) + 1}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Scene Status">
          <div className="data-row"><span>Mode</span><span>{streamOk ? 'Live' : 'Simulation'}</span></div>
          <div className="data-row"><span>FPS</span><span className="mono">{fps}</span></div>
          <div className="data-row"><span>Objects</span><span className="mono">{wsBoxes.length || boxes.length}</span></div>
          <div className="data-row"><span>Scan</span><span className="mono">{scanLine}%</span></div>
          <div className="data-row"><span>Frame</span><span className="mono">{frameCount}</span></div>
        </Card>

        <Card title="Confidence Meters">
          {(wsBoxes.length > 0 ? wsBoxes.map(d => ({ label: d.class_name, conf: d.confidence })) : boxes.map(b => ({ label: b.label, conf: b.conf }))).slice(0, 6).map((item, i) => (
            <div key={i} className="conf-row">
              <span className="conf-label">{item.label}</span>
              <div className="conf-bar-wrap">
                <div className="conf-bar" style={{ width: `${(item.conf * 100).toFixed(0)}%` }} />
              </div>
              <span className="conf-pct">{(item.conf * 100).toFixed(0)}%</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

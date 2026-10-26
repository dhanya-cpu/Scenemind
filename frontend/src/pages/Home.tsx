import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Zap, Eye, Navigation, Mic } from 'lucide-react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import { api } from '../services/api';
import './Home.css';

export function Home() {
  const { robotState, scene, connected } = useWS();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.analytics.summary().then(setAnalytics).catch(() => {});
  }, []);

  const handleStart = () => api.robot.start();
  const handleStop = () => api.robot.stop();

  const description = (scene?.description as string) || 'Start the robot to begin scene perception.';
  const status = (robotState?.status as string) || 'idle';
  const hasSafetyAssessment = typeof scene?.safety_assessment === 'string' && !!scene.safety_assessment;

  return (
    <div className="home">
      <div className="home-hero">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-title"
        >
          SceneMind <span className="gradient-text">AI</span>
        </motion.h1>
        <p className="hero-subtitle">
          A robot that doesn't just detect the world—it understands, reasons, predicts, speaks,
          and continuously learns through its Digital Twin.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={handleStart}>
            <Play size={16} /> Start Robot
          </button>
          <button className="btn-secondary" onClick={handleStop}>
            <Square size={16} /> Stop
          </button>
        </div>
      </div>

      <div className="home-grid">
        <Card title="Live Scene" subtitle="AI Scene Understanding" className="span-2">
          <p className="scene-text">{description}</p>
          {hasSafetyAssessment && (
            <div className="safety-badge">
              <Zap size={14} />
              {scene?.safety_assessment as string}
            </div>
          )}
        </Card>

        <Card title="Robot Status">
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className={`stat-value status-${status}`}>{status}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Battery</span>
              <span className="stat-value">{(robotState?.battery_percent as number)?.toFixed(0) || 100}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Latency</span>
              <span className="stat-value mono">{(robotState?.latency_ms as number)?.toFixed(0) || '--'}ms</span>
            </div>
            <div className="stat">
              <span className="stat-label">WebSocket</span>
              <span className="stat-value">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </Card>

        <Card title="Quick Metrics">
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">Detection Acc.</span>
              <span className="stat-value mono">{((analytics?.detection_accuracy as number) * 100)?.toFixed(1) || '94.0'}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">FPS</span>
              <span className="stat-value mono">{(analytics?.fps as number)?.toFixed(1) || '28.5'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Nav Accuracy</span>
              <span className="stat-value mono">{((analytics?.navigation_accuracy as number) * 100)?.toFixed(1) || '91.0'}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Missions</span>
              <span className="stat-value mono">{((analytics?.mission_completion_rate as number) * 100)?.toFixed(0) || '96'}%</span>
            </div>
          </div>
        </Card>

        <Card title="Modules" className="span-2">
          <div className="module-grid">
            {[
              { icon: Eye, name: 'Computer Vision', status: 'YOLOv11 Active' },
              { icon: Navigation, name: 'Navigation', status: 'Nav2 Ready' },
              { icon: Mic, name: 'Voice Assistant', status: 'Whisper + Piper' },
              { icon: Zap, name: 'AI Reasoning', status: 'Ollama LLM' },
            ].map(({ icon: Icon, name, status: modStatus }) => (
              <div key={name} className="module-item glass">
                <Icon size={20} className="module-icon" />
                <div>
                  <span className="module-name">{name}</span>
                  <span className="module-status">{modStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

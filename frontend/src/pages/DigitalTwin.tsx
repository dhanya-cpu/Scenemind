import { useEffect, useRef, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import { api } from '../services/api';
import './Page.css';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function DigitalTwin() {
  const { robotState, scene, detections, navigation } = useWS();
  const [twin, setTwin] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [robotPose, setRobotPose] = useState({ x: 50, y: 28, angle: 0 });
  const robotIndexRef = useRef(0);

  const patrolPath = [
    { x: 50, y: 28, angle: 0 },
    { x: 62, y: 34, angle: 22 },
    { x: 72, y: 46, angle: 45 },
    { x: 62, y: 58, angle: 120 },
    { x: 48, y: 62, angle: 180 },
    { x: 32, y: 56, angle: 220 },
    { x: 25, y: 42, angle: 285 },
    { x: 34, y: 30, angle: 330 },
  ];

  useEffect(() => {
    const load = () => {
      api.digitalTwin.state().then(setTwin).catch(() => {});
      api.digitalTwin.status().then(setStatus).catch(() => {});
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pos = (robotState as Record<string, unknown> | null)?.position as Record<string, unknown> | undefined;
    const xValue = Number(pos?.x ?? 0);
    const yValue = Number(pos?.y ?? 0);
    const yawValue = Number((robotState as Record<string, unknown> | null)?.orientation_yaw ?? 0);

    if (robotState && pos) {
      const angleDegrees = Math.abs(yawValue) > 6.283 ? yawValue : yawValue * (180 / Math.PI);
      setRobotPose({
        x: clamp(50 + xValue * 16, 18, 78),
        y: clamp(28 + yValue * 16, 16, 66),
        angle: angleDegrees,
      });
      return;
    }

    const moveTimer = setInterval(() => {
      robotIndexRef.current = (robotIndexRef.current + 1) % patrolPath.length;
      setRobotPose(patrolPath[robotIndexRef.current]);
    }, 1500);

    return () => clearInterval(moveTimer);
  }, [robotState]);

  const robotStatus = (status?.status as string) || (twin?.robot_status as string) || (robotState?.status as string) || 'idle';
  const modeClass = robotStatus === 'scanning' ? 'is-scanning' : robotStatus === 'active' ? 'is-active' : 'is-idle';

  const sceneSummary = (scene as Record<string, unknown> | null)?.description as string
    || (twin?.voice_output as string)
    || (twin?.ai_reasoning as string)
    || 'Awaiting scene data...';

  const detectedObjects = Array.isArray((scene as Record<string, unknown> | null)?.detections)
    ? (scene as Record<string, unknown>).detections as Array<Record<string, unknown>>
    : Array.isArray((detections as Record<string, unknown> | null)?.detections)
      ? ((detections as Record<string, unknown>).detections as Array<Record<string, unknown>>)
      : Array.isArray(twin?.detected_objects)
        ? (twin?.detected_objects as Array<Record<string, unknown>>)
        : [];

  const routePoints = Array.isArray((navigation as Record<string, unknown> | null)?.path)
    ? ((navigation as Record<string, unknown>).path as Array<Record<string, unknown>>)
    : Array.isArray(twin?.navigation_path)
      ? (twin?.navigation_path as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="page">
      <h1 className="page-title">Digital Twin</h1>
      <div className="page-grid">
        <Card title="Omniverse Connection">
          <div className="data-row"><span>Enabled</span><span>{status?.enabled ? 'Yes' : 'Simulation'}</span></div>
          <div className="data-row"><span>Connected</span><span>{status?.connected ? 'Connected' : 'MQTT Bridge'}</span></div>
          <div className="data-row"><span>Host</span><span className="mono">{status?.host as string}</span></div>
        </Card>
        <Card title="Twin State">
          <div className="data-row"><span>Robot Status</span><span>{robotStatus}</span></div>
          <div className="data-row"><span>Task</span><span>{twin?.current_task as string || (robotState?.current_task as string) || 'Awaiting mission'}</span></div>
          <div className="data-row"><span>Objects</span><span>{detectedObjects.length}</span></div>
        </Card>
        <Card title="3D Home Model" className="span-full">
          <div className="twin-view">
            <div className="home-scene">
              <div className="top-grid" />
              <div className="room-floor" />
              <div className="wall wall-back" />
              <div className="wall wall-left" />
              <div className="wall wall-right" />
              <div className="window window-left" />
              <div className="window window-right" />
              <div className="desk">
                <div className="desk-top" />
                <div className="desk-leg leg-a" />
                <div className="desk-leg leg-b" />
                <div className="desk-leg leg-c" />
                <div className="desk-leg leg-d" />
              </div>
              <div className="chair">
                <div className="chair-back" />
                <div className="chair-seat" />
                <div className="chair-leg leg-a" />
                <div className="chair-leg leg-b" />
                <div className="chair-leg leg-c" />
                <div className="chair-leg leg-d" />
              </div>
              <div className="bookshelf">
                <span />
                <span />
                <span />
              </div>
              {routePoints.map((point, index) => {
                const x = clamp(((Number(point.x ?? 0) + 2.5) / 8) * 100, 10, 90);
                const y = clamp(((Number(point.y ?? 0) + 2.5) / 8) * 100, 12, 82);
                return <span key={`route-${index}`} className="route-dot" style={{ left: `${x}%`, bottom: `${y}%` }} />;
              })}
              {detectedObjects.map((objectInfo, index) => {
                const box = objectInfo.bbox as Record<string, unknown> | undefined;
                const x = clamp(((Number(box?.x ?? 0) + Number(box?.w ?? 60) / 2) / 640) * 100, 8, 92);
                const y = clamp(((Number(box?.y ?? 0) + Number(box?.h ?? 60) / 2) / 480) * 100, 12, 82);
                const label = (objectInfo.class_name as string) || 'object';
                return <span key={`detection-${index}`} className="detection-tag" style={{ left: `${x}%`, top: `${y}%` }}>{label}</span>;
              })}
              <div
                className={`laptop-robot ${modeClass}`}
                style={{
                  left: `${robotPose.x}%`,
                  bottom: `${robotPose.y}%`,
                  ['--robot-angle' as string]: `${robotPose.angle}deg`,
                }}
              >
                <div className="robot-screen">
                  <div className="robot-eye" />
                </div>
                <div className="robot-base" />
              </div>
              <div className="home-status">Laptop Robot: {robotStatus}</div>
              <div className="home-axis x-axis">X</div>
              <div className="home-axis y-axis">Y</div>
            </div>
          </div>
        </Card>
        <Card title="AI Reasoning" className="span-full">
          <p>{sceneSummary}</p>
        </Card>
      </div>
    </div>
  );
}

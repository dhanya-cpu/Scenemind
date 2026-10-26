import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import './Page.css';

const defaultPosition = { x: 0, y: 0, z: 0 };

export function RobotStatus() {
  const { robotState } = useWS();
  const [motionPosition, setMotionPosition] = useState(defaultPosition);
  const [yaw, setYaw] = useState(0);
  const [hasMotionData, setHasMotionData] = useState(false);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      const alpha = event.alpha ?? 0;

      setMotionPosition({
        x: Number((gamma / 18).toFixed(2)),
        y: Number((beta / 18).toFixed(2)),
        z: Number((Math.abs(gamma) / 25).toFixed(2)),
      });
      setYaw(Number(alpha.toFixed(1)));
      setHasMotionData(true);
    };

    if (typeof window === 'undefined') return;

    const requestPermission = (DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    }).requestPermission;

    if (typeof requestPermission === 'function') {
      requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(() => {
          window.addEventListener('deviceorientation', handleOrientation);
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const pos = (robotState?.position as { x: number; y: number; z: number } | undefined) ??
    (hasMotionData ? motionPosition : defaultPosition);
  const activeYaw = (typeof robotState?.orientation_yaw === 'number' ? robotState.orientation_yaw : undefined) ??
    (hasMotionData ? yaw : 0);

  return (
    <div className="page">
      <h1 className="page-title">Robot Status</h1>
      <div className="page-grid">
        <Card title="Position & Orientation">
          <div className="data-row"><span>X</span><span className="mono">{pos.x.toFixed(2)} m</span></div>
          <div className="data-row"><span>Y</span><span className="mono">{pos.y.toFixed(2)} m</span></div>
          <div className="data-row"><span>Z</span><span className="mono">{pos.z.toFixed(2)} m</span></div>
          <div className="data-row"><span>Yaw</span><span className="mono">{activeYaw.toFixed(1)}°</span></div>
        </Card>
        <Card title="System Health">
          <div className="data-row"><span>Status</span><span>{(robotState?.status as string) || 'idle'}</span></div>
          <div className="data-row"><span>Battery</span><span className="mono">{(robotState?.battery_percent as number)?.toFixed(0) ?? 100}%</span></div>
          <div className="data-row"><span>CPU</span><span className="mono">{(robotState?.cpu_percent as number)?.toFixed(0) ?? '--'}%</span></div>
          <div className="data-row"><span>GPU</span><span className="mono">{(robotState?.gpu_percent as number)?.toFixed(0) ?? '--'}%</span></div>
          <div className="data-row"><span>Latency</span><span className="mono">{(robotState?.latency_ms as number)?.toFixed(0) ?? '--'} ms</span></div>
        </Card>
        <Card title="Current Mission" className="span-full">
          <div className="data-row"><span>Task</span><span>{(robotState?.current_task as string) || 'Awaiting mission'}</span></div>
          <div className="data-row"><span>Goal</span><span>{(robotState?.current_goal as string) || 'None'}</span></div>
          <div className="data-row"><span>Decision</span><span>{(robotState?.current_decision as string) || 'None'}</span></div>
        </Card>
      </div>
    </div>
  );
}

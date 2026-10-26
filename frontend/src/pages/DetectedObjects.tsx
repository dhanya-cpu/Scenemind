import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import './Page.css';

const CLASS_COLORS: Record<string, string> = {
  person: '#06b6d4', table: '#8b5cf6', chair: '#f59e0b', bottle: '#ef4444',
  laptop: '#3b82f6', door: '#10b981', monitor: '#6366f1', backpack: '#ec4899',
  emergency_exit: '#f97316', fire_extinguisher: '#dc2626', window: '#14b8a6', trash_bin: '#64748b',
};

export function DetectedObjects() {
  const { detections } = useWS();
  const dets = (detections?.detections as Array<{ class_name: string; confidence: number; track_id: number; bbox: { x: number; y: number; w: number; h: number } }>) || [];

  return (
    <div className="page">
      <h1 className="page-title">Detected Objects</h1>
      <div className="object-grid">
        {dets.length === 0 ? (
          <Card title="No detections"><p>Start the robot to begin object detection.</p></Card>
        ) : (
          dets.map((d, i) => (
            <Card key={i} title={d.class_name.replace('_', ' ').toUpperCase()}>
              <div className="object-card">
                <div className="object-color" style={{ background: CLASS_COLORS[d.class_name] || '#64748b' }} />
                <div className="object-details">
                  <div className="data-row"><span>Confidence</span><span className="mono">{(d.confidence * 100).toFixed(1)}%</span></div>
                  <div className="data-row"><span>Track ID</span><span className="mono">{d.track_id ?? '-'}</span></div>
                  <div className="data-row"><span>BBox</span><span className="mono">{d.bbox.w.toFixed(0)}x{d.bbox.h.toFixed(0)}</span></div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

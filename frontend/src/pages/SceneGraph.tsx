import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import './Page.css';

export function SceneGraph() {
  const { scene } = useWS();
  const relationships = (scene?.relationships as Array<{ subject: string; relation: string; object: string; confidence: number }>) || [];
  const activities = (scene?.activities as Array<{ activity: string; confidence: number; person_track_id: number }>) || [];

  return (
    <div className="page">
      <h1 className="page-title">Scene Graph</h1>
      <div className="page-grid">
        <Card title="Spatial Relationships" className="span-full">
          {relationships.length === 0 ? (
            <p>No relationships detected yet.</p>
          ) : (
            <div className="graph-list">
              {relationships.map((r, i) => (
                <div key={i} className="graph-edge glass">
                  <span className="graph-node">{r.subject}</span>
                  <span className="graph-relation">{r.relation.replace('_', ' ')}</span>
                  <span className="graph-node">{r.object}</span>
                  <span className="graph-conf mono">{(r.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Activities" className="span-full">
          {activities.length === 0 ? (
            <p>No activities recognized.</p>
          ) : (
            activities.map((a, i) => (
              <div key={i} className="data-row">
                <span>{a.activity}</span>
                <span className="mono">{(a.confidence * 100).toFixed(0)}% (person #{a.person_track_id})</span>
              </div>
            ))
          )}
        </Card>
        <Card title="Scene Description" className="span-full">
          <p className="scene-desc">{(scene?.description as string) || 'Awaiting scene analysis...'}</p>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import { api } from '../services/api';
import './Page.css';

export function AIDecisions() {
  const { scene, robotState } = useWS();
  const [reasoning, setReasoning] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.reasoning.current().then(setReasoning).catch(() => {});
    const interval = setInterval(() => api.reasoning.current().then(setReasoning).catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">AI Decisions</h1>
      <div className="page-grid">
        <Card title="Current Decision">
          <p className="decision-text">{(robotState?.current_decision as string) || (reasoning?.current_decision as string) || 'No active decision.'}</p>
        </Card>
        <Card title="Safety Assessment">
          <p>{(scene?.safety_assessment as string) || (reasoning?.safety_assessment as string) || 'Pending analysis.'}</p>
        </Card>
        <Card title="Scene Understanding" className="span-full">
          <p className="scene-desc">{(scene?.description as string) || (reasoning?.scene_description as string) || 'Awaiting perception data.'}</p>
        </Card>
        <Card title="Recommended Path" className="span-full">
          <p>{(scene?.recommended_path as string) || (reasoning?.recommended_path as string) || 'No path recommendation yet.'}</p>
        </Card>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import { api } from '../services/api';
import './Page.css';

export function Navigation() {
  const { navigation, robotState } = useWS();
  const [goalX, setGoalX] = useState('5');
  const [goalY, setGoalY] = useState('3');
  const [planner, setPlanner] = useState('astar');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handlePlan = async () => {
    const pos = robotState?.position as { x: number; y: number } | undefined;
    const res = await api.navigation.plan({
      start: { x: pos?.x ?? 0, y: pos?.y ?? 0, theta: 0 },
      goal: { x: parseFloat(goalX), y: parseFloat(goalY), theta: 0 },
      planner,
    });
    setResult(res as Record<string, unknown>);
  };

  const path = useMemo(() => {
    const incoming = (navigation?.path || result?.path) as Array<{ x: number; y: number }> | undefined;
    if (incoming && incoming.length > 0) return incoming;

    const pos = (robotState?.position as { x: number; y: number } | undefined) ?? { x: 0, y: 0 };
    const start = { x: pos.x, y: pos.y };
    const goal = { x: Number(goalX) || 5, y: Number(goalY) || 3 };

    const points: Array<{ x: number; y: number }> = [start];
    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      points.push({
        x: Number((start.x + (goal.x - start.x) * t).toFixed(2)),
        y: Number((start.y + (goal.y - start.y) * t).toFixed(2)),
      });
    }
    return points;
  }, [goalX, goalY, navigation, result, robotState]);

  const distance = (result?.distance as number) ?? (path.length > 1 ? Math.hypot(path[path.length - 1].x - path[0].x, path[path.length - 1].y - path[0].y) : 0);

  return (
    <div className="page">
      <h1 className="page-title">Navigation</h1>
      <div className="page-grid">
        <Card title="Path Planner">
          <div className="form-group">
            <label>Goal X</label>
            <input value={goalX} onChange={(e) => setGoalX(e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label>Goal Y</label>
            <input value={goalY} onChange={(e) => setGoalY(e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label>Planner</label>
            <select value={planner} onChange={(e) => setPlanner(e.target.value)} className="input">
              <option value="astar">A*</option>
              <option value="dijkstra">Dijkstra</option>
              <option value="rrt">RRT</option>
            </select>
          </div>
          <button className="btn-navigate" onClick={handlePlan}>Plan Route</button>
        </Card>
        <Card title="Navigation Status">
          <div className="data-row"><span>Active</span><span>{navigation || result ? 'Yes' : 'No'}</span></div>
          <div className="data-row"><span>Path Points</span><span>{path.length}</span></div>
          <div className="data-row"><span>Distance</span><span className="mono">{distance.toFixed(2)} m</span></div>
        </Card>
        <Card title="AI Route Explanation" className="span-full">
          <p>{(result?.reasoning as string) || (navigation?.reasoning as string) || 'Plan a route to see AI reasoning.'}</p>
        </Card>
        <Card title="Path Visualization" className="span-full">
          <div className="path-viz">
            {path.map((p, i) => {
              const minX = Math.min(0, ...path.map((pt) => pt.x));
              const minY = Math.min(0, ...path.map((pt) => pt.y));
              const maxX = Math.max(1, ...path.map((pt) => pt.x));
              const maxY = Math.max(1, ...path.map((pt) => pt.y));
              const x = ((p.x - minX) / Math.max(maxX - minX, 1)) * 100;
              const y = ((p.y - minY) / Math.max(maxY - minY, 1)) * 100;
              return <div key={`${p.x}-${p.y}-${i}`} className="path-point" style={{ left: `${x}%`, top: `${y}%` }} />;
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

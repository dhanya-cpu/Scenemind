import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Page.css';

export function Analytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.analytics.dashboard().then(setData).catch(() => {});
    const interval = setInterval(() => api.analytics.dashboard().then(setData).catch(() => {}), 10000);
    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary as Record<string, number> | undefined;
  const latencyHistory = (data?.latency_history as Array<{ timestamp: string; value: number }>) || [];
  const detectionCounts = data?.detection_counts as Record<string, number> | undefined;

  const barData = detectionCounts
    ? Object.entries(detectionCounts).map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="page">
      <h1 className="page-title">Robot Analytics</h1>
      <div className="analytics-grid">
        {summary && Object.entries({
          'Detection Accuracy': `${(summary.detection_accuracy * 100).toFixed(1)}%`,
          'Navigation Accuracy': `${(summary.navigation_accuracy * 100).toFixed(1)}%`,
          'Avg Latency': `${summary.avg_latency_ms.toFixed(0)}ms`,
          'FPS': summary.fps.toFixed(1),
          'Distance': `${summary.distance_travelled.toFixed(1)}m`,
          'Missions': `${(summary.mission_completion_rate * 100).toFixed(0)}%`,
          'Decision Time': `${summary.avg_decision_time_ms.toFixed(0)}ms`,
          'Obstacle Avoid': `${(summary.obstacle_avoidance_success * 100).toFixed(0)}%`,
        }).map(([label, value]) => (
          <Card key={label} title={label}>
            <span className="analytics-value mono">{value}</span>
          </Card>
        ))}
      </div>
      <div className="page-grid" style={{ marginTop: 16 }}>
        <Card title="Latency Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={latencyHistory}>
              <XAxis dataKey="timestamp" tick={false} />
              <YAxis />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Detection Counts">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

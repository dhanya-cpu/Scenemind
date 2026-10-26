import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { api } from '../services/api';
import './Page.css';

export function Settings() {
  const [modules, setModules] = useState<Record<string, Record<string, string>> | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.health.modules().then(setModules).catch(() => {});
    api.health.check().then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <div className="page-grid">
        <Card title="System Info">
          <div className="data-row"><span>Version</span><span className="mono">{health?.version as string}</span></div>
          <div className="data-row"><span>Environment</span><span>{health?.environment as string}</span></div>
          <div className="data-row"><span>Simulation</span><span>{health?.simulation_mode ? 'Enabled' : 'Disabled'}</span></div>
        </Card>
        <Card title="Module Configuration" className="span-full">
          {modules && Object.entries(modules).map(([name, config]) => (
            <div key={name} className="settings-module">
              <span className="settings-name">{name}</span>
              <span className="settings-status">{config.status}</span>
              <span className="settings-detail mono">{JSON.stringify(config)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

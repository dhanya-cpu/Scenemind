import { memo } from 'react';
import { useWS } from '../context/WebSocketContext';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import './Header.css';

export const Header = memo(function Header() {
  const { connected, robotState } = useWS();
  const status = (robotState?.status as string) || 'idle';
  const battery = (robotState?.battery_percent as number) || 100;

  return (
    <header className="header glass">
      <div className="header-left">
        <h2 className="header-title">SceneMind AI Dashboard</h2>
        <span className="header-tagline">Intelligent Scene Understanding Robot</span>
      </div>
      <div className="header-right">
        <div className="header-stat">
          <span className="label">Status</span>
          <span className={`value status-${status}`}>{status}</span>
        </div>
        <div className="header-stat">
          <span className="label">Battery</span>
          <span className="value">{battery.toFixed(0)}%</span>
        </div>
        <div className="header-stat">
          <span className="label">Connection</span>
          <span className="value connection">
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
        <button className="header-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
});

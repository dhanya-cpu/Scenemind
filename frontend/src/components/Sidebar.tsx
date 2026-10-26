import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Bot, Camera, Box, Map, Navigation, Eye,
  GitBranch, Mic, Brain, BarChart3, Settings, Cpu,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/robot', icon: Bot, label: 'Robot Status' },
  { to: '/camera', icon: Camera, label: 'Live Camera' },
  { to: '/digital-twin', icon: Box, label: 'Digital Twin' },
  { to: '/map', icon: Map, label: '3D Map' },
  { to: '/navigation', icon: Navigation, label: 'Navigation' },
  { to: '/objects', icon: Eye, label: 'Detected Objects' },
  { to: '/scene-graph', icon: GitBranch, label: 'Scene Graph' },
  { to: '/voice', icon: Mic, label: 'Voice Log' },
  { to: '/decisions', icon: Brain, label: 'AI Decisions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = memo(function Sidebar() {
  return (
    <aside className="sidebar glass">
      <div className="sidebar-brand">
        <Cpu size={28} className="brand-icon" />
        <div>
          <h1 className="brand-title">SceneMind</h1>
          <span className="brand-subtitle">AI Robotics</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot active" />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
});

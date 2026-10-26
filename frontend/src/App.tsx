import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WebSocketProvider } from './context/WebSocketContext';

// Eagerly load the two most-visited pages
import { Home } from './pages/Home';
import { RobotStatus } from './pages/RobotStatus';

// Lazy-load heavy pages — Three.js & Recharts only download when needed
const LiveCamera    = lazy(() => import('./pages/LiveCamera').then(m => ({ default: m.LiveCamera })));
const DigitalTwin   = lazy(() => import('./pages/DigitalTwin').then(m => ({ default: m.DigitalTwin })));
const Map3D         = lazy(() => import('./pages/Map3D').then(m => ({ default: m.Map3D })));
const Navigation    = lazy(() => import('./pages/Navigation').then(m => ({ default: m.Navigation })));
const DetectedObjects = lazy(() => import('./pages/DetectedObjects').then(m => ({ default: m.DetectedObjects })));
const SceneGraph    = lazy(() => import('./pages/SceneGraph').then(m => ({ default: m.SceneGraph })));
const VoiceLog      = lazy(() => import('./pages/VoiceLog').then(m => ({ default: m.VoiceLog })));
const AIDecisions   = lazy(() => import('./pages/AIDecisions').then(m => ({ default: m.AIDecisions })));
const Analytics     = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Settings      = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontSize: 14 }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/robot"         element={<RobotStatus />} />
              <Route path="/camera"        element={<LiveCamera />} />
              <Route path="/digital-twin"  element={<DigitalTwin />} />
              <Route path="/map"           element={<Map3D />} />
              <Route path="/navigation"    element={<Navigation />} />
              <Route path="/objects"       element={<DetectedObjects />} />
              <Route path="/scene-graph"   element={<SceneGraph />} />
              <Route path="/voice"         element={<VoiceLog />} />
              <Route path="/decisions"     element={<AIDecisions />} />
              <Route path="/analytics"     element={<Analytics />} />
              <Route path="/settings"      element={<Settings />} />
            </Routes>
          </Suspense>
        </Layout>
      </WebSocketProvider>
    </BrowserRouter>
  );
}

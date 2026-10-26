const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  robot: {
    status: () => apiGet('/api/robot/status'),
    start: () => apiPost('/api/robot/start'),
    stop: () => apiPost('/api/robot/stop'),
    history: () => apiGet('/api/robot/history'),
  },
  vision: {
    detections: () => apiGet('/api/vision/detections'),
    scene: () => apiGet('/api/vision/scene'),
    analyze: () => apiPost('/api/vision/analyze'),
  },
  navigation: {
    status: () => apiGet('/api/navigation/status'),
    plan: (body: unknown) => apiPost('/api/navigation/plan', body),
    history: () => apiGet('/api/navigation/history'),
  },
  voice: {
    query: (text: string) => apiPost('/api/voice/query', { text }),
    logs: () => apiGet('/api/voice/logs'),
    speak: (text: string) => apiPost(`/api/voice/speak?text=${encodeURIComponent(text)}`),
  },
  reasoning: {
    current: () => apiGet('/api/reasoning/current'),
    decisions: () => apiGet('/api/reasoning/decisions'),
  },
  mapping: {
    active: () => apiGet('/api/mapping/active'),
    maps: () => apiGet('/api/mapping/maps'),
  },
  analytics: {
    summary: () => apiGet('/api/analytics/summary'),
    dashboard: () => apiGet('/api/analytics/dashboard'),
  },
  digitalTwin: {
    state: () => apiGet('/api/digital-twin/state'),
    status: () => apiGet('/api/digital-twin/status'),
    sync: () => apiPost('/api/digital-twin/sync'),
  },
  health: {
    check: () => apiGet('/api/health'),
    modules: () => apiGet('/api/modules'),
  },
};

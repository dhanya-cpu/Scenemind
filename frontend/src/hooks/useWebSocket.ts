import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [robotState, setRobotState] = useState<Record<string, unknown> | null>(null);
  const [scene, setScene] = useState<Record<string, unknown> | null>(null);
  const [detections, setDetections] = useState<Record<string, unknown> | null>(null);
  const [navigation, setNavigation] = useState<Record<string, unknown> | null>(null);
  const [voice, setVoice] = useState<Record<string, unknown> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const refreshFromApi = useCallback(async () => {
    try {
      const [robot, sceneRes, detectionsRes] = await Promise.all([
        fetch('http://localhost:8000/api/robot/status').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8000/api/vision/scene').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8000/api/vision/detections').then((r) => r.ok ? r.json() : null),
      ]);

      if (robot) setRobotState(robot);
      if (sceneRes) setScene(sceneRes);
      if (detectionsRes) setDetections(detectionsRes);
    } catch {
      // Keep previous dashboard state until the backend is available again.
    }
  }, []);

  const connect = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      refreshFromApi();
    };
    ws.onclose = () => {
      setConnected(false);
      refreshFromApi();
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      setLastMessage(msg);

      switch (msg.type) {
        case 'robot_state':
          setRobotState(msg.payload);
          break;
        case 'scene':
          setScene(msg.payload);
          break;
        case 'detections':
          setDetections(msg.payload);
          break;
        case 'navigation':
          setNavigation(msg.payload);
          break;
        case 'voice':
        case 'voice_response':
          setVoice(msg.payload);
          break;
      }
    };
  }, [refreshFromApi]);

  useEffect(() => {
    connect();
    refreshFromApi();
    return () => wsRef.current?.close();
  }, [connect, refreshFromApi]);

  const send = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }, []);

  return { connected, lastMessage, robotState, scene, detections, navigation, voice, send };
}

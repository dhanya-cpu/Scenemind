import { useEffect, useRef, useState } from 'react';
import { Card } from '../components/Card';
import { useWS } from '../context/WebSocketContext';
import { api } from '../services/api';
import { Mic, Send } from 'lucide-react';
import './Page.css';

const QUICK_QUERIES = [
  'What do you see?',
  'Is the room safe?',
  'Where is the nearest chair?',
  'How many people are inside?',
];

const FORCE_VOICE_FAILURE = String(import.meta.env.VITE_FORCE_VOICE_FAILURE || '').toLowerCase() === 'true';

export function VoiceLog() {
  const { voice } = useWS();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = (window as Window & {
      webkitSpeechRecognition?: new () => any;
      SpeechRecognition?: new () => any;
    }).SpeechRecognition || (window as Window & {
      webkitSpeechRecognition?: new () => any;
      SpeechRecognition?: new () => any;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setStatusText('Browser mic unavailable');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setStatusText('Voice captured');
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setStatusText('Microphone error');
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setStatusText('Processing');

    try {
      if (FORCE_VOICE_FAILURE) {
        throw new Error('Simulated voice service failure');
      }

      const res = await api.voice.query(trimmed) as { response_text: string };
      const answer = res.response_text || 'I did not hear anything clearly.';
      setHistory((prev) => [{ q: trimmed, a: answer }, ...prev]);
      speakResponse(answer);
      setStatusText('Response ready');
    } catch (error) {
      const fallback = 'I could not generate a clear response right now.';
      setHistory((prev) => [{ q: trimmed, a: fallback }, ...prev]);
      setStatusText('Response failed');
    }

    setLoading(false);
    setQuery('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatusText('Microphone unsupported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusText('Stopped listening');
      return;
    }

    recognitionRef.current.start();
    setIsListening(true);
    setStatusText('Listening...');
  };

  return (
    <div className="page">
      <h1 className="page-title">Voice Assistant</h1>
      <div className="page-grid">
        <Card title="Ask the Robot" className="span-full">
          <div className="voice-panel">
            <div className="voice-input">
              <Mic size={20} className="voice-icon" />
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (query.trim()) ask(query);
                  }
                }}
                placeholder="Ask the laptop robot what it sees..."
                className="input voice-text"
                rows={2}
              />
              <div className="voice-actions">
                <button
                  className={`voice-mic ${isListening ? 'listening' : ''}`}
                  onClick={toggleListening}
                  aria-label="Toggle microphone"
                  title="Use microphone"
                  type="button"
                >
                  <Mic size={16} />
                </button>
                <button className="btn-send" onClick={() => query && ask(query)} disabled={loading} type="button">
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="voice-status">{statusText}</div>
            <div className="quick-queries">
              {QUICK_QUERIES.map((q) => (
                <button key={q} className="quick-btn" onClick={() => ask(q)} type="button">{q}</button>
              ))}
            </div>
          </div>
        </Card>
        {voice && (
          <Card title="Latest Response" className="span-full">
            <p>{voice.response_text as string}</p>
          </Card>
        )}
        <Card title="Conversation History" className="span-full">
          {history.length === 0 ? (
            <p>Ask a question to start a conversation.</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="voice-entry">
                <div className="voice-q"><Mic size={14} /> {h.q}</div>
                <div className="voice-a">{h.a}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

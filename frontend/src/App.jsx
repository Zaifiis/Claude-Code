import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Calendar from './components/Calendar.jsx';
import ContentModal from './components/ContentModal.jsx';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

const TABS = [
  { id: 'pipeline1', label: 'AI News' },
  { id: 'pipeline2', label: 'AI Tools' },
  { id: 'pipeline3', label: 'Business + AI' },
  { id: 'calendar', label: 'Weekly Calendar' }
];

export default function App() {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline1');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [genState, setGenState] = useState({ stage: 'idle', result: null, critique: null, error: null });

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/trends`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTrendData(data);
    } catch (err) {
      console.error('Trends fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const openModal = useCallback((topic) => {
    setSelectedTopic(topic);
    setGenState({ stage: 'idle', result: null, critique: null, error: null });
  }, []);

  const closeModal = useCallback(() => {
    setSelectedTopic(null);
    setGenState({ stage: 'idle', result: null, critique: null, error: null });
  }, []);

  const generateContent = useCallback(async (topic, pipeline, platform) => {
    setGenState({ stage: 'generating', result: null, critique: null, error: null });

    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, pipeline, platform })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.stage === 'error') {
              setGenState({ stage: 'error', result: null, critique: null, error: event.data });
            } else if (event.stage === 'complete') {
              setGenState({
                stage: 'complete',
                result: event.data.result,
                critique: event.data.critique,
                error: null
              });
            } else {
              setGenState((prev) => ({ ...prev, stage: event.stage }));
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      setGenState({ stage: 'error', result: null, critique: null, error: err.message });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F1F5F9' }}>
      {/* Header */}
      <header style={{
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-1px'
          }}>S</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#F1F5F9', lineHeight: 1 }}>Snaplyr Content Engine</div>
            {trendData && (
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Last refresh: {new Date(trendData.fetchedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={fetchTrends}
          disabled={loading}
          style={{
            background: loading ? '#1E293B' : '#0EA5E9',
            color: loading ? '#64748B' : '#fff',
            border: `1px solid ${loading ? '#334155' : '#0EA5E9'}`,
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
          {loading ? 'Refreshing...' : 'Refresh Trends'}
        </button>
      </header>

      {/* Tabs */}
      <nav style={{
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        padding: '0 24px',
        display: 'flex',
        gap: '0',
        overflowX: 'auto'
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0EA5E9' : '2px solid transparent',
              color: activeTab === tab.id ? '#0EA5E9' : '#94A3B8',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ padding: '28px 24px', maxWidth: '1440px', margin: '0 auto' }}>
        {loading && !trendData && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⟳</div>
            <div style={{ fontSize: '16px' }}>Fetching trends from Reddit, YouTube & News...</div>
            <div style={{ fontSize: '13px', marginTop: '8px', color: '#64748B' }}>This takes ~30 seconds on first load</div>
          </div>
        )}

        {trendData && activeTab !== 'calendar' && (
          <Dashboard
            topics={trendData.pipelines[activeTab] || []}
            pipelineName={trendData.pipelineNames[activeTab] || activeTab}
            onGenerate={openModal}
          />
        )}

        {trendData && activeTab === 'calendar' && (
          <Calendar trendData={trendData} onSelectTopic={openModal} />
        )}

        {!loading && !trendData && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠</div>
            <div>Failed to load trends. Click Refresh Trends to try again.</div>
          </div>
        )}
      </main>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {selectedTopic && (
        <ContentModal
          topic={selectedTopic}
          genState={genState}
          pipelineNames={trendData?.pipelineNames || {}}
          onGenerate={generateContent}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

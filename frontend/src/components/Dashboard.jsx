import TopicCard from './TopicCard.jsx';

export default function Dashboard({ topics, pipelineName, onGenerate }) {
  if (!topics || topics.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#94A3B8' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>○</div>
        <div style={{ fontSize: '16px' }}>No topics in <strong style={{ color: '#F1F5F9' }}>{pipelineName}</strong></div>
        <div style={{ fontSize: '13px', marginTop: '8px', color: '#64748B' }}>Try refreshing trends — data sources may have limited matching content right now.</div>
      </div>
    );
  }

  const high = topics.filter((t) => t.priorityScore >= 8);
  const mid = topics.filter((t) => t.priorityScore >= 5 && t.priorityScore < 8);
  const low = topics.filter((t) => t.priorityScore < 5);

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#F1F5F9' }}>{pipelineName}</h2>
        <span style={{
          background: '#0EA5E920',
          color: '#38BDF8',
          borderRadius: '20px',
          padding: '2px 12px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {topics.length} topics
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} onGenerate={onGenerate} />
        ))}
      </div>

      {topics.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#1E293B',
          borderRadius: '12px',
          border: '1px solid #334155',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <Stat label="High Priority (8-10)" value={high.length} color="#22C55E" />
          <Stat label="Medium (5-7)" value={mid.length} color="#F59E0B" />
          <Stat label="Low (<5)" value={low.length} color="#EF4444" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '13px', color: '#94A3B8' }}>{label}:</span>
      <span style={{ fontSize: '13px', fontWeight: '700', color: '#F1F5F9' }}>{value}</span>
    </div>
  );
}

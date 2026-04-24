export default function TopicCard({ topic, onGenerate }) {
  const score = topic.priorityScore;
  const scoreColor = score >= 8 ? '#22C55E' : score >= 5 ? '#F59E0B' : '#EF4444';
  const scoreBg = score >= 8 ? '#22C55E18' : score >= 5 ? '#F59E0B18' : '#EF444418';

  const sourceColors = {
    Reddit: { bg: '#FF450020', color: '#FF6B35' },
    YouTube: { bg: '#FF000020', color: '#FF4444' },
    News: { bg: '#0EA5E920', color: '#38BDF8' }
  };
  const srcStyle = sourceColors[topic.source] || { bg: '#33415520', color: '#94A3B8' };

  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: '14px',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.2s, transform 0.15s',
      cursor: 'default'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#475569';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Score + Source row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          background: scoreBg,
          color: scoreColor,
          border: `1px solid ${scoreColor}40`,
          borderRadius: '6px',
          padding: '3px 10px',
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          {score}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {topic.subreddit && (
            <span style={{
              background: '#334155',
              color: '#64748B',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px'
            }}>
              r/{topic.subreddit}
            </span>
          )}
          <span style={{
            background: srcStyle.bg,
            color: srcStyle.color,
            borderRadius: '6px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {topic.source}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0,
        fontSize: '14px',
        fontWeight: '600',
        color: '#F1F5F9',
        lineHeight: '1.55',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {topic.title}
      </h3>

      {/* Cross-platform badge */}
      {topic.platforms && topic.platforms.length > 1 && (
        <span style={{
          background: '#7C3AED20',
          color: '#A78BFA',
          border: '1px solid #7C3AED40',
          borderRadius: '6px',
          padding: '2px 10px',
          fontSize: '11px',
          fontWeight: '600',
          alignSelf: 'flex-start'
        }}>
          Trending on {topic.platforms.join(' + ')}
        </span>
      )}

      {/* WhyTrending if available */}
      {topic.whyTrending && (
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#94A3B8',
          fontStyle: 'italic',
          lineHeight: '1.5'
        }}>
          "{topic.whyTrending}"
        </p>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Generate button */}
      <button
        onClick={() => onGenerate(topic)}
        style={{
          background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '9px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
          width: '100%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        Generate Content
      </button>
    </div>
  );
}

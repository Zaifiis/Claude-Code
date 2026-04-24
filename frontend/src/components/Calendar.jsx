const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_PIPELINES = ['pipeline1', 'pipeline2', 'pipeline3', 'pipeline1', 'pipeline2', 'pipeline3', 'any'];

const PIPELINE_BADGE = {
  pipeline1: { label: 'AI News', bg: '#0EA5E920', color: '#38BDF8', border: '#0EA5E940' },
  pipeline2: { label: 'AI Tools', bg: '#8B5CF620', color: '#A78BFA', border: '#8B5CF640' },
  pipeline3: { label: 'Business + AI', bg: '#10B98120', color: '#34D399', border: '#10B98140' },
  any: { label: 'Top Pick', bg: '#F59E0B20', color: '#FBBF24', border: '#F59E0B40' }
};

function getScoreColor(score) {
  if (score >= 8) return '#22C55E';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
}

export default function Calendar({ trendData, onSelectTopic }) {
  const { pipelines, allSorted } = trendData;

  const calendarItems = DAYS.map((day, i) => {
    const pKey = DAY_PIPELINES[i];
    let topic = null;
    if (pKey === 'any') {
      topic = allSorted[0] || null;
    } else {
      topic = (pipelines[pKey] || [])[0] || null;
    }
    return { day, dayShort: DAY_SHORT[i], topic, pKey };
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#F1F5F9' }}>Weekly Content Calendar</h2>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>
          Auto-populated from top scored topics per pipeline. Click any day to generate content.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(PIPELINE_BADGE).map(([key, val]) => (
          <span key={key} style={{
            background: val.bg,
            color: val.color,
            border: `1px solid ${val.border}`,
            borderRadius: '20px',
            padding: '3px 12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {val.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px'
      }}>
        {calendarItems.map(({ day, dayShort, topic, pKey }) => {
          const badge = PIPELINE_BADGE[pKey] || PIPELINE_BADGE.any;
          return (
            <div
              key={day}
              onClick={() => topic && onSelectTopic(topic)}
              style={{
                background: '#1E293B',
                border: `1px solid ${topic ? '#334155' : '#1E293B'}`,
                borderRadius: '14px',
                padding: '14px',
                cursor: topic ? 'pointer' : 'default',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s',
                opacity: topic ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (topic) {
                  e.currentTarget.style.borderColor = '#0EA5E9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = topic ? '#334155' : '#1E293B';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '12px', color: '#0EA5E9', letterSpacing: '0.5px' }}>
                {day}
              </div>

              {topic ? (
                <>
                  <span style={{
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '10px',
                    fontWeight: '700',
                    alignSelf: 'flex-start',
                    letterSpacing: '0.3px'
                  }}>
                    {badge.label}
                  </span>

                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#E2E8F0',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {topic.title}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#64748B'
                    }}>
                      {topic.source}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: getScoreColor(topic.priorityScore)
                    }}>
                      {topic.priorityScore}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color: '#475569', fontSize: '12px', marginTop: '8px' }}>No topics</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Responsive note */}
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>
        Calendar shows top topic per pipeline per day. Refresh trends to update.
      </p>
    </div>
  );
}

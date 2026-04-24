export default function PipelineTab({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: '0' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
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
    </div>
  );
}

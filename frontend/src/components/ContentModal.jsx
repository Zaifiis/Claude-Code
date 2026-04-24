import { useState, useEffect } from 'react';

const STAGES = [
  { key: 'generating', label: 'Generating draft...', step: 1 },
  { key: 'critiquing', label: 'Self-critiquing...', step: 2 },
  { key: 'refining', label: 'Refining...', step: 3 }
];

const PIPELINE_NAMES = {
  pipeline1: 'AI News',
  pipeline2: 'AI Tools',
  pipeline3: 'Business + AI'
};

function getPipelineForTopic(topic) {
  if (!topic?.pipelineScores) return 'pipeline1';
  const entries = Object.entries(topic.pipelineScores);
  if (!entries.length) return 'pipeline1';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <button
      onClick={copy}
      style={{
        background: copied ? '#22C55E20' : '#334155',
        color: copied ? '#22C55E' : '#94A3B8',
        border: `1px solid ${copied ? '#22C55E40' : '#475569'}`,
        borderRadius: '6px',
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function StageIndicator({ currentStage }) {
  const currentStep = STAGES.find((s) => s.key === currentStage)?.step || 0;

  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0',
        background: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '40px',
        padding: '8px 20px',
        marginBottom: '28px'
      }}>
        {STAGES.map((stage, i) => (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: currentStep > stage.step ? '#22C55E' : currentStep === stage.step ? '#0EA5E9' : '#334155',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700',
              transition: 'background 0.3s'
            }}>
              {currentStep > stage.step ? '✓' : stage.step}
            </div>
            {i < STAGES.length - 1 && (
              <div style={{
                width: '40px', height: '2px',
                background: currentStep > stage.step ? '#22C55E' : '#334155',
                margin: '0 4px',
                transition: 'background 0.3s'
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#F1F5F9',
        marginBottom: '8px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        {STAGES.find((s) => s.key === currentStage)?.label || 'Processing...'}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B' }}>
        Using Groq llama-3.3-70b-versatile
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

export default function ContentModal({ topic, genState, pipelineNames, onGenerate, onClose }) {
  const pipeline = getPipelineForTopic(topic);
  const pipelineName = pipelineNames[pipeline] || PIPELINE_NAMES[pipeline] || 'AI';

  useEffect(() => {
    if (genState.stage === 'idle') {
      onGenerate(topic.title, pipelineName, topic.source);
    }
  }, []);

  const isLoading = ['generating', 'critiquing', 'refining'].includes(genState.stage);
  const result = genState.result;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '760px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{
              display: 'inline-flex',
              background: '#0EA5E920',
              color: '#38BDF8',
              border: '1px solid #0EA5E940',
              borderRadius: '6px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: '700',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {pipelineName} · {topic.source}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: '#F1F5F9',
              lineHeight: '1.4'
            }}>
              {topic.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#94A3B8',
              width: '32px', height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
          {isLoading && <StageIndicator currentStage={genState.stage} />}

          {genState.stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠</div>
              <div style={{ color: '#EF4444', fontSize: '15px', marginBottom: '8px', fontWeight: '600' }}>Generation failed</div>
              <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>{genState.error}</div>
              <button
                onClick={() => onGenerate(topic.title, pipelineName, topic.source)}
                style={{
                  background: '#0EA5E9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {genState.stage === 'complete' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Why Trending */}
              {result.whyTrending && (
                <div style={{
                  background: '#0F172A',
                  border: '1px solid #0EA5E940',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>🔥</span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>WHY IT'S TRENDING</div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: '1.55' }}>{result.whyTrending}</p>
                  </div>
                </div>
              )}

              {/* Hooks */}
              <Section title="Scroll-Stopper Hooks" emoji="🎯">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(result.hooks || []).map((hook, i) => (
                    <div key={i} style={{
                      background: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                        <span style={{
                          background: '#0EA5E920',
                          color: '#0EA5E9',
                          borderRadius: '50%',
                          width: '22px', height: '22px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', flexShrink: 0, marginTop: '1px'
                        }}>{i + 1}</span>
                        <span style={{ fontSize: '14px', color: '#F1F5F9', lineHeight: '1.5' }}>{hook}</span>
                      </div>
                      <CopyButton text={hook} />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Critique summary */}
              {genState.critique && (
                <Section title="Self-Critique" emoji="🔍">
                  <div style={{
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '14px 16px'
                  }}>
                    {genState.critique.hookScores && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {genState.critique.hookScores.map((s, i) => (
                          <span key={i} style={{
                            background: s >= 7 ? '#22C55E20' : '#EF444420',
                            color: s >= 7 ? '#22C55E' : '#EF4444',
                            border: `1px solid ${s >= 7 ? '#22C55E40' : '#EF444440'}`,
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            Hook {i + 1}: {s}/10
                          </span>
                        ))}
                      </div>
                    )}
                    {(genState.critique.weaknesses || []).map((w, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #334155' }}>
                        {w}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Reel Script */}
              {result.reelScript && (
                <Section title="60-90s Reel Script" emoji="🎬">
                  <div style={{
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      <CopyButton text={result.reelScript} />
                    </div>
                    <pre style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#CBD5E1',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit'
                    }}>
                      {result.reelScript}
                    </pre>
                  </div>
                </Section>
              )}

              {/* LinkedIn Post */}
              {result.linkedinPost && (
                <Section title="LinkedIn Post" emoji="💼">
                  <div style={{
                    background: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      <CopyButton text={result.linkedinPost} />
                    </div>
                    <pre style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#CBD5E1',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit'
                    }}>
                      {result.linkedinPost}
                    </pre>
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, emoji, children }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '16px' }}>{emoji}</span>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#F1F5F9' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

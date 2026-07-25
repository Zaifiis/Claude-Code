const LABELS = {
  idle: 'خاموش',
  listening: 'سن رہی ہوں',
  thinking: 'سوچ رہی ہوں',
  speaking: 'بول رہی ہوں',
};
const EN = { idle: 'Idle', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };

export default function VoiceOrb({ state = 'idle' }) {
  return (
    <div className="voice-stage">
      <div className={`orb-wrap ${state}`}>
        <div className="orb-ring" />
        <div className={`orb ${state}`} />
      </div>
      <div className="state-label">
        <span className="ur" style={{ fontSize: 18 }}>{LABELS[state]}</span>{' '}
        · <b>{EN[state]}</b>
      </div>
    </div>
  );
}

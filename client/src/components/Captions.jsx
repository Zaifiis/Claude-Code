import { useEffect, useRef } from 'react';

// Live captions. Each entry: { who: 'user'|'agent', text }.
export default function Captions({ lines }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="captions" ref={ref}>
      {lines.length === 0 && (
        <div className="cap agent">
          <div className="who">Zaiqa</div>
          <span className="ur">مائیک دبائیں اور اپنا آرڈر بتائیں۔</span>
        </div>
      )}
      {lines.map((l, i) => (
        <div key={i} className={`cap ${l.who}`}>
          <div className="who">{l.who === 'user' ? 'You' : 'Zaiqa'}</div>
          <span className="ur">{l.text}</span>
        </div>
      ))}
    </div>
  );
}

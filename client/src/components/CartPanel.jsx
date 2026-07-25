// Cart mirror. `lines` come either from local "+" adds or from the
// backend's tool_result events, so the panel tracks the voice order live.
export default function CartPanel({ lines }) {
  const total = lines.reduce((s, l) => s + (l.line_total ?? l.price * l.qty), 0);

  return (
    <div>
      {lines.length === 0 && <div className="cart-empty">آپ کا آرڈر یہاں نظر آئے گا۔</div>}
      {lines.map((l) => (
        <div key={l.id} className="cart-line">
          <div className="names">
            <span className="ur" style={{ fontSize: 16 }}>{l.name_ur}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>×{l.qty}</span>
            <span className="price">Rs {l.line_total ?? l.price * l.qty}</span>
          </div>
        </div>
      ))}
      {lines.length > 0 && (
        <div className="cart-total">
          <span>کل رقم</span>
          <span className="price">Rs {total}</span>
        </div>
      )}
    </div>
  );
}

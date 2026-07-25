// Menu grouped by category. Manual "+" adds are a convenience alongside
// the voice flow (they update the local cart only).
export default function MenuList({ menu, onAdd }) {
  const byCat = menu.reduce((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat}>
          <div className="menu-cat">{cat}</div>
          {items.map((m) => (
            <div key={m.id} className="menu-item">
              <div className="names">
                <span className="ur">{m.name_ur}</span>
                <span className="en">{m.name_en}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="price">Rs {m.price}</span>
                <button className="add-btn" onClick={() => onAdd(m)} aria-label={`Add ${m.name_en}`}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

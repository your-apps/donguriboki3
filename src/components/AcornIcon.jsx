export default function AcornIcon({ empty = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {empty ? (
        <>
          <ellipse cx="12" cy="8.5" rx="7" ry="3.2" fill="#C8B89A"/>
          <rect x="5" y="8" width="14" height="2.5" rx="1.2" fill="#D4C4A8"/>
          <line x1="9" y1="8" x2="9" y2="10.5" stroke="#B8A888" strokeWidth="0.6"/>
          <line x1="12" y1="8" x2="12" y2="10.5" stroke="#B8A888" strokeWidth="0.6"/>
          <line x1="15" y1="8" x2="15" y2="10.5" stroke="#B8A888" strokeWidth="0.6"/>
          <line x1="12" y1="5.5" x2="12" y2="8" stroke="#A89878" strokeWidth="1.2" strokeLinecap="round"/>
          <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="#D8CDB8"/>
          <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="none" stroke="#B8A888" strokeWidth="0.8"/>
        </>
      ) : (
        <>
          <ellipse cx="12" cy="8.5" rx="7" ry="3.2" fill="#8B5E2E"/>
          <rect x="5" y="8" width="14" height="2.5" rx="1.2" fill="#A0722A"/>
          <line x1="9" y1="8" x2="9" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
          <line x1="12" y1="8" x2="12" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
          <line x1="15" y1="8" x2="15" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
          <line x1="12" y1="5.5" x2="12" y2="8" stroke="#6B4423" strokeWidth="1.2" strokeLinecap="round"/>
          <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="#D4721E"/>
          <ellipse cx="10" cy="13" rx="1.8" ry="1.2" fill="#F0A050" opacity=".5"/>
          <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="none" stroke="#8B4A0A" strokeWidth="0.8"/>
        </>
      )}
    </svg>
  );
}

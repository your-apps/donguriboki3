import AcornIcon from './AcornIcon';

export default function BottomNav({ current, onNavigate }) {
  const tabs = [
    { id: 'home', label: 'ホーム', icon: <AcornIcon size={22} /> },
    {
      id: 'analysis',
      label: '分析',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="12" width="4" height="9" rx="2" fill="currentColor"/>
          <rect x="10" y="7" width="4" height="14" rx="2" fill="currentColor"/>
          <rect x="17" y="3" width="4" height="18" rx="2" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: 'glossary',
      label: '用語集',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="3" width="14" height="18" rx="3" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="flex items-stretch px-2 pt-1.5 pb-1"
      style={{
        background: 'white',
        borderTop: '1.5px solid var(--or100)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 20px rgba(74,46,14,0.08)',
      }}
      aria-label="メインナビゲーション"
    >
      {tabs.map(tab => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 cursor-pointer transition-all duration-200 rounded-2xl"
            style={{
              color: active ? 'var(--or500)' : '#B0A090',
              background: active ? 'var(--or50)' : 'transparent',
              border: 'none',
              fontWeight: active ? 700 : 500,
            }}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

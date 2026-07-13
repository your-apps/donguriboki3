import { useState, useMemo } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import { getUser } from '../services/storage';
import { glossaryCategories, calcUnlockedCategories } from '../data/glossary';

export default function Glossary() {
  const user = getUser();
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState(new Set());
  const [selectedTerm, setSelectedTerm] = useState(null);

  const unlockedNames = useMemo(
    () => new Set(calcUnlockedCategories(user?.progress)),
    [user?.progress]
  );

  // 検索フィルタ適用
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const results = [];
    for (const cat of glossaryCategories) {
      if (!unlockedNames.has(cat.name)) continue;
      for (const term of cat.terms) {
        if (
          term.term.includes(query) ||
          term.reading.includes(q) ||
          term.simple.includes(query) ||
          term.formal.includes(query)
        ) {
          results.push({ ...term, categoryName: cat.name });
        }
      }
    }
    return results;
  }, [query, unlockedNames]);

  function toggleCategory(catId) {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  return (
    <div className="app-container flex flex-col">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold" style={{ color: 'var(--br600)' }}>用語集</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* ツム爺のひと言 */}
        <div className="flex items-end gap-3">
          <img src={tsumujiiImg} alt="ツム爺" className="object-contain flex-shrink-0" style={{ width: 67, height: 67 }} />
          <div className="bubble bubble-tail-left text-sm flex-1" style={{ color: 'var(--br600)', marginBottom: 14 }}>
            {unlockedNames.size > 0
              ? '分からない言葉があれば、ここで調べるのじゃ。'
              : 'ステージをクリアすると、用語が少しずつ増えていくのじゃよ。'}
          </div>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--br400)" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="用語を検索…"
            className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm outline-none border-2 transition-colors"
            style={{
              borderColor: query ? 'var(--or300)' : 'var(--or200)',
              background: 'white',
              color: 'var(--br600)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--br200)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* 検索結果 */}
        {filtered !== null ? (
          filtered.length === 0 ? (
            <div className="clay-card p-6 text-center">
              <p className="text-sm" style={{ color: 'var(--br400)' }}>
                「{query}」に一致する用語は見つからなかったのう。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs px-1" style={{ color: 'var(--br400)' }}>
                {filtered.length}件見つかったぞ
              </p>
              {filtered.map(term => (
                <TermCard
                  key={term.id}
                  term={term}
                  isOpen={selectedTerm === term.id}
                  onToggle={() => setSelectedTerm(selectedTerm === term.id ? null : term.id)}
                  showCategory
                />
              ))}
            </div>
          )
        ) : (
          /* カテゴリ一覧 */
          <div className="space-y-2">
            {glossaryCategories.map(cat => {
              const unlocked = unlockedNames.has(cat.name);
              const isOpen = openCategories.has(cat.id);
              return (
                <div key={cat.id} className="clay-card overflow-hidden">
                  {/* カテゴリヘッダー */}
                  <button
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                    style={{ background: 'transparent', border: 'none' }}
                    onClick={() => unlocked && toggleCategory(cat.id)}
                    disabled={!unlocked}
                  >
                    <div className="flex items-center gap-3">
                      {unlocked ? (
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--or100)' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--or500)" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="var(--or500)" strokeWidth="1.8" strokeLinejoin="round"/>
                            <line x1="9" y1="7" x2="15" y2="7" stroke="var(--or500)" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="9" y1="11" x2="15" y2="11" stroke="var(--or500)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: '#F0EDE8' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A89878" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <div
                          className="font-bold text-sm"
                          style={{ color: unlocked ? 'var(--br600)' : '#A89878' }}
                        >
                          {cat.name}
                        </div>
                        <div className="text-xs" style={{ color: unlocked ? 'var(--br400)' : '#C4B898' }}>
                          {unlocked ? `${cat.terms.length}語` : 'ステージをクリアして解放'}
                        </div>
                      </div>
                    </div>
                    {unlocked && (
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="var(--br400)" strokeWidth="2.5" strokeLinecap="round"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    )}
                  </button>

                  {/* 用語リスト（アコーディオン） */}
                  {unlocked && isOpen && (
                    <div
                      className="border-t"
                      style={{ borderColor: 'var(--or100)' }}
                    >
                      {cat.terms.map(term => (
                        <TermCard
                          key={term.id}
                          term={term}
                          isOpen={selectedTerm === term.id}
                          onToggle={() => setSelectedTerm(selectedTerm === term.id ? null : term.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* まだ何も解放されていない場合 */}
        {unlockedNames.size === 0 && !query && (
          <div className="clay-card p-5 text-center">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--br400)' }}>
              ステージ1をクリアすると<br/>最初の用語が解放されるのじゃよ！
            </p>
          </div>
        )}
      </div>

      {/* 用語詳細はインライン展開で表示（モーダル不使用） */}
    </div>
  );
}

function TermCard({ term, isOpen, onToggle, showCategory = false }) {
  return (
    <div>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
        style={{ background: 'transparent', border: 'none' }}
        onClick={onToggle}
      >
        <div>
          {showCategory && (
            <div className="text-xs mb-0.5" style={{ color: 'var(--br400)' }}>
              {term.categoryName}
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm" style={{ color: 'var(--br600)' }}>
              {term.term}
            </span>
            <span className="text-xs" style={{ color: 'var(--br400)' }}>
              {term.reading}
            </span>
          </div>
          {!isOpen && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--br400)' }}>
              {term.simple}
            </p>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--br400)" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div
          className="px-4 pb-4 space-y-3"
          style={{ borderTop: '1px solid var(--or100)', background: showCategory ? 'white' : undefined }}
        >
          {/* かんたん説明 */}
          <div className="pt-3">
            <div className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--or500)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <ellipse cx="12" cy="15" rx="7" ry="6" fill="var(--br200)" stroke="var(--br400)" strokeWidth="1.5"/>
                <path d="M8 15 Q9 9 12 8 Q15 9 16 15" fill="var(--br400)"/>
                <path d="M12 8 Q13 4 16 4 Q17 7 14 8" fill="var(--gr300)" stroke="var(--gr500)" strokeWidth="1"/>
              </svg>
              かんたんに言うと
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--br600)' }}>
              {term.simple}
            </p>
          </div>

          {/* 正式説明 */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--br50)', border: '1px solid var(--br200)' }}
          >
            <div className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--br400)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--br400)" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="var(--br50)" stroke="var(--br400)" strokeWidth="1.8" strokeLinejoin="round"/>
                <line x1="9" y1="7" x2="16" y2="7" stroke="var(--br400)" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="9" y1="11" x2="16" y2="11" stroke="var(--br400)" strokeWidth="1.4" strokeLinecap="round"/>
                <line x1="9" y1="15" x2="13" y2="15" stroke="var(--br400)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              正式な説明
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
              {term.formal}
            </p>
          </div>

          {/* 例文（あれば） */}
          {term.example && (
            <div
              className="rounded-xl p-3"
              style={{ background: '#F0F7E8', border: '1px solid var(--gr300)' }}
            >
              <div className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--gr500)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 21h6M10 17h4M12 3a6 6 0 0 1 4.24 10.24C15.5 14 15 15 15 17H9c0-2-.5-3-1.24-3.76A6 6 0 0 1 12 3z" fill="var(--gr50)" stroke="var(--gr500)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="6" x2="12" y2="10" stroke="var(--gr500)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                例
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
                {term.example}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

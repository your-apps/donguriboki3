import { useState } from 'react';
import { getUser, updateUser } from '../services/storage';

export default function Settings({ onBack }) {
  const user = getUser();
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState(user?.acorns_goal || 10);
  const [showHint, setShowHint] = useState(user?.show_hint ?? true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateUser({ name: name.trim() || user.name, acorns_goal: goal, show_hint: showHint });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="app-container flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--or100)', border: 'none' }}
          onClick={onBack}
          aria-label="戻る"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--br600)' }}>設定</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="clay-card p-5 space-y-4">
          {/* 名前 */}
          <div>
            <label htmlFor="setting-name" className="block text-sm font-bold mb-2" style={{ color: 'var(--br400)' }}>
              名前
            </label>
            <input
              id="setting-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={10}
              className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 transition-colors"
              style={{ borderColor: 'var(--or200)', background: 'var(--or50)', color: 'var(--br600)' }}
            />
          </div>

          {/* 目標どんぐり数 */}
          <div>
            <label htmlFor="setting-goal" className="block text-sm font-bold mb-2" style={{ color: 'var(--br400)' }}>
              1日の目標どんぐり数：{goal}個
            </label>
            <input
              id="setting-goal"
              type="range"
              min={5} max={30} step={5}
              value={goal}
              onChange={e => setGoal(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--or300)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--br400)' }}>
              <span>5</span><span>30</span>
            </div>
          </div>

          {/* ヒント */}
          <div className="flex items-center justify-between">
            <label htmlFor="setting-hint" className="text-sm font-bold" style={{ color: 'var(--br400)' }}>
              ヒントを表示する
            </label>
            <button
              id="setting-hint"
              role="switch"
              aria-checked={showHint}
              className="w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer relative"
              style={{
                background: showHint ? 'var(--or300)' : '#D4C4A8',
                border: 'none',
              }}
              onClick={() => setShowHint(v => !v)}
            >
              <span
                className="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: showHint ? 'translateX(26px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>

        <button
          className="clay-btn w-full py-4 font-bold text-white"
          style={{ background: saved ? 'var(--gr500)' : 'var(--or500)' }}
          onClick={handleSave}
        >
          {saved ? '保存しました！' : '保存する'}
        </button>
      </div>
    </div>
  );
}

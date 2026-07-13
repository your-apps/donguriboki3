import { useState } from 'react';
import { getUser, updateUser, exportBackup, importBackup } from '../services/storage';

export default function Settings({ onBack }) {
  const user = getUser();
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState(user?.acorns_goal || 10);
  const [showHint, setShowHint] = useState(user?.show_hint ?? true);
  const [saved, setSaved] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreMessage, setRestoreMessage] = useState(null);

  function handleSave() {
    updateUser({ name: name.trim() || user.name, acorns_goal: goal, show_hint: showHint });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleExport() {
    const code = exportBackup();
    if (code) setBackupCode(code);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(backupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可の環境ではテキストを手動選択してもらう
    }
  }

  function handleRestore() {
    if (!restoreCode.trim()) return;
    if (!window.confirm('現在の進捗はバックアップコードの内容で上書きされます。復元しますか？')) return;
    if (importBackup(restoreCode)) {
      window.location.reload();
    } else {
      setRestoreMessage('コードが正しくないようじゃ。もう一度確かめてくれんかの。');
    }
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
              className="clay-range cursor-pointer"
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

        {/* バックアップ */}
        <div className="clay-card p-5 space-y-3">
          <h2 className="text-sm font-bold" style={{ color: 'var(--br600)' }}>バックアップ</h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--br400)' }}>
            進捗はこの端末のブラウザに保存されています。バックアップコードを控えておくと、データが消えたときや機種変更のときに復元できます。
          </p>

          <button
            className="clay-btn w-full py-3 font-bold text-white text-sm"
            style={{ background: 'var(--or300)' }}
            onClick={handleExport}
          >
            バックアップコードを作成
          </button>

          {backupCode && (
            <div className="space-y-2">
              <textarea
                readOnly
                value={backupCode}
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-xs outline-none border-2 break-all"
                style={{ borderColor: 'var(--or200)', background: 'var(--or50)', color: 'var(--br600)', resize: 'none' }}
                onFocus={e => e.target.select()}
              />
              <button
                className="clay-btn w-full py-2.5 font-bold text-white text-sm"
                style={{ background: copied ? 'var(--gr500)' : 'var(--or500)' }}
                onClick={handleCopy}
              >
                {copied ? 'コピーしました！' : 'コードをコピー'}
              </button>
            </div>
          )}

          <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--or100)' }}>
            <label htmlFor="restore-code" className="block text-xs font-bold" style={{ color: 'var(--br400)' }}>
              コードから復元
            </label>
            <textarea
              id="restore-code"
              value={restoreCode}
              onChange={e => { setRestoreCode(e.target.value); setRestoreMessage(null); }}
              rows={3}
              placeholder="バックアップコードを貼り付け"
              className="w-full rounded-xl px-3 py-2 text-xs outline-none border-2 break-all"
              style={{ borderColor: 'var(--or200)', background: 'var(--or50)', color: 'var(--br600)', resize: 'none' }}
            />
            {restoreMessage && (
              <p className="text-xs font-bold" style={{ color: '#E85A4A' }}>{restoreMessage}</p>
            )}
            <button
              className="clay-btn w-full py-2.5 font-bold text-white text-sm"
              style={{ background: restoreCode.trim() ? 'var(--br400)' : '#D4C4A8' }}
              onClick={handleRestore}
              disabled={!restoreCode.trim()}
            >
              復元する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

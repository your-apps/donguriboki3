import { useEffect, useState } from 'react';

const DISMISS_KEY = 'donguriboki_install_dismissed_v1';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // 'android' | 'ios' | null（インストール済み・案内を閉じた後は null のまま）
  const [mode, setMode] = useState(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return null;
    return isIOS() ? 'ios' : null;
  });
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) || isIOS()) return;

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMode('android');
    };
    const onAppInstalled = () => setMode(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!mode) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMode(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setMode(null);
  }

  return (
    <div className="clay-card p-4 relative">
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: 'var(--or100)', border: 'none' }}
        onClick={handleDismiss}
        aria-label="この案内を閉じる"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="flex items-center gap-3">
        {/* どんぐりアプリアイコン */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FDF0E3', border: '1.5px solid var(--or200)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="8.5" rx="7" ry="3.2" fill="#8B5E2E"/>
            <rect x="5" y="8" width="14" height="2.5" rx="1.2" fill="#A0722A"/>
            <line x1="12" y1="5.5" x2="12" y2="8" stroke="#6B4423" strokeWidth="1.2" strokeLinecap="round"/>
            <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="#D4721E"/>
            <ellipse cx="10" cy="13" rx="1.8" ry="1.2" fill="#F0A050" opacity=".5"/>
          </svg>
        </div>
        <div className="flex-1 pr-5">
          <div className="text-sm font-bold" style={{ color: 'var(--br600)' }}>
            アプリとして使えるよ！
          </div>
          <div className="text-xs" style={{ color: 'var(--br400)' }}>
            ホーム画面に追加すると、すぐ開けて進捗も消えにくくなるよ
          </div>
        </div>
      </div>

      {mode === 'android' && (
        <button
          className="clay-btn w-full py-2.5 mt-3 font-bold text-white text-sm"
          style={{ background: 'var(--or500)' }}
          onClick={handleInstall}
        >
          アプリをインストール
        </button>
      )}

      {mode === 'ios' && (
        <div className="mt-3">
          {!showIOSSteps ? (
            <button
              className="clay-btn w-full py-2.5 font-bold text-white text-sm"
              style={{ background: 'var(--or500)' }}
              onClick={() => setShowIOSSteps(true)}
            >
              追加方法を見る
            </button>
          ) : (
            <ol className="space-y-2 text-xs rounded-xl p-3" style={{ background: 'var(--or50)', color: 'var(--br600)' }}>
              <li className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'var(--or500)' }}>1.</span>
                <span>Safari 下部の共有ボタン</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>をタップ</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'var(--or500)' }}>2.</span>
                <span>「ホーム画面に追加</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <span>」を選ぶ</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'var(--or500)' }}>3.</span>
                <span>右上の「追加」をタップして完了！</span>
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

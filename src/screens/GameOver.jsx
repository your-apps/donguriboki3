import tsumujiiImg from '../assets/tsumujii.webp';
import { getUser, spendAcorns } from '../services/storage';

export default function GameOver({ sessionData, onRevive, onHome }) {
  const user = getUser();
  const canRevive = !sessionData.revived && (user?.acorns_total ?? 0) >= 10;

  function handleRevive() {
    if (spendAcorns(10)) {
      onRevive();
    }
  }

  return (
    <div className="app-container flex flex-col items-center justify-center px-6 gap-6">
      <img
        src={tsumujiiImg}
        alt="ツム爺"
        className="object-contain animate-bounce-in"
        style={{ width: 173, height: 173, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
      />

      <div className="clay-card p-6 text-center w-full">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--br600)' }}>
          力尽きてしまったのう…
        </h2>
        <p className="text-sm" style={{ color: 'var(--br400)' }}>
          焦らずともよい。休んでまた来るのじゃ。
        </p>
        <p className="text-sm mt-2 font-bold" style={{ color: 'var(--or500)' }}>
          がんばった分じゃ。どんぐりを1個あげよう。
        </p>
      </div>

      {canRevive && (
        <div className="clay-card p-4 w-full text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--br600)' }}>
            どんぐり10個を使って復活できるぞ
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--br400)' }}>
            所持どんぐり：{user?.acorns_total}個
          </p>
          <button
            className="clay-btn w-full py-3 font-bold text-white"
            style={{ background: 'var(--or500)' }}
            onClick={handleRevive}
          >
            どんぐり10個で復活！
          </button>
        </div>
      )}

      <button
        className="clay-btn w-full py-4 font-bold"
        style={{
          background: 'white',
          color: 'var(--br400)',
          border: '3px solid var(--or200)',
          boxShadow: '0 4px 0 var(--or100)',
        }}
        onClick={onHome}
      >
        ホームに戻る
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import { addAcorns, updateProgress, updateStreak, calcAcorns } from '../services/storage';

export default function Result({ stageId, setId, correct, total, onHome }) {
  const [acornsEarned, setAcornsEarned] = useState(0);
  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    const earned = calcAcorns(stageId, correct, total);
    const acc = Math.round((correct / total) * 100);
    // 必要正解数に到達した時点でこの画面に来るため、到達＝クリア
    addAcorns(earned);
    updateProgress(stageId, setId, true, acc);
    updateStreak();
    setAcornsEarned(earned);
  }, [stageId, setId, correct, total]);

  const acc = Math.round((correct / total) * 100);
  const misses = total - correct;
  const comment = getTsumujiiComment(misses);

  return (
    <div className="app-container flex flex-col items-center justify-center px-6 gap-6">
      {/* スコアカード */}
      <div className="clay-card p-6 w-full text-center space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--br600)' }}>
          セッション結果
        </h2>

        {/* 正答率リング */}
        <div className="flex items-center justify-center">
          <AccuracyRing pct={acc} />
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--br600)' }}>{total}</div>
            <div style={{ color: 'var(--br400)' }}>回答</div>
          </div>
          <div className="w-px" style={{ background: 'var(--or100)' }}/>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--gr500)' }}>{correct}</div>
            <div style={{ color: 'var(--br400)' }}>正解</div>
          </div>
          <div className="w-px" style={{ background: 'var(--or100)' }}/>
          <div>
            <div className="font-bold text-lg" style={{ color: misses > 0 ? '#E85A4A' : 'var(--br600)' }}>{misses}</div>
            <div style={{ color: 'var(--br400)' }}>ミス</div>
          </div>
        </div>

        {/* どんぐり獲得 */}
        <div
          className="flex items-center justify-center gap-2 py-3 rounded-2xl"
          style={{ background: 'var(--or50)' }}
        >
          <AcornIcon size={24} />
          <span className="font-bold text-lg" style={{ color: 'var(--or500)' }}>
            +{acornsEarned}個 獲得！
          </span>
        </div>
      </div>

      {/* ツム爺コメント＋分析（統合） */}
      <div className="clay-card p-5 w-full">
        <div className="flex items-center gap-3">
          <img src={tsumujiiImg} alt="ツム爺" className="object-contain flex-shrink-0 animate-bounce-in" style={{ width: 87, height: 87 }} />
          <div
            className="bubble bubble-tail-left flex-1 text-sm leading-relaxed"
            style={{ color: 'var(--br600)' }}
          >
            <p>{comment}</p>
          </div>
        </div>
      </div>

      <button
        className="clay-btn w-full py-4 text-base font-bold text-white"
        style={{ background: 'var(--or500)' }}
        onClick={onHome}
      >
        ホームに戻る
      </button>
    </div>
  );
}

// クリア時のミス数に応じたコメント
function getTsumujiiComment(misses) {
  if (misses <= 0) return 'ひとつもつまずかず、見事なものじゃ。その調子で続けるのじゃ。';
  if (misses === 1) return 'よくやったのう。ひとつの間違いも、次への学びじゃ。確かな力がついておるぞ。';
  return 'ぎりぎりまでよう粘ったのう。間違えた問題こそ、お主を強くするのじゃ。';
}

function AccuracyRing({ pct }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={100} height={100}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--or100)" strokeWidth={10}/>
        <circle
          cx={50} cy={50} r={r}
          fill="none"
          stroke={pct >= 80 ? 'var(--gr300)' : pct >= 60 ? 'var(--or300)' : '#E85A4A'}
          strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold text-xl" style={{ color: 'var(--br600)' }}>{pct}%</div>
        <div className="text-xs" style={{ color: 'var(--br400)' }}>正答率</div>
      </div>
    </div>
  );
}

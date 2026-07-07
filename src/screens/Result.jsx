import { useEffect, useRef, useState } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import { addAcorns, updateProgress, updateStreak, calcAcorns, getUser } from '../services/storage';
import { getWeakAnalysisComment, calcStageAccuracy } from '../services/analysis';

export default function Result({ stageId, setId, correct, total, onHome }) {
  const [acornsEarned, setAcornsEarned] = useState(0);
  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    const earned = calcAcorns(stageId, correct, total);
    const acc = Math.round((correct / total) * 100);
    const cleared = acc >= 60;
    addAcorns(earned);
    updateProgress(stageId, setId, cleared, acc);
    updateStreak();
    setAcornsEarned(earned);
  }, [stageId, setId, correct, total]);

  const acc = Math.round((correct / total) * 100);
  const comment = getTsumujiiComment(acc);

  // 苦手分析コメント（保存後のユーザーデータを参照）
  const user = getUser();
  const stageAccuracy = calcStageAccuracy(user?.progress);
  const analysisComment = getWeakAnalysisComment(stageAccuracy, user?.weak_questions ?? []);

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
            <div className="font-bold text-lg" style={{ color: 'var(--br600)' }}>{correct}</div>
            <div style={{ color: 'var(--br400)' }}>正解</div>
          </div>
          <div className="w-px" style={{ background: 'var(--or100)' }}/>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--br600)' }}>{total - correct}</div>
            <div style={{ color: 'var(--br400)' }}>不正解</div>
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
            {analysisComment && (
              <p className="mt-2 pt-2" style={{ borderTop: '1px solid var(--or100)' }}>
                {analysisComment}
              </p>
            )}
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

function getTsumujiiComment(acc) {
  if (acc === 100) return 'すべて正しく答えたのう。よう頑張ったのう。次も、その気持ちで続けるのじゃ。';
  if (acc >= 70)   return 'よくやったのう。惜しいところもあったが、それでよい。確かな力がついておるぞ。';
  if (acc >= 60)   return '通ったのう。まだ迷いがあるようじゃが、それが今のお主の姿じゃ。大切にするのじゃ。';
  return '焦らずともよい。どんぐりも、一粒一粒積み上げるものじゃ。また来るのじゃ。';
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

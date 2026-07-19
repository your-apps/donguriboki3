import { useState } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import Calculator from '../components/Calculator';
import StatementSection from '../components/StatementSection';
import { stageMap } from '../data/questions/index';
import { blankKeysOf, isKeyCorrect } from '../services/statement';
import { addAcorns, updateProgress, updateStreak, isSetCleared } from '../services/storage';

// 大問のスコア（%）に応じたどんぐり報酬（small: 第2問形式の小さめ配点）
function calcStatementAcorns(score, small) {
  if (small) {
    if (score >= 100) return 20;
    if (score >= 90) return 15;
    if (score >= 80) return 12;
    if (score >= 70) return 8;
    return 1;
  }
  if (score >= 100) return 30;
  if (score >= 90) return 22;
  if (score >= 80) return 16;
  if (score >= 70) return 10;
  return 1; // 不合格でも参加賞
}

function getTsumujiiComment(score) {
  if (score >= 100) return '完璧じゃ。本試験もこの調子で解けるぞ。';
  if (score >= 70) return '合格ラインを越えたのう。間違えた欄の解説をよく読み、満点を狙うのじゃ。';
  return 'まだ仕上がっておらんのう。解説を読んで、もう一度挑むのじゃ。繰り返しが力になるぞ。';
}

export default function StatementLesson({ stageId, setId, onHome }) {
  const stage = stageMap[stageId];
  const set = stage?.sets.find(s => s.id === setId);
  const st = set?.statement;

  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [celebrations, setCelebrations] = useState([]);
  const [showExitDialog, setShowExitDialog] = useState(false);

  if (!st) return null;

  const blankKeys = blankKeysOf(st);
  const filledCount = blankKeys.filter(k => (answers[k] ?? '').length > 0).length;

  function handleGrade() {
    const correct = blankKeys.filter(k => isKeyCorrect(st, answers, k)).length;
    const pct = Math.round((correct / blankKeys.length) * 100);
    // 再クリア時は少額（70点以上3／未満1）
    const acorns = isSetCleared(stageId, setId)
      ? (pct >= 70 ? 3 : 1)
      : calcStatementAcorns(pct, !!st.small);
    setScore(pct);
    setEarned(acorns);
    setGraded(true);
    const reward = addAcorns(acorns);
    updateProgress(stageId, setId, pct >= 70, pct);
    const streakInfo = updateStreak();
    setCelebrations([
      ...(reward.bonus ? [`🎉 今日の目標達成！ボーナス +${reward.bonus}個`] : []),
      ...(reward.titleUp ? [`👑 称号が「${reward.titleUp}」に上がった！`] : []),
      ...(streakInfo.milestone ? [`🔥 連続学習 ${streakInfo.streak}日達成！`] : []),
    ]);
    window.scrollTo(0, 0);
  }

  function handleRetry() {
    setAnswers({});
    setGraded(false);
    setScore(0);
    setCelebrations([]);
  }

  return (
    <div className="app-container flex flex-col">
      <Calculator />

      {/* 中断確認 */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(74,46,14,0.45)' }}>
          <div className="w-full rounded-3xl p-6 space-y-4" style={{ background: 'white', maxWidth: 360 }}>
            <p className="text-base font-bold text-center" style={{ color: 'var(--br600)' }}>問題を中断しますか？</p>
            <p className="text-sm text-center" style={{ color: 'var(--br400)' }}>入力した内容は保存されないのじゃ</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'var(--or50)', color: 'var(--br400)', border: '2px solid var(--or200)' }}
                onClick={() => setShowExitDialog(false)}
              >
                続ける
              </button>
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: '#E85A4A' }}
                onClick={() => { setShowExitDialog(false); onHome?.(); }}
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-shrink-0">
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--or50)', border: '2px solid var(--or200)' }}
          onClick={() => graded ? onHome?.() : setShowExitDialog(true)}
          aria-label="ホームへ戻る"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--br400)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span className="text-sm font-bold flex-1" style={{ color: 'var(--br600)' }}>{set.title}</span>
        {!graded && (
          <span className="text-xs" style={{ color: 'var(--br400)' }}>
            記入 {filledCount} / {blankKeys.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* 採点結果 */}
        {graded && (
          <div className="clay-card p-4 space-y-3 animate-fade-up">
            <div className="text-center">
              <span className="text-3xl font-bold" style={{ color: score >= 70 ? 'var(--gr500)' : '#E85A4A' }}>
                {score}点
              </span>
              <span className="text-sm ml-2 font-bold" style={{ color: score >= 70 ? 'var(--gr500)' : '#E85A4A' }}>
                {score >= 70 ? 'クリア！' : 'あと少し'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 rounded-2xl" style={{ background: 'var(--or50)' }}>
              <AcornIcon size={20} />
              <span className="font-bold" style={{ color: 'var(--or500)' }}>+{earned}個 獲得！</span>
            </div>
            {celebrations.map((c, i) => (
              <div key={i} className="py-2 px-3 rounded-xl text-sm font-bold animate-bounce-in"
                style={{ background: '#F0FBF0', color: 'var(--gr500)', border: '1.5px solid var(--gr300)' }}>
                {c}
              </div>
            ))}
            <div className="flex items-center gap-3">
              <img src={tsumujiiImg} alt="ツム爺" className="object-contain flex-shrink-0" style={{ width: 67, height: 67 }} />
              <div className="bubble bubble-tail-left flex-1 text-sm" style={{ color: 'var(--br600)' }}>
                {getTsumujiiComment(score)}
              </div>
            </div>
          </div>
        )}

        {/* 資料と解答欄（共通コンポーネント） */}
        <StatementSection st={st} answers={answers} onAnswers={setAnswers} graded={graded} />
      </div>

      {/* フッターボタン */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0">
        {!graded ? (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'var(--or500)' }}
            disabled={filledCount < blankKeys.length}
            onClick={handleGrade}
          >
            {filledCount < blankKeys.length ? `残り${blankKeys.length - filledCount}か所を記入` : '採点する'}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              className="clay-btn flex-1 py-4 font-bold"
              style={{ background: 'white', color: 'var(--br400)', border: '3px solid var(--or200)', boxShadow: '0 4px 0 var(--or100)' }}
              onClick={handleRetry}
            >
              もう一度
            </button>
            <button
              className="clay-btn flex-1 py-4 font-bold text-white"
              style={{ background: 'var(--or500)' }}
              onClick={onHome}
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

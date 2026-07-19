import { useState, useEffect, useRef } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import JournalBuilder from '../components/JournalBuilder';
import Calculator from '../components/Calculator';
import StatementSection from '../components/StatementSection';
import { stageMap } from '../data/questions/index';
import { emptyEntry, gradeJournalEntry } from '../services/journal';
import { blankKeysOf, scoreStatement } from '../services/statement';
import { addAcorns, updateProgress, updateStreak, isSetCleared } from '../services/storage';

const EXAM_SECONDS = 60 * 60;

export default function ExamLesson({ stageId, setId, onHome }) {
  const stage = stageMap[stageId];
  const set = stage?.sets.find(s => s.id === setId);
  const exam = set?.exam;

  const [phase, setPhase] = useState('intro'); // intro | exam | result
  const [section, setSection] = useState('q1'); // q1 | q2 | q3
  const [q1Idx, setQ1Idx] = useState(0);
  const [q1Entries, setQ1Entries] = useState(() => exam.q1.map(() => emptyEntry()));
  const [q2Answers, setQ2Answers] = useState({});
  const [q3Answers, setQ3Answers] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [scores, setScores] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const gradedRef = useRef(false);
  const startTimeRef = useRef(null);
  const [celebrations, setCelebrations] = useState([]);

  // 60分タイマー（実時刻基準：アプリをバックグラウンドにしても正しく経過する）
  useEffect(() => {
    if (phase !== 'exam') return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeLeft(Math.max(0, EXAM_SECONDS - elapsed));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // 時間切れで自動提出
  useEffect(() => {
    if (phase === 'exam' && timeLeft === 0) handleGrade();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  if (!exam) return null;

  function handleGrade() {
    if (gradedRef.current) return;
    gradedRef.current = true;
    const q1Correct = exam.q1.map((q, i) => gradeJournalEntry(q1Entries[i], q.answer));
    const s1 = q1Correct.filter(Boolean).length * 3;
    const r2 = scoreStatement(exam.q2, q2Answers);
    const s2 = Math.round(20 * r2.correct / r2.total);
    const r3 = scoreStatement(exam.q3, q3Answers);
    const s3 = Math.round(35 * r3.correct / r3.total);
    const total = s1 + s2 + s3;
    const passed = total >= 70;
    // 再挑戦時は少額（合格10／不合格1）
    const acorns = isSetCleared(stageId, setId)
      ? (passed ? 10 : 1)
      : (passed ? 50 : 5);
    setScores({ s1, s2, s3, total, passed, acorns, q1Correct });
    const reward = addAcorns(acorns);
    updateProgress(stageId, setId, passed, total);
    const streakInfo = updateStreak();
    setCelebrations([
      ...(reward.bonus ? [`🎉 今日の目標達成！ボーナス +${reward.bonus}個`] : []),
      ...(reward.titleUp ? [`👑 称号が「${reward.titleUp}」に上がった！`] : []),
      ...(streakInfo.milestone ? [`🔥 連続学習 ${streakInfo.streak}日達成！`] : []),
    ]);
    setPhase('result');
    setShowSubmitDialog(false);
    window.scrollTo(0, 0);
  }

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

  const filledQ1 = q1Entries.filter(e =>
    e.debit.some(r => r.account && Number(r.amount) > 0) && e.credit.some(r => r.account && Number(r.amount) > 0)
  ).length;
  const filledQ2 = blankKeysOf(exam.q2).filter(k => (q2Answers[k] ?? '').length > 0).length;
  const filledQ3 = blankKeysOf(exam.q3).filter(k => (q3Answers[k] ?? '').length > 0).length;

  // ===== 開始前 =====
  if (phase === 'intro') {
    return (
      <div className="app-container flex flex-col items-center justify-center px-6 gap-5">
        <img src={tsumujiiImg} alt="ツム爺" className="object-contain" style={{ width: 120, height: 120 }} />
        <div className="clay-card p-5 w-full space-y-3">
          <h2 className="text-lg font-bold text-center" style={{ color: 'var(--br600)' }}>{set.title}</h2>
          <ul className="text-sm space-y-1.5" style={{ color: 'var(--br600)' }}>
            <li>・制限時間：<b>60分</b>（本試験と同じ）</li>
            <li>・第1問 仕訳15問（45点）</li>
            <li>・第2問（20点）／第3問（35点）</li>
            <li>・<b>70点以上で合格</b></li>
            <li>・途中の答え合わせはなし。最後に「提出」で採点</li>
            <li>・右下の電卓ボタンが使えるぞ</li>
          </ul>
          <p className="text-xs" style={{ color: 'var(--br400)' }}>本番のつもりで、落ち着いて挑むのじゃ。</p>
        </div>
        <button
          className="clay-btn w-full py-4 text-base font-bold text-white"
          style={{ background: 'var(--or500)' }}
          onClick={() => setPhase('exam')}
        >
          試験をはじめる
        </button>
        <button
          className="clay-btn w-full py-3 font-bold"
          style={{ background: 'white', color: 'var(--br400)', border: '3px solid var(--or200)', boxShadow: '0 4px 0 var(--or100)' }}
          onClick={onHome}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === 'result' && scores) {
    return (
      <div className="app-container flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          <div className="clay-card p-5 space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: scores.passed ? 'var(--gr500)' : '#E85A4A' }}>
                {scores.total}点
              </div>
              <div className="text-lg font-bold mt-1" style={{ color: scores.passed ? 'var(--gr500)' : '#E85A4A' }}>
                {scores.passed ? '合格！' : '不合格…'}
              </div>
            </div>
            <table className="w-full text-sm" style={{ color: 'var(--br600)' }}>
              <tbody>
                <tr style={{ borderTop: '1px solid var(--or100)' }}><td className="py-1.5">第1問（仕訳）</td><td className="text-right tabular-nums">{scores.s1} / 45</td></tr>
                <tr style={{ borderTop: '1px solid var(--or100)' }}><td className="py-1.5">第2問</td><td className="text-right tabular-nums">{scores.s2} / 20</td></tr>
                <tr style={{ borderTop: '1px solid var(--or100)' }}><td className="py-1.5">第3問</td><td className="text-right tabular-nums">{scores.s3} / 35</td></tr>
                <tr style={{ borderTop: '1px solid var(--or100)', fontWeight: 700 }}><td className="py-1.5">合計</td><td className="text-right tabular-nums">{scores.total} / 100</td></tr>
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-2 py-2 rounded-2xl" style={{ background: 'var(--or50)' }}>
              <AcornIcon size={20} />
              <span className="font-bold" style={{ color: 'var(--or500)' }}>+{scores.acorns}個 獲得！</span>
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
                {scores.passed
                  ? '見事じゃ。本試験でも同じ力を出せれば合格できるぞ。間違えた問題の復習も忘れずにのう。'
                  : 'あと一歩じゃ。間違えた問題の解説を読み、弱いところを固めてから再挑戦するのじゃ。'}
              </div>
            </div>
          </div>

          {/* 第1問 復習 */}
          <h3 className="text-sm font-bold px-1" style={{ color: 'var(--br600)' }}>第1問の復習</h3>
          {exam.q1.map((q, i) => (
            <div key={q.id} className="clay-card p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: scores.q1Correct[i] ? 'var(--gr500)' : '#E85A4A' }}
                >
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--br600)' }}>{q.scenario}</p>
              </div>
              <JournalBuilder question={q} entry={q1Entries[i]} onChange={() => {}} answered={true} />
              {!scores.q1Correct[i] && (
                <p className="text-xs leading-relaxed rounded-xl p-2.5" style={{ background: 'var(--br50)', color: 'var(--br600)' }}>{q.explanation}</p>
              )}
            </div>
          ))}

          {/* 第2問・第3問 復習 */}
          <h3 className="text-sm font-bold px-1" style={{ color: 'var(--br600)' }}>第2問の復習</h3>
          <StatementSection st={exam.q2} answers={q2Answers} onAnswers={() => {}} graded={true} />
          <h3 className="text-sm font-bold px-1" style={{ color: 'var(--br600)' }}>第3問の復習</h3>
          <StatementSection st={exam.q3} answers={q3Answers} onAnswers={() => {}} graded={true} />
        </div>

        <div className="px-4 pb-6 pt-2 flex-shrink-0">
          <button className="clay-btn w-full py-4 font-bold text-white" style={{ background: 'var(--or500)' }} onClick={onHome}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // ===== 試験中 =====
  const q = exam.q1[q1Idx];
  return (
    <div className="app-container flex flex-col">
      <Calculator />

      {/* 提出確認 */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(74,46,14,0.45)' }}>
          <div className="w-full rounded-3xl p-6 space-y-4" style={{ background: 'white', maxWidth: 360 }}>
            <p className="text-base font-bold text-center" style={{ color: 'var(--br600)' }}>答案を提出しますか？</p>
            <p className="text-sm text-center" style={{ color: 'var(--br400)' }}>
              第1問 {filledQ1}/15問・第2問 {filledQ2}/{blankKeysOf(exam.q2).length}・第3問 {filledQ3}/{blankKeysOf(exam.q3).length} 記入済み
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'var(--or50)', color: 'var(--br400)', border: '2px solid var(--or200)' }}
                onClick={() => setShowSubmitDialog(false)}
              >
                もどる
              </button>
              <button className="flex-1 py-3 rounded-2xl font-bold text-sm text-white" style={{ background: 'var(--gr500)' }} onClick={handleGrade}>
                提出する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 中断確認 */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(74,46,14,0.45)' }}>
          <div className="w-full rounded-3xl p-6 space-y-4" style={{ background: 'white', maxWidth: 360 }}>
            <p className="text-base font-bold text-center" style={{ color: 'var(--br600)' }}>試験を中断しますか？</p>
            <p className="text-sm text-center" style={{ color: 'var(--br400)' }}>答案は保存されないのじゃ</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'var(--or50)', color: 'var(--br400)', border: '2px solid var(--or200)' }}
                onClick={() => setShowExitDialog(false)}
              >
                続ける
              </button>
              <button className="flex-1 py-3 rounded-2xl font-bold text-sm text-white" style={{ background: '#E85A4A' }} onClick={() => { setShowExitDialog(false); onHome?.(); }}>
                やめる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー：タイマー＋大問タブ */}
      <div className="px-4 pt-4 pb-2 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--or50)', border: '2px solid var(--or200)' }}
            onClick={() => setShowExitDialog(true)}
            aria-label="中断"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--br400)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <span
            className="text-lg font-bold tabular-nums px-3 py-1 rounded-xl"
            style={{
              color: timeLeft <= 300 ? '#E85A4A' : 'var(--br600)',
              background: timeLeft <= 300 ? '#FFF0EE' : 'var(--or50)',
            }}
            aria-label="残り時間"
          >
            ⏱ {mmss}
          </span>
          <button
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'var(--gr500)', border: 'none' }}
            onClick={() => setShowSubmitDialog(true)}
          >
            提出
          </button>
        </div>
        <div className="flex gap-1.5">
          {[['q1', `第1問 ${filledQ1}/15`], ['q2', `第2問 ${filledQ2}/${blankKeysOf(exam.q2).length}`], ['q3', `第3問 ${filledQ3}/${blankKeysOf(exam.q3).length}`]].map(([key, label]) => (
            <button
              key={key}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{
                background: section === key ? 'var(--or500)' : 'var(--or50)',
                color: section === key ? 'white' : 'var(--br400)',
                border: section === key ? 'none' : '1.5px solid var(--or200)',
              }}
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {section === 'q1' && (
          <>
            <div className="flex items-center justify-between">
              <button
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'var(--or50)', color: q1Idx > 0 ? 'var(--or500)' : '#D4C4A8', border: '1.5px solid var(--or200)' }}
                disabled={q1Idx === 0}
                onClick={() => setQ1Idx(i => i - 1)}
              >
                ← 前の問題
              </button>
              <span className="text-xs font-bold" style={{ color: 'var(--br600)' }}>仕訳 {q1Idx + 1} / 15</span>
              <button
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'var(--or50)', color: q1Idx < 14 ? 'var(--or500)' : '#D4C4A8', border: '1.5px solid var(--or200)' }}
                disabled={q1Idx === 14}
                onClick={() => setQ1Idx(i => i + 1)}
              >
                次の問題 →
              </button>
            </div>
            <div className="clay-card p-4">
              <p className="text-sm font-bold leading-relaxed" style={{ color: 'var(--br600)' }}>{q.scenario}</p>
            </div>
            <JournalBuilder
              key={q.id}
              question={q}
              entry={q1Entries[q1Idx]}
              onChange={entry => setQ1Entries(prev => prev.map((e, i) => i === q1Idx ? entry : e))}
              answered={false}
            />
          </>
        )}
        {section === 'q2' && (
          <StatementSection st={exam.q2} answers={q2Answers} onAnswers={setQ2Answers} graded={false} />
        )}
        {section === 'q3' && (
          <StatementSection st={exam.q3} answers={q3Answers} onAnswers={setQ3Answers} graded={false} />
        )}
      </div>
    </div>
  );
}

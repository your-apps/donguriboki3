import { useState, useEffect, useRef, useCallback } from 'react';
import HeartIcon from '../components/HeartIcon';
import ProgressBar from '../components/ProgressBar';
import CharaBubble from '../components/CharaBubble';
import { stageMap, findQuestion } from '../data/questions/index';
import { recordWrong, recordCorrect, getDueReviewIds, unlockGlossaryCategory, getUser } from '../services/storage';

// クルの励ましコメント（ランダム選択）
const KURU_COMMENTS = [
  'さあ、始めよう！クルも応援してるよ！',
  'よし、いくよ！全力で頑張ろう！',
  'ドキドキするね！一緒に頑張ろう！',
  '深呼吸して、落ち着いていこう！',
  '今日も頑張れ！クルが見てるよ！',
  'じっくり考えてね！応援してるよ！',
  'クルも一緒に頑張るよ！',
  '大丈夫、できるよ！',
  'その調子！諦めないで！',
  'ファイト！クルを信じて！',
  'ゆっくり、確実に！',
  'いい感じだよ！続けて！',
  '焦らなくていいよ！',
];
function getKuruComment() {
  return KURU_COMMENTS[Math.floor(Math.random() * KURU_COMMENTS.length)];
}

// ランダムシャッフル
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 選択肢をシャッフルして正解インデックスを更新
function prepareQuestion(q) {
  const n = q.choices.length;
  const perm = shuffleArray([...Array(n).keys()]);
  const newChoices = perm.map(i => q.choices[i]);
  const newAnswer = perm.indexOf(q.answer);
  const newExplanations = {};
  if (q.explanations) {
    Object.entries(q.explanations).forEach(([key, val]) => {
      const oldIdx = parseInt(key.replace('wrong_', ''), 10);
      const newIdx = perm.indexOf(oldIdx);
      if (newIdx >= 0) newExplanations[`wrong_${newIdx}`] = val;
    });
  }
  return { ...q, choices: newChoices, answer: newAnswer, explanations: newExplanations };
}

export default function Lesson({ stageId, setId, revived, revivedFromIdx, revivedResults, revivedQuestions, onFinish, onGameOver, onHome }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [results, setResults] = useState([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [kuruComment, setKuruComment] = useState(() => getKuruComment());
  const timerRef = useRef(null);
  const gameOverFiredRef = useRef(false);
  const showHintSetting = getUser()?.show_hint ?? true;

  // 苦手専用セッション or 通常セッション
  useEffect(() => {
    // 復活時：問題順・進捗をそのまま引き継ぐ
    if (revived && revivedQuestions?.length > 0) {
      setQuestions(revivedQuestions);
      setCurrent(revivedFromIdx ?? 0);
      setResults(revivedResults ?? []);
      gameOverFiredRef.current = false;
      return;
    }

    if (stageId === 'weak') {
      // 苦手問題セッション：weak_questions から最大10問
      const user = JSON.parse(localStorage.getItem('donguriboki_v1') || '{}');
      const uid = user.active_user;
      const weakIds = user.users?.[uid]?.weak_questions ?? [];
      const picked = weakIds.slice(0, 10);
      const qs = picked.map(id => findQuestion(id)?.question).filter(Boolean);
      setQuestions(shuffleArray(qs).map(prepareQuestion));
      return;
    }

    const stage = stageMap[stageId];
    const set = stage?.sets.find(s => s.id === setId);
    if (!set) return;

    // 今日復習すべき問題をこのセットに絞って先頭に追加
    const setQIds = set.questions.map(q => q.id);
    const reviewIds = getDueReviewIds(setQIds);
    const reviewQs = reviewIds.map(id => findQuestion(id)?.question).filter(Boolean);

    // 重複排除してランダム出題（復習問題も含めてシャッフル）
    const reviewIdSet = new Set(reviewIds);
    const normalQs = set.questions.filter(q => !reviewIdSet.has(q.id));
    setQuestions(shuffleArray([...reviewQs, ...normalQs]).map(prepareQuestion));

    // 時間制限
    if (set.timeLimit) setTimeLeft(set.timeLimit);
  }, [stageId, setId]);

  const q = questions[current];
  const hasTimeLimit = false; // 制限時間なし

  // タイマー
  useEffect(() => {
    if (!hasTimeLimit || !q || answered) return;
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // 時間切れ = 不正解扱い
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, q, answered]);

  function handleTimeUp() {
    if (answered) return;
    setAnswered(true);
    const newHearts = hearts - 1;
    setHearts(newHearts);
    setShakeKey(k => k + 1);
    recordWrong(q.id);
    const newResults = [...results, { id: q.id, correct: false, selected: -1 }];
    setResults(newResults);
    if (newHearts <= 0 && !gameOverFiredRef.current) {
      gameOverFiredRef.current = true;
      setTimeout(() => onGameOver({ stageId, setId, questions, results: newResults, hearts: 0, revived, currentIdx: current }), 3000);
    }
  }

  const handleSelect = useCallback((idx) => {
    if (answered) return;
    setSelected(idx);
  }, [answered]);

  const handleCheck = useCallback(() => {
    if (selected === null || answered) return;
    clearInterval(timerRef.current);

    const correct = selected === q.answer;
    setAnswered(true);

    if (correct) {
      recordCorrect(q.id);
    } else {
      recordWrong(q.id);
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setShakeKey(k => k + 1);

      if (newHearts <= 0 && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        const newRes = [...results, { id: q.id, correct: false, selected }];
        setTimeout(() => onGameOver({ stageId, setId, questions, results: newRes, hearts: 0, revived, currentIdx: current }), 3000);
        setResults(newRes);
        return;
      }
    }
    setResults(prev => [...prev, { id: q.id, correct, selected }]);
  }, [selected, answered, q, hearts, stageId, setId, questions, results, revived, current, onGameOver]);

  const handleNext = useCallback(() => {
    const nextIdx = current + 1;
    if (nextIdx >= questions.length) {
      const finalResults = [...results];
      const correct = finalResults.filter(r => r.correct).length;
      // ステージクリア時に用語集カテゴリを解放
      if (stageId !== 'weak') unlockGlossaryCategory(stageId);
      onFinish({ stageId, setId, results: finalResults, correct, total: questions.length });
      return;
    }
    setKuruComment(getKuruComment());
    setCurrent(nextIdx);
    setSelected(null);
    setAnswered(false);
  }, [current, questions.length, results, stageId, setId, onFinish]);

  if (!q || questions.length === 0) return (
    <div className="app-container flex items-center justify-center">
      <p style={{ color: 'var(--br400)' }}>問題を読み込み中…</p>
    </div>
  );

  const isCorrect = answered && selected === q.answer;
  const isWrong = answered && (selected !== q.answer);
  const isJournal = q.type === 'journal';

  return (
    <div className="app-container flex flex-col">
      {/* 中断確認ダイアログ */}
      {showExitDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(74,46,14,0.45)' }}
        >
          <div
            className="w-full rounded-3xl p-6 space-y-4"
            style={{ background: 'white', maxWidth: 360, boxShadow: '0 8px 32px rgba(74,46,14,0.2)' }}
          >
            <p className="text-base font-bold text-center" style={{ color: 'var(--br600)' }}>
              セッションを中断しますか？
            </p>
            <p className="text-sm text-center" style={{ color: 'var(--br400)' }}>
              ここまでの進捗は保存されないのじゃ
            </p>
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

      {/* トップバー */}
      <div className="px-4 pt-4 pb-2 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--or50)', border: '2px solid var(--or200)' }}
              onClick={() => setShowExitDialog(true)}
              aria-label="ホームへ戻る"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--br400)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--br400)' }}>
              {current + 1} / {questions.length}問
              {q.id.startsWith('s') && results.findIndex((_, i) => i === current) < 0 &&
                getDueReviewIds().includes(q.id) && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#FFF0EE', color: '#E85A4A' }}>
                    復習
                  </span>
                )
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasTimeLimit && timeLeft !== null && (
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: timeLeft <= 10 ? '#E85A4A' : 'var(--br400)' }}
              >
                {timeLeft}秒
              </span>
            )}
            <div className="flex gap-1" aria-label={`残りハート ${hearts}個`}>
              {[0, 1, 2].map(i => <HeartIcon key={i} empty={i >= hearts} size={22} />)}
            </div>
          </div>
        </div>
        <ProgressBar current={current} total={questions.length} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* キャラクター */}
        {questions.length > 0 && (
          <CharaBubble key={`bubble-${current}`} chara="kuru" text={kuruComment} side="left" className="animate-fade-up" />
        )}

        {/* 問題文 */}
        <div key={`q-${current}`} className="clay-card p-4 animate-fade-up">
          <p className="text-sm font-bold leading-relaxed whitespace-pre-line" style={{ color: 'var(--br600)' }}>
            {q.scenario}
          </p>
        </div>

        {/* 選択肢 */}
        <div className={`space-y-2`} key={`choices-${current}`}>
          {q.choices.map((choice, idx) => {
            let bg = 'white';
            let border = 'var(--or200)';
            let textColor = 'var(--br600)';
            let shadow = '0 4px 0 rgba(0,0,0,0.09)';

            if (answered) {
              if (idx === q.answer) {
                bg = '#F0FBF0'; border = 'var(--gr300)'; textColor = 'var(--gr500)';
                shadow = '0 4px 0 rgba(59,107,24,0.2)';
              } else if (idx === selected) {
                bg = '#FFF0EE'; border = '#E85A4A'; textColor = '#C4421A';
                shadow = '0 4px 0 rgba(196,66,26,0.15)';
              }
            } else if (selected === idx) {
              bg = 'var(--or50)'; border = 'var(--or300)';
              shadow = '0 4px 0 rgba(232,134,58,0.2)';
            }

            return (
              <button
                key={idx}
                className={`w-full text-left rounded-2xl transition-all duration-150 cursor-pointer ${isJournal ? 'px-4 py-3' : 'py-3 px-4'}`}
                style={{ background: bg, border: `2.5px solid ${border}`, color: textColor, boxShadow: shadow }}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                aria-pressed={selected === idx}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
                    style={{
                      background: answered && idx === q.answer ? 'var(--gr300)'
                        : answered && idx === selected ? '#E85A4A'
                        : selected === idx ? 'var(--or300)'
                        : 'var(--or100)',
                      color: (answered && (idx === q.answer || idx === selected)) || selected === idx ? 'white' : 'var(--or500)',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`text-sm font-medium leading-relaxed ${isJournal ? 'font-mono text-xs' : ''}`}>
                    {choice}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ヒント（設定でONの場合のみ） */}
        {!answered && q.hint && showHintSetting && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium px-1" style={{ color: 'var(--br400)' }}>
              ヒントを見る
            </summary>
            <div className="mt-2 p-3 rounded-xl text-sm" style={{ background: 'var(--br50)', color: 'var(--br600)' }}>
              {q.hint}
            </div>
          </details>
        )}

        {/* 解説（不正解時のみ） */}
        {answered && !isCorrect && (
          <div
            className="rounded-2xl p-4 animate-fade-up"
            style={{ background: 'var(--br50)', border: '2px solid var(--br200)' }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--br400)' }}>解説</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--br600)' }}>
              {(selected >= 0 && q.explanations?.[`wrong_${selected}`]) || q.hint}
            </p>
          </div>
        )}

        {/* フィードバックバナー */}
        {answered && (
          <div
            key={shakeKey}
            className={`rounded-2xl py-3 px-5 text-center font-bold text-white text-sm ${isWrong ? 'animate-shake' : 'animate-bounce-in'}`}
            style={{ background: isCorrect ? 'var(--gr500)' : '#E85A4A' }}
          >
            {isCorrect ? '正解！' : selected === -1 ? `時間切れ！正解は選択肢${String.fromCharCode(65 + q.answer)}` : `不正解…  正解は選択肢${String.fromCharCode(65 + q.answer)}`}
          </div>
        )}
      </div>

      {/* ボタン */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0">
        {!answered ? (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'var(--or500)' }}
            disabled={selected === null}
            onClick={handleCheck}
          >
            答え合わせ
          </button>
        ) : hearts > 0 && (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'var(--or500)' }}
            onClick={handleNext}
          >
            {current + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
          </button>
        )}
      </div>
    </div>
  );
}

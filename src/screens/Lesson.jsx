import { useState, useEffect, useRef, useCallback } from 'react';
import HeartIcon from '../components/HeartIcon';
import ProgressBar from '../components/ProgressBar';
import CharaBubble from '../components/CharaBubble';
import AcornIcon from '../components/AcornIcon';
import JournalBuilder from '../components/JournalBuilder';
import { emptyEntry, isEntryComplete, gradeJournalEntry } from '../services/journal';
import { stageMap, findQuestion } from '../data/questions/index';
import { recordWrong, recordCorrect, getDueReviewIds, unlockGlossaryCategory, spendAcorns, getUser } from '../services/storage';

// クルの励ましコメント（ランダム選択）
// タイミング別のクルのコメント（1問目／途中／最終問題）
const KURU_COMMENTS_START = [
  'さあ、始めよう！クルも応援してるよ！',
  'よし、いくよ！全力で頑張ろう！',
  'ドキドキするね！一緒に頑張ろう！',
  '深呼吸して、落ち着いていこう！',
  '今日も頑張れ！クルが見てるよ！',
];
const KURU_COMMENTS_MIDDLE = [
  'つぎはどんな問題かな？',
  'その調子！集中していこう！',
  'いい感じ！このまま続けよう！',
  'ゆっくり、確実に！',
  '落ち着いて読めば大丈夫！',
  'クルも一緒に頑張ってるよ！',
];
const KURU_COMMENTS_LAST = [
  'あと1問正解でクリアだよ！',
  'クリアまであと1問！がんばれ！',
  'あと1問！クルを信じて！',
];

// first: セッション最初の問題か, remaining: クリアまでの残り正解数（従来型セッションは null）
function getKuruComment({ first, remaining }) {
  let pool;
  if (first) pool = KURU_COMMENTS_START;
  else if (remaining === 1) pool = KURU_COMMENTS_LAST;
  else pool = KURU_COMMENTS_MIDDLE;
  return pool[Math.floor(Math.random() * pool.length)];
}

// セッションの必要正解数（模擬試験のみ8、他は5。セット定義の requiredCorrect で個別上書き可能）
function calcRequiredCorrect(stageId, set) {
  if (stageId === 'weak' || !set) return null; // 苦手セッションは従来型（全問解いたら終了）
  return set.requiredCorrect ?? (stageId === 'stage13' ? 8 : 5);
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
  if (q.type === 'journal_entry') return q; // 組み立て型は選択肢なし
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
  const [kuruComment, setKuruComment] = useState(() => getKuruComment({ first: true }));
  const [builderEntry, setBuilderEntry] = useState(() => emptyEntry()); // 仕訳組み立て型の入力状態
  const [wasCorrect, setWasCorrect] = useState(false); // 直近の回答の正誤

  // 必要正解数（stageId/setIdから導出。苦手セッションは null = 従来型）
  const required = calcRequiredCorrect(
    stageId,
    stageId !== 'weak' ? stageMap[stageId]?.sets.find(s => s.id === setId) : null
  );
  const timerRef = useRef(null);
  const gameOverFiredRef = useRef(false);
  const [hintShown, setHintShown] = useState(false); // この問題でヒント代を支払ったか
  const [hintMessage, setHintMessage] = useState(null);
  const [acornBalance, setAcornBalance] = useState(() => getUser()?.acorns_total ?? 0);

  function handleShowHint() {
    if (spendAcorns(1)) {
      setHintShown(true);
      setHintMessage(null);
      setAcornBalance(b => b - 1);
    } else {
      setHintMessage('どんぐりが足りないのじゃ。問題を解いて集めるのじゃよ。');
    }
  }

  // 苦手専用セッション or 通常セッション
  useEffect(() => {
    // 復活時：問題順・進捗をそのまま引き継ぐ
    if (revived && revivedQuestions?.length > 0) {
      setQuestions(revivedQuestions);
      setCurrent(revivedFromIdx ?? 0);
      const prevResults = revivedResults ?? [];
      setResults(prevResults);
      const corrects = prevResults.filter(r => r.correct).length;
      setKuruComment(getKuruComment({
        first: prevResults.length === 0,
        remaining: required != null ? required - corrects : null,
      }));
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

    // 重複排除してランダム出題（basic: true のルール問題は必ず冒頭に出す）
    const reviewIdSet = new Set(reviewIds);
    const normalQs = set.questions.filter(q => !reviewIdSet.has(q.id));
    const basicQs = normalQs.filter(q => q.basic);
    const restQs = normalQs.filter(q => !q.basic);
    setQuestions([
      ...shuffleArray(basicQs),
      ...shuffleArray([...reviewQs, ...restQs]),
    ].map(prepareQuestion));

    // 時間制限
    if (set.timeLimit) setTimeLeft(set.timeLimit);
  // revived系propsとrequiredはマウント時にのみ確定するため依存に含めない
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // ハート0でも自動遷移せず、「結果へ」ボタンで進んでもらう
  }

  const handleSelect = useCallback((idx) => {
    if (answered) return;
    setSelected(idx);
  }, [answered]);

  const handleCheck = useCallback(() => {
    const isBuilder = q?.type === 'journal_entry';
    if (answered) return;
    if (isBuilder ? !isEntryComplete(builderEntry) : selected === null) return;
    clearInterval(timerRef.current);

    const correct = isBuilder
      ? gradeJournalEntry(builderEntry, q.answer)
      : selected === q.answer;
    setAnswered(true);
    setWasCorrect(correct);

    if (correct) {
      recordCorrect(q.id);
    } else {
      recordWrong(q.id);
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setShakeKey(k => k + 1);

      if (newHearts <= 0) {
        // 自動遷移はせず、解説を読んでから「結果へ」ボタンで進んでもらう
        setResults([...results, { id: q.id, correct: false, selected }]);
        return;
      }
    }
    setResults(prev => [...prev, { id: q.id, correct, selected }]);
  }, [selected, answered, q, hearts, stageId, setId, questions, results, revived, current, onGameOver, builderEntry]);

  // ハート0で解説を読み終えたあと、ゲームオーバー画面へ進む
  function handleGoGameOver() {
    if (gameOverFiredRef.current) return;
    gameOverFiredRef.current = true;
    onGameOver({ stageId, setId, questions, results, hearts: 0, revived, currentIdx: current });
  }

  const handleNext = useCallback(() => {
    const correctCount = results.filter(r => r.correct).length;

    // 必要正解数に到達したらクリア（回答数ベースで結果を渡す）
    if (required != null && correctCount >= required) {
      unlockGlossaryCategory(stageId);
      onFinish({ stageId, setId, results: [...results], correct: correctCount, total: results.length });
      return;
    }

    const nextIdx = current + 1;
    if (nextIdx >= questions.length) {
      // 従来型（苦手セッション）：全問回答で終了
      if (required == null) {
        onFinish({ stageId, setId, results: [...results], correct: correctCount, total: questions.length });
        return;
      }
      // 出題キューが尽きた：このセッションで間違えた問題をリサイクルして継続
      const wrongIds = new Set(results.filter(r => !r.correct).map(r => r.id));
      const seen = new Set();
      const recycled = shuffleArray(questions.filter(qq => {
        if (!wrongIds.has(qq.id) || seen.has(qq.id)) return false;
        seen.add(qq.id);
        return true;
      }));
      if (recycled.length === 0) {
        // 論理上到達しない防御：全問正解済みなら必要数に達しているはず
        onFinish({ stageId, setId, results: [...results], correct: correctCount, total: results.length });
        return;
      }
      setQuestions(prev => [...prev, ...recycled]);
    }

    setKuruComment(getKuruComment({
      first: false,
      remaining: required != null ? required - correctCount : null,
    }));
    setCurrent(nextIdx);
    setSelected(null);
    setAnswered(false);
    setBuilderEntry(emptyEntry());
    setWasCorrect(false);
    setHintShown(false);
    setHintMessage(null);
  }, [current, questions, results, required, stageId, setId, onFinish]);

  if (!q || questions.length === 0) return (
    <div className="app-container flex items-center justify-center">
      <p style={{ color: 'var(--br400)' }}>問題を読み込み中…</p>
    </div>
  );

  const isBuilder = q.type === 'journal_entry';
  const isCorrect = answered && (isBuilder ? wasCorrect : selected === q.answer);
  const isWrong = answered && !isCorrect;
  const isJournal = q.type === 'journal';
  const correctCount = results.filter(r => r.correct).length;
  const sessionDone = required != null
    ? correctCount >= required
    : current + 1 >= questions.length;

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
              {required != null ? `正解 ${correctCount} / ${required}` : `${current + 1} / ${questions.length}問`}
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
            <span
              key={`acorn-${acornBalance}`}
              className="text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-0.5 animate-bounce-in"
              style={{ background: 'var(--or50)', color: 'var(--or500)', border: '1px solid var(--or200)' }}
              aria-label={`所持どんぐり ${acornBalance}個`}
            >
              <AcornIcon size={13} />{acornBalance}
            </span>
            <div className="flex gap-1" aria-label={`残りハート ${hearts}個`}>
              {[0, 1, 2].map(i => <HeartIcon key={i} empty={i >= hearts} size={22} />)}
            </div>
          </div>
        </div>
        <ProgressBar
          current={required != null ? correctCount : current}
          total={required != null ? required : questions.length}
        />
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

        {/* 仕訳組み立て（journal_entry型） */}
        {isBuilder && (
          <div key={`builder-${current}`} className="animate-fade-up">
            <JournalBuilder
              question={q}
              entry={builderEntry}
              onChange={setBuilderEntry}
              answered={answered}
            />
          </div>
        )}

        {/* 選択肢 */}
        {!isBuilder && (
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
        )}

        {/* ヒント（どんぐり1個で表示） */}
        {!answered && q.hint && (
          hintShown ? (
            <div className="p-3 rounded-xl text-sm animate-fade-up" style={{ background: 'var(--br50)', color: 'var(--br600)' }}>
              <span className="font-bold mr-1" style={{ color: 'var(--br400)' }}>ヒント：</span>
              {q.hint}
            </div>
          ) : (
            <div>
              <button
                className="text-sm font-medium px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
                style={{ background: 'var(--or50)', color: 'var(--br400)', border: '1.5px solid var(--or200)' }}
                onClick={handleShowHint}
              >
                <AcornIcon size={16} /> どんぐり1個でヒントを見る
              </button>
              {hintMessage && (
                <p className="text-xs mt-1 px-1 font-bold" style={{ color: '#E85A4A' }}>{hintMessage}</p>
              )}
            </div>
          )
        )}

        {/* 解説（不正解時のみ） */}
        {answered && !isCorrect && (
          <div
            className="rounded-2xl p-4 animate-fade-up"
            style={{ background: 'var(--br50)', border: '2px solid var(--br200)' }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--br400)' }}>解説</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--br600)' }}>
              {isBuilder
                ? (q.explanation || q.hint)
                : (selected >= 0 && q.explanations?.[`wrong_${selected}`]) || q.hint}
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
            {isCorrect ? '正解！'
              : isBuilder ? '不正解… 正解の仕訳を確認しよう'
              : selected === -1 ? `時間切れ！正解は選択肢${String.fromCharCode(65 + q.answer)}`
              : `不正解…  正解は選択肢${String.fromCharCode(65 + q.answer)}`}
          </div>
        )}
      </div>

      {/* ボタン */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0">
        {!answered ? (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'var(--or500)' }}
            disabled={isBuilder ? !isEntryComplete(builderEntry) : selected === null}
            onClick={handleCheck}
          >
            答え合わせ
          </button>
        ) : hearts > 0 ? (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: 'var(--or500)' }}
            onClick={handleNext}
          >
            {sessionDone ? '結果を見る' : '次の問題へ'}
          </button>
        ) : (
          <button
            className="clay-btn w-full py-4 text-base font-bold text-white"
            style={{ background: '#E85A4A' }}
            onClick={handleGoGameOver}
          >
            結果へ
          </button>
        )}
      </div>
    </div>
  );
}

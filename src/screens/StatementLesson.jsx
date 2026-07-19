import { useState } from 'react';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import Calculator from '../components/Calculator';
import { stageMap } from '../data/questions/index';
import { addAcorns, updateProgress, updateStreak, isSetCleared } from '../services/storage';

const fmt = n => Number(n).toLocaleString('ja-JP');

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

// 金額セルが空欄（受験者記入）かどうか
const isBlank = v => v != null && typeof v === 'object' && 'ans' in v;
// 摘要（ことば）セルが空欄かどうか
const isWordBlank = v => v != null && typeof v === 'object' && 'ansWord' in v;

// 語群から選ぶモーダル
function WordPicker({ words, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(74,46,14,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl p-4 pb-8"
        style={{ background: 'white', maxHeight: '65vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="font-bold text-sm mb-3" style={{ color: 'var(--br600)' }}>語群から選ぶ</div>
        <div className="flex flex-wrap gap-1.5">
          {words.map(w => (
            <button
              key={w}
              className="px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1.5px solid var(--or200)' }}
              onClick={() => { onSelect(w); onClose(); }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatementLesson({ stageId, setId, onHome }) {
  const stage = stageMap[stageId];
  const set = stage?.sets.find(s => s.id === setId);
  const st = set?.statement;

  const [answers, setAnswers] = useState({}); // key → 入力文字列（金額）or 選択した語
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [wordPickerKey, setWordPickerKey] = useState(null); // 語群モーダルの対象キー

  if (!st) return null;

  const tables = st.tables ?? [];
  const subQuestions = st.subQuestions ?? [];

  // 空欄一覧（表の金額・表のことば・小問）
  const blankKeys = [];
  tables.forEach((table, ti) => {
    table.rows.forEach((row, ri) => {
      if (isWordBlank(row.label)) blankKeys.push(`${ti}-${ri}-word`);
      ['debit', 'credit'].forEach(side => {
        if (isBlank(row[side])) blankKeys.push(`${ti}-${ri}-${side}`);
      });
    });
  });
  subQuestions.forEach((_, i) => blankKeys.push(`sq-${i}`));

  const filledCount = blankKeys.filter(k => (answers[k] ?? '').length > 0).length;

  function blankAnswer(key) {
    if (key.startsWith('sq-')) return subQuestions[Number(key.slice(3))].ansWord;
    const [ti, ri, side] = key.split('-');
    const row = tables[Number(ti)].rows[Number(ri)];
    return side === 'word' ? row.label.ansWord : row[side].ans;
  }

  function isCellCorrect(key) {
    const ans = blankAnswer(key);
    if (typeof ans === 'string') return (answers[key] ?? '') === ans;
    return Number((answers[key] ?? '').replace(/[^0-9]/g, '')) === ans;
  }

  function handleGrade() {
    const correct = blankKeys.filter(isCellCorrect).length;
    const pct = Math.round((correct / blankKeys.length) * 100);
    // 再クリア時は少額（70点以上3／未満1）
    const acorns = isSetCleared(stageId, setId)
      ? (pct >= 70 ? 3 : 1)
      : calcStatementAcorns(pct, !!st.small);
    setScore(pct);
    setEarned(acorns);
    setGraded(true);
    addAcorns(acorns);
    updateProgress(stageId, setId, pct >= 70, pct);
    updateStreak();
    window.scrollTo(0, 0);
  }

  function handleRetry() {
    setAnswers({});
    setGraded(false);
    setScore(0);
  }

  function renderCell(ti, ri, side, row) {
    const v = row[side];
    if (v == null) return <td key={side} className="px-1" />;
    if (!isBlank(v)) {
      return (
        <td key={side} className="px-1 py-1.5 text-right tabular-nums" style={{ color: 'var(--br600)' }}>
          {fmt(v)}
        </td>
      );
    }
    const key = `${ti}-${ri}-${side}`;
    if (graded) {
      const ok = isCellCorrect(key);
      return (
        <td key={side} className="px-1 py-1">
          <div
            className="rounded-lg px-1.5 py-1 text-right tabular-nums text-xs"
            style={{
              background: ok ? '#F0FBF0' : '#FFF0EE',
              border: `1.5px solid ${ok ? 'var(--gr300)' : '#E85A4A'}`,
              color: ok ? 'var(--gr500)' : '#C4421A',
            }}
          >
            {ok ? fmt(blankAnswer(key)) : (
              <>
                <span className="line-through mr-1">{(answers[key] ?? '') === '' ? '未記入' : fmt(answers[key].replace(/[^0-9]/g, '') || 0)}</span>
                <span className="font-bold">{fmt(blankAnswer(key))}</span>
              </>
            )}
          </div>
        </td>
      );
    }
    return (
      <td key={side} className="px-1 py-1">
        <input
          type="text"
          inputMode="numeric"
          value={answers[key] ?? ''}
          placeholder="？"
          onChange={e => {
            const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
            setAnswers(prev => ({ ...prev, [key]: digits }));
          }}
          className="w-full rounded-lg px-1.5 py-1 text-right outline-none tabular-nums"
          style={{ fontSize: 16, background: 'var(--or50)', border: '1.5px solid var(--or300)', color: 'var(--br600)' }}
          aria-label={`${typeof row.label === 'string' ? row.label : 'ことば空欄'}の金額`}
        />
      </td>
    );
  }

  // 語群から選ぶ空欄チップ（表の摘要・小問共通）
  function renderWordChip(key) {
    const chosen = answers[key] ?? '';
    if (graded) {
      const ok = isCellCorrect(key);
      return (
        <span
          className="inline-block rounded-lg px-2 py-1 text-xs font-bold"
          style={{
            background: ok ? '#F0FBF0' : '#FFF0EE',
            border: `1.5px solid ${ok ? 'var(--gr300)' : '#E85A4A'}`,
            color: ok ? 'var(--gr500)' : '#C4421A',
          }}
        >
          {ok ? blankAnswer(key) : (
            <>
              <span className="line-through mr-1">{chosen || '未選択'}</span>
              <span>{blankAnswer(key)}</span>
            </>
          )}
        </span>
      );
    }
    return (
      <button
        className="inline-block rounded-lg px-2 py-1 text-xs font-bold"
        style={{
          background: chosen ? 'white' : 'var(--or50)',
          border: `1.5px solid ${chosen ? 'var(--or300)' : 'var(--or200)'}`,
          color: chosen ? 'var(--br600)' : '#B8A888',
        }}
        onClick={() => setWordPickerKey(key)}
      >
        {chosen || 'ことばを選ぶ'}
      </button>
    );
  }

  return (
    <div className="app-container flex flex-col">
      <Calculator />
      {/* 語群選択モーダル */}
      {wordPickerKey !== null && st.wordBank && (
        <WordPicker
          words={st.wordBank}
          onSelect={w => setAnswers(prev => ({ ...prev, [wordPickerKey]: w }))}
          onClose={() => setWordPickerKey(null)}
        />
      )}

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
            <div className="flex items-center gap-3">
              <img src={tsumujiiImg} alt="ツム爺" className="object-contain flex-shrink-0" style={{ width: 67, height: 67 }} />
              <div className="bubble bubble-tail-left flex-1 text-sm" style={{ color: 'var(--br600)' }}>
                {getTsumujiiComment(score)}
              </div>
            </div>
          </div>
        )}

        {/* 問題文 */}
        <div className="clay-card p-4">
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--br600)' }}>{st.intro}</p>
        </div>

        {/* 資料1: 決算整理前残高試算表（ある場合のみ） */}
        {st.trialBalance && (
        <details className="clay-card p-4" open>
          <summary className="text-sm font-bold cursor-pointer" style={{ color: 'var(--or500)' }}>
            資料1｜決算整理前残高試算表
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs" style={{ color: 'var(--br600)' }}>
            <div className="space-y-1">
              <div className="font-bold" style={{ color: 'var(--br400)' }}>借方</div>
              {st.trialBalance.debit.map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-1">
                  <span>{label}</span><span className="tabular-nums">{fmt(amount)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1" style={{ borderLeft: '1px solid var(--or100)', paddingLeft: 10 }}>
              <div className="font-bold" style={{ color: 'var(--br400)' }}>貸方</div>
              {st.trialBalance.credit.map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-1">
                  <span>{label}</span><span className="tabular-nums">{fmt(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </details>
        )}

        {/* 資料2: 決算整理事項（ある場合のみ） */}
        {st.adjustments && (
        <details className="clay-card p-4" open>
          <summary className="text-sm font-bold cursor-pointer" style={{ color: 'var(--or500)' }}>
            {st.trialBalance ? '資料2' : '資料'}｜決算整理事項
          </summary>
          <ol className="mt-3 space-y-2 text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
            {st.adjustments.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold flex-shrink-0" style={{ color: 'var(--or500)' }}>{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </details>
        )}

        {/* 資料（自由テキスト） */}
        {st.notes && (
          <div className="clay-card p-4">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>資料</div>
            <div className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
              {st.notes.map((n, i) => <p key={i}>{n}</p>)}
            </div>
          </div>
        )}

        {/* 語群 */}
        {st.wordBank && !graded && (
          <div className="clay-card p-4">
            <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>語群</div>
            <div className="flex flex-wrap gap-1.5">
              {st.wordBank.map(w => (
                <span key={w} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1px solid var(--or200)' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 小問（文章＋語選択） */}
        {subQuestions.length > 0 && (
          <div className="clay-card p-4 space-y-3">
            {subQuestions.map((sq, i) => (
              <div key={i} className="space-y-1.5" style={{ borderTop: i > 0 ? '1px solid var(--or100)' : 'none', paddingTop: i > 0 ? 10 : 0 }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
                  <span className="font-bold mr-1" style={{ color: 'var(--or500)' }}>{i + 1}.</span>
                  {sq.text}
                </p>
                <div>{renderWordChip(`sq-${i}`)}</div>
              </div>
            ))}
          </div>
        )}

        {/* 解答表 */}
        {tables.map((table, ti) => {
          const headers = table.headers ?? ['勘定科目', '借方', '貸方'];
          const showCredit = headers.length >= 3;
          return (
          <div key={ti} className="clay-card p-4">
            <div className="text-sm font-bold mb-2 text-center" style={{ color: 'var(--br600)' }}>{table.title}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--br400)' }}>
                    <th className="text-left py-1 font-bold">{headers[0]}</th>
                    <th className="text-right py-1 font-bold" style={{ width: showCredit ? '30%' : '38%' }}>{headers[1]}</th>
                    {showCredit && <th className="text-right py-1 font-bold" style={{ width: '30%' }}>{headers[2]}</th>}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{
                        borderTop: '1px solid var(--or100)',
                        background: row.isTotal ? 'var(--or50)' : row.isHighlight ? '#F0FBF0' : 'transparent',
                        fontWeight: row.isTotal || row.isHighlight ? 700 : 400,
                      }}
                    >
                      <td className="py-1.5 pr-1" style={{ color: 'var(--br600)' }}>
                        {isWordBlank(row.label) ? renderWordChip(`${ti}-${ri}-word`) : row.label}
                      </td>
                      {renderCell(ti, ri, 'debit', row)}
                      {showCredit && renderCell(ti, ri, 'credit', row)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })}

        {/* 解説（採点後） */}
        {graded && (
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--br50)', border: '2px solid var(--br200)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--br400)' }}>解説</p>
            {st.explanations.map((e, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>{e}</p>
            ))}
          </div>
        )}
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

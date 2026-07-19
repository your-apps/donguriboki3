import { useState } from 'react';
import { answerOf, isKeyCorrect, isWordBlank, isAmountBlank } from '../services/statement';

const fmt = n => Number(n).toLocaleString('ja-JP');

function WordPickerModal({ words, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(74,46,14,0.45)' }} onClick={onClose}>
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

// 第2問・第3問（statement形式）の資料＋解答欄レンダラー
export default function StatementSection({ st, answers, onAnswers, graded }) {
  const [pickerKey, setPickerKey] = useState(null);

  function chip(key) {
    const chosen = answers[key] ?? '';
    if (graded) {
      const ok = isKeyCorrect(st, answers, key);
      return (
        <span className="inline-block rounded-lg px-2 py-1 text-xs font-bold" style={{
          background: ok ? '#F0FBF0' : '#FFF0EE',
          border: `1.5px solid ${ok ? 'var(--gr300)' : '#E85A4A'}`,
          color: ok ? 'var(--gr500)' : '#C4421A',
        }}>
          {ok ? answerOf(st, key) : <><span className="line-through mr-1">{chosen || '未選択'}</span><span>{answerOf(st, key)}</span></>}
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
        onClick={() => setPickerKey(key)}
      >
        {chosen || 'ことばを選ぶ'}
      </button>
    );
  }

  function amountCell(key, side) {
    if (graded) {
      const ok = isKeyCorrect(st, answers, key);
      const user = answers[key] ?? '';
      return (
        <td key={side} className="px-1 py-1">
          <div className="rounded-lg px-1.5 py-1 text-right tabular-nums text-xs" style={{
            background: ok ? '#F0FBF0' : '#FFF0EE',
            border: `1.5px solid ${ok ? 'var(--gr300)' : '#E85A4A'}`,
            color: ok ? 'var(--gr500)' : '#C4421A',
          }}>
            {ok ? fmt(answerOf(st, key)) : <><span className="line-through mr-1">{user === '' ? '未記入' : fmt(user)}</span><span className="font-bold">{fmt(answerOf(st, key))}</span></>}
          </div>
        </td>
      );
    }
    return (
      <td key={side} className="px-1 py-1">
        <input
          type="text" inputMode="numeric" placeholder="？"
          value={answers[key] ?? ''}
          onChange={e => onAnswers({ ...answers, [key]: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
          className="w-full rounded-lg px-1.5 py-1 text-right outline-none tabular-nums"
          style={{ fontSize: 16, background: 'var(--or50)', border: '1.5px solid var(--or300)', color: 'var(--br600)' }}
        />
      </td>
    );
  }

  function cell(ti, ri, side, row) {
    const v = row[side];
    if (v == null) return <td key={side} className="px-1" />;
    if (!isAmountBlank(v)) {
      return <td key={side} className="px-1 py-1.5 text-right tabular-nums" style={{ color: 'var(--br600)' }}>{fmt(v)}</td>;
    }
    return amountCell(`${ti}-${ri}-${side}`, side);
  }

  return (
    <div className="space-y-3">
      {pickerKey !== null && st.wordBank && (
        <WordPickerModal
          words={st.wordBank}
          onSelect={w => onAnswers({ ...answers, [pickerKey]: w })}
          onClose={() => setPickerKey(null)}
        />
      )}

      <div className="clay-card p-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--br600)' }}>{st.intro}</p>
      </div>

      {st.trialBalance && (
        <div className="clay-card p-4">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>資料1｜決算整理前残高試算表</div>
          <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--br600)' }}>
            <div className="space-y-1">
              <div className="font-bold" style={{ color: 'var(--br400)' }}>借方</div>
              {st.trialBalance.debit.map(([l, a]) => (
                <div key={l} className="flex justify-between gap-1"><span>{l}</span><span className="tabular-nums">{fmt(a)}</span></div>
              ))}
            </div>
            <div className="space-y-1" style={{ borderLeft: '1px solid var(--or100)', paddingLeft: 10 }}>
              <div className="font-bold" style={{ color: 'var(--br400)' }}>貸方</div>
              {st.trialBalance.credit.map(([l, a]) => (
                <div key={l} className="flex justify-between gap-1"><span>{l}</span><span className="tabular-nums">{fmt(a)}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {st.adjustments && (
        <div className="clay-card p-4">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>{st.trialBalance ? '資料2' : '資料'}｜決算整理事項</div>
          <ol className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
            {st.adjustments.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold flex-shrink-0" style={{ color: 'var(--or500)' }}>{i + 1}.</span><span>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {st.notes && (
        <div className="clay-card p-4">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>資料</div>
          <div className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
            {st.notes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        </div>
      )}

      {st.wordBank && !graded && (
        <div className="clay-card p-4">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--or500)' }}>語群</div>
          <div className="flex flex-wrap gap-1.5">
            {st.wordBank.map(w => (
              <span key={w} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1px solid var(--or200)' }}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {(st.subQuestions ?? []).length > 0 && (
        <div className="clay-card p-4 space-y-3">
          {st.subQuestions.map((sq, i) => (
            <div key={i} className="space-y-1.5" style={{ borderTop: i > 0 ? '1px solid var(--or100)' : 'none', paddingTop: i > 0 ? 10 : 0 }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>
                <span className="font-bold mr-1" style={{ color: 'var(--or500)' }}>{i + 1}.</span>{sq.text}
              </p>
              <div>{chip(`sq-${i}`)}</div>
            </div>
          ))}
        </div>
      )}

      {(st.tables ?? []).map((table, ti) => {
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
                    <tr key={ri} style={{
                      borderTop: '1px solid var(--or100)',
                      background: row.isTotal ? 'var(--or50)' : row.isHighlight ? '#F0FBF0' : 'transparent',
                      fontWeight: row.isTotal || row.isHighlight ? 700 : 400,
                    }}>
                      <td className="py-1.5 pr-1" style={{ color: 'var(--br600)' }}>
                        {isWordBlank(row.label) ? chip(`${ti}-${ri}-word`) : row.label}
                      </td>
                      {cell(ti, ri, 'debit', row)}
                      {showCredit && cell(ti, ri, 'credit', row)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {graded && st.explanations && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--br50)', border: '2px solid var(--br200)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--br400)' }}>解説</p>
          {st.explanations.map((e, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--br600)' }}>{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}


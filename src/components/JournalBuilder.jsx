import { useState } from 'react';
import { ACCOUNT_CATEGORIES, searchAccounts } from '../data/accounts';

const fmt = n => (n === '' || n == null) ? '' : Number(n).toLocaleString('ja-JP');

// ---- 科目選択モーダル ----

function AccountPicker({ onSelect, onClose }) {
  const [catId, setCatId] = useState(ACCOUNT_CATEGORIES[0].id);
  const [query, setQuery] = useState('');
  const cat = ACCOUNT_CATEGORIES.find(c => c.id === catId);
  const searching = query.trim().length > 0;
  const shownAccounts = searching ? searchAccounts(query) : cat.accounts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(74,46,14,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl p-4 pb-8"
        style={{ background: 'white', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm" style={{ color: 'var(--br600)' }}>勘定科目を選ぶ</span>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--or100)', border: 'none' }}
            onClick={onClose}
            aria-label="閉じる"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 検索ボックス（漢字・よみがなの部分一致） */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="科目名・よみがなで検索"
          className="w-full rounded-xl px-3 py-2 mb-3 outline-none border-2"
          style={{ fontSize: 16, borderColor: 'var(--or200)', background: 'var(--or50)', color: 'var(--br600)' }}
        />

        {/* カテゴリタブ（検索中は非表示） */}
        {!searching && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {ACCOUNT_CATEGORIES.map(c => (
              <button
                key={c.id}
                className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: c.id === catId ? 'var(--or500)' : 'var(--or50)',
                  color: c.id === catId ? 'white' : 'var(--br400)',
                  border: c.id === catId ? 'none' : '1.5px solid var(--or200)',
                }}
                onClick={() => setCatId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 科目一覧 */}
        <div className="overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-1.5">
            {shownAccounts.map(a => (
              <button
                key={a}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1.5px solid var(--or200)' }}
                onClick={() => { onSelect(a); onClose(); }}
              >
                {a}
              </button>
            ))}
            {searching && shownAccounts.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--br400)' }}>見つからなかったのじゃ。別のことばで探すのじゃ。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 片側（借方 or 貸方）の行エディタ ----

function SideEditor({ label, rows, onChangeRows, disabled }) {
  const [pickerIdx, setPickerIdx] = useState(null);

  function updateRow(idx, patch) {
    onChangeRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function removeRow(idx) {
    onChangeRows(rows.filter((_, i) => i !== idx));
  }
  function addRow() {
    if (rows.length < 4) onChangeRows([...rows, { account: null, amount: '' }]);
  }

  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--or50)', border: '1.5px solid var(--or200)' }}>
      <div className="text-xs font-bold mb-2" style={{ color: 'var(--or500)' }}>{label}</div>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <button
              className="flex-1 min-w-0 py-2.5 px-2 rounded-xl text-xs font-bold text-left truncate"
              style={{
                background: 'white',
                color: row.account ? 'var(--br600)' : '#B8A888',
                border: `1.5px solid ${row.account ? 'var(--or300)' : 'var(--or200)'}`,
              }}
              onClick={() => !disabled && setPickerIdx(idx)}
              disabled={disabled}
            >
              {row.account ?? '科目を選ぶ'}
            </button>
            <input
              type="text"
              inputMode="numeric"
              placeholder="金額"
              value={fmt(row.amount)}
              onChange={e => {
                const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                updateRow(idx, { amount: digits });
              }}
              disabled={disabled}
              className="w-28 flex-shrink-0 py-2 px-2 rounded-xl font-bold text-right outline-none"
              style={{ fontSize: 16, background: 'white', color: 'var(--br600)', border: '1.5px solid var(--or200)' }}
              aria-label={`${label}の金額`}
            />
            {rows.length > 1 && !disabled && (
              <button
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#FFF0EE', border: 'none' }}
                onClick={() => removeRow(idx)}
                aria-label="行を削除"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#E85A4A" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {rows.length < 4 && !disabled && (
        <button
          className="mt-2 text-xs font-bold"
          style={{ color: 'var(--or500)', background: 'none', border: 'none' }}
          onClick={addRow}
        >
          ＋ 行を追加
        </button>
      )}
      {pickerIdx !== null && (
        <AccountPicker
          onSelect={a => updateRow(pickerIdx, { account: a })}
          onClose={() => setPickerIdx(null)}
        />
      )}
    </div>
  );
}

// ---- 正解の仕訳表示 ----

function AnswerTable({ answer }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: '#F0FBF0', border: '2px solid var(--gr300)' }}>
      <div className="text-xs font-bold mb-2" style={{ color: 'var(--gr500)' }}>正解の仕訳</div>
      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--br600)' }}>
        <div className="space-y-1">
          <div className="font-bold" style={{ color: 'var(--br400)' }}>借方</div>
          {answer.debit.map((r, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span>{r.account}</span>
              <span className="tabular-nums">{Number(r.amount).toLocaleString('ja-JP')}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1" style={{ borderLeft: '1px solid var(--gr300)', paddingLeft: 8 }}>
          <div className="font-bold" style={{ color: 'var(--br400)' }}>貸方</div>
          {answer.credit.map((r, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span>{r.account}</span>
              <span className="tabular-nums">{Number(r.amount).toLocaleString('ja-JP')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- 本体 ----

export default function JournalBuilder({ question, entry, onChange, answered }) {
  return (
    <div className="space-y-2">
      <SideEditor
        label="借方（左側）"
        rows={entry.debit}
        onChangeRows={rows => onChange({ ...entry, debit: rows })}
        disabled={answered}
      />
      <SideEditor
        label="貸方（右側）"
        rows={entry.credit}
        onChangeRows={rows => onChange({ ...entry, credit: rows })}
        disabled={answered}
      />
      {answered && <AnswerTable answer={question.answer} />}
    </div>
  );
}

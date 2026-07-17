// 大問（statement形式）の空欄キー収集と採点ユーティリティ
export const isAmountBlank = v => v != null && typeof v === 'object' && 'ans' in v;
export const isWordBlank = v => v != null && typeof v === 'object' && 'ansWord' in v;

/** statement 内のすべての空欄キーを返す */
export function blankKeysOf(st) {
  const keys = [];
  (st.tables ?? []).forEach((table, ti) => {
    table.rows.forEach((row, ri) => {
      if (isWordBlank(row.label)) keys.push(`${ti}-${ri}-word`);
      ['debit', 'credit'].forEach(side => {
        if (isAmountBlank(row[side])) keys.push(`${ti}-${ri}-${side}`);
      });
    });
  });
  (st.subQuestions ?? []).forEach((_, i) => keys.push(`sq-${i}`));
  return keys;
}

/** キーに対応する正解（数値 or 語） */
export function answerOf(st, key) {
  if (key.startsWith('sq-')) return st.subQuestions[Number(key.slice(3))].ansWord;
  const [ti, ri, side] = key.split('-');
  const row = st.tables[Number(ti)].rows[Number(ri)];
  return side === 'word' ? row.label.ansWord : row[side].ans;
}

/** 入力が正解かどうか */
export function isKeyCorrect(st, answers, key) {
  const ans = answerOf(st, key);
  if (typeof ans === 'string') return (answers[key] ?? '') === ans;
  return Number(String(answers[key] ?? '').replace(/[^0-9]/g, '')) === ans;
}

/** 正解数 / 空欄数 */
export function scoreStatement(st, answers) {
  const keys = blankKeysOf(st);
  const correct = keys.filter(k => isKeyCorrect(st, answers, k)).length;
  return { correct, total: keys.length };
}

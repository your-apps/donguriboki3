// 仕訳組み立て問題（journal_entry型）のエントリ操作・採点ユーティリティ

export function emptyEntry() {
  return {
    debit: [{ account: null, amount: '' }],
    credit: [{ account: null, amount: '' }],
  };
}

export function filledRows(rows) {
  return rows.filter(r => r.account && String(r.amount).length > 0 && Number(r.amount) > 0);
}

/** 借方・貸方それぞれ1行以上そろい、書きかけの行がない状態か */
export function isEntryComplete(entry) {
  if (!entry) return false;
  const halfDone = rows => rows.some(r => (r.account && !(Number(r.amount) > 0)) || (!r.account && String(r.amount).length > 0));
  if (halfDone(entry.debit) || halfDone(entry.credit)) return false;
  return filledRows(entry.debit).length > 0 && filledRows(entry.credit).length > 0;
}

/** 行順は不問で正誤判定（科目と金額の完全一致） */
export function gradeJournalEntry(entry, answer) {
  const norm = rows => rows.map(r => `${r.account}|${Number(r.amount)}`).sort().join(',');
  return norm(filledRows(entry.debit)) === norm(answer.debit)
    && norm(filledRows(entry.credit)) === norm(answer.credit);
}

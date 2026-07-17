import { useState } from 'react';

// 簡易電卓（本試験でも電卓の持ち込みが認められているため）
export default function Calculator() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true); // 次の数字入力で表示をリセットするか

  function inputDigit(d) {
    setDisplay(cur => {
      const base = fresh ? '' : cur === '0' ? '' : cur;
      const next = (base + d).slice(0, 12);
      return next === '' ? '0' : next;
    });
    setFresh(false);
  }

  function applyOp(nextOp) {
    const current = Number(display);
    if (op != null && prev != null && !fresh) {
      const result = op === '+' ? prev + current
        : op === '-' ? prev - current
        : op === '×' ? prev * current
        : current === 0 ? 0 : prev / current;
      const rounded = Math.round(result * 100) / 100;
      setDisplay(String(rounded).slice(0, 12));
      setPrev(nextOp === '=' ? null : rounded);
    } else {
      setPrev(nextOp === '=' ? null : current);
    }
    setOp(nextOp === '=' ? null : nextOp);
    setFresh(true);
  }

  function clearAll() {
    setDisplay('0'); setPrev(null); setOp(null); setFresh(true);
  }

  function backspace() {
    if (fresh) return;
    setDisplay(cur => cur.length <= 1 ? '0' : cur.slice(0, -1));
  }

  const keyBtn = (label, onClick, style = {}) => (
    <button
      key={label}
      className="rounded-xl py-2.5 text-sm font-bold"
      style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1.5px solid var(--or200)', ...style }}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* フローティングボタン */}
      <button
        className="fixed z-40 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ right: 16, bottom: 88, background: 'var(--or500)', border: '3px solid white', boxShadow: '0 4px 12px rgba(74,46,14,0.3)' }}
        onClick={() => setOpen(o => !o)}
        aria-label="電卓"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <path d="M8 6h8"/>
          <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" strokeWidth="2.4"/>
        </svg>
      </button>

      {/* 電卓パネル */}
      {open && (
        <div
          className="fixed z-40 rounded-2xl p-3"
          style={{ right: 16, bottom: 148, width: 220, background: 'white', border: '2px solid var(--or200)', boxShadow: '0 8px 24px rgba(74,46,14,0.25)' }}
        >
          <div
            className="rounded-xl px-3 py-2 mb-2 text-right text-lg font-bold tabular-nums overflow-hidden"
            style={{ background: 'var(--or50)', color: 'var(--br600)', border: '1.5px solid var(--or200)' }}
          >
            {Number(display).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {keyBtn('C', clearAll, { background: '#FFF0EE', color: '#E85A4A' })}
            {keyBtn('⌫', backspace)}
            {keyBtn('÷', () => applyOp('÷'), { background: 'var(--or100)' })}
            {keyBtn('×', () => applyOp('×'), { background: 'var(--or100)' })}
            {keyBtn('7', () => inputDigit('7'))}
            {keyBtn('8', () => inputDigit('8'))}
            {keyBtn('9', () => inputDigit('9'))}
            {keyBtn('-', () => applyOp('-'), { background: 'var(--or100)' })}
            {keyBtn('4', () => inputDigit('4'))}
            {keyBtn('5', () => inputDigit('5'))}
            {keyBtn('6', () => inputDigit('6'))}
            {keyBtn('+', () => applyOp('+'), { background: 'var(--or100)' })}
            {keyBtn('1', () => inputDigit('1'))}
            {keyBtn('2', () => inputDigit('2'))}
            {keyBtn('3', () => inputDigit('3'))}
            {keyBtn('=', () => applyOp('='), { background: 'var(--or500)', color: 'white', gridRow: 'span 2' })}
            {keyBtn('0', () => inputDigit('0'), { gridColumn: 'span 2' })}
            {keyBtn('00', () => { inputDigit('0'); inputDigit('0'); })}
          </div>
        </div>
      )}
    </>
  );
}

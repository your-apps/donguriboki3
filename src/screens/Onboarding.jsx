import { useState } from 'react';
import kuruImg from '../assets/kuru.webp';
import tsumujiiImg from '../assets/tsumujii.webp';
import { initUser } from '../services/storage';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');

  function handleStart() {
    if (!name.trim()) return;
    initUser(name.trim());
    setStep(2);
  }

  function handleEnter() {
    onComplete();
  }

  if (step === 2) {
    return (
      <div className="app-container flex flex-col items-center justify-center px-6 gap-8">
        <img
          src={kuruImg}
          alt="クル"
          className="w-32 h-32 object-contain animate-bounce-in"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
        />
        <div
          className="clay-card p-6 text-center w-full animate-fade-up"
          style={{ animationDelay: '100ms' }}
        >
          <p className="text-lg font-bold mb-1" style={{ color: 'var(--br600)' }}>
            {name}さん、よろしくね！
          </p>
          <p style={{ color: 'var(--br400)' }}>
            さっそく始めよう！
          </p>
          <p className="text-sm mt-2 font-bold" style={{ color: 'var(--or500)' }}>
            🌰 ツム爺からどんぐりを5個もらった！<br />
            <span className="text-xs font-normal" style={{ color: 'var(--br400)' }}>困ったときのヒントに使えるよ</span>
          </p>
        </div>
        <button
          className="clay-btn w-full py-4 text-lg font-bold text-white"
          style={{ background: 'var(--or500)' }}
          onClick={handleEnter}
        >
          はじめる！
        </button>
      </div>
    );
  }

  return (
    <div className="app-container flex flex-col items-center justify-center px-6 gap-6">
      {/* キャラクター */}
      <div className="flex items-end justify-center">
        <img
          src={kuruImg}
          alt="クル"
          className="w-24 h-24 object-contain"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))', marginBottom: 5, marginRight: -24, position: 'relative', zIndex: 1 }}
        />
        <img
          src={tsumujiiImg}
          alt="ツム爺"
          className="w-32 h-32 object-contain"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))' }}
        />
      </div>

      {/* ツム爺の吹き出し（キャラ直下・しっぽは上のツム爺へ） */}
      <div
        className="bubble bubble-tail-up w-full text-sm"
        style={{ color: 'var(--br600)', marginTop: -8 }}
      >
        名前を教えてくれんかの。
      </div>

      {/* タイトル */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AcornLogo />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--or500)' }}
          >
            どんぐり簿記3級
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--br400)' }}>
          楽しく学ぼう、日商簿記3級！
        </p>
      </div>

      {/* 名前入力 */}
      <div className="clay-card p-5 w-full">
        <label
          htmlFor="username"
          className="block text-sm font-bold mb-2"
          style={{ color: 'var(--br400)' }}
        >
          あなたのお名前
        </label>
        <input
          id="username"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          placeholder="名前を入力"
          maxLength={10}
          className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 transition-colors"
          style={{
            borderColor: name ? 'var(--or300)' : 'var(--or100)',
            background: 'var(--or50)',
            color: 'var(--br600)',
          }}
        />
      </div>

      <button
        className="clay-btn w-full py-4 text-lg font-bold text-white"
        style={{ background: 'var(--or500)' }}
        disabled={!name.trim()}
        onClick={handleStart}
      >
        つぎへ
      </button>
    </div>
  );
}

function AcornLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="8.5" rx="7" ry="3.2" fill="#8B5E2E"/>
      <rect x="5" y="8" width="14" height="2.5" rx="1.2" fill="#A0722A"/>
      <line x1="9" y1="8" x2="9" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
      <line x1="12" y1="8" x2="12" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
      <line x1="15" y1="8" x2="15" y2="10.5" stroke="#7A5020" strokeWidth="0.6"/>
      <line x1="12" y1="5.5" x2="12" y2="8" stroke="#6B4423" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="#D4721E"/>
      <ellipse cx="10" cy="13" rx="1.8" ry="1.2" fill="#F0A050" opacity=".5"/>
      <ellipse cx="12" cy="15.5" rx="5.5" ry="6" fill="none" stroke="#8B4A0A" strokeWidth="0.8"/>
    </svg>
  );
}

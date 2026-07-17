import { useState, useEffect } from 'react';
import kuruImg from '../assets/kuru.webp';
import tsumujiiImg from '../assets/tsumujii.webp';
import AcornIcon from '../components/AcornIcon';
import InstallPrompt from '../components/InstallPrompt';
import { getUser, updateStreak } from '../services/storage';
import { stages } from '../data/questions/index';

const STAGE_META = [
  { desc: 'お金の動きを記録する考え方' },          //  1 お金の動き
  { desc: '借方・貸方のルールを身につける' },        //  2 左と右
  { desc: '科目名と5つの分類を整理する' },          //  3 科目名
  { desc: '現金取引と現金過不足の処理' },            //  4 現金取引
  { desc: '売掛・買掛とクレジット取引' },            //  5 掛け取引
  { desc: '帳簿の読み方と財務諸表の基礎' },          //  6 帳簿
  { desc: '手形・電子記録債権・商品券・小口現金' },   //  7 証書・証券
  { desc: '減価償却と固定資産の処理' },              //  8 固定資産
  { desc: '当座借越・仮払金・立替金・訂正仕訳' },     //  9 特殊仕訳
  { desc: '株式の発行・配当・消費税・法人税' },       // 10 株式会社・税金（新）
  { desc: '経過勘定と決算整理・帳簿の締切' },         // 11 決算整理
  { desc: '補助簿の種類と商品有高帳の計算' },         // 12 補助簿
  { desc: '3伝票制と仕訳日計表のしくみ' },           // 13 伝票会計（新）
  { desc: '試算表から財務諸表を作る' },              // 14 試算表・精算表
  { desc: '本試験形式で仕訳を自分で組み立てる' },     // 15 実践仕訳演習
  { desc: '勘定記入・補助簿・台帳（第2問対策）' },     // 16 帳簿と勘定
  { desc: '本試験第3問形式の決算大問に挑戦' },        // 17 決算問題
  { desc: '全分野を横断する総合模擬試験' },          // 18 本番模擬試験
];

// ステージアイコン背景グラデーション
// Stage1（明るいアプリコット）→ Stage15（濃いダークエスプレッソ）へ段階的に成熟
const STAGE_GRADIENTS = Array(18).fill('linear-gradient(135deg, #FF8C00 0%, #E55000 100%)');

function StageIcon({ index }) {
  const sw = { strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = [
    /* 1 お金の動き：円コイン */
    <><circle cx="12" cy="12" r="8.5" {...sw}/><path d="M9.5 9.5l2.5 3 2.5-3" {...sw}/><path d="M12 12.5V16" {...sw}/><path d="M9.5 14.5h5" {...sw}/></>,
    /* 2 借方・貸方：左右矢印 */
    <><path d="M8 7L3 12l5 5M16 7l5 5-5 5" {...sw}/><path d="M4 12h16" {...sw}/></>,
    /* 3 勘定科目：ラベルタグ */
    <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" {...sw}/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></>,
    /* 4 現金取引：紙幣 */
    <><rect x="2" y="7" width="20" height="12" rx="2" {...sw}/><path d="M2 11h20" {...sw}/><circle cx="12" cy="15.5" r="2" {...sw}/><circle cx="5" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="15.5" r="1" fill="currentColor" stroke="none"/></>,
    /* 5 掛け取引：チェーンリンク */
    <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" {...sw}/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...sw}/></>,
    /* 6 帳簿と財務諸表：開いた帳簿 */
    <><path d="M4 3h7v18H4zM13 3h7v18h-7z" {...sw}/><path d="M11 3v18" {...sw}/><path d="M6 7h3M6 11h3M6 15h3M15 7h3M15 11h3M15 15h3" {...sw}/></>,
    /* 7 証書・証券：スクロール文書 */
    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" {...sw}/><path d="M14 2v6h6" {...sw}/><path d="M8 13h8M8 17h5" {...sw}/></>,
    /* 8 固定資産：ビル */
    <><path d="M3 21h18M5 21V8l7-5 7 5v13" {...sw}/><path d="M9 21v-5h6v5" {...sw}/><path d="M9 11h2M13 11h2M9 15h2M13 15h2" {...sw}/></>,
    /* 9 複合・特殊な仕訳：上下入れ替え矢印 */
    <><path d="M17 4l4 4-4 4M7 20l-4-4 4-4" {...sw}/><path d="M21 8H9a4 4 0 00-4 4v0M3 16h12a4 4 0 004-4v0" {...sw}/></>,
    /* 10 株式会社・税金：株券（証書＋¥） */
    <><rect x="3" y="5" width="18" height="14" rx="1.5" {...sw}/><path d="M6 8.5h12" {...sw}/><path d="M9.6 12l2.4 2.6 2.4-2.6" {...sw}/><path d="M12 14.6V17M10.2 15.7h3.6" {...sw}/></>,
    /* 11 決算整理：カレンダー＋チェック */
    <><rect x="3" y="4" width="18" height="17" rx="2" {...sw}/><path d="M16 2v4M8 2v4M3 10h18" {...sw}/><path d="M9 16l2 2 4-4" {...sw}/></>,
    /* 12 補助簿：フォルダ＋リスト */
    <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" {...sw}/><path d="M8 14h8M8 17h5" {...sw}/></>,
    /* 13 伝票会計：伝票（重ねた票） */
    <><rect x="4" y="6" width="12" height="15" rx="1.5" {...sw}/><path d="M8 4h11a1 1 0 011 1v12" {...sw}/><path d="M7 10h6M7 13h6M7 16h4" {...sw}/></>,
    /* 14 試算表・精算表：グリッド表 */
    <><rect x="3" y="3" width="18" height="18" rx="1.5" {...sw}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" {...sw}/></>,
    /* 15 実践仕訳演習：ペンで記入 */
    <><path d="M12 20h9" {...sw}/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" {...sw}/></>,
    /* 16 帳簿と勘定：T字勘定 */
    <><path d="M3 5h18" {...sw}/><path d="M12 5v15" {...sw}/><path d="M5 10h4M5 14h4M15 10h4M15 14h4" {...sw}/></>,
    /* 17 決算問題：電卓 */
    <><rect x="4" y="2" width="16" height="20" rx="2" {...sw}/><path d="M8 6h8" {...sw}/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" strokeWidth="2.4" strokeLinecap="round"/></>,
    /* 18 模擬試験：トロフィー */
    <><path d="M8 21h8M12 17v4" {...sw}/><path d="M7 4H5v5a7 7 0 0014 0V4h-2" {...sw}/><path d="M5 4H2v2a4 4 0 003.82 4M19 4h3v2a4 4 0 01-3.82 4" {...sw}/></>,
  ];
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
      {icons[index]}
    </svg>
  );
}

function calcIsSetUnlocked(stageIdx, setIdx, userProgress) {
  if (stageIdx === 0 && setIdx === 0) return true;
  if (setIdx > 0) {
    const stage = stages[stageIdx];
    const prevSetId = stage.sets[setIdx - 1].id;
    return !!(userProgress?.[stage.id]?.[prevSetId]?.cleared);
  }
  const prevStage = stages[stageIdx - 1];
  if (!prevStage) return false;
  const lastSet = prevStage.sets[prevStage.sets.length - 1];
  return !!(userProgress?.[prevStage.id]?.[lastSet.id]?.cleared);
}

export default function Home({ onStartLesson, onNavigate }) {
  const [user, setUser] = useState(null);
  const [openStageIdx, setOpenStageIdx] = useState(null);

  useEffect(() => {
    updateStreak();
    const u = getUser();
    setUser(u);
    if (u) {
      const firstInProgress = stages.findIndex((stage, idx) => {
        if (!calcIsSetUnlocked(idx, 0, u.progress)) return false;
        return !stage.sets.every(set => u.progress?.[stage.id]?.[set.id]?.cleared);
      });
      if (firstInProgress >= 0) setOpenStageIdx(firstInProgress);
    }
  }, []);

  if (!user) return null;

  const todayPct = Math.min(1, user.acorns_today / user.acorns_goal);

  function toggleStage(idx) {
    setOpenStageIdx(prev => prev === idx ? null : idx);
  }

  return (
    <div className="app-container flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <AcornIcon size={24} />
          <span className="font-bold text-base" style={{ color: 'var(--or500)' }}>
            どんぐり簿記3級
          </span>
        </div>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--or100)', border: 'none' }}
          onClick={() => onNavigate('settings')}
          aria-label="設定"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or500)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* ストリーク */}
        <div className="clay-card p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--or100)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C10 5.5 7 9 7 13C7 17.4 9.2 21 12 21C14.8 21 17 17.4 17 13C17 9 14 5.5 12 2Z" fill="var(--or500)"/>
              <path d="M8 11C8 11 5.5 10 6 13C6.4 15.2 7.5 17 7.5 17C6.8 15 7 12.5 8 11Z" fill="var(--or300)" opacity="0.9"/>
              <path d="M16 11C16 11 18.5 10 18 13C17.6 15.2 16.5 17 16.5 17C17.2 15 17 12.5 16 11Z" fill="var(--or300)" opacity="0.9"/>
              <path d="M12 8C11 10.5 10.5 12 10.5 14C10.5 16.5 11.2 18.5 12 19C12.8 18.5 13.5 16.5 13.5 14C13.5 12 13 10.5 12 8Z" fill="var(--or100)"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--or500)' }}>
              {user.streak}日連続
            </div>
            <div className="text-xs" style={{ color: 'var(--br400)' }}>
              続けることが力になるのう
            </div>
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="clay-card p-4 flex items-center gap-4">
          <div className="flex items-end">
            <img src={kuruImg} alt="クル" className="object-contain" style={{ width: 58, height: 58, marginBottom: 5, marginRight: -22, position: 'relative', zIndex: 1 }} />
            <img src={tsumujiiImg} alt="ツム爺" className="object-contain" style={{ width: 77, height: 77 }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: 'var(--br600)' }}>
              {user.name}
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded-full inline-block mb-1"
              style={{ background: 'var(--or100)', color: 'var(--or500)' }}
            >
              {user.title}
            </div>
            <div className="flex items-center gap-1">
              <AcornIcon size={16} />
              <span className="text-sm font-bold" style={{ color: 'var(--br400)' }}>
                {user.acorns_total}個
              </span>
            </div>
          </div>
        </div>

        {/* 今日の進捗 */}
        <div className="clay-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: 'var(--br600)' }}>
              今日のどんぐり
            </span>
            <span className="text-sm" style={{ color: 'var(--br400)' }}>
              {user.acorns_today} / {user.acorns_goal}個
            </span>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: 'var(--track)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${todayPct * 100}%`,
                background: todayPct >= 1
                  ? 'linear-gradient(90deg, var(--gr300), var(--gr500))'
                  : 'linear-gradient(90deg, var(--or300), var(--or500))',
              }}
            />
          </div>
          {todayPct >= 1 && (
            <p className="text-xs mt-1 text-center font-bold" style={{ color: 'var(--gr500)' }}>
              今日の目標達成！
            </p>
          )}
        </div>

        {/* アプリインストール案内（インストール済み・非対応環境では非表示） */}
        <InstallPrompt />

        {/* ステージ一覧 */}
        <div>
          <h2 className="text-sm font-bold mb-2 px-1" style={{ color: 'var(--br600)' }}>
            ステージ
          </h2>
          <div className="space-y-2">
            {stages.map((stage, stageIdx) => {
              const meta = STAGE_META[stageIdx];
              const isOpen = openStageIdx === stageIdx;
              const firstUnlocked = calcIsSetUnlocked(stageIdx, 0, user.progress);
              const clearedCount = stage.sets.filter(
                set => user.progress?.[stage.id]?.[set.id]?.cleared
              ).length;
              const allCleared = clearedCount === stage.sets.length;

              return (
                <div
                  key={stage.id}
                  className="clay-card overflow-hidden"
                  style={{ opacity: firstUnlocked ? 1 : 0.55 }}
                >
                  {/* ステージヘッダー（アコーディオントリガー） */}
                  <button
                    className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => firstUnlocked && toggleStage(stageIdx)}
                    disabled={!firstUnlocked}
                    aria-expanded={isOpen}
                  >
                    {/* アイコン */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                      style={{
                        background: allCleared
                          ? 'linear-gradient(135deg, #9DD63F 0%, #6AAF20 100%)'
                          : firstUnlocked
                          ? STAGE_GRADIENTS[stageIdx]
                          : '#EDE8E0',
                        border: '2px solid rgba(0,0,0,0.10)',
                        color: firstUnlocked ? 'white' : '#B0A090',
                        boxShadow: firstUnlocked
                          ? 'inset 0 1px 0 rgba(255,255,255,0.30)'
                          : 'none',
                      }}
                    >
                      {!firstUnlocked ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      ) : (
                        <StageIcon index={stageIdx} />
                      )}
                    </div>

                    {/* テキスト */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: 'var(--br400)' }}>
                        ステージ {stageIdx + 1}
                        {clearedCount > 0 && (
                          <span style={{ color: allCleared ? 'var(--gr500)' : 'var(--or500)' }}>
                            {' '}· {clearedCount}/{stage.sets.length} クリア
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm leading-snug" style={{ color: 'var(--br600)' }}>
                        {stage.title}
                      </div>
                      <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--br400)' }}>
                        {meta.desc}
                      </div>
                    </div>

                    {/* シェブロン */}
                    {firstUnlocked && (
                      <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="var(--br400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    )}
                  </button>

                  {/* アコーディオン内容（セット一覧） */}
                  <div
                    style={{
                      maxHeight: isOpen ? '600px' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}
                  >
                    <div className="px-4 pb-4 space-y-2">
                      <div style={{ height: 1, background: 'var(--or100)', marginBottom: 8 }} />
                      {stage.sets.map((set, setIdx) => {
                        const unlocked = calcIsSetUnlocked(stageIdx, setIdx, user.progress);
                        const progressData = user.progress?.[stage.id]?.[set.id];
                        const cleared = progressData?.cleared;
                        const bestAcc = progressData?.best_acc ?? 0;

                        return (
                          <div
                            key={set.id}
                            className="flex items-center gap-3 rounded-2xl p-3"
                            style={{
                              background: cleared ? 'var(--gr50)' : unlocked ? 'var(--or50)' : '#F8F5F0',
                              opacity: unlocked ? 1 : 0.6,
                            }}
                          >
                            {/* セット番号 */}
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                              style={{
                                background: cleared ? 'var(--gr100)' : unlocked ? 'var(--or100)' : '#EDE8E0',
                                color: cleared ? 'var(--gr500)' : 'var(--or500)',
                              }}
                            >
                              {cleared ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gr500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : !unlocked ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A89878" strokeWidth="2" strokeLinecap="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                              ) : (
                                setIdx + 1
                              )}
                            </div>

                            {/* セット情報 */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm leading-snug" style={{ color: 'var(--br600)' }}>
                                {set.title}
                              </div>
                              {cleared && (
                                <div className="text-xs" style={{ color: 'var(--gr500)' }}>
                                  最高正答率 {bestAcc}%
                                </div>
                              )}
                            </div>

                            {/* スタートボタン */}
                            {unlocked && (
                              <button
                                className="clay-btn px-3 py-1.5 text-xs font-bold text-white flex-shrink-0"
                                style={{ background: cleared ? '#C48A50' : 'var(--or500)' }}
                                onClick={() => onStartLesson(stage.id, set.id)}
                              >
                                {cleared ? 'もう一度' : 'スタート'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 苦手問題セッション */}
        {user.weak_questions.length > 0 && (
          <button
            className="clay-btn w-full py-4 font-bold text-white"
            style={{ background: '#E85A4A' }}
            onClick={() => onStartLesson('weak', 'weak_session')}
          >
            苦手問題に挑戦する ({user.weak_questions.length}問)
          </button>
        )}
      </div>
    </div>
  );
}

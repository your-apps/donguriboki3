const KEY = 'donguriboki_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function defaultUser(name) {
  return {
    name,
    acorns_total: 5, // 初期ボーナス（ヒント用にツム爺から5個）
    acorns_today: 0,
    acorns_goal: 10,
    streak: 0,
    last_login: new Date().toISOString().slice(0, 10),
    last_study: null, // 最後に学習（セッション完了）した日
    hint_bonus_granted: true, // 初期5個は付与済み
    title: 'どんぐりころころ',
    progress: {},
    weak_questions: [],
    weak_consecutive_correct: {},
    spaced_repetition: {},
    unlocked_glossary_categories: [],
  };
}

export function getAppData() {
  return load();
}

export function isFirstLaunch() {
  return load() === null;
}

export function initUser(name) {
  const user_id = 'user_1';
  const data = {
    users: { [user_id]: defaultUser(name) },
    active_user: user_id,
  };
  save(data);
  return data.users[user_id];
}

export function getUser() {
  const data = load();
  if (!data) return null;
  return data.users[data.active_user];
}

export function updateUser(updates) {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  data.users[uid] = { ...data.users[uid], ...updates };
  save(data);
  return data.users[uid];
}

export function updateProgress(stageId, setId, cleared, bestAcc) {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  if (!data.users[uid].progress[stageId]) {
    data.users[uid].progress[stageId] = {};
  }
  const prev = data.users[uid].progress[stageId][setId] || {};
  data.users[uid].progress[stageId][setId] = {
    cleared: cleared || prev.cleared || false,
    best_acc: Math.max(bestAcc, prev.best_acc || 0),
  };
  save(data);
}

/**
 * どんぐりを加算する。
 * 戻り値: { bonus, titleUp } — 日次目標達成ボーナス(+2)が出た場合と、称号が上がった場合の演出情報
 */
export function addAcorns(count) {
  const data = load();
  if (!data) return { bonus: 0, titleUp: null };
  const uid = data.active_user;
  const u = data.users[uid];
  const today = new Date().toISOString().slice(0, 10);

  const beforeToday = u.acorns_today;
  const beforeTitle = u.title;
  u.acorns_total += count;
  u.acorns_today += count;

  // 日次目標をこの加算で初めて越えたら、1日1回だけボーナス+2
  let bonus = 0;
  const goal = u.acorns_goal || 10;
  if (beforeToday < goal && u.acorns_today >= goal && u.last_goal_bonus !== today) {
    bonus = 2;
    u.acorns_total += bonus;
    u.acorns_today += bonus;
    u.last_goal_bonus = today;
  }

  u.title = calcTitle(u.acorns_total);
  const titleUp = u.title !== beforeTitle ? u.title : null;

  save(data);
  return { bonus, titleUp };
}

export function spendAcorns(count) {
  const data = load();
  if (!data) return false;
  const uid = data.active_user;
  if (data.users[uid].acorns_total < count) return false;
  data.users[uid].acorns_total -= count;
  save(data);
  return true;
}

/** 日付が変わっていたら「今日のどんぐり」をリセットする（ホーム表示時に呼ぶ。ストリークには触れない） */
export function dailyReset() {
  const data = load();
  if (!data) return;
  const u = data.users[data.active_user];
  const today = new Date().toISOString().slice(0, 10);
  if (u.last_login !== today) {
    u.last_login = today;
    u.acorns_today = 0;
    save(data);
  }
}

// ストリークの節目（お祝い表示を出す日数）
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

/**
 * 学習ストリークを更新する（セッション完了・ゲームオーバー時のみ呼ぶ。開くだけでは伸びない）。
 * 戻り値: { streak, milestone } — milestone は節目に到達した瞬間だけ true
 */
export function updateStreak() {
  const data = load();
  if (!data) return { streak: 0, milestone: false };
  const u = data.users[data.active_user];
  const today = new Date().toISOString().slice(0, 10);
  const last = u.last_study;

  if (last === today) return { streak: u.streak, milestone: false };

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  u.streak = last === yesterday ? u.streak + 1 : 1;
  u.last_study = today;
  save(data);
  return { streak: u.streak, milestone: STREAK_MILESTONES.includes(u.streak) };
}

function calcTitle(total) {
  if (total >= 500) return 'どんぐり仙人';
  if (total >= 350) return 'どんぐりのおに';
  if (total >= 250) return 'どんぐり博士';
  if (total >= 180) return 'どんぐり学者';
  if (total >= 120) return 'どんぐりコレクター';
  if (total >= 70)  return 'どんぐりマニア';
  if (total >= 30)  return 'どんぐりじまん';
  if (total >= 10)  return 'どんぐりあつめ';
  return 'どんぐりころころ';
}

// ─── 間隔反復・苦手問題システム ───────────────────────────

const REVIEW_INTERVALS = [1, 2, 4]; // 不正解後の復習間隔（日数）
const WEAK_THRESHOLD = 3;            // 何回間違えたら苦手リスト入り
const GRADUATE_COUNT = 2;            // 何回連続正解で苦手卒業

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 問題を間違えたときに呼ぶ */
export function recordWrong(questionId) {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  const u = data.users[uid];

  // wrong_count を初期化
  if (!u.question_wrong_count) u.question_wrong_count = {};
  u.question_wrong_count[questionId] = (u.question_wrong_count[questionId] || 0) + 1;

  const count = u.question_wrong_count[questionId];

  if (count >= WEAK_THRESHOLD) {
    // 苦手リスト登録
    if (!u.weak_questions.includes(questionId)) {
      u.weak_questions.push(questionId);
    }
    u.weak_consecutive_correct[questionId] = 0;
  } else {
    // 間隔反復スケジュール
    const intervalIdx = count - 1; // 0,1,2
    const interval = REVIEW_INTERVALS[Math.min(intervalIdx, REVIEW_INTERVALS.length - 1)];
    u.spaced_repetition[questionId] = addDays(today(), interval);
  }

  save(data);
}

/** 問題を正解したときに呼ぶ */
export function recordCorrect(questionId) {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  const u = data.users[uid];

  // 復習スケジュールから削除
  delete u.spaced_repetition[questionId];

  if (u.weak_questions.includes(questionId)) {
    // 苦手問題の連続正解カウント
    u.weak_consecutive_correct[questionId] = (u.weak_consecutive_correct[questionId] || 0) + 1;
    if (u.weak_consecutive_correct[questionId] >= GRADUATE_COUNT) {
      // 卒業
      u.weak_questions = u.weak_questions.filter(id => id !== questionId);
      delete u.weak_consecutive_correct[questionId];
      if (u.question_wrong_count) delete u.question_wrong_count[questionId];
    }
  }

  save(data);
}

/** 今日復習すべき問題IDリストを返す（指定ステージに絞る場合は stageQuestionIds を渡す） */
export function getDueReviewIds(stageQuestionIds = null) {
  const data = load();
  if (!data) return [];
  const u = data.users[data.active_user];
  if (!u.spaced_repetition) return [];

  const t = today();
  return Object.entries(u.spaced_repetition)
    .filter(([, date]) => date <= t)
    .filter(([id]) => stageQuestionIds == null || stageQuestionIds.includes(id))
    .map(([id]) => id);
}

/** 苦手問題IDリストを返す */
export function getWeakIds() {
  const user = getUser();
  return user?.weak_questions ?? [];
}

/** ステージクリア時に用語集カテゴリを解放する */
export function unlockGlossaryCategory(stageId) {
  const map = {
    stage1: 'お金の動き',
    stage2: '借方・貸方',
    stage3: '勘定科目',
    stage4: '現金取引の仕訳',
    stage5: '掛け取引の仕訳',
    stage6: '帳簿と財務諸表',
    stage7: '決算整理・手形取引',
    stage8: '固定資産の会計',
    stage11: '補助簿の種類',
    stage12: '試算表・決算',
  };
  const category = map[stageId];
  if (!category) return;
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  const cats = data.users[uid].unlocked_glossary_categories || [];
  if (!cats.includes(category)) {
    data.users[uid].unlocked_glossary_categories = [...cats, category];
    save(data);
  }
}

/** そのセットをすでにクリア済みか（再クリア報酬の判定用） */
export function isSetCleared(stageId, setId) {
  const user = getUser();
  return !!user?.progress?.[stageId]?.[setId]?.cleared;
}

/** 再クリア時の通常セット報酬（ノーミス3／1ミス2／それ以外1） */
export function calcRepeatAcorns(correctCount, totalCount) {
  const misses = totalCount - correctCount;
  if (misses <= 0) return 3;
  if (misses === 1) return 2;
  return 1;
}

/** 【検証用】全ステージ・全セットをクリア済みにし、用語集も全解放する */
export function unlockAllStages(stages, categoryNames) {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  const progress = data.users[uid].progress || {};
  for (const stage of stages) {
    progress[stage.id] = progress[stage.id] || {};
    for (const set of stage.sets) {
      const prev = progress[stage.id][set.id] || {};
      progress[stage.id][set.id] = {
        cleared: true,
        best_acc: Math.max(prev.best_acc || 0, 100),
      };
    }
  }
  data.users[uid].progress = progress;
  data.users[uid].unlocked_glossary_categories = [...categoryNames];
  save(data);
}

/** 既存データの移行処理（アプリ起動時に一度呼ぶ） */
export function migrateData() {
  const data = load();
  if (!data) return;
  const u = data.users[data.active_user];
  let changed = false;
  // ヒント導入前からのユーザーに初期ボーナス5個を付与（1回だけ）
  if (!u.hint_bonus_granted) {
    u.acorns_total += 5;
    u.hint_bonus_granted = true;
    changed = true;
  }
  // ストリークの基準を「学習した日」に分離（旧 last_login から引き継ぐ）
  if (!u.last_study && u.last_login) {
    u.last_study = u.last_login;
    changed = true;
  }
  if (changed) save(data);
}

/** ブラウザに永続ストレージを要求する（削除されにくくする） */
export function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

const BACKUP_PREFIX = 'DGB1:';

/** 全データをバックアップコード（文字列）にして返す。データがなければ null */
export function exportBackup() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const bytes = new TextEncoder().encode(raw);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return BACKUP_PREFIX + btoa(bin);
}

/** バックアップコードからデータを復元する。成功なら true */
export function importBackup(code) {
  const trimmed = (code || '').trim();
  if (!trimmed.startsWith(BACKUP_PREFIX)) return false;
  try {
    const bin = atob(trimmed.slice(BACKUP_PREFIX.length));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || !data.users || !data.active_user) return false;
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// クリア時のミス数で報酬を決定：noMiss=ノーミス, oneMiss=1ミス, twoMiss=2ミス
export function calcAcorns(stageId, correctCount, totalCount) {
  const misses = totalCount - correctCount;
  const table = {
    stage1:  { twoMiss: 3,  oneMiss: 6,  noMiss: 10 },
    stage2:  { twoMiss: 3,  oneMiss: 6,  noMiss: 10 },
    stage3:  { twoMiss: 4,  oneMiss: 8,  noMiss: 13 },
    stage4:  { twoMiss: 4,  oneMiss: 8,  noMiss: 13 },
    stage5:  { twoMiss: 4,  oneMiss: 8,  noMiss: 13 },
    stage6:  { twoMiss: 5,  oneMiss: 10, noMiss: 16 },
    stage7:  { twoMiss: 6,  oneMiss: 12, noMiss: 20 },
    stage8:  { twoMiss: 6,  oneMiss: 12, noMiss: 20 },
    stage9:  { twoMiss: 7,  oneMiss: 14, noMiss: 22 },
    stage14: { twoMiss: 7,  oneMiss: 14, noMiss: 22 },  // 株式会社・税金（表示順10）
    stage10: { twoMiss: 7,  oneMiss: 14, noMiss: 22 },
    stage11: { twoMiss: 8,  oneMiss: 16, noMiss: 25 },
    stage15: { twoMiss: 8,  oneMiss: 16, noMiss: 25 },  // 伝票会計（表示順13）
    stage12: { twoMiss: 8,  oneMiss: 16, noMiss: 25 },
    stage16: { twoMiss: 9,  oneMiss: 18, noMiss: 28 },  // 実践仕訳演習（表示順15）
    stage13: { twoMiss: 10, oneMiss: 20, noMiss: 30 },
  };
  const t = table[stageId] || table.stage1;
  if (misses <= 0) return t.noMiss;
  if (misses === 1) return t.oneMiss;
  return t.twoMiss;
}

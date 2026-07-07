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
    acorns_total: 0,
    acorns_today: 0,
    acorns_goal: 10,
    streak: 0,
    last_login: new Date().toISOString().slice(0, 10),
    title: 'どんぐりころころ',
    show_hint: true,
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

export function addAcorns(count) {
  const data = load();
  if (!data) return 0;
  const uid = data.active_user;
  data.users[uid].acorns_total += count;
  data.users[uid].acorns_today += count;

  // Update title
  const total = data.users[uid].acorns_total;
  data.users[uid].title = calcTitle(total);

  save(data);
  return data.users[uid].acorns_total;
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

export function updateStreak() {
  const data = load();
  if (!data) return;
  const uid = data.active_user;
  const today = new Date().toISOString().slice(0, 10);
  const last = data.users[uid].last_login;

  if (last === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (last === yesterday) {
    data.users[uid].streak += 1;
  } else {
    data.users[uid].streak = 1;
  }
  data.users[uid].last_login = today;
  data.users[uid].acorns_today = 0;
  save(data);
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

export function calcAcorns(stageId, correctCount, totalCount) {
  const ratio = correctCount / totalCount;
  const table = {
    stage1:  { half: 1, over: 3,  eight: 6,  full: 10 },
    stage2:  { half: 1, over: 3,  eight: 6,  full: 10 },
    stage3:  { half: 1, over: 4,  eight: 8,  full: 13 },
    stage4:  { half: 1, over: 4,  eight: 8,  full: 13 },
    stage5:  { half: 1, over: 4,  eight: 8,  full: 13 },
    stage6:  { half: 1, over: 5,  eight: 10, full: 16 },
    stage7:  { half: 1, over: 6,  eight: 12, full: 20 },
    stage8:  { half: 1, over: 6,  eight: 12, full: 20 },
    stage9:  { half: 1, over: 7,  eight: 14, full: 22 },
    stage14: { half: 1, over: 7,  eight: 14, full: 22 },  // 株式会社・税金（表示順10）
    stage10: { half: 1, over: 7,  eight: 14, full: 22 },
    stage11: { half: 1, over: 8,  eight: 16, full: 25 },
    stage15: { half: 1, over: 8,  eight: 16, full: 25 },  // 伝票会計（表示順13）
    stage12: { half: 1, over: 8,  eight: 16, full: 25 },
    stage13: { half: 2, over: 10, eight: 20, full: 30 },
  };
  const t = table[stageId] || table.stage1;
  if (ratio === 1)     return t.full;
  if (ratio >= 0.8)    return t.eight;
  if (ratio > 0.5)     return t.over;
  return t.half;
}

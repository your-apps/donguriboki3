/**
 * ルールベースの苦手分析コメント
 * @param {Object} stageAccuracy  { stage1: 75, stage2: 50, ... } ステージ別平均正答率
 * @param {string[]} weakQuestions  苦手問題IDの配列
 * @returns {string} ツム爺スタイルのコメント
 */
export function getWeakAnalysisComment(stageAccuracy, weakQuestions) {
  if (Object.keys(stageAccuracy).length === 0 && weakQuestions.length === 0) {
    return 'ここにはお主の学習の記録が集まるのじゃ。まずは最初の一問から始めてみるのじゃよ。';
  }
  const weakStages = Object.entries(stageAccuracy)
    .filter(([, acc]) => acc < 60)
    .map(([stage]) => stage);

  if (weakQuestions.length >= 5) {
    return '苦手な問題がたまってきたのう。専用セッションで一つずつ片付けていくのじゃ。';
  }
  if (weakStages.includes('stage1') || weakStages.includes('stage2')) {
    return '左右の区別をもう一度じっくり見直すのじゃ。基礎が固まれば先は開けるぞ。';
  }
  if (weakStages.includes('stage4') || weakStages.includes('stage5')) {
    return '仕訳の書き方で迷っておるようじゃな。現金の動きをイメージしながら考えてみるのじゃ。';
  }
  if (weakStages.includes('stage7')) {
    return '手形・商品券・小口現金は試験頻出じゃよ。「振り出した＝支払手形（負債）」「受け取った＝受取手形（資産）」をしっかり区別するのじゃ。';
  }
  if (weakStages.includes('stage8')) {
    return '固定資産の計算は焦らずに進めるのじゃ。取得原価→年間償却額→帳簿価額の順に計算する習慣をつけるのじゃよ。';
  }
  if (weakStages.includes('stage9')) {
    return '当座借越・仮払金・仮受金は「仮の科目」じゃ。正体が判明したら正しい科目に振り替えるというパターンを身につけるのじゃ。';
  }
  if (weakStages.includes('stage10')) {
    return '経過勘定は「いつのお金か」で考えるのじゃ。前払いか後払いか・前受けか後受けかを整理してから仕訳を切るのじゃよ。';
  }
  if (weakStages.includes('stage11')) {
    return '補助簿はどの取引がどの帳簿に記録されるかをパターンで覚えるのじゃ。商品有高帳の計算は先入先出か移動平均かを確認してから解くのじゃ。';
  }
  if (weakStages.includes('stage12')) {
    return '精算表は「費用・収益→損益計算書」「資産・負債・純資産→貸借対照表」と分類する練習を繰り返すのじゃ。当期純利益は最後に出てくるぞ。';
  }
  if (weakStages.includes('stage13')) {
    return '模擬試験で間違えた問題は必ず解説を読み直すのじゃ。どのステージの知識が弱いかを見極めて、そこに戻って復習するのじゃよ。';
  }
  return '着実に力がついてきておるぞ。この調子で続けるのじゃ。';
}

/**
 * user.progress からステージ別平均正答率を計算する
 * @param {Object} progress  user.progress オブジェクト
 * @returns {Object} { stage1: 75, stage2: 50, ... }
 */
export function calcStageAccuracy(progress) {
  const result = {};
  for (const [stageId, sets] of Object.entries(progress || {})) {
    const accs = Object.values(sets)
      .map(s => s.best_acc ?? 0)
      .filter(a => a > 0);
    if (accs.length > 0) {
      result[stageId] = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
    }
  }
  return result;
}

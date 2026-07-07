import { stage1 } from './stage1.js';
import { stage2 } from './stage2.js';
import { stage3 } from './stage3.js';
import { stage4 } from './stage4.js';
import { stage5 } from './stage5.js';
import { stage6 } from './stage6.js';
import { stage7 } from './stage7.js';
import { stage8 } from './stage8.js';
import { stage9 } from './stage9.js';
import { stage10 } from './stage10.js';
import { stage11 } from './stage11.js';
import { stage12 } from './stage12.js';
import { stage13 } from './stage13.js';
import { stage14 } from './stage14.js';
import { stage15 } from './stage15.js';

// 表示順（配列の並びがステージ番号になる）。
// stage14（株式会社の資本と税金）は特殊仕訳の後・決算整理の前、
// stage15（伝票会計）は補助簿の後・試算表の前に挿入する。
export const stages = [
  stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8, stage9,
  stage14,   // 10: 株式会社の資本と税金
  stage10,   // 11: 決算整理で締めくくる
  stage11,   // 12: 補助簿を使いこなす
  stage15,   // 13: 伝票会計をマスター
  stage12,   // 14: 試算表・精算表・財務諸表
  stage13,   // 15: 本番模擬試験
];

export const stageMap = Object.fromEntries(stages.map(s => [s.id, s]));

/** 問題IDから問題オブジェクトを返す */
export function findQuestion(questionId) {
  for (const stage of stages) {
    for (const set of stage.sets) {
      const q = set.questions.find(q => q.id === questionId);
      if (q) return { question: q, stageId: stage.id, setId: set.id };
    }
  }
  return null;
}

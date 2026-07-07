import tsumujiiImg from '../assets/tsumujii.webp';
import { getUser } from '../services/storage';
import { stages, findQuestion } from '../data/questions/index';
import { getWeakAnalysisComment, calcStageAccuracy } from '../services/analysis';

export default function Analysis({ onStartLesson }) {
  const user = getUser();
  if (!user) return null;

  const stageAccuracy = calcStageAccuracy(user.progress);
  const analysisComment = getWeakAnalysisComment(stageAccuracy, user.weak_questions ?? []);

  return (
    <div className="app-container flex flex-col">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold" style={{ color: 'var(--br600)' }}>分析</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* ツム爺コメント */}
        <div className="flex items-end gap-3">
          <img src={tsumujiiImg} alt="ツム爺" className="object-contain flex-shrink-0" style={{ width: 67, height: 67 }} />
          <div className="bubble bubble-tail-left text-sm flex-1" style={{ color: 'var(--br600)', marginBottom: 14 }}>
            {analysisComment}
          </div>
        </div>

        {/* ステージ別正答率 */}
        <div className="clay-card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--br600)' }}>
            ステージ別正答率
          </h2>
          <div className="space-y-3">
            {stages.map((stage, stageIdx) =>
              stage.sets.map((set, setIdx) => {
                const data = user.progress?.[stage.id]?.[set.id];
                const acc = data?.best_acc ?? null;
                const color = acc === null ? '#9CA3AF'
                  : acc >= 80 ? 'var(--gr500)'
                  : acc >= 60 ? 'var(--or500)'
                  : '#E85A4A';
                const barColor = acc === null ? '#D4C4A8'
                  : acc >= 80 ? 'var(--gr300)'
                  : acc >= 60 ? 'var(--or300)'
                  : '#E85A4A';
                return (
                  <div key={set.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--br600)' }}>
                        St.{stageIdx + 1}-{setIdx + 1} {set.title}
                      </span>
                      <span style={{ color }}>
                        {acc === null ? '未挑戦' : `${acc}%`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--or100)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: acc === null ? '0%' : `${acc}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 苦手問題リスト */}
        {user.weak_questions.length > 0 && (
          <div className="clay-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: 'var(--br600)' }}>
                苦手問題リスト
              </h2>
              {onStartLesson && (
                <button
                  className="clay-btn px-3 py-1.5 text-xs font-bold text-white"
                  style={{ background: '#E85A4A' }}
                  onClick={() => onStartLesson('weak', 'weak_session')}
                >
                  まとめて挑戦
                </button>
              )}
            </div>
            <div className="space-y-2">
              {user.weak_questions.map(qid => {
                const found = findQuestion(qid);
                const q = found?.question;
                const consecutive = user.weak_consecutive_correct?.[qid] ?? 0;
                return (
                  <div
                    key={qid}
                    className="rounded-xl p-3"
                    style={{
                      background: 'var(--or50)',
                      border: '1px solid var(--or200)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--br600)' }}>
                          {q?.scenario ?? qid}
                        </p>
                        {/* 連続正解プログレス */}
                        <div className="flex items-center gap-1 mt-1.5">
                          {[0, 1].map(i => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{
                                background: consecutive > i ? 'var(--gr300)' : 'var(--or100)',
                                border: `1.5px solid ${consecutive > i ? 'var(--gr500)' : 'var(--or200)'}`,
                              }}
                            >
                              {consecutive > i && (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                          ))}
                          <span className="text-xs ml-1" style={{ color: 'var(--br400)' }}>
                            {consecutive}/2 連続正解で卒業
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#FFE4E1', color: '#E85A4A' }}>
                        苦手
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {user.weak_questions.length === 0 && (
          <div className="clay-card p-6 text-center">
            <div className="flex justify-center mb-2">
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="12,2 14.9,8.6 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9.1,8.6" fill="var(--or300)" stroke="var(--or500)" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--br400)' }}>
              苦手問題はないのう。よく頑張っておるな！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

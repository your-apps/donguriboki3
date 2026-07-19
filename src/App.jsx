import { useState } from 'react';
import { isFirstLaunch, requestPersistentStorage, addAcorns, updateStreak, migrateData } from './services/storage';
import { stageMap } from './data/questions/index';
import StatementLesson from './screens/StatementLesson';
import ExamLesson from './screens/ExamLesson';

// 大問モード（表の空欄補充）のセットかどうか
function isStatementSet(stageId, setId) {
  return !!stageMap[stageId]?.sets.find(s => s.id === setId)?.statement;
}

// 模擬試験モードのセットかどうか
function isExamSet(stageId, setId) {
  return !!stageMap[stageId]?.sets.find(s => s.id === setId)?.exam;
}

// 進捗データが消されにくいよう、起動時に一度だけ永続ストレージを要求する
requestPersistentStorage();
// 既存データの移行（初期ボーナス付与・ストリーク基準の分離）
migrateData();
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Lesson from './screens/Lesson';
import GameOver from './screens/GameOver';
import Result from './screens/Result';
import Analysis from './screens/Analysis';
import Glossary from './screens/Glossary';
import Settings from './screens/Settings';
import BottomNav from './components/BottomNav';

export default function App() {
  const [screen, setScreen] = useState(() => isFirstLaunch() ? 'onboarding' : 'home');
  const [tab, setTab] = useState('home');
  const [lessonState, setLessonState] = useState(null);
  const [resultState, setResultState] = useState(null);
  const [gameOverState, setGameOverState] = useState(null);

  function startLesson(stageId, setId) {
    setLessonState({ stageId, setId, revived: false });
    setScreen('lesson');
  }

  function handleLessonFinish({ stageId, setId, correct, total }) {
    setResultState({ stageId, setId, correct, total });
    setScreen('result');
    setLessonState(null);
  }

  function handleGameOver(data) {
    addAcorns(1); // 参加賞：ゲームオーバーでもどんぐり1個
    updateStreak(); // 挑戦した日も学習日としてストリークに数える
    setGameOverState(data);
    setScreen('gameover');
  }

  function handleRevive() {
    if (!gameOverState) return;
    const { stageId, setId, questions, results, currentIdx } = gameOverState;
    // 最後に間違えた問題から再挑戦できるよう、その問題の結果は除外
    const trimmedResults = (results ?? []).slice(0, currentIdx);
    setLessonState({
      stageId,
      setId,
      revived: true,
      revivedFromIdx: currentIdx,
      revivedResults: trimmedResults,
      revivedQuestions: questions ?? [],
    });
    setGameOverState(null);
    setScreen('lesson');
  }

  function goHome() {
    setScreen('home');
    setTab('home');
    setLessonState(null);
    setResultState(null);
    setGameOverState(null);
  }

  function handleTabChange(newTab) {
    setTab(newTab);
    setScreen(newTab);
  }

  const showBottomNav = ['home', 'analysis', 'glossary'].includes(screen);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {screen === 'onboarding' && (
        <Onboarding onComplete={() => { setScreen('home'); setTab('home'); }} />
      )}

      {screen === 'home' && (
        <div className="app-container flex flex-col" style={{ paddingBottom: showBottomNav ? 64 : 0 }}>
          <Home
            onStartLesson={startLesson}
            onNavigate={s => {
              if (s === 'settings') setScreen('settings');
              else handleTabChange(s);
            }}
          />
        </div>
      )}

      {screen === 'analysis' && (
        <div className="app-container flex flex-col" style={{ paddingBottom: showBottomNav ? 64 : 0 }}>
          <Analysis onStartLesson={startLesson} />
        </div>
      )}

      {screen === 'glossary' && (
        <div className="app-container flex flex-col" style={{ paddingBottom: showBottomNav ? 64 : 0 }}>
          <Glossary />
        </div>
      )}

      {screen === 'settings' && (
        <Settings onBack={() => setScreen('home')} />
      )}

      {screen === 'lesson' && lessonState && (
        isExamSet(lessonState.stageId, lessonState.setId) ? (
          <ExamLesson
            stageId={lessonState.stageId}
            setId={lessonState.setId}
            onHome={goHome}
          />
        ) : isStatementSet(lessonState.stageId, lessonState.setId) ? (
          <StatementLesson
            stageId={lessonState.stageId}
            setId={lessonState.setId}
            onHome={goHome}
          />
        ) : (
          <Lesson
            stageId={lessonState.stageId}
            setId={lessonState.setId}
            revived={lessonState.revived}
            revivedFromIdx={lessonState.revivedFromIdx}
            revivedResults={lessonState.revivedResults}
            revivedQuestions={lessonState.revivedQuestions}
            onFinish={handleLessonFinish}
            onGameOver={handleGameOver}
            onHome={goHome}
          />
        )
      )}

      {screen === 'gameover' && gameOverState && (
        <GameOver
          sessionData={gameOverState}
          onRevive={handleRevive}
          onHome={goHome}
        />
      )}

      {screen === 'result' && resultState && (
        <Result
          stageId={resultState.stageId}
          setId={resultState.setId}
          correct={resultState.correct}
          total={resultState.total}
          onHome={goHome}
        />
      )}

      {showBottomNav && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 430,
            zIndex: 50,
          }}
        >
          <BottomNav current={tab} onNavigate={handleTabChange} />
        </div>
      )}
    </div>
  );
}

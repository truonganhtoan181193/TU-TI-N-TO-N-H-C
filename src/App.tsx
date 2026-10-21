import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Timer,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Award,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Compass,
} from 'lucide-react';
import {
  Question,
  UserAnswerRecord,
  TreasureType,
  ScoreHistoryEntry,
  ScreenType,
  ChapterId,
  REALMS,
  CHAP1_STORY_FRAMES,
} from './types';
import { generateAllChap1Questions } from './data/chap1QuestionGenerator';
import { generateAllQuestions as generateAllChap2Questions } from './data/questionGenerator';
import { MathText } from './components/MathText';
import { TopBar } from './components/TopBar';
import { playSound, setBgmTheme, unlockAudio, triggerHaptic } from './utils/audio';
import { fireConfetti } from './utils/confetti';

const STORAGE_KEY = 'tu_tien_toan_hoc_scores_v2';

export default function App() {
  // Global Player & Chapter State
  const [currentChapter, setCurrentChapter] = useState<ChapterId>(1);
  const [screen, setScreen] = useState<ScreenType>('c1_intro');
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreHistoryEntry[]>([]);

  // CHAP 1 STATE: Thám Hiểm Di Tích Cổ
  const [c1Questions, setC1Questions] = useState<Question[]>([]);
  const [c1Index, setC1Index] = useState(0);
  const [c1Score, setC1Score] = useState(0);
  const [c1CorrectCount, setC1CorrectCount] = useState(0);
  const [c1Answers, setC1Answers] = useState<UserAnswerRecord[]>([]);
  const [c1SelectedOption, setC1SelectedOption] = useState<number | null>(null);
  const [c1Locked, setC1Locked] = useState(false);
  const [c1Feedback, setC1Feedback] = useState<{ text: string; isGood: boolean } | null>(null);

  // CHAP 2 STATE: Tu Tiên Giới
  const [c2Treasure, setC2Treasure] = useState<TreasureType>('');
  const [c2Questions, setC2Questions] = useState<Question[]>([]);
  const [c2Index, setC2Index] = useState(0);
  const [c2Score, setC2Score] = useState(0);
  const [c2CorrectCount, setC2CorrectCount] = useState(0);
  const [c2RealmIndex, setC2RealmIndex] = useState(0);
  const [c2Answers, setC2Answers] = useState<UserAnswerRecord[]>([]);
  const [c2JadeUsed, setC2JadeUsed] = useState(false);
  const [c2SkipUsed, setC2SkipUsed] = useState(false);
  const [c2SelectedOption, setC2SelectedOption] = useState<number | null>(null);
  const [c2Locked, setC2Locked] = useState(false);
  const [c2Feedback, setC2Feedback] = useState<{ text: string; isGood: boolean } | null>(null);

  // Timer State (Shared)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const c2MaxTime = c2Treasure === 'time' ? 30 : 20;
  const [timeLeft, setTimeLeft] = useState(20);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLeaderboard(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Unlock Web Audio on first user interaction (tap/click/press anywhere)
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Synchronize background music (BGM) with screen, chapter and sound toggle
  useEffect(() => {
    if (!soundEnabled) {
      setBgmTheme('none', false);
      return;
    }

    if (screen === 'transition_to_c2') {
      // Transition portal theme
      setBgmTheme('transition', true);
    } else if (screen === 'c2_climax' || screen === 'c2_outro') {
      // Outro & Victory fanfare theme
      setBgmTheme('outro', true);
    } else if (currentChapter === 1) {
      // Chap 1: Thám hiểm di tích cổ theme
      setBgmTheme('chap1', true);
    } else if (currentChapter === 2) {
      // Chap 2: Tiến vào Tu Tiên Giới theme
      setBgmTheme('chap2', true);
    }
  }, [screen, currentChapter, soundEnabled]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // -------------------------------------------------------------
  // TIMER HOOK FOR QUIZ SCREENS
  // -------------------------------------------------------------
  useEffect(() => {
    if (screen !== 'c1_quiz' && screen !== 'c2_quiz') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const isCurrentLocked = screen === 'c1_quiz' ? c1Locked : c2Locked;
    if (isCurrentLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        if (prev <= 4) {
          playSound('tick', soundEnabled);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, c1Locked, c2Locked, c1Index, c2Index]);

  // Timeout handler for both chapters
  const handleTimeout = () => {
    if (screen === 'c1_quiz') {
      if (c1Locked) return;
      setC1Locked(true);
      triggerHaptic();
      playSound('wrong', soundEnabled);

      const q = c1Questions[c1Index];
      const record: UserAnswerRecord = {
        stage: q.stage,
        question: q,
        selectedIndex: -1,
        isCorrect: false,
        isTimeout: true,
      };
      setC1Answers((prev) => [...prev, record]);
      setC1Feedback({
        text: '⌛ Hết thời gian suy nghĩ! Cơ quan chưa được kích hoạt.',
        isGood: false,
      });
    } else if (screen === 'c2_quiz') {
      if (c2Locked) return;
      setC2Locked(true);
      triggerHaptic();
      playSound('wrong', soundEnabled);

      const q = c2Questions[c2Index];
      const record: UserAnswerRecord = {
        stage: q.stage,
        question: q,
        selectedIndex: -1,
        isCorrect: false,
        isTimeout: true,
      };
      setC2Answers((prev) => [...prev, record]);
      setC2Feedback({
        text: `⌛ Hết thời gian suy nghĩ! Cảnh giới giữ nguyên: [${REALMS[c2RealmIndex]}].`,
        isGood: false,
      });
    }
  };

  // -------------------------------------------------------------
  // CHAP 1 HANDLERS
  // -------------------------------------------------------------
  const handleStartChap1 = () => {
    if (!playerName.trim() || !playerClass.trim()) {
      showToast('Vui lòng nhập đầy đủ Họ tên và Lớp nhé!');
      return;
    }

    const generated = generateAllChap1Questions();
    setC1Questions(generated);
    setC1Index(0);
    setC1Score(0);
    setC1CorrectCount(0);
    setC1Answers([]);
    setC1SelectedOption(null);
    setC1Locked(false);
    setC1Feedback(null);
    setTimeLeft(20);
    setCurrentChapter(1);
    setScreen('c1_quiz');
    unlockAudio();
    playSound('magic', soundEnabled);
  };

  const handleC1Answer = (optionIdx: number) => {
    if (c1Locked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setC1Locked(true);
    setC1SelectedOption(optionIdx);
    triggerHaptic();

    const q = c1Questions[c1Index];
    const isCorrect = optionIdx === q.correctIndex;
    const frameInfo = CHAP1_STORY_FRAMES[q.stage - 1];

    if (isCorrect) {
      setC1Score((prev) => prev + 10);
      setC1CorrectCount((prev) => prev + 1);
      playSound('correct', soundEnabled);
      setC1Feedback({
        text: `Chính xác! ${frameInfo.successMsg}`,
        isGood: true,
      });
    } else {
      playSound('wrong', soundEnabled);
      setC1Feedback({
        text: 'Chưa chính xác. Cơ quan chưa được kích hoạt, hãy tiếp tục cố gắng ở câu tiếp theo!',
        isGood: false,
      });
    }

    const record: UserAnswerRecord = {
      stage: q.stage,
      question: q,
      selectedIndex: optionIdx,
      isCorrect,
    };
    setC1Answers((prev) => [...prev, record]);
  };

  const handleC1NextQuestion = () => {
    if (c1Index < 9) {
      const nextIdx = c1Index + 1;
      setC1Index(nextIdx);
      setC1SelectedOption(null);
      setC1Locked(false);
      setC1Feedback(null);
      setTimeLeft(20);
    } else {
      // Completed Chap 1 10 questions -> go to Bí mật sau di tích
      saveScoreToLeaderboard(1, c1Score + (c1SelectedOption === c1Questions[c1Index]?.correctIndex ? 10 : 0), c1CorrectCount);
      setScreen('c1_ruins_secret');
      playSound('magic', soundEnabled);
    }
  };

  // -------------------------------------------------------------
  // CHAP 2 HANDLERS (Tu Tiên Giới)
  // Note: Player name and class are already retained! No re-prompt!
  // -------------------------------------------------------------
  const handleStartChap2 = () => {
    if (!c2Treasure) {
      showToast('Vui lòng chọn một pháp bảo trước khi vào ải.');
      return;
    }

    const generated = generateAllChap2Questions();
    setC2Questions(generated);
    setC2Index(0);
    setC2Score(0);
    setC2CorrectCount(0);
    setC2RealmIndex(0);
    setC2Answers([]);
    setC2JadeUsed(false);
    setC2SkipUsed(false);
    setC2SelectedOption(null);
    setC2Locked(false);
    setC2Feedback(null);
    setTimeLeft(c2Treasure === 'time' ? 30 : 20);

    setCurrentChapter(2);
    setScreen('c2_quiz');
    unlockAudio();
    playSound('magic', soundEnabled);
  };

  const handleC2Answer = (optionIdx: number) => {
    if (c2Locked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setC2Locked(true);
    setC2SelectedOption(optionIdx);
    triggerHaptic();

    const q = c2Questions[c2Index];
    const isCorrect = optionIdx === q.correctIndex;

    let newScore = c2Score;
    let newRealm = c2RealmIndex;
    let newCorrect = c2CorrectCount;
    let jadeSavedThisTurn = false;

    if (isCorrect) {
      newScore += 10;
      newCorrect += 1;
      newRealm = Math.min(newRealm + 1, REALMS.length - 1);
      setC2Score(newScore);
      setC2CorrectCount(newCorrect);
      setC2RealmIndex(newRealm);

      playSound('correct', soundEnabled);
      if (newRealm > c2RealmIndex) {
        setTimeout(() => playSound('levelup', soundEnabled), 200);
      }

      setC2Feedback({
        text: `Chính xác! +10 aura tu vi. Thăng cấp cảnh giới lên [${REALMS[newRealm]}].`,
        isGood: true,
      });
    } else {
      playSound('wrong', soundEnabled);

      // Check Ngọc Như Ý
      if (c2Treasure === 'jade' && !c2JadeUsed && q.stage <= 9) {
        setC2JadeUsed(true);
        jadeSavedThisTurn = true;
        newRealm = Math.min(newRealm + 1, REALMS.length - 1);
        setC2RealmIndex(newRealm);

        setC2Feedback({
          text: `🟢 Ngọc Như Ý phát sáng hộ thể! Dù chưa đúng, pháp bảo cứu nguy giúp bạn vẫn thăng tiến lên [${REALMS[newRealm]}].`,
          isGood: true,
        });
      } else {
        setC2Feedback({
          text: `Chưa chính xác. Cảnh giới giữ nguyên: [${REALMS[c2RealmIndex]}].`,
          isGood: false,
        });
      }
    }

    const record: UserAnswerRecord = {
      stage: q.stage,
      question: q,
      selectedIndex: optionIdx,
      isCorrect,
      jadeSaved: jadeSavedThisTurn,
    };
    setC2Answers((prev) => [...prev, record]);
  };

  const handleC2UseSkip = () => {
    if (c2Treasure !== 'skip' || c2SkipUsed || c2Index >= 9 || c2Locked) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setC2SkipUsed(true);
    setC2Locked(true);
    triggerHaptic();
    playSound('magic', soundEnabled);

    const q = c2Questions[c2Index];
    const newRealm = Math.min(c2RealmIndex + 1, REALMS.length - 1);
    setC2RealmIndex(newRealm);

    const record: UserAnswerRecord = {
      stage: q.stage,
      question: q,
      selectedIndex: -1,
      isCorrect: false,
      isSkipped: true,
    };
    setC2Answers((prev) => [...prev, record]);

    showToast('🔮 Đại Diễn Quyết kích hoạt! Bỏ qua cửa ải và +1 cảnh giới.');
    handleC2NextQuestion();
  };

  const handleC2NextQuestion = () => {
    if (c2Index < 9) {
      const nextIdx = c2Index + 1;
      setC2Index(nextIdx);
      setC2SelectedOption(null);
      setC2Locked(false);
      setC2Feedback(null);
      setTimeLeft(c2Treasure === 'time' ? 30 : 20);
    } else {
      fireConfetti();
      playSound('levelup', soundEnabled);
      saveScoreToLeaderboard(2, c2Score, c2CorrectCount, REALMS[c2RealmIndex]);
      setScreen('c2_climax');
    }
  };

  // Save score helper
  const saveScoreToLeaderboard = (
    chap: number,
    finalScore: number,
    finalCorrect: number,
    finalRealm?: string
  ) => {
    const treasureNames: Record<string, string> = {
      jade: 'Ngọc Như Ý',
      time: 'Pháp Tắc Thời Gian',
      skip: 'Đại Diễn Quyết',
    };

    const entry: ScoreHistoryEntry = {
      id: Date.now().toString(),
      name: playerName || 'Nhà thám hiểm',
      className: playerClass || 'Tự do',
      score: finalScore,
      correctCount: finalCorrect,
      realm: finalRealm,
      treasureName: chap === 2 ? treasureNames[c2Treasure] || 'Không' : undefined,
      chapter: chap,
      chapterTitle:
        chap === 1 ? 'Chương 1: Thám Hiểm Di Tích' : 'Chương 2: Tiến Vào Tu Tiên Giới',
      timestamp: Date.now(),
    };

    const updated = [entry, ...leaderboard].slice(0, 20);
    setLeaderboard(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Full restart
  const handleFullRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentChapter(1);
    setScreen('c1_intro');
  };

  const getTreasureDisplayName = (t: TreasureType) => {
    switch (t) {
      case 'jade':
        return 'Ngọc Như Ý';
      case 'time':
        return 'Pháp Tắc Thời Gian';
      case 'skip':
        return 'Đại Diễn Quyết';
      default:
        return 'Chưa chọn';
    }
  };

  // Quick switch chapter handler
  const handleSwitchChapter = (target: ChapterId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (target === 1) {
      setCurrentChapter(1);
      setScreen('c1_intro');
    } else {
      setCurrentChapter(2);
      // If player already registered, go to c2_rules directly
      if (playerName.trim() && playerClass.trim()) {
        setScreen('c2_rules');
      } else {
        setScreen('transition_to_c2');
      }
    }
  };

  // Current active questions
  const currentC1Question = c1Questions[c1Index];
  const currentC2Question = c2Questions[c2Index];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-amber-400/80 text-amber-300 px-4 py-2 rounded-full shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <TopBar
        chapter={currentChapter}
        playerName={playerName}
        realmIndex={c2RealmIndex}
        chap1Seals={c1CorrectCount}
        score={currentChapter === 1 ? c1Score : c2Score}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          unlockAudio();
          setSoundEnabled((prev) => !prev);
        }}
        onSwitchChapter={handleSwitchChapter}
        onOpenLeaderboard={
          screen !== 'c1_quiz' && screen !== 'c2_quiz'
            ? () => setScreen(currentChapter === 1 ? 'c1_result' : 'c2_leaderboard')
            : undefined
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* CHAP 1 - LỜI MỞ ĐẦU                                      */}
        {/* ======================================================== */}
        {screen === 'c1_intro' && (
          <div className="flex flex-col items-center text-center py-4 sm:py-8 max-w-xl mx-auto w-full">
            <div className="relative mb-4 sm:mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-amber-400 to-indigo-500 p-1 shadow-xl shadow-cyan-500/10 glow-amber flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-4xl sm:text-5xl">
                  🏺
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                CHƯƠNG 1
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
              Tiếng gọi từ vùng đất lạ
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-50 tracking-tight mb-2">
              Thám Hiểm <span className="text-cyan-300">Di Tích Cổ</span>
            </h1>

            {/* Motto Banner */}
            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 rounded-xl px-4 py-2 my-2 shadow-sm">
              <span className="text-xs sm:text-sm font-black text-amber-300">
                &ldquo;ĐIỂM SỐ CỦA TA, DO TA QUYẾT ĐỊNH!&rdquo;
              </span>
            </div>

            <div className="text-xs text-slate-400 font-semibold mb-4">
              ✦ ĐẠI GIÁO CHỦ TRƯƠNG ANH TOÀN – 0329056500 ✦
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
              Trong một chuyến thám hiểm đến vùng đất chưa từng được ghi chép trên bản đồ, bạn phát hiện những dấu tích kỳ lạ của một nền văn minh cổ xưa. Không ai biết nơi này chứa đựng điều gì. Nhưng một cảm giác thôi thúc khiến bạn quyết định tiến sâu hơn vào khu di tích.
            </p>

            <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-6 text-center">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">📜</div>
                <div className="text-[11px] font-bold text-slate-200">Manh Mối</div>
                <div className="text-[9px] text-slate-400">Bản đồ cổ xưa</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">🗝️</div>
                <div className="text-[11px] font-bold text-slate-200">10 Phong Ấn</div>
                <div className="text-[9px] text-slate-400">Đại số lớp 7</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">🌌</div>
                <div className="text-[11px] font-bold text-slate-200">Dị Giới</div>
                <div className="text-[9px] text-slate-400">Cổng sang Chương 2</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
              <button
                onClick={() => setScreen('c1_map')}
                className="w-full min-h-[48px] bg-gradient-to-r from-cyan-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-transform"
              >
                <span>BẮT ĐẦU THÁM HIỂM</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentChapter(2);
                  setScreen(playerName ? 'c2_rules' : 'transition_to_c2');
                }}
                className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-colors"
              >
                <span>Chuyển thẳng sang Chương 2 ➜</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1 - BẢN ĐỒ BÍ ẨN                                    */}
        {/* ======================================================== */}
        {screen === 'c1_map' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 max-w-md mx-auto w-full text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-3xl mx-auto mb-3">
              📜
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
              Mảnh bản đồ cổ
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-3">
              Manh Mối Đầu Tiên
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Giữa đống tàn tích, bạn tìm thấy một mảnh bản đồ được khắc những ký hiệu khó hiểu. Trên bản đồ có ghi một dòng chữ đã phai mờ:
              <br />
              <i className="text-amber-300 font-medium block mt-2">
                &ldquo;Chỉ người vượt qua thử thách mới có thể nhìn thấy bí mật cuối cùng.&rdquo;
              </i>
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('c1_intro')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => setScreen('c1_register')}
                className="flex-[2] min-h-[46px] bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-400/20 active:scale-[0.98] transition-transform"
              >
                <span>TIẾN VÀO DI TÍCH</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1 - GHI DANH NHÀ THÁM HIỂM                          */}
        {/* ======================================================== */}
        {screen === 'c1_register' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 max-w-md mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-xl shrink-0">
                🗝️
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Cánh cửa thử thách
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Ghi Danh Nhà Thám Hiểm
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Mười phong ấn trên cửa lần lượt phát sáng. Giọng nói bí ẩn vang lên: &ldquo;Muốn khám phá bí mật di tích, hãy chứng minh khả năng tư duy qua 10 thử thách Đại số.&rdquo;
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="c1StudentName"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  HỌ VÀ TÊN NHÀ THÁM HIỂM
                </label>
                <input
                  id="c1StudentName"
                  type="text"
                  maxLength={50}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full min-h-[46px] bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 text-sm text-slate-100 outline-none transition-colors"
                  autoComplete="name"
                />
              </div>

              <div>
                <label
                  htmlFor="c1StudentClass"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  LỚP HỌC
                </label>
                <input
                  id="c1StudentClass"
                  type="text"
                  maxLength={20}
                  placeholder="Ví dụ: 7/4"
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                  className="w-full min-h-[46px] bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 text-sm text-slate-100 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('c1_map')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={handleStartChap1}
                className="flex-[2] min-h-[46px] bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-400/20 active:scale-[0.98] transition-transform"
              >
                <span>BƯỚC VÀO THỬ THÁCH</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1 - 10 THỬ THÁCH ĐẠI SỐ                             */}
        {/* ======================================================== */}
        {screen === 'c1_quiz' && currentC1Question && (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
            {/* Stage header info from CHAP1_STORY_FRAMES */}
            {(() => {
              const frameInfo = CHAP1_STORY_FRAMES[currentC1Question.stage - 1];
              return (
                <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-cyan-400">
                      ẢI {currentC1Question.stage < 10 ? `0${currentC1Question.stage}` : currentC1Question.stage}/10
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px] sm:max-w-xs">
                      {frameInfo?.title || currentC1Question.tag}
                    </span>
                  </div>

                  {/* Timer */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums transition-colors ${
                      timeLeft <= 5
                        ? 'bg-rose-500/20 border border-rose-500/60 text-rose-300 animate-pulse'
                        : timeLeft <= 8
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
                  </div>
                </div>
              );
            })()}

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-300 transition-all duration-300"
                style={{
                  width: `${((currentC1Question.stage - 1) / 10) * 100}%`,
                }}
              />
            </div>

            {/* Status strip */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-lg text-slate-300">
              <div className="flex items-center gap-1.5">
                <span>⚡ Điểm:</span>
                <span className="font-bold text-amber-300">{c1Score} aura</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏛️ Phong ấn đã giải:</span>
                <span className="font-bold text-cyan-300">{c1CorrectCount}/10</span>
              </div>
            </div>

            {/* Main Question Card */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    {CHAP1_STORY_FRAMES[currentC1Question.stage - 1]?.title}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                    <MathText text={currentC1Question.prompt} />
                  </h3>
                </div>
                <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {currentC1Question.emoji}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {currentC1Question.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = c1SelectedOption === idx;
                  const isCorrect = idx === currentC1Question.correctIndex;

                  let btnStyle =
                    'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60';
                  let badgeStyle = 'bg-slate-800 text-slate-300';

                  if (c1Locked) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40';
                      badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isSelected) {
                      btnStyle =
                        'bg-rose-950/50 border-rose-500 text-rose-200 ring-1 ring-rose-500/40';
                      badgeStyle = 'bg-rose-500 text-white font-black';
                    } else {
                      btnStyle = 'opacity-50 bg-slate-950 border-slate-800/60 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={c1Locked}
                      onClick={() => handleC1Answer(idx)}
                      className={`min-h-[50px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-[0.98] ${btnStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-sm ${badgeStyle}`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 font-semibold text-xs sm:text-sm overflow-x-auto">
                        <MathText text={opt} />
                      </span>
                      {c1Locked && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {c1Locked && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banner */}
              {c1Feedback && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
                    c1Feedback.isGood
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {c1Feedback.isGood ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="leading-relaxed">{c1Feedback.text}</span>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                <div className="text-slate-500 text-[11px]">
                  {!c1Locked && 'Chọn một đáp án để kích hoạt cơ quan.'}
                </div>

                {c1Locked && (
                  <button
                    type="button"
                    onClick={handleC1NextQuestion}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-transform ml-auto"
                  >
                    <span>
                      {currentC1Question.stage === 10
                        ? 'Mở cánh cổng bí ẩn ➜'
                        : 'Thử thách tiếp theo ➜'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1 - BÍ MẬT SAU DI TÍCH                              */}
        {/* ======================================================== */}
        {screen === 'c1_ruins_secret' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center text-4xl mx-auto mb-4">
              🏛️
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
              Hồi III · Cánh Cổng Dị Giới
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-3">
              Bí Mật Sau Di Tích
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Mười dấu ấn đồng loạt phát sáng! Khối đá cổ bắt đầu rung chuyển, những bức tường trong căn phòng trung tâm chuyển động. Sau khối đá cổ, một cánh cổng khổng lồ từ từ hiện ra — cánh cổng chưa từng xuất hiện trên bất kỳ tấm bản đồ nào!
            </p>
            <button
              onClick={() => setScreen('c1_boundary')}
              className="w-full min-h-[48px] bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-transform"
            >
              <span>KHÁM PHÁ CÁNH CỔNG ➜</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1 - BƯỚC QUA RANH GIỚI                              */}
        {/* ======================================================== */}
        {screen === 'c1_boundary' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-4xl mx-auto mb-4 glow-amber">
              🌌
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
              Ranh giới hai thế giới
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-3">
              Bước Qua Ranh Giới
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Phía bên kia cánh cổng là một thế giới rộng lớn với núi non hùng vĩ, những hòn đảo lơ lửng và ánh sáng huyền ảo. Giọng nói bí ẩn vang lên:
              <br />
              <i className="text-amber-300 font-semibold block mt-2">
                &ldquo;Cánh cổng đã được khai mở. Nếu đã đặt chân đến đây, hãy sẵn sàng khám phá một thế giới hoàn toàn mới.&rdquo;
              </i>
            </p>
            <button
              onClick={() => setScreen('c1_result')}
              className="w-full min-h-[48px] bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-transform"
            >
              <span>MỞ BẢNG THÀNH TÍCH ➜</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1: BẢNG THÀNH TÍCH                                  */}
        {/* ======================================================== */}
        {screen === 'c1_result' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
                Thám hiểm hoàn tất · Chương 1
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                Bảng Thành Tích Khám Phá
              </h2>
              <div className="text-sm sm:text-base font-black text-cyan-300 mt-1">
                ✦ Giải Khai {c1CorrectCount}/10 Phong Ấn Cổ ✦
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
                  {c1Score}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Tổng aura
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {c1CorrectCount}/10
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Câu đúng
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-cyan-400 tabular-nums">
                  {Math.round((c1CorrectCount / 10) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Độ chính xác
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center text-xs text-slate-300 mb-5 leading-relaxed">
              Chúc mừng bạn đạt danh hiệu{' '}
              <b className="text-cyan-300">
                [
                {c1CorrectCount === 10
                  ? 'Bậc Thầy Giải Mã Cổ Đại'
                  : c1CorrectCount >= 8
                  ? 'Nhà Thám Hiểm Lừng Danh'
                  : c1CorrectCount >= 5
                  ? 'Thám Hiểm Viên Bản Lĩnh'
                  : 'Nhà Thám Hiểm Tập Sự'}
                ]
              </b>
              ! Bạn đã hoàn thành 10 thử thách Đại số để mở rộng cánh cổng dẫn sang Tu Tiên Giới.
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {c1Answers.length > 0 && (
                <button
                  onClick={() => setScreen('c1_review')}
                  className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Xem đáp án chi tiết</span>
                </button>
              )}

              <button
                onClick={() => setScreen('transition_to_c2')}
                className="flex-[1.5] min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Chuyển cảnh Chương 2 ➜</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 1: ÔN TẬP ĐÁP ÁN (NO LENGTHY EXPLANATION)           */}
        {/* ======================================================== */}
        {screen === 'c1_review' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Thám hiểm kiến thức · Chương 1
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Ôn Tập 10 Câu Đại Số
                </h2>
              </div>
              <button
                onClick={() => setScreen('c1_result')}
                className="text-xs text-cyan-400 hover:underline font-bold"
              >
                Về Bảng Thành Tích
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 mb-5">
              {c1Questions.map((q, i) => {
                const ans = c1Answers[i];
                const isCorrect = ans?.isCorrect;

                return (
                  <div
                    key={q.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-cyan-300">
                        CÂU {q.stage} · {q.tag}
                      </span>
                      <span
                        className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isCorrect ? 'Đúng (+10 aura)' : 'Chưa đúng'}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-200 mb-2 leading-relaxed">
                      <MathText text={q.prompt} />
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px]">
                        Đáp án đúng:
                      </span>
                      <span className="font-black text-emerald-400 text-xs">
                        <MathText text={q.correctAnswerText} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('c1_result')}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => setScreen('transition_to_c2')}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Chuyển cảnh Chương 2</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TRANSITION SCREEN: TIẾN VÀO TU TIÊN GIỚI                */}
        {/* (Smooth bridge to Chương 2 - no name/class re-prompt!)     */}
        {/* ======================================================== */}
        {screen === 'transition_to_c2' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto w-full text-center shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-purple-500 to-cyan-400 p-1 mx-auto mb-4 glow-amber">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
                ☯
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2">
              Tiến Vào Tu Tiên Giới
            </h2>

            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 rounded-xl px-4 py-2 my-2 shadow-sm">
              <span className="text-xs sm:text-sm font-black text-amber-300">
                &ldquo;ĐIỂM SỐ CỦA TA, DO TA QUYẾT ĐỊNH!&rdquo;
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-4">
              Chuyến thám hiểm di tích tưởng chừng đã kết thúc, nhưng thực chất lại mở đầu cho một hành trình hoàn toàn khác. Bạn đã vô tình bước vào{' '}
              <b className="text-amber-300">Tu Tiên Giới</b> — nơi những thử thách mới đang chờ đợi, và tri thức sẽ trở thành chìa khóa để thăng tiến cảnh giới!
            </p>

            {playerName && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 mb-4 text-xs text-slate-300 inline-flex items-center gap-2">
                <span>Tu sĩ:</span>
                <b className="text-amber-400">{playerName}</b>
                <span className="text-slate-500">·</span>
                <span>Lớp:</span>
                <b className="text-slate-200">{playerClass}</b>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Đã đồng bộ danh tính
                </span>
              </div>
            )}

            <div className="text-xs text-slate-400 font-semibold mb-6">
              ✦ ĐẠI GIÁO CHỦ TRƯƠNG ANH TOÀN – 0329056500 ✦
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setCurrentChapter(2);
                  setScreen('c2_rules');
                  playSound('magic', soundEnabled);
                }}
                className="w-full min-h-[50px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 active:scale-[0.98] transition-transform"
              >
                <span>BẮT ĐẦU HÀNH TRÌNH TU TIÊN (CHƯƠNG 2) ➜</span>
              </button>

              <button
                onClick={() => setScreen('c1_result')}
                className="w-full min-h-[42px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Về Bảng Thành Tích Chương 1
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - RULES                                           */}
        {/* ======================================================== */}
        {screen === 'c2_rules' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                📚
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Chương 2 · Nhập môn quy tắc
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Nắm Vững Thần Thông Luật Quy
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Chào mừng tu sĩ <b className="text-amber-300">{playerName || 'bạn'}</b> ({playerClass || 'Lớp'}). Để vượt qua 10 cửa ải Hình học, hãy nắm vững thần thông luật quy:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3">
                <span className="text-2xl shrink-0">🎯</span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 mb-0.5">
                    10 Cửa Ải Toán Học
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Mỗi câu đúng giúp tăng 1 Cảnh giới. Trả lời sai không bị giảm cảnh giới hiện tại.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3">
                <span className="text-2xl shrink-0">⚡</span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 mb-0.5">
                    Tích Lũy Tu Vi
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Trả lời đúng cộng 10 aura tu vi. Thời gian suy nghĩ mặc định là 20 giây mỗi câu.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3">
                <span className="text-2xl shrink-0">🧭</span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 mb-0.5">
                    Tam Đại Pháp Bảo
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Được chọn duy nhất 1 pháp bảo đồng hành hỗ trợ đặc biệt xuyên suốt trận đấu.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3">
                <span className="text-2xl shrink-0">🌩️</span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 mb-0.5">
                    Thiên Môn Độ Kiếp
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Câu số 10 là ải quyết định, khóa toàn bộ chức năng trợ lực của pháp bảo!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('transition_to_c2')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => setScreen('c2_treasure')}
                className="flex-[2] min-h-[46px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Tìm kiếm pháp bảo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - TREASURE SELECTION                              */}
        {/* ======================================================== */}
        {screen === 'c2_treasure' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                💎
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Chương 2 · Chọn đạo cụ
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Chọn Một Pháp Bảo Đồng Hành
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Mỗi tu sĩ chỉ được chọn <b>một</b> pháp bảo duy nhất xuyên suốt game.
            </p>

            <div className="space-y-3 mb-6">
              {/* Jade */}
              <button
                type="button"
                onClick={() => setC2Treasure('jade')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  c2Treasure === 'jade'
                    ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-900/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl shrink-0 mt-0.5">🟢</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-emerald-300">
                      Ngọc Như Ý
                    </h3>
                    {c2Treasure === 'jade' && (
                      <span className="text-[10px] font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Cứu sai 1 lần:</b> Tự động kích hoạt khi trả lời sai lần đầu tiên (từ câu 1 đến 9), giúp bạn vẫn được{' '}
                    <span className="text-emerald-300 font-bold">+1 cảnh giới</span>.
                  </p>
                </div>
              </button>

              {/* Time */}
              <button
                type="button"
                onClick={() => setC2Treasure('time')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  c2Treasure === 'time'
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-900/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl shrink-0 mt-0.5">⌛</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-amber-300">
                      Pháp Tắc Thời Gian
                    </h3>
                    {c2Treasure === 'time' && (
                      <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Thêm thời gian suy nghĩ:</b> Tăng thời gian làm bài cho tất cả 10 câu hỏi từ <span className="font-bold">20 giây</span> lên{' '}
                    <span className="text-amber-300 font-bold">30 giây</span>.
                  </p>
                </div>
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={() => setC2Treasure('skip')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  c2Treasure === 'skip'
                    ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg shadow-indigo-900/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl shrink-0 mt-0.5">🔮</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-indigo-300">
                      Đại Diễn Quyết
                    </h3>
                    {c2Treasure === 'skip' && (
                      <span className="text-[10px] font-bold bg-indigo-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Bỏ qua cửa ải:</b> Chủ động bỏ qua 1 câu hỏi khó (từ câu 1 đến 9) và tiến thẳng lên{' '}
                    <span className="text-indigo-300 font-bold">+1 cảnh giới</span>.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('c2_rules')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                disabled={!c2Treasure}
                onClick={handleStartChap2}
                className="flex-[2] min-h-[46px] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Chốt pháp bảo & Vào ải</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - QUIZ (10 ẢI HÌNH HỌC)                           */}
        {/* ======================================================== */}
        {screen === 'c2_quiz' && currentC2Question && (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
            {/* Stage Bar */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-400">
                  ẢI {currentC2Question.stage < 10 ? `0${currentC2Question.stage}` : currentC2Question.stage}/10
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px] sm:max-w-xs">
                  {currentC2Question.tag}
                </span>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums transition-colors ${
                  timeLeft <= 5
                    ? 'bg-rose-500/20 border border-rose-500/60 text-rose-300 animate-pulse'
                    : timeLeft <= 8
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${((currentC2Question.stage - 1) / 10) * 100}%`,
                }}
              />
            </div>

            {/* Status Strip */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-lg text-slate-300">
              <div className="flex items-center gap-1">
                <span>☯</span>
                <span className="text-slate-400">Cảnh giới:</span>
                <span className="font-bold text-amber-300">
                  {REALMS[c2RealmIndex]}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({c2RealmIndex + 1}/10)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span>💎</span>
                <span className="font-medium text-slate-300 truncate max-w-[120px]">
                  {getTreasureDisplayName(c2Treasure)}
                </span>
                {c2Treasure === 'jade' && c2JadeUsed && (
                  <span className="text-[9px] text-rose-400">(đã dùng)</span>
                )}
                {c2Treasure === 'skip' && c2SkipUsed && (
                  <span className="text-[9px] text-slate-500">(đã dùng)</span>
                )}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mb-1">
                    {currentC2Question.stage === 10
                      ? 'Thiên Môn Độ Kiếp · Cửa ải quyết định'
                      : `Thử thách Cửa Ải ${currentC2Question.stage}`}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                    <MathText text={currentC2Question.prompt} />
                  </h3>
                </div>
                <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {currentC2Question.emoji}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {currentC2Question.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = c2SelectedOption === idx;
                  const isCorrect = idx === currentC2Question.correctIndex;

                  let btnStyle =
                    'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60';
                  let badgeStyle = 'bg-slate-800 text-slate-300';

                  if (c2Locked) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40';
                      badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isSelected) {
                      btnStyle =
                        'bg-rose-950/50 border-rose-500 text-rose-200 ring-1 ring-rose-500/40';
                      badgeStyle = 'bg-rose-500 text-white font-black';
                    } else {
                      btnStyle = 'opacity-50 bg-slate-950 border-slate-800/60 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={c2Locked}
                      onClick={() => handleC2Answer(idx)}
                      className={`min-h-[50px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-[0.98] ${btnStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-sm ${badgeStyle}`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 font-semibold text-xs sm:text-sm overflow-x-auto">
                        <MathText text={opt} />
                      </span>
                      {c2Locked && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {c2Locked && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banner (No lengthy explanation) */}
              {c2Feedback && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
                    c2Feedback.isGood
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {c2Feedback.isGood ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="leading-relaxed">{c2Feedback.text}</span>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                {c2Treasure === 'skip' && !c2SkipUsed && currentC2Question.stage <= 9 && !c2Locked && (
                  <button
                    type="button"
                    onClick={handleC2UseSkip}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>🔮 Dùng Đại Diễn Quyết (Bỏ qua câu này)</span>
                  </button>
                )}

                <div className="flex-1 hidden sm:block text-slate-500 text-[11px]">
                  {!c2Locked && 'Chọn một đáp án để xác nhận lựa chọn.'}
                </div>

                {c2Locked && (
                  <button
                    type="button"
                    onClick={handleC2NextQuestion}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform ml-auto"
                  >
                    <span>
                      {currentC2Question.stage === 10
                        ? 'Hoàn tất độ kiếp ➜'
                        : 'Cửa ải tiếp theo ➜'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - CLIMAX (ĐỘ KIẾP HOÀN THÀNH)                    */}
        {/* ======================================================== */}
        {screen === 'c2_climax' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2">
              Chương 2 · Thiên kiếp đã qua
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-50 mb-3">
              Thiên Kiếp Đã Qua!
            </h2>

            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400/20 to-purple-500/20 border border-amber-400/50 flex items-center justify-center text-4xl mx-auto my-4 glow-amber">
              🌩️
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Tu sĩ <b className="text-amber-300">{playerName || 'Tu sĩ'}</b> ({playerClass || 'Lớp'}) đã kiên cường vượt qua trọn vẹn 10 cửa ải tu luyện!
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs text-slate-300 space-y-1">
              <div>
                Số câu đúng: <b className="text-emerald-400">{c2CorrectCount}/10</b>
              </div>
              <div>
                Tổng tu vi: <b className="text-amber-400">{c2Score} aura</b>
              </div>
              <div>
                Cảnh giới đạt được:{' '}
                <b className="text-purple-300">{REALMS[c2RealmIndex]}</b>
              </div>
            </div>

            <button
              onClick={() => setScreen('c2_leaderboard')}
              className="w-full min-h-[48px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
            >
              <span>Mở Bảng Phong Thần ➜</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - BẢNG PHONG THẦN & KẾT QUẢ                      */}
        {/* ======================================================== */}
        {screen === 'c2_leaderboard' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
                Bảng Phong Thần · Chương 2
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                Thành Tích Tu Luyện
              </h2>
              <div className="text-sm sm:text-base font-black text-purple-300 mt-1">
                ✦ Cảnh giới: {REALMS[c2RealmIndex]} ✦
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
                  {c2Score}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Tổng aura
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {c2CorrectCount}/10
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Câu đúng
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-indigo-400 tabular-nums">
                  {Math.round((c2CorrectCount / 10) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Độ chính xác
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center text-xs text-slate-300 mb-5 leading-relaxed">
              Chúc mừng bạn đã đạt danh hiệu{' '}
              <b className="text-amber-300">
                [
                {c2RealmIndex === 9
                  ? 'Đại Năng Toán Học'
                  : c2RealmIndex >= 7
                  ? 'Cao Thủ Tư Duy'
                  : c2RealmIndex >= 5
                  ? 'Tu Sĩ Bản Lĩnh'
                  : 'Tu Sĩ Nhập Môn'}
                ]
              </b>
              ! Khả năng tư duy toán học và rèn luyện bền bỉ chính là bảo bối quý giá nhất.
            </div>

            {/* Leaderboard Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>DANH SÁCH BẢNG PHONG THẦN</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {leaderboard.length} lượt hoàn thành
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Tu sĩ</th>
                        <th className="py-2 px-3">Lớp</th>
                        <th className="py-2 px-3">Chặng</th>
                        <th className="py-2 px-3 text-right">Aura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {leaderboard.length > 0 ? (
                        leaderboard.map((item, idx) => (
                          <tr
                            key={item.id || idx}
                            className={
                              item.name === playerName ? 'bg-amber-400/5' : ''
                            }
                          >
                            <td className="py-2 px-3 font-semibold text-slate-200 truncate max-w-[110px]">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {item.className}
                            </td>
                            <td className="py-2 px-3 text-slate-400 truncate max-w-[130px]">
                              {item.chapter === 1
                                ? 'Chương 1: Di tích'
                                : `Chương 2: ${item.realm || 'Tu Tiên Giới'}`}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-amber-400 tabular-nums">
                              {item.score} aura
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-slate-500 text-xs"
                          >
                            Chưa có dữ liệu tu sĩ nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {c2Answers.length > 0 && (
                <button
                  onClick={() => setScreen('c2_review')}
                  className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xem lại đáp án</span>
                </button>
              )}

              <button
                onClick={() => setScreen('c2_outro')}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Khép lại hành trình</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - ÔN TẬP ĐÁP ÁN (NO LENGTHY EXPLANATION)          */}
        {/* ======================================================== */}
        {screen === 'c2_review' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Đối chiếu kết quả · Chương 2
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Ôn Tập 10 Cửa Ải Hình Học
                </h2>
              </div>
              <button
                onClick={() => setScreen('c2_leaderboard')}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Về Bảng Phong Thần
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 mb-5">
              {c2Questions.map((q, i) => {
                const ans = c2Answers[i];
                const isCorrect = ans?.isCorrect;
                const isSkipped = ans?.isSkipped;
                const isTimeout = ans?.isTimeout;

                return (
                  <div
                    key={q.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-amber-300">
                        CÂU {q.stage} · {q.tag}
                      </span>
                      <span
                        className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isSkipped
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isCorrect
                          ? 'Đúng (+10 aura)'
                          : isSkipped
                          ? 'Đại Diễn Quyết'
                          : isTimeout
                          ? 'Hết giờ'
                          : 'Chưa đúng'}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-200 mb-2 leading-relaxed">
                      <MathText text={q.prompt} />
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px]">
                        Đáp án đúng:
                      </span>
                      <span className="font-black text-emerald-400 text-xs">
                        <MathText text={q.correctAnswerText} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('c2_leaderboard')}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => setScreen('c2_outro')}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Lời kết</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CHAP 2 - OUTRO: LỜI KẾT                                  */}
        {/* ======================================================== */}
        {screen === 'c2_outro' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-emerald-400/20 border border-amber-400/40 flex items-center justify-center text-3xl mx-auto mb-4">
              🏯
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
              Chương 2 · Lời kết
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-3">
              Hành Trình Khép Lại, Tri Thức Ở Lại
            </h2>

            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 rounded-xl px-4 py-2 my-2 shadow-sm">
              <span className="text-xs sm:text-sm font-black text-amber-300">
                &ldquo;ĐIỂM SỐ CỦA TA, DO TA QUYẾT ĐỊNH!&rdquo;
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-4">
              Chúc mừng tu sĩ <b className="text-amber-300">{playerName || 'bạn'}</b> đã nỗ lực hoàn thành xuất sắc cả 2 chương thử thách (Di Tích Cổ & Tu Tiên Giới). Hãy luôn ghi nhớ: Tinh thần ham học hỏi và sự kiên trì bền bỉ chính là chìa khóa giúp bạn tiến bộ vượt bậc trong toán học!
            </p>

            <div className="text-xs text-slate-400 font-semibold mb-6">
              ✦ ĐẠI GIÁO CHỦ TRƯƠNG ANH TOÀN – 0329056500 ✦
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleFullRestart}
                className="w-full min-h-[48px] bg-gradient-to-r from-cyan-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-transform"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bắt đầu hành trình mới (Chương 1)</span>
              </button>

              <button
                onClick={() => setScreen('c2_leaderboard')}
                className="w-full min-h-[42px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Xem lại Bảng Phong Thần
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-10 shrink-0 border-t border-slate-900 bg-slate-950/80 flex items-center justify-center text-[10px] text-slate-500 tracking-wider">
        TU TIÊN TOÁN HỌC · {currentChapter === 1 ? 'CHƯƠNG 1: THÁM HIỂM DI TÍCH CỔ' : 'CHƯƠNG 2: TIẾN VÀO TU TIÊN GIỚI'}
      </footer>
    </div>
  );
}

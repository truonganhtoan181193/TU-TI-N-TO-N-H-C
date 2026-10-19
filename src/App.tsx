import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Timer,
  ShieldCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import {
  Question,
  UserAnswerRecord,
  TreasureType,
  ScoreHistoryEntry,
  ScreenType,
  REALMS,
} from './types';
import { generateAllQuestions } from './data/questionGenerator';
import { MathText } from './components/MathText';
import { TopBar } from './components/TopBar';
import { playSound, triggerHaptic } from './utils/audio';
import { fireConfetti } from './utils/confetti';

const STORAGE_KEY = 'tu_tien_toan_hoc_scores_v1';

export default function App() {
  // Navigation & Game State
  const [screen, setScreen] = useState<ScreenType>('intro');
  const [playerName, setPlayerName] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [treasure, setTreasure] = useState<TreasureType>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [realmIndex, setRealmIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);

  // Artifact State
  const [jadeUsed, setJadeUsed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);

  // Current Question State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [feedbackText, setFeedbackText] = useState<{
    text: string;
    isGood: boolean;
  } | null>(null);

  // Timer State
  const maxTime = treasure === 'time' ? 30 : 20;
  const [timeLeft, setTimeLeft] = useState(maxTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings & History
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [leaderboard, setLeaderboard] = useState<ScoreHistoryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history on initial mount
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Timer countdown hook for 'quiz' screen
  useEffect(() => {
    if (screen !== 'quiz') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isLocked) {
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
  }, [screen, isLocked, currentIndex]);

  // Handle timeout
  const handleTimeout = () => {
    if (isLocked) return;
    setIsLocked(true);
    triggerHaptic();
    playSound('wrong', soundEnabled);

    const q = questions[currentIndex];
    const record: UserAnswerRecord = {
      stage: q.stage,
      question: q,
      selectedIndex: -1,
      isCorrect: false,
      isTimeout: true,
    };

    setUserAnswers((prev) => [...prev, record]);
    setFeedbackText({
      text: `⌛ Hết thời gian suy nghĩ! Cảnh giới giữ nguyên: [${REALMS[realmIndex]}].`,
      isGood: false,
    });
  };

  // Start a fresh game
  const handleStartGame = () => {
    if (!treasure) {
      showToast('Vui lòng chọn một pháp bảo trước khi vào ải.');
      return;
    }

    const generated = generateAllQuestions();
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setRealmIndex(0);
    setUserAnswers([]);
    setJadeUsed(false);
    setSkipUsed(false);
    setSelectedOption(null);
    setIsLocked(false);
    setFeedbackText(null);
    setTimeLeft(treasure === 'time' ? 30 : 20);

    setScreen('quiz');
    playSound('magic', soundEnabled);
  };

  // User selects an answer option
  const handleAnswer = (optionIdx: number) => {
    if (isLocked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsLocked(true);
    setSelectedOption(optionIdx);
    triggerHaptic();

    const q = questions[currentIndex];
    const isCorrect = optionIdx === q.correctIndex;

    let newScore = score;
    let newRealm = realmIndex;
    let newCorrect = correctCount;
    let jadeSavedThisTurn = false;

    if (isCorrect) {
      newScore += 10;
      newCorrect += 1;
      newRealm = Math.min(newRealm + 1, REALMS.length - 1);
      setScore(newScore);
      setCorrectCount(newCorrect);
      setRealmIndex(newRealm);

      playSound('correct', soundEnabled);
      if (newRealm > realmIndex) {
        setTimeout(() => playSound('levelup', soundEnabled), 200);
      }

      setFeedbackText({
        text: `Chính xác! +10 tu vi. Thăng cấp cảnh giới lên [${REALMS[newRealm]}].`,
        isGood: true,
      });
    } else {
      playSound('wrong', soundEnabled);

      // Check Ngọc Như Ý protection (Stages 1 to 9 only)
      if (treasure === 'jade' && !jadeUsed && q.stage <= 9) {
        setJadeUsed(true);
        jadeSavedThisTurn = true;
        newRealm = Math.min(newRealm + 1, REALMS.length - 1);
        setRealmIndex(newRealm);

        setFeedbackText({
          text: `🟢 Ngọc Như Ý phát sáng hộ thể! Dù chưa đúng, pháp bảo cứu nguy giúp bạn vẫn thăng tiến lên [${REALMS[newRealm]}].`,
          isGood: true,
        });
      } else {
        setFeedbackText({
          text: `Chưa chính xác. Cảnh giới giữ nguyên: [${REALMS[realmIndex]}].`,
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
    setUserAnswers((prev) => [...prev, record]);
  };

  // User activates Đại Diễn Quyết (skip)
  const handleUseSkip = () => {
    if (treasure !== 'skip' || skipUsed || currentIndex >= 9 || isLocked) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSkipUsed(true);
    setIsLocked(true);
    triggerHaptic();
    playSound('magic', soundEnabled);

    const q = questions[currentIndex];
    const newRealm = Math.min(realmIndex + 1, REALMS.length - 1);
    setRealmIndex(newRealm);

    const record: UserAnswerRecord = {
      stage: q.stage,
      question: q,
      selectedIndex: -1,
      isCorrect: false,
      isSkipped: true,
    };
    setUserAnswers((prev) => [...prev, record]);

    showToast('🔮 Đại Diễn Quyết kích hoạt! Bỏ qua cửa ải và +1 cảnh giới.');
    goToNextQuestion();
  };

  // Proceed to next question or climax
  const goToNextQuestion = () => {
    if (currentIndex < 9) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsLocked(false);
      setFeedbackText(null);
      setTimeLeft(treasure === 'time' ? 30 : 20);
    } else {
      // Completed 10 stages!
      fireConfetti();
      playSound('levelup', soundEnabled);
      saveScoreToLeaderboard();
      setScreen('climax');
    }
  };

  // Save score to local leaderboard
  const saveScoreToLeaderboard = () => {
    const treasureNames: Record<string, string> = {
      jade: 'Ngọc Như Ý',
      time: 'Pháp Tắc Thời Gian',
      skip: 'Đại Diễn Quyết',
    };

    const entry: ScoreHistoryEntry = {
      id: Date.now().toString(),
      name: playerName || 'Tu sĩ ẩn danh',
      className: playerClass || 'Tự do',
      score,
      correctCount,
      realm: REALMS[realmIndex],
      treasureName: treasureNames[treasure] || 'Không',
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

  // Reset to registration or intro
  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTreasure('');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setRealmIndex(0);
    setUserAnswers([]);
    setJadeUsed(false);
    setSkipUsed(false);
    setSelectedOption(null);
    setIsLocked(false);
    setFeedbackText(null);
    setScreen('intro');
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

  // Active question
  const currentQuestion = questions[currentIndex];

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
        playerName={playerName}
        realmIndex={realmIndex}
        score={score}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenLeaderboard={
          screen !== 'intro' && screen !== 'quiz'
            ? () => setScreen('leaderboard')
            : undefined
        }
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* SCREEN 1: INTRO                                          */}
        {/* ======================================================== */}
        {screen === 'intro' && (
          <div className="flex flex-col items-center text-center py-4 sm:py-8 max-w-xl mx-auto w-full">
            {/* Spiritual Emblem */}
            <div className="relative mb-4 sm:mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-400 to-indigo-500 p-1 shadow-xl shadow-amber-500/10 glow-amber flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-4xl sm:text-5xl">
                  🧙🏻‍♂️
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                10 ẢI TOÁN
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-1">
              Hành trình khai mở trí tuệ
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-50 tracking-tight mb-2">
              Tu Tiên <span className="text-amber-400">Toán Học</span>
            </h1>

            {/* Motto Banner */}
            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 rounded-xl px-4 py-2 my-2 shadow-sm">
              <span className="text-xs sm:text-sm font-black text-amber-300">
                &ldquo;ĐIỂM SỐ CỦA TA, DO TA QUYẾT ĐỊNH!&rdquo;
              </span>
            </div>

            {/* Author Tribute */}
            <div className="text-xs text-slate-400 font-semibold mb-4">
              ✦ ĐẠI NĂNG TRƯƠNG ANH TOÀN – 0329056500 ✦
            </div>

            {/* Lore */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
              Một vị đại năng tên là Trương Anh Toàn cho rằng nếu vượt qua 10 ải
              tu luyện sẽ đạt được kết quả bất ngờ. Tri thức chính là sức mạnh,
              tư duy là chìa khóa!
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-6 text-center">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">📐</div>
                <div className="text-[11px] font-bold text-slate-200">10 Cửa Ải</div>
                <div className="text-[9px] text-slate-400">Hình học lớp 7</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">💎</div>
                <div className="text-[11px] font-bold text-slate-200">Tam Pháp Bảo</div>
                <div className="text-[9px] text-slate-400">Trợ lực độ kiếp</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-base sm:text-lg mb-0.5">📜</div>
                <div className="text-[11px] font-bold text-slate-200">Phong Thần</div>
                <div className="text-[9px] text-slate-400">Lưu danh tu vi</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
              <button
                onClick={() => setScreen('register')}
                className="w-full min-h-[48px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>BẮT ĐẦU TU LUYỆN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {leaderboard.length > 0 && (
                <button
                  onClick={() => setScreen('leaderboard')}
                  className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bảng Phong Thần ({leaderboard.length})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: REGISTRATION                                   */}
        {/* ======================================================== */}
        {screen === 'register' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 max-w-md mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                📜
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Bước 01 · Ghi danh
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Ghi Danh Vào Tu Tiên Giới
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Nhập danh tính của bạn để lưu danh vào Bảng Phong Thần khi hoàn
              thành 10 cửa ải.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="regName"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  HỌ VÀ TÊN TU SĨ
                </label>
                <input
                  id="regName"
                  type="text"
                  maxLength={50}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full min-h-[46px] bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 text-sm text-slate-100 outline-none transition-colors"
                  autoComplete="name"
                />
              </div>

              <div>
                <label
                  htmlFor="regClass"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  LỚP HỌC
                </label>
                <input
                  id="regClass"
                  type="text"
                  maxLength={20}
                  placeholder="Ví dụ: 7/4"
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                  className="w-full min-h-[46px] bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 text-sm text-slate-100 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('intro')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  if (!playerName.trim() || !playerClass.trim()) {
                    showToast('Vui lòng nhập đầy đủ Họ tên và Lớp nhé!');
                    return;
                  }
                  setScreen('rules');
                }}
                className="flex-[2] min-h-[46px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Xác nhận danh tính</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: RULES                                          */}
        {/* ======================================================== */}
        {screen === 'rules' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                📚
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Bước 02 · Quy tắc
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Nắm Vững Thần Thông Luật Quy
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Muốn vượt 10 cửa ải suôn sẻ, tu sĩ cần ghi nhớ các quy tắc sau:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex gap-3">
                <span className="text-2xl shrink-0">🎯</span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 mb-0.5">
                    10 Cửa Ải Toán Học
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Mỗi câu đúng giúp tăng 1 Cảnh giới. Trả lời sai không bị giảm
                    cảnh giới hiện tại.
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
                    Trả lời đúng cộng 10 điểm tu vi. Thời gian suy nghĩ mặc định
                    là 20 giây mỗi câu.
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
                    Được chọn duy nhất 1 pháp bảo đồng hành hỗ trợ đặc biệt xuyên
                    suốt hành trình.
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
                    Câu số 10 là ải quyết định, khóa toàn bộ chức năng trợ lực
                    của pháp bảo!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('register')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                onClick={() => setScreen('treasure')}
                className="flex-[2] min-h-[46px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Tìm kiếm pháp bảo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: TREASURE SELECTION                             */}
        {/* ======================================================== */}
        {screen === 'treasure' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                💎
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Bước 03 · Đạo cụ
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Chọn Một Pháp Bảo Đồng Hành
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Mỗi tu sĩ chỉ được chọn <b>một</b> pháp bảo duy nhất xuyên suốt
              game. Hãy cân nhắc chiến lược!
            </p>

            {/* 3 Treasure Cards */}
            <div className="space-y-3 mb-6">
              {/* Jade */}
              <button
                type="button"
                onClick={() => setTreasure('jade')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  treasure === 'jade'
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
                    {treasure === 'jade' && (
                      <span className="text-[10px] font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Cứu sai 1 lần:</b> Tự động kích hoạt khi trả lời sai lần
                    đầu tiên (từ câu 1 đến câu 9), giúp bạn vẫn được{' '}
                    <span className="text-emerald-300 font-bold">+1 cảnh giới</span>.
                  </p>
                </div>
              </button>

              {/* Time */}
              <button
                type="button"
                onClick={() => setTreasure('time')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  treasure === 'time'
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
                    {treasure === 'time' && (
                      <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Thêm thời gian suy nghĩ:</b> Tăng thời gian làm bài cho tất
                    cả 10 câu hỏi từ <span className="font-bold">20 giây</span> lên{' '}
                    <span className="text-amber-300 font-bold">30 giây</span>.
                  </p>
                </div>
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={() => setTreasure('skip')}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                  treasure === 'skip'
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
                    {treasure === 'skip' && (
                      <span className="text-[10px] font-bold bg-indigo-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Bỏ qua cửa ải:</b> Chủ động bỏ qua 1 câu hỏi khó (từ câu 1
                    đến 9) và tiến thẳng lên{' '}
                    <span className="text-indigo-300 font-bold">+1 cảnh giới</span>.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setScreen('rules')}
                className="flex-1 min-h-[46px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại
              </button>
              <button
                disabled={!treasure}
                onClick={handleStartGame}
                className="flex-[2] min-h-[46px] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Chốt pháp bảo & Vào ải</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: QUIZ (MAIN GAMEPLAY)                           */}
        {/* ======================================================== */}
        {screen === 'quiz' && currentQuestion && (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
            {/* Top Stage Bar: Question Stage, Tag & Timer */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-400">
                  ẢI {currentQuestion.stage < 10 ? `0${currentQuestion.stage}` : currentQuestion.stage}/10
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px] sm:max-w-xs">
                  {currentQuestion.tag}
                </span>
              </div>

              {/* Timer indicator */}
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

            {/* Visual Progress Bar */}
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${((currentQuestion.stage - 1) / 10) * 100}%`,
                }}
              />
            </div>

            {/* Cultivation Mobile Status Strip */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-lg text-slate-300">
              <div className="flex items-center gap-1">
                <span>☯</span>
                <span className="text-slate-400">Cảnh giới:</span>
                <span className="font-bold text-amber-300">
                  {REALMS[realmIndex]}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({realmIndex + 1}/10)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span>💎</span>
                <span className="font-medium text-slate-300 truncate max-w-[120px]">
                  {getTreasureDisplayName(treasure)}
                </span>
                {treasure === 'jade' && jadeUsed && (
                  <span className="text-[9px] text-rose-400">(đã dùng)</span>
                )}
                {treasure === 'skip' && skipUsed && (
                  <span className="text-[9px] text-slate-500">(đã dùng)</span>
                )}
              </div>
            </div>

            {/* Main Question Card: Balanced, high-contrast & mobile optimized */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
              {/* Question Header & Emoji */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mb-1">
                    {currentQuestion.stage === 10
                      ? 'Thiên Môn Độ Kiếp · Cửa ải quyết định'
                      : `Thử thách Cửa Ải ${currentQuestion.stage}`}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                    <MathText text={currentQuestion.prompt} />
                  </h3>
                </div>
                <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {currentQuestion.emoji}
                </div>
              </div>

              {/* Optional Math Display Box if separate formula provided */}
              {currentQuestion.mathBox && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center overflow-x-auto text-amber-300 font-bold text-base">
                  <MathText text={currentQuestion.mathBox} displayMode />
                </div>
              )}

              {/* Options Grid: Balanced 2x2 on mobile for neat formula comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let btnStyle =
                    'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60';
                  let badgeStyle = 'bg-slate-800 text-slate-300';

                  if (isLocked) {
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
                      disabled={isLocked}
                      onClick={() => handleAnswer(idx)}
                      className={`min-h-[50px] sm:min-h-[54px] p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-[0.98] ${btnStyle}`}
                    >
                      {/* Letter badge */}
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-sm ${badgeStyle}`}
                      >
                        {letter}
                      </span>

                      {/* Option text with math */}
                      <span className="flex-1 font-semibold text-xs sm:text-sm overflow-x-auto">
                        <MathText text={opt} />
                      </span>

                      {/* Result icon if locked */}
                      {isLocked && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isLocked && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Feedback Banner: Concise without lengthy explanation per user request */}
              {feedbackText && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
                    feedbackText.isGood
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {feedbackText.isGood ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="leading-relaxed">{feedbackText.text}</span>
                </div>
              )}

              {/* Action Controls in Thumb Zone */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                {/* Skip button for Đại Diễn Quyết */}
                {treasure === 'skip' && !skipUsed && currentQuestion.stage <= 9 && !isLocked && (
                  <button
                    type="button"
                    onClick={handleUseSkip}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>🔮 Dùng Đại Diễn Quyết (Bỏ qua câu này)</span>
                  </button>
                )}

                <div className="flex-1 hidden sm:block text-slate-500 text-[11px]">
                  {!isLocked && 'Chọn một đáp án để xác nhận lựa chọn.'}
                </div>

                {/* Continue / Next Button */}
                {isLocked && (
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform ml-auto"
                  >
                    <span>
                      {currentQuestion.stage === 10
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
        {/* SCREEN 15: CLIMAX (ĐỘ KIẾP HOÀN THÀNH)                  */}
        {/* ======================================================== */}
        {screen === 'climax' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2">
              Khung 15 · Độ kiếp
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-50 mb-3">
              Thiên Kiếp Đã Qua!
            </h2>

            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400/20 to-purple-500/20 border border-amber-400/50 flex items-center justify-center text-4xl mx-auto my-4 glow-amber">
              🌩️
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Tu sĩ <b className="text-amber-300">{playerName || 'Tu sĩ'}</b> (
              {playerClass || 'Lớp học'}) đã kiên cường vượt qua trọn vẹn 10 cửa
              ải tu luyện!
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs text-slate-300 space-y-1">
              <div>
                Số câu đúng: <b className="text-emerald-400">{correctCount}/10</b>
              </div>
              <div>
                Tổng điểm tu vi: <b className="text-amber-400">{score} pt</b>
              </div>
              <div>
                Cảnh giới đạt được:{' '}
                <b className="text-purple-300">{REALMS[realmIndex]}</b>
              </div>
            </div>

            <button
              onClick={() => setScreen('leaderboard')}
              className="w-full min-h-[48px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
            >
              <span>Mở Bảng Phong Thần ➜</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 16: LEADERBOARD & DETAILED RESULTS                */}
        {/* ======================================================== */}
        {screen === 'leaderboard' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl mx-auto w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
                Bảng Phong Thần · Thành tích
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                Thành Tích Tu Luyện
              </h2>
              <div className="text-sm sm:text-base font-black text-purple-300 mt-1">
                ✦ Cảnh giới: {REALMS[realmIndex]} ✦
              </div>
            </div>

            {/* 3 Metrics */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
                  {score}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Tổng tu vi
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {correctCount}/10
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Câu đúng
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg sm:text-2xl font-black text-indigo-400 tabular-nums">
                  {Math.round((correctCount / 10) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Độ chính xác
                </div>
              </div>
            </div>

            {/* Evaluation remark */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center text-xs text-slate-300 mb-5 leading-relaxed">
              Chúc mừng bạn đã đạt danh hiệu{' '}
              <b className="text-amber-300">
                [
                {realmIndex === 9
                  ? 'Đại Năng Toán Học'
                  : realmIndex >= 7
                  ? 'Cao Thủ Tư Duy'
                  : realmIndex >= 5
                  ? 'Tu Sĩ Bản Lĩnh'
                  : 'Tu Sĩ Nhập Môn'}
                ]
              </b>
              ! Khả năng tư duy toán học và rèn luyện bền bỉ chính là bảo bối quý
              giá nhất.
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
                        <th className="py-2 px-3">Pháp bảo</th>
                        <th className="py-2 px-3 text-right">Điểm</th>
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
                            <td className="py-2 px-3 font-semibold text-slate-200 truncate max-w-[120px]">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {item.className}
                            </td>
                            <td className="py-2 px-3 text-slate-400 truncate max-w-[100px]">
                              {item.treasureName}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-amber-400 tabular-nums">
                              {item.score} pt
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {userAnswers.length > 0 && (
                <button
                  onClick={() => setScreen('review')}
                  className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xem lại đáp án</span>
                </button>
              )}

              <button
                onClick={() => setScreen('outro')}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Khép lại hành trình</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN: REVIEW ANSWERS (NO LENGTHY EXPLANATION)          */}
        {/* ======================================================== */}
        {screen === 'review' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Đối chiếu kết quả
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Ôn Tập 10 Cửa Ải
                </h2>
              </div>
              <button
                onClick={() => setScreen('leaderboard')}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Về Bảng Phong Thần
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 mb-5">
              {questions.map((q, i) => {
                const ans = userAnswers[i];
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
                          ? 'Đúng (+10 pt)'
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
                onClick={() => setScreen('leaderboard')}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors active:scale-[0.98]"
              >
                Quay lại Bảng Phong Thần
              </button>
              <button
                onClick={() => setScreen('outro')}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <span>Lời kết</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 17: OUTRO                                         */}
        {/* ======================================================== */}
        {screen === 'outro' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-emerald-400/20 border border-amber-400/40 flex items-center justify-center text-3xl mx-auto mb-4">
              🏯
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
              Khung 17 · Lời kết
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-3">
              Hành Trình Khép Lại, Tri Thức Ở Lại
            </h2>

            {/* Motto */}
            <div className="inline-block bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 rounded-xl px-4 py-2 my-2 shadow-sm">
              <span className="text-xs sm:text-sm font-black text-amber-300">
                &ldquo;ĐIỂM SỐ CỦA TA, DO TA QUYẾT ĐỊNH!&rdquo;
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-4">
              Chúc mừng tu sĩ <b className="text-amber-300">{playerName || 'bạn'}</b>{' '}
              đã nỗ lực hoàn thành xuất sắc 10 cửa ải thử thách. Hãy luôn ghi
              nhớ: Tinh thần ham học hỏi và sự kiên trì bền bỉ chính là chìa khóa
              giúp bạn tiến bộ vượt bậc trong toán học!
            </p>

            <div className="text-xs text-slate-400 font-semibold mb-6">
              ✦ ĐẠI NĂNG TRƯƠNG ANH TOÀN – 0329056500 ✦
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full min-h-[48px] bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bắt đầu hành trình mới</span>
              </button>

              <button
                onClick={() => setScreen('leaderboard')}
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
        TU TIÊN TOÁN HỌC · RÈN TƯ DUY · VỮNG KIẾN THỨC
      </footer>
    </div>
  );
}

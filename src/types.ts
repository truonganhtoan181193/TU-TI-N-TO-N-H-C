export type ChapterId = 1 | 2;

export type TreasureType = 'jade' | 'time' | 'skip' | '';

export interface Question {
  id: number;
  stage: number;
  tag: string;
  emoji: string;
  prompt: string;
  mathBox?: string;
  options: string[];
  correctIndex: number;
  correctAnswerText: string;
}

export interface StoryFrame {
  frame: number;
  title: string;
  desc: string;
  successMsg: string;
}

export interface UserAnswerRecord {
  stage: number;
  question: Question;
  selectedIndex: number;
  isCorrect: boolean;
  isSkipped?: boolean;
  isTimeout?: boolean;
  jadeSaved?: boolean;
}

export interface ScoreHistoryEntry {
  id: string;
  name: string;
  className: string;
  score: number;
  correctCount: number;
  realm?: string;
  treasureName?: string;
  chapter: number;
  chapterTitle: string;
  timestamp: number;
}

export type ScreenType =
  // Chap 1 screens
  | 'c1_intro'
  | 'c1_map'
  | 'c1_register'
  | 'c1_quiz'
  | 'c1_ruins_secret'
  | 'c1_boundary'
  | 'c1_result'
  | 'c1_review'
  // Transition screen between Chap 1 and Chap 2
  | 'transition_to_c2'
  // Chap 2 screens
  | 'c2_rules'
  | 'c2_treasure'
  | 'c2_quiz'
  | 'c2_climax'
  | 'c2_leaderboard'
  | 'c2_review'
  | 'c2_outro';

export const REALMS = [
  'Nhập Môn',
  'Luyện Khí',
  'Trúc Cơ',
  'Kết Đan',
  'Nguyên Anh',
  'Hóa Thần',
  'Luyện Hư',
  'Hợp Thể',
  'Đại Thừa',
  'Độ Kiếp',
  'Phi Thăng Tiên Giới',
] as const;

export type RealmName = (typeof REALMS)[number];

export interface RealmColorConfig {
  name: RealmName;
  tagline: string;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
  borderClass: string;
  badgeClass: string;
  textClass: string;
  particleColors: string[];
}

export const REALM_THEMES: Record<number, RealmColorConfig> = {
  0: {
    name: 'Nhập Môn',
    tagline: 'Khởi đầu sơ khai',
    primaryHex: '#94a3b8',
    secondaryHex: '#cbd5e1',
    glowRgba: 'rgba(148, 163, 184, 0.25)',
    borderClass: 'border-slate-500/40',
    badgeClass: 'bg-slate-800 text-slate-200 border-slate-600/50',
    textClass: 'text-slate-300',
    particleColors: ['#cbd5e1', '#94a3b8', '#e2e8f0'],
  },
  1: {
    name: 'Luyện Khí',
    tagline: 'Thanh mộc linh khí',
    primaryHex: '#10b981',
    secondaryHex: '#34d399',
    glowRgba: 'rgba(16, 185, 129, 0.28)',
    borderClass: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    textClass: 'text-emerald-400',
    particleColors: ['#34d399', '#10b981', '#6ee7b7'],
  },
  2: {
    name: 'Trúc Cơ',
    tagline: 'Băng tinh lam hải',
    primaryHex: '#06b6d4',
    secondaryHex: '#38bdf8',
    glowRgba: 'rgba(6, 182, 212, 0.30)',
    borderClass: 'border-cyan-500/40',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
    textClass: 'text-cyan-400',
    particleColors: ['#38bdf8', '#06b6d4', '#7dd3fc'],
  },
  3: {
    name: 'Kết Đan',
    tagline: 'Kim đan xán lạn',
    primaryHex: '#f59e0b',
    secondaryHex: '#fbbf24',
    glowRgba: 'rgba(245, 158, 11, 0.35)',
    borderClass: 'border-amber-500/40',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    textClass: 'text-amber-400',
    particleColors: ['#fbbf24', '#f59e0b', '#fde68a'],
  },
  4: {
    name: 'Nguyên Anh',
    tagline: 'Tử phủ thần quang',
    primaryHex: '#a855f7',
    secondaryHex: '#c084fc',
    glowRgba: 'rgba(168, 85, 247, 0.32)',
    borderClass: 'border-purple-500/40',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    textClass: 'text-purple-400',
    particleColors: ['#c084fc', '#a855f7', '#e9d5ff'],
  },
  5: {
    name: 'Hóa Thần',
    tagline: 'Hồng liên chu sa',
    primaryHex: '#f43f5e',
    secondaryHex: '#fb7185',
    glowRgba: 'rgba(244, 63, 94, 0.30)',
    borderClass: 'border-rose-500/40',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    textClass: 'text-rose-400',
    particleColors: ['#fb7185', '#f43f5e', '#fecdd3'],
  },
  6: {
    name: 'Luyện Hư',
    tagline: 'Thái hư huyền lam',
    primaryHex: '#6366f1',
    secondaryHex: '#818cf8',
    glowRgba: 'rgba(99, 102, 241, 0.30)',
    borderClass: 'border-indigo-500/40',
    badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
    textClass: 'text-indigo-400',
    particleColors: ['#818cf8', '#6366f1', '#c7d2fe'],
  },
  7: {
    name: 'Hợp Thể',
    tagline: 'Vạn tượng cực quang',
    primaryHex: '#d946ef',
    secondaryHex: '#e879f9',
    glowRgba: 'rgba(217, 70, 239, 0.32)',
    borderClass: 'border-fuchsia-500/40',
    badgeClass: 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-500/40',
    textClass: 'text-fuchsia-400',
    particleColors: ['#e879f9', '#d946ef', '#f5d0fe'],
  },
  8: {
    name: 'Đại Thừa',
    tagline: 'Hoàng kim thánh vực',
    primaryHex: '#fbbf24',
    secondaryHex: '#fcd34d',
    glowRgba: 'rgba(251, 191, 36, 0.40)',
    borderClass: 'border-amber-400/50',
    badgeClass: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-200 border-amber-400/50',
    textClass: 'text-amber-300',
    particleColors: ['#fcd34d', '#fbbf24', '#fef08a', '#f59e0b'],
  },
  9: {
    name: 'Độ Kiếp',
    tagline: 'Ngũ sắc thiên lôi',
    primaryHex: '#c084fc',
    secondaryHex: '#fbbf24',
    glowRgba: 'rgba(192, 132, 252, 0.45)',
    borderClass: 'border-purple-400/60 ring-1 ring-amber-400/40',
    badgeClass: 'bg-gradient-to-r from-purple-900/60 via-amber-900/50 to-indigo-900/60 text-amber-200 border-purple-400/50 animate-pulse',
    textClass: 'text-purple-300',
    particleColors: ['#c084fc', '#fbbf24', '#38bdf8', '#f43f5e', '#34d399'],
  },
  10: {
    name: 'Phi Thăng Tiên Giới',
    tagline: 'Thiên giới vĩnh hằng',
    primaryHex: '#fef08a',
    secondaryHex: '#f472b6',
    glowRgba: 'rgba(254, 240, 138, 0.45)',
    borderClass: 'border-amber-300/60',
    badgeClass: 'bg-gradient-to-r from-amber-400/30 via-pink-500/20 to-cyan-400/30 text-amber-100 border-amber-300/50',
    textClass: 'text-amber-200',
    particleColors: ['#fef08a', '#f472b6', '#38bdf8', '#fcd34d'],
  },
};

export const CHAP1_STORY_FRAMES: StoryFrame[] = [
  {
    frame: 4,
    title: 'Thử Thách 1 — Phong Ấn Thứ Nhất',
    desc: 'Một cánh cửa nhỏ với phong ấn đầu tiên phát sáng. Lời giải chính xác sẽ mở cửa.',
    successMsg: 'Phong ấn đầu tiên đã được giải khai. Cánh cửa bắt đầu chuyển động!',
  },
  {
    frame: 5,
    title: 'Thử Thách 2 — Hành Lang Ký Hiệu',
    desc: 'Hành lang dài chứa các ký hiệu. Tìm lời giải để kích hoạt cơ quan đá.',
    successMsg: 'Cơ quan đã được kích hoạt. Con đường phía trước đã mở!',
  },
  {
    frame: 6,
    title: 'Thử Thách 3 — Căn Phòng Bí Mật',
    desc: 'Rương cổ bị khóa bởi thử thách mới. Giải mã để tìm manh mối.',
    successMsg: 'Chiếc rương đã mở. Bên trong là mảnh bản đồ dẫn đến khu vực sâu hơn!',
  },
  {
    frame: 7,
    title: 'Thử Thách 4 — Cầu Đá Đổ Nát',
    desc: 'Vực sâu chia cắt lối đi. Kích hoạt cơ chế cổ xưa trong vách đá.',
    successMsg: 'Những phiến đá bắt đầu dịch chuyển, tạo thành một lối đi an toàn!',
  },
  {
    frame: 8,
    title: 'Thử Thách 5 — Bia Đá Cổ Xưa',
    desc: 'Tấm bia đá khắc thông điệp bị che khuất. Khôi phục ký hiệu còn thiếu.',
    successMsg: 'Thông điệp trên bia đá đã hiện ra. Bạn phát hiện di tích này còn che giấu bí mật lớn hơn!',
  },
  {
    frame: 9,
    title: 'Thử Thách 6 — Mê Cung Đá',
    desc: 'Nhiều lối rẽ giống hệt nhau. Quan sát kỹ dữ kiện để không lạc hướng.',
    successMsg: 'Bạn đã tìm được lối đi đúng. Lối vào khu vực trung tâm đã ở ngay phía trước!',
  },
  {
    frame: 10,
    title: 'Thử Thách 7 — Cơ Quan Thời Gian',
    desc: 'Bánh răng đá dừng quay. Tìm dãy ký hiệu chìa khóa để khởi động lại.',
    successMsg: 'Những bánh răng bắt đầu quay. Một cánh cửa bí mật từ từ mở ra!',
  },
  {
    frame: 11,
    title: 'Thử Thách 8 — Phòng Lưu Trữ',
    desc: 'Sách đá và cuộn giấy cổ. Giải mã thử thách bảo vệ thư khố.',
    successMsg: 'Một cuộn bản đồ được tìm thấy. Nó chỉ đến căn phòng sâu nhất của di tích!',
  },
  {
    frame: 12,
    title: 'Thử Thách 9 — Cổng Phong Ấn',
    desc: 'Cánh cổng lớn được bao quanh bởi 9 vòng ký hiệu hội tụ ánh sáng.',
    successMsg: 'Cổng phong ấn đã được giải khai. Phía sau nó là căn phòng chưa từng có dấu chân người!',
  },
  {
    frame: 13,
    title: 'Thử Thách 10 — Mật Mã Cuối Cùng',
    desc: 'Khối đá lơ lửng bùng phát năng lượng. Thời khắc quyết định bí mật di tích.',
    successMsg: 'Mười dấu ấn đồng loạt phát sáng. Khối đá cổ bắt đầu rung chuyển, để lộ một cánh cổng bí ẩn!',
  },
];

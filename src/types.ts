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

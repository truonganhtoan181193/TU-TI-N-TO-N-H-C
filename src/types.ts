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
  realm: string;
  treasureName: string;
  timestamp: number;
}

export type ScreenType =
  | 'intro'
  | 'register'
  | 'rules'
  | 'treasure'
  | 'quiz'
  | 'climax'
  | 'leaderboard'
  | 'review'
  | 'outro';

export const REALMS = [
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

export type RealmName = typeof REALMS[number];

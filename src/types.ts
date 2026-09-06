export type ParticipantId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export const PARTICIPANT_IDS: ParticipantId[] = ['P1', 'P2', 'P3', 'P4', 'P5'];

export interface ParticipantInfo {
  id: ParticipantId;
  name: string;
  avatarColor?: string;
}

export interface SheetResponse {
  timestamp: string;
  sessionId: string;
  participantId: ParticipantId;
  participantName: string;
  activityId: string;
  activityName: string;
  answerType: 'text' | 'rating' | 'choice' | 'complex';
  answer: string;
  updatedAt: string;
}

export type ActivityType =
  | 'emotion'           // 01. 오늘의 마음 온도
  | 'scene'             // 02. 내가 가장 인상 깊었던 장면
  | 'deep_questions'    // 03. 5개의 질문으로 다시 보는 소설
  | 'empathy_vote'      // 04. 강민주, 이해할 수 있는가?
  | 'power_shift'       // 05. 권력의 자리를 바꿔본다면?
  | 'random_situation'  // 05. 권력의 자리를 바꿔본다면? (호환)
  | 'era_compare'       // 06. 1992 -> 2026
  | 'forbidden_choice'  // 07. 금지된 선택
  | 'desired_ending'    // 08. 내가 원하는 결말
  | 'if_i_were'         // 09. 나라면 이렇게 했다
  | 'what_i_wish';      // 10. 나는 무엇을 소망하는가

export interface ActivityDefinition {
  id: string;
  orderNumber: string;
  title: string;
  subtitle: string;
  type: ActivityType;
  quote?: string;
  timeEstimate: string;
  questions: {
    key: string;
    label: string;
    placeholder?: string;
    options?: string[];
    description?: string;
  }[];
  hostDiscussionPoints?: string[];
}

export interface SyncStatus {
  state: 'connected' | 'checking' | 'error';
  lastSyncTime: string | null;
  errorMessage?: string;
  autoSyncIntervalSec: number;
}

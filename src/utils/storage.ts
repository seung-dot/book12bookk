import { ParticipantId, ParticipantInfo } from '../types';
import { DEFAULT_SESSION_ID } from '../data/activities';

const KEY_PARTICIPANT = 'bookclub_participant_profile';
const KEY_CUSTOM_SCRIPT_URL = 'bookclub_custom_script_url';
const KEY_SESSION_ID = 'bookclub_session_id';
const PREFIX_ANSWERS = 'bookclub_draft_';
const KEY_HOST_ACTIVITY = 'bookclub_host_activity_';

export function getStoredParticipant(): ParticipantInfo | null {
  try {
    const raw = localStorage.getItem(KEY_PARTICIPANT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get stored participant:', e);
    return null;
  }
}

export function saveStoredParticipant(p: ParticipantInfo): void {
  try {
    localStorage.setItem(KEY_PARTICIPANT, JSON.stringify(p));
  } catch (e) {
    console.error('Failed to save stored participant:', e);
  }
}

export function clearStoredParticipant(): void {
  localStorage.removeItem(KEY_PARTICIPANT);
}

export function getStoredCustomScriptUrl(): string {
  try {
    return localStorage.getItem(KEY_CUSTOM_SCRIPT_URL) || '';
  } catch {
    return '';
  }
}

export function saveStoredCustomScriptUrl(url: string): void {
  try {
    if (!url.trim()) {
      localStorage.removeItem(KEY_CUSTOM_SCRIPT_URL);
    } else {
      localStorage.setItem(KEY_CUSTOM_SCRIPT_URL, url.trim());
    }
  } catch (e) {
    console.error('Failed to save custom script url:', e);
  }
}

export function getStoredSessionId(): string {
  try {
    return localStorage.getItem(KEY_SESSION_ID) || DEFAULT_SESSION_ID;
  } catch {
    return DEFAULT_SESSION_ID;
  }
}

export function saveStoredSessionId(sessionId: string): void {
  try {
    localStorage.setItem(KEY_SESSION_ID, sessionId.trim() || DEFAULT_SESSION_ID);
  } catch (e) {
    console.error('Failed to save session ID:', e);
  }
}

// Local draft storage for participant answers so they are never lost
export function getLocalDraftAnswers(sessionId: string, participantId: ParticipantId): Record<string, any> {
  try {
    const key = `${PREFIX_ANSWERS}${sessionId}_${participantId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalDraftAnswer(
  sessionId: string,
  participantId: ParticipantId,
  activityId: string,
  answerData: any
): void {
  try {
    const key = `${PREFIX_ANSWERS}${sessionId}_${participantId}`;
    const current = getLocalDraftAnswers(sessionId, participantId);
    current[activityId] = {
      data: answerData,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save local draft answer:', e);
  }
}

// Stored host states (for shared random cards or host focus)
export function getStoredHostCard(sessionId: string, activityId: string): any {
  try {
    const raw = localStorage.getItem(`${KEY_HOST_ACTIVITY}${sessionId}_${activityId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredHostCard(sessionId: string, activityId: string, cardData: any): void {
  try {
    localStorage.setItem(`${KEY_HOST_ACTIVITY}${sessionId}_${activityId}`, JSON.stringify(cardData));
  } catch (e) {
    console.error('Failed to save host card:', e);
  }
}

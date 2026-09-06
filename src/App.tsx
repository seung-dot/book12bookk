import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ParticipantInfo,
  ParticipantId,
  SheetResponse,
  SyncStatus,
} from './types';
import {
  ACTIVITIES,
  SituationCard,
  IssueCard,
  SITUATION_CARDS,
  ISSUE_CARDS,
  DEFAULT_SESSION_ID,
} from './data/activities';
import { fetchResponses } from './services/googleSheets';
import {
  getStoredParticipant,
  saveStoredParticipant,
  clearStoredParticipant,
  getStoredSessionId,
  saveStoredSessionId,
  getStoredHostCard,
  saveStoredHostCard,
} from './utils/storage';
import { ParticipantSetup } from './components/ParticipantSetup';
import { ParticipantView } from './components/ParticipantView';
import { HostDashboard } from './components/HostDashboard';
import { Settings } from './components/Settings';
import { FinalResults } from './components/FinalResults';

type ViewMode = 'participant' | 'host' | 'settings' | 'results';

export default function App() {
  // Session handling (reads from URL ?session=... or localStorage or default)
  const [sessionId, setSessionId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('session');
    if (fromUrl && fromUrl.trim()) {
      saveStoredSessionId(fromUrl.trim());
      return fromUrl.trim();
    }
    return getStoredSessionId();
  });

  // Mode handling (reads from URL ?mode=... or default to 'participant')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'host') return 'host';
    if (mode === 'settings') return 'settings';
    if (mode === 'results') return 'results';
    return 'participant';
  });

  // Current participant profile
  const [participant, setParticipant] = useState<ParticipantInfo | null>(() => {
    return getStoredParticipant();
  });

  // Current active activity ID
  const [currentActivityId, setCurrentActivityId] = useState<string>(ACTIVITIES[0].id);

  // Synced Google Sheets responses
  const [responses, setResponses] = useState<SheetResponse[]>([]);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'checking',
    lastSyncTime: null,
    autoSyncIntervalSec: 3,
  });

  // Host drawn cards
  const [revealedSituationCard, setRevealedSituationCard] = useState<SituationCard | null>(() => {
    return getStoredHostCard(sessionId, 'power_shift') || SITUATION_CARDS[0];
  });

  const [revealedIssueCard, setRevealedIssueCard] = useState<IssueCard | null>(() => {
    return getStoredHostCard(sessionId, 'era_compare') || ISSUE_CARDS[0];
  });

  // Highlighted scenes by host
  const [highlightedScenes, setHighlightedScenes] = useState<Set<string>>(new Set());

  // Completed activities by the current participant
  const completedActivities = React.useMemo(() => {
    if (!participant) return new Set<string>();
    const done = new Set<string>();
    for (const r of responses) {
      if (r.participantId === participant.id) {
        done.add(r.activityId);
      }
    }
    return done;
  }, [responses, participant]);

  // Sync data from Google Sheets GET
  const isFetchingRef = useRef(false);

  const syncData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetchResponses(sessionId);
      const nowTime = new Date().toLocaleTimeString('ko-KR', { hour12: false });

      if (res.success) {
        setResponses(res.data);
        setSyncStatus({
          state: 'connected',
          lastSyncTime: nowTime,
          autoSyncIntervalSec: 3,
        });

        // Check if there are host card broadcast responses in the sheet
        const hostSituationResp = res.data.find(
          (r) => r.activityId === 'power_shift' && r.answerType === 'complex'
        );
        if (hostSituationResp) {
          try {
            const parsed = JSON.parse(hostSituationResp.answer);
            if (parsed.situationCard) {
              const matched = SITUATION_CARDS.find((c) => c.title === parsed.situationCard);
              if (matched) {
                setRevealedSituationCard(matched);
              }
            }
          } catch {
            // ignore
          }
        }

        const hostIssueResp = res.data.find(
          (r) => r.activityId === 'era_compare' && r.answerType === 'complex'
        );
        if (hostIssueResp) {
          try {
            const parsed = JSON.parse(hostIssueResp.answer);
            if (parsed.issueCard) {
              const matched = ISSUE_CARDS.find((c) => c.keyword === parsed.issueCard);
              if (matched) {
                setRevealedIssueCard(matched);
              }
            }
          } catch {
            // ignore
          }
        }
      } else {
        setSyncStatus((prev) => ({
          state: prev.lastSyncTime ? 'connected' : 'error',
          lastSyncTime: prev.lastSyncTime,
          errorMessage: res.error,
          autoSyncIntervalSec: 3,
        }));
      }
    } catch (e: any) {
      setSyncStatus((prev) => ({
        state: 'error',
        lastSyncTime: prev.lastSyncTime,
        errorMessage: e?.message || '연결 오류',
        autoSyncIntervalSec: 3,
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [sessionId]);

  // Initial sync and 3-second auto-refresh interval
  useEffect(() => {
    syncData();

    // 3-second polling interval as strictly requested in requirement [6] & [14]
    const interval = setInterval(() => {
      syncData();
    }, 3000);

    return () => clearInterval(interval);
  }, [syncData]);

  // URL state synchronization
  const updateUrlMode = (mode: ViewMode) => {
    setViewMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleParticipantComplete = (info: ParticipantInfo) => {
    saveStoredParticipant(info);
    setParticipant(info);
  };

  const handleChangeParticipant = () => {
    clearStoredParticipant();
    setParticipant(null);
  };

  const handleSituationCardPicked = (card: SituationCard) => {
    setRevealedSituationCard(card);
    saveStoredHostCard(sessionId, 'power_shift', card);
  };

  const handleIssueCardPicked = (issue: IssueCard) => {
    setRevealedIssueCard(issue);
    saveStoredHostCard(sessionId, 'era_compare', issue);
  };

  const handleToggleHighlightScene = (pId: string) => {
    setHighlightedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(pId)) {
        next.delete(pId);
      } else {
        next.add(pId);
      }
      return next;
    });
  };

  const handleSessionChanged = (newSessionId: string) => {
    setSessionId(newSessionId);
    saveStoredSessionId(newSessionId);
    const url = new URL(window.location.href);
    url.searchParams.set('session', newSessionId);
    window.history.replaceState({}, '', url.toString());
    syncData();
  };

  // Render view depending on state
  if (viewMode === 'settings') {
    return (
      <Settings
        onBack={() => updateUrlMode(participant ? 'participant' : 'host')}
        onSessionChanged={handleSessionChanged}
      />
    );
  }

  if (viewMode === 'results') {
    return (
      <FinalResults
        responses={responses}
        sessionId={sessionId}
        onBackToDashboard={() => updateUrlMode('host')}
      />
    );
  }

  if (viewMode === 'host') {
    return (
      <HostDashboard
        sessionId={sessionId}
        currentActivityId={currentActivityId}
        onSelectActivity={setCurrentActivityId}
        responses={responses}
        syncStatus={syncStatus}
        onManualRefresh={syncData}
        onOpenSettings={() => updateUrlMode('settings')}
        onGoToResults={() => updateUrlMode('results')}
        onGoToParticipant={() => updateUrlMode('participant')}
        revealedSituationCard={revealedSituationCard}
        onSituationCardPicked={handleSituationCardPicked}
        revealedIssueCard={revealedIssueCard}
        onIssueCardPicked={handleIssueCardPicked}
        highlightedScenes={highlightedScenes}
        onToggleHighlightScene={handleToggleHighlightScene}
      />
    );
  }

  // Participant Mode: if not registered, show setup
  if (!participant) {
    return (
      <ParticipantSetup
        onComplete={handleParticipantComplete}
        onGoToHost={() => updateUrlMode('host')}
      />
    );
  }

  return (
    <ParticipantView
      participant={participant}
      sessionId={sessionId}
      currentActivityId={currentActivityId}
      onSelectActivity={setCurrentActivityId}
      onChangeParticipant={handleChangeParticipant}
      onGoToHost={() => updateUrlMode('host')}
      onGoToResults={() => updateUrlMode('results')}
      revealedSituationCard={revealedSituationCard}
      revealedIssueCard={revealedIssueCard}
      completedActivities={completedActivities}
      syncStatus={syncStatus}
    />
  );
}

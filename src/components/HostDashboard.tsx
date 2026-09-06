import React, { useState } from 'react';
import {
  ActivityDefinition,
  SheetResponse,
  ParticipantId,
  PARTICIPANT_IDS,
  SyncStatus,
} from '../types';
import { ACTIVITIES, SituationCard, IssueCard } from '../data/activities';
import { exportBookClubToExcel } from '../utils/exportExcel';
import { LiveResults } from './LiveResults';
import { RandomSituationManager, RandomIssueManager } from './RandomCard';
import {
  BookOpen,
  RefreshCw,
  Settings as SettingsIcon,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HostDashboardProps {
  sessionId: string;
  currentActivityId: string;
  onSelectActivity: (activityId: string) => void;
  responses: SheetResponse[];
  syncStatus: SyncStatus;
  onManualRefresh: () => void;
  onOpenSettings: () => void;
  onGoToResults: () => void;
  onGoToParticipant: () => void;
  revealedSituationCard: SituationCard | null;
  onSituationCardPicked: (card: SituationCard) => void;
  revealedIssueCard: IssueCard | null;
  onIssueCardPicked: (issue: IssueCard) => void;
  highlightedScenes: Set<string>;
  onToggleHighlightScene: (participantId: string) => void;
}

const DEFAULT_NAMES: Record<ParticipantId, string> = {
  P1: '민지',
  P2: '수연',
  P3: '지은',
  P4: '현아',
  P5: '승혜',
};

export const HostDashboard: React.FC<HostDashboardProps> = ({
  sessionId,
  currentActivityId,
  onSelectActivity,
  responses,
  syncStatus,
  onManualRefresh,
  onOpenSettings,
  onGoToResults,
  onGoToParticipant,
  revealedSituationCard,
  onSituationCardPicked,
  revealedIssueCard,
  onIssueCardPicked,
  highlightedScenes,
  onToggleHighlightScene,
}) => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const currentIndex = ACTIVITIES.findIndex((a) => a.id === currentActivityId);
  const currentActivity = ACTIVITIES[currentIndex] || ACTIVITIES[0];

  // Map participant names from responses
  const participantNames: Record<ParticipantId, string> = { ...DEFAULT_NAMES };
  for (const r of responses) {
    if (r.participantName && participantNames[r.participantId]) {
      participantNames[r.participantId] = r.participantName;
    }
  }

  // Calculate completion for the current activity
  const currentActivityResponses = responses.filter((r) => r.activityId === currentActivity.id);
  const currentAnsweredIds = new Set(currentActivityResponses.map((r) => r.participantId));
  const completedCount = PARTICIPANT_IDS.filter((id) => currentAnsweredIds.has(id)).length;

  // Multi-sheet Excel download with Korean tabs and participant names in Column A
  const handleDownloadExcel = () => {
    exportBookClubToExcel(responses, sessionId, participantNames);
  };

  // CSV download function with UTF-8 BOM & Korean headers (작성자 in Column A)
  const downloadCsv = () => {
    const headers = [
      '작성자',
      '참가자ID',
      '코너명',
      '활동ID',
      '답변유형',
      '답변내용',
      '작성일시',
      '세션ID',
    ];

    const rows = responses.map((r) => {
      const pName = participantNames[r.participantId] || r.participantName || r.participantId;
      let readableAnswer = '';
      try {
        const parsed = JSON.parse(r.answer);
        if (typeof parsed === 'object') {
          readableAnswer = Object.entries(parsed)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
        } else {
          readableAnswer = String(r.answer);
        }
      } catch {
        readableAnswer = String(r.answer || '');
      }

      return [
        `"${pName.replace(/"/g, '""')}"`,
        `"${r.participantId}"`,
        `"${r.activityName.replace(/"/g, '""')}"`,
        `"${r.activityId}"`,
        `"${r.answerType}"`,
        `"${readableAnswer.replace(/"/g, '""')}"`,
        `"${r.updatedAt || r.timestamp}"`,
        `"${r.sessionId}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `독서모임_답변데이터_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectActivity(ACTIVITIES[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < ACTIVITIES.length - 1) {
      onSelectActivity(ACTIVITIES[currentIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242426] flex flex-col">
      {/* Top Professional Host Header */}
      <header className="bg-[#FFFDF9] border-b border-[#E8E1D5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Title & Session Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#222B38] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                  Host Dashboard
                </span>
                <span className="text-[11px] text-[#7A7367]">· 세션: {sessionId}</span>
              </div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#1F2633] tracking-tight">
                『나는 소망한다 내게 금지된 것을』 독서모임 진행자 화면
              </h1>
            </div>
          </div>

          {/* Sync & Live Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Google Sheets Live Status */}
            <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E2D8C9] px-3 py-1.5 rounded-xl">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  syncStatus.state === 'connected'
                    ? 'bg-[#3A7D44]'
                    : syncStatus.state === 'checking'
                    ? 'bg-[#DDA15E] animate-pulse'
                    : 'bg-[#C1121F]'
                }`}
              />
              <span className="font-semibold text-[#322E28]">
                {syncStatus.state === 'connected'
                  ? '● Google Sheets 연결됨'
                  : syncStatus.state === 'checking'
                  ? '○ 연결 확인 중'
                  : '⚠ Google Sheets 연결 오류'}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-[#6B6355]">
                마지막 동기화: <strong>{syncStatus.lastSyncTime || '-'}</strong>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-[#8B5E3C] font-semibold">자동 3초</span>
            </div>

            {/* Quick Action Buttons */}
            <button
              type="button"
              onClick={onManualRefresh}
              className="inline-flex items-center gap-1.5 bg-[#FFFDF9] border border-[#DCD3C3] hover:bg-[#F2ECE1] text-[#4A4339] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all active:scale-95 shadow-xs"
              title="수동으로 최신 데이터 가져오기"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#8B5E3C]" />
              <span>수동 새로고침</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 bg-[#FFFDF9] border border-[#DCD3C3] hover:bg-[#F2ECE1] text-[#4A4339] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all shadow-xs"
              title="설정"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[#635D52]" />
              <span>설정</span>
            </button>

            <button
              type="button"
              onClick={onGoToParticipant}
              className="inline-flex items-center gap-1 bg-[#222B38] text-white hover:bg-[#161D27] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>참가자 모드</span>
            </button>
          </div>
        </div>

        {/* 5 Participants Live Completion Strip */}
        <div className="bg-[#F8F4EC] border-t border-[#E8E1D5] px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#554E44]">
                참여자 ({completedCount}/5 완료):
              </span>
              <div className="flex items-center gap-2">
                {PARTICIPANT_IDS.map((pId) => {
                  const isDone = currentAnsweredIds.has(pId);
                  return (
                    <span
                      key={pId}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        isDone
                          ? 'bg-[#EAF5EC] border-[#BCDDC0] text-[#246130]'
                          : 'bg-[#FFFDF9] border-[#DDD3C2] text-[#8C8476]'
                      }`}
                    >
                      <span>{pId}</span>
                      <span>{participantNames[pId]}</span>
                      <span className="font-bold">{isDone ? '✓' : '○'}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Activities Navigation Strip */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {ACTIVITIES.map((act, idx) => {
                const isSelected = act.id === currentActivityId;
                const actResponses = responses.filter((r) => r.activityId === act.id);
                const actCount = new Set(actResponses.map((r) => r.participantId)).size;

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      onSelectActivity(act.id);
                      setShowAllActivities(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1 ${
                      isSelected && !showAllActivities
                        ? 'bg-[#222B38] text-white shadow-xs'
                        : 'bg-[#FFFDF9] border border-[#E2D8C9] text-[#554E44] hover:bg-[#EDE6DA]'
                    }`}
                  >
                    <span>{act.orderNumber}</span>
                    <span className="hidden md:inline">{act.title.substring(0, 5)}</span>
                    <span className="text-[10px] opacity-75 font-mono">({actCount}/5)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Host Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Host Control Toolbar */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1 bg-[#FAF7F2] border border-[#DED5C5] hover:bg-[#F2ECE1] text-[#4A4339] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>이전 활동</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === ACTIVITIES.length - 1}
              className="inline-flex items-center gap-1 bg-[#FAF7F2] border border-[#DED5C5] hover:bg-[#F2ECE1] text-[#4A4339] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>다음 활동</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowAllActivities((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                showAllActivities
                  ? 'bg-[#222B38] text-white border-[#222B38]'
                  : 'bg-[#FAF7F2] border-[#DED5C5] text-[#554E44] hover:bg-[#F2ECE1]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{showAllActivities ? '현재 활동 다시 보기' : '전체 답변 보기'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 bg-[#2E6B38] hover:bg-[#24562C] text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
              title="각 코너별 10개 시트와 작성자 이름이 A열에 정리된 Excel 파일 다운로드"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>📊 엑셀 다운로드 (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DED5C5] hover:bg-[#F2ECE1] text-[#4A4339] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
              title="한글 컬럼 및 작성자명 A열 기준 CSV 파일 다운로드"
            >
              <Download className="w-4 h-4 text-[#8B5E3C]" />
              <span>CSV 다운로드</span>
            </button>

            <button
              type="button"
              onClick={onGoToResults}
              className="inline-flex items-center gap-1.5 bg-[#8B5E3C] hover:bg-[#744A29] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>오늘의 5인 최종 기록</span>
            </button>
          </div>
        </div>

        {/* Current Activity Banner or All Activities View */}
        {!showAllActivities ? (
          <div className="space-y-6">
            {/* Current Activity Banner */}
            <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                    현재 활동 코스 ({currentIndex + 1} / {ACTIVITIES.length}) · {currentActivity.timeEstimate}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F2633] mt-0.5">
                    {currentActivity.orderNumber}. {currentActivity.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#635D52] mt-1">
                    {currentActivity.subtitle}
                  </p>
                </div>

                {/* 5 Participant Detailed Status Pills */}
                <div className="bg-[#FAF7F2] border border-[#E2D8C9] p-3 rounded-xl flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#554E44] mr-1">답변 상태:</span>
                  {PARTICIPANT_IDS.map((pId) => {
                    const isDone = currentAnsweredIds.has(pId);
                    return (
                      <span
                        key={pId}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border ${
                          isDone
                            ? 'bg-[#EAF5EC] border-[#BCDDC0] text-[#246130]'
                            : 'bg-[#FFFDF9] border-[#DDD3C2] text-[#8C8476]'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B38]" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#8C8476]" />
                        )}
                        <span>{pId}</span>
                        <span className="text-[11px] font-normal">({participantNames[pId]})</span>
                        <span>{isDone ? '답변 완료' : '작성 중'}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Random Situation Card Drawer for Activity 05 */}
              {currentActivity.id === 'power_shift' && (
                <div className="mb-6">
                  <RandomSituationManager
                    currentCard={revealedSituationCard}
                    onCardPicked={onSituationCardPicked}
                    isHost={true}
                  />
                </div>
              )}

              {/* Random Issue Card Drawer for Activity 06 */}
              {currentActivity.id === 'era_compare' && (
                <div className="mb-6">
                  <RandomIssueManager
                    currentIssue={revealedIssueCard}
                    onIssuePicked={onIssueCardPicked}
                    isHost={true}
                  />
                </div>
              )}

              {/* Live Visualizer for current activity */}
              <LiveResults
                activity={currentActivity}
                responses={responses}
                participantNames={participantNames}
                revealedSituationCard={revealedSituationCard}
                revealedIssueCard={revealedIssueCard}
                highlightedScenes={highlightedScenes}
                onToggleHighlightScene={onToggleHighlightScene}
              />
            </div>
          </div>
        ) : (
          /* View All Activities Answers */
          <div className="space-y-8">
            <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1F2633]">
                  10개 전 활동 통합 답변 대시보드
                </h2>
                <p className="text-xs text-[#7A7367] mt-0.5">
                  오늘 모임의 10개 코스 전체에 대해 5명의 실시간 제출 현황을 한 번에 확인합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllActivities(false)}
                className="text-xs font-semibold text-[#8B5E3C] bg-[#FAF7F2] border border-[#DED5C5] px-3.5 py-2 rounded-xl hover:bg-[#F2ECE1] cursor-pointer"
              >
                단일 활동 집중 보기로 복귀
              </button>
            </div>

            {ACTIVITIES.map((act) => {
              const actResp = responses.filter((r) => r.activityId === act.id);
              const count = new Set(actResp.map((r) => r.participantId)).size;

              return (
                <div
                  key={act.id}
                  className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
                    <div>
                      <span className="text-xs font-bold text-[#8B5E3C]">
                        {act.orderNumber} 코스
                      </span>
                      <h3 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
                        {act.title}
                      </h3>
                      <p className="text-xs text-[#6E6659]">{act.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E2D8C9] text-[#554E44]">
                        {count}/5명 제출
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectActivity(act.id);
                          setShowAllActivities(false);
                        }}
                        className="text-xs font-semibold text-[#8B5E3C] hover:underline cursor-pointer"
                      >
                        이 코스 진행하기 →
                      </button>
                    </div>
                  </div>

                  <LiveResults
                    activity={act}
                    responses={responses}
                    participantNames={participantNames}
                    revealedSituationCard={revealedSituationCard}
                    revealedIssueCard={revealedIssueCard}
                    highlightedScenes={highlightedScenes}
                    onToggleHighlightScene={onToggleHighlightScene}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

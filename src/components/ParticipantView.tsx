import React, { useState } from 'react';
import { ParticipantInfo, ActivityDefinition, SyncStatus } from '../types';
import { ACTIVITIES, SituationCard, IssueCard } from '../data/activities';
import { ProgressBar } from './ProgressBar';
import { ActivityCard } from './ActivityCard';
import { BookOpen, ChevronLeft, ChevronRight, User, Settings, CheckCircle2, RefreshCw } from 'lucide-react';

interface ParticipantViewProps {
  participant: ParticipantInfo;
  sessionId: string;
  currentActivityId: string;
  onSelectActivity: (activityId: string) => void;
  onChangeParticipant: () => void;
  onGoToHost: () => void;
  onGoToResults: () => void;
  revealedSituationCard?: SituationCard | null;
  revealedIssueCard?: IssueCard | null;
  completedActivities: Set<string>;
  syncStatus: SyncStatus;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  participant,
  sessionId,
  currentActivityId,
  onSelectActivity,
  onChangeParticipant,
  onGoToHost,
  onGoToResults,
  revealedSituationCard,
  revealedIssueCard,
  completedActivities,
  syncStatus,
}) => {
  const currentIndex = ACTIVITIES.findIndex((a) => a.id === currentActivityId);
  const currentActivity = ACTIVITIES[currentIndex] || ACTIVITIES[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectActivity(ACTIVITIES[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentIndex < ACTIVITIES.length - 1) {
      onSelectActivity(ACTIVITIES[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Last activity completed -> can view results
      onGoToResults();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242426] flex flex-col">
      {/* Mobile-optimized Header */}
      <header className="bg-[#FFFDF9] border-b border-[#E8E1D5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F3EDE2] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-serif font-bold text-[#1F2633] truncate max-w-[170px] sm:max-w-none">
                나는 소망한다 내게 금지된 것을
              </h1>
              <p className="text-[10px] text-[#7A7367]">5인 독서모임 · {sessionId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Participant Slot Badge */}
            <button
              type="button"
              onClick={onChangeParticipant}
              className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DED5C5] hover:border-[#8B5E3C] px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#222B38] cursor-pointer transition-all active:scale-95"
              title="참가자 변경"
            >
              <span className="w-4 h-4 rounded-full bg-[#222B38] text-white text-[10px] font-bold flex items-center justify-center">
                {participant.id}
              </span>
              <span className="max-w-[70px] truncate">{participant.name}</span>
            </button>

            {/* Switch to Host */}
            <button
              type="button"
              onClick={onGoToHost}
              className="text-[11px] text-[#8B5E3C] font-semibold hover:underline hidden sm:inline-block cursor-pointer px-1"
            >
              진행자 모드
            </button>
          </div>
        </div>

        {/* Progress Bar Component */}
        <ProgressBar
          currentActivityId={currentActivity.id}
          onSelectActivity={onSelectActivity}
          completedActivities={completedActivities}
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <ActivityCard
          activity={currentActivity}
          participant={participant}
          sessionId={sessionId}
          revealedSituationCard={revealedSituationCard}
          revealedIssueCard={revealedIssueCard}
        />

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 bg-[#FFFDF9] border border-[#DED5C5] hover:bg-[#F5EFE4] text-[#4A4339] font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전 활동</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-[#222B38] hover:bg-[#161D27] text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] text-sm"
          >
            <span>{currentIndex === ACTIVITIES.length - 1 ? '최종 기록 보기' : '다음 활동'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Badge on mobile */}
        <div className="pt-2 text-center text-[11px] text-[#8C8476] flex items-center justify-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              syncStatus.state === 'connected'
                ? 'bg-[#3A7D44]'
                : syncStatus.state === 'checking'
                ? 'bg-[#DDA15E] animate-pulse'
                : 'bg-[#C1121F]'
            }`}
          />
          <span>
            {syncStatus.state === 'connected'
              ? 'Google Sheets 실시간 동기화 준비됨'
              : syncStatus.state === 'checking'
              ? '동기화 확인 중'
              : '동기화 오류 (임시 저장됨)'}
          </span>
          <span className="text-gray-400">·</span>
          <button
            type="button"
            onClick={onGoToResults}
            className="text-[#8B5E3C] hover:underline font-medium cursor-pointer"
          >
            오늘의 5인 기록
          </button>
        </div>
      </main>
    </div>
  );
};

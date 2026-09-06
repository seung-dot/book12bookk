import React from 'react';
import { ACTIVITIES } from '../data/activities';

interface ProgressBarProps {
  currentActivityId: string;
  onSelectActivity?: (activityId: string) => void;
  completedActivities?: Set<string>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentActivityId,
  onSelectActivity,
  completedActivities = new Set(),
}) => {
  const currentIndex = ACTIVITIES.findIndex((a) => a.id === currentActivityId);
  const total = ACTIVITIES.length;
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="w-full bg-[#FAF7F2] border-b border-[#E8E1D5] px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-xs text-[#6B655B] mb-2 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#8B5E3C]" />
            <span>진행률</span>
            <span className="text-[#2B2824] font-semibold">{currentIndex + 1} / {total} 코스</span>
          </span>
          <span className="text-[#8B5E3C] font-semibold">{progressPercent}%</span>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-[#E5DEC9] h-1.5 rounded-full overflow-hidden mb-2.5">
          <div
            className="bg-[#8B5E3C] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Clickable activity chips scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {ACTIVITIES.map((act, idx) => {
            const isCurrent = act.id === currentActivityId;
            const isDone = completedActivities.has(act.id);

            return (
              <button
                key={act.id}
                type="button"
                onClick={() => onSelectActivity && onSelectActivity(act.id)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-150 flex items-center gap-1 cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#222B38] text-[#FDFBF7] font-semibold shadow-xs'
                    : isDone
                    ? 'bg-[#EAE4D7] text-[#554E44] hover:bg-[#DDD5C5]'
                    : 'bg-[#F2ECE1] text-[#8C8476] hover:bg-[#EAE4D7]'
                }`}
                title={act.title}
              >
                <span>{act.orderNumber}</span>
                <span className="hidden sm:inline">{act.title.substring(0, 7)}...</span>
                {isDone && <span className="text-[#3A7D44] text-[10px] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

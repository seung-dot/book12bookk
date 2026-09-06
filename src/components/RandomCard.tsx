import React, { useState } from 'react';
import { SituationCard, IssueCard, SITUATION_CARDS, ISSUE_CARDS } from '../data/activities';
import { Dices, Sparkles, Eye, Check } from 'lucide-react';

interface RandomSituationProps {
  currentCard: SituationCard | null;
  onCardPicked: (card: SituationCard) => void;
  isHost: boolean;
}

export const RandomSituationManager: React.FC<RandomSituationProps> = ({
  currentCard,
  onCardPicked,
  isHost,
}) => {
  const [isShuffling, setIsShuffling] = useState(false);

  const drawCard = () => {
    setIsShuffling(true);
    // filter out current card to ensure no consecutive repetition
    const available = SITUATION_CARDS.filter((c) => !currentCard || c.id !== currentCard.id);
    const pool = available.length > 0 ? available : SITUATION_CARDS;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      setIsShuffling(false);
      onCardPicked(picked);
    }, 450);
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] font-bold text-[#8B5E3C] tracking-wider uppercase">
            권력 역전 사고실험 (CARD 01 ~ CARD 07)
          </span>
          <h3 className="text-sm font-semibold text-[#1F2633]">
            7가지 딜레마 상황 시뮬레이션
          </h3>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={drawCard}
            disabled={isShuffling}
            className="inline-flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#774D2F] text-white px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Dices className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '카드 섞는 중...' : '🎲 추천 상황 카드 뽑기'}</span>
          </button>
        )}
      </div>

      {currentCard ? (
        <div className="bg-[#FAF7F2] border border-[#DED6C7] rounded-xl p-4 transition-all space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#222B38] text-white text-xs font-bold">
              {currentCard.cardNumber}
            </span>
            <span className="font-bold text-sm text-[#222B38]">
              {currentCard.title}
            </span>
            {isHost && (
              <span className="ml-auto text-[11px] text-[#4E7D55] font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                추천 카드로 설정됨
              </span>
            )}
          </div>
          <div className="text-xs text-[#3E3A34] leading-relaxed pl-1 whitespace-pre-line font-serif">
            “{currentCard.situation}”
          </div>
          <div className="bg-[#FFFDF9] border border-[#E2D8C9] p-2.5 rounded-lg text-xs">
            <span className="font-bold text-[#8B5E3C] block mb-0.5">💡 핵심 질문</span>
            <p className="text-[#1F2633] font-medium leading-snug">{currentCard.coreQuestion}</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#F6F2EB] border border-dashed border-[#DDD5C7] rounded-lg p-4 text-center">
          <p className="text-xs text-[#7A7367]">
            {isHost
              ? '위의 [🎲 추천 상황 카드 뽑기] 버튼을 눌러 오늘 토론할 기준 상황 카드를 뽑아주세요. (참가자는 각자 카드를 자유롭게 뽑을 수도 있습니다)'
              : '진행자가 상황 카드를 뽑으면 여기에 표시됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
};

interface RandomIssueProps {
  currentIssue: IssueCard | null;
  onIssuePicked: (issue: IssueCard) => void;
  isHost: boolean;
}

export const RandomIssueManager: React.FC<RandomIssueProps> = ({
  currentIssue,
  onIssuePicked,
  isHost,
}) => {
  const [isShuffling, setIsShuffling] = useState(false);

  const drawIssue = () => {
    setIsShuffling(true);
    const available = ISSUE_CARDS.filter((c) => !currentIssue || c.id !== currentIssue.id);
    const pool = available.length > 0 ? available : ISSUE_CARDS;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      setIsShuffling(false);
      onIssuePicked(picked);
    }, 450);
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] font-bold text-[#8B5E3C] tracking-wider uppercase">
            2026 현대 사회 이슈 키워드
          </span>
          <h3 className="text-sm font-semibold text-[#1F2633]">
            1992년의 소설 vs 2026년의 현실
          </h3>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={drawIssue}
            disabled={isShuffling}
            className="inline-flex items-center gap-2 bg-[#222B38] hover:bg-[#161D28] text-white px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '이슈 섞는 중...' : '랜덤 이슈 뽑기'}</span>
          </button>
        )}
      </div>

      {currentIssue ? (
        <div className="bg-[#FAF7F2] border border-[#DED6C7] rounded-lg p-4 transition-all">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-[#8B5E3C] text-white text-xs font-bold">
              현대 이슈
            </span>
            <span className="font-semibold text-sm text-[#222B38]">
              {currentIssue.keyword}
            </span>
          </div>
          <p className="text-xs text-[#5E584E] leading-relaxed mt-1 pl-1">
            {currentIssue.context}
          </p>
        </div>
      ) : (
        <div className="bg-[#F6F2EB] border border-dashed border-[#DDD5C7] rounded-lg p-4 text-center">
          <p className="text-xs text-[#7A7367]">
            {isHost
              ? '위의 [랜덤 이슈 뽑기] 버튼을 눌러 비교할 현대 담론 키워드를 뽑아주세요.'
              : '진행자가 이슈 키워드를 선정하면 여기에 표시됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
};

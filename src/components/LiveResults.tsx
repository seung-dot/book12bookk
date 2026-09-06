import React, { useState } from 'react';
import { ActivityDefinition, SheetResponse, ParticipantId, PARTICIPANT_IDS } from '../types';
import { SituationCard, IssueCard } from '../data/activities';
import { Star, MessageCircle, BarChart3, CheckCircle2, Clock, HelpCircle } from 'lucide-react';

interface LiveResultsProps {
  activity: ActivityDefinition;
  responses: SheetResponse[];
  participantNames?: Record<ParticipantId, string>;
  revealedSituationCard?: SituationCard | null;
  revealedIssueCard?: IssueCard | null;
  highlightedScenes?: Set<string>;
  onToggleHighlightScene?: (participantId: string) => void;
}

const DEFAULT_NAMES: Record<ParticipantId, string> = {
  P1: '민지',
  P2: '수연',
  P3: '지은',
  P4: '현아',
  P5: '승혜',
};

export const LiveResults: React.FC<LiveResultsProps> = ({
  activity,
  responses,
  participantNames = DEFAULT_NAMES,
  revealedSituationCard,
  revealedIssueCard,
  highlightedScenes = new Set(),
  onToggleHighlightScene,
}) => {
  const [selectedQuestionTab, setSelectedQuestionTab] = useState<number>(0);

  // Map participantId -> latest response for this activity
  const responseMap = new Map<ParticipantId, SheetResponse>();
  for (const r of responses) {
    if (r.activityId === activity.id) {
      responseMap.set(r.participantId, r);
    }
  }

  // Parse JSON answer safely
  const parseAnswer = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return { text: raw };
    }
  };

  return (
    <div className="space-y-6">
      {/* 01. Emotion Activity Live Display */}
      {activity.type === 'emotion' && (
        <div className="space-y-4">
          {/* Emotion chips summary */}
          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-2">
              감정 분포 현황
            </h4>
            <div className="flex flex-wrap gap-2">
              {activity.questions[0].options?.map((emotion) => {
                const count = Array.from(responseMap.values()).filter((r) => {
                  const p = parseAnswer(r.answer);
                  return p.emotion === emotion;
                }).length;

                return (
                  <div
                    key={emotion}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                      count > 0
                        ? 'bg-[#222B38] text-white border-[#222B38]'
                        : 'bg-[#FAF7F2] text-[#8C8476] border-[#E8E1D5]'
                    }`}
                  >
                    <span>{emotion}</span>
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        count > 0 ? 'bg-white/20 text-white' : 'bg-[#E5DEC9] text-[#635D52]'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 participant cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF5EC] text-[#2E6B38] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 답변 완료
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0ECE1] text-[#8C8476] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 작성 중
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="space-y-2 mt-2">
                      <div className="inline-block px-2.5 py-1 rounded-md bg-[#F2ECE1] text-[#8B5E3C] text-xs font-bold">
                        {pData.emotion || '감정 미선택'}
                      </div>
                      <p className="text-xs text-[#3E382F] leading-relaxed font-sans bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3]">
                        {pData.reason || '(이유 미작성)'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      참가자가 답변을 작성하고 있습니다.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 02. Scene Activity Live Display */}
      {activity.type === 'scene' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6B6458] bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-3">
            <span>
              💡 각 참가자가 꼽은 인상 깊은 장면입니다. 진행자는 <strong>[★ 오늘 이야기해볼 장면]</strong>을 클릭해 토론의 초점을 맞출 수 있습니다.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;
              const isHighlighted = highlightedScenes.has(pId);

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all relative ${
                    isHighlighted
                      ? 'bg-[#FFF9EE] border-[#D8A74A] ring-2 ring-[#E0B050]/50 shadow-md'
                      : hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>

                    {hasAnswer && onToggleHighlightScene && (
                      <button
                        type="button"
                        onClick={() => onToggleHighlightScene(pId)}
                        className={`text-xs px-2 py-1 rounded-md font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                          isHighlighted
                            ? 'bg-[#8B5E3C] text-white shadow-xs'
                            : 'bg-[#F2ECE1] text-[#7A7163] hover:bg-[#EAE2D3]'
                        }`}
                        title="오늘 이야기해볼 명장면으로 선정"
                      >
                        <Star className={`w-3.5 h-3.5 ${isHighlighted ? 'fill-current' : ''}`} />
                        <span>{isHighlighted ? '선정됨' : '선정'}</span>
                      </button>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="space-y-2 mt-2 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-[#8B5E3C] block">인상 깊었던 장면</span>
                        <p className="font-serif text-sm font-semibold text-[#1F2633] mt-0.5">
                          “{pData.scene || '(장면 미기재)'}”
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] space-y-1.5">
                        <div>
                          <span className="text-[10px] font-bold text-[#7A7367] block">기억에 남은 이유</span>
                          <p className="text-[#3E382F] leading-relaxed">{pData.reason || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#7A7367] block">느꼈던 감정</span>
                          <p className="text-[#3E382F] leading-relaxed">{pData.feeling || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-6 text-center">
                      장면 답변을 기다리는 중...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 03. 5 Deep Questions Live Display */}
      {activity.type === 'deep_questions' && (
        <div className="space-y-4">
          {/* Question selector tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E8E1D5]">
            {activity.questions.map((q, idx) => {
              const isSelected = selectedQuestionTab === idx;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => setSelectedQuestionTab(idx)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-xl cursor-pointer transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#222B38] text-white shadow-xs'
                      : 'bg-[#F2ECE1] text-[#635D52] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Q{idx + 1}. {q.label.substring(4, 18)}...
                </button>
              );
            })}
          </div>

          {/* Current Question Title */}
          <div className="bg-[#F8F4EC] border border-[#E0D7C6] rounded-xl p-3.5">
            <span className="text-xs font-bold text-[#8B5E3C]">
              Q{selectedQuestionTab + 1}
            </span>
            <h4 className="text-sm font-semibold text-[#1F2633] mt-0.5">
              {activity.questions[selectedQuestionTab]?.label}
            </h4>
          </div>

          {/* 5 participants answers for current question */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const qKey = activity.questions[selectedQuestionTab]?.key;
              const answerText = pData ? pData[qKey] : null;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    answerText
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {answerText ? (
                      <span className="text-[10px] font-bold text-[#2E6B38] bg-[#EAF5EC] px-2 py-0.5 rounded-full">
                        작성 완료
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8C8476] bg-[#F0ECE1] px-2 py-0.5 rounded-full">
                        작성 대기
                      </span>
                    )}
                  </div>

                  {answerText ? (
                    <p className="text-xs text-[#2F2B24] leading-relaxed bg-[#FAF7F2] p-3 rounded-lg border border-[#EAE2D3] min-h-[70px]">
                      {answerText}
                    </p>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      이 질문에 대한 답변이 아직 없습니다.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 04. Empathy Vote Bar Chart & Average */}
      {activity.type === 'empathy_vote' && (
        <div className="space-y-6">
          {/* Average and summary banner */}
          {(() => {
            const answeredList = PARTICIPANT_IDS.map((id) => {
              const res = responseMap.get(id);
              if (!res) return null;
              const data = parseAnswer(res.answer);
              return typeof data.score === 'number' ? data.score : null;
            }).filter((v): v is number => v !== null);

            const avg =
              answeredList.length > 0
                ? (answeredList.reduce((a, b) => a + b, 0) / answeredList.length).toFixed(1)
                : '-';

            return (
              <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E8E1D5] pb-5 mb-5">
                  <div>
                    <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                      강민주 이해도 투표 종합
                    </span>
                    <h3 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
                      우리 독서모임의 이해도 평균
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 bg-[#222B38] text-white px-6 py-3 rounded-2xl shadow-xs">
                    <span className="text-xs font-semibold text-gray-300">5인 평균 점수</span>
                    <span className="text-3xl sm:text-4xl font-extrabold font-serif text-[#FDFBF7]">
                      {avg}
                    </span>
                    <span className="text-xs text-gray-400">/ 10.0</span>
                  </div>
                </div>

                {/* Bar chart comparison */}
                <div className="space-y-3.5 max-w-2xl mx-auto">
                  {PARTICIPANT_IDS.map((pId) => {
                    const res = responseMap.get(pId);
                    const pData = res ? parseAnswer(res.answer) : null;
                    const score = typeof pData?.score === 'number' ? pData.score : null;
                    const percent = score !== null ? (score / 10) * 100 : 0;

                    return (
                      <div key={pId} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-semibold text-[#1F2633] shrink-0 truncate">
                          {pId} {res?.participantName || participantNames[pId]}
                        </div>

                        <div className="flex-1 bg-[#EAE3D5] h-6 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-[#8B5E3C] transition-all duration-500 rounded-lg flex items-center justify-end pr-2"
                            style={{ width: `${percent}%` }}
                          >
                            {score !== null && percent > 15 && (
                              <span className="text-[11px] font-bold text-white">
                                {score}점
                              </span>
                            )}
                          </div>
                          {score !== null && percent <= 15 && (
                            <span className="absolute left-2 top-1 text-[11px] font-bold text-[#3E382F]">
                              {score}점
                            </span>
                          )}
                          {score === null && (
                            <span className="absolute left-2 top-1 text-[10px] text-[#8C8476] italic">
                              투표 전
                            </span>
                          )}
                        </div>

                        <div className="w-12 text-right text-xs font-bold text-[#222B38]">
                          {score !== null ? `${score}점` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 5 participants' reason cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#222B38] text-white font-bold">
                        {pData.score ?? 5}점
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <p className="text-xs text-[#2F2B24] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-2">
                      {pData.reason || '(이유 미작성)'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      점수와 이유를 입력하고 있습니다.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Host discussion prompt box */}
          {activity.hostDiscussionPoints && (
            <div className="bg-[#F8F4EC] border border-[#E0D7C6] rounded-xl p-4 sm:p-5">
              <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                진행자 추천 토론 화두
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#3E382F]">
                {activity.hostDiscussionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#8B5E3C] font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 05. Power Shift Live Display */}
      {activity.type === 'power_shift' && (
        <div className="space-y-4">
          {/* Situation display banner */}
          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                권력 역전 딜레마 카드 (CARD 01 ~ CARD 07)
              </span>
              <span className="text-[11px] text-[#7A7367]">
                참가자 5인이 각자 랜덤 카드를 배정받아 자신의 선택과 이유를 나눕니다
              </span>
            </div>
            <p className="font-serif text-sm sm:text-base font-semibold text-[#1F2633] leading-relaxed">
              “{revealedSituationCard ? `[${revealedSituationCard.cardNumber}] ${revealedSituationCard.title}: ${revealedSituationCard.coreQuestion}` : '내가 힘을 가졌을 때, 나는 이전의 나와 다른 사람이 될 수 있을까?'}”
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (pData.choice || pData.judgment) && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#222B38] text-white font-bold truncate max-w-[130px]" title={pData.choice || pData.judgment}>
                        {pData.choice || pData.judgment}
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="mt-2 text-xs space-y-2">
                      {(pData.situationCard || pData.situationCardTitle) && (
                        <div className="p-2.5 bg-[#F4EFE6] border border-[#E8DFC8] rounded-lg">
                          <span className="text-[10px] font-bold text-[#8B5E3C] block mb-0.5">
                            📌 배정된 상황 카드
                          </span>
                          <p className="text-[#322E28] font-bold leading-snug">
                            {pData.situationCard || `${pData.situationCardNumber} ${pData.situationCardTitle}`}
                          </p>
                          {pData.coreQuestion && (
                            <p className="text-[11px] text-[#635746] mt-1 italic leading-snug">
                              Q. {pData.coreQuestion}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] space-y-1">
                        <span className="text-[10px] font-bold text-[#7A7164] block">나의 선택 및 이유</span>
                        <p className="text-[#3E382F] leading-relaxed">
                          {pData.reason || pData.judgmentReason || '(이유 미작성)'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      상황 카드를 확인하고 답변 작성 중...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 06. 1992 -> 2026 Live Display */}
      {activity.type === 'era_compare' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
              2026 현대 이슈 키워드
            </span>
            <p className="text-base font-bold text-[#1F2633] mt-0.5">
              {revealedIssueCard ? revealedIssueCard.keyword : '이슈 카드를 뽑아주세요.'}
            </p>
            {revealedIssueCard && (
              <p className="text-xs text-[#6A6357] mt-1">{revealedIssueCard.context}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (
                      <span className="text-[10px] font-bold text-[#2E6B38] bg-[#EAF5EC] px-2 py-0.5 rounded-full">
                        답변 완료
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <p className="text-xs text-[#3E382F] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-2">
                      {pData.reaction || '(의견 미작성)'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      2026년 예상 반응 작성 중...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 07. Forbidden Choice Live Display */}
      {activity.type === 'forbidden_choice' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold text-white ${
                          pData.choice === '한다'
                            ? 'bg-[#A84232]'
                            : pData.choice === '하지 않는다'
                            ? 'bg-[#2E6B38]'
                            : 'bg-[#8B5E3C]'
                        }`}
                      >
                        {pData.choice || '선택'}
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <p className="text-xs text-[#3E382F] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-2">
                      {pData.reason || '(이유 미작성)'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-4 text-center">
                      선택을 기다리는 중...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 08. Desired Ending Live Display */}
      {activity.type === 'desired_ending' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#8B5E3C] font-semibold">
                        원작: {pData.satisfaction || '-'}
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="space-y-2 mt-2 text-xs">
                      <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#EAE2D3]">
                        <span className="text-[10px] font-bold text-[#8B5E3C] block">바꾼 결말 방향</span>
                        <p className="font-semibold text-[#1F2633] mt-0.5">{pData.direction || '-'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#7A7367] block">다시 쓴 결말</span>
                        <p className="text-[#3E382F] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-0.5 font-serif">
                          “{pData.customEnding || '(서술 미작성)'}”
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-6 text-center">
                      원하는 결말을 구상하는 중...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 09. If I Were Live Display */}
      {activity.type === 'if_i_were' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PARTICIPANT_IDS.map((pId) => {
            const res = responseMap.get(pId);
            const pData = res ? parseAnswer(res.answer) : null;
            const hasAnswer = !!res;

            return (
              <div
                key={pId}
                className={`border rounded-xl p-4 transition-all ${
                  hasAnswer
                    ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                    : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                      {pId}
                    </span>
                    <span className="font-semibold text-sm text-[#1F2633]">
                      {res?.participantName || participantNames[pId] || pId}
                    </span>
                  </div>
                  {hasAnswer && (
                    <span className="text-[10px] font-bold text-[#2E6B38] bg-[#EAF5EC] px-2 py-0.5 rounded-full">
                      작성 완료
                    </span>
                  )}
                </div>

                {hasAnswer ? (
                  <div className="space-y-2 mt-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#8B5E3C] block">나라면 다르게 했을 점</span>
                      <p className="text-[#3E382F] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-0.5">
                        {pData.whatIDo || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#7A7367] block">강민주와 가장 달랐던 선택</span>
                      <p className="text-[#3E382F] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3] mt-0.5">
                        {pData.diffChoice || '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#9E9688] italic py-6 text-center">
                    답변을 기다리는 중...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 10. What I Wish Live Display */}
      {activity.type === 'what_i_wish' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PARTICIPANT_IDS.map((pId) => {
              const res = responseMap.get(pId);
              const pData = res ? parseAnswer(res.answer) : null;
              const hasAnswer = !!res;

              return (
                <div
                  key={pId}
                  className={`border rounded-xl p-4 transition-all ${
                    hasAnswer
                      ? 'bg-[#FFFDF9] border-[#DED5C5] shadow-xs'
                      : 'bg-[#F9F6F0] border-dashed border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {pId}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {res?.participantName || participantNames[pId] || pId}
                      </span>
                    </div>
                    {hasAnswer && (
                      <span className="text-[10px] font-bold text-[#8B5E3C] bg-[#F2ECE1] px-2 py-0.5 rounded-full">
                        소망 선언
                      </span>
                    )}
                  </div>

                  {hasAnswer ? (
                    <div className="space-y-2.5 mt-2 text-xs">
                      <div className="bg-[#222B38] text-white p-3 rounded-lg shadow-xs">
                        <span className="text-[10px] text-[#E0C09E] font-medium block">
                          내가 지금 소망하는 것은...
                        </span>
                        <p className="font-serif text-sm font-semibold text-[#FFFDF9] mt-0.5">
                          “{pData.myWish || '(소망 미작성)'}”
                        </p>
                      </div>

                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EAE2D3]">
                        <span className="text-[10px] font-bold text-[#7A7367] block">
                          오늘 이 책을 한 문장으로
                        </span>
                        <p className="text-[#3E382F] leading-relaxed mt-0.5 italic">
                          “{pData.oneSentence || '(한 줄 평 미작성)'}”
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#9E9688] italic py-6 text-center">
                      마지막 소망을 작성하고 있습니다.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

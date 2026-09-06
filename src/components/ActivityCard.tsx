import React, { useState, useEffect } from 'react';
import { ActivityDefinition, ParticipantInfo } from '../types';
import { SituationCard, IssueCard, SITUATION_CARDS, ISSUE_CARDS } from '../data/activities';
import { saveResponse } from '../services/googleSheets';
import { saveLocalDraftAnswer, getLocalDraftAnswers } from '../utils/storage';
import { Check, Send, AlertCircle, Bookmark, Sparkles, Sliders, Dices } from 'lucide-react';

interface ActivityCardProps {
  activity: ActivityDefinition;
  participant: ParticipantInfo;
  sessionId: string;
  revealedSituationCard?: SituationCard | null;
  revealedIssueCard?: IssueCard | null;
  onSavedSuccess?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  participant,
  sessionId,
  revealedSituationCard,
  revealedIssueCard,
  onSavedSuccess,
}) => {
  // Local state for answers based on activity
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDeepQuestionIndex, setActiveDeepQuestionIndex] = useState(0);
  const [isRollingSituationCard, setIsRollingSituationCard] = useState(false);

  // Load existing answer from local draft
  useEffect(() => {
    const drafts = getLocalDraftAnswers(sessionId, participant.id);
    const saved = drafts[activity.id];

    if (saved && saved.data) {
      if (activity.type === 'power_shift') {
        let cardId = saved.data.selectedCardId;
        if (!cardId && saved.data.situationCard) {
          const match = SITUATION_CARDS.find(
            (c) =>
              saved.data.situationCard.includes(c.title) ||
              saved.data.situationCard.includes(c.situation)
          );
          if (match) cardId = match.id;
        }
        if (!cardId) {
          cardId =
            revealedSituationCard?.id ||
            SITUATION_CARDS[Math.floor(Math.random() * SITUATION_CARDS.length)].id;
        }
        setFormValues({
          ...saved.data,
          selectedCardId: cardId,
        });
      } else {
        setFormValues(saved.data);
      }
    } else {
      // Default initial states
      if (activity.type === 'empathy_vote') {
        setFormValues({ score: 5, scoreReason: '' });
      } else if (activity.type === 'emotion') {
        setFormValues({ selectedEmotion: '', emotionReason: '' });
      } else if (activity.type === 'forbidden_choice') {
        setFormValues({ choice: '', choiceReason: '' });
      } else if (activity.type === 'desired_ending') {
        setFormValues({ satisfaction: '', direction: '', customEnding: '' });
      } else if (activity.type === 'power_shift') {
        // 5번째 코너 진입 시 랜덤으로 상황 카드 1장 자동 추첨 배정
        const randomCard =
          revealedSituationCard ||
          SITUATION_CARDS[Math.floor(Math.random() * SITUATION_CARDS.length)];
        setFormValues({
          selectedCardId: randomCard.id,
          judgment: '',
          judgmentReason: '',
        });
      } else {
        setFormValues({});
      }
    }
    setSavedSuccess(false);
    setErrorMessage(null);
  }, [activity.id, sessionId, participant.id, revealedSituationCard]);

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSavedSuccess(false);
  };

  // 5번째 코너: 랜덤 상황 카드 다시 뽑기 (기존 카드 제외하여 항상 새로운 카드 등장)
  const handleRollRandomSituation = () => {
    setIsRollingSituationCard(true);
    const curId = formValues.selectedCardId || (revealedSituationCard?.id || SITUATION_CARDS[0].id);
    const pool = SITUATION_CARDS.filter((c) => c.id !== curId);
    const available = pool.length > 0 ? pool : SITUATION_CARDS;
    const picked = available[Math.floor(Math.random() * available.length)];

    setTimeout(() => {
      setFormValues((prev) => ({
        ...prev,
        selectedCardId: picked.id,
        judgment: '',
      }));
      setIsRollingSituationCard(false);
    }, 350);
  };

  const handleSelectSituationCard = (cardId: string) => {
    if (formValues.selectedCardId !== cardId) {
      setFormValues((prev) => ({
        ...prev,
        selectedCardId: cardId,
        judgment: '',
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const nowIso = new Date().toISOString();

    // 1. Save to local storage first (instant local persistence)
    saveLocalDraftAnswer(sessionId, participant.id, activity.id, formValues);

    // 2. Prepare payload for Google Sheets
    let answerType: 'text' | 'rating' | 'choice' | 'complex' = 'text';
    let formattedAnswer = '';

    if (activity.type === 'empathy_vote') {
      answerType = 'rating';
      formattedAnswer = JSON.stringify({
        score: formValues.score ?? 5,
        reason: formValues.scoreReason || '',
      });
    } else if (activity.type === 'emotion') {
      answerType = 'choice';
      formattedAnswer = JSON.stringify({
        emotion: formValues.selectedEmotion || '',
        reason: formValues.emotionReason || '',
      });
    } else if (activity.type === 'scene') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify({
        scene: formValues.sceneDesc || '',
        reason: formValues.sceneReason || '',
        feeling: formValues.sceneFeeling || '',
      });
    } else if (activity.type === 'deep_questions') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify(formValues);
    } else if (activity.type === 'power_shift') {
      answerType = 'complex';
      const activeCard =
        SITUATION_CARDS.find((c) => c.id === formValues.selectedCardId) ||
        revealedSituationCard ||
        SITUATION_CARDS[0];

      formattedAnswer = JSON.stringify({
        situationCard: `[${activeCard.cardNumber}] ${activeCard.title}`,
        situationCardNumber: activeCard.cardNumber,
        situationCardTitle: activeCard.title,
        situationCardId: activeCard.id,
        coreQuestion: activeCard.coreQuestion,
        choice: formValues.judgment || '',
        judgment: formValues.judgment || '',
        reason: formValues.judgmentReason || '',
      });
    } else if (activity.type === 'era_compare') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify({
        issueCard: revealedIssueCard?.keyword || ISSUE_CARDS[0].keyword,
        reaction: formValues.eraReaction || '',
      });
    } else if (activity.type === 'forbidden_choice') {
      answerType = 'choice';
      formattedAnswer = JSON.stringify({
        choice: formValues.choice || '',
        reason: formValues.choiceReason || '',
      });
    } else if (activity.type === 'desired_ending') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify({
        satisfaction: formValues.satisfaction || '',
        direction: formValues.direction || '',
        customEnding: formValues.customEnding || '',
      });
    } else if (activity.type === 'if_i_were') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify({
        whatIDo: formValues.whatIDo || '',
        diffChoice: formValues.diffChoice || '',
      });
    } else if (activity.type === 'what_i_wish') {
      answerType = 'complex';
      formattedAnswer = JSON.stringify({
        myWish: formValues.myWish || '',
        oneSentence: formValues.oneSentence || '',
      });
    } else {
      formattedAnswer = JSON.stringify(formValues);
    }

    // 3. Send to Google Apps Script
    const res = await saveResponse({
      sessionId,
      participantId: participant.id,
      participantName: participant.name,
      activityId: activity.id,
      activityName: activity.title,
      answerType,
      answer: formattedAnswer,
      updatedAt: nowIso,
    });

    setIsSaving(false);

    if (res.success) {
      setSavedSuccess(true);
      if (onSavedSuccess) onSavedSuccess();
    } else {
      setErrorMessage(res.error || '저장 중 네트워크 지연이 발생했습니다. 브라우저에 임시 저장되었습니다.');
    }
  };

  return (
    <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl shadow-xs overflow-hidden">
      {/* Activity Header */}
      <div className="bg-[#F8F4EC] border-b border-[#E8E1D5] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE2D3] text-[#8B5E3C] text-xs font-bold">
            <Bookmark className="w-3.5 h-3.5" />
            {activity.orderNumber} 코스 · 소요시간 {activity.timeEstimate}
          </span>
          <span className="text-xs text-[#7A7367]">
            작성자: <strong className="text-[#2B2824]">{participant.id} ({participant.name})</strong>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F2633] tracking-tight">
          {activity.title}
        </h2>
        <p className="text-xs sm:text-sm text-[#635D52] mt-1 leading-relaxed">
          {activity.subtitle}
        </p>

        {activity.quote && (
          <div className="mt-3.5 pt-3 border-t border-[#E8DFC8]/60 text-xs italic text-[#7E7363] font-serif leading-relaxed">
            {activity.quote}
          </div>
        )}
      </div>

      {/* Main Interactive Form */}
      <form onSubmit={handleSave} className="p-5 sm:p-7 space-y-6">
        {/* 01. Emotion Activity */}
        {activity.type === 'emotion' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-2.5">
                책을 읽고 난 현재 감정을 선택해주세요.
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activity.questions[0].options?.map((opt) => {
                  const isChecked = formValues.selectedEmotion === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('selectedEmotion', opt)}
                      className={`p-3 rounded-xl text-center text-sm font-medium border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#222B38] text-white border-[#222B38] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#4F493F] border-[#E2D8C9] hover:bg-[#F0EAE0]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                왜 이런 감정이 들었나요?
              </label>
              <textarea
                value={formValues.emotionReason || ''}
                onChange={(e) => handleChange('emotionReason', e.target.value)}
                rows={4}
                placeholder="이 책을 읽으며 가장 크게 와닿았던 감정과 그 이유를 적어주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] transition-all resize-y"
              />
            </div>
          </div>
        )}

        {/* 02. Scene Activity */}
        {activity.type === 'scene' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                1. 어떤 장면이었나요?
              </label>
              <input
                type="text"
                value={formValues.sceneDesc || ''}
                onChange={(e) => handleChange('sceneDesc', e.target.value)}
                placeholder="머릿속에 떠오른 특정 사건이나 장소, 대사를 간략히 적어주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                2. 왜 기억에 남았나요?
              </label>
              <textarea
                value={formValues.sceneReason || ''}
                onChange={(e) => handleChange('sceneReason', e.target.value)}
                rows={3}
                placeholder="이 장면이 유독 뇌리에 박힌 이유를 나눠주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                3. 그 장면에서 어떤 감정을 느꼈나요?
              </label>
              <input
                type="text"
                value={formValues.sceneFeeling || ''}
                onChange={(e) => handleChange('sceneFeeling', e.target.value)}
                placeholder="당시 느꼈던 당혹감, 전율, 연민, 충격 등을 적어주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C]"
              />
            </div>
          </div>
        )}

        {/* 03. 5 Deep Questions */}
        {activity.type === 'deep_questions' && (
          <div className="space-y-4">
            {/* Question tabs for easy mobile navigation */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {activity.questions.map((q, idx) => {
                const isSelected = idx === activeDeepQuestionIndex;
                const hasAnswer = !!formValues[q.key];
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => setActiveDeepQuestionIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#222B38] text-white shadow-xs'
                        : hasAnswer
                        ? 'bg-[#EAE2D3] text-[#554E44]'
                        : 'bg-[#F2ECE1] text-[#8C8476] hover:bg-[#EAE2D3]'
                    }`}
                  >
                    Q{idx + 1}
                    {hasAnswer && <span className="ml-1 text-[10px] text-[#4E7D55]">●</span>}
                  </button>
                );
              })}
            </div>

            {/* Current Active Deep Question */}
            {activity.questions[activeDeepQuestionIndex] && (
              <div className="bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white text-xs font-bold flex items-center justify-center">
                    {activeDeepQuestionIndex + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-[#1F2633]">
                    {activity.questions[activeDeepQuestionIndex].label}
                  </h3>
                </div>

                <textarea
                  value={formValues[activity.questions[activeDeepQuestionIndex].key] || ''}
                  onChange={(e) =>
                    handleChange(activity.questions[activeDeepQuestionIndex].key, e.target.value)
                  }
                  rows={4}
                  placeholder={activity.questions[activeDeepQuestionIndex].placeholder}
                  className="w-full mt-2 bg-[#FFFDF9] border border-[#DDD3C2] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
                />

                <div className="flex justify-between items-center mt-3 text-xs text-[#7A7367]">
                  <span>5개 질문 중 {activeDeepQuestionIndex + 1}번째 질문</span>
                  <div className="flex gap-2">
                    {activeDeepQuestionIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveDeepQuestionIndex((prev) => prev - 1)}
                        className="text-[#8B5E3C] font-semibold hover:underline cursor-pointer"
                      >
                        ← 이전 질문
                      </button>
                    )}
                    {activeDeepQuestionIndex < activity.questions.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveDeepQuestionIndex((prev) => prev + 1)}
                        className="text-[#8B5E3C] font-semibold hover:underline cursor-pointer"
                      >
                        다음 질문 →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 04. Empathy Vote (Slider 0~10) */}
        {activity.type === 'empathy_vote' && (
          <div className="space-y-6">
            <div className="bg-[#FAF7F2] border border-[#E0D7C6] rounded-xl p-5 sm:p-6 text-center">
              <span className="text-xs text-[#8B5E3C] font-semibold uppercase tracking-wider">
                실시간 투표 슬라이더
              </span>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1F2633] mt-1 mb-4">
                강민주의 행동을 어디까지 이해할 수 있는가?
              </h3>

              {/* Score Display */}
              <div className="inline-flex items-baseline justify-center gap-1.5 px-6 py-2.5 rounded-2xl bg-[#222B38] text-white mb-5 shadow-xs">
                <span className="text-3xl sm:text-4xl font-extrabold font-serif">
                  {formValues.score ?? 5}
                </span>
                <span className="text-xs text-gray-300">/ 10점</span>
              </div>

              {/* Slider Input */}
              <div className="max-w-md mx-auto px-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={formValues.score ?? 5}
                  onChange={(e) => handleChange('score', parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-[#DDD3C2] rounded-lg appearance-none cursor-pointer accent-[#8B5E3C]"
                />
                <div className="flex justify-between text-xs text-[#6A6357] font-medium mt-2">
                  <span>0 (전혀 이해할 수 없다)</span>
                  <span>5 (중립)</span>
                  <span>10 (충분히 이해할 수 있다)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                이 점수를 매긴 이유를 간략히 적어주세요.
              </label>
              <textarea
                value={formValues.scoreReason || ''}
                onChange={(e) => handleChange('scoreReason', e.target.value)}
                rows={3}
                placeholder="그녀의 분노에는 공감하지만 방식에 동의할 수 없는지, 혹은 전면적 지지인지 서술해주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* 05. Power Shift (7 Dilemma Cards) */}
        {activity.type === 'power_shift' && (() => {
          const currentSituationCard =
            SITUATION_CARDS.find((c) => c.id === formValues.selectedCardId) ||
            revealedSituationCard ||
            SITUATION_CARDS[0];

          // 단락 나누기
          const paragraphs = currentSituationCard.situation.split('\n\n').filter(Boolean);

          return (
            <div className="space-y-6">
              {/* Random Situation Card Box */}
              <div className="bg-[#FFFDF9] border-2 border-[#8B5E3C]/35 rounded-2xl p-5 sm:p-6 shadow-xs transition-all relative overflow-hidden">
                {/* Header with Title & Random Shuffle Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EADFC9]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#8B5E3C] text-white text-xs font-bold tracking-wider shadow-xs shrink-0">
                      {currentSituationCard.cardNumber}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-[#8B5E3C] tracking-wider uppercase block">
                        권력 역전 사고실험
                      </span>
                      <h3 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
                        {currentSituationCard.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRollRandomSituation}
                    disabled={isRollingSituationCard}
                    className="inline-flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#744A29] text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-xs shrink-0"
                  >
                    <Dices className={`w-4 h-4 ${isRollingSituationCard ? 'animate-spin' : ''}`} />
                    <span>{isRollingSituationCard ? '카드 섞는 중...' : '🎲 다른 상황 카드 랜덤 뽑기'}</span>
                  </button>
                </div>

                {/* Situation Story Paragraphs */}
                <div className="py-4 space-y-2.5">
                  <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-xl border border-[#EAE1D1] space-y-3">
                    {paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        className="font-serif text-[15px] sm:text-base text-[#242320] font-normal leading-relaxed whitespace-pre-line"
                      >
                        {p}
                      </p>
                    ))}
                  </div>

                  {currentSituationCard.note && (
                    <div className="bg-[#F3EDE2] border border-[#DFCDB5] px-3.5 py-2.5 rounded-xl text-xs text-[#6B5A42] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                      <span>{currentSituationCard.note}</span>
                    </div>
                  )}
                </div>

                {/* Core Question Box */}
                <div className="bg-[#222B38] text-white p-4 rounded-xl shadow-xs">
                  <span className="text-[11px] font-bold text-[#E5B887] uppercase tracking-wider block mb-1">
                    💡 이 카드의 핵심 질문
                  </span>
                  <p className="font-serif text-base sm:text-lg font-semibold leading-snug">
                    “{currentSituationCard.coreQuestion}”
                  </p>
                </div>

                {/* Quick Selection Pills */}
                <div className="pt-3.5 mt-4 border-t border-[#EADFC9]/70 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#7A7367] mr-1 font-semibold">다른 카드 선택:</span>
                  {SITUATION_CARDS.map((c) => {
                    const isCur = c.id === currentSituationCard.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectSituationCard(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          isCur
                            ? 'bg-[#222B38] text-white shadow-xs'
                            : 'bg-[#FAF7F2] text-[#635D52] border border-[#DDD3C2] hover:bg-[#EAE2D3]'
                        }`}
                        title={c.title}
                      >
                        {c.cardNumber}. {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Options for This Card */}
              <div>
                <label className="block text-sm font-semibold text-[#242426] mb-2.5">
                  나라면 어떻게 할까? <span className="text-[#8B5E3C] font-normal">(4가지 중 1개 선택)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentSituationCard.options.map((opt) => {
                    const isSelected = formValues.judgment === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChange('judgment', opt)}
                        className={`p-3.5 rounded-xl text-left text-sm font-medium border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#222B38] text-white border-[#222B38] shadow-xs'
                            : 'bg-[#FAF7F2] text-[#343029] border-[#E0D5C3] hover:bg-[#F2ECE0]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'border-white bg-[#8B5E3C] text-white'
                              : 'border-[#C8BDB0] bg-white text-[#6F675A]'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason Textarea for Core Question & Decision */}
              <div>
                <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                  핵심 질문에 대한 생각과 그렇게 선택한 이유를 작성해주세요.
                </label>
                <textarea
                  value={formValues.judgmentReason || ''}
                  onChange={(e) => handleChange('judgmentReason', e.target.value)}
                  rows={4}
                  placeholder={`"${currentSituationCard.coreQuestion}"\n권력의 성격, 정당한 응징과 개인적 복수의 차이, 또는 상대방의 권리에 대한 나의 입장.`}
                  className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y leading-relaxed"
                />
              </div>
            </div>
          );
        })()}

        {/* 06. Era Compare (1992 -> 2026) */}
        {activity.type === 'era_compare' && (
          <div className="space-y-5">
            <div className="bg-[#F8F4EC] border border-[#E0D7C6] rounded-xl p-4 sm:p-5">
              <span className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                선정된 2026 현대 이슈 키워드
              </span>
              <div className="mt-1 text-base font-semibold text-[#1F2633]">
                {revealedIssueCard ? revealedIssueCard.keyword : ISSUE_CARDS[0].keyword}
              </div>
              <p className="text-xs text-[#6A6357] mt-1">
                {revealedIssueCard ? revealedIssueCard.context : ISSUE_CARDS[0].context}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                이 소설이 2026년에 처음 출간됐다면 어떤 반응을 얻었을까?
              </label>
              <textarea
                value={formValues.eraReaction || ''}
                onChange={(e) => handleChange('eraReaction', e.target.value)}
                rows={4}
                placeholder="SNS 반응, 미디어 비평, 대중의 여론, 법적 논란 등 오늘날 예상되는 반응을 자유롭게 상상해보세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* 07. Forbidden Choice */}
        {activity.type === 'forbidden_choice' && (
          <div className="space-y-5">
            <div className="bg-[#F8F4EC] border border-[#E0D7C6] rounded-xl p-4 sm:p-5 text-center">
              <p className="font-serif text-sm sm:text-base text-[#1F2633] leading-relaxed font-semibold">
                “나는 오랫동안 부당한 대우를 받았다.<br />
                복수할 기회가 생겼다. 하지만 누군가가 피해를 입는다.”
              </p>
              <p className="text-xs text-[#8B5E3C] font-semibold mt-2">
                당신이라면 이 기회를 잡겠습니까?
              </p>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-2">
                {['한다', '하지 않는다', '상황에 따라 다르다'].map((opt) => {
                  const isSelected = formValues.choice === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('choice', opt)}
                      className={`p-3 rounded-xl text-center text-sm font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#222B38] text-white border-[#222B38] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#4F493F] border-[#E2D8C9] hover:bg-[#F0EAE0]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                선택의 이유를 적어주세요. (정답은 없습니다)
              </label>
              <textarea
                value={formValues.choiceReason || ''}
                onChange={(e) => handleChange('choiceReason', e.target.value)}
                rows={3}
                placeholder="정의의 실현과 무고한 피해 사이에서 내가 기준 삼은 가치는 무엇인가요?"
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* 08. Desired Ending */}
        {activity.type === 'desired_ending' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-2">
                1. 이 소설의 원작 결말이 마음에 들었나요?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['좋았다', '아쉬웠다', '마음에 들지 않았다', '판단하기 어렵다'].map((opt) => {
                  const isSelected = formValues.satisfaction === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('satisfaction', opt)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#222B38] text-white border-[#222B38]'
                          : 'bg-[#FAF7F2] text-[#4F493F] border-[#E2D8C9] hover:bg-[#F0EAE0]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-2">
                2. 나라면 결말의 방향을 어떻게 바꿨을까?
              </label>
              <div className="space-y-1.5">
                {[
                  'A. 강민주가 처벌받는다.',
                  'B. 강민주가 자신의 행동을 후회한다.',
                  'C. 백승하가 강민주를 이해하게 된다.',
                  'D. 두 사람이 전혀 예상하지 못한 관계가 된다.',
                  'E. 완전히 새로운 결말을 만든다.',
                ].map((dir) => {
                  const isSelected = formValues.direction === dir;
                  return (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => handleChange('direction', dir)}
                      className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#222B38] text-white border-[#222B38]'
                          : 'bg-[#FAF7F2] text-[#3F3A32] border-[#E2D8C9] hover:bg-[#F0EAE0]'
                      }`}
                    >
                      {dir}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                3. 내가 작가라면 이렇게 끝냈을 것이다.
              </label>
              <textarea
                value={formValues.customEnding || ''}
                onChange={(e) => handleChange('customEnding', e.target.value)}
                rows={4}
                placeholder="내가 구상한 새로운 엔딩 씬이나 대사를 자유롭고 생생하게 서술해주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* 09. If I Were */}
        {activity.type === 'if_i_were' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                만약 내가 강민주의 입장이었다면? 나는 무엇을 다르게 했을까?
              </label>
              <textarea
                value={formValues.whatIDo || ''}
                onChange={(e) => handleChange('whatIDo', e.target.value)}
                rows={4}
                placeholder="사회적 분노와 결핍을 해소하기 위해 나라면 어떤 경로를 택했을지 적어주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                내가 강민주와 가장 달랐던 선택은 무엇인가?
              </label>
              <textarea
                value={formValues.diffChoice || ''}
                onChange={(e) => handleChange('diffChoice', e.target.value)}
                rows={3}
                placeholder="그녀와 나의 결정적 차이점이 된 신념이나 가치관에 대해 적어주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* 10. What I Wish */}
        {activity.type === 'what_i_wish' && (
          <div className="space-y-6">
            <div className="bg-[#222B38] text-white rounded-2xl p-6 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest text-[#D3B08E] font-medium mb-1">
                마지막 소망 선언
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                나는 소망한다. 내게 금지된 것을.
              </h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                내가 지금 소망하는 것은 __________이다.
              </label>
              <input
                type="text"
                value={formValues.myWish || ''}
                onChange={(e) => handleChange('myWish', e.target.value)}
                placeholder="예: 자유롭게 나로서 존재하는 것, 세상의 시선에서 온전히 해방되는 것"
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-base text-[#242426] font-medium placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#242426] mb-1.5">
                오늘 이 책을 한 문장으로 표현한다면?
              </label>
              <textarea
                value={formValues.oneSentence || ''}
                onChange={(e) => handleChange('oneSentence', e.target.value)}
                rows={3}
                placeholder="2시간의 깊은 대화를 마친 후 마음속에 남은 단 하나의 문장을 남겨주세요."
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl p-3.5 text-sm text-[#242426] placeholder-[#9E9587] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] resize-y"
              />
            </div>
          </div>
        )}

        {/* Status messages */}
        {savedSuccess && (
          <div className="p-3.5 bg-[#EAF5EC] border border-[#BCDDC0] rounded-xl flex items-center gap-2 text-[#2E6B38] text-sm font-medium animate-fade-in">
            <Check className="w-5 h-5 shrink-0" />
            <span>✓ 저장되었습니다. Google Sheets 및 진행자 화면에 반영되었습니다.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl flex items-center gap-2 text-[#992E2E] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button: [답변 저장] */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#8B5E3C] hover:bg-[#774E30] text-[#FFFDF9] font-medium py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60 text-base"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Google Sheets 저장 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>답변 저장</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#8C8476] mt-2">
            답변을 수정한 후 다시 [답변 저장]을 누르면 진행자 화면에 최신 내용으로 즉시 갱신됩니다.
          </p>
        </div>
      </form>
    </div>
  );
};

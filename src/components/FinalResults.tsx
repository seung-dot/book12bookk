import React, { useState } from 'react';
import { SheetResponse, ParticipantId, PARTICIPANT_IDS } from '../types';
import { ACTIVITIES, DEFAULT_SESSION_NAME } from '../data/activities';
import { exportBookClubToExcel } from '../utils/exportExcel';
import {
  BookOpen,
  Download,
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  Heart,
  Award,
  Sparkles,
  UserCheck,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';

interface FinalResultsProps {
  responses: SheetResponse[];
  sessionId: string;
  onBackToDashboard: () => void;
}

const DEFAULT_NAMES: Record<ParticipantId, string> = {
  P1: '민지',
  P2: '수연',
  P3: '지은',
  P4: '현아',
  P5: '승혜',
};

export const FinalResults: React.FC<FinalResultsProps> = ({
  responses,
  sessionId,
  onBackToDashboard,
}) => {
  const [viewMode, setViewMode] = useState<'corner' | 'participant'>('corner');
  const [selectedParticipantTab, setSelectedParticipantTab] = useState<ParticipantId>('P1');

  // Group responses by participant and activity
  const participantData: Record<ParticipantId, { name: string; answers: Record<string, any> }> = {
    P1: { name: DEFAULT_NAMES.P1, answers: {} },
    P2: { name: DEFAULT_NAMES.P2, answers: {} },
    P3: { name: DEFAULT_NAMES.P3, answers: {} },
    P4: { name: DEFAULT_NAMES.P4, answers: {} },
    P5: { name: DEFAULT_NAMES.P5, answers: {} },
  };

  for (const r of responses) {
    if (participantData[r.participantId]) {
      if (r.participantName) {
        participantData[r.participantId].name = r.participantName;
      }
      try {
        participantData[r.participantId].answers[r.activityId] = JSON.parse(r.answer);
      } catch {
        participantData[r.participantId].answers[r.activityId] = r.answer;
      }
    }
  }

  const participantNames: Record<ParticipantId, string> = {
    P1: participantData.P1.name,
    P2: participantData.P2.name,
    P3: participantData.P3.name,
    P4: participantData.P4.name,
    P5: participantData.P5.name,
  };

  // Calculate average empathy score
  const empathyScores = PARTICIPANT_IDS.map((pId) => {
    const d = participantData[pId].answers['empathy_vote'];
    return typeof d?.score === 'number' ? d.score : null;
  }).filter((s): s is number => s !== null);

  const avgEmpathy =
    empathyScores.length > 0
      ? (empathyScores.reduce((a, b) => a + b, 0) / empathyScores.length).toFixed(1)
      : '-';

  // Excel (.xlsx) download function with separate sheets for each corner
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
        const parsed = typeof r.answer === 'string' ? JSON.parse(r.answer) : r.answer;
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
    link.setAttribute('download', `나는소망한다_독서모임기록_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242426] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E1D5] no-print">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8B5E3C] hover:text-[#704627] bg-[#FFFDF9] border border-[#DED5C5] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>진행자 대시보드로 돌아가기</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-[#2E6B38] hover:bg-[#24562C] text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              title="10개 코너별 시트 + 작성자별 모아보기 탭이 분리된 Excel 파일 다운로드"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>📊 엑셀 다운로드 (.xlsx / 코너별 10개 시트)</span>
            </button>

            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-[#FAF7F2] border border-[#DED5C5] hover:bg-[#F2ECE1] text-[#4A4339] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              title="한글 컬럼 및 작성자명 A열 기준 CSV 파일 다운로드"
            >
              <Download className="w-4 h-4 text-[#8B5E3C]" />
              <span>CSV 다운로드</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-[#222B38] hover:bg-[#161D27] text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF</span>
            </button>
          </div>
        </div>

        {/* Official Literary Book Club Certificate/Record Banner */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xs">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F3EDE2] text-[#8B5E3C] mb-2">
              <BookOpen className="w-7 h-7" />
            </div>

            <p className="text-xs uppercase tracking-widest text-[#8B5E3C] font-bold">
              {DEFAULT_SESSION_NAME}
            </p>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F2633] tracking-tight leading-snug">
              오늘 우리 5명이 남긴 기록
            </h1>

            <p className="font-serif italic text-sm sm:text-base text-[#6E6659]">
              “나는 소망한다. 내게 금지된 것을.”
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#544E44]">
              {PARTICIPANT_IDS.map((id) => (
                <span
                  key={id}
                  className="px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E2D8C9]"
                >
                  {id} · {participantData[id].name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-5 text-center shadow-xs">
            <span className="text-xs font-bold text-[#8B5E3C] block">참여 인원</span>
            <span className="text-2xl font-serif font-bold text-[#1F2633] mt-1 block">
              5명 전원 완주
            </span>
            <span className="text-[11px] text-[#7A7367]">2시간 심층 토론 완료</span>
          </div>

          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-5 text-center shadow-xs">
            <span className="text-xs font-bold text-[#8B5E3C] block">강민주 이해도 평균</span>
            <span className="text-3xl font-serif font-extrabold text-[#1F2633] mt-1 block">
              {avgEmpathy} <span className="text-sm font-normal text-[#8A8274]">/ 10</span>
            </span>
            <span className="text-[11px] text-[#7A7367]">5명 투표 종합 결과</span>
          </div>

          <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-5 text-center shadow-xs">
            <span className="text-xs font-bold text-[#8B5E3C] block">누적 기록 데이터</span>
            <span className="text-2xl font-serif font-bold text-[#1F2633] mt-1 block">
              {responses.length}개 답변
            </span>
            <span className="text-[11px] text-[#7A7367]">Google Sheets 중앙 보존</span>
          </div>
        </div>

        {/* View Mode Switcher: 코너별 모아보기 vs 작성자별 모아보기 */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-2 sm:p-2.5 shadow-xs no-print">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('corner')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'corner'
                  ? 'bg-[#222B38] text-white shadow-xs'
                  : 'bg-transparent text-[#6B6355] hover:bg-[#FAF7F2]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>코너별 모아보기 (전체 토론)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('participant')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'participant'
                  ? 'bg-[#8B5E3C] text-white shadow-xs'
                  : 'bg-transparent text-[#6B6355] hover:bg-[#FAF7F2]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>작성자별 모아보기 (5인 개인별 전체 답변)</span>
            </button>
          </div>

          <span className="text-[11px] text-[#8C8476] px-2 hidden sm:inline">
            {viewMode === 'corner'
              ? '전체 참가자의 답변을 주제별로 나란히 비교합니다'
              : '선택한 작성자의 10개 코너 전체 답변을 한눈에 확인합니다'}
          </span>
        </div>

        {/* PARTICIPANT VIEW MODE */}
        {viewMode === 'participant' && (
          <div className="space-y-6">
            {/* Participant selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
              {PARTICIPANT_IDS.map((pId) => {
                const isSelected = pId === selectedParticipantTab;
                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => setSelectedParticipantTab(pId)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#8B5E3C] text-white shadow-xs'
                        : 'bg-[#FFFDF9] border border-[#E2D8C9] text-[#554E44] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-[#8B5E3C]' : 'bg-[#222B38] text-white'}`}>
                      {pId}
                    </span>
                    <span>{participantNames[pId]}의 답변 모음</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Participant's 10 Corner Answers */}
            <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-bold text-sm">
                    {selectedParticipantTab}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#1F2633]">
                      {participantNames[selectedParticipantTab]} 님의 독서모임 기록집
                    </h3>
                    <p className="text-xs text-[#7A7367]">
                      『나는 소망한다 내게 금지된 것을』 10개 활동 전 문항 작성 내역
                    </p>
                  </div>
                </div>

                <span className="text-xs px-3 py-1 bg-[#F4EFE6] text-[#8B5E3C] font-semibold rounded-full">
                  작성자: {participantNames[selectedParticipantTab]} ({selectedParticipantTab})
                </span>
              </div>

              {/* 10 Activities List for this Participant */}
              <div className="space-y-4">
                {ACTIVITIES.map((act) => {
                  const rawAns = participantData[selectedParticipantTab].answers[act.id];
                  const hasAnswer = rawAns !== undefined && rawAns !== null && rawAns !== '';

                  return (
                    <div
                      key={act.id}
                      className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-2xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#8B5E3C] bg-[#FFFDF9] border border-[#DDD3C2] px-2.5 py-0.5 rounded-md">
                            {act.orderNumber}
                          </span>
                          <h4 className="font-serif font-bold text-[#1F2633] text-sm">
                            {act.title}
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#8C8476]">
                          {hasAnswer ? '작성 완료 ✓' : '미작성'}
                        </span>
                      </div>

                      {/* Content rendering per activity type */}
                      {!hasAnswer ? (
                        <p className="text-xs text-[#A0988A] italic">아직 작성된 답변이 없습니다.</p>
                      ) : act.id === 'emotion' ? (
                        <div className="text-xs space-y-2">
                          <div>
                            <span className="text-[#8B5E3C] font-semibold">선택한 감정: </span>
                            <span className="inline-block px-2.5 py-1 bg-[#222B38] text-white rounded-md font-bold">
                              {rawAns.emotion || '(선택 없음)'}
                            </span>
                          </div>
                          <p className="text-[#3F3B35] leading-relaxed bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                            {rawAns.reason || '(이유 미작성)'}
                          </p>
                        </div>
                      ) : act.id === 'scene' ? (
                        <div className="text-xs space-y-2">
                          <div className="bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4] space-y-1.5">
                            <p className="font-bold text-[#1F2633]">
                              <span className="text-[#8B5E3C]">장면: </span>{rawAns.scene || '(장면 미작성)'}
                            </p>
                            <p className="text-[#4A4339]">
                              <span className="text-[#8B5E3C]">이유: </span>{rawAns.reason || '(이유 미작성)'}
                            </p>
                            {rawAns.feeling && (
                              <p className="text-[#6B6355]">
                                <span className="text-[#8B5E3C]">감정: </span>{rawAns.feeling}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : act.id === 'deep_questions' ? (
                        <div className="text-xs space-y-2">
                          {[
                            { key: 'q1', label: 'Q1. 강민주의 백승하 납치' },
                            { key: 'q2', label: 'Q2. 백승하의 심리 변화' },
                            { key: 'q3', label: 'Q3. 백승하의 누나와 편지' },
                            { key: 'q4', label: 'Q4. 비극적 결말의 의미' },
                            { key: 'q5', label: 'Q5. "금지된 것"의 상징' },
                          ].map(({ key, label }) => (
                            rawAns[key] ? (
                              <div key={key} className="bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                                <p className="font-semibold text-[#8B5E3C] text-[11px] mb-1">{label}</p>
                                <p className="text-[#2F2B24] leading-relaxed">{rawAns[key]}</p>
                              </div>
                            ) : null
                          ))}
                        </div>
                      ) : act.id === 'empathy_vote' ? (
                        <div className="text-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#8B5E3C] font-semibold">이해도 점수:</span>
                            <span className="text-lg font-serif font-bold text-[#1F2633] px-3 py-0.5 bg-[#FFFDF9] border border-[#DDD3C2] rounded-lg">
                              {rawAns.score !== undefined ? `${rawAns.score}점` : '-'} / 10점
                            </span>
                          </div>
                          <p className="text-[#3F3B35] leading-relaxed bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                            {rawAns.reason || '(이유 미작성)'}
                          </p>
                        </div>
                      ) : act.id === 'power_shift' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <p className="font-bold text-[#1F2633]">
                            <span className="text-[#8B5E3C]">상황 카드: </span>
                            {rawAns.situationCard || (rawAns.situationCardNumber ? `${rawAns.situationCardNumber} ${rawAns.situationCardTitle}` : '')}
                          </p>
                          {rawAns.coreQuestion && (
                            <p className="text-[11px] text-[#635746] italic">
                              <span className="text-[#8B5E3C] font-semibold">핵심 질문: </span>Q. {rawAns.coreQuestion}
                            </p>
                          )}
                          <p className="font-semibold text-[#222B38]">
                            <span className="text-[#8B5E3C]">나의 선택: </span>{rawAns.choice || rawAns.judgment}
                          </p>
                          <p className="text-[#4A4339] leading-relaxed">
                            <span className="text-[#8B5E3C]">선택 근거: </span>{rawAns.reason}
                          </p>
                        </div>
                      ) : act.id === 'era_compare' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <p className="font-bold text-[#1F2633]">
                            <span className="text-[#8B5E3C]">2026 현대 이슈: </span>{rawAns.issueCard}
                          </p>
                          <p className="text-[#4A4339] leading-relaxed">
                            <span className="text-[#8B5E3C]">강민주의 예상 반응: </span>{rawAns.reaction}
                          </p>
                        </div>
                      ) : act.id === 'forbidden_choice' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <p className="font-bold text-[#1F2633]">
                            <span className="text-[#8B5E3C]">나의 선택: </span>{rawAns.choice}
                          </p>
                          <p className="text-[#4A4339] leading-relaxed">
                            <span className="text-[#8B5E3C]">선택 이유: </span>{rawAns.reason}
                          </p>
                        </div>
                      ) : act.id === 'desired_ending' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <div className="flex flex-wrap gap-3 pb-1 border-b border-[#E8E1D5]">
                            <span className="text-[#4A4339]">
                              <strong className="text-[#8B5E3C]">원작 만족도: </strong>{rawAns.satisfaction}
                            </span>
                            <span className="text-[#4A4339]">
                              <strong className="text-[#8B5E3C]">방향: </strong>{rawAns.direction}
                            </span>
                          </div>
                          <p className="text-[#1F2633] font-serif leading-relaxed italic pt-1">
                            “{rawAns.customEnding}”
                          </p>
                        </div>
                      ) : act.id === 'if_i_were' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <p className="text-[#3F3B35]">
                            <strong className="text-[#8B5E3C]">나라면 다르게 했을 점: </strong>{rawAns.whatIDo}
                          </p>
                          <p className="text-[#3F3B35]">
                            <strong className="text-[#8B5E3C]">강민주와 가장 달랐던 선택: </strong>{rawAns.diffChoice}
                          </p>
                        </div>
                      ) : act.id === 'what_i_wish' ? (
                        <div className="text-xs space-y-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4]">
                          <p className="text-sm font-serif font-bold text-[#1F2633]">
                            <span className="text-[#8B5E3C]">지금 소망하는 것: </span>“{rawAns.myWish}”
                          </p>
                          <p className="text-xs text-[#6B6355] italic">
                            <span className="text-[#8B5E3C]">책에 바치는 한 문장: </span>“{rawAns.oneSentence}”
                          </p>
                        </div>
                      ) : (
                        <pre className="text-xs bg-[#FFFDF9] p-3 rounded-xl border border-[#E5DEC4] whitespace-pre-wrap font-sans">
                          {typeof rawAns === 'string' ? rawAns : JSON.stringify(rawAns, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CORNER VIEW MODE (Original 4 parts) */}
        {viewMode === 'corner' && (
          <>
            {/* Section 1: 감정과 인상 깊었던 장면 */}
            <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E8E1D5] pb-3">
            <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
              Part 1 · 감정의 파동과 명장면
            </span>
            <h2 className="text-xl font-serif font-bold text-[#1F2633] mt-0.5">
              책을 읽고 난 후의 감정과 가장 기억에 남은 한 장면
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {PARTICIPANT_IDS.map((id) => {
              const emotion = participantData[id].answers['emotion'];
              const scene = participantData[id].answers['scene'];

              return (
                <div
                  key={id}
                  className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-4 flex flex-col justify-between text-xs space-y-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#1F2633] mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#222B38] text-white text-[10px] flex items-center justify-center">
                        {id}
                      </span>
                      <span>{participantData[id].name}</span>
                    </div>

                    <div className="mb-2">
                      <span className="text-[10px] text-[#8B5E3C] font-bold block">독서 후 감정</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#222B38] text-white text-[11px] font-semibold">
                        {emotion?.emotion || '기록 없음'}
                      </span>
                      {emotion?.reason && (
                        <p className="text-[11px] text-[#554E44] mt-1 italic">
                          “{emotion.reason}”
                        </p>
                      )}
                    </div>

                    <div className="border-t border-[#E8E1D5] pt-2">
                      <span className="text-[10px] text-[#8B5E3C] font-bold block">기억에 남은 장면</span>
                      <p className="font-serif font-semibold text-[#1F2633] mt-0.5">
                        “{scene?.scene || '기록 없음'}”
                      </p>
                      {scene?.reason && (
                        <p className="text-[10px] text-[#6E6659] mt-1 leading-relaxed">
                          {scene.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: 강민주 이해도 & 윤리적 판단 */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E8E1D5] pb-3">
            <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
              Part 2 · 윤리와 권력의 질문
            </span>
            <h2 className="text-xl font-serif font-bold text-[#1F2633] mt-0.5">
              강민주 이해도 점수와 금지된 선택의 딜레마
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PARTICIPANT_IDS.map((id) => {
              const vote = participantData[id].answers['empathy_vote'];
              const forbidden = participantData[id].answers['forbidden_choice'];
              const power = participantData[id].answers['power_shift'];

              return (
                <div
                  key={id}
                  className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-4 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-2">
                    <span className="font-bold text-[#1F2633]">{id} {participantData[id].name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#8B5E3C] text-white font-bold text-[11px]">
                      {vote?.score ?? '-'}점
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#7A7367] block">권력 역전 상황 판단</span>
                    {(power?.situationCard || power?.situationCardTitle) && (
                      <span className="text-[10px] font-medium text-[#8B5E3C] block truncate mt-0.5">
                        {power.situationCardNumber ? `[${power.situationCardNumber}]` : (power.situationCardLetter ? `[${power.situationCardLetter}카드]` : '')} {power.situationCardTitle || power.situationCard}
                      </span>
                    )}
                    <span className="font-semibold text-[#1F2633] block mt-0.5 truncate" title={power?.choice || power?.judgment}>
                      {power?.choice || power?.judgment || '미선택'}
                    </span>
                    {power?.reason && (
                      <p className="text-[10px] text-[#635D52] mt-0.5 line-clamp-2">{power.reason}</p>
                    )}
                  </div>

                  <div className="border-t border-[#E8E1D5] pt-2">
                    <span className="text-[10px] text-[#7A7367] block">복수의 기회 앞에서의 선택</span>
                    <span className="font-bold text-[#8B5E3C] block mt-0.5">
                      {forbidden?.choice || '미선택'}
                    </span>
                    {forbidden?.reason && (
                      <p className="text-[10px] text-[#635D52] mt-0.5 line-clamp-2">{forbidden.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: 각자가 다시 쓴 결말 */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E8E1D5] pb-3">
            <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
              Part 3 · 우리가 꿈꾼 또 다른 결말
            </span>
            <h2 className="text-xl font-serif font-bold text-[#1F2633] mt-0.5">
              원작 결말의 아쉬움을 넘어 5명의 작가로서 다시 쓴 엔딩
            </h2>
          </div>

          <div className="space-y-3">
            {PARTICIPANT_IDS.map((id) => {
              const ending = participantData[id].answers['desired_ending'];

              return (
                <div
                  key={id}
                  className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#222B38] text-white text-xs font-bold flex items-center justify-center">
                        {id}
                      </span>
                      <span className="font-semibold text-sm text-[#1F2633]">
                        {participantData[id].name}의 결말
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#EFE9DD] text-[#6B6355]">
                        원작 평가: {ending?.satisfaction || '-'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#222B38] text-white font-medium">
                        {ending?.direction || '새 결말'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#2F2B24] font-serif leading-relaxed pl-8 mt-1 italic">
                    “{ending?.customEnding || '새로 쓴 결말이 아직 작성되지 않았습니다.'}”
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: 마지막 소망 선언과 한 줄 서평 */}
        <div className="bg-[#222B38] text-[#FAF7F2] rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#D3B08E] font-semibold">
              The Grand Finale
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              “나는 소망한다. 내게 금지된 것을.”
            </h2>
            <p className="text-xs text-gray-300">
              오늘 2시간 동안 5명이 빚어낸 진솔한 소망과 한 문장의 마침표
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
            {PARTICIPANT_IDS.map((id) => {
              const wish = participantData[id].answers['what_i_wish'];

              return (
                <div
                  key={id}
                  className="bg-[#2B3545] border border-[#3E4A5E] rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#3E4A5E] pb-2">
                      <span className="w-5 h-5 rounded-full bg-[#D3B08E] text-[#1F2633] text-[10px] font-bold flex items-center justify-center">
                        {id}
                      </span>
                      <span className="font-semibold text-sm text-[#FFFDF9]">
                        {participantData[id].name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#D3B08E] uppercase font-bold block">
                        지금 소망하는 것
                      </span>
                      <p className="text-xs font-serif font-semibold text-[#FFFDF9] mt-1 leading-relaxed">
                        “{wish?.myWish || '(소망 미작성)'}”
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">
                        책에 바치는 한 문장
                      </span>
                      <p className="text-[11px] text-gray-300 italic mt-1 leading-relaxed">
                        “{wish?.oneSentence || '(한 줄 평 미작성)'}”
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-[#8C8476] space-y-1">
          <p>양귀자 『나는 소망한다 내게 금지된 것을』 5인 독서모임 웹앱</p>
          <p>세션 ID: {sessionId} · 모든 기록은 영구 보존됩니다.</p>
        </div>
      </div>
    </div>
  );
};

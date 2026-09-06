import * as XLSX from 'xlsx';
import { SheetResponse, ParticipantId, PARTICIPANT_IDS } from '../types';
import { ACTIVITIES } from '../data/activities';

const DEFAULT_NAMES: Record<ParticipantId, string> = {
  P1: '민지',
  P2: '수연',
  P3: '지은',
  P4: '현아',
  P5: '승혜',
};

// Safely parse JSON answers
function parseAnswer(answerStr: any): Record<string, any> {
  if (!answerStr) return {};
  if (typeof answerStr === 'object') return answerStr;
  try {
    return JSON.parse(answerStr);
  } catch {
    return { text: String(answerStr) };
  }
}

/**
 * Exports book club responses into a multi-sheet Excel (.xlsx) file:
 * - Each corner/activity has its own dedicated sheet
 * - Column 1 is always '작성자' (Participant Name)
 * - All headers and texts are 100% in Korean
 * - Includes a '작성자별 모아보기' tab and a '전체 답변 목록' tab
 */
export function exportBookClubToExcel(
  responses: SheetResponse[],
  sessionId: string,
  participantNames?: Record<ParticipantId, string>
) {
  const names: Record<ParticipantId, string> = {
    ...DEFAULT_NAMES,
    ...(participantNames || {}),
  };

  // Find updated participant names from responses if available
  for (const r of responses) {
    if (r.participantId && r.participantName && names[r.participantId]) {
      names[r.participantId] = r.participantName;
    }
  }

  // Deduplicate by participantId + activityId (keep latest)
  const latestMap = new Map<string, SheetResponse>();
  for (const r of responses) {
    const key = `${r.participantId}__${r.activityId}`;
    const prev = latestMap.get(key);
    if (!prev || new Date(r.updatedAt || r.timestamp).getTime() > new Date(prev.updatedAt || prev.timestamp).getTime()) {
      latestMap.set(key, r);
    }
  }

  const wb = XLSX.utils.book_new();

  // Helper to set column widths nicely
  const applyColWidths = (ws: XLSX.WorkSheet, colWidths: number[]) => {
    ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  };

  // 1. 코너 01: 오늘의 마음 온도
  {
    const sheetData = [
      ['작성자', '참가자 ID', '선택한 감정', '이유 및 생각', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__emotion`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.emotion || parsed.selectedEmotion || (resp ? '기록됨' : '미작성'),
        parsed.reason || parsed.emotionReason || parsed.text || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 20, 45, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '01. 마음 온도');
  }

  // 2. 코너 02: 인상 깊은 장면
  {
    const sheetData = [
      ['작성자', '참가자 ID', '인상 깊었던 장면', '기억에 남은 이유', '당시 느꼈던 감정', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__scene`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.scene || parsed.sceneDesc || (resp ? '기록됨' : '미작성'),
        parsed.reason || parsed.sceneReason || '',
        parsed.feeling || parsed.sceneFeeling || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 35, 35, 25, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '02. 인상 깊은 장면');
  }

  // 3. 코너 03: 5개 심층 질문
  {
    const sheetData = [
      [
        '작성자',
        '참가자 ID',
        'Q1. 강민주의 백승하 납치',
        'Q2. 백승하의 심리 변화',
        'Q3. 누나와의 관계와 편지',
        'Q4. 비극적 결말의 의미',
        'Q5. "금지된 것"의 상징',
        '작성일시',
        '세션 ID',
      ],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__deep_questions`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.q1 || '',
        parsed.q2 || '',
        parsed.q3 || '',
        parsed.q4 || '',
        parsed.q5 || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 35, 35, 35, 35, 35, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '03. 5개 심층 질문');
  }

  // 4. 코너 04: 강민주 이해도 투표
  {
    const sheetData = [
      ['작성자', '참가자 ID', '이해도 점수 (0~10점)', '점수를 준 이유', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__empathy_vote`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.score !== undefined ? `${parsed.score}점` : (resp ? '기록됨' : '미작성'),
        parsed.reason || parsed.scoreReason || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 20, 50, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '04. 강민주 이해도');
  }

  // 5. 코너 05: 권력 역전 상황 (7가지 딜레마)
  {
    const sheetData = [
      ['작성자', '참가자 ID', '상황 카드 번호 및 제목', '핵심 질문', '나의 선택', '선택 근거 및 생각', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__power_shift`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.situationCard || (parsed.situationCardNumber ? `[${parsed.situationCardNumber}] ${parsed.situationCardTitle}` : ''),
        parsed.coreQuestion || '',
        parsed.choice || parsed.judgment || '',
        parsed.reason || parsed.judgmentReason || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 26, 35, 26, 50, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '05. 권력 역전 상황');
  }

  // 6. 코너 06: 1992 vs 2026
  {
    const sheetData = [
      ['작성자', '참가자 ID', '2026 현대 이슈', '강민주의 예상 반응', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__era_compare`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.issueCard || '',
        parsed.reaction || parsed.eraReaction || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 25, 55, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '06. 1992 vs 2026');
  }

  // 7. 코너 07: 금지된 선택
  {
    const sheetData = [
      ['작성자', '참가자 ID', '나의 선택', '선택한 이유', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__forbidden_choice`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.choice || '',
        parsed.reason || parsed.choiceReason || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 20, 50, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '07. 금지된 선택');
  }

  // 8. 코너 08: 내가 원하는 결말
  {
    const sheetData = [
      ['작성자', '참가자 ID', '원작 결말 만족도', '원하는 결말 방향', '내가 다시 쓴 결말', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__desired_ending`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.satisfaction || '',
        parsed.direction || '',
        parsed.customEnding || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 20, 25, 50, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '08. 내가 원하는 결말');
  }

  // 9. 코너 09: 나라면 이렇게
  {
    const sheetData = [
      ['작성자', '참가자 ID', '나라면 다르게 했을 점', '강민주와 가장 달랐던 선택', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__if_i_were`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.whatIDo || '',
        parsed.diffChoice || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 40, 40, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '09. 나라면 이렇게');
  }

  // 10. 코너 10: 나의 소망
  {
    const sheetData = [
      ['작성자', '참가자 ID', '내가 지금 소망하는 것', '책에 바치는 한 문장', '작성일시', '세션 ID'],
    ];
    for (const pId of PARTICIPANT_IDS) {
      const resp = latestMap.get(`${pId}__what_i_wish`);
      const parsed = resp ? parseAnswer(resp.answer) : {};
      sheetData.push([
        names[pId],
        pId,
        parsed.myWish || '',
        parsed.oneSentence || '',
        resp?.updatedAt || resp?.timestamp || '',
        sessionId,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 45, 45, 22, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '10. 나의 소망');
  }

  // 11. 작성자별 모아보기 (Participant Centric Sheet)
  {
    const sheetData: any[][] = [
      ['작성자', '참가자 ID', '코너 번호 및 코너명', '핵심 요약 답변', '상세 내용 및 이유', '작성일시'],
    ];

    for (const pId of PARTICIPANT_IDS) {
      const pName = names[pId];
      for (const act of ACTIVITIES) {
        const resp = latestMap.get(`${pId}__${act.id}`);
        if (!resp) {
          sheetData.push([pName, pId, `${act.orderNumber}. ${act.title}`, '(미작성)', '', '']);
          continue;
        }

        const parsed = parseAnswer(resp.answer);
        let summary = '';
        let detail = '';

        if (act.id === 'emotion') {
          summary = parsed.emotion || '';
          detail = parsed.reason || '';
        } else if (act.id === 'scene') {
          summary = parsed.scene || '';
          detail = [parsed.reason, parsed.feeling].filter(Boolean).join(' | ');
        } else if (act.id === 'deep_questions') {
          summary = parsed.q1 || parsed.q4 || '5개 심층 질문 답변';
          detail = [parsed.q1, parsed.q2, parsed.q3, parsed.q4, parsed.q5].filter(Boolean).join(' / ');
        } else if (act.id === 'empathy_vote') {
          summary = parsed.score !== undefined ? `${parsed.score}점` : '';
          detail = parsed.reason || '';
        } else if (act.id === 'power_shift') {
          summary = `${parsed.situationCard || ''}: ${parsed.judgment || ''}`;
          detail = parsed.reason || '';
        } else if (act.id === 'era_compare') {
          summary = parsed.issueCard || '';
          detail = parsed.reaction || '';
        } else if (act.id === 'forbidden_choice') {
          summary = parsed.choice || '';
          detail = parsed.reason || '';
        } else if (act.id === 'desired_ending') {
          summary = `${parsed.satisfaction || ''} (${parsed.direction || ''})`;
          detail = parsed.customEnding || '';
        } else if (act.id === 'if_i_were') {
          summary = parsed.whatIDo || '';
          detail = parsed.diffChoice || '';
        } else if (act.id === 'what_i_wish') {
          summary = parsed.myWish || '';
          detail = parsed.oneSentence || '';
        } else {
          summary = typeof resp.answer === 'string' ? resp.answer : JSON.stringify(resp.answer);
        }

        sheetData.push([
          pName,
          pId,
          `${act.orderNumber}. ${act.title}`,
          summary,
          detail,
          resp.updatedAt || resp.timestamp,
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 25, 35, 50, 20]);
    XLSX.utils.book_append_sheet(wb, ws, '작성자별 모아보기');
  }

  // 12. 전체 답변 목록 (Master List)
  {
    const sheetData: any[][] = [
      ['작성자', '참가자 ID', '활동 ID', '코너명', '답변 유형', '답변 내용(요약)', '작성일시', '세션 ID'],
    ];

    for (const r of responses) {
      const pName = names[r.participantId] || r.participantName || r.participantId;
      const parsed = parseAnswer(r.answer);
      let readableAnswer = '';
      if (typeof parsed === 'object') {
        readableAnswer = Object.entries(parsed)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
      } else {
        readableAnswer = String(r.answer || '');
      }

      sheetData.push([
        pName,
        r.participantId,
        r.activityId,
        r.activityName,
        r.answerType,
        readableAnswer,
        r.updatedAt || r.timestamp,
        r.sessionId || sessionId,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    applyColWidths(ws, [12, 10, 15, 25, 12, 60, 20, 18]);
    XLSX.utils.book_append_sheet(wb, ws, '전체 답변 목록');
  }

  // Write and trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  XLSX.writeFile(wb, `나는소망한다_독서모임_결과_${dateStr}_${sessionId}.xlsx`);
}

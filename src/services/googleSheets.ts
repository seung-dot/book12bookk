import { SheetResponse, ParticipantId } from '../types';
import { getStoredCustomScriptUrl } from '../utils/storage';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxYCJ1_NmTpQD_iTV3RYHxntPNrzgAic4c1xZS6_1XPivXdaVYOyItJX84hX9uddfaXFw/exec';

/**
 * URL priority:
 * 1. localStorage custom URL set by user
 * 2. import.meta.env.VITE_GOOGLE_SCRIPT_URL
 * 3. Default Apps Script URL specified in requirements
 */
export function getActiveScriptUrl(): string {
  const customUrl = getStoredCustomScriptUrl();
  if (customUrl && customUrl.startsWith('https://script.google.com/')) {
    return customUrl.trim();
  }

  const envUrl = (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('https://script.google.com/')) {
    return envUrl.trim();
  }

  return DEFAULT_SCRIPT_URL;
}

export interface SaveResponsePayload {
  sessionId: string;
  participantId: ParticipantId;
  participantName: string;
  activityId: string;
  activityName: string;
  answerType: 'text' | 'rating' | 'choice' | 'complex';
  answer: string;
  updatedAt: string;
}

/**
 * Saves a participant's answer to Google Sheets via Google Apps Script Web App.
 * Uses no-cors mode with text/plain header to reliably bypass Google Apps Script 302 CORS redirection.
 */
export async function saveResponse(payload: SaveResponsePayload): Promise<{ success: boolean; error?: string }> {
  const scriptUrl = getActiveScriptUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Google Apps Script doPost receives the body in e.postData.contents.
    // 'text/plain;charset=utf-8' with no-cors avoids browser pre-flight failure while delivering the JSON payload.
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return { success: true };
  } catch (err: any) {
    console.error('Error in saveResponse:', err);
    return {
      success: false,
      error: err?.message || '네트워크 통신 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Fetches all responses for a given sessionId from Google Sheets via Google Apps Script doGet.
 */
export async function fetchResponses(sessionId: string): Promise<{
  success: boolean;
  data: SheetResponse[];
  error?: string;
}> {
  const scriptUrl = getActiveScriptUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    // Cache-buster query param prevents stale proxy responses
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const targetUrl = `${scriptUrl}${separator}sessionId=${encodeURIComponent(sessionId)}&_t=${Date.now()}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    let rawList: any[] = [];
    if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (Array.isArray(json)) {
      rawList = json;
    } else if (json && json.success && Array.isArray(json.responses)) {
      rawList = json.responses;
    }

    const normalized = normalizeResponses(rawList);
    const latest = getLatestResponses(normalized);

    return {
      success: true,
      data: latest,
    };
  } catch (err: any) {
    console.warn('Error fetching responses from Google Sheets:', err);
    return {
      success: false,
      data: [],
      error: err?.message || '구글 시트 조회 실패',
    };
  }
}

/**
 * Tests connection to Google Apps Script Web App.
 */
export async function testConnection(targetUrl?: string): Promise<{
  success: boolean;
  message: string;
  dataCount?: number;
}> {
  const urlToTest = targetUrl || getActiveScriptUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const separator = urlToTest.includes('?') ? '&' : '?';
    const res = await fetch(`${urlToTest}${separator}test=true&_t=${Date.now()}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const count = Array.isArray(data?.data) ? data.data.length : 0;
      return {
        success: true,
        message: 'Google Sheets 연결 성공',
        dataCount: count,
      };
    } else {
      return {
        success: false,
        message: `Google Sheets 연결 실패 (HTTP ${res.status}). Apps Script 배포 및 접근 권한을 확인해주세요.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Google Sheets 연결 실패. Apps Script 배포 및 접근 권한을 확인해주세요. (${err?.message || '네트워크 오류'})`,
    };
  }
}

/**
 * Normalizes raw sheet data rows into consistent SheetResponse format.
 * Supports both legacy English headers and new Korean multi-sheet headers.
 */
export function normalizeResponses(raw: any[]): SheetResponse[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const participantId = (
        item.participantId ||
        item.ParticipantId ||
        item['참가자 ID'] ||
        item.참가자ID ||
        item['참가자ID'] ||
        ''
      ).toString().trim() as ParticipantId;

      const activityId = (
        item.activityId ||
        item.ActivityId ||
        item['활동 ID'] ||
        item.활동ID ||
        ''
      ).toString().trim();

      const sessionId = (
        item.sessionId ||
        item.SessionId ||
        item['세션 ID'] ||
        item.세션ID ||
        ''
      ).toString().trim();

      if (!participantId || !activityId) {
        return null;
      }

      // Format answer nicely
      let rawAnswer = item.원본데이터 || item.answer || item.Answer || item['핵심 답변'] || '';
      if (typeof rawAnswer !== 'string') {
        rawAnswer = JSON.stringify(rawAnswer);
      }

      return {
        timestamp: item.작성일시 || item.timestamp || item.Timestamp || new Date().toISOString(),
        sessionId: sessionId || 'default',
        participantId: participantId,
        participantName: item.작성자 || item.participantName || item.ParticipantName || participantId,
        activityId: activityId,
        activityName: item['코너명 (활동)'] || item.코너명 || item.activityName || item.ActivityName || activityId,
        answerType: (item.답변유형 || item.answerType || item.AnswerType || 'text') as any,
        answer: rawAnswer,
        updatedAt: item.작성일시 || item.updatedAt || item.UpdatedAt || item.timestamp || new Date().toISOString(),
      };
    })
    .filter((r): r is SheetResponse => r !== null);
}

/**
 * Deduplicates responses by participantId + activityId + sessionId.
 * Always keeps the one with the latest updatedAt timestamp.
 */
export function getLatestResponses(responses: SheetResponse[]): SheetResponse[] {
  const map = new Map<string, SheetResponse>();

  for (const r of responses) {
    const key = `${r.sessionId}__${r.participantId}__${r.activityId}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, r);
    } else {
      const timeCurrent = new Date(r.updatedAt || r.timestamp).getTime();
      const timeExisting = new Date(existing.updatedAt || existing.timestamp).getTime();

      if (timeCurrent > timeExisting) {
        map.set(key, r);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Official Google Apps Script Code.gs content to display in Settings with copy button.
 * Fully organized:
 * 1. Dedicated sheet for each of the 10 corners
 * 2. Participant Name (작성자) as the very first Column A
 * 3. 100% Korean headers and human-readable parsed fields (no ugly raw JSON)
 * 4. Master '전체 모아보기' sheet for comprehensive review
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script for 『나는 소망한다 내게 금지된 것을』 5인 독서모임
 * 
 * 주요 기능:
 * 1. 맨 앞 열(A열)에 작성자의 이름을 표기하여 작성자별 답변 확인 용이
 * 2. 각 코너(활동)를 10개의 독립된 시트(탭)로 자동 분리 저장
 * 3. 영어 대신 100% 깔끔한 한글 컬럼명 및 파싱된 답변 표기 (복잡한 JSON 제거)
 * 4. '전체 모아보기' 마스터 시트를 통해 전 코너 한눈에 모아보기 제공
 * 5. 동일 참가자가 수정 답변을 제출할 경우 해당 행 자동 업데이트 (중복 행 방지)
 */

// 각 코너(활동ID)별 전용 시트명 및 한글 컬럼 정의
var ACTIVITY_SHEET_CONFIG = {
  "emotion": {
    name: "01. 마음 온도",
    headers: ["작성자", "참가자 ID", "선택한 감정", "이유 및 생각", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.emotion || p.selectedEmotion || "",
        p.reason || p.emotionReason || p.text || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "scene": {
    name: "02. 인상 깊은 장면",
    headers: ["작성자", "참가자 ID", "인상 깊었던 장면", "기억에 남은 이유", "당시 느꼈던 감정", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.scene || p.sceneDesc || "",
        p.reason || p.sceneReason || "",
        p.feeling || p.sceneFeeling || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "deep_questions": {
    name: "03. 5개 심층 질문",
    headers: [
      "작성자", "참가자 ID",
      "Q1. 강민주의 백승하 납치",
      "Q2. 백승하의 심리 변화",
      "Q3. 누나와의 관계와 편지",
      "Q4. 비극적 결말의 의미",
      "Q5. '금지된 것'의 상징",
      "작성일시", "세션 ID"
    ],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.q1 || "",
        p.q2 || "",
        p.q3 || "",
        p.q4 || "",
        p.q5 || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "empathy_vote": {
    name: "04. 강민주 이해도",
    headers: ["작성자", "참가자 ID", "이해도 점수 (0~10점)", "점수를 준 이유", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.score !== undefined ? (p.score + "점") : "",
        p.reason || p.scoreReason || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "power_shift": {
    name: "05. 권력 역전 상황",
    headers: ["작성자", "참가자 ID", "상황 카드", "나의 판단", "판단 근거 및 이유", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.situationCard || "",
        p.judgment || "",
        p.reason || p.judgmentReason || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "era_compare": {
    name: "06. 1992 vs 2026",
    headers: ["작성자", "참가자 ID", "2026 현대 이슈", "강민주의 예상 반응", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.issueCard || "",
        p.reaction || p.eraReaction || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "forbidden_choice": {
    name: "07. 금지된 선택",
    headers: ["작성자", "참가자 ID", "나의 선택", "선택한 이유", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.choice || "",
        p.reason || p.choiceReason || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "desired_ending": {
    name: "08. 내가 원하는 결말",
    headers: ["작성자", "참가자 ID", "원작 결말 만족도", "원하는 결말 방향", "내가 다시 쓴 결말", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.satisfaction || "",
        p.direction || "",
        p.customEnding || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "if_i_were": {
    name: "09. 나라면 이렇게",
    headers: ["작성자", "참가자 ID", "나라면 다르게 했을 점", "강민주와 가장 달랐던 선택", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.whatIDo || "",
        p.diffChoice || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  },
  "what_i_wish": {
    name: "10. 나의 소망",
    headers: ["작성자", "참가자 ID", "내가 지금 소망하는 것", "책에 바치는 한 문장", "작성일시", "세션 ID"],
    parse: function(d, p) {
      return [
        d.participantName || "",
        d.participantId || "",
        p.myWish || "",
        p.oneSentence || "",
        d.timestamp || "",
        d.sessionId || ""
      ];
    }
  }
};

// 1. ⭐️ Apps Script 상단 [▶ 실행] 버튼으로 시트를 미리 생성할 때 사용하는 초기화 함수
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterHeaders = [
    "작성자",
    "참가자 ID",
    "코너명 (활동)",
    "핵심 답변",
    "상세 내용 및 이유",
    "작성일시",
    "세션 ID",
    "활동 ID",
    "원본데이터"
  ];
  getOrCreateSheet(ss, "전체 모아보기", masterHeaders);

  for (var key in ACTIVITY_SHEET_CONFIG) {
    var conf = ACTIVITY_SHEET_CONFIG[key];
    getOrCreateSheet(ss, conf.name, conf.headers);
  }
  Logger.log("✅ 10개 코너별 시트 및 전체 모아보기 시트 생성이 완료되었습니다!");
}

// 시트가 없으면 생성하고 한글 헤더 서식 설정 (직접 실행 시 방어 로직 탑재)
function getOrCreateSheet(ss, sheetName, headers) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  if (!sheetName) {
    // 툴바에서 getOrCreateSheet를 선택하고 [▶ 실행]을 눌렀을 경우 에러 방지 및 전체 시트 생성
    setupAllSheets();
    return null;
  }
  headers = headers || [];
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0 && headers.length > 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold");
    range.setBackground("#F3ECE0");
    range.setFontColor("#222B38");
    range.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 안전하게 JSON 파싱
function parsePayloadAnswer(answer) {
  if (!answer) return {};
  if (typeof answer === "object") return answer;
  try {
    return JSON.parse(answer);
  } catch (e) {
    return { text: String(answer) };
  }
}

// GET 요청: 웹앱 대시보드로 데이터 동기화 제공
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName("전체 모아보기") || ss.getActiveSheet();
    
    var data = masterSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var sessionIdParam = e && e.parameter ? e.parameter.sessionId : null;
    
    var results = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowObj = {};
      for (var h = 0; h < headers.length; h++) {
        var val = row[h];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
        }
        rowObj[headers[h]] = val;
      }
      
      // 세션 ID 필터링 (있을 경우)
      var rowSessionId = rowObj["세션 ID"] || rowObj["세션ID"] || rowObj["sessionId"] || "";
      if (!sessionIdParam || rowSessionId === sessionIdParam) {
        results.push({
          participantName: rowObj["작성자"] || rowObj["participantName"] || "",
          participantId: rowObj["참가자 ID"] || rowObj["참가자ID"] || rowObj["participantId"] || "",
          activityName: rowObj["코너명 (활동)"] || rowObj["코너명"] || rowObj["activityName"] || "",
          activityId: rowObj["활동 ID"] || rowObj["활동ID"] || rowObj["activityId"] || "",
          answer: rowObj["원본데이터"] || rowObj["answer"] || rowObj["핵심 답변"] || "",
          updatedAt: rowObj["작성일시"] || rowObj["updatedAt"] || rowObj["timestamp"] || "",
          sessionId: rowSessionId
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: results
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST 요청: 참가자 답변을 코너별 시트 및 전체 모아보기 시트에 저장/업데이트
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    data.timestamp = data.timestamp || nowStr;
    data.sessionId = data.sessionId || "default";
    var parsedAns = parsePayloadAnswer(data.answer);
    
    // 1. 코너별 전용 시트에 저장/업데이트
    var actConfig = ACTIVITY_SHEET_CONFIG[data.activityId];
    if (actConfig) {
      var cornerSheet = getOrCreateSheet(ss, actConfig.name, actConfig.headers);
      var rowValues = actConfig.parse(data, parsedAns);
      
      // 기존에 동일 참가자(참가자 ID + 세션 ID)의 행이 있는지 확인하여 업데이트
      var cornerData = cornerSheet.getDataRange().getValues();
      var pIdColIdx = actConfig.headers.indexOf("참가자 ID");
      var sIdColIdx = actConfig.headers.indexOf("세션 ID");
      
      var foundRowIndex = -1;
      for (var r = 1; r < cornerData.length; r++) {
        var matchPId = pIdColIdx >= 0 ? cornerData[r][pIdColIdx] === data.participantId : false;
        var matchSId = sIdColIdx >= 0 ? cornerData[r][sIdColIdx] === data.sessionId : true;
        if (matchPId && matchSId) {
          foundRowIndex = r + 1; // 1-based row index
          break;
        }
      }
      
      if (foundRowIndex > 0) {
        cornerSheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        cornerSheet.appendRow(rowValues);
      }
    }
    
    // 2. 전체 모아보기 마스터 시트에 저장/업데이트
    var masterHeaders = [
      "작성자",
      "참가자 ID",
      "코너명 (활동)",
      "핵심 답변",
      "상세 내용 및 이유",
      "작성일시",
      "세션 ID",
      "활동 ID",
      "원본데이터"
    ];
    var masterSheet = getOrCreateSheet(ss, "전체 모아보기", masterHeaders);
    
    // 요약 및 상세 내용 추출
    var summary = "";
    var detail = "";
    if (data.activityId === "emotion") {
      summary = parsedAns.emotion || parsedAns.selectedEmotion || "";
      detail = parsedAns.reason || parsedAns.emotionReason || "";
    } else if (data.activityId === "scene") {
      summary = parsedAns.scene || "";
      detail = [parsedAns.reason, parsedAns.feeling].filter(Boolean).join(" | ");
    } else if (data.activityId === "deep_questions") {
      summary = parsedAns.q1 || "5개 심층 질문 답변";
      detail = [parsedAns.q1, parsedAns.q2, parsedAns.q3, parsedAns.q4, parsedAns.q5].filter(Boolean).join(" / ");
    } else if (data.activityId === "empathy_vote") {
      summary = parsedAns.score !== undefined ? (parsedAns.score + "점") : "";
      detail = parsedAns.reason || "";
    } else if (data.activityId === "power_shift") {
      summary = (parsedAns.situationCard || "") + ": " + (parsedAns.judgment || "");
      detail = parsedAns.reason || "";
    } else if (data.activityId === "era_compare") {
      summary = parsedAns.issueCard || "";
      detail = parsedAns.reaction || "";
    } else if (data.activityId === "forbidden_choice") {
      summary = parsedAns.choice || "";
      detail = parsedAns.reason || "";
    } else if (data.activityId === "desired_ending") {
      summary = (parsedAns.satisfaction || "") + " (" + (parsedAns.direction || "") + ")";
      detail = parsedAns.customEnding || "";
    } else if (data.activityId === "if_i_were") {
      summary = parsedAns.whatIDo || "";
      detail = parsedAns.diffChoice || "";
    } else if (data.activityId === "what_i_wish") {
      summary = parsedAns.myWish || "";
      detail = parsedAns.oneSentence || "";
    } else {
      summary = typeof data.answer === "string" ? data.answer : JSON.stringify(data.answer);
    }
    
    var rawJsonStr = typeof data.answer === "object" ? JSON.stringify(data.answer) : (data.answer || "");
    
    var masterRowValues = [
      data.participantName || "",
      data.participantId || "",
      data.activityName || "",
      summary,
      detail,
      data.timestamp || nowStr,
      data.sessionId || "",
      data.activityId || "",
      rawJsonStr
    ];
    
    // 마스터 시트에서 (참가자 ID + 활동 ID + 세션 ID) 기존 행 검사
    var masterData = masterSheet.getDataRange().getValues();
    var masterFoundRow = -1;
    for (var m = 1; m < masterData.length; m++) {
      if (
        masterData[m][1] === data.participantId &&
        masterData[m][7] === data.activityId &&
        masterData[m][6] === data.sessionId
      ) {
        masterFoundRow = m + 1;
        break;
      }
    }
    
    if (masterFoundRow > 0) {
      masterSheet.getRange(masterFoundRow, 1, 1, masterRowValues.length).setValues([masterRowValues]);
    } else {
      masterSheet.appendRow(masterRowValues);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "코너별 시트 및 전체 모아보기에 성공적으로 저장되었습니다."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

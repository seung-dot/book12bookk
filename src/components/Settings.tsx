import React, { useState, useEffect } from 'react';
import {
  getActiveScriptUrl,
  testConnection,
  DEFAULT_SCRIPT_URL,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../services/googleSheets';
import {
  getStoredCustomScriptUrl,
  saveStoredCustomScriptUrl,
  getStoredSessionId,
  saveStoredSessionId,
} from '../utils/storage';
import { DEFAULT_SESSION_ID } from '../data/activities';
import {
  Settings as SettingsIcon,
  Check,
  Copy,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Key,
  Database,
  ExternalLink,
} from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
  onSessionChanged?: (newSessionId: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onSessionChanged }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const active = getActiveScriptUrl();
    const activeSession = getStoredSessionId();
    setCurrentUrl(active);
    setInputUrl(getStoredCustomScriptUrl() || '');
    setSessionId(activeSession);
    setInputSessionId(activeSession);
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await testConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredCustomScriptUrl(inputUrl);
    const updated = getActiveScriptUrl();
    setCurrentUrl(updated);
    setSaveMessage('Apps Script URL이 저장되었습니다.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetDefaultUrl = () => {
    saveStoredCustomScriptUrl('');
    setInputUrl('');
    const updated = getActiveScriptUrl();
    setCurrentUrl(updated);
    setSaveMessage('기본 Apps Script URL로 복원되었습니다.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const sId = inputSessionId.trim() || DEFAULT_SESSION_ID;
    saveStoredSessionId(sId);
    setSessionId(sId);
    if (onSessionChanged) onSessionChanged(sId);
    setSaveMessage('세션 ID가 성공적으로 변경되었습니다.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
      setCopiedCode(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242426] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D5]">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8B5E3C] hover:text-[#704627] bg-[#FFFDF9] border border-[#DED5C5] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>진행 화면으로 돌아가기</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#7A7367]">
            <SettingsIcon className="w-4 h-4 text-[#8B5E3C]" />
            <span className="font-semibold text-[#242426]">시스템 설정 & 중앙 동기화</span>
          </div>
        </div>

        {saveMessage && (
          <div className="p-3.5 bg-[#EAF5EC] border border-[#BCDDC0] rounded-xl flex items-center gap-2 text-[#2E6B38] text-xs font-semibold animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Section 1: Google Sheets 연결 상태 & 연결 테스트 */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                실시간 중앙 데이터베이스
              </span>
              <h2 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
                Google Sheets & Apps Script Web App
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 bg-[#8B5E3C] hover:bg-[#744A29] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? '연결 확인 중...' : 'Google Sheets 연결 테스트'}</span>
              </button>
            </div>
          </div>

          {/* Test connection result badge */}
          {testResult && (
            <div
              className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-[#EAF5EC] border-[#BCDDC0] text-[#246130]'
                  : 'bg-[#FDF2F2] border-[#F5C2C2] text-[#A62828]'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold text-sm">{testResult.message}</p>
                {testResult.success && (
                  <p className="text-[#3F754A]">
                    현재 저장된 응답 수: {testResult.dataCount ?? 0}건 · GET/POST 통신 정상 작동 중
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Active URL Info */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#554E44]">현재 활성화된 Apps Script URL:</span>
              <span className="text-[11px] text-[#8B5E3C] font-semibold">
                {currentUrl === DEFAULT_SCRIPT_URL ? '● 기본 지정 주소 사용 중' : '★ 사용자 지정 주소 사용 중'}
              </span>
            </div>
            <code className="block bg-[#FFFDF9] border border-[#DDD3C2] p-2.5 rounded-lg text-[#2F2B24] font-mono break-all text-[11px]">
              {currentUrl}
            </code>
          </div>

          {/* Change URL Form */}
          <form onSubmit={handleSaveUrl} className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-[#554E44] uppercase tracking-wider">
              사용자 정의 Apps Script Web App URL 변경 (선택사항)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl px-3.5 py-2.5 text-xs text-[#242426] placeholder-[#A0988A] focus:outline-none focus:border-[#8B5E3C]"
              />
              <button
                type="submit"
                className="bg-[#222B38] hover:bg-[#161D27] text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
              >
                URL 변경
              </button>
              {inputUrl && (
                <button
                  type="button"
                  onClick={handleResetDefaultUrl}
                  className="bg-[#FAF7F2] border border-[#DCD3C3] hover:bg-[#EAE2D3] text-[#554E44] text-xs font-semibold px-3.5 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  기본값 복원
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#7A7367]">
              기본 제공된 Web App URL이 이미 완벽히 연동되어 있으므로 별도의 입력 없이 바로 사용하실 수 있습니다.
            </p>
          </form>
        </div>

        {/* Section 2: 세션 ID 변경 */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
              독서모임 세션 분리
            </span>
            <h2 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
              현재 독서모임 세션 ID (Session ID)
            </h2>
          </div>

          <form onSubmit={handleSaveSession} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value)}
                placeholder="예: 20260905-yanggwija"
                className="flex-1 bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl px-3.5 py-2.5 text-xs text-[#242426] font-mono focus:outline-none focus:border-[#8B5E3C]"
              />
              <button
                type="submit"
                className="bg-[#8B5E3C] hover:bg-[#744A29] text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
              >
                세션 변경
              </button>
            </div>
            <p className="text-[11px] text-[#7A7367]">
              5명의 참가자와 진행자는 반드시 동일한 Session ID를 사용해야 실시간으로 데이터가 동기화됩니다.
              URL 파라미터 <code className="bg-[#FAF7F2] px-1 py-0.5 rounded font-mono">?session={sessionId}</code> 로도 공유할 수 있습니다.
            </p>
          </form>
        </div>

        {/* Section 3: Google Sheets Apps Script Code.gs & 배포 안내 */}
        <div className="bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
            <div>
              <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                Apps Script 배포 스크립트
              </span>
              <h2 className="text-lg font-serif font-bold text-[#1F2633] mt-0.5">
                Google Apps Script Code.gs
              </h2>
            </div>

            <button
              type="button"
              onClick={copyCodeToClipboard}
              className="inline-flex items-center gap-1.5 bg-[#222B38] hover:bg-[#161D27] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? '코드 복사 완료!' : 'Code.gs 코드 복사'}</span>
            </button>
          </div>

          {/* Setup Guide */}
          <div className="bg-[#FAF7F2] border border-[#E2D8C9] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2E6B38]">
              <span className="px-2 py-0.5 rounded-full bg-[#E3F2E6] text-[#2E6B38] text-[11px] font-bold">
                NEW 개편
              </span>
              <span>한글 표기 & 10개 코너별 시트 분리 & A열 작성자명 자동 배치 완비</span>
            </div>
            <p className="text-xs text-[#554E44] leading-relaxed">
              최신 <strong>Code.gs</strong>는 응답이 제출될 때마다 구글 시트 내에 <strong>10개 코너별 개별 시트</strong>(01_마음온도, 02_명장면, 03_심층질문 등)와 <strong>전체 모아보기 시트</strong>를 자동으로 생성하여 답변을 깔끔하게 저장합니다. 복잡한 JSON이나 영어 태그 대신 <strong>A열에 작성자 이름</strong>이 맨 앞에 위치하여 읽기가 훨씬 편해집니다.
            </p>

            <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider pt-2">
              직접 Google Sheets를 만들어 배포/업데이트하는 방법 (8단계)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#4A4339] leading-relaxed">
              <li>Google Sheets(스프레드시트)를 새 문서로 생성합니다 (또는 기존 시트).</li>
              <li>상단 메뉴에서 <strong>확장 프로그램 → Apps Script</strong>를 클릭합니다.</li>
              <li>편집기에 열린 <strong>Code.gs</strong>에 아래 제공된 최신 코드를 붙여넣습니다.</li>
              <li>우측 상단 <strong>배포 → 새 배포</strong> (또는 배포 관리 → 새 버전)를 클릭합니다.</li>
              <li>유형을 <strong>웹 앱 (Web app)</strong>으로 선택합니다.</li>
              <li>액세스 권한을 <strong>모든 사용자 (Anyone)</strong>로 설정하고 배포합니다.</li>
              <li>완료 창에 나타난 <strong>웹 앱 URL</strong>을 복사합니다.</li>
              <li>본 앱의 설정 화면 [URL 변경]에 붙여넣고 저장합니다.</li>
            </ol>

            <div className="bg-[#FFFDF9] border border-[#DDD3C2] p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-[#8B5E3C]">💡 상단 [▶ 실행] 버튼 관련 안내</p>
              <p className="text-[#554E44]">
                본 스크립트는 참가자가 답변을 제출할 때 웹 앱을 통해 자동으로 실행됩니다. 상단의 [▶ 실행] 버튼은 누르지 않고 <strong>우측 상단 [배포]</strong>만 진행하시면 됩니다. 만약 스프레드시트에 10개 시트를 미리 생성해보고 싶으시다면, 함수 목록에서 <strong>setupAllSheets</strong>를 선택하고 [▶ 실행]을 누르시면 됩니다.
              </p>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1F2633] text-gray-300 text-[11px] px-4 py-2 rounded-t-xl font-mono">
              <span>Code.gs</span>
              <span>Google Apps Script</span>
            </div>
            <pre className="bg-[#181F2A] text-gray-200 p-4 rounded-b-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed scrollbar-thin">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

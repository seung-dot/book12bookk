import React, { useState } from 'react';
import { ParticipantId, ParticipantInfo, PARTICIPANT_IDS } from '../types';
import { BookOpen, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface ParticipantSetupProps {
  initialInfo?: ParticipantInfo | null;
  onComplete: (info: ParticipantInfo) => void;
  onGoToHost?: () => void;
}

const DEFAULT_NAMES: Record<ParticipantId, string> = {
  P1: '민지',
  P2: '수연',
  P3: '지은',
  P4: '현아',
  P5: '승혜',
};

export const ParticipantSetup: React.FC<ParticipantSetupProps> = ({
  initialInfo,
  onComplete,
  onGoToHost,
}) => {
  const [selectedId, setSelectedId] = useState<ParticipantId>(initialInfo?.id || 'P1');
  const [name, setName] = useState<string>(initialInfo?.name || DEFAULT_NAMES['P1']);
  const [isCustomName, setIsCustomName] = useState<boolean>(false);

  const handleIdSelect = (id: ParticipantId) => {
    setSelectedId(id);
    if (!isCustomName) {
      setName(DEFAULT_NAMES[id] || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || DEFAULT_NAMES[selectedId] || selectedId;
    onComplete({
      id: selectedId,
      name: finalName,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242426] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-[#FFFDF9] border border-[#E8E1D5] rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Literary Book Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3EDE2] text-[#8B5E3C] mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-xs uppercase tracking-widest text-[#8B5E3C] font-semibold mb-1">
            5인 성인 인터랙티브 독서모임
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2633] tracking-tight leading-snug">
            나는 소망한다<br />내게 금지된 것을
          </h1>
          <p className="text-xs text-[#7A7367] mt-2">
            양귀자 장편소설 · 실시간 동기화 토론
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Participant Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#544E44] uppercase tracking-wider mb-2">
              참가자 번호 선택 (5명 중 1명)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PARTICIPANT_IDS.map((id) => {
                const isSelected = selectedId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleIdSelect(id)}
                    className={`py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#222B38] bg-[#222B38] text-white shadow-xs font-bold'
                        : 'border-[#E2D8C9] bg-[#FAF7F2] text-[#554E44] hover:border-[#8B5E3C] hover:bg-[#F3EDE2]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{id}</div>
                    <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-gray-200' : 'text-[#887F72]'}`}>
                      {DEFAULT_NAMES[id]}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#887F72] mt-2">
              휴대폰으로 참여할 참가자 번호(P1~P5)를 하나 선택해주세요.
            </p>
          </div>

          {/* Participant Name Input */}
          <div>
            <label className="block text-xs font-semibold text-[#544E44] uppercase tracking-wider mb-1.5">
              이름 (닉네임)
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsCustomName(true);
                }}
                placeholder="이름을 입력해주세요"
                required
                maxLength={20}
                className="w-full bg-[#FAF7F2] border border-[#DCD3C3] rounded-xl px-4 py-3.5 text-base text-[#242426] placeholder-[#A0988A] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] transition-all"
              />
              <User className="absolute right-3.5 top-3.5 w-5 h-5 text-[#A0988A] pointer-events-none" />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-[#8B5E3C] hover:bg-[#784E30] text-[#FFFDF9] font-medium py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] text-base"
          >
            <span>참여하기 ({selectedId} / {name.trim() || DEFAULT_NAMES[selectedId]})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Footnote & Host link */}
        <div className="mt-8 pt-5 border-t border-[#EDE6DA] flex flex-col items-center gap-2 text-center text-xs text-[#7A7367]">
          <div className="flex items-center gap-1 text-[#4E7D55]">
            <ShieldCheck className="w-4 h-4" />
            <span>Google Sheets 실시간 동기화 지원</span>
          </div>
          {onGoToHost && (
            <button
              type="button"
              onClick={onGoToHost}
              className="text-[#8B5E3C] hover:underline cursor-pointer mt-1 font-medium"
            >
              진행자(노트북/태블릿) 대시보드로 이동하기 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

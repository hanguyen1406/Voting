import React from 'react';
import type { Match } from '../types';

interface BracketProps {
  matches: Match[];
  onMatchClick: (match: Match) => void;
  activeMatchId?: string;
}

export const Bracket: React.FC<BracketProps> = ({ 
  matches, 
  onMatchClick, 
  activeMatchId
}) => {
  // Group matches by round
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex pt-16 pb-8 px-4 overflow-auto min-h-max bg-[#110a08] rounded-xl border border-[#856b46]/20 relative">
      {roundNumbers.map((round, rIndex) => (
        <div key={round} className="flex flex-col justify-around relative z-10 w-72 shrink-0">
          
          {/* Round Header */}
          <div className="absolute -top-12 left-4 right-4 text-center font-bold text-gray-300 uppercase tracking-widest bg-white/5 py-2 rounded-lg border border-white/10 flex justify-center items-center gap-2 z-20 shadow-md">
            Vòng {round}
          </div>

          {rounds[round].map((match, mIndex) => {
            const hasNextRound = rIndex < roundNumbers.length - 1;
            const hasPrevRound = rIndex > 0;
            const isPairFirst = mIndex % 2 === 0;

            const isP1Winner = match.winnerId && match.winnerId === match.participant1?.id;
            const isP2Winner = match.winnerId && match.winnerId === match.participant2?.id;
            const hasWinner = !!match.winnerId;

            return (
              <div key={match.id} className="relative py-6 flex items-center justify-center">
                {/* Horizontal left connector */}
                {hasPrevRound && (
                  <div className="absolute top-1/2 left-0 w-8 h-[2px] bg-[#856b46] -translate-y-1/2 opacity-60"></div>
                )}
                
                {/* Horizontal right connector */}
                {hasNextRound && (
                  <div className="absolute top-1/2 right-0 w-8 h-[2px] bg-[#856b46] -translate-y-1/2 opacity-60"></div>
                )}
                
                {/* Vertical right connectors to link pairs */}
                {hasNextRound && (
                  <div className={`absolute right-0 w-[2px] bg-[#856b46] opacity-60 ${
                    isPairFirst ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2'
                  }`}></div>
                )}

                <div 
                  className={`w-48 md:w-56 relative z-10 flex flex-col bg-[#1f1510]/80 backdrop-blur-sm border rounded-md transition-all shadow-xl overflow-hidden ${
                    activeMatchId === match.id 
                      ? 'border-[#c79a49] shadow-[0_0_15px_rgba(199,154,73,0.3)] scale-[1.02]' 
                      : 'border-[#5c4529] hover:border-[#856b46] hover:scale-[1.02] cursor-pointer'
                  }`}
                  onClick={() => onMatchClick(match)}
                >
                  {/* Participant 1 */}
                  <div className={`flex items-center p-1 bg-gradient-to-r from-[#2c1d16] to-transparent ${match.participant2 || match.participant1 ? 'border-b border-[#3a281e]' : ''} ${hasWinner && !isP1Winner ? 'opacity-40' : ''}`}>
                    {match.participant1 ? (
                      <>
                        <div className={`w-7 h-7 rounded bg-gray-800 overflow-hidden shrink-0 border ${isP1Winner ? 'border-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'border-[#856b46]/30'}`}>
                          <img src={match.participant1.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className={`truncate flex-1 text-xs font-medium ml-2 ${isP1Winner ? 'text-yellow-400 font-bold' : 'text-[#e8d5c4]'}`}>
                          {match.participant1.name} {isP1Winner && '👑'}
                        </span>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center px-2 h-7 text-[11px] text-[#6b5542] italic">Đang chờ</div>
                    )}
                  </div>

                  {/* Participant 2 */}
                  {match.participant2 ? (
                    <div className={`flex items-center p-1 bg-gradient-to-r from-[#1a1c29] to-transparent ${hasWinner && !isP2Winner ? 'opacity-40' : ''}`}>
                      <div className={`w-7 h-7 rounded bg-gray-800 overflow-hidden shrink-0 border ${isP2Winner ? 'border-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'border-[#4a5f82]/30'}`}>
                        <img src={match.participant2.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className={`truncate flex-1 text-xs font-medium ml-2 ${isP2Winner ? 'text-yellow-400 font-bold' : 'text-[#e8d5c4]'}`}>
                        {match.participant2.name} {isP2Winner && '👑'}
                      </span>
                    </div>
                  ) : match.participant1 ? (
                    <div className="flex items-center justify-center p-1 bg-gradient-to-r from-[#1c2c1a] to-transparent h-[36px] border-t border-[#3a281e]">
                      <span className="text-[10px] font-bold text-[#5c9945] tracking-widest uppercase">Mặc Định Thắng 👑</span>
                    </div>
                  ) : (
                    <div className="flex items-center p-1 bg-gradient-to-r from-[#1c1a17] to-transparent border-t border-[#3a281e]">
                      <div className="flex-1 flex items-center px-2 h-7 text-[11px] text-[#6b5542] italic">Đang chờ</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

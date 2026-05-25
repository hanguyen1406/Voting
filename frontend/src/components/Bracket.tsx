import React from 'react';
import type { Match } from '../types';

interface BracketProps {
  matches: Match[];
  onMatchClick: (match: Match) => void;
  activeMatchId?: string;
}

export const Bracket: React.FC<BracketProps> = ({ matches, onMatchClick, activeMatchId }) => {
  // Group matches by round
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex py-8 px-4 overflow-auto min-h-max bg-[#111] rounded-xl border border-white/10 relative">
      {roundNumbers.map((round, rIndex) => (
        <div key={round} className="flex flex-col justify-around relative z-10 w-72 shrink-0">
          {rounds[round].map((match, mIndex) => {
            const hasNextRound = rIndex < roundNumbers.length - 1;
            const hasPrevRound = rIndex > 0;
            const isPairFirst = mIndex % 2 === 0;

            return (
              <div key={match.id} className="relative py-6 flex items-center justify-center">
                {/* Horizontal left connector */}
                {hasPrevRound && (
                  <div className="absolute top-1/2 left-0 w-8 h-0.5 bg-gray-600 -translate-y-1/2"></div>
                )}
                
                {/* Horizontal right connector */}
                {hasNextRound && (
                  <div className="absolute top-1/2 right-0 w-8 h-0.5 bg-gray-600 -translate-y-1/2"></div>
                )}
                
                {/* Vertical right connectors to link pairs */}
                {hasNextRound && (
                  <div className={`absolute right-0 w-0.5 bg-gray-600 ${
                    isPairFirst ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2'
                  }`}></div>
                )}

                <div 
                  onClick={() => onMatchClick(match)}
                  className={`w-56 relative z-10 flex flex-col bg-black/60 border-2 rounded-lg cursor-pointer transition-all hover:scale-105 shadow-xl ${
                    match.status === 'active' 
                      ? 'border-orange-500 shadow-orange-900/50' 
                      : activeMatchId === match.id 
                        ? 'border-blue-500' 
                        : 'border-white/10 hover:border-gray-500'
                  }`}
                >
                  {/* Match Header */}
                  <div className="px-3 py-1.5 flex justify-between items-center bg-white/5 border-b border-white/5 text-xs font-semibold">
                    <span className="text-gray-400">Round {round}</span>
                    {match.status === 'active' && <span className="text-orange-400 animate-pulse">LIVE</span>}
                    {match.status === 'completed' && <span className="text-gray-500">DONE</span>}
                    {match.status === 'pending' && <span className="text-blue-400">WAITING</span>}
                  </div>

                  {/* Participant 1 */}
                  <div className="flex items-center gap-3 p-2 border-b border-white/5">
                    <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden shrink-0">
                      <img src={match.participant1?.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate flex-1 text-sm font-medium text-gray-200">{match.participant1?.name || '-'}</span>
                    <span className="text-sm font-bold text-gray-400">{match.votes1}</span>
                  </div>

                  {/* Participant 2 */}
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden shrink-0">
                      <img src={match.participant2?.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate flex-1 text-sm font-medium text-gray-200">{match.participant2?.name || '-'}</span>
                    <span className="text-sm font-bold text-gray-400">{match.votes2}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

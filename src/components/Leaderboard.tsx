import React from 'react';
import type { Match } from '../types';
import { Trophy, Crown, Medal } from 'lucide-react';

interface LeaderboardProps {
  matches: Match[];
}

interface ParticipantRank {
  id: string;
  name: string;
  imageUrl: string;
  totalVotes: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ matches }) => {
  // Aggregate scores
  const ranksMap: Record<string, ParticipantRank> = {};

  matches.forEach((match) => {
    if (match.participant1) {
      const p1 = match.participant1;
      if (!ranksMap[p1.id]) {
        ranksMap[p1.id] = { id: p1.id, name: p1.name, imageUrl: p1.imageUrl, totalVotes: 0 };
      }
    }
    if (match.participant2) {
      const p2 = match.participant2;
      if (!ranksMap[p2.id]) {
        ranksMap[p2.id] = { id: p2.id, name: p2.name, imageUrl: p2.imageUrl, totalVotes: 0 };
      }
    }

    if (match.winnerId) {
      if (!ranksMap[match.winnerId]) {
        let name = '';
        let imageUrl = '';
        if (match.participant1?.id === match.winnerId) {
          name = match.participant1.name;
          imageUrl = match.participant1.imageUrl;
        } else if (match.participant2?.id === match.winnerId) {
          name = match.participant2.name;
          imageUrl = match.participant2.imageUrl;
        }
        ranksMap[match.winnerId] = { id: match.winnerId, name, imageUrl, totalVotes: 0 };
      }
      ranksMap[match.winnerId].totalVotes += 1;
    }
  });

  const sortedRanks = Object.values(ranksMap).sort((a, b) => b.totalVotes - a.totalVotes);

  // Check if we have reached the final round and it has a decided winner
  const maxRound = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 1;
  const maxRoundMatches = matches.filter(m => m.round === maxRound);
  const hasFinalResult = maxRoundMatches.length === 1 && 
                         maxRoundMatches[0].winnerId !== null && 
                         maxRoundMatches[0].winnerId !== undefined;

  // Divide into podium and list for final stage
  const first = sortedRanks[0];
  const second = sortedRanks[1];
  const third = sortedRanks[2];
  const rest = sortedRanks.slice(3);

  return (
    <div className="w-full flex flex-col bg-[#110a08]/80 backdrop-blur-sm rounded-xl border border-[#856b46]/20 p-6 md:p-8 min-h-[450px]">
      
      {/* Top 3 Podium (Only when final two are set) */}
      {hasFinalResult && sortedRanks.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-center gap-6 md:gap-8 mb-12 mt-6">
          
          {/* 2nd Place */}
          {second ? (
            <div className="w-full md:w-56 bg-gradient-to-t from-[#16171a] to-[#25272a] border border-gray-500/20 rounded-xl p-5 flex flex-col items-center justify-between shadow-xl order-2 md:order-1 hover:scale-[1.03] transition-transform">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={second.imageUrl} 
                    alt={second.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.3)]"
                  />
                  <div className="absolute -top-3 -right-2 bg-gray-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border border-[#110a08]">2</div>
                </div>
                <h3 className="text-gray-200 font-bold text-sm text-center truncate w-full mb-1">{second.name}</h3>
                <p className="text-gray-400 font-semibold text-xs">{second.totalVotes.toLocaleString()} phiếu</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-gray-300 text-xs font-semibold bg-gray-500/10 px-3 py-1 rounded-full border border-gray-500/20 w-max">
                <Medal size={12} className="text-gray-400" /> Á quân 2
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-56 p-5 border border-dashed border-white/5 rounded-xl items-center justify-center text-gray-600 text-xs order-2 md:order-1">
              Đang chờ hạng 2
            </div>
          )}

          {/* 1st Place */}
          {first ? (
            <div className="w-full md:w-64 bg-gradient-to-t from-[#2c1a0e] to-[#4c311a] border border-[#c79a49] rounded-xl p-6 flex flex-col items-center justify-between shadow-2xl order-1 md:order-2 hover:scale-[1.03] transition-transform relative md:-top-4 shadow-[0_0_30px_rgba(199,154,73,0.2)]">
              <div className="absolute -top-7 text-yellow-500 animate-bounce">
                <Crown size={32} fill="currentColor" />
              </div>
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={first.imageUrl} 
                    alt={first.name} 
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#c79a49] shadow-[0_0_20px_rgba(199,154,73,0.4)]"
                  />
                  <div className="absolute -top-2 -right-2 bg-[#c79a49] text-black w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 border-[#110a08]">1</div>
                </div>
                <h3 className="text-white font-extrabold text-base text-center truncate w-full mb-1 tracking-wider">{first.name}</h3>
                <p className="text-[#e8d5c4] font-bold text-sm">{first.totalVotes.toLocaleString()} phiếu</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-yellow-300 text-xs font-black bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/30 uppercase tracking-widest w-max">
                <Trophy size={13} className="text-yellow-500 fill-current" /> Quán quân
              </div>
            </div>
          ) : (
            <div className="w-64 p-6 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-gray-600 text-xs order-1 md:order-2">
              Đang chờ hạng 1
            </div>
          )}

          {/* 3rd Place */}
          {third ? (
            <div className="w-full md:w-56 bg-gradient-to-t from-[#1c120a] to-[#2c1d11] border border-[#cd7f32]/20 rounded-xl p-5 flex flex-col items-center justify-between shadow-xl order-3 md:order-3 hover:scale-[1.03] transition-transform">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={third.imageUrl} 
                    alt={third.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#cd7f32] shadow-[0_0_15px_rgba(205,127,50,0.3)]"
                  />
                  <div className="absolute -top-3 -right-2 bg-[#cd7f32] text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border border-[#110a08]">3</div>
                </div>
                <h3 className="text-gray-200 font-bold text-sm text-center truncate w-full mb-1">{third.name}</h3>
                <p className="text-gray-400 font-semibold text-xs">{third.totalVotes.toLocaleString()} phiếu</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[#cd7f32] text-xs font-semibold bg-[#cd7f32]/10 px-3 py-1 rounded-full border border-[#cd7f32]/20 w-max">
                <Medal size={12} className="text-[#cd7f32]" /> Á quân 3
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-56 p-5 border border-dashed border-white/5 rounded-xl items-center justify-center text-gray-600 text-xs order-3 md:order-3">
              Đang chờ hạng 3
            </div>
          )}

        </div>
      )}

      {/* Leaderboard List (when final stages reached: 4th and beyond) */}
      {hasFinalResult && rest.length > 0 && (
        <div className="flex-1 overflow-y-auto max-h-96 pr-2 space-y-2 custom-scrollbar border-t border-white/5 pt-6">
          {rest.map((rank, index) => (
            <div 
              key={rank.id} 
              className="flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-sm font-semibold text-gray-500 w-6 text-center">
                  {index + 4}
                </span>
                <img 
                  src={rank.imageUrl} 
                  alt={rank.name} 
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <span className="text-gray-200 font-medium text-sm truncate">{rank.name}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-300 font-mono font-bold text-sm">{rank.totalVotes.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mt-0.5">phiếu</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified List View (when final stage has not been reached) */}
      {!hasFinalResult && sortedRanks.length > 0 && (
        <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-2 custom-scrollbar">
          {sortedRanks.map((rank, index) => (
            <div 
              key={rank.id} 
              className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-sm font-semibold text-gray-400 w-6 text-center">
                  {index + 1}
                </span>
                <img 
                  src={rank.imageUrl} 
                  alt={rank.name} 
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <span className="text-gray-200 font-medium text-sm truncate">{rank.name}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-300 font-mono font-bold text-sm">{rank.totalVotes.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mt-0.5">phiếu</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedRanks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <p className="text-gray-500 italic">Chưa có dữ liệu bảng xếp hạng.</p>
        </div>
      )}

    </div>
  );
};

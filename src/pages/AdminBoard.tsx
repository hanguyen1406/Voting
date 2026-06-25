import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Match, Participant } from '../types';
import { Plus } from 'lucide-react';
import { Bracket } from '../components/Bracket';

export const AdminBoard: React.FC = () => {
  const { matches, addMatch, updateMatch, deleteMatch, deleteRound } = useTournament();
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [newMatch, setNewMatch] = useState<{
    p1Name: string; p1Img: string; p2Name: string; p2Img: string;
    winnerId: string | null; p1Id: string; p2Id: string;
  }>({
    p1Name: '', p1Img: '', p2Name: '', p2Img: '',
    winnerId: null, p1Id: '', p2Id: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, option: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (option === 1) setNewMatch({...newMatch, p1Img: reader.result as string});
        else setNewMatch({...newMatch, p2Img: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const selectWinner = (id: string | null) => {
    setNewMatch(prev => ({
      ...prev,
      winnerId: prev.winnerId === id ? null : id
    }));
  };

  const handleEditClick = (match: Match) => {
    setIsEditing(match.id);
    setShowFormModal(true);
    setNewMatch({
      p1Name: match.participant1?.name || '',
      p1Img: match.participant1?.imageUrl || '',
      p2Name: match.participant2?.name || '',
      p2Img: match.participant2?.imageUrl || '',
      winnerId: match.winnerId || null,
      p1Id: match.participant1?.id || '',
      p2Id: match.participant2?.id || ''
    });
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const p1: Participant = { id: newMatch.p1Id || (Date.now().toString() + '1'), name: newMatch.p1Name, imageUrl: newMatch.p1Img };
      const p2: Participant = { id: newMatch.p2Id || (Date.now().toString() + '2'), name: newMatch.p2Name, imageUrl: newMatch.p2Img };
      updateMatch(isEditing, { participant1: p1, participant2: p2, winnerId: newMatch.winnerId });
      setIsEditing(null);
    } else {
      const p1: Participant = { id: newMatch.p1Id, name: newMatch.p1Name, imageUrl: newMatch.p1Img };
      const p2: Participant = { id: newMatch.p2Id, name: newMatch.p2Name, imageUrl: newMatch.p2Img };
      
      const newRound = matches.length > 0 ? Math.min(...matches.map(m => m.round)) : 1;
      
      addMatch({
        id: Date.now().toString(),
        round: newRound,
        participant1: p1,
        participant2: p2,
        votes1: 0,
        votes2: 0,
        status: 'completed',
        endTime: null,
        winnerId: newMatch.winnerId
      });
    }
    setNewMatch({ p1Name: '', p1Img: '', p2Name: '', p2Img: '', winnerId: null, p1Id: '', p2Id: '' });
    setShowFormModal(false);
  };

  const generateNextRound = () => {
    if (matches.length === 0) return;
    const maxRound = Math.max(...matches.map(m => m.round));
    const currentRoundMatches = matches.filter(m => m.round === maxRound);
    
    // Check if ALL matches in this round have a winner selected (excluding byes)
    const undecidedMatches = currentRoundMatches.filter(m => {
      if (!m.participant2) return false; // Bye automatically wins
      return !m.winnerId;
    });

    if (undecidedMatches.length > 0) {
      alert(`Vui lòng chọn người thắng cuộc cho tất cả các cặp đấu trong Vòng ${maxRound} trước khi chuyển sang vòng tiếp theo!`);
      return;
    }

    // Auto pair winners
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const m1 = currentRoundMatches[i];
      const m2 = currentRoundMatches[i + 1];
      
      const getWinner = (match?: Match | null) => {
        if (!match) return null;
        if (!match.participant2) return match.participant1; // Bye automatically wins
        return match.winnerId === match.participant1?.id ? match.participant1 : match.participant2;
      };
      
      const winner1 = getWinner(m1);
      const winner2 = getWinner(m2);
      
      addMatch({
        id: Date.now().toString() + i,
        round: maxRound + 1,
        participant1: winner1,
        participant2: winner2,
        votes1: 0,
        votes2: 0,
        status: 'completed',
        endTime: null,
        winnerId: null
      });
    }
  };

  const handleDeleteRound = async (round: number) => {
    if (matches.length === 0) return;
    const maxRound = Math.max(...matches.map(m => m.round));
    
    let warningMsg = `Bạn có chắc chắn muốn xoá Vòng ${round}?`;
    if (maxRound > round) {
      warningMsg += `\n\nCẢNH BÁO: Tất cả các vòng đấu phía sau (từ Vòng ${round + 1} đến Vòng ${maxRound}) cũng sẽ bị xoá sạch hoàn toàn!`;
    }
    
    if (confirm(warningMsg)) {
      await deleteRound(round);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-gray-200 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold text-orange-400">Bảng Quản Trị Giải Đấu</h1>
          <button 
            onClick={() => {
              setIsEditing(null);
              setNewMatch({ 
                p1Name: '', p1Img: '', p2Name: '', p2Img: '', 
                winnerId: null, 
                p1Id: Date.now().toString() + '1', 
                p2Id: Date.now().toString() + '2' 
              });
              setShowFormModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium animate-in fade-in duration-300"
          >
            <Plus size={18} /> Thêm Trận Đấu
          </button>
        </header>

        {/* Existing Matches List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-300">Cây Giải Đấu</h2>
            <button 
              onClick={generateNextRound}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-transform active:scale-95"
            >
              Chuyển Người Thắng Sang Vòng Tiếp Theo
            </button>
          </div>
          <Bracket 
            matches={matches} 
            onMatchClick={(m) => {
              setSelectedMatchId(m.id);
              handleEditClick(m);
            }} 
            activeMatchId={selectedMatchId}
            onDeleteRound={handleDeleteRound}
          />
          
          {matches.length === 0 && <p className="text-gray-500 italic mt-8">Chưa có trận đấu nào.</p>}
        </section>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => {
          if (e.target === e.currentTarget) setShowFormModal(false);
        }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-[90vw] max-w-4xl h-[80vh] p-6 shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
              onClick={() => setShowFormModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-orange-400 mb-4 shrink-0">
              {isEditing ? 'Sửa Trận Đấu' : 'Thêm Trận Đấu'}
            </h2>
            
            {/* Dual VS Bar Wrapper - Stationary to prevent clipping badges */}
            <div className="relative mb-6 shrink-0">
              {/* Winner Badge 1 */}
              {newMatch.winnerId === newMatch.p1Id && (
                <span 
                  className="absolute -top-3 text-[9px] font-black text-white bg-green-600 border border-green-400 px-2.5 py-0.5 rounded-full tracking-wider uppercase animate-pulse z-30 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                  style={{ right: 'calc(50% + 60px)' }}
                >
                  Người thắng cuộc 👑
                </span>
              )}
              {/* Winner Badge 2 */}
              {newMatch.winnerId === newMatch.p2Id && (
                <span 
                  className="absolute -top-3 text-[9px] font-black text-white bg-green-600 border border-green-400 px-2.5 py-0.5 rounded-full tracking-wider uppercase animate-pulse z-30 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                  style={{ left: 'calc(50% + 60px)' }}
                >
                  Người thắng cuộc 👑
                </span>
              )}

              {/* Main VS Bar Container */}
              <div className="w-full flex items-center h-24 bg-[#0a0604] border-2 border-[#856b46]/40 rounded-xl overflow-hidden relative shadow-[0_0_25px_rgba(133,107,70,0.15)]">
                
                {/* Winner Highlight Overlay Left (Slanted shape clipped by overflow-hidden) */}
                {newMatch.winnerId === newMatch.p1Id && (
                  <>
                    <div 
                      className="absolute transform -skew-x-12 border-y-2 border-r-2 border-green-500 pointer-events-none z-20 shadow-[inset_0_0_15px_rgba(34,197,94,0.15)]"
                      style={{ top: '-2px', bottom: '-2px', left: '5px', right: 'calc(50% + 40px)' }}
                    ></div>
                    <div 
                      className="absolute border-2 border-r-0 border-green-500 rounded-l-xl pointer-events-none z-20"
                      style={{ top: '-2px', bottom: '-2px', left: '-2px', width: '24px' }}
                    ></div>
                  </>
                )}

                {/* Winner Highlight Overlay Right (Slanted shape clipped by overflow-hidden) */}
                {newMatch.winnerId === newMatch.p2Id && (
                  <>
                    <div 
                      className="absolute transform -skew-x-12 border-y-2 border-l-2 border-green-500 pointer-events-none z-20 shadow-[inset_0_0_15px_rgba(34,197,94,0.15)]"
                      style={{ top: '-2px', bottom: '-2px', left: 'calc(50% + 40px)', right: '5px' }}
                    ></div>
                    <div 
                      className="absolute border-2 border-l-0 border-green-500 rounded-r-xl pointer-events-none z-20"
                      style={{ top: '-2px', bottom: '-2px', right: '-2px', width: '24px' }}
                    ></div>
                  </>
                )}

                {/* Option 1 side (Red Gradient) */}
                <div 
                  onClick={() => selectWinner(newMatch.p1Id)}
                  className={`h-full flex-1 relative flex items-center justify-end px-6 gap-4 cursor-pointer transition-all duration-300 border-r border-[#856b46]/10 rounded-l-[10px] ${
                    newMatch.winnerId === newMatch.p1Id
                      ? 'bg-gradient-to-r from-green-950/30 via-[#223d24]/20 to-[#0a0604] shadow-[inset_0_0_20px_rgba(34,197,94,0.15)]'
                      : 'bg-gradient-to-r from-[#2c090e] via-[#1c080b] to-[#0a0604] hover:bg-white/5'
                  }`}
                >
                  <div className="text-right flex-1 min-w-0">
                    <span className="text-[10px] text-red-400 font-bold block uppercase tracking-[0.2em] mb-0.5">Lựa chọn 1</span>
                    <input 
                      type="text" 
                      required 
                      placeholder="Tên lựa chọn 1" 
                      className="bg-transparent border-b border-white/5 text-white font-extrabold text-sm md:text-lg tracking-wider uppercase text-right focus:outline-none focus:border-red-500 w-full placeholder-white/20"
                      value={newMatch.p1Name} 
                      onChange={e => setNewMatch({...newMatch, p1Name: e.target.value})}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  {newMatch.p1Img ? (
                    <img src={newMatch.p1Img} className="w-14 h-14 rounded-full border-2 border-[#8b2233] object-cover shadow-[0_0_15px_rgba(139,34,51,0.6)] shrink-0 transition-transform hover:scale-105" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-900 border-2 border-dashed border-red-950 flex items-center justify-center shrink-0 text-red-900 font-bold text-xl">1</div>
                  )}
                </div>
                
                {/* VS Center */}
                <div className="w-20 h-full shrink-0 bg-[#0a0604] flex items-center justify-center relative z-10">
                  <div className="absolute inset-0 flex items-center justify-center transform -skew-x-12 bg-gradient-to-b from-[#4a3424] via-[#1f140e] to-[#0a0604] border-x-2 border-[#856b46]/60"></div>
                  <span className="font-serif text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#e8d5c4] to-[#a38059] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest">VS</span>
                </div>

                {/* Option 2 side (Blue Gradient) */}
                <div 
                  onClick={() => selectWinner(newMatch.p2Id)}
                  className={`h-full flex-1 relative flex items-center justify-start px-6 gap-4 cursor-pointer transition-all duration-300 border-l border-[#856b46]/10 rounded-r-[10px] ${
                    newMatch.winnerId === newMatch.p2Id
                      ? 'bg-gradient-to-l from-green-950/30 via-[#223d24]/20 to-[#0a0604] shadow-[inset_0_0_20px_rgba(34,197,94,0.15)]'
                      : 'bg-gradient-to-l from-[#0c1b30] via-[#0a121c] to-[#0a0604] hover:bg-white/5'
                  }`}
                >
                  {newMatch.p2Img ? (
                    <img src={newMatch.p2Img} className="w-14 h-14 rounded-full border-2 border-[#224a8b] object-cover shadow-[0_0_15px_rgba(34,74,139,0.6)] shrink-0 transition-transform hover:scale-105" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-900 border-2 border-dashed border-blue-950 flex items-center justify-center shrink-0 text-blue-900 font-bold text-xl">2</div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-[0.2em] mb-0.5">Lựa chọn 2</span>
                    <input 
                      type="text" 
                      required 
                      placeholder="Tên lựa chọn 2" 
                      className="bg-transparent border-b border-white/5 text-white font-extrabold text-sm md:text-lg tracking-wider uppercase text-left focus:outline-none focus:border-blue-500 w-full placeholder-white/20"
                      value={newMatch.p2Name} 
                      onChange={e => setNewMatch({...newMatch, p2Name: e.target.value})}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="flex-1 flex flex-col min-h-0 justify-between">
              {/* Scrollable grid section */}
              <div className="flex-1 overflow-y-auto pr-1 mb-4 min-h-0">
                <div className="grid grid-cols-2 gap-6 h-full min-h-[180px]">
                  {/* Image Upload Option 1 */}
                  <div className="space-y-2 flex flex-col h-full">
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider shrink-0">Hình ảnh Lựa chọn 1</span>
                    <div className="relative flex-1 min-h-[140px]">
                      <input 
                        type="file" accept="image/*" className="hidden" id="p1Img"
                        onChange={e => handleImageChange(e, 1)}
                      />
                      <label htmlFor="p1Img" className="block w-full h-full bg-black/50 border border-white/10 rounded-lg cursor-pointer text-gray-400 hover:bg-white/5 hover:border-orange-500/50 transition-colors text-center border-dashed relative overflow-hidden flex items-center justify-center">
                        {newMatch.p1Img ? (
                          <div className="absolute inset-0 group">
                            <img src={newMatch.p1Img} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <span className="text-xs text-white font-medium">Thay đổi ảnh</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4">
                            <span className="text-sm">Chọn ảnh...</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Image Upload Option 2 */}
                  <div className="space-y-2 flex flex-col h-full">
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider shrink-0">Hình ảnh Lựa chọn 2</span>
                    <div className="relative flex-1 min-h-[140px]">
                      <input 
                        type="file" accept="image/*" className="hidden" id="p2Img"
                        onChange={e => handleImageChange(e, 2)}
                      />
                      <label htmlFor="p2Img" className="block w-full h-full bg-black/50 border border-white/10 rounded-lg cursor-pointer text-gray-400 hover:bg-white/5 hover:border-orange-500/50 transition-colors text-center border-dashed relative overflow-hidden flex items-center justify-center">
                        {newMatch.p2Img ? (
                          <div className="absolute inset-0 group">
                            <img src={newMatch.p2Img} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <span className="text-xs text-white font-medium">Thay đổi ảnh</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4">
                            <span className="text-sm">Chọn ảnh...</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Fixed at the bottom */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xoá trận đấu này?')) {
                        deleteMatch(isEditing);
                        setShowFormModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200 rounded font-medium transition-colors"
                  >
                    Xoá Trận Đấu
                  </button>
                )}

                <div className="flex gap-3 ml-auto">
                  <button type="button" onClick={() => setShowFormModal(false)} className="px-6 py-3 rounded-lg font-medium text-gray-300 hover:bg-white/5">
                    Huỷ
                  </button>
                  <button type="submit" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                    {isEditing ? 'Lưu' : 'Tạo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

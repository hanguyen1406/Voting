import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Countdown } from '../components/Countdown';
import { Bracket } from '../components/Bracket';
import { LogIn, LogOut, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Leaderboard } from '../components/Leaderboard';
import vsGif from '../assets/vs.gif';

export const VotingBoard: React.FC = () => {
    const { matches, currentUser, loginWithGoogle, logout, vote } = useTournament();
    const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);
    const [showVotingModal, setShowVotingModal] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'bracket' | 'leaderboard'>('bracket');

    const activeMatch = matches.find((m) => m.id === selectedMatchId);

    const totalVotes = activeMatch ? activeMatch.votes1 + activeMatch.votes2 : 0;
    const p1Percent = totalVotes > 0 ? (activeMatch!.votes1 / totalVotes) * 100 : 50;
    const p2Percent = totalVotes > 0 ? (activeMatch!.votes2 / totalVotes) * 100 : 50;

    return (
        <div className="min-h-screen bg-[#1c1a17] text-gray-200 font-sans flex flex-col">
            {/* Header */}
            <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/20">
                <h1 className="text-xl font-bold text-orange-400 uppercase tracking-wider">Giải Đấu</h1>
                
                {/* Tab Navigator */}
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('bracket')}
                        className={`px-4 py-1.5 rounded text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'bracket' 
                                ? 'bg-orange-600 text-white shadow-md' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Sơ Đồ Thi Đấu
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-1.5 rounded text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'leaderboard' 
                                ? 'bg-orange-600 text-white shadow-md' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Bảng Xếp Hạng
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    {currentUser && currentUser.roles.includes("admin") && (
                        <Link to="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
                            <Settings size={18} /> Quản Trị
                        </Link>
                    )}
                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">{currentUser.name}</span>
                            <button onClick={logout} className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={loginWithGoogle}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <LogIn size={18} /> Đăng nhập để Bình Chọn
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar p-8 bg-gradient-to-br from-[#1c1a17] to-black flex flex-col items-center">
                    {activeTab === 'bracket' ? (
                        <div className="w-full h-full">
                            <Bracket 
                                matches={matches} 
                                onMatchClick={(m) => {
                                    setSelectedMatchId(m.id);
                                    setShowVotingModal(true);
                                }} 
                                activeMatchId={activeMatch?.id}
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-4xl">
                            <Leaderboard matches={matches} />
                        </div>
                    )}
                </div>
            </main>

            {/* Voting Modal */}
            {showVotingModal && activeMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) setShowVotingModal(false);
                }}>
                    <div className="w-full max-w-5xl bg-[#110a08]/95 border border-[#856b46]/30 rounded-xl p-0 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button 
                            onClick={() => setShowVotingModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#c79a49] hover:text-white transition-colors z-50"
                        >
                            <X size={24} />
                        </button>

                        {/* Top Dual Progress Bar */}
                        <div className="w-full flex items-center h-16 bg-[#0a0604] border-b border-[#856b46]/30 relative z-20">
                            {/* P1 Bar (Red) */}
                            <div className="h-full flex-1 relative bg-[#1c080b]">
                                <div 
                                    className="absolute inset-y-0 right-0 bg-gradient-to-r from-[#4a121b] to-[#8b2233] transition-all duration-1000 ease-out"
                                    style={{ width: `${p1Percent}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-end px-6 gap-3 z-10">
                                    <span className="text-white font-bold text-sm md:text-base tracking-widest uppercase truncate">{activeMatch.participant1?.name}</span>
                                    <span className="text-[#ffb3c1] font-bold text-sm">({p1Percent.toFixed(0)}% - {activeMatch.votes1} PHIẾU)</span>
                                    {activeMatch.participant1 && (
                                        <img src={activeMatch.participant1.imageUrl} className="w-10 h-10 rounded-full border-2 border-[#8b2233] object-cover shadow-[0_0_10px_rgba(139,34,51,0.5)]" />
                                    )}
                                </div>
                            </div>
                            
                            {/* VS Center */}
                            <div className="w-16 h-16 shrink-0 bg-[#0a0604] flex items-center justify-center z-20 relative">
                                <div className="absolute inset-0 flex items-center justify-center transform -skew-x-12 bg-gradient-to-b from-[#3a281e] to-[#0a0604] border-x border-[#856b46]/50"></div>
                                <img src={vsGif} alt="VS" className="w-[90px] h-[60px] max-w-none object-contain relative z-10 select-none pointer-events-none" />
                            </div>

                            {/* P2 Bar (Blue) */}
                            <div className="h-full flex-1 relative bg-[#0a121c]">
                                {activeMatch.participant2 ? (
                                    <>
                                        <div 
                                            className="absolute inset-y-0 left-0 bg-gradient-to-l from-[#12284a] to-[#224a8b] transition-all duration-1000 ease-out"
                                            style={{ width: `${p2Percent}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-start px-6 gap-3 z-10">
                                            <img src={activeMatch.participant2.imageUrl} className="w-10 h-10 rounded-full border-2 border-[#224a8b] object-cover shadow-[0_0_10px_rgba(34,74,139,0.5)]" />
                                            <span className="text-[#b3d4ff] font-bold text-sm">({p2Percent.toFixed(0)}% - {activeMatch.votes2} PHIẾU)</span>
                                            <span className="text-white font-bold text-sm md:text-base tracking-widest uppercase truncate">{activeMatch.participant2?.name}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-start px-6">
                                        <span className="text-gray-500 font-bold italic tracking-widest">ĐANG CHỜ</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Countdown */}
                        <div className="text-center pt-8 pb-4 relative z-10">
                            <h2 className="text-xs md:text-sm font-bold text-[#c79a49] uppercase tracking-[0.3em] mb-3">
                                {activeMatch.status === 'active' ? 'Thử Thách Tuần' : activeMatch.status === 'completed' ? 'Đã Kết Thúc' : 'Sắp Diễn Ra'}
                            </h2>
                            {activeMatch.status === 'active' && <Countdown endTime={activeMatch.endTime} />}
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch justify-center px-4 md:px-12 pb-12 gap-8 md:gap-16 relative z-10">
                            {/* Option 1 */}
                            <div className="flex-1 flex flex-col items-center justify-center w-full group">
                                <div 
                                    className={`w-full max-w-sm aspect-[3/4] md:aspect-[4/5] rounded overflow-hidden relative cursor-pointer transition-all duration-300 ${!activeMatch.participant2 || activeMatch.votes1 > activeMatch.votes2 ? 'border border-[#8b2233] shadow-[0_0_30px_rgba(139,34,51,0.4)]' : 'border border-[#856b46]/30'} group-hover:scale-[1.02] group-hover:shadow-[0_0_40px_rgba(139,34,51,0.6)] group-hover:border-[#8b2233]`}
                                    onClick={() => activeMatch.participant2 && currentUser && activeMatch.endTime! >= Date.now() && vote(activeMatch.id, 1)}
                                >
                                    <img 
                                        src={activeMatch.participant1?.imageUrl || 'https://via.placeholder.com/400?text=Option+1'} 
                                        alt={activeMatch.participant1?.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 ${activeMatch.participant2 ? 'group-hover:scale-110 group-hover:opacity-80' : ''}`}
                                    />
                                    {activeMatch.participant2 && currentUser && activeMatch.endTime! >= Date.now() && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                            <span className="bg-[#8b2233]/90 text-white font-bold tracking-widest px-8 py-3 rounded uppercase border border-[#ffb3c1]/30">Bấm để Bình Chọn</span>
                                        </div>
                                    )}
                                    {!activeMatch.participant2 && (
                                        <div className="absolute bottom-6 inset-x-0 flex justify-center">
                                            <span className="bg-[#1c2c1a]/90 text-[#5c9945] border border-[#5c9945]/50 font-bold tracking-widest px-8 py-3 rounded uppercase shadow-[0_0_20px_rgba(92,153,69,0.5)]">MẶC ĐỊNH THẮNG</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 2 */}
                            {activeMatch.participant2 && (
                                <div className="flex-1 flex flex-col items-center justify-center w-full group">
                                    <div 
                                        className={`w-full max-w-sm aspect-[4/3] md:aspect-[5/4] rounded overflow-hidden relative cursor-pointer transition-all duration-300 ${activeMatch.votes2 > activeMatch.votes1 ? 'border border-[#224a8b] shadow-[0_0_30px_rgba(34,74,139,0.4)]' : 'border border-[#856b46]/30'} group-hover:scale-[1.02] group-hover:shadow-[0_0_40px_rgba(34,74,139,0.6)] group-hover:border-[#224a8b]`}
                                        onClick={() => currentUser && activeMatch.endTime! >= Date.now() && vote(activeMatch.id, 2)}
                                    >
                                        <img 
                                            src={activeMatch.participant2?.imageUrl || 'https://via.placeholder.com/400?text=Option+2'} 
                                            alt={activeMatch.participant2?.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80"
                                        />
                                        {currentUser && activeMatch.endTime! >= Date.now() && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                                <span className="bg-[#224a8b]/90 text-white font-bold tracking-widest px-8 py-3 rounded uppercase border border-[#b3d4ff]/30">Bấm để Bình Chọn</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

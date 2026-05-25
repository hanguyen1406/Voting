import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Countdown } from '../components/Countdown';
import { Bracket } from '../components/Bracket';
import { LogIn, LogOut, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VotingBoard: React.FC = () => {
  const { matches, currentUser, loginWithGoogle, logout, vote } = useTournament();
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);

  const activeMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#1c1a17] text-gray-200 font-sans flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/20">
        <h1 className="text-xl font-bold text-orange-400 uppercase tracking-wider">Tournament Cup</h1>
        <div className="flex gap-4 items-center">
          {currentUser && currentUser.roles.includes('admin') && (
            <Link to="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
              <Settings size={18} /> Admin
            </Link>
          )}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{currentUser.name}</span>
              <button onClick={logout} className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              <LogIn size={18} /> Login to Vote
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Top/Left: Tournament Tree */}
        <aside className="w-full md:w-[400px] border-b md:border-b-0 md:border-r border-white/5 bg-black/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Bracket Tree</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <Bracket 
              matches={matches} 
              onMatchClick={(m) => setSelectedMatchId(m.id)} 
              activeMatchId={activeMatch?.id}
            />
          </div>
        </aside>

        {/* Right: Active Match Voting */}
        <section className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto">
          {activeMatch ? (
            <div className="w-full max-w-5xl flex flex-col items-center gap-8">
              <Countdown endTime={activeMatch.endTime} />
              
              <div className="flex items-center justify-between w-full gap-8">
                {/* Option 1 */}
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors shadow-2xl shadow-blue-900/20">
                    <img 
                      src={activeMatch.participant1?.imageUrl || 'https://via.placeholder.com/400x600?text=Option+1'} 
                      alt={activeMatch.participant1?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        {activeMatch.participant1?.name}
                      </h3>
                      <p className="text-blue-200 mt-2">{activeMatch.votes1} Votes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => vote(activeMatch.id, 1)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-transform active:scale-95 disabled:opacity-50"
                    disabled={!currentUser || activeMatch.endTime! < Date.now()}
                  >
                    VOTE 1
                  </button>
                </div>

                {/* VS Badge */}
                <div className="shrink-0 flex items-center justify-center -mt-16 z-10">
                  <div className="w-20 h-20 bg-black/50 backdrop-blur border-2 border-white/10 rounded-full flex items-center justify-center text-4xl font-black italic text-gray-300 shadow-xl">
                    VS
                  </div>
                </div>

                {/* Option 2 */}
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-red-500 transition-colors shadow-2xl shadow-red-900/20">
                    <img 
                      src={activeMatch.participant2?.imageUrl || 'https://via.placeholder.com/400x600?text=Option+2'} 
                      alt={activeMatch.participant2?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-300">
                        {activeMatch.participant2?.name}
                      </h3>
                      <p className="text-red-200 mt-2">{activeMatch.votes2} Votes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => vote(activeMatch.id, 2)}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-transform active:scale-95 disabled:opacity-50"
                    disabled={!currentUser || activeMatch.endTime! < Date.now()}
                  >
                    VOTE 2
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <h2 className="text-2xl mb-2">No Active Matches</h2>
              <p>Waiting for the admin to start a new voting round...</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

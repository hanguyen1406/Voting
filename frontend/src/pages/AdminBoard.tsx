import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import type { Match, Participant } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Bracket } from '../components/Bracket';

export const AdminBoard: React.FC = () => {
  const { matches, addMatch, updateMatch, deleteMatch, currentUser } = useTournament();
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // If not admin, maybe redirect. For demo, we just allow it or check simple role.
  if (currentUser && !currentUser.roles.includes('admin')) {
    return <div className="p-4 text-white">Access Denied</div>;
  }

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [newMatch, setNewMatch] = useState<{
    p1Name: string; p1Img: string; p2Name: string; p2Img: string; duration: number;
  }>({
    p1Name: '', p1Img: '', p2Name: '', p2Img: '', duration: 5
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

  const handleEditClick = (match: Match) => {
    setIsEditing(match.id);
    setShowFormModal(true);
    setNewMatch({
      p1Name: match.participant1?.name || '',
      p1Img: match.participant1?.imageUrl || '',
      p2Name: match.participant2?.name || '',
      p2Img: match.participant2?.imageUrl || '',
      duration: 5
    });
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const p1: Participant = { id: Date.now().toString() + '1', name: newMatch.p1Name, imageUrl: newMatch.p1Img };
      const p2: Participant = { id: Date.now().toString() + '2', name: newMatch.p2Name, imageUrl: newMatch.p2Img };
      updateMatch(isEditing, { participant1: p1, participant2: p2 });
      setIsEditing(null);
    } else {
      const p1: Participant = { id: Date.now().toString() + '1', name: newMatch.p1Name, imageUrl: newMatch.p1Img };
      const p2: Participant = { id: Date.now().toString() + '2', name: newMatch.p2Name, imageUrl: newMatch.p2Img };
      
      const newRound = matches.length > 0 ? Math.min(...matches.map(m => m.round)) : 1;
      
      addMatch({
        id: Date.now().toString(),
        round: newRound,
        participant1: p1,
        participant2: p2,
        votes1: 0,
        votes2: 0,
        status: 'pending',
        endTime: null
      });
    }
    setNewMatch({ p1Name: '', p1Img: '', p2Name: '', p2Img: '', duration: 5 });
    setShowFormModal(false);
  };

  const generateNextRound = () => {
    if (matches.length === 0) return;
    const maxRound = Math.max(...matches.map(m => m.round));
    const currentRoundMatches = matches.filter(m => m.round === maxRound && m.status === 'completed');
    
    // Auto pair winners
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const m1 = currentRoundMatches[i];
      const m2 = currentRoundMatches[i + 1];
      
      const winner1 = m1.votes1 > m1.votes2 ? m1.participant1 : m1.participant2;
      const winner2 = m2 ? (m2.votes1 > m2.votes2 ? m2.participant1 : m2.participant2) : null;
      
      addMatch({
        id: Date.now().toString() + i,
        round: maxRound + 1,
        participant1: winner1,
        participant2: winner2,
        votes1: 0,
        votes2: 0,
        status: 'pending',
        endTime: null
      });
    }
  };

  const handleStart = (id: string, durationMin: number) => {
    // End any currently active match first
    matches.forEach(m => {
      if (m.status === 'active') updateMatch(m.id, { status: 'completed' });
    });
    
    updateMatch(id, {
      status: 'active',
      endTime: Date.now() + durationMin * 60000
    });
  };

  return (
    <div className="min-h-screen bg-[#111] text-gray-200 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
          <Link to="/" className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={24} /></Link>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button 
            onClick={() => {
              setIsEditing(null);
              setNewMatch({ p1Name: '', p1Img: '', p2Name: '', p2Img: '', duration: 5 });
              setShowFormModal(true);
            }}
            className="ml-auto bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} /> Add New Match
          </button>
        </header>

        {/* Existing Matches List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-300">Tournament Tree</h2>
            <button 
              onClick={generateNextRound}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Advance Winners to Next Round
            </button>
          </div>
          <Bracket matches={matches} onMatchClick={(m) => {
            setSelectedMatchId(m.id);
            handleEditClick(m);
          }} activeMatchId={selectedMatchId} />
          
          {matches.length === 0 && <p className="text-gray-500 italic mt-8">No matches created yet.</p>}
        </section>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowFormModal(false);
        }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setShowFormModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-orange-400 mb-6">
              {isEditing ? 'Edit Match' : 'Add New Match'}
            </h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-blue-400 text-lg">Option 1</h3>
                  <input 
                    type="text" required placeholder="Name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    value={newMatch.p1Name} onChange={e => setNewMatch({...newMatch, p1Name: e.target.value})}
                  />
                  <div className="relative">
                    <input 
                      type="file" accept="image/*" className="hidden" id="p1Img"
                      onChange={e => handleImageChange(e, 1)}
                    />
                    <label htmlFor="p1Img" className="block w-full bg-black/50 border border-white/10 rounded-lg px-4 py-8 cursor-pointer text-gray-400 hover:bg-white/5 hover:border-orange-500/50 transition-colors text-center border-dashed">
                      {newMatch.p1Img ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={newMatch.p1Img} alt="Preview" className="w-16 h-16 object-cover rounded shadow" />
                          <span className="text-xs">Change Image</span>
                        </div>
                      ) : (
                        <span>Choose Image...</span>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-red-400 text-lg">Option 2</h3>
                  <input 
                    type="text" required placeholder="Name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    value={newMatch.p2Name} onChange={e => setNewMatch({...newMatch, p2Name: e.target.value})}
                  />
                  <div className="relative">
                    <input 
                      type="file" accept="image/*" className="hidden" id="p2Img"
                      onChange={e => handleImageChange(e, 2)}
                    />
                    <label htmlFor="p2Img" className="block w-full bg-black/50 border border-white/10 rounded-lg px-4 py-8 cursor-pointer text-gray-400 hover:bg-white/5 hover:border-orange-500/50 transition-colors text-center border-dashed">
                      {newMatch.p2Img ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={newMatch.p2Img} alt="Preview" className="w-16 h-16 object-cover rounded shadow" />
                          <span className="text-xs">Change Image</span>
                        </div>
                      ) : (
                        <span>Choose Image...</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end justify-between pt-6 border-t border-white/10 flex-wrap gap-4">
                <div className="w-32">
                  <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                  <input 
                    type="number" min="1" required className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    value={newMatch.duration} onChange={e => setNewMatch({...newMatch, duration: parseInt(e.target.value)})}
                  />
                </div>
                
                {isEditing && (() => {
                  const match = matches.find(m => m.id === isEditing);
                  if (!match) return null;
                  return (
                    <div className="flex gap-2 mb-1">
                      {match.status === 'pending' && (
                        <button 
                          type="button"
                          onClick={() => { handleStart(match.id, newMatch.duration); setShowFormModal(false); }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
                        >
                          Start Voting
                        </button>
                      )}
                      {match.status === 'active' && (
                        <button 
                          type="button"
                          onClick={() => { updateMatch(match.id, { status: 'completed' }); setShowFormModal(false); }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                        >
                          End Voting
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this match?')) {
                            deleteMatch(match.id);
                            setShowFormModal(false);
                          }
                        }}
                        className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-white rounded"
                      >
                        Delete Match
                      </button>
                    </div>
                  );
                })()}

                <div className="flex gap-3 ml-auto">
                  <button type="button" onClick={() => setShowFormModal(false)} className="px-6 py-3 rounded-lg font-medium text-gray-300 hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                    {isEditing ? 'Save' : 'Create'}
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

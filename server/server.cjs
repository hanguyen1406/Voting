const express = require('express');
const cors = require('cors');
const path = require('path');
const { data, saveData } = require('./db.cjs');

const app = express();

app.use(cors());
// Set body payload size limits high to support base64 image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;

// GET /api/matches - Retrieve all matches, appending user voting status if userId parameter is provided
app.get('/api/matches', (req, res) => {
  const { userId } = req.query;
  try {
    // Map database structure to frontend structure and clone to avoid direct mutations
    const matches = data.matches.map(m => ({
      id: m.id,
      round: m.round,
      participant1: m.participant1,
      participant2: m.participant2,
      votes1: m.votes1,
      votes2: m.votes2,
      status: m.status,
      endTime: m.endTime,
      winnerId: m.winnerId,
      userVotedOption: null
    }));

    // If userId is provided, fetch which matches they've already voted on
    if (userId) {
      const userVotes = data.votes.filter(v => v.user_id === userId);
      const votesMap = {};
      userVotes.forEach(v => {
        votesMap[v.match_id] = v.option_index;
      });
      
      matches.forEach(m => {
        if (votesMap[m.id] !== undefined) {
          m.userVotedOption = votesMap[m.id];
        }
      });
    }

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to retrieve matches from database.' });
  }
});

// POST /api/matches - Create a new match in the tournament
app.post('/api/matches', (req, res) => {
  const { id, round, participant1, participant2, votes1, votes2, status, endTime, winnerId } = req.body;
  try {
    data.matches.push({
      id: id,
      round: parseInt(round, 10),
      participant1: participant1 || null,
      participant2: participant2 || null,
      votes1: votes1 || 0,
      votes2: votes2 || 0,
      status: status || 'pending',
      endTime: endTime || null,
      winnerId: winnerId || null
    });
    saveData();
    res.status(201).json({ success: true, message: 'Match created successfully' });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match in database.' });
  }
});

// PUT /api/matches/:id - Update an existing match dynamically
app.put('/api/matches/:id', (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  try {
    const match = data.matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (updateFields.round !== undefined) match.round = parseInt(updateFields.round, 10);
    if (updateFields.status !== undefined) match.status = updateFields.status;
    if (updateFields.endTime !== undefined) match.endTime = updateFields.endTime;
    if (updateFields.votes1 !== undefined) match.votes1 = updateFields.votes1;
    if (updateFields.votes2 !== undefined) match.votes2 = updateFields.votes2;
    if (updateFields.winnerId !== undefined) match.winnerId = updateFields.winnerId;
    if (updateFields.participant1 !== undefined) match.participant1 = updateFields.participant1;
    if (updateFields.participant2 !== undefined) match.participant2 = updateFields.participant2;

    saveData();
    res.json({ success: true, message: 'Match updated successfully.' });
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match in database.' });
  }
});

// DELETE /api/matches/:id - Delete a match and clean up its votes
app.delete('/api/matches/:id', (req, res) => {
  const { id } = req.params;
  try {
    data.matches = data.matches.filter(m => m.id !== id);
    data.votes = data.votes.filter(v => v.match_id !== id);
    saveData();
    res.json({ success: true, message: 'Match deleted successfully.' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match from database.' });
  }
});

// DELETE /api/rounds/:round - Delete a round and all subsequent rounds
app.delete('/api/rounds/:round', (req, res) => {
  const { round } = req.params;
  const roundNum = parseInt(round, 10);
  try {
    const matchIdsToDelete = new Set(
      data.matches.filter(m => m.round >= roundNum).map(m => m.id)
    );
    data.matches = data.matches.filter(m => !matchIdsToDelete.has(m.id));
    data.votes = data.votes.filter(v => !matchIdsToDelete.has(v.match_id));
    saveData();
    res.json({ success: true, message: 'Round and subsequent rounds deleted successfully.' });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({ error: 'Failed to delete round from database.' });
  }
});

// POST /api/rounds/:round/restart - Reset round matches and delete future rounds
app.post('/api/rounds/:round/restart', (req, res) => {
  const { round } = req.params;
  const { duration } = req.body;
  const roundNum = parseInt(round, 10);
  const endTime = Date.now() + (duration || 5) * 60000;

  try {
    // 1. Delete all matches (and their votes) for rounds > round
    const futureMatchIds = new Set(
      data.matches.filter(m => m.round > roundNum).map(m => m.id)
    );
    data.matches = data.matches.filter(m => !futureMatchIds.has(m.id));
    data.votes = data.votes.filter(v => !futureMatchIds.has(v.match_id));
    
    // 2. Reset votes and set active for the current round matches
    data.matches.forEach(m => {
      if (m.round === roundNum) {
        data.votes = data.votes.filter(v => v.match_id !== m.id);
        m.votes1 = 0;
        m.votes2 = 0;
        m.status = 'active';
        m.endTime = endTime;
        m.winnerId = null;
      }
    });

    saveData();
    res.json({ success: true, message: 'Round restarted successfully.' });
  } catch (error) {
    console.error('Error restarting round:', error);
    res.status(500).json({ error: 'Database transaction failed during round restart.' });
  }
});

// POST /api/matches/:id/vote - Cast a vote for Option 1 or 2
app.post('/api/matches/:id/vote', (req, res) => {
  const { id } = req.params;
  const { userId, optionIndex } = req.body;

  if (!userId || (optionIndex !== 1 && optionIndex !== 2)) {
    return res.status(400).json({ error: 'Invalid user or option choice.' });
  }

  try {
    // Check if match exists and is active
    const match = data.matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }
    if (match.status !== 'active') {
      return res.status(400).json({ error: 'Match is not active for voting.' });
    }
    if (match.endTime && match.endTime < Date.now()) {
      return res.status(400).json({ error: 'Voting time has ended for this match.' });
    }

    // Check if user has already voted
    const existingVote = data.votes.find(v => v.match_id === id && v.user_id === userId);
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted on this match.' });
    }

    // Record user vote
    data.votes.push({
      match_id: id,
      user_id: userId,
      option_index: optionIndex
    });

    // Increment match vote count
    if (optionIndex === 1) {
      match.votes1 += 1;
    } else {
      match.votes2 += 1;
    }
    
    saveData();
    
    res.json({
      success: true,
      message: 'Vote registered successfully.',
      match: {
        id: match.id,
        round: match.round,
        participant1: match.participant1,
        participant2: match.participant2,
        votes1: match.votes1,
        votes2: match.votes2,
        status: match.status,
        endTime: match.endTime,
        userVotedOption: optionIndex
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Database transaction failed during voting.' });
  }
});

// Serve static files from the Vite production build
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback all non-API requests to the React SPA index.html
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

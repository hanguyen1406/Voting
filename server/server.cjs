const express = require('express');
const cors = require('cors');
const { query } = require('./db.cjs');

const app = express();

app.use(cors());
// Set body payload size limits high to support base64 image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;

// GET /api/matches - Retrieve all matches, appending user voting status if userId parameter is provided
app.get('/api/matches', async (req, res) => {
  const { userId } = req.query;
  try {
    const dbMatches = await query.all('SELECT * FROM matches');
    
    // Map database flat row representation to frontend Match structure
    const matches = dbMatches.map(m => ({
      id: m.id,
      round: m.round,
      participant1: m.p1_id ? { id: m.p1_id, name: m.p1_name, imageUrl: m.p1_imageUrl } : null,
      participant2: m.p2_id ? { id: m.p2_id, name: m.p2_name, imageUrl: m.p2_imageUrl } : null,
      votes1: m.votes1,
      votes2: m.votes2,
      status: m.status,
      endTime: m.endTime,
      winnerId: m.winner_id || null,
      userVotedOption: null
    }));

    // If userId is provided, fetch which matches they've already voted on
    if (userId) {
      const userVotes = await query.all('SELECT * FROM votes WHERE user_id = ?', [userId]);
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
app.post('/api/matches', async (req, res) => {
  const { id, round, participant1, participant2, votes1, votes2, status, endTime, winnerId } = req.body;
  try {
    await query.run(`
      INSERT INTO matches (id, round, p1_id, p1_name, p1_imageUrl, p2_id, p2_name, p2_imageUrl, votes1, votes2, status, endTime, winner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      round,
      participant1?.id || null,
      participant1?.name || null,
      participant1?.imageUrl || null,
      participant2?.id || null,
      participant2?.name || null,
      participant2?.imageUrl || null,
      votes1 || 0,
      votes2 || 0,
      status || 'pending',
      endTime || null,
      winnerId || null
    ]);
    res.status(201).json({ success: true, message: 'Match created successfully' });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match in database.' });
  }
});

// PUT /api/matches/:id - Update an existing match dynamically
app.put('/api/matches/:id', async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  try {
    const fields = [];
    const values = [];

    if (updateFields.round !== undefined) { fields.push('round = ?'); values.push(updateFields.round); }
    if (updateFields.status !== undefined) { fields.push('status = ?'); values.push(updateFields.status); }
    if (updateFields.endTime !== undefined) { fields.push('endTime = ?'); values.push(updateFields.endTime); }
    if (updateFields.votes1 !== undefined) { fields.push('votes1 = ?'); values.push(updateFields.votes1); }
    if (updateFields.votes2 !== undefined) { fields.push('votes2 = ?'); values.push(updateFields.votes2); }
    if (updateFields.winnerId !== undefined) { fields.push('winner_id = ?'); values.push(updateFields.winnerId); }

    if (updateFields.participant1 !== undefined) {
      fields.push('p1_id = ?', 'p1_name = ?', 'p1_imageUrl = ?');
      values.push(
        updateFields.participant1?.id || null,
        updateFields.participant1?.name || null,
        updateFields.participant1?.imageUrl || null
      );
    }

    if (updateFields.participant2 !== undefined) {
      fields.push('p2_id = ?', 'p2_name = ?', 'p2_imageUrl = ?');
      values.push(
        updateFields.participant2?.id || null,
        updateFields.participant2?.name || null,
        updateFields.participant2?.imageUrl || null
      );
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    values.push(id);
    await query.run(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Match updated successfully.' });
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match in database.' });
  }
});

// DELETE /api/matches/:id - Delete a match and clean up its votes
app.delete('/api/matches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM matches WHERE id = ?', [id]);
    await query.run('DELETE FROM votes WHERE match_id = ?', [id]);
    res.json({ success: true, message: 'Match deleted successfully.' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match from database.' });
  }
});

// POST /api/rounds/:round/restart - Reset round matches and delete future rounds
app.post('/api/rounds/:round/restart', async (req, res) => {
  const { round } = req.params;
  const { duration } = req.body;
  const roundNum = parseInt(round, 10);
  const endTime = Date.now() + (duration || 5) * 60000;

  try {
    // 1. Delete all matches (and their votes) for rounds > round
    const futureMatches = await query.all('SELECT id FROM matches WHERE round > ?', [roundNum]);
    for (const fm of futureMatches) {
      await query.run('DELETE FROM matches WHERE id = ?', [fm.id]);
      await query.run('DELETE FROM votes WHERE match_id = ?', [fm.id]);
    }
    
    // 2. Reset votes and set active for the current round matches
    const currentMatches = await query.all('SELECT id FROM matches WHERE round = ?', [roundNum]);
    for (const cm of currentMatches) {
      await query.run('DELETE FROM votes WHERE match_id = ?', [cm.id]);
      await query.run(`UPDATE matches SET votes1 = 0, votes2 = 0, status = 'active', endTime = ?, winner_id = NULL WHERE id = ?`, [endTime, cm.id]);
    }
    
    res.json({ success: true, message: 'Round restarted successfully.' });
  } catch (error) {
    console.error('Error restarting round:', error);
    res.status(500).json({ error: 'Database transaction failed during round restart.' });
  }
});

// POST /api/matches/:id/vote - Cast a vote for Option 1 or 2
app.post('/api/matches/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { userId, optionIndex } = req.body;

  if (!userId || (optionIndex !== 1 && optionIndex !== 2)) {
    return res.status(400).json({ error: 'Invalid user or option choice.' });
  }

  try {
    // Check if match exists and is active
    const match = await query.get('SELECT * FROM matches WHERE id = ?', [id]);
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
    const existingVote = await query.get('SELECT * FROM votes WHERE match_id = ? AND user_id = ?', [id, userId]);
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted on this match.' });
    }

    // Atomic transaction to record user vote and increment match vote count
    const voteField = optionIndex === 1 ? 'votes1' : 'votes2';
    
    // We execute the insert and update as sequential queries on the database wrapper
    await query.run('INSERT INTO votes (match_id, user_id, option_index) VALUES (?, ?, ?)', [id, userId, optionIndex]);
    await query.run(`UPDATE matches SET ${voteField} = ${voteField} + 1 WHERE id = ?`, [id]);
    
    // Retrieve updated match data to return back to frontend
    const updatedMatch = await query.get('SELECT * FROM matches WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Vote registered successfully.',
      match: {
        id: updatedMatch.id,
        round: updatedMatch.round,
        participant1: updatedMatch.p1_id ? { id: updatedMatch.p1_id, name: updatedMatch.p1_name, imageUrl: updatedMatch.p1_imageUrl } : null,
        participant2: updatedMatch.p2_id ? { id: updatedMatch.p2_id, name: updatedMatch.p2_name, imageUrl: updatedMatch.p2_imageUrl } : null,
        votes1: updatedMatch.votes1,
        votes2: updatedMatch.votes2,
        status: updatedMatch.status,
        endTime: updatedMatch.endTime,
        userVotedOption: optionIndex
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Database transaction failed during voting.' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Create Matches table
    db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        round INTEGER NOT NULL,
        p1_id TEXT,
        p1_name TEXT,
        p1_imageUrl TEXT,
        p2_id TEXT,
        p2_name TEXT,
        p2_imageUrl TEXT,
        votes1 INTEGER DEFAULT 0,
        votes2 INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
        endTime INTEGER,
        winner_id TEXT
      )
    `);

    // Migrate existing database to add winner_id column if it doesn't exist
    db.run("ALTER TABLE matches ADD COLUMN winner_id TEXT", (err) => {
      // Ignore error if column already exists
    });

    // Create Votes table to track who voted for which match
    db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        match_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        option_index INTEGER CHECK(option_index IN (1, 2)) NOT NULL,
        PRIMARY KEY (match_id, user_id)
      )
    `);

    // Seed default active match if table is empty
    db.get('SELECT COUNT(*) as count FROM matches', (err, row) => {
      if (err) {
        console.error('Error checking match count:', err);
        return;
      }

      if (row.count === 0) {
        console.log('No matches found. Seeding a default active match...');
        const defaultMatch = {
          id: 'm1',
          round: 1,
          p1_id: 'p1',
          p1_name: 'Neon Cyberpunk City',
          p1_imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=85',
          p2_id: 'p2',
          p2_name: 'Retro Futuristic Cruiser',
          p2_imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=85',
          votes1: 0,
          votes2: 0,
          status: 'active',
          endTime: Date.now() + 600000 // 10 minutes from now
        };

        db.run(`
          INSERT INTO matches (id, round, p1_id, p1_name, p1_imageUrl, p2_id, p2_name, p2_imageUrl, votes1, votes2, status, endTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          defaultMatch.id,
          defaultMatch.round,
          defaultMatch.p1_id,
          defaultMatch.p1_name,
          defaultMatch.p1_imageUrl,
          defaultMatch.p2_id,
          defaultMatch.p2_name,
          defaultMatch.p2_imageUrl,
          defaultMatch.votes1,
          defaultMatch.votes2,
          defaultMatch.status,
          defaultMatch.endTime
        ], (insertErr) => {
          if (insertErr) {
            console.error('Failed to seed default match:', insertErr);
          } else {
            console.log('Successfully seeded default active match.');
          }
        });
      }
    });
  });
}

// Wrap db operations in promises for easier async/await usage
const query = {
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  })
};

module.exports = { db, query };

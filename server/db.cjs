const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, 'database.json');

let data = {
  matches: [],
  votes: []
};

// Load initial data from JSON database
try {
  if (fs.existsSync(jsonPath)) {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    data = JSON.parse(rawData);
    if (!data.matches) data.matches = [];
    if (!data.votes) data.votes = [];
    console.log(`Connected to in-memory database. Loaded ${data.matches.length} matches and ${data.votes.length} votes.`);
  } else {
    console.log('database.json not found, initializing empty database.');
  }
} catch (err) {
  console.error('Error loading database.json:', err);
}

// Seed default active match if database is empty
if (data.matches.length === 0) {
  console.log('No matches found. Seeding a default active match...');
  data.matches.push({
    id: 'm1',
    round: 1,
    participant1: {
      id: 'p1',
      name: 'Neon Cyberpunk City',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=85'
    },
    participant2: {
      id: 'p2',
      name: 'Retro Futuristic Cruiser',
      imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=85'
    },
    votes1: 0,
    votes2: 0,
    status: 'active',
    endTime: Date.now() + 600000, // 10 minutes from now
    winnerId: null
  });
  saveData();
}

let isSaving = false;
let pendingSave = false;

// Save data back to JSON database file asynchronously in the background
function saveData() {
  if (isSaving) {
    pendingSave = true;
    return;
  }
  isSaving = true;
  pendingSave = false;

  fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8')
    .then(() => {
      isSaving = false;
      if (pendingSave) {
        saveData();
      }
    })
    .catch((err) => {
      console.error('Error saving database to file:', err);
      isSaving = false;
    });
}

module.exports = {
  data,
  saveData
};

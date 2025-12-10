const fs = require('fs');
const path = require('path');

// Allow overriding the storage dir (e.g. Railway volume); default to repo /data
const storageDir = process.env.LEADERBOARD_DIR || __dirname;
const filePath = path.join(storageDir, 'leaderboard.json');

// Ensure directory exists when a custom path is used
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf8');
}

// Load leaderboard
let leaderboard = {};

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    leaderboard = JSON.parse(raw || '{}');
} catch (error) {
    console.error('❌ Failed to load leaderboard.json, resetting file.', error);
    leaderboard = {};
    fs.writeFileSync(filePath, '{}', 'utf8');
}

// Save to file
function saveLeaderboard() {
    fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 2), 'utf8');
}

// Update permanent leaderboard
function updatePermanent(userId, username, delta) {
    if (!leaderboard[userId]) {
        leaderboard[userId] = { name: username, net: 0 };
    }
    leaderboard[userId].net += delta;
    saveLeaderboard();
}

// Read sorted leaderboard
function getPermanentLeaderboard() {
    return Object.values(leaderboard)
        .sort((a, b) => b.net - a.net);
}

module.exports = {
    updatePermanent,
    getPermanentLeaderboard
};

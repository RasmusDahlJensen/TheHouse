//Pc storage
// const fs = require('fs');
// const path = require('path');

// const filePath = path.join(__dirname, 'leaderboard.json');

// // Initialize file if missing
// if (!fs.existsSync(filePath)) {
//     fs.writeFileSync(filePath, '{}', 'utf8');
// }

// let leaderboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// // Save to file
// function saveLeaderboard() {
//     fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 2), 'utf8');
// }

// // Update permanent leaderboard
// function updatePermanent(userId, username, delta) {
//     if (!leaderboard[userId]) {
//         leaderboard[userId] = { name: username, net: 0 };
//     }
//     leaderboard[userId].net += delta;
//     saveLeaderboard();
// }

// // Read sorted leaderboard
// function getPermanentLeaderboard() {
//     return Object.values(leaderboard)
//         .sort((a, b) => b.net - a.net);
// }

// module.exports = {
//     updatePermanent,
//     getPermanentLeaderboard
// };

//Railway volume storage
const fs = require('fs');
const path = require('path');

// Path to persistent volume
const filePath = path.join('/mnt/data', 'leaderboard.json');

// Ensure file exists
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf8');
}

// Load leaderboard safely
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

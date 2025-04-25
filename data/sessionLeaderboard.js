const sessionWinnings = {};

function updateSession(userId, username, delta) {
    if (!sessionWinnings[userId]) {
        sessionWinnings[userId] = { name: username, net: 0 };
    }
    sessionWinnings[userId].net += delta;
}

function getSessionLeaderboard() {
    return Object.values(sessionWinnings)
        .sort((a, b) => b.net - a.net);
}

module.exports = {
    updateSession,
    getSessionLeaderboard
};

# 🎲 The House - Casino-Style Dice Battle Discord Bot

## Project Structure
the-house-bot/
├── commands/              # All slash commands
│   ├── starttable.js      # Create a new table
│   ├── jointable.js       # Join an existing table
│   ├── leavetable.js      # Leave your current table
│   ├── roll.js            # Start a roll (host only)
│   ├── listtables.js      # Show all active tables
│   ├── addbot.js          # Host-only: add debug bot to current table
│   └── kickbot.js         # Host-only: remove a bot by name
│
├── core/                  # Core game logic, OOP style
│   ├── Table.js           # The Table class (players, rolls, wager, host)
│   └── TableManager.js    # TableManager singleton (all table coordination)
│
├── utils/                 # Utility scripts
│   └── commandLoader.js   # Dynamic slash command registration + loading
│
├── data/                  # Persistent saved data
│   └── leaderboard.json   # Leaderboard storage (auto-created if missing)
│
├── .env                   # Token + client ID config
├── index.js               # Bot entrypoint
├── package.json           # NPM config


## Commands

| Command            | Description |
|--------------------|-------------|
| `/starttable <wager>` | Starts a new table, auto-names it |
| `/jointable <name>`   | Joins an existing table |
| `/roll start`         | Host-only command to roll for all at a table |
| `/leavetable`         | Leaves current table |
| `/listtables`         | Lists all active tables |
| `/addbot`             | Host-only: adds a debug bot to current table |
| `/kickbots`           | Host-only: removes all bots  from the table |


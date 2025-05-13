# The House — Full Table System Redesign Plan

## Project Vision

Tables are no longer just messages inside a global channel.
Instead, **each table** is its own **text channel** created and managed by the bot.

- When the bot is first invited to the server you give it a command for it to create a lobby channel
- Lobby channel has a message that showcases all tables and an option to join a table or create one.
- Players only see channels they are allowed to
- Game flow controlled by a single message
- Channels are deleted when empty
- Roles are assigned dynamically and cleaned up

## Core Functionalities| Feature | Details |

|---------|---------|
| Table = Text Channel | Each table creates a new private text channel |
| Dynamic Role | Each table gets its own role assigned to players |
| Single Game Message | Persistent embed edited to show current game state |
| Button Controls Only | No typing needed — Join, Leave, Ready, Roll Again |
| Auto Cleanup | Table channel and role deleted when empty |
| Invitation System (Later) | Ability to invite specific users directly |

## Technical Overview

- **When starting a table**:
  - Bot creates a **new text channel** under a defined "Casino" category
  - Bot creates a **new role** for the table's players
  - Bot configures **permissions**:
    - Only assigned role can view/send in the channel
    - Everyone else denied
  - Bot sends the **main game embed** with action buttons
- **When a player joins**:

  - Bot assigns them the **table role** so they gain access to the channel
  - Updates the table embed with their name and ready status

- **When a player leaves**:
  - Bot removes the role
  - Updates table embed
- **When all players leave**:
  - Bot deletes the channel
  - Bot deletes the role
  - Cleans up internal tracking
- **When all players ready up**:
  - Bot automatically starts the game (no "Start" button needed)
- **Game Results**:
  - After finishing, show **Roll Again** and **Leave Table** buttons
  - Allow players to continue or exit

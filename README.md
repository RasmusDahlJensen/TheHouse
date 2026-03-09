# The House - Discord Casino Bot

A modern, lightweight Discord Casino Bot that creates temporary instances for playing games like standard `/roll` and `deathroll` without cluttering your server.

## Features
- **Private Thread Tables**: Whenever you create a table, a temporary Private Thread is opened. This keeps the main channel clean and keeps games private to those who join.
- **Button Controls**: No need to type commands to play! Everything from joining, rolling, to closing the table is done via Discord buttons.
- **Auto Cleanup**: The bot automatically cleans up threads when they are empty or when you click "Close Table", leaving no permanent channel clutter.

## Games
### Roll (1-100)
A standard WoW-style roll. Each player in the table rolls between 1 and 100. Once everyone has rolled, the player with the highest roll wins.

### Deathroll
A classic 1v1 game. The first player rolls 1-100. The result becomes the maximum roll for the second player. The second player rolls 1 to the new max. This goes back and forth until someone rolls a **1** and loses.

## How to Operate

1. **Create a Table**
   In any standard text channel on your server, use the slash command:
   `/table game:<roll | deathroll>`

2. **Join the Lobby**
   A new Private Thread will be created and you will be automatically added to it. Inside the thread, players can click the green **Join** button to enter the active roster.

3. **Start the Game**
   Once you have enough players joined (at least 1 for Roll, exactly 2 for Deathroll), the Host (the person who ran the command) can click the **Start Game** button.

4. **Play**
   Follow the on-screen prompts. Players use the **Roll** button specifically for their turn or phase.
   - For `/roll`, everyone presses Roll once.
   - For `deathroll`, the two players take turns pressing their Roll button.

5. **Finish or Play Again**
   After the game resolves, the Host has two options:
   - **Play Again**: Resets the table back to the Lobby phase with the current players.
   - **Close Table**: Ends the session completely and immediately deletes the Private Thread.

*Note: If all players use the "Leave Table" button and the table empties out, the thread will also automatically delete itself.*

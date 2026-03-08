# Mafia Bot – Spice Up Your Raids

**Have your Karazhan runs become too easy and stale?**  
**Time to add betrayal, suspicion and chaos with Mafia!**

Turn your WoW 10-man Karazhan (or any raid/party) into a thrilling social deduction game — perfect for 10–20+ players.  
Works especially well with **Karazhan 10-man** (classic vibe + manageable group size).

**Extra mode** also supports Rocket League parties / custom games.

### How It Works

1. Everyone joins the **same Discord voice channel**  
2. Raid leader types  
   `n.playmafia new`  
3. Bot secretly assigns roles via DM:  
   - **2 Mafia** — know each other, goal = **die 3 or more times** (excl. 5+ wipe deaths) without being obvious  
   - **1 Jester** — goal = act suspicious so people vote you at the end  
   - **Everyone else = Town** — figure out the impostors  
4. Bot posts clear public rules in text chat (read them!)  
5. Play your raid / Rocket League match normally  
   - Mafia subtly try to die ~3 times (wipes 5+ don't count)  
   - Jester sows confusion and acts mafia-like  
6. After the raid ends → **vote phase** in text chat  
   - Each player names **exactly 2 suspects**  
   - **Majority** = 5+ votes on one person

### Win Conditions & Gold Split

Gold is divided evenly among **all winners**:

- **Jester** wins → gets 5+ votes → steals some of the gold (included in split)  
- **Mafia** wins (individual) → each who got **≤4 votes** **and** died **3+ times** → share the gold  
- **Town** wins (individual) → each who successfully voted **1 or 2 real Mafia** into majority → share the gold

### Commands

| Command            | Description                                      |
|--------------------|--------------------------------------------------|
| `n.playmafia`      | Classic mode – 1 random Mafia                    |
| `n.playmafia new`  | Recommended: 2 Mafia + 1 Jester (WoW RL ready)  |

### Why Players Love It

- Turns boring farm runs into **high-stakes drama**  
- Mafia players get creative with "accidental" deaths  
- Jester creates hilarious paranoia  
- Town feels like detectives  
- Gold rewards actually matter — bragging rights included  
- Works in **WoW Karazhan 10-man** perfectly (ideal player count)  
- Bonus: same bot works for **Rocket League parties** too

**Ready to betray your guildies?**  
Join voice → type `n.playmafia new` → let the chaos begin 😈

Made for WoW raiders who want more than just mechanics.  
Questions? DM the bot owner or suggest features!


20% are mafia, 10% jester, 70% town

| Players | Mafia | Jester | Town |
| ------- | ----- | ------ | ---- |
| 1       | 1     | 0      | 0    |
| 3       | 1     | 0      | 2    |
| 5       | 1     | 0      | 4    |
| 10      | 2     | 1      | 7    |
| 20      | 4     | 2      | 14   |




 --   --- -- - - -- - -
For me: 

commands:
insallt the bot:
npm install

Run the bot:
npm run start

Go to the application. 
discord.com/developers/
Get the TOKEN

Create .env add TOKEN = ........

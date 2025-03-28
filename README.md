# AstroMine

Drawing on the horizons of space exploration and collaboration among communities, AstroMine converts asteroid mining into a vibrant social strategy game played within the Reddit universe through the Devvit platform.

---

### What is AstroMine?

AstroMine is a competitive game in which Redditors co-operate and compete to mine virtual asteroids. A new asteroid appears as a post every four hours, including a 3D model. Players employ energy and equipment to harvest resources, keep an inventory, upgrade equipment, and rank on leaderboards, promoting a distinct mix of strategy, resource management, and social interaction directly within Reddit posts and comments.

 **Key Features:** 

* **Discover the Cosmos:** Find new asteroid posts every four hours, including interactive 3D models (e.g., 16 Psyche, 22 Kalliope).
* **Strategic Mining:** Select your method – shallow excavations or deep digs – weighing energy expenses and resource possibilities (Iron, Nickel, Gold, Platinum, etc.).
* **Resource Management:** Collect and use minerals to improve equipment and maximize mining efficiency.
* **Dynamic Economy & Competition:** Participate in the game's cycles, cycle and all-time leaderboards by successful mining expeditions.
* **Community Cooperation:** Connect with fellow Redditors in `r/astromine_game` to exchange tactics, ideas, and learn about space resources together.

---

## 🕹️ How to Play: Become a Cosmic Miner

### 🚀 Launch Sequence

1. **Initiate Mining Ops** 
   - Find any **Astromine post** in supported subreddits (r/asteroidtalks)
   - Click*"LAUNCH GAME"*and watch your spacecraft dock with the asteroid

2. **Tool Selection** 🔧  
   Choose your planetary destruction tool wisely:  

   | Tool       | Capacity | Rare Chance | Best For                 | 
   |------------|----------|-------------|--------------------------|
   | **Shovel** | 10kg     | 5%          | Precision mining         |
   | **Bomb** | 50kg     | 15%         | High-risk bulk extraction|

*(Pro Tip: Bombs are limited - use strategically!)*

3. **Asteroid Navigation** 🌌  
   - **Rotate View** : Click + drag to inspect the asteroid
   - **Zoom** : Scroll to examine mineral veins

### 💥 Mining Operation

1. **Strike the Asteroid** 
   - **Double-click** on any asteroid surface area
   - Watch your tool create spectacular dust explosions 💫

2. **Results Analysis** 🔍  
   After explosive animation completes:  
   - **📊 Mineral Report** : See your haul of common/rare resources  
   - **⚡ Equipment Update** : Track remaining tools/upgrades  
   - **📈 Leaderboard Impact** : Watch your ranking climb in the post leaderboard button 

---

### How It's Built

Taking advantage of the strength of **Reddit's Devvit platform** , AstroMine is directly integrated into the Reddit user experience.

* **Devvit Backend:** Handles game logic, such as a 4-hourly asteroid posting scheduler, player action processing (upgrades, mining), and scoring.
* **Redis Database:** Offers persistence state storage for player energy, resource stock, and tool levels.
* **Reddit API:** Used through Devvit to create/update posts, manage user interactions on posts/comments, and show dynamic leaderboards.
* **Interactive Frontend:** The UI is primarily the Reddit posts, which include controls and display game data handled by the Devvit app.

![Architecture Diagram](https://res.cloudinary.com/dbm856uys/image/upload/v1743181451/grokw4wucq4vrlqw09bo.png)

---

### Where to Play

Embark on your mining adventure and join the community:

* **r/astromine_game** : [https://www.reddit.com/r/astromine_game/](https://www.reddit.com/r/astromine_game/)

---

### Contributors

*   [hardik-malani](https://github.com/hardik-malani)
*   [devesh1011](https://github.com/devesh1011)
*   [yaseen2402](https://github.com/yaseen2402)

---

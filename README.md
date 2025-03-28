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

### How It's Built

Taking advantage of the strength of **Reddit's Devvit platform**, AstroMine is directly integrated into the Reddit user experience.

*   **Devvit Backend:** Handles game logic, such as a 4-hourly asteroid posting scheduler, player action processing (upgrades, mining), and scoring.
*   **Redis Database:** Offers persistence state storage for player energy, resource stock, and tool levels.
*   **Reddit API:** Used through Devvit to create/update posts, manage user interactions on posts/comments, and show dynamic leaderboards.
*   **Interactive Frontend:** The UI is primarily the Reddit posts, which include controls and display game data handled by the Devvit app.

![Architecture Diagram](https://res.cloudinary.com/dbm856uys/image/upload/v1743181451/grokw4wucq4vrlqw09bo.png)

---

### Where to Play

Embark on your mining adventure and join the community:

*   **r/astromine_game**: [https://www.reddit.com/r/astromine_game/](https://www.reddit.com/r/astromine_game/)

---

### Contributors

*   [hardik-malani](https://github.com/hardik-malani)
*   [devesh1011](https://github.com/devesh1011)
*   [yaseen2402](https://github.com/yaseen2402)

---

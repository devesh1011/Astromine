/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

function updateScoreCard(playerItems) {
  // Get references to the score display elements
  const carbonScoreEl = document.getElementById("carbonScore");
  const nickelScoreEl = document.getElementById("nickelScore");
  const ironScoreEl = document.getElementById("ironScore");
  const goldScoreEl = document.getElementById("goldScore");
  const platinumScoreEl = document.getElementById("platinumScore");

  // Update the text content of each element, defaulting to 0 if the mineral isn't in inventory
  if (carbonScoreEl) {
    carbonScoreEl.textContent =
      Math.floor(playerItems.carbon / 2)?.toString() ?? "0";
  }
  if (nickelScoreEl) {
    nickelScoreEl.textContent =
      Math.floor(playerItems.nickel / 2)?.toString() ?? "0";
  }
  if (ironScoreEl) {
    ironScoreEl.textContent =
      Math.floor(playerItems.iron / 2)?.toString() ?? "0";
  }
  if (goldScoreEl) {
    goldScoreEl.textContent =
      Math.floor(playerItems.gold / 2)?.toString() ?? "0";
  }
  if (platinumScoreEl) {
    platinumScoreEl.textContent =
      Math.floor(playerItems.platinum / 2)?.toString() ?? "0";
  }

  // Optional: Add a visual effect like a temporary highlight
  const scoreCard = document.querySelector(".score-card");
  if (scoreCard) {
    scoreCard.classList.add("updated");
    setTimeout(() => {
      scoreCard.classList.remove("updated");
    }, 500); // Remove highlight after 0.5 seconds
  }
}

class App {
  constructor() {
    // Get references to the HTML elements
    this.output = /** @type {HTMLPreElement} */ (
      document.querySelector("#messageOutput")
    );
    this.usernameLabel = /** @type {HTMLSpanElement} */ (
      document.querySelector("#username")
    );
    this.counterLabel = /** @type {HTMLSpanElement} */ (
      document.querySelector("#counter")
    );
    this.counter = 0;

    // When the Devvit app sends a message with `postMessage()`, this will be triggered
    addEventListener("message", this.#onMessage);

    // This event gets called when the web view is loaded
    addEventListener("load", async () => {
      this.postMessage("webViewReady");

      if (window.initAsteroid) {
        window
          .initAsteroid()
          .catch((err) => console.error("Failed to initialize asteroid:", err));
      }
    });

    // Set up mining start handler for main.js to call
    window.onMiningStart = (toolType) => {
      const serverToolName = toolType === "dynamite" ? "boom" : toolType;
      this.postMessage("miningStart", { tool: serverToolName });
    };
  }

<<<<<<< HEAD
=======
  
>>>>>>> 7c5eec1103fc5d430c8a1276169596a086b66952
  postMessage(type, data) {
    parent.postMessage({ type, data }, "*");
  }

  #onMessage = (ev) => {
    if (ev.data.type !== "devvit-message") return;
    const { message } = ev.data.data;

    // Always output full message
    if (this.output) {
      this.output.replaceChildren(JSON.stringify(message, undefined, 2));
    }

    switch (message.type) {
      case "initialData": {
        const { username, playerItems, playerEquips } = message.data;
        window.asteroidConfig = message.data.asteroidConfig;
<<<<<<< HEAD
        // console.log("Received initial data:", {
        //   playerItems,
        //   playerEquips,
        // });
        updateScoreCard(playerItems);

        // Initialize game state with player data
        // if (window.initializeGameState) {
        //   window.initializeGameState(playerItems, playerEquips);
        // } else {
        //   console.error("initializeGameState not found");
        // }
        break;
      }
      // case "requestAsteroidConfig":
      //   // You could respond with the current config
      //   postWebViewMessage({
      //     type: "asteroidConfig",
      //     data: window.currentAsteroidConfig,
      //   });
      //   break;

      case "miningResult": {
        // Call the handler in main.js to update UI
        console.log(message.data.leaderboard)
        updateScoreCard(message.data.playerItems);
        break;
      }
=======
        console.log("Received initial data:", {
          playerItems,
          playerEquips,
        });

        // Initialize game state with player data
        if (window.initializeGameState) {
          window.initializeGameState(playerItems, playerEquips);
        } else {
          console.error("initializeGameState not found");
        }
        break;
      }
      // case "requestAsteroidConfig":
      //   // You could respond with the current config
      //   postWebViewMessage({
      //     type: "asteroidConfig",
      //     data: window.currentAsteroidConfig,
      //   });
      //   break;

      case "miningResult": {
        // Call the handler in main.js to update UI
        if (window.handleMiningResult) {
          window.handleMiningResult(message.data);
        }
        break;
      }
>>>>>>> 7c5eec1103fc5d430c8a1276169596a086b66952
      default:
        /** to-do: @satisifes {never} */
        const _ = message;
        break;
    }
  };
}

/**
 * Sends a message to the Devvit app.
 * @arg {WebViewMessage} msg
 * @return {void}
 */
function postWebViewMessage(msg) {
  parent.postMessage(msg, "*");
}

new App();

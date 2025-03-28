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
    carbonScoreEl.textContent = playerItems.carbon?.toString() ?? "0";
  }
  if (nickelScoreEl) {
    nickelScoreEl.textContent = playerItems.nickel?.toString() ?? "0";
  }
  if (ironScoreEl) {
    ironScoreEl.textContent = playerItems.iron?.toString() ?? "0";
  }
  if (goldScoreEl) {
    goldScoreEl.textContent = playerItems.gold?.toString() ?? "0";
  }
  if (platinumScoreEl) {
    platinumScoreEl.textContent = playerItems.platinum?.toString() ?? "0";
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

function updateEquipmentUI(playerEquips) {
  // Ensure playerEquips is an object, even if null/undefined is passed
  const equips = playerEquips || {};
  console.log("Updating Equipment UI with:", equips); // For debugging

  // Get all count badge elements
  const countBadges = document.querySelectorAll(".tool-count-badge");

  countBadges.forEach((badge) => {
    // Ensure it's an HTML element with dataset property
    if (!(badge instanceof HTMLElement)) return;

    const toolName = badge.dataset.tool; // Get tool name from data attribute (e.g., "shovel", "bomb")
    if (toolName) {
      const countStr = equips[toolName]?.toString() ?? "0"; // Get count, default to "0"
      const count = parseInt(countStr, 10); // Parse to integer for comparison

      badge.textContent = countStr; // Update the displayed text

      // Get the parent button to apply disabled styles
      const parentButton = badge.closest(".tool-button");

      // Style badge and button based on count
      if (count <= 0) {
        badge.style.background = "rgba(80, 80, 80, 0.8)"; // Dimmed background for zero count
        badge.style.boxShadow = "none";
        if (parentButton) {
          parentButton.style.opacity = "0.5"; // Make button look disabled
          parentButton.style.pointerEvents = "none"; // Disable clicking
          parentButton.style.filter = "grayscale(80%)"; // Further visual cue
        }
      } else {
        badge.style.background = "rgba(255, 0, 0, 0.9)"; // Default red background
        badge.style.boxShadow = "0 0 5px rgba(255, 0, 0, 0.7)";
        if (parentButton) {
          parentButton.style.opacity = "1"; // Ensure button looks enabled
          parentButton.style.pointerEvents = "auto"; // Enable clicking
          parentButton.style.filter = "none"; // Remove grayscale
        }
      }
    } else {
      console.warn("Found a count badge without a data-tool attribute:", badge);
    }
  });
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
    this.pendingUpdates = [];

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
  }

  #processDelayedUpdates() {
    this.pendingUpdates.forEach(({ playerItems, playerEquips }) => {
      updateScoreCard(playerItems);
      updateEquipmentUI(playerEquips);
    });
    this.pendingUpdates = [];
  }

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

        updateScoreCard(playerItems);
        updateEquipmentUI(playerEquips);

        break;
      }

      case "miningResult": {
        const { username, playerItems, playerEquips } = message.data;

        // Store the updates and process after 4 seconds
        this.pendingUpdates.push({ playerItems, playerEquips });

        setTimeout(() => {
          this.#processDelayedUpdates();
        }, 4000); // 3s animation + 1s notification
        break;
      }
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

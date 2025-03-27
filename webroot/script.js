/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

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

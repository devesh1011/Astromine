import "./createPost.js";
import { Devvit, useAsync, useWebView, useState } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

type WebViewMessage = {
  type:
    | "webViewReady"
    | "launchGame"
    | "updateEquips"
    | "updateItems"
    | "miningStart";
  data?: any;
};

type DevvitMessage = {
  type: "initialData" | "updateCounter" | "webViewReady" | "miningResult";
  data?: any;
};

type MineralType = "iron" | "nickel" | "carbon" | "gold" | "platinum";
type ToolType = "shovel" | "bomb";

interface ToolStats {
  yield: number;
  rareChance: number;
  cooldown: number;
}

const TOOL_STATS = {
  shovel: {
    yield: 10,
    rareChance: 0.05, // 5% chance for rare minerals
    cooldown: 3000, // 3 seconds
  },
  bomb: {
    yield: 50,
    rareChance: 0.15, // 15% chance for rare minerals
    cooldown: 5000, // 5 seconds
  },
};

function calculateYield(
  yieldAmount: number, // From effectiveYield
  toolStats: ToolStats, // { yield: number, rareChance: number }
  composition: Record<MineralType, number> // Asteroid's mineral ratios
): Record<MineralType, number> {
  const result = { iron: 0, nickel: 0, carbon: 0, gold: 0, platinum: 0 };

  for (let i = 0; i < yieldAmount; i++) {
    const roll = Math.random();

    // Rare minerals check (gold/platinum)
    if (roll < toolStats.rareChance) {
      const rareMineral = roll < toolStats.rareChance / 2 ? "gold" : "platinum";
      result[rareMineral]++;
    }
    // Common minerals (iron/nickel/carbon)
    else {
      const commonRoll = Math.random();
      if (commonRoll < composition.iron) result.iron++;
      else if (commonRoll < composition.iron + composition.nickel)
        result.nickel++;
      else result.carbon++;
    }
  }
  return result;
}

async function startMining(
  context: Devvit.Context,
  postId: string,
  username: string,
  tool: ToolType
) {
  const { redis } = context;
  const toolStats = TOOL_STATS[tool];

  const asteroidKey = `asteroid_config:${postId}`;
  const playerItemKey = `items_${username}_${postId}`;
  const playerEquipsKey = `equipments_${username}_${postId}`;

  console.log(
    `Checking tool '${tool}' for user '${username}' in key '${playerEquipsKey}'`
  );
  const currentToolCountStr = await redis.hGet(playerEquipsKey, tool);
  const currentToolCount = parseInt(currentToolCountStr ?? "0", 10);
  console.log(`Current count for tool '${tool}': ${currentToolCount}`);

  if (currentToolCount <= 0) {
    // Throw an error if the user doesn't have the tool
    throw new Error(`You don't have any ${tool}s left!`);
  }

  // If they have the tool, decrement the count *immediately*
  // Using hIncrBy is atomic for decrementing a single field
  console.log(`Decrementing tool '${tool}' count for user '${username}'...`);
  const updatedToolCount = await redis.hIncrBy(playerEquipsKey, tool, -1);
  console.log(
    `New count for tool '${tool}' after decrement: ${updatedToolCount}`
  );

  const asteroidData = await redis.get(asteroidKey);
  if (!asteroidData) {
    throw new Error("Asteroid has been depleted");
  }
  const dummyAsteroid = {
    capacity: 10000, // Total capacity in kg
    remaining: 8500, // Current remaining amount
    composition: {
      iron: 0.4, // 40%
      nickel: 0.3, // 30%
      carbon: 0.2, // 20%
      gold: 0.05, // 5%
      platinum: 0.05, // 5%
    },
  };

  const asteroid = asteroidData ? JSON.parse(asteroidData) : dummyAsteroid; // Fallback only

  if (asteroid.remaining <= 0) {
    const currentInventory = await redis.hGetAll(playerItemKey);
    return {
      mined: { iron: 0, nickel: 0, carbon: 0, gold: 0, platinum: 0 },
      remainingCapacity: 0,
      inventory: Object.fromEntries(
        Object.entries(currentInventory || {}).map(([key, value]) => [
          key,
          parseFloat(value),
        ])
      ),
    };
  }

  const effectiveYield = Math.min(toolStats.yield, asteroid.remaining);
  const minedMinerals = calculateYield(
    effectiveYield,
    toolStats,
    asteroid.composition
  );

  await redis.set(
    asteroidKey,
    JSON.stringify({
      ...asteroid,
      remaining: asteroid.remaining - effectiveYield,
    })
  );

  await Promise.all([
    redis.hIncrBy(playerItemKey, "iron", minedMinerals.iron),
    redis.hIncrBy(playerItemKey, "nickel", minedMinerals.nickel),
    redis.hIncrBy(playerItemKey, "carbon", minedMinerals.carbon),
    redis.hIncrBy(playerItemKey, "gold", minedMinerals.gold),
    redis.hIncrBy(playerItemKey, "platinum", minedMinerals.platinum),
  ]);

  //updating leaderboard
  await context.redis.zIncrBy(
    `leaderboard_${postId}`,
    `${username}`,
    minedMinerals.iron +
      minedMinerals.nickel * 2 +
      minedMinerals.carbon * 5 +
      minedMinerals.gold * 10 +
      minedMinerals.platinum * 15
  );

  const playerIems = await redis.hGetAll(playerItemKey);
  // const playerEquips = await redis.hGetAll(playerEquipsKey);

  return {
    playerItems: playerIems,
    remainingCapacity: asteroid.remaining - effectiveYield,
  };
}

// Create a leaderboard component
const Leaderboard = ({ onBack }: { onBack: () => void }) => (
  <vstack width="100%" height="100%" backgroundColor="#0a0a23" padding="medium">
    <hstack width="100%" alignment="start" gap="medium">
      <button appearance="destructive" size="small" onPress={onBack}>
        ← RETURN TO BASE
      </button>

      <text size="xlarge" weight="bold" color="#ff2a6d" alignment="center">
        🏆 ASTROMINE ALL TIME LEADERBOARD 🏆
      </text>
    </hstack>

    <spacer size="medium" />

    <vstack
      width="100%"
      backgroundColor="rgba(5, 5, 20, 0.85)"
      cornerRadius="medium"
      border="thick"
      borderColor="#05d9e8"
    >
      <hstack
        width="100%"
        padding="medium"
        backgroundColor="rgba(5, 217, 232, 0.2)"
      >
        <text width="20%" color="white" weight="bold">
          RANK
        </text>
        <text width="50%" color="white" weight="bold">
          MINER
        </text>
        <text width="30%" color="white" weight="bold" alignment="end">
          POINTS
        </text>
      </hstack>

      <vstack width="100%" padding="medium" gap="medium">
        <hstack width="100%">
          <text width="20%" color="gold" weight="bold">
            #1
          </text>
          <text width="50%" color="#7efff5">
            CosmoMiner42
          </text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">
            12,845
          </text>
        </hstack>

        <hstack width="100%">
          <text width="20%" color="silver" weight="bold">
            #2
          </text>
          <text width="50%" color="#7efff5">
            StarDuster
          </text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">
            10,372
          </text>
        </hstack>

        <hstack width="100%">
          <text width="20%" color="#cd7f32" weight="bold">
            #3
          </text>
          <text width="50%" color="#7efff5">
            AsteroidHunter
          </text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">
            8,915
          </text>
        </hstack>

        <hstack width="100%">
          <text width="20%" color="white" weight="bold">
            #4
          </text>
          <text width="50%" color="#7efff5">
            GalacticMiner
          </text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">
            7,683
          </text>
        </hstack>

        <hstack width="100%">
          <text width="20%" color="white" weight="bold">
            #5
          </text>
          <text width="50%" color="#7efff5">
            SpaceExplorer
          </text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">
            6,421
          </text>
        </hstack>
      </vstack>
    </vstack>
  </vstack>
);

Devvit.addCustomPostType({
  name: "Astromine",
  description: "An asteroid mining game.",
  render: (context) => {
    const postId = context.postId;
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? "anon";
    });

    // Load latest counter from redis with `useAsync` hook
    const [playerItems, setPlayerItems] = useState(async () => {
      const items = await context.redis.hGetAll(`items_${username}_${postId}`);
      // If items is empty or undefined, return an object with default values
      if (!items || Object.keys(items).length === 0) {
        return {
          iron: "0",
          nickel: "0",
          carbon: "0",
          gold: "0",
          platinum: "0",
        };
      }

      return items;
    });

    const [leaderboard, setLeaderboard] = useState(async () => {
      return await context.redis.zRange(`leaderboard_${postId}`, 0, 4, {
        reverse: true, // Get highest scores first
        by: "rank",
      });
    });

    const [playerEquips, setPlayerEquips] = useState(async () => {
      // Check if this user has been initialized before
      const hasBeenInitialized = await context.redis.exists(
        `user_initialized_${username}_${postId}`
      );

      // Get current items (may be empty for both new users and users with no items)
      const items = await context.redis.hGetAll(
        `equipments_${username}_${postId}`
      );

      // If this is a first-time user
      if (hasBeenInitialized === 0) {
        // Define default equipment
        const defaultEquipment = {
          shovel: "3",
          bomb: "1",
        };

        // Store the default equipment
        await context.redis.hSet(
          `equipments_${username}_${postId}`,
          defaultEquipment
        );

        // Mark this user as initialized
        await context.redis.set(
          `user_initialized_${username}_${postId}`,
          "true"
        );

        return defaultEquipment;
      }

      // Return existing items (which might be empty if all equipment is used up)
      return items || {};
    });

    // Set up the game webview
    const gameWebView = useWebView<WebViewMessage, DevvitMessage>({
      url: "page.html",
      async onMessage(message, webView) {
        switch (message.type) {
          case "webViewReady":
            const existingConfig = await context.redis.get(
              `asteroid_config:${postId}`
            );
            console.log("Asteroid config retrieved from redis", existingConfig);

            webView.postMessage({
              type: "initialData",
              data: {
                username: username,
                playerItems: playerItems,
                playerEquips: playerEquips,
              },
            });

          case "miningStart":
            const user = (await context.reddit.getCurrentUsername()) ?? "anon";

            const miningResult = await startMining(
              context,
              context.postId ?? "defaultPostId",
              user,
              message.data.tool
            );
            const updatedLeaderboard = await context.redis.zRange(
              `leaderboard_${postId}`,
              0,
              4,
              {
                reverse: true,
                by: "rank",
              }
            );

            webView.postMessage({
              type: "miningResult",
              data: {
                ...miningResult,
                leaderboard: updatedLeaderboard,
              },
            });
            // console.log("miningResult", miningResult);
            break;
          default:
            console.log(`Unknown message type: ${message.type}`);
        }
      },
      onUnmount() {
        // Removed the toast notification
      },
    });

    // If leaderboard is showing, render the leaderboard component
    if (showLeaderboard) {
      return <Leaderboard onBack={() => setShowLeaderboard(false)} />;
    }

    // Otherwise show the main menu
    return (
      <zstack width="100%" height={350}>
        <image
          url={context.assets.getURL("check.jpeg")}
          imageWidth={700}
          imageHeight={500}
          resizeMode="cover"
        />

        <zstack
          width="100%"
          height="100%"
          alignment="top center"
          padding="large"
        >
          <vstack
            width="60%"
            height="20%"
            backgroundColor="rgba(0, 0, 0, 0.7)"
            cornerRadius="medium"
            alignment="middle center"
            gap="medium"
          >
            <text size="xlarge" weight="bold" color="white">
              ASTROMINE
            </text>

            <button
              onPress={() => {
                gameWebView.mount();
                // Removed the toast notification
              }}
              appearance="primary"
              size="large"
            >
              🚀 LAUNCH GAME
            </button>

            <button
              onPress={() => {
                setShowLeaderboard(true);
              }}
              appearance="secondary"
              size="large"
            >
              🏆 LEADERBOARD
            </button>
          </vstack>
        </zstack>
      </zstack>
    );
  },
});

export default Devvit;
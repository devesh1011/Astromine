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
    | "setAsteroidConfig"
    | "miningStart";
  data?: any;
};

type DevvitMessage = {
  type: "initialData" | "updateCounter" | "webViewReady" | "miningResult";
  data?: any;
};

type MineralType = "iron" | "nickel" | "carbon" | "gold" | "platinum";
type ToolType = "shovel" | "bomb";

interface MiningResult {
  mined: Record<MineralType, number>;
  remainingCapacity: number;
  inventory: Record<string, number>;
}

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
): Promise<MiningResult> {
  const { redis } = context;
  const toolStats = TOOL_STATS[tool];

  const asteroidKey = `asteroid_config:${postId}`;
  // const userCooldownKey = `cooldown:${username}:${postId}`;
  const inventoryKey = `inventory:${username}:${postId}`;

  // const cooldownRemaining = await redis.get(userCooldownKey);
  // if (cooldownRemaining) {
  //   throw new Error(`Please wait ${Math.ceil(parseInt(cooldownRemaining)/1000} seconds before mining again`);
  // }

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
    const currentInventory = await redis.hGetAll(inventoryKey);
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
    redis.hIncrBy(inventoryKey, "iron", minedMinerals.iron),
    redis.hIncrBy(inventoryKey, "nickel", minedMinerals.nickel),
    redis.hIncrBy(inventoryKey, "carbon", minedMinerals.carbon),
    redis.hIncrBy(inventoryKey, "gold", minedMinerals.gold),
    redis.hIncrBy(inventoryKey, "platinum", minedMinerals.platinum),
  ]);

  // await redis.set(userCooldownKey, "1", {
  //   expiry: { milliseconds: toolStats.cooldown },
  // });
  const updatedInventory = await redis.hGetAll(inventoryKey);

  const numericInventory: Record<string, number> = {};
  for (const [key, value] of Object.entries(updatedInventory || {})) {
    numericInventory[key] = parseInt(value, 10) || 0; // Fallback to 0 if NaN
  }

  return {
    mined: minedMinerals,
    remainingCapacity: asteroid.remaining - effectiveYield,
    inventory: numericInventory || {},
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
    const { data: playerItems, loading: playerItemsLoading } = useAsync(
      async () =>
        (await context.redis.hGetAll(`items_${username}_${postId}`)) ?? []
    );

    const { data: playerEquips, loading: playerEquipsLoading } = useAsync(
      async () =>
        (await context.redis.hGetAll(`equips_${username}_${postId}`)) ?? []
    );

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
            break;

          case "miningStart":
            const user = (await context.reddit.getCurrentUsername()) ?? "anon";

            const miningResult = await startMining(
              context,
              context.postId ?? "defaultPostId",
              user,
              message.data.tool
            );
            webView.postMessage({ type: "miningResult", data: miningResult }); // Add this
            console.log(miningResult);
            break;

          // case "setAsteroidConfig":
          //   // Should ONLY receive initial asteroid generation data
          //   const asteroidConfig = message.data;
          //   console.log("Storing NEW asteroid config:", asteroidConfig);

          //   await context.redis.set(
          //     `asteroid_config:${postId}`,
          //     JSON.stringify({
          //       capacity: asteroidConfig.capacity,
          //       remaining: asteroidConfig.capacity,
          //       composition: asteroidConfig.composition,
          //     })
          //   );
          //   await context.redis.expire(`asteroid_config:${postId}`, 14400);
          //   break;

          // case "updateEquips":
          //   if (message.data.updateType == "increase") {
          //     await context.redis.hIncrBy(
          //       `items_${username}_${postId}`,
          //       message.data.equipName,
          //       parseInt(message.data.equipValue)
          //     );
          //   } else if (message.data.updateType == "decrease") {
          //     await context.redis.hIncrBy(
          //       `items_${username}_${postId}`,
          //       message.data.equipName,
          //       -parseInt(message.data.equipValue)
          //     );
          //   }
          //   console.log(`Updated equip values`);
          //   break;

          // case "updateItems":
          //   if (message.data.updateType == "increase") {
          //     await context.redis.hIncrBy(
          //       `items_${username}_${postId}`,
          //       message.data.itemName,
          //       parseInt(message.data.itemValue)
          //     );
          //   } else if (message.data.updateType == "decrease") {
          //     await context.redis.hIncrBy(
          //       `items_${username}_${postId}`,
          //       message.data.itemName,
          //       -parseInt(message.data.itemValue)
          //     );
          //   }
          //   console.log(`Updated item values`);
          //   break;
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

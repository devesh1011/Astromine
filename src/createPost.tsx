import { Devvit } from "@devvit/public-api";

// Shared asteroid generation logic
function generateAsteroidConfig() {
  const capacity = 5000 + Math.floor(Math.random() * 10000);

  const composition = {
    iron: 0.35 + Math.random() * 0.15,
    nickel: 0.25 + Math.random() * 0.1,
    carbon: 0.1 + Math.random() * 0.05,
    gold: 0.005 + Math.random() * 0.045,
    platinum: 0.005 + Math.random() * 0.045,
  };

  // Normalize composition to sum to 1
  const sum = Object.values(composition).reduce((a, b) => a + b);
  for (const key in composition) {
    const typedKey = key as keyof typeof composition;
    composition[typedKey] = parseFloat(
      (composition[typedKey] / sum).toFixed(4)
    );
  }

  return {
    capacity,
    remaining: capacity,
    composition,
  };
}

Devvit.addSchedulerJob({
  name: "uploadNewPost",
  onRun: async (event, context) => {
    const { reddit, redis, scheduler } = context;

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const asteroidConfig = generateAsteroidConfig();

      // Create the post with loading preview
      const post = await reddit.submitPost({
        title: `New Asteroid Discovered! (Capacity: ${asteroidConfig.capacity}kg)`,
        subredditName: subreddit.name,
        preview: (
          <vstack height="100%" width="100%" alignment="middle center">
            <text size="large">A new mining opportunity awaits!</text>
          </vstack>
        ),
      });

      // Store config with post ID
      const redisKey = `asteroid_config:${post.id}`;
      await redis.set(redisKey, JSON.stringify(asteroidConfig));
      await redis.expire(redisKey, 14400); // 4 hour expiration

      console.log(
        `Created new asteroid post ${post.id} with config:`,
        asteroidConfig
      );
    } catch (error) {
      console.error("Failed to create asteroid post:", error);
      // Reschedule if failed
      await scheduler.runJob({
        cron: "*/5 * * * *", // Retry in 5 minutes
        name: "uploadNewPost",
      });
    }
  },
});

// Install handler - schedules regular posts
Devvit.addTrigger({
  event: "AppInstall",
  onEvent: async (event, context) => {
    await context.scheduler.runJob({
      cron: "0 */4 * * *", // Every 4 hours at :00
      name: "uploadNewPost",
    });
    console.log("Scheduled asteroid posts every 4 hours");
  },
});

// Manual post creation for mods
Devvit.addMenuItem({
  label: "Create New Asteroid Now",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (event, context) => {
    const { reddit, redis, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const asteroidConfig = generateAsteroidConfig();

    // Create the post with loading preview
    const post = await reddit.submitPost({
      title: `New Asteroid Discovered! (Capacity: ${asteroidConfig.capacity}kg)`,
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">A new mining opportunity awaits!</text>
        </vstack>
      ),
    });

    // Store config with post ID
    const redisKey = `asteroid_config:${post.id}`;
    await redis.set(redisKey, JSON.stringify(asteroidConfig));
    await redis.expire(redisKey, 14400); // 4 hour expiration
    ui.showToast({ text: "Created post!" });
    ui.navigateTo(post);
  },
});

export default Devvit;



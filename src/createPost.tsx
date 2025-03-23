import { Devvit } from "@devvit/public-api";

Devvit.addSchedulerJob({
  name: "uploadNewPost",
  onRun: async (event, context) => {
    const { reddit } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    await reddit.submitPost({
      title: "Start Mining!",
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
  },
});

// Automatically schedule the job when the app is installed
Devvit.addTrigger({
  event: "AppInstall",
  onEvent: async (event, context) => {
    try {
      // Schedule the job to run every 4 hours
      await context.scheduler.runJob({
        cron: "0 */4 * * *",
        name: "uploadNewPost",
      });
      console.log("Scheduled job to run every 4 hours upon app installation.");
    } catch (error) {
      console.log("Error scheduling job:", error);
      throw error;
    }
  },
});

Devvit.addMenuItem({
  label: "Create a new asteroid.",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    // try {
    //   // Schedule the job to run every 4 hours (0:00, 4:00, 8:00, 12:00, 16:00, 20:00)
    //   await context.scheduler.runJob({
    //     cron: "0 */4 * * *", // Every 4 hours
    //     name: "uploadNewPost",
    //   });
    //   context.ui.showToast({
    //     text: "Scheduled new asteroid posts every 4 hours!",
    //   });
    // } catch (e) {
    //   console.log("Error scheduling job:", e);
    //   throw e;
    // }
  },
});

export default Devvit;

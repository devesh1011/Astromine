import { Devvit } from "@devvit/public-api";

Devvit.addSchedulerJob({
  name: "uploadNewPost",
  onRun: async (event, context) => {
    const { reddit } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: "Start Mining!",
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    // ui.showToast({ text: "New Astroid just appeared! Start Mining!" });
    // ui.navigateTo(post);
  },
});

// Adds a new menu item to the subreddit allowing to create a new post
Devvit.addMenuItem({
  label: "Create a new asteroid.",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    try {
      await context.scheduler.runJob({
        cron: "0 3 * * *",
        name: "uploadNewPost",
      });
    } catch (e) {
      console.log("error was not able to schedule:", e);
      throw e;
    }
  },
});

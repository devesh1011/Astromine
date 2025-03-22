import "./createPost.tsx";
import { Devvit, useWebView } from "@devvit/public-api";

// Define the shape of our message types
type WebViewMessage = {
  type: "webViewReady" | "launchGame";
};

type DevvitMessage = {
  type: "initialData" | "updateCounter";
  data?: any;
};

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: "Astromine",
  description: "An asteroid mining game.",
  render: (context) => {
    // Set up the game webview
    const gameWebView = useWebView<WebViewMessage, DevvitMessage>({
      url: "page.html",
      onMessage(message: WebViewMessage) {
        console.log("Received message:", message);

        if (message.type === "webViewReady") {
          console.log("WebView is ready");
        }
      },
    });
    return (
      <zstack
        width="100%"
        height={350}
      >
        <image
          url={context.assets.getURL("check.jpeg")}
          imageWidth={700}
          imageHeight={500}
          resizeMode="cover"
        />
        
        <zstack width="100%" height="100%" alignment="top center" padding="large">
          <vstack 
            width="60%"
            height="20%"
            backgroundColor="rgba(0, 0, 0, 0.7)" 
            cornerRadius="medium"
            alignment="middle center"
            gap="medium"
          >
            <text size="xlarge" weight="bold" color="white">ASTROMINE</text>
            
            <button
              onPress={() => gameWebView.mount()}
              appearance="primary"
              size="large"
            >
              🚀 LAUNCH GAME
            </button>
            
            <button
              onPress={() => console.log("Leaderboard clicked")}
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
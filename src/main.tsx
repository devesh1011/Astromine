import "./createPost.tsx";
import { Devvit, useAsync, useWebView, useState } from "@devvit/public-api";

// Define the shape of our message types
type WebViewMessage = {
  type: "webViewReady" | "launchGame" | "updateEquips" | "updateItems";
  data?: any;
};

type DevvitMessage = {
  type: "initialData" | "updateCounter" | "webViewReady";
  data?: any;
};

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Create a leaderboard component
const Leaderboard = ({ onBack }: { onBack: () => void }) => (
  <vstack 
    width="100%" 
    height="100%" 
    backgroundColor="#0a0a23"
    padding="medium"
  >
    <hstack width="100%" alignment="start" gap="medium">
      <button
        appearance="destructive"
        size="small"
        onPress={onBack}
      >
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
        <text width="20%" color="white" weight="bold">RANK</text>
        <text width="50%" color="white" weight="bold">MINER</text>
        <text width="30%" color="white" weight="bold" alignment="end">POINTS</text>
      </hstack>
      
      <vstack width="100%" padding="medium" gap="medium">
        <hstack width="100%">
          <text width="20%" color="gold" weight="bold">#1</text>
          <text width="50%" color="#7efff5">CosmoMiner42</text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">12,845</text>
        </hstack>
        
        <hstack width="100%">
          <text width="20%" color="silver" weight="bold">#2</text>
          <text width="50%" color="#7efff5">StarDuster</text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">10,372</text>
        </hstack>
        
        <hstack width="100%">
          <text width="20%" color="#cd7f32" weight="bold">#3</text>
          <text width="50%" color="#7efff5">AsteroidHunter</text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">8,915</text>
        </hstack>
        
        <hstack width="100%">
          <text width="20%" color="white" weight="bold">#4</text>
          <text width="50%" color="#7efff5">GalacticMiner</text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">7,683</text>
        </hstack>
        
        <hstack width="100%">
          <text width="20%" color="white" weight="bold">#5</text>
          <text width="50%" color="#7efff5">SpaceExplorer</text>
          <text width="30%" color="#d1f7ff" weight="bold" alignment="end">6,421</text>
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
      return (await context.reddit.getCurrentUsername()) ?? 'anon';
    });

    // Load latest counter from redis with `useAsync` hook
    const { data: playerItems, loading: playerItemsLoading } = useAsync(
      async () => (await context.redis.hGetAll(`items_${username}_${postId}`)) ?? []
    );

    const { data: playerEquips, loading: playerEquipsLoading } = useAsync(
      async () => (await context.redis.hGetAll(`equips_${username}_${postId}`)) ?? []
    );

    // Set up the game webview
    const gameWebView = useWebView<WebViewMessage, DevvitMessage>({
      url: "page.html",
      async onMessage(message, webView) {
        switch (message.type) {
          case 'webViewReady':
            if(!playerEquipsLoading && !playerItemsLoading){
              webView.postMessage({
                type: 'initialData',
                data: {
                  username: username,
                  playerItems: playerItems,
                  playerEquips: playerEquips
                },
              });
            }
            break;
          case 'updateEquips':
            if(message.data.updateType=="increase"){
              await context.redis.hIncrBy(
                `items_${username}_${postId}`, 
                message.data.equipName, 
                parseInt(message.data.equipValue)
              );
            }

            else if(message.data.updateType=="decrease"){
              await context.redis.hIncrBy(
                `items_${username}_${postId}`, 
                message.data.equipName, 
                -parseInt(message.data.equipValue)
              );
            }
            console.log(`Updated equip values`);
            break;

          case 'updateItems':
            if(message.data.updateType=="increase"){
              await context.redis.hIncrBy(
                `items_${username}_${postId}`, 
                message.data.itemName, 
                parseInt(message.data.itemValue)
              );
            }

            else if(message.data.updateType=="decrease"){
              await context.redis.hIncrBy(
                `items_${username}_${postId}`, 
                message.data.itemName, 
                -parseInt(message.data.itemValue)
              );
            }
            console.log(`Updated item values`);
            break;
          default:
            console.log(`Unknown message type: ${message.type}`);
        }
      },
      onUnmount() {
        context.ui.showToast('Game closed!');
      },
    });
    
    // If leaderboard is showing, render the leaderboard component
    if (showLeaderboard) {
      return <Leaderboard onBack={() => setShowLeaderboard(false)} />;
    }
    
    // Otherwise show the main menu
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
              onPress={() => {
                gameWebView.mount();
                context.ui.showToast('Launching game...');
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
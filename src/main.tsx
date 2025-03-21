import "./createPost.js";

import { Devvit, useState, useAsync, useWebView } from "@devvit/public-api";
import type { DevvitMessage, WebViewMessage } from "./message.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: "Astromine",
  description: "An asteroid mining game.",
  render: (context) => {
    const postId = context.postId;

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

    const webview = useWebView<WebViewMessage, DevvitMessage>({
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
            throw new Error(`Unknown message type: ${message satisfies never}`);
        }
      },
      onUnmount() {
        context.ui.showToast('Web view closed!');
      },
    });

    return <button onPress={() => webview.mount()}>Start Mining!</button>;
  },
});



export default Devvit;

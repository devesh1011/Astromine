import './createPost.js';

import { Devvit, useWebView } from '@devvit/public-api';
import { AsteroidData } from './types';

import type { DevvitMessage, WebViewMessage } from './message.js';

const ASTEROIDS: AsteroidData[] = [
  {
    id: "psyche",
    name: "16 Psyche",
    distance: 2.92,
    composition: {
      "Iron-Nickel": 63,
      "Pyroxene": 20,
      "Olivine": 10,
      "Troilite": 5,
      "Carbon": 2,
      "Gold": 0.1
    },
    model_url: "psyche.gltf"
  },
  // Add other asteroids...
];

Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
});

// Schedule new asteroid posts every 4 hours
Devvit.addSchedulerJob({
  name: 'postNewAsteroid',
  interval: '4h',
  onRun: async (context) => {
    const currentIndex = await context.redis.get('current_asteroid_index') || '0';
    const index = parseInt(currentIndex);
    const asteroid = ASTEROIDS[index];

    await context.reddit.submitPost({
      title: `New Asteroid Available: ${asteroid.name} - ${asteroid.distance} AU from Sun`,
      postType: 'AstroMine',
      metadata: asteroid,
      subredditName: context.subredditName
    });

    // Update index for next asteroid
    await context.redis.set('current_asteroid_index', 
      ((index + 1) % ASTEROIDS.length).toString()
    );
  }
});

// Add custom post type
Devvit.addCustomPostType({
  name: 'AstroMine',
  height: 'tall',
  render: (context) => {
    const asteroid = context.postMetadata as AsteroidData;
    const webView = useWebView({
      url: 'page.html',
      properties: { asteroid },
      onMessage: async (message) => {
        if (message.type === 'MINE') {
          const result = await handleMining(context, message.data);
          webView.postMessage({ type: 'MINING_RESULT', data: result });
        }
      },
    });

    return (
      <vstack padding="medium" alignment="middle center">
        <text size="xlarge" weight="bold">{asteroid.name}</text>
        <text>Distance from Sun: {asteroid.distance} AU</text>
        <spacer size="medium" />
        <button onPress={() => webView.mount()}>
          View Asteroid
        </button>
      </vstack>
    );
  },
});

export default Devvit;

import './createPost.js';

import { Devvit, useWebView } from '@devvit/public-api';

import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'AstroMine',
  height: 'tall',
  render: (context) => {
    const webView = useWebView({
      url: 'page.html',
      onMessage(message) {
        console.log('Received message from webview:', message);
      },
    });

    return (
      <vstack grow padding="small" alignment="middle center">
        <text size="xlarge" weight="bold">AstroMine</text>
        <spacer size="medium" />
        <button onPress={() => webView.mount()}>Launch App</button>
      </vstack>
    );
  },
});

export default Devvit;

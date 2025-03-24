export async function setupAudio() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const [shovel, fuse, explosion, space] = await Promise.all([
    loadSound("assets/shovel.mp3"),
    loadSound("assets/fuse.mp3"),
    loadSound("assets/explosion.mp3"),
    loadSound("assets/space.mp3"),
  ]);
  return { audioContext, shovel, fuse, explosion, space };
}

async function loadSound(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error loading sound:", error);
    return null;
  }
}
export function playSpaceSound(audioContext, buffer) {
  /* ... */
}

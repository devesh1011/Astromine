export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();
export let soundEnabled = false;
export let soundBuffers = {};

export async function loadSound(url, name) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error loading sound:", error);
    return null;
  }
}

export function playSound(name) {
  if (!soundEnabled || !soundBuffers[name]) return;

  try {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = soundBuffers[name];
    source.connect(audioContext.destination);
    source.start(0);

    // Return the source for potential control (e.g., stopping)
    return source;
  } catch (error) {
    console.error(`Error playing sound ${name}:`, error);
  }
}

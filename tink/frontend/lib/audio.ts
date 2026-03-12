/**
 * Play base64-encoded PCM audio data (24kHz, 16-bit, mono)
 * returned by Gemini TTS API.
 */
export function playPcmAudio(base64Data: string, sampleRate = 24000): void {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const samples = new Int16Array(bytes.buffer);
    const floats = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      floats[i] = samples[i] / 32768;
    }

    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, floats.length, sampleRate);
    buffer.getChannelData(0).set(floats);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
}

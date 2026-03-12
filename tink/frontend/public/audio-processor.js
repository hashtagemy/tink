/**
 * AudioWorklet processor that captures PCM audio from the microphone.
 *
 * Expects the AudioContext to be created with sampleRate=16000 so
 * the browser handles resampling for us.  Converts Float32 samples
 * to Int16 PCM and posts chunks (~150 ms each) to the main thread.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._chunks = [];
    this._count = 0;
    // 2400 samples = 150 ms at 16 kHz — good latency / overhead balance
    this._SEND_SIZE = 2400;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // mono Float32Array

    for (let i = 0; i < samples.length; i++) {
      // Clamp and convert Float32 [-1,1] -> Int16 [-32768,32767]
      const s = Math.max(-1, Math.min(1, samples[i]));
      this._chunks.push(s < 0 ? s * 0x8000 : s * 0x7fff);
    }
    this._count += samples.length;

    if (this._count >= this._SEND_SIZE) {
      const int16 = new Int16Array(this._chunks);
      this.port.postMessage(int16.buffer, [int16.buffer]);
      this._chunks = [];
      this._count = 0;
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);

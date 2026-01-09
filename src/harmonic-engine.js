/**
 * Harmonic Engine
 *
 * Generates precise prime harmonic frequencies using Web Audio API.
 * Each harmonic is generated at exact mathematical ratios - no equal temperament approximations.
 *
 * The harmonic series: if fundamental is f, then the nth harmonic is n*f.
 * For primes: 2f, 3f, 5f, 7f, 11f, 13f, 17f, 19f, 23f, 29f, 31f...
 *
 * To keep harmonics in a musical range, we "fold" them into octaves by dividing by powers of 2.
 * For example: 7th harmonic (7f) → 7f/4 = 1.75f (between octave and double octave)
 */

// Prime numbers for harmonic generation
// Each represents a genuinely new pitch relationship
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

// Colors associated with different prime "families" - for visual representation
const PRIME_COLORS = {
  2: { h: 220, s: 30, l: 60 },   // Cool blue - octave, familiar
  3: { h: 200, s: 40, l: 55 },   // Teal - fifth, still familiar
  5: { h: 45, s: 50, l: 55 },    // Warm gold - third, sweet
  7: { h: 280, s: 45, l: 50 },   // Purple - septimal, first alien
  11: { h: 320, s: 50, l: 50 },  // Magenta - undecimal, very alien
  13: { h: 160, s: 45, l: 45 },  // Cyan-green - tridecimal
  17: { h: 30, s: 55, l: 50 },   // Orange
  19: { h: 350, s: 50, l: 55 },  // Rose
  23: { h: 180, s: 40, l: 45 },  // Cyan
  29: { h: 260, s: 45, l: 50 },  // Violet
  31: { h: 100, s: 40, l: 45 },  // Lime
  37: { h: 15, s: 50, l: 50 },   // Coral
  41: { h: 240, s: 35, l: 55 },  // Periwinkle
  43: { h: 140, s: 40, l: 45 },  // Sea green
  47: { h: 300, s: 40, l: 50 },  // Orchid
  default: { h: 200, s: 30, l: 50 }
};

/**
 * Calculate the frequency ratio for a prime harmonic, folded into a usable range
 * @param {number} prime - The prime number
 * @returns {number} - The ratio relative to fundamental (between 1 and 4)
 */
function getPrimeRatio(prime) {
  // Fold into range [1, 4] by dividing by appropriate power of 2
  let ratio = prime;
  while (ratio >= 4) {
    ratio /= 2;
  }
  return ratio;
}

/**
 * Get all harmonics of a given prime, within the audible range
 * @param {number} prime - The base prime
 * @param {number} fundamental - The fundamental frequency
 * @param {number} maxFreq - Maximum frequency to include
 * @returns {Array} - Array of {ratio, frequency, octave} objects
 */
function getPrimeHarmonics(prime, fundamental, maxFreq = 8000) {
  const harmonics = [];
  let multiplier = 1;

  while (true) {
    const harmonic = prime * multiplier;
    const frequency = fundamental * harmonic;

    if (frequency > maxFreq) break;

    harmonics.push({
      ratio: harmonic,
      frequency: frequency,
      foldedRatio: getPrimeRatio(harmonic),
      multiplier: multiplier
    });

    multiplier *= 2; // Go up octaves
  }

  return harmonics;
}

export class HarmonicEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.voices = new Map(); // Active oscillators by harmonic ID
    this.fundamental = 110; // A2 - a rich, warm fundamental
    this.masterVolume = 0.4;
    this.isInitialized = false;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async init() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.masterVolume;

    // Create a subtle reverb for spatial depth
    this.reverbNode = await this.createReverb();

    // Create a gentle compressor to prevent clipping when many harmonics sound together
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Dry path
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 0.7;

    // Wet path (reverb)
    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = 0.3;

    // Connect: source → masterGain → dry/wet → compressor → output
    this.masterGain.connect(dryGain);
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(wetGain);

    dryGain.connect(this.compressor);
    wetGain.connect(this.compressor);
    this.compressor.connect(this.audioContext.destination);

    // Start the fundamental drone
    this.startFundamentalDrone();

    this.isInitialized = true;
  }

  /**
   * Create a simple convolution reverb
   */
  async createReverb() {
    const convolver = this.audioContext.createConvolver();

    // Generate impulse response for a gentle, spacious reverb
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 3; // 3 second reverb
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with some randomness for natural feel
        const decay = Math.exp(-3 * i / length);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Start a quiet fundamental drone that's always present
   */
  startFundamentalDrone() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = this.fundamental;

    gain.gain.value = 0.08; // Very quiet - felt more than heard

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.fundamentalOsc = osc;
    this.fundamentalGain = gain;
  }

  /**
   * Create a voice for a specific harmonic
   * @param {string} id - Unique identifier for this voice
   * @param {number} ratio - Frequency ratio relative to fundamental
   * @returns {Object} - Voice control object
   */
  createVoice(id, ratio) {
    if (this.voices.has(id)) {
      return this.voices.get(id);
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    // Use sine waves for pure harmonics - lets the ratios speak clearly
    osc.type = 'sine';
    osc.frequency.value = this.fundamental * ratio;

    // Start silent
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    const voice = {
      oscillator: osc,
      gain: gain,
      targetGain: 0,
      ratio: ratio
    };

    this.voices.set(id, voice);
    return voice;
  }

  /**
   * Set the amplitude of a harmonic voice with smooth transition
   * @param {string} id - Voice identifier
   * @param {number} amplitude - Target amplitude (0-1)
   * @param {number} time - Transition time in seconds
   */
  setVoiceAmplitude(id, amplitude, time = 0.1) {
    const voice = this.voices.get(id);
    if (!voice) return;

    const now = this.audioContext.currentTime;
    voice.targetGain = amplitude;

    // Smooth exponential ramp for organic feel
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.exponentialRampToValueAtTime(
      Math.max(amplitude, 0.0001), // Avoid 0 for exponential ramp
      now + time
    );
  }

  /**
   * Smoothly fade out and remove a voice
   * @param {string} id - Voice identifier
   * @param {number} fadeTime - Fade duration
   */
  releaseVoice(id, fadeTime = 0.5) {
    const voice = this.voices.get(id);
    if (!voice) return;

    const now = this.audioContext.currentTime;

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);

    // Clean up after fade
    setTimeout(() => {
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.gain.disconnect();
      this.voices.delete(id);
    }, fadeTime * 1000 + 100);
  }

  /**
   * Change the fundamental frequency
   * @param {number} freq - New fundamental frequency
   * @param {number} time - Transition time
   */
  setFundamental(freq, time = 0.5) {
    this.fundamental = freq;
    const now = this.audioContext.currentTime;

    // Update fundamental drone
    if (this.fundamentalOsc) {
      this.fundamentalOsc.frequency.exponentialRampToValueAtTime(freq, now + time);
    }

    // Update all active voices
    for (const [id, voice] of this.voices) {
      voice.oscillator.frequency.exponentialRampToValueAtTime(
        freq * voice.ratio,
        now + time
      );
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = volume;
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  /**
   * Get all prime harmonics as objects with position, color, and ratio info
   * @param {number} depth - How deep into the prime series to go (affects which primes are visible)
   * @returns {Array} - Array of harmonic descriptor objects
   */
  getHarmonicsForDepth(depth = 1) {
    const harmonics = [];
    const maxPrimeIndex = Math.min(
      Math.floor(5 + depth * 15), // Start with 5 primes, expand with depth
      PRIMES.length
    );

    for (let i = 0; i < maxPrimeIndex; i++) {
      const prime = PRIMES[i];
      const ratio = getPrimeRatio(prime);
      const color = PRIME_COLORS[prime] || PRIME_COLORS.default;

      // Also include compound harmonics (prime * 2, prime * 3, etc.) at deeper levels
      const compounds = depth > 0.5 ? [1, 2] : [1];

      for (const mult of compounds) {
        const compoundRatio = ratio * mult;
        if (compoundRatio > 8) continue; // Don't go too high

        harmonics.push({
          id: `${prime}_${mult}`,
          prime: prime,
          ratio: compoundRatio,
          pureRatio: prime, // The original prime
          color: color,
          // Intensity decreases for higher primes (they're more exotic)
          baseIntensity: 1 / Math.sqrt(i + 1),
          // Primes 7 and above are the "alien" ones
          isExotic: prime >= 7
        });
      }
    }

    return harmonics;
  }

  /**
   * Clean up all audio resources
   */
  destroy() {
    // Stop all voices
    for (const [id] of this.voices) {
      this.releaseVoice(id, 0.1);
    }

    // Stop fundamental
    if (this.fundamentalOsc) {
      this.fundamentalOsc.stop();
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export prime utilities for visual layer
export { PRIMES, PRIME_COLORS, getPrimeRatio };

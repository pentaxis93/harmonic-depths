/**
 * Harmonic Depths - Main Application
 *
 * An explorer for prime harmonic territory.
 * Sounds that Western tuning systems cannot express.
 */

import { HarmonicEngine } from './harmonic-engine.js';
import { HarmonicSpace } from './harmonic-space.js';
import { VisualRenderer } from './visual-renderer.js';

class HarmonicDepths {
  constructor() {
    // Core systems
    this.engine = new HarmonicEngine();
    this.canvas = document.getElementById('harmonicSpace');
    this.space = new HarmonicSpace(window.innerWidth, window.innerHeight);
    this.renderer = new VisualRenderer(this.canvas);

    // State
    this.isInitialized = false;
    this.isMouseDown = false;
    this.cursor = { x: 0, y: 0 };
    this.influenceRadius = 120;
    this.activeHarmonics = new Map(); // id -> current amplitude

    // UI elements
    this.intro = document.getElementById('intro');
    this.frequencyHint = document.getElementById('frequencyHint');
    this.fundamentalDisplay = document.getElementById('fundamentalDisplay');

    // Animation
    this.lastTime = 0;
    this.animationId = null;

    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.setupEventListeners();
    this.startAnimation();
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Mouse events
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('wheel', this.handleWheel, { passive: false });

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Prevent context menu
    window.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Initialize audio (must happen after user interaction)
   */
  async initAudio() {
    if (this.isInitialized) return;

    await this.engine.init();
    this.isInitialized = true;

    // Fade out intro
    if (this.intro) {
      this.intro.classList.add('hidden');
    }

    // Update fundamental display
    this.updateFundamentalDisplay();
  }

  /**
   * Handle mouse movement
   */
  handleMouseMove(e) {
    this.cursor = { x: e.clientX, y: e.clientY };
    this.renderer.setCursor(e.clientX, e.clientY, true);

    if (this.isInitialized) {
      this.updateHarmonicsFromCursor();
    }
  }

  /**
   * Handle mouse down - intensifies the effect
   */
  async handleMouseDown(e) {
    await this.initAudio();
    this.isMouseDown = true;
    this.updateHarmonicsFromCursor();
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(e) {
    this.isMouseDown = false;
    // Don't immediately silence - let the cursor position still matter
    // but with reduced intensity
    this.updateHarmonicsFromCursor();
  }

  /**
   * Handle scroll wheel - controls depth
   */
  handleWheel(e) {
    e.preventDefault();

    // Adjust depth based on scroll
    const delta = e.deltaY > 0 ? 0.05 : -0.05;
    const newDepth = Math.max(0, Math.min(1, this.space.depth + delta));
    this.space.setDepth(newDepth);

    // Create/remove voices for newly visible/hidden harmonics
    if (this.isInitialized) {
      this.syncVoicesWithDepth();
    }
  }

  /**
   * Handle key presses
   */
  handleKeyDown(e) {
    // Arrow keys shift fundamental frequency
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!this.isInitialized) return;

      const direction = e.key === 'ArrowUp' ? 1 : -1;
      // Shift by semitone ratio (not equal temperament, but close enough for this purpose)
      const ratio = Math.pow(2, direction / 12);
      const newFundamental = this.engine.fundamental * ratio;

      // Keep in reasonable range
      if (newFundamental >= 55 && newFundamental <= 440) {
        this.engine.setFundamental(newFundamental, 0.3);
        this.updateFundamentalDisplay();
      }
    }

    // F key toggles frequency display
    if (e.key === 'f' || e.key === 'F') {
      this.frequencyHint.classList.toggle('hidden');
    }

    // R key resets to default
    if (e.key === 'r' || e.key === 'R') {
      if (this.isInitialized) {
        this.engine.setFundamental(110, 0.5);
        this.space.setDepth(0);
        this.updateFundamentalDisplay();
      }
    }

    // Space bar acts like mouse down
    if (e.key === ' ') {
      e.preventDefault();
      this.initAudio();
      this.isMouseDown = true;
      this.updateHarmonicsFromCursor();
    }
  }

  /**
   * Handle key release
   */
  handleKeyUp(e) {
    if (e.key === ' ') {
      this.isMouseDown = false;
      this.updateHarmonicsFromCursor();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.space.resize(window.innerWidth, window.innerHeight);
    this.renderer.resize();
  }

  /**
   * Update harmonic amplitudes based on cursor position
   */
  updateHarmonicsFromCursor() {
    if (!this.isInitialized) return;

    // Find harmonics near cursor
    const near = this.space.getHarmonicsNear(
      this.cursor.x,
      this.cursor.y,
      this.influenceRadius
    );

    // Base intensity - higher when mouse is down
    const baseIntensity = this.isMouseDown ? 0.6 : 0.25;

    // Calculate new amplitudes
    const newAmplitudes = new Map();

    for (const { harmonic, influence } of near) {
      // Amplitude based on proximity and mouse state
      const amplitude = influence * baseIntensity * (1 / Math.sqrt(harmonic.prime / 2));
      newAmplitudes.set(harmonic.id, Math.min(0.8, amplitude));
    }

    // Update active harmonics
    const allHarmonicIds = new Set([
      ...this.activeHarmonics.keys(),
      ...newAmplitudes.keys()
    ]);

    for (const id of allHarmonicIds) {
      const currentAmp = this.activeHarmonics.get(id) || 0;
      const targetAmp = newAmplitudes.get(id) || 0;

      if (targetAmp > 0.01) {
        // Ensure voice exists and set amplitude
        const harmonic = this.space.getHarmonic(id);
        if (harmonic) {
          this.engine.createVoice(id, harmonic.ratio);
          this.engine.setVoiceAmplitude(id, targetAmp, 0.15);
          this.activeHarmonics.set(id, targetAmp);
          this.space.setHarmonicAmplitude(id, targetAmp);
        }
      } else if (currentAmp > 0.01) {
        // Fade out
        this.engine.setVoiceAmplitude(id, 0, 0.3);
        this.activeHarmonics.set(id, 0);
        this.space.setHarmonicAmplitude(id, 0);

        // Schedule removal
        setTimeout(() => {
          if (this.activeHarmonics.get(id) === 0) {
            this.engine.releaseVoice(id, 0.5);
            this.activeHarmonics.delete(id);
          }
        }, 500);
      }
    }
  }

  /**
   * Sync voices when depth changes
   */
  syncVoicesWithDepth() {
    // Release voices for harmonics that are no longer visible
    const visible = new Set(this.space.getVisibleHarmonics().map(h => h.id));

    for (const [id, amp] of this.activeHarmonics) {
      if (!visible.has(id) && amp > 0) {
        this.engine.setVoiceAmplitude(id, 0, 0.5);
        this.space.setHarmonicAmplitude(id, 0);
        this.activeHarmonics.set(id, 0);

        setTimeout(() => {
          this.engine.releaseVoice(id, 0.3);
          this.activeHarmonics.delete(id);
        }, 600);
      }
    }
  }

  /**
   * Update the fundamental frequency display
   */
  updateFundamentalDisplay() {
    if (this.fundamentalDisplay) {
      const freq = this.engine.fundamental.toFixed(1);
      this.fundamentalDisplay.textContent = `${freq} Hz`;
    }
  }

  /**
   * Main animation loop
   */
  animate(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // Update space animations
    this.space.update(deltaTime);

    // Render
    this.renderer.render(this.space, deltaTime);

    // Continue loop
    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Start the animation loop
   */
  startAnimation() {
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Stop and clean up
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.engine.destroy();
  }
}

// Start the application
const app = new HarmonicDepths();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});

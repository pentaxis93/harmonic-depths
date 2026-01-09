/**
 * Harmonic Space
 *
 * The visual/spatial model of the harmonic universe.
 * Positions harmonics in a way that feels organic but reflects their relationships.
 */

import { PRIMES, PRIME_COLORS, getPrimeRatio } from './harmonic-engine.js';

/**
 * Attempt at generating "organic" positions that still have harmonic meaning.
 * The spiral approach: each prime sits at a certain angle and distance.
 * - Angle based on the prime itself (creates a spiral pattern)
 * - Distance based on how "exotic" the prime is (higher = further from center)
 */

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

export class HarmonicSpace {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.center = { x: width / 2, y: height / 2 };
    this.depth = 0; // 0 = surface, 1 = deep
    this.time = 0;
    this.harmonics = [];
    this.generateHarmonics();
  }

  /**
   * Generate the harmonic nodes with positions
   */
  generateHarmonics() {
    const minDim = Math.min(this.width, this.height);
    const baseRadius = minDim * 0.35;

    this.harmonics = [];

    // Generate positions for first N primes
    for (let i = 0; i < PRIMES.length; i++) {
      const prime = PRIMES[i];
      const ratio = getPrimeRatio(prime);
      const color = PRIME_COLORS[prime] || PRIME_COLORS.default;

      // Spiral positioning
      // Angle: use golden angle for pleasing distribution
      const goldenAngle = Math.PI * 2 / (PHI * PHI);
      const angle = i * goldenAngle + prime * 0.1; // Add some prime-based variation

      // Distance: further for higher primes, with some variation
      // First primes (2, 3, 5) are closer, exotic primes are further
      const normalizedIndex = i / (PRIMES.length - 1);
      const distanceBase = 0.25 + normalizedIndex * 0.5; // 0.25 to 0.75 of radius
      const distanceVariation = Math.sin(prime * 0.7) * 0.1;
      const distance = baseRadius * (distanceBase + distanceVariation);

      // Position
      const x = this.center.x + Math.cos(angle) * distance;
      const y = this.center.y + Math.sin(angle) * distance;

      // Size based on "importance" - lower primes are larger
      const baseSize = 30 - i * 0.8;
      const size = Math.max(12, baseSize);

      this.harmonics.push({
        id: `prime_${prime}`,
        prime: prime,
        ratio: ratio,
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        size: size,
        baseSize: size,
        color: color,
        amplitude: 0, // Current sounding amplitude
        glow: 0, // Visual glow amount
        phase: Math.random() * Math.PI * 2, // For breathing animation
        breathRate: 0.5 + prime * 0.02, // Slightly different breath rates
        isExotic: prime >= 7,
        // Depth at which this harmonic becomes visible
        visibilityDepth: Math.max(0, (i - 4) / 15),
        // For organic movement
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 0.1 + Math.random() * 0.2
      });
    }
  }

  /**
   * Resize the space
   */
  resize(width, height) {
    const oldCenter = { ...this.center };
    this.width = width;
    this.height = height;
    this.center = { x: width / 2, y: height / 2 };

    // Recalculate positions
    const dx = this.center.x - oldCenter.x;
    const dy = this.center.y - oldCenter.y;

    for (const h of this.harmonics) {
      h.x += dx;
      h.y += dy;
      h.baseX += dx;
      h.baseY += dy;
    }

    // Regenerate for proper scaling
    this.generateHarmonics();
  }

  /**
   * Set the depth level (affects which harmonics are visible)
   * @param {number} depth - 0 (surface) to 1 (deep)
   */
  setDepth(depth) {
    this.depth = Math.max(0, Math.min(1, depth));
  }

  /**
   * Update animations
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    this.time += deltaTime;

    for (const h of this.harmonics) {
      // Breathing animation - gentle size pulsing
      const breath = Math.sin(this.time * h.breathRate + h.phase);
      h.size = h.baseSize * (1 + breath * 0.1);

      // Organic wandering - very subtle position drift
      h.wanderAngle += h.wanderSpeed * deltaTime * 0.3;
      const wanderAmount = 3 + h.amplitude * 5; // More movement when active
      h.x = h.baseX + Math.cos(h.wanderAngle) * wanderAmount;
      h.y = h.baseY + Math.sin(h.wanderAngle * 0.7) * wanderAmount;

      // Glow follows amplitude with slight smoothing
      h.glow += (h.amplitude - h.glow) * deltaTime * 5;
    }
  }

  /**
   * Get visible harmonics at current depth
   */
  getVisibleHarmonics() {
    return this.harmonics.filter(h => h.visibilityDepth <= this.depth + 0.3);
  }

  /**
   * Find harmonics near a point, sorted by distance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array} - Harmonics with distance info
   */
  getHarmonicsNear(x, y, radius) {
    const visible = this.getVisibleHarmonics();
    const near = [];

    for (const h of visible) {
      const dx = h.x - x;
      const dy = h.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius + h.size) {
        near.push({
          harmonic: h,
          distance: distance,
          // Influence falls off with distance
          influence: Math.max(0, 1 - distance / (radius + h.size))
        });
      }
    }

    // Sort by distance
    near.sort((a, b) => a.distance - b.distance);
    return near;
  }

  /**
   * Set amplitude for a harmonic
   * @param {string} id - Harmonic id
   * @param {number} amplitude - 0-1 amplitude
   */
  setHarmonicAmplitude(id, amplitude) {
    const h = this.harmonics.find(h => h.id === id);
    if (h) {
      h.amplitude = amplitude;
    }
  }

  /**
   * Get harmonic by ID
   */
  getHarmonic(id) {
    return this.harmonics.find(h => h.id === id);
  }
}

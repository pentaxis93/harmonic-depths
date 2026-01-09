/**
 * Visual Renderer
 *
 * Renders the harmonic space to canvas with organic, luminous aesthetics.
 * Creates a sense of depth, life, and mystery.
 */

export class VisualRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.cursor = { x: 0, y: 0, active: false };
    this.resize();

    // Background noise texture
    this.noiseCanvas = this.createNoiseTexture();

    // Particle system for active harmonic effects
    this.particles = [];
    this.maxParticles = 200;
  }

  /**
   * Create a subtle noise texture for organic background
   */
  createNoiseTexture() {
    const size = 256;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = size;
    noiseCanvas.height = size;
    const ctx = noiseCanvas.getContext('2d');

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 20;
      data[i] = noise;     // R
      data[i + 1] = noise; // G
      data[i + 2] = noise + 5; // B (slight blue tint)
      data[i + 3] = 15;    // A (very subtle)
    }

    ctx.putImageData(imageData, 0, 0);
    return noiseCanvas;
  }

  /**
   * Handle resize
   */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Set cursor position
   */
  setCursor(x, y, active = true) {
    this.cursor = { x, y, active };
  }

  /**
   * Render a frame
   * @param {HarmonicSpace} space - The harmonic space to render
   * @param {number} deltaTime - Time since last frame
   */
  render(space, deltaTime) {
    this.time += deltaTime;
    const ctx = this.ctx;

    // Clear with deep dark blue-black
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle noise overlay for texture
    ctx.globalAlpha = 0.3 + Math.sin(this.time * 0.2) * 0.05;
    ctx.drawImage(this.noiseCanvas, 0, 0, this.width, this.height);
    ctx.globalAlpha = 1;

    // Draw depth indicator - subtle radial gradient
    this.drawDepthField(space.depth);

    // Update and draw particles
    this.updateParticles(deltaTime);
    this.drawParticles();

    // Draw connections between active harmonics
    this.drawConnections(space);

    // Spawn particles for active harmonics
    const visible = space.getVisibleHarmonics();
    for (const h of visible) {
      if (h.amplitude > 0.2 && Math.random() < h.amplitude * 0.3) {
        this.spawnParticle(h);
      }
    }

    // Draw harmonics
    for (const h of visible) {
      this.drawHarmonic(h, space.depth);
    }

    // Draw cursor field
    if (this.cursor.active) {
      this.drawCursorField();
    }

    // Draw center (fundamental) indicator
    this.drawFundamental(space);
  }

  /**
   * Spawn a particle from an active harmonic
   */
  spawnParticle(harmonic) {
    if (this.particles.length >= this.maxParticles) return;

    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 30;

    this.particles.push({
      x: harmonic.x,
      y: harmonic.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.3 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
      color: harmonic.color
    });
  }

  /**
   * Update particle positions and life
   */
  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay * deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles
   */
  drawParticles() {
    const ctx = this.ctx;

    for (const p of this.particles) {
      const alpha = p.life * 0.6;
      ctx.fillStyle = `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l + 20}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw the depth field - a subtle indication of how "deep" we are
   */
  drawDepthField(depth) {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.max(this.width, this.height);

    // Radial gradient that shifts with depth
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * 0.8
    );

    // Deeper = more blue/purple, surface = warmer
    const depthHue = 220 + depth * 40;
    gradient.addColorStop(0, `hsla(${depthHue}, 30%, 8%, 0.3)`);
    gradient.addColorStop(0.5, `hsla(${depthHue + 20}, 25%, 5%, 0.2)`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw a single harmonic node
   */
  drawHarmonic(h, depth) {
    const ctx = this.ctx;

    // Visibility fade based on depth
    const visibilityAlpha = Math.min(1, (depth + 0.3 - h.visibilityDepth) * 3);
    if (visibilityAlpha <= 0) return;

    const { x, y, size, color, amplitude, glow, prime, isExotic } = h;

    // Base glow layer - always slightly visible
    const baseAlpha = 0.15 * visibilityAlpha;
    const activeAlpha = (0.3 + glow * 0.7) * visibilityAlpha;

    // Outer glow
    const glowSize = size * (1.5 + glow * 2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);

    gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${activeAlpha})`);
    gradient.addColorStop(0.4, `hsla(${color.h}, ${color.s - 10}%, ${color.l - 10}%, ${activeAlpha * 0.5})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Core
    const coreSize = size * (0.3 + amplitude * 0.3);
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);

    coreGradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l + 30}%, ${0.8 * visibilityAlpha})`);
    coreGradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.5 * visibilityAlpha})`);
    coreGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Exotic primes get a subtle ring
    if (isExotic && amplitude > 0.1) {
      ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${amplitude * 0.3 * visibilityAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Draw connections between active harmonics
   */
  drawConnections(space) {
    const ctx = this.ctx;
    const visible = space.getVisibleHarmonics();
    const active = visible.filter(h => h.amplitude > 0.1);

    if (active.length < 2) return;

    // Draw curved, organic lines between active pairs
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const h1 = active[i];
        const h2 = active[j];

        // Connection strength based on combined amplitude
        const strength = Math.min(h1.amplitude, h2.amplitude) * 0.4;
        if (strength < 0.05) continue;

        // Color blend between the two
        const avgHue = (h1.color.h + h2.color.h) / 2;

        // Calculate curved path - curves toward center with time-based movement
        const midX = (h1.x + h2.x) / 2;
        const midY = (h1.y + h2.y) / 2;
        const dx = h2.x - h1.x;
        const dy = h2.y - h1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Perpendicular offset for curve, with subtle animation
        const perpX = -dy / dist * 20 * Math.sin(this.time * 0.5 + i);
        const perpY = dx / dist * 20 * Math.sin(this.time * 0.5 + i);

        const ctrlX = midX + perpX;
        const ctrlY = midY + perpY;

        // Gradient along the line
        const gradient = ctx.createLinearGradient(h1.x, h1.y, h2.x, h2.y);
        gradient.addColorStop(0, `hsla(${h1.color.h}, ${h1.color.s}%, ${h1.color.l}%, ${strength})`);
        gradient.addColorStop(0.5, `hsla(${avgHue}, 40%, 60%, ${strength * 0.8})`);
        gradient.addColorStop(1, `hsla(${h2.color.h}, ${h2.color.s}%, ${h2.color.l}%, ${strength})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + strength * 3;

        ctx.beginPath();
        ctx.moveTo(h1.x, h1.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, h2.x, h2.y);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw the cursor's field of influence
   */
  drawCursorField() {
    const ctx = this.ctx;
    const { x, y } = this.cursor;
    const radius = 120;

    // Soft glow around cursor
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(180, 200, 255, 0.15)');
    gradient.addColorStop(0.3, 'rgba(160, 180, 235, 0.08)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Small cursor point
    ctx.fillStyle = 'rgba(200, 210, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw the fundamental indicator at center
   */
  drawFundamental(space) {
    const ctx = this.ctx;
    const x = space.center.x;
    const y = space.center.y;

    // Very subtle pulsing glow at center
    const pulse = 0.3 + Math.sin(this.time * 0.5) * 0.1;
    const radius = 40 + Math.sin(this.time * 0.3) * 5;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(200, 180, 160, ${pulse * 0.15})`);
    gradient.addColorStop(0.5, `rgba(180, 160, 140, ${pulse * 0.08})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

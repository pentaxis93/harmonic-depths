# Harmonic Depths

An explorer for prime harmonic territory — sounds that Western tuning systems cannot express.

## Download

Pre-built binaries are available for all major platforms:

**[→ Download Latest Release](https://github.com/pentaxis93/harmonic-depths/releases/latest)**

### Platform-Specific Instructions

**Linux**
- Download `.AppImage` (universal, works on any distribution)
  - Make executable: `chmod +x Harmonic-Depths-*.AppImage`
  - Run: `./Harmonic-Depths-*.AppImage`
- Or download `.deb` for Debian/Ubuntu: `sudo dpkg -i harmonic-depths_*.deb`

**macOS**
- Download `.dmg` file
- Open and drag to Applications folder
- **First launch**: Right-click app → "Open" → "Open" (required for unsigned apps)
- Subsequent launches work normally

**Windows**
- Download `Harmonic-Depths-Setup-*.exe` (installer)
- Or download `Harmonic-Depths-*.exe` (portable, no installation)
- **First launch**: Click "More info" → "Run anyway" on SmartScreen warning
- Subsequent launches work normally

> **Note**: v0.1.0 binaries are unsigned. Security warnings are expected and safe to bypass.
> Code signing will be added in future releases.

---

## What This Is

When any note sounds, it produces frequencies at integer multiples of its fundamental. The 2nd harmonic is an octave up. The 3rd introduces the perfect fifth. The 5th gives us the major third.

But the 7th harmonic? The 11th? The 13th? These are frequencies that don't exist on any piano. Western music uses 12 equal divisions of the octave, which can only approximate the first few prime harmonics. Everything above 5 is territory most Western ears have never explored.

This application lets you encounter these sounds — not as abstract frequencies, but as living, breathing textures you can move through and shape.

## Development Setup

To run from source or contribute:

```bash
npm install
npm start
```

## How to Explore

**Move** through the space. Luminous points represent prime harmonics of a constant fundamental tone. Proximity awakens them.

**Hold** (click or spacebar) to intensify. The harmonics near your cursor will sound more clearly.

**Scroll** to descend. At the surface, you encounter the familiar: octaves, fifths, thirds. Scroll down to reveal higher primes — the 7th, 11th, 13th and beyond. These are sounds increasingly alien to Western-trained ears.

**Arrow keys** shift the fundamental pitch up/down.

**F** toggles the frequency display.

**R** resets to default.

## What You're Hearing

The sounds are pure sine waves at exact mathematical ratios:

| Prime | Ratio | Character |
|-------|-------|-----------|
| 2 | 2/1 | Octave — the same note, higher |
| 3 | 3/2 | Perfect fifth — consonant, stable |
| 5 | 5/4 | Major third — sweet, warm |
| 7 | 7/4 | Septimal seventh — first alien sound |
| 11 | 11/8 | Undecimal — between fourth and tritone |
| 13 | 13/8 | Tridecimal — neutral, floating |
| 17+ | ... | Increasingly exotic territory |

The 7th harmonic (7/4 ratio, about 969 cents) lives in a space between the familiar minor seventh and major sixth. There is no piano key for it. The 11th harmonic (11/8, about 551 cents) falls almost exactly between the perfect fourth and tritone — a pitch that Western music cannot name.

These are not "wrong" notes. They are new dimensions of musical space.

## Building for Distribution

```bash
npm run build:linux   # Creates AppImage and .deb
npm run build:mac     # Creates .dmg and .zip
npm run build:win     # Creates installer and portable
```

## Technical Notes

See [docs/harmonics.md](docs/harmonics.md) for detailed information about the harmonic generation system.

---

*Created as an exploration of what lies beyond the 12 keys.*

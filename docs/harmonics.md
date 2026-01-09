# Harmonic Generation System

This document explains how Harmonic Depths generates its sounds and why they differ from standard musical instruments.

## The Physics of Harmonics

When a string vibrates, it doesn't just vibrate at one frequency. It vibrates at the fundamental frequency *f*, and simultaneously at 2*f*, 3*f*, 4*f*, and so on into infinity. These are called harmonics or overtones.

This is physics, not music theory. Every acoustic sound contains this harmonic series. What we perceive as "timbre" is largely the relative strengths of different harmonics.

## Why Primes Matter

The harmonic series contains every integer multiple of the fundamental:
- 1f (fundamental)
- 2f (octave)
- 3f (octave + fifth)
- 4f (two octaves)
- 5f (two octaves + major third)
- 6f (two octaves + fifth)
- 7f (two octaves + **septimal seventh**)
- ...

Composite harmonics (4, 6, 8, 9, 10...) are combinations of lower primes. The 6th harmonic, for instance, is the 3rd harmonic of the 2nd harmonic — a fifth above an octave.

But each **prime** harmonic introduces a genuinely new pitch relationship:
- **2**: The octave
- **3**: The perfect fifth
- **5**: The major third
- **7**: The septimal (or "blues") seventh
- **11**: The undecimal neutral (between fourth and tritone)
- **13**: The tridecimal (a kind of neutral sixth)
- ...and so on

## Western Tuning's Limitations

The 12-tone equal temperament (12-TET) system divides the octave into 12 equal semitones. Each semitone is a ratio of 2^(1/12) ≈ 1.0595.

This system can approximate:
- Prime 2: 2/1 → 1200 cents (exact)
- Prime 3: 3/2 → 702 cents (12-TET: 700 cents, off by 2 cents)
- Prime 5: 5/4 → 386 cents (12-TET: 400 cents, off by 14 cents)

But it cannot represent:
- Prime 7: 7/4 → 969 cents (no 12-TET equivalent)
- Prime 11: 11/8 → 551 cents (no 12-TET equivalent)
- Prime 13: 13/8 → 841 cents (no 12-TET equivalent)

The piano literally cannot play these notes. They fall between the keys.

## This Application's Approach

Harmonic Depths uses Web Audio API oscillators to generate **exact** frequencies:

```javascript
frequency = fundamental * primeRatio
```

Where `primeRatio` is the mathematical ratio, not an equal-tempered approximation.

For example, with a 110 Hz fundamental:
- 7th harmonic: 110 × 7/4 = 192.5 Hz (exact)
- 11th harmonic: 110 × 11/8 = 151.25 Hz (exact)

These are pure sine waves, allowing the harmonic relationships to be heard without the distraction of overtones.

## Folding Into Audible Range

The raw harmonic series extends to very high frequencies (the 7th harmonic of 440 Hz is 3080 Hz). To keep sounds in a comfortable, exploratory range, we "fold" higher primes into lower octaves:

```javascript
function getPrimeRatio(prime) {
  let ratio = prime;
  while (ratio >= 4) {
    ratio /= 2;
  }
  return ratio;  // Now between 1 and 4
}
```

This preserves the essential character of each prime while keeping it in a playable range.

## The Perceptual Experience

When you activate the 7th harmonic, you're hearing a pitch relationship that your brain (if Western-trained) has likely never been asked to parse. It's not "out of tune" — it's not trying to be anything in the 12-tone system. It exists in a different space entirely.

With sustained exploration, listeners often report:
1. Initial strangeness — "something is off"
2. Recognition — "this is a real interval, just unfamiliar"
3. New perception — "I didn't know sound could do this"

The goal is not to replace Western tuning, but to reveal how much territory it leaves unexplored.

## Further Reading

- Harry Partch: *Genesis of a Music* — Built instruments to access 43 tones per octave
- Ben Johnston: Extended just intonation notation and compositions
- La Monte Young: Long-duration explorations of prime relationships
- Wendy Carlos: Experimented with alternative tuning systems
- Kyle Gann: Extensive writings on microtonal music

## Frequency Table

For reference, here are the first several prime harmonics with their exact ratios and cent values:

| Prime | Ratio | Cents | Nearest 12-TET | Difference |
|-------|-------|-------|----------------|------------|
| 2 | 2/1 | 1200 | P8 (1200¢) | 0¢ |
| 3 | 3/2 | 702 | P5 (700¢) | +2¢ |
| 5 | 5/4 | 386 | M3 (400¢) | -14¢ |
| 7 | 7/4 | 969 | m7 (1000¢) | -31¢ |
| 11 | 11/8 | 551 | TT (600¢) | -49¢ |
| 13 | 13/8 | 841 | m6 (800¢) | +41¢ |
| 17 | 17/16 | 105 | m2 (100¢) | +5¢ |
| 19 | 19/16 | 298 | m3 (300¢) | -2¢ |
| 23 | 23/16 | 628 | TT (600¢) | +28¢ |
| 29 | 29/16 | 1030 | m7 (1000¢) | +30¢ |
| 31 | 31/16 | 1145 | M7 (1100¢) | +45¢ |

Note: Ratios above 2 are folded down by dividing by 2 until they fit in the [1,2] range for practical use.

---

*The harmonic series is infinite. So is the territory to explore.*

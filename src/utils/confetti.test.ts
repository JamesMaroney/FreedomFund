import { describe, it, expect, vi, afterEach } from 'vitest';
import { CONFETTI_COLORS, generateParticles } from './confetti';

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── CONFETTI_COLORS ──────────────────────────────────────────────────────────

describe('CONFETTI_COLORS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CONFETTI_COLORS)).toBe(true);
    expect(CONFETTI_COLORS.length).toBeGreaterThan(0);
  });

  it('contains only hex color strings', () => {
    for (const color of CONFETTI_COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    }
  });
});

// ─── generateParticles ────────────────────────────────────────────────────────

describe('generateParticles', () => {
  it('returns an array of the requested length', () => {
    expect(generateParticles(10).length).toBe(10);
    expect(generateParticles(50).length).toBe(50);
    expect(generateParticles(0).length).toBe(0);
  });

  it('assigns sequential ids starting at 0', () => {
    const particles = generateParticles(5);
    particles.forEach((p, i) => expect(p.id).toBe(i));
  });

  it('assigns x within the expected range (±210)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // (0 - 0.5) * 420 = -210
    let p = generateParticles(1)[0];
    expect(p.x).toBe(-210);

    vi.spyOn(Math, 'random').mockReturnValue(1); // (1 - 0.5) * 420 = 210
    p = generateParticles(1)[0];
    expect(p.x).toBe(210);
  });

  it('assigns y within the expected range (−50 to −400)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // -(0*350 + 50) = -50
    let p = generateParticles(1)[0];
    expect(p.y).toBe(-50);

    vi.spyOn(Math, 'random').mockReturnValue(1); // -(1*350 + 50) = -400
    p = generateParticles(1)[0];
    expect(p.y).toBe(-400);
  });

  it('assigns size within the expected range (6–14px)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // floor(0*9)+6 = 6
    let p = generateParticles(1)[0];
    expect(p.size).toBe(6);

    vi.spyOn(Math, 'random').mockReturnValue(0.999); // floor(0.999*9)+6 = 8+6 = 14
    p = generateParticles(1)[0];
    expect(p.size).toBe(14);
  });

  it('assigns shape "circle" when random ≤ 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    const p = generateParticles(1)[0];
    expect(p.shape).toBe('circle');
  });

  it('assigns shape "square" when random > 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const p = generateParticles(1)[0];
    expect(p.shape).toBe('square');
  });

  it('assigns duration within the expected range (0.8–1.2s)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // 0.8 + 0*0.4 = 0.8
    let p = generateParticles(1)[0];
    expect(p.duration).toBeCloseTo(0.8);

    vi.spyOn(Math, 'random').mockReturnValue(1); // 0.8 + 1*0.4 = 1.2
    p = generateParticles(1)[0];
    expect(p.duration).toBeCloseTo(1.2);
  });

  it('picks a color from CONFETTI_COLORS', () => {
    const particles = generateParticles(20);
    for (const p of particles) {
      expect(CONFETTI_COLORS).toContain(p.color);
    }
  });

  it('each particle has all required fields', () => {
    const [p] = generateParticles(1);
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('x');
    expect(p).toHaveProperty('y');
    expect(p).toHaveProperty('rotate');
    expect(p).toHaveProperty('color');
    expect(p).toHaveProperty('size');
    expect(p).toHaveProperty('shape');
    expect(p).toHaveProperty('duration');
  });
});

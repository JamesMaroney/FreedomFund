export const CONFETTI_COLORS = ['#f5c842', '#00d68f', '#ff6b35', '#ffffff', '#a78bfa'];

export interface Particle {
  id: number;
  x: number;      // final x offset
  y: number;      // final y offset
  rotate: number; // final rotation in degrees
  color: string;
  size: number;   // px
  shape: 'square' | 'circle';
  duration: number; // animation duration in seconds
}

export function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 420,
    y: -(Math.random() * 350 + 50),
    rotate: (Math.random() - 0.5) * 1440,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.floor(Math.random() * 9) + 6, // 6–14px
    shape: Math.random() > 0.5 ? 'square' : 'circle',
    duration: 0.8 + Math.random() * 0.4, // 0.8–1.2s
  }));
}

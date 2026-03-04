/** True when running as an installed PWA (standalone/fullscreen display mode) */
export const isPWA = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

/** True on a touch-capable mobile device */
export const isMobile = (): boolean =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1

/** True when the Vibration API is available (mobile browsers) */
export const canVibrate = (): boolean => 'vibrate' in navigator

/** True when we can safely create an AudioContext */
export const canPlayAudio = (): boolean => {
  try {
    return typeof AudioContext !== 'undefined' || typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined'
  } catch {
    return false
  }
}

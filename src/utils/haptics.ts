import { canVibrate } from './env'

export const celebrationVibration = (): void => {
  if (!canVibrate()) return
  navigator.vibrate([50, 30, 50, 30, 200])
}

export const milestoneVibration = (): void => {
  if (!canVibrate()) return
  navigator.vibrate([100, 50, 100, 50, 100, 50, 300])
}

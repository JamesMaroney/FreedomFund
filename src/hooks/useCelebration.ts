import { useCallback } from 'react';
import { playCoinSound, playTadaSound, playSpringSound } from '../utils/audio';
import { celebrationVibration, milestoneVibration } from '../utils/haptics';
import type { AudioClip } from '../types';

const CONCRETE_CLIPS: AudioClip[] = ['coins', 'tada', 'spring']

const CLIP_FN: Record<string, () => Promise<void>> = {
  coins:  playCoinSound,
  tada:   playTadaSound,
  spring: playSpringSound,
}

function resolveClip(audioClip: AudioClip): () => Promise<void> {
  if (audioClip === 'random') {
    const pick = CONCRETE_CLIPS[Math.floor(Math.random() * CONCRETE_CLIPS.length)]
    return CLIP_FN[pick]
  }
  return CLIP_FN[audioClip]
}

interface UseCelebrationOptions {
  isMilestone?: boolean;
}

export function useCelebration(audioClip: AudioClip = 'coins') {
  const trigger = useCallback(({ isMilestone = false }: UseCelebrationOptions = {}) => {
    // Milestones always play ta-da regardless of setting; regular uses selected clip
    void (isMilestone ? playTadaSound() : resolveClip(audioClip)())
    if (isMilestone) {
      milestoneVibration()
    } else {
      celebrationVibration()
    }
  }, [audioClip])

  return { trigger }
}

import { animate, stagger } from 'animejs'

/**
 * Mobile-OS style fluid physics curves:
 * Apple iOS uses a swift deceleration curve with high initial velocity and soft settle.
 */
export const EASINGS = {
  smoothDecel: 'outExpo',
  springSettle: 'outBack(1.2)',
  softBounce: 'outElastic(1, 0.7)',
  quickTouch: 'outQuad',
}

/**
 * Smooth content morph: keeps the outer card frame stable while the internal
 * question content smoothly morphs and cross-glides into place.
 */
export function morphContentGlide(
  target: HTMLElement | null,
  direction: 'forward' | 'backward' | 'initial' = 'initial'
) {
  if (!target) return

  const initialX = direction === 'forward' ? 24 : direction === 'backward' ? -24 : 0

  return animate(target, {
    x: [initialX, 0],
    opacity: [0.15, 1],
    duration: 340,
    ease: 'outExpo',
  })
}

/**
 * Spring pop morph for badges, question numbers, and chips.
 */
export function popMorph(target: HTMLElement | null) {
  if (!target) return

  return animate(target, {
    scale: [0.85, 1.08, 1],
    opacity: [0.3, 1],
    duration: 320,
    ease: 'outBack(1.4)',
  })
}

/**
 * Direction-aware question card glide transition.
 * Simulates card swiping/gliding in modern mobile operating systems.
 */
export function glideQuestionCard(
  target: HTMLElement | null,
  direction: 'forward' | 'backward' | 'initial' = 'initial'
) {
  if (!target) return

  const initialX = direction === 'forward' ? 36 : direction === 'backward' ? -36 : 0
  const initialY = direction === 'initial' ? 24 : 0

  return animate(target, {
    x: [initialX, 0],
    y: [initialY, 0],
    opacity: [0.1, 1],
    scale: [0.985, 1],
    duration: 420,
    ease: 'outExpo',
  })
}

/**
 * Staggered cascade for list items or multiple-choice option cards.
 * Gives each option a fluid progressive entrance without any layout jank.
 */
export function staggerOptionsCascade(targets: HTMLElement[] | NodeListOf<HTMLElement> | string) {
  return animate(targets, {
    y: [16, 0],
    opacity: [0, 1],
    scale: [0.99, 1],
    delay: stagger(40, { start: 60 }),
    duration: 380,
    ease: 'outExpo',
  })
}

/**
 * Tactile spring response when a user selects an option or clicks a primary action.
 */
export function tactileTap(target: HTMLElement | null) {
  if (!target) return

  return animate(target, {
    scale: [1, 0.965, 1.02, 1],
    duration: 260,
    ease: 'outQuad',
  })
}

/**
 * Subtle pulse and scale when a question navigator pill becomes active or answered.
 */
export function pulsePill(target: HTMLElement | null) {
  if (!target) return

  return animate(target, {
    scale: [0.88, 1.1, 1],
    duration: 340,
    ease: 'outBack(1.5)',
  })
}

/**
 * Fluid screen bloom transition when changing between views (e.g. Prompt -> Quiz -> Feedback).
 */
export function glideScreenIn(target: HTMLElement | null) {
  if (!target) return

  return animate(target, {
    y: [28, 0],
    opacity: [0, 1],
    scale: [0.985, 1],
    duration: 440,
    ease: 'outExpo',
  })
}

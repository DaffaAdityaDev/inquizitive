/** Shared enter/exit animation for the top-level quiz views. */
export const viewTransition = {
  initial: { opacity: 0, y: 20, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.985 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
}

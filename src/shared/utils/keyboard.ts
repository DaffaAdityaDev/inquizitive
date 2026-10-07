/** True while an IME (CJK, some Android keyboards) is composing; its Enter commits text, not a form. */
export function isImeComposing(e: { nativeEvent: KeyboardEvent; keyCode: number }): boolean {
  return e.nativeEvent.isComposing || e.keyCode === 229
}

type IdentifiableEvent = Partial<PointerEvent> & Partial<TouchEvent>

export function idOf(event: IdentifiableEvent): number | null {
  if (event.pointerId != null) {
    return event.pointerId
  } else if (event.touches != null && event.touches.length > 0) {
    return event.touches[0].identifier
  } else {
    return null
  }
}

import TouchPointerEventsManager from "./TouchPointerEventsManager.js"
import { dispatchModifiedEvent } from "./FakeTouchEvent.js"

class AppTouchPointerEventsManager extends TouchPointerEventsManager {
  selector: HTMLElement | string
  scrollStart: number | null

  constructor(selector: HTMLElement | string) {
    super(selector)
    this.selector = selector
    this.scrollStart = null
  }

  static init(element: HTMLElement | string) {
    return new AppTouchPointerEventsManager(element)
  }

  contextMenuCanceler(e: Event) {
    e.preventDefault()
    e.stopPropagation()
  }

  onStartMultiTouch(event: PointerEvent) {
    dispatchModifiedEvent(event, "pointerup")
  }

  handleTouchMove(event: PointerEvent) {
    this.updateActiveTouch(event)

    switch (this.touchIds.length) {
      case 2:
      case 3:
      case 4:
        if (this.gesturesEnabled()) {
          this.handleMultiFingerScroll()
        }
        break
      default:
    }
  }

  handleTouchEnd(event: PointerEvent) {
    this.cleanUpTouch(event)
    this.scrollStart = null
    document.removeEventListener("contextmenu", this.contextMenuCanceler, true)
  }

  handleMultiFingerScroll() {
    document.addEventListener("contextmenu", this.contextMenuCanceler, true)
    const touchIds = this.touchIds
    const firstTouch = this.touches[touchIds[0]]

    const scrollable = this.findFirstScrollableParent(firstTouch.target as HTMLElement | null)
    if (scrollable) {
      if (!this.scrollStart) {
        this.scrollStart = scrollable.scrollTop
      }
      scrollable.scrollTop = this.scrollStart + firstTouch.start.y - firstTouch.current.y
    }
  }

  findFirstScrollableParent(element: HTMLElement | null): HTMLElement | null {
    let found: HTMLElement | null = null
    while (!found && element?.closest(this.selector as string)) {
      if (element.scrollHeight > element.clientHeight + 50) {
        found = element
      }
      element = element.parentElement
    }
    return found
  }

}

export default AppTouchPointerEventsManager

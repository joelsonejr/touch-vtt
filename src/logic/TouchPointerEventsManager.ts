import { MODULE_DISPLAY_NAME } from "../config/ModuleConstants.js"
import { getSetting, DEBUG_MODE_SETTING } from "../config/TouchSettings.js"
import TrackedTouch from "./Touch.js"

class TouchPointerEventsManager {
  touches: Record<string, TrackedTouch>
  _gesturesEnabled: boolean

  constructor(element: HTMLElement | string) {
    this.touches = {}
    const touchHandler = this.handleTouch.bind(this)
    for (const eventType of this.getListenerEvents()) {
      if (element instanceof HTMLElement) {
        element.addEventListener(eventType, touchHandler, this.getEventListenerOptions())
      } else {
        document.addEventListener(eventType, (event) => {
          if ((event.target as HTMLElement)?.closest?.(element)) {
            touchHandler(event)
          }
        }, this.getEventListenerOptions())
      }
    }

    this._gesturesEnabled = true
  }

  static init(element: HTMLElement | string) {
    return new TouchPointerEventsManager(element)
  }

  preHandleAll(event: Event) {}

  preHandleTouch(event: Event) {}

  handleTouch(event: Event) {
    const preLength = this.touchIds.length

    this.preHandleAll(event)

    if (!this.isTouchPointerEvent(event)) {
      return
    }

    this.preHandleTouch(event)

    if (this.shouldHandleEvent(event)) {
      // shouldHandleEvent excludes our fake events at this time
      switch (event.type) {
        case "pointerdown":
          this.handleTouchStart(event as PointerEvent)
          break

        case "pointermove":
          this.handleTouchMove(event as PointerEvent)
          break

        case "pointerup":
          this.handleTouchEnd(event as PointerEvent)
          //this.handleEndAll(event)
          break

        case "pointercancel":
          this.handleEndAll(event as PointerEvent)
          break

        default:
          console.warn(`Unknown touch event type ${event.type}`)
          break
      }
    }
    if (preLength != this.touchIds.length && getSetting(DEBUG_MODE_SETTING)) {
      console.log(MODULE_DISPLAY_NAME + ": touches changed: " + preLength + " -> " + this.touchIds.length)
    }
  }

  onStartMultiTouch(event: PointerEvent) {

  }

  onTouchAdded(event: PointerEvent) {

  }

  onTouchRemoved(event?: PointerEvent) {

  }

  handleTouchStart(event: PointerEvent) {
    const prevTouches = this.touchIds.length
    this.updateActiveTouch(event)
    if (prevTouches <= 1 && this.touchIds.length > 1) {
      this.onStartMultiTouch(event)
    }
  }

  handleTouchEnd(event: PointerEvent) {
    this.cleanUpTouch(event)
  }

  handleEndAll(event: PointerEvent) {
    this.cleanUpAll(event)
  }

  handleTouchMove(event: PointerEvent) {
    this.updateActiveTouch(event)
  }

  updateActiveTouch(event: PointerEvent) {
    const id = event.pointerId
    if (this.touches[id] != null) {
      this.touches[id].update(event, event)
    } else {
      if (event.type == "pointerdown" && event.buttons == 1 && event.pointerType != "pen") {
        this.touches[id] = new TrackedTouch(event, event)
        this.onTouchAdded(event)
      }
    }
  }

  cleanUpAll(event?: PointerEvent) {
    this.touches = {}
    this.onTouchRemoved(event)
  }

  cleanUpTouch(event: PointerEvent) {
    delete this.touches[event.pointerId]
    this.onTouchRemoved(event)
  }

  getEventListenerOptions(): AddEventListenerOptions {
    return {
      capture: true,
      passive: false,
    }
  }

  getListenerEvents(): string[] {
    return ["pointerdown", "pointermove", "pointerup", "pointercancel"]
  }

  shouldHandleEvent(event: Event): boolean {
    return event.isTrusted || !!event.touchvttTrusted
  }

  isTouchPointerEvent(event: Event): boolean {
    return event instanceof PointerEvent && ["touch", "pen"].includes(event.pointerType)
  }

  get touchIds(): string[] {
    return Object.keys(this.touches)
  }

  disableGestures() {
    this._gesturesEnabled = false
  }

  enableGestures() {
    this._gesturesEnabled = true
  }

  gesturesEnabled(): boolean {
    return this._gesturesEnabled
  }
}

export default TouchPointerEventsManager

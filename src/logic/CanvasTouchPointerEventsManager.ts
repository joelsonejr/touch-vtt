import { MODULE_DISPLAY_NAME } from "../config/ModuleConstants.js"
import { dispatchCopy, dispatchModifiedEvent } from "./FakeTouchEvent.js"
import Vectors, { type Point } from "./Vectors.js"
import FoundryCanvas from "../foundryvtt/FoundryCanvas.js"
import Screen from "../browser/Screen.js"
import { getSetting, DEBUG_MODE_SETTING, ZOOM_THRESHOLD_SETTING, PAN_THRESHOLD_SETTING, GESTURE_MODE_SETTING, GESTURE_MODE_SPLIT, GESTURE_MODE_OFF } from "../config/TouchSettings.js"
import TouchPointerEventsManager from "./TouchPointerEventsManager.js"

// This class is similar in structure to the original CanvasTouchToMouseAdapter, but it doesn't capture/prevent events
// It only hooks into the PointerEvents and tracks them for specific fixes (by dispatching additional events) and multi-touch management

const GESTURE_STATUSES = { NONE: 0, WAITING: 1, ACTIVE: 2 } as const

interface ZoomGestureState {
  status: number
  initiatingCoords: [Point, Point] | null
  initiatingWorldCoords: [Point, Point] | null
  activationCoords: [Point, Point] | null
  activationWorldCoords: [Point, Point] | null
}

interface PanGestureState {
  status: number
  initiatingCoords: Point | null
  activationCoords: Point | null
}

class CanvasTouchPointerEventsManager extends TouchPointerEventsManager {
  _forcedZoomThreshold: number | null
  _forcedPanThreshold: number | null
  GESTURE_STATUSES = GESTURE_STATUSES
  _zoomGesture: ZoomGestureState
  _panGesture: PanGestureState

  constructor(element: HTMLElement) {
    super(element)

    this._forcedZoomThreshold = null
    this._forcedPanThreshold = null

    this._zoomGesture = {
      status: this.GESTURE_STATUSES.NONE,
      initiatingCoords: null,
      initiatingWorldCoords: null,
      activationCoords: null,
      activationWorldCoords: null
    }
    this._panGesture = {
      status: this.GESTURE_STATUSES.NONE,
      initiatingCoords: null,
      activationCoords: null
    }

    // Fix for some trackpads sending pointerdown of type mouse without any previous move event
    const trackPadPointerUp = (evt: Event) => {
      evt.preventDefault()
      evt.stopPropagation()
      evt.stopImmediatePropagation()
      document.body.removeEventListener("pointerup", trackPadPointerUp)
      dispatchModifiedEvent(evt as PointerEvent, "pointerup")
      return false
    }
    document.body.addEventListener("pointerdown", evt => {
      const pevt = evt as PointerEvent
      if (pevt.isTrusted && !pevt.pressure && pevt.target === element) {
        pevt.preventDefault()
        pevt.stopPropagation()
        pevt.stopImmediatePropagation()
        dispatchModifiedEvent(pevt, "pointermove")
        dispatchModifiedEvent(pevt, "pointerdown")
        document.body.addEventListener("pointerup", trackPadPointerUp)
        return false
      }
    }, {
      capture: true,
      passive: false,
    })

    // New v11 fix (started in v2.2.3): we completely block these events as soon as possible.
    // We dispatch a pointermove to the location first (not for pointerup), then we dispatch a clone of the original. Except touchstart, that one is gone.
    // Chosen to also include v12 on 2025-03-26 to support Image Hover and similar.
    if (true || game.release!.generation < 12) {
      Array("pointerdown", "pointermove", "pointerup", "pointerleave", "touchstart").forEach(e => {
        window.addEventListener(e, evt => {
          const pevt = evt as PointerEvent
          if (pevt.isTrusted && (pevt instanceof TouchEvent || ["touch", "pen"].includes(pevt.pointerType)) && pevt.target === element) {
            pevt.preventDefault()
            pevt.stopPropagation()
            pevt.stopImmediatePropagation()

            if (["pointerdown", "pointermove"].includes(pevt.type)) {
              dispatchModifiedEvent(pevt, "pointermove", { button: -1, buttons: 0 })
            }

            if (pevt.type !== "touchstart" && !(pevt.type == "pointerleave" && pevt.pointerType != "pen")) {
              dispatchCopy(pevt)
            }
            return false
          }
        }, {
          capture: true,
          passive: false,
        })
      })

      // Force hover check on every placeable in the active layer on every pointerdown/pointerup
      // Also pointermove, but only our own
      Array("pointerdown", "pointerup", "pointermove").forEach(e => {
        const mouseInteractionManager = (foundry.canvas as any)?.interaction?.MouseInteractionManager ?? MouseInteractionManager
        document.body.addEventListener(e, (evt) => {
          const pevt = evt as PointerEvent
          if (pevt.touchvttTrusted || pevt.type !== "pointermove" && (pevt.isTrusted && (pevt instanceof TouchEvent || ["touch", "pen"].includes(pevt.pointerType)) && pevt.target === element)) {
            const mousePos = canvas!.mousePosition
            // We do all the hoverOuts first
            ;(canvas!.activeLayer as any).placeables.forEach((p: any) => {
              if (!p.bounds.contains(mousePos.x, mousePos.y)) {
                if (p.hover && p.mouseInteractionManager.state < mouseInteractionManager.INTERACTION_STATES.DRAG) {
                  p._onHoverOut(new PIXI.FederatedPointerEvent(null as any))
                }
              }
            })
            ;(canvas!.activeLayer as any).placeables.forEach((p: any) => {
              if (p.bounds.contains(mousePos.x, mousePos.y)) {
                if (!p.hover) {
                  p._onHoverIn(new PIXI.FederatedPointerEvent(null as any))
                }
              }
            })
          }
        }, true)
      })

    }
  }

  static init(element: HTMLElement) {
    return new CanvasTouchPointerEventsManager(element)
  }

  onTouchAdded(event: PointerEvent) {
    if (this.touchIds.length > 1) {
      // This is to cancel any drag-style action (usually a selection rectangle) when we start having multiple touches
      const cancelEvent = new MouseEvent("contextmenu", { clientX: 0, clientY: 0, bubbles: true, cancelable: true, view: window, button: 2 })
      event.target!.dispatchEvent(cancelEvent)
      ;(canvas!.mouseInteractionManager as any).callback("clearTimeouts")
    }
  }

  onTouchRemoved(event?: PointerEvent) {
    if (this.touchIds.length > 0) {
      this.disableGestures()
      if (getSetting(DEBUG_MODE_SETTING)) {
        console.log(MODULE_DISPLAY_NAME + ": disabled gestures")
      }
    } else {
      this.enableGestures()
      if (getSetting(DEBUG_MODE_SETTING)) {
        console.log(MODULE_DISPLAY_NAME + ": enabled gestures")
      }
    }
    ;(canvas!.mouseInteractionManager as any).callback("clearTimeouts")

    this._zoomGesture = {
      status: this.GESTURE_STATUSES.NONE,
      initiatingCoords: null,
      initiatingWorldCoords: null,
      activationCoords: null,
      activationWorldCoords: null
    }
    this._panGesture = {
      status: this.GESTURE_STATUSES.NONE,
      initiatingCoords: null,
      activationCoords: null
    }
  }

  handleTouchMove(event: PointerEvent) {
    this.updateActiveTouch(event)

    switch (this.touchIds.length) {
      case 2:
        if (this.gesturesEnabled()) {
          if (this.useSplitGestures()) {
            this.handleTwoFingerZoom()
          } else {
            this.handleTwoFingerZoomAndPan()
          }
        }
        break

      case 3:
      case 4:
        if (this.gesturesEnabled()) {
          this.handleMultiFingerPan()
        }
        break

      default:
    }
  }

  handleTwoFingerZoomAndPan() {
    this.handleTwoFingerZoom()
    this.handleMultiFingerPan()
  }

  handleTwoFingerZoom() {
    if (!FoundryCanvas.isZoomAllowed()) {
      return
    }

    const touchIds = this.touchIds
    const firstTouch = this.touches[touchIds[0]]
    const secondTouch = this.touches[touchIds[1]]

    if (this._zoomGesture.status == this.GESTURE_STATUSES.NONE) {
      this._zoomGesture.initiatingCoords = [{ ...firstTouch.current }, { ...secondTouch.current }]
      this._zoomGesture.initiatingWorldCoords = [FoundryCanvas.screenToWorld({ ...firstTouch.current }), FoundryCanvas.screenToWorld({ ...secondTouch.current })]
      this._zoomGesture.status = this.GESTURE_STATUSES.WAITING
    }
    const initiatingDistance = Vectors.distance(this._zoomGesture.initiatingCoords![0], this._zoomGesture.initiatingCoords![1])
    const currentDistance = Vectors.distance(firstTouch.current, secondTouch.current)

    if (this._zoomGesture.status < this.GESTURE_STATUSES.ACTIVE) {
      if (Math.abs(currentDistance - initiatingDistance) > this.zoomThresholdFunction(this.getZoomThreshold())) {
        this._zoomGesture.activationCoords = [{ ...firstTouch.current }, { ...secondTouch.current }]
        this._zoomGesture.activationWorldCoords = [FoundryCanvas.screenToWorld({ ...firstTouch.current }), FoundryCanvas.screenToWorld({ ...secondTouch.current })]
        this._zoomGesture.status = this.GESTURE_STATUSES.ACTIVE
      }
    }

    if (this._zoomGesture.status == this.GESTURE_STATUSES.ACTIVE) {
      FoundryCanvas.zoomTo(this.calcZoom())
    }

  }

  calcZoom(): number {
    const touchIds = this.touchIds
    const initiatingWorldDistance = Vectors.distance(this._zoomGesture.initiatingWorldCoords![0], this._zoomGesture.initiatingWorldCoords![1])
    const activationWorldDistance = Vectors.distance(this._zoomGesture.activationWorldCoords![0], this._zoomGesture.activationWorldCoords![1])
    const newScreenDistance = Vectors.distance(this.touches[touchIds[0]].current, this.touches[touchIds[1]].current)
    const newScale = newScreenDistance / ((initiatingWorldDistance + activationWorldDistance) / 2)
    return newScale
  }

  zoomThresholdFunction(threshold: number): number {
    if (threshold == 0) return Infinity
    if (threshold > 80) {
      return -threshold / 2 + 50
    } else if (threshold > 30) {
      return -threshold + 90
    } else {
      return -10 * threshold + 360
    }
  }

  setForcedZoomThreshold(threshold: number) {
    this._forcedZoomThreshold = threshold
  }

  unsetForcedZoomThreshold() {
    this._forcedZoomThreshold = null
  }

  getZoomThreshold(): number {
    if (this._forcedZoomThreshold !== null) {
      return this._forcedZoomThreshold
    }
    return getSetting(ZOOM_THRESHOLD_SETTING) as number
  }

  setForcedPanThreshold(threshold: number) {
    this._forcedPanThreshold = threshold
  }

  unsetForcedPanThreshold() {
    this._forcedPanThreshold = null
  }

  getPanThreshold(): number {
    if (this._forcedPanThreshold !== null) {
      return this._forcedPanThreshold
    }
    return getSetting(PAN_THRESHOLD_SETTING) as number
  }

  calcPanCorrection(transform: any, touch: { current: Point, world?: Point }): Point {
    const touchedPointOnWorldAfter = transform.applyInverse(touch.current)
    return Vectors.subtract(touchedPointOnWorldAfter, touch.world!)
  }

  handleMultiFingerPan() {
    if (!FoundryCanvas.isPanAllowed()) {
      return
    }

    const touchIds = this.touchIds
    const adjustedTransform = FoundryCanvas.worldTransform

    const firstTouch = this.touches[touchIds[0]]
    if (this._panGesture.status == this.GESTURE_STATUSES.NONE) {
      this._panGesture.initiatingCoords = { ...firstTouch.current }
      this._panGesture.status = this.GESTURE_STATUSES.WAITING
    }
    const currentDistance = Vectors.distance(firstTouch.current, this._panGesture.initiatingCoords!)
    if (this._panGesture.status < this.GESTURE_STATUSES.ACTIVE) {
      if (currentDistance > this.panThresholdFunction(this.getPanThreshold())) {
        this._panGesture.status = this.GESTURE_STATUSES.ACTIVE
      }
    }

    if (this._panGesture.status == this.GESTURE_STATUSES.ACTIVE) {
      // It seems to me that panning to the center between the touches is disorienting and creates unwanted movement
      // I prefer trying out this version where we anchor to the first touch, I'll leave the existing above in case we want to revert
      let panCorrection = this.calcPanCorrection(adjustedTransform, this.touches[touchIds[0]])

      const centerBefore = FoundryCanvas.screenToWorld(Screen.center)
      const worldCenter = Vectors.subtract(centerBefore, panCorrection)

      FoundryCanvas.pan({ x: worldCenter.x, y: worldCenter.y })
    }
  }

  panThresholdFunction(threshold: number): number {
    if (threshold == 0) return Infinity
    if (threshold > 50) {
      return -4 / 5 * threshold + 80
    } else if (threshold > 20) {
      return -2 * threshold + 140
    } else {
      return -10 * threshold + 300
    }
  }

  useSplitGestures(): boolean {
    return getSetting(GESTURE_MODE_SETTING) === GESTURE_MODE_SPLIT
  }

  useNoGestures(): boolean {
    return getSetting(GESTURE_MODE_SETTING) === GESTURE_MODE_OFF
  }

  isTouchPointerEvent(event: Event): boolean {
    return super.isTouchPointerEvent(event) || !!event.touchvttTrusted
  }

  gesturesEnabled(): boolean {
    return this._gesturesEnabled && !this.useNoGestures()
  }

}

export default CanvasTouchPointerEventsManager

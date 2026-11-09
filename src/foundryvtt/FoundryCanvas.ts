import ObjectUtils from "../utils/ObjectUtils.js"
import FoundryUser from "./FoundryUser.js"
import FoundryModules from "./FoundryModules.js"
import type { Point } from "../logic/Vectors.js"

const LOCK_VIEW_KEY = "LockView"

class FoundryCanvas {
  get raw() {
    return canvas as NonNullable<typeof canvas>
  }

  get zoom(): number {
    return this.raw.stage!.scale.x
  }

  pan({ x, y, zoom = this.raw.stage!.scale.x }: { x: number, y: number, zoom?: number }) {
    this.raw.pan({ x, y, scale: zoom })
  }

  zoomTo(scale: number) {
    this.raw.pan({ scale })
  }

  get worldTransform() {
    return this.raw.stage!.transform.worldTransform
  }

  screenToWorld({ x, y }: Point): Point {
    return this.worldTransform.applyInverse({ x, y })
  }

  worldToScreen({ x, y }: Point): Point {
    return this.worldTransform.apply({ x, y })
  }

  worldToScreenLength(length: number): number {
    return this.worldTransform.apply({ x: length, y: 0 }).x - this.worldTransform.apply({ x: 0, y: 0 }).x
  }

  getWorldTransformWith({ zoom }: { zoom: number }, { discrete = true } = {}) {
    const copy: any = ObjectUtils.cloneObject(this.worldTransform)
    if (discrete) {
      zoom = Math.round(zoom * 100) / 100  //< PIXI rounds zoom values to 2 decimals for some reason
    }

    // No rotation => we can just assign the zoom level to the matrix' diagonal
    copy.a = copy.d = zoom
    return copy
  }

  get gridSize(): number {
    return this.raw.grid!.size
  }

  toRelativeCoordinates({ x, y }: Point): Point {
    const size = this.worldSize
    return {
      x: x / size.x,
      y: y / size.y
    }
  }

  get worldSize(): Point {
    const scene: any = this.raw.scene
    return {
      x: scene.data.width,
      y: scene.data.height,
    }
  }

  get worldCenter(): Point {
    const size = this.worldSize
    return {
      x: size.x / 2,
      y: size.y / 2,
    }
  }

  isZoomAllowed(): boolean {
    if (FoundryUser.isGm) {
      return true
    }
    if (!FoundryModules.isActive(LOCK_VIEW_KEY)) {
      return true
    }
    return !(this.raw.scene!.getFlag as any)(LOCK_VIEW_KEY, "lockZoom")
  }

  isPanAllowed(): boolean {
    if (FoundryUser.isGm) {
      return true
    }
    if (!FoundryModules.isActive(LOCK_VIEW_KEY)) {
      return true
    }
    return !(this.raw.scene!.getFlag as any)(LOCK_VIEW_KEY, "lockPan")
  }

  get ruler() {
    const layer = this.raw && this.raw.controls
    return layer && (layer as any).ruler
  }
}

export default new FoundryCanvas()

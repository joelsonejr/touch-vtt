import type { Point } from "../logic/Vectors.js"

class Screen {
  get center(): Point {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    }
  }

  get size(): Point {
    return {
      x: window.innerWidth,
      y: window.innerHeight
    }
  }

  toRelativeCoordinates({ x, y }: Point): Point {
    const size = this.size
    return {
      x: x / size.x,
      y: y / size.y
    }
  }
}

export default new Screen()

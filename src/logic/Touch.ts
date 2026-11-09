import FoundryCanvas from "../foundryvtt/FoundryCanvas.js"
import TouchContext, { TouchContext as TouchContextClass } from "./TouchContext.js"
import Vectors, { type Point } from "./Vectors.js"
import { idOf } from "../utils/EventUtils.js"

interface TouchLike {
  clientX: number
  clientY: number
  screenX: number
  screenY: number
}

class TrackedTouch {
  id: number | null
  start: Readonly<Point>
  last: Readonly<Point>
  current: Readonly<Point>
  context: TouchContextClass
  clientX: number
  clientY: number
  screenX: number
  screenY: number
  target: EventTarget | null
  latestEvent: Event
  world?: Point
  movementDistance: number
  movement: Point

  constructor(event: Event & { target: EventTarget | null }, touch: TouchLike, { context = TouchContext.PRIMARY_CLICK }: { context?: TouchContextClass } = {}) {
    this.id = idOf(event as any)
    this.start = Object.freeze({ x: touch.clientX, y: touch.clientY })
    this.last = this.start
    this.current = this.last
    this.context = context
    this.clientX = touch.clientX
    this.clientY = touch.clientY
    this.screenX = touch.screenX
    this.screenY = touch.screenY
    this.target = event.target
    this.latestEvent = event

    if (canvas?.app) {
      this.world = FoundryCanvas.screenToWorld(this.current)  //< Position in the world where the user touched
    }
    this.movementDistance = 0
    this.movement = Vectors.zero

    // console.log(`New Touch: ${context.name}, ID ${this.id}`)
  }

  get identifier() {
    return this.id
  }

  update(event: Event, touch: TouchLike) {
    this.latestEvent = event
    this.last = this.current
    this.current = Object.freeze({ x: touch.clientX, y: touch.clientY })
    this.movementDistance += Vectors.distance(this.last, this.current)
    this.movement = Vectors.add(this.movement, Vectors.subtract(this.current, this.last))
  }
}

export default TrackedTouch

export interface Point {
  x: number
  y: number
}

class Vectors {
  get zero(): Point {
    return { x: 0, y: 0 }
  }

  add(a: Point, b: Point): Point {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
    }
  }

  subtract(a: Point, b: Point): Point {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
    }
  }

  divideElements(a: Point, b: Point): Point {
    return {
      x: a.x / b.x,
      y: a.y / b.y,
    }
  }

  divideScalar(vector: Point, scalar: number): Point {
    return {
      x: vector.x / scalar,
      y: vector.y / scalar,
    }
  }

  distance(a: Point, b: Point): number {
    const diff = this.subtract(a, b)
    return this.length(diff)
  }

  distanceSquared(a: Point, b: Point): number {
    const diff = this.subtract(a, b)
    return this.lengthSquared(diff)
  }

  centerBetween(a: Point, b: Point): Point {
    const diff = this.subtract(a, b)
    return this.add(a, this.divideScalar(diff, 2))
  }

  centerOf(a: Point, b: Point, c: Point): Point {
    const vectors = [a, b, c]
    const distances = [
      this.distanceSquared(a, b) + this.distanceSquared(a, c),
      this.distanceSquared(b, a) + this.distanceSquared(b, c),
      this.distanceSquared(c, a) + this.distanceSquared(c, b),
    ]

    const centerIndex = distances.reduce((acc, currentValue, currentIndex) => {
      return currentValue < acc.distance ?
        { index: currentIndex, distance: currentValue } :
        acc
    }, { distance: Number.MAX_VALUE, index: -1 }).index

    const otherIndices = vectors.map((e, i) => i)
    otherIndices.splice(centerIndex, 1)

    let result = vectors[centerIndex]
    for (const otherIndex of otherIndices) {
      const diff = this.subtract(vectors[centerIndex], vectors[otherIndex])
      result = this.add(result, this.divideScalar(diff, 2))
    }
    return result
  }

  length(vector: Point): number {
    return Math.sqrt((vector.x ** 2) + (vector.y ** 2))
  }

  lengthSquared(vector: Point): number {
    return (vector.x ** 2) + (vector.y ** 2)
  }

  abs(vector: Point): Point {
    return {
      x: Math.abs(vector.x),
      y: Math.abs(vector.y),
    }
  }

  isEqual(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y
  }
}

export default new Vectors()

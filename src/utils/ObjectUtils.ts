function cloneObject<T>(obj: T): T {
  const value: any = obj && obj instanceof Object ? obj : ""

  // Handle Date (return new Date object with old value)
  if (value instanceof Date) {
    return new Date(value) as T
  }

  // Handle Array (return a full slice of the array)
  if (value instanceof Array) {
    return value.slice() as T
  }

  // Handle Object
  if (value instanceof Object) {
    const copy: any = Object.create(value.constructor.prototype)
    for (const attr in value) {
      if (value.hasOwnProperty(attr)) {
        if (value[attr] instanceof Object) {
          copy[attr] = cloneObject(value[attr])
        } else {
          copy[attr] = value[attr]
        }
      }
    }
    return copy as T
  }

  throw new Error("Unable to copy obj! Its type isn't supported.")
}

export default {
  cloneObject,
}

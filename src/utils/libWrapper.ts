// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2020 fvtt-lib-wrapper Rui Pinheiro

// A shim for the libWrapper library
export let libWrapper: any = undefined

Hooks.once("init", () => {
  // Check if the real module is already loaded - if so, use it
  if ((globalThis as any).libWrapper && !((globalThis as any).libWrapper.is_fallback ?? true)) {
    libWrapper = (globalThis as any).libWrapper
    return
  }

  // Fallback implementation
  libWrapper = class {
    static get is_fallback() {
      return true
    }

    static register(module: string, target: string, fn: (this: any, ...args: any[]) => any, type: string = "MIXED") {
      const is_setter = target.endsWith("#set")
      target = !is_setter ? target : target.slice(0, -4)
      const split = target.split(".")
      const fn_name = split.pop()!
      const root_nm = split.splice(0, 1)[0]
      const _eval = eval // The browser doesn't expose all global variables (e.g. 'Game') inside globalThis, but it does to an eval. We copy it to a variable to have it run in global scope.
      const obj: any = split.reduce((x: any, y: string) => x[y], (globalThis as any)[root_nm] || _eval(root_nm))

      let original: any = null
      const wrapper = (type === "OVERRIDE") ? function (this: any) {
        return fn.call(this, ...(arguments as any))
      } : function (this: any) {
        return fn.call(this, original.bind(this), ...(arguments as any))
      }

      const descriptor = Object.getOwnPropertyDescriptor(obj, fn_name)
      if (descriptor != null) {
        if (descriptor.value) {
          original = obj[fn_name]
          obj[fn_name] = wrapper
          return
        }

        if (!is_setter) {
          original = descriptor.get
          descriptor.get = wrapper
        } else {
          original = descriptor.set
          descriptor.set = wrapper
        }
        descriptor.configurable = true
        Object.defineProperty(obj, fn_name, descriptor)
      } else if (typeof obj[fn_name] === "function") {
        original = obj[fn_name]
        obj[fn_name] = wrapper
      } else {
        throw `libWrapper Shim: "${target}" does not exist or could not be found.`
      }
    }
  }
})

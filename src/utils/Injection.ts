import {libWrapper} from "./libWrapper.js"
import packageJson from "../../package.json"
const MODULE_NAME = packageJson.name

type AnyFn = (...args: any[]) => any
type WrapMode = "WRAPPER" | "MIXED" | "OVERRIDE"

// The libWrapper target is always a dynamic string (it varies by Foundry generation, see e.g.
// MeasuredTemplateManagement.ts), so it can never be statically resolved against a real class.
// What CAN be typed is the wrapper's own body: callers pass the original method's signature as
// TOriginal, giving them real autocomplete/checking inside the wrapper even though the path itself
// stays a loosely-checked string.
export function wrapMethod<TOriginal extends AnyFn = AnyFn>(
  method: string,
  wrapper: (original: TOriginal, ...args: Parameters<TOriginal>) => ReturnType<TOriginal>,
  mode: WrapMode = "WRAPPER"
) {
  return libWrapper.register(MODULE_NAME, method, wrapper, mode)
}

export function injectMethodCondition<TArgs extends any[] = any[]>(method: string, predicate: (...args: TArgs) => boolean) {
  return libWrapper.register(MODULE_NAME, method, (next: (...args: TArgs) => any, ...args: TArgs) => {
    if (predicate(...args)) {
      return next(...args)
    }
  }, "MIXED")
}

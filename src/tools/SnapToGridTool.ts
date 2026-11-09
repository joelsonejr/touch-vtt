import {addSceneControlButton} from "../foundryvtt/FoundryUtils.js"

let isActive = true

export function isSnapToGridEnabled(): boolean {
  return isActive
}

export function installSnapToGrid(menuStructure: any) {
  addSceneControlButton(menuStructure, "tokens", {
    name: "snap",
    title: "TOUCHVTT.SnapToGrid",
    icon: "fas fa-border-all",
    toggle: true,
    active: isActive,
    onChange: (event: Event, active: boolean) => { isActive = active }
  })
}

// The logic for this was originally in the FakeTouchEvent module (not used in v12), having it here seems clearer anyway.
export function callbackForSnapToGrid(event: string, events: any[]) {
  if (event.startsWith("dragLeft") && !isActive) {
    events.forEach(e => {
      e.shiftKey = true
    })
  }
}

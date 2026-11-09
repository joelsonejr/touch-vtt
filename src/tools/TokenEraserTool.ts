import {addSceneControlButton} from "../foundryvtt/FoundryUtils.js"

export function installTokenEraser(menuStructure: any) {

  if (game.user!.isGM) {
    addSceneControlButton(menuStructure, "tokens", {
      // Simulate hitting del with a token selected
      name: "Delete",
      title: "TOUCHVTT.DeleteToken",
      icon: "fas fa-eraser",
      button: true,
      onClick: () => (canvas!.tokens as any)._onDeleteKey(),
      onChange: () => (canvas!.tokens as any)._onDeleteKey()
    })
  }
}

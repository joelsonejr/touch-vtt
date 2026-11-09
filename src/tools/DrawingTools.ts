import {addSceneControlButton} from "../foundryvtt/FoundryUtils.js"

export function installDrawingToolsControls(menuStructure: any) {
  addSceneControlButton(menuStructure, "drawings", {
    // Simulate hitting del with a drawing selected
    name: "Delete",
    title: "TOUCHVTT.DeleteDrawing",
    icon: "fas fa-eraser",
    button: true,
    onClick: () => (canvas!.drawings as any)._onDeleteKey(),
    onChange: () => (canvas!.drawings as any)._onDeleteKey()
  })
}

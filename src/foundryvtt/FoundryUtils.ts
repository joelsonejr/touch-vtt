export function addSceneControlButton(menuStructure: any, category: string, button: { name: string, [key: string]: any }) {
  let menuCategory
  if (game.release!.generation <= 12) {
    menuCategory = menuStructure.find((c: any) => c.layer === category)
    if (menuCategory) {
        menuCategory.tools.push(button)
    }
  } else {
    menuCategory = menuStructure[category]
    if (menuCategory) {
        menuCategory.tools[button.name] = button
    }
  }
}

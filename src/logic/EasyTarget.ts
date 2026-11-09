import {getSetting, EASY_TARGET_OFF, EASY_TARGET_SETTING, EASY_TARGET_SINGLE} from "../config/TouchSettings.js"

export function callbackForEasyTarget(event: string, events: any[]) {
  if (event == "clickLeft") {
    const token = events[0].target
    if (isEasyTargetEnabled() && isSelectToolActive() && token instanceof (CONFIG.Token as any).objectClass && isUnownedToken(token.mouseInteractionManager, events[0])) {
      // The user usually cannot click this token => we'll select it
      targetToken(token)
    }
  }
}

function targetToken(token: any) {
  const releaseOthers = getSettingValue() === EASY_TARGET_SINGLE
  token.setTarget(!token.isTargeted, { releaseOthers })
}

function getSettingValue() {
  return getSetting<string>(EASY_TARGET_SETTING)
}

function isEasyTargetEnabled(): boolean {
  return getSettingValue() !== EASY_TARGET_OFF
}

function isSelectToolActive(): boolean {
  return game.activeTool === "select"
}

function isUnownedToken(mouseInteractionManager: any, event: any): boolean {
  return typeof mouseInteractionManager.can === "function" && !mouseInteractionManager.can("clickLeft", event)
}

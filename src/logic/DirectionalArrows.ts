import {wrapMethod} from "../utils/Injection.js"
import {getSetting, DIRECTIONAL_ARROWS_ON, DIRECTIONAL_ARROWS_SETTING} from "../config/TouchSettings.js"

export function initDirectionalArrows() {
  if (tokenHudExists()) {
    const tokenHUDPath = game.release!.generation < 13 ? "TokenHUD" : "foundry.applications.hud.TokenHUD"
    const method = game.release!.generation < 13 ? "activateListeners" : "_onRender"
    wrapMethod<(this: any, html: any, ...args: any[]) => any>(`${tokenHUDPath}.prototype.${method}`, function (originalMethod, html, ...args) {
      const superResult = (originalMethod as any)(html, ...args)
      if (areDirectionalArrowsEnabled() && !getActiveToken()?.document?.lockRotation) {
        injectArrowHtml(method === "activateListeners" ? html : (this as any).element)
      }
      return superResult
    })
  }
}

function injectArrowHtml(html: any) {
  const jQ = $(html)
  const leftColumn = jQ.find(".col.left")
  const middleColumn = jQ.find(".col.middle")
  const rightColumn = jQ.find(".col.right")

  addArrow(middleColumn, 0)
  addArrow(rightColumn, 45)
  addArrow(rightColumn, 90)
  addArrow(rightColumn, 135)
  addArrow(middleColumn, 180)
  addArrow(leftColumn, 225)
  addArrow(leftColumn, 270)
  addArrow(leftColumn, 315)
}

function addArrow(parent: JQuery, angle: number) {
  const title = game.i18n!.localize(`TOUCHVTT.Rotate${angle}`)
  const arrow = $(
    `<div class="control-icon directional-arrow directional-arrow-${angle}" data-action="rotate-${angle}" title="${title}">
      <i class="fas fa-chevron-up"></i>
    </div>`
  )
  arrow.on("click", () => {
    const activeToken = getActiveToken()
    if (canControl(activeToken)) {
      activeToken.rotate((angle + 180) % 360)
    }
  })
  parent.prepend(arrow)
}

function tokenHudExists(): boolean {
  const tokenHud: any = game.release!.generation < 13 ? TokenHUD : foundry.applications!.hud.TokenHUD
  return typeof tokenHud === "function" &&
    typeof tokenHud.prototype === "object" &&
    (typeof tokenHud.prototype.activateListeners === "function" || typeof tokenHud.prototype._onRender === "function")
}

function getActiveToken(): any {
  return canvas && canvas.hud && (canvas.hud as any).token && (canvas.hud as any).token.object
}

function areDirectionalArrowsEnabled(): boolean {
  return getSetting(DIRECTIONAL_ARROWS_SETTING) === DIRECTIONAL_ARROWS_ON
}

function canControl(token: any): boolean {
  return token != null &&
    typeof token._canDrag === "function" &&
    token._canDrag()
}

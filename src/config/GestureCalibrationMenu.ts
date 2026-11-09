import {MODULE_NAME, MODULE_DISPLAY_NAME} from "./ModuleConstants.js"
import CanvasTouchPointerEventsManager from "../logic/CanvasTouchPointerEventsManager.js"
import {getSetting, ZOOM_THRESHOLD_SETTING, PAN_THRESHOLD_SETTING} from "./TouchSettings.js"

export class GestureCalibrationMenu extends FormApplication {
  canvasTouchPointerEventsManager: CanvasTouchPointerEventsManager | null

  constructor() {
    super()
    this.canvasTouchPointerEventsManager = null
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `/modules/${MODULE_NAME}/templates/gesture-calibration.hbs`,
      id: `${MODULE_NAME}-gesture-calibration-form`,
      title: `${MODULE_DISPLAY_NAME} - Gesture Calibration`,
      resizable: true,
      width: 800,
      height: 600,
    })
  }

  getData() {
    return {
      zoomThresholdSetting: getSetting(ZOOM_THRESHOLD_SETTING),
      panThresholdSetting: getSetting(PAN_THRESHOLD_SETTING)
    }
  }

  async _updateObject(event: Event, formData: any) {
    const data = (expandObject as any)(formData)
    for (let setting in data) {
      (game.settings as any).set(MODULE_NAME, setting, data[setting])
    }
  }

  async close(...args: any[]) {
    await super.close(...args)
    this.canvasTouchPointerEventsManager = null
    ;(game.settings as any).sheet.maximize()
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html)
    Object.values(ui.windows).forEach((app: any) => app.minimize())
    this.canvasTouchPointerEventsManager = CanvasTouchPointerEventsManager.init($("#touch-vtt-calibration").get(0) as HTMLElement)

    const zoomThresholdInput = html.find(`input[name="zoomThreshold"]`)
    zoomThresholdInput.on("change", () => {
      this.canvasTouchPointerEventsManager!.setForcedZoomThreshold(Number(zoomThresholdInput.val()))
    })

    const panThresholdInput = html.find(`input[name="panThreshold"]`)
    panThresholdInput.on("change", () => {
      this.canvasTouchPointerEventsManager!.setForcedPanThreshold(Number(panThresholdInput.val()))
    })
  }
}

import { LightSensorService, Listener } from "../services/lightSensorService";
import BacklightService from "../services/backlightService"

export default class BacklightController implements Listener {
    /* value at which to clamp ambiental light values coming from the LightSensorService
     * While light can vary dramatically, our backlight is limited and can't track ambiental 1:1
     * As such, we'll try to map backlight to ambiental on a "sane" range, and max out backlight
     * at this treshold value
     */
    private readonly MAX_ROOM_LUX = 750

    private readonly CHANGE_THRESHOLD_LUX = 5

    private backlightService = new BacklightService()

    private lightSensorService = new LightSensorService()

    private isDisplayOn: boolean = true

    private backlightValue: number = 100

    private ambientalLightValue: number = 256

    constructor() {
        // start monitoring I2C for light sensor
        this.lightSensorService.init()

        this.lightSensorService.registerListener(this)
    }

    lightMeasurementChanged(value: number) {
        // add hysteresis through the change threshold
        if (value != this.ambientalLightValue && Math.abs(value - this.ambientalLightValue) > this.CHANGE_THRESHOLD_LUX) {
            console.log(`Light value changed to: ${value}`)
            this.ambientalLightValue = value

            this.autoAdjustBacklight(value)
        }
    }

    public setDisplay(enabled: boolean) {
        this.isDisplayOn = enabled

        if (enabled) {
            console.log(`Ambiental light value on display on is: ${this.ambientalLightValue}`)
            this.autoAdjustBacklight(this.ambientalLightValue)
        } else {
            this.backlightService.setBacklight(null)
        }
    }

    public setBacklight(value: number) {
        this.backlightValue = value
        if (this.isDisplayOn) {
            this.backlightService.setBacklight(value)
        }
    }

    private autoAdjustBacklight(value: number) {
        // clamp ambient
        const ambientLight = Math.min(value, this.MAX_ROOM_LUX)

        const backlightValue = Math.round((ambientLight / this.MAX_ROOM_LUX) * 100)

        if (this.isDisplayOn) {
            this.backlightService.setBacklight(backlightValue)
        }
    }
}
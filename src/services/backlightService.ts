import { Gpio } from "pigpio"
import { LightSensorService, Listener } from "./lightSensorService"

export default class BacklightService implements Listener {
    private HW_PWM_FREQ = 20000
    private MIN_LEVEL = 30000
    private MAX_LEVEL = 100000
    private AMBITUS = this.MAX_LEVEL - this.MIN_LEVEL

    private backlightCtrl: Gpio

    constructor(lightSensorService: LightSensorService) {
        if (process.env.LOCAL_MODE) return

        console.log("Initializing backlight control")
        this.backlightCtrl = new Gpio(19, { mode: Gpio.OUTPUT })

        lightSensorService.registerListener(this)
    }

    lightMeasurementChanged(value: number) {
        console.log(`Light value changed to: ${value}`)
    }

    /**
     * Sets the attached display's backlight to specified value
     * @param value value to set backlight to in percentage, where
     * - 0 is minimum (but still working)
     * - 100 is maximum
     * - null means display is off
     */
    public setBacklight(value?: number) {
        // if no value, display should be off
        if (value === null) {
            this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, 0)
            return
        }

        // clamp values to 0 - 100%
        value = Math.min(Math.max(0, value), 100)

        const dutyCycle = Math.floor(this.MIN_LEVEL + (value * this.AMBITUS) / 100)

        console.log(`Will set display PWM to ${dutyCycle}`)
        this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, dutyCycle)
    }
}
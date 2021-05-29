import { Gpio } from "pigpio"

export default class BacklightService {
    private HW_PWM_FREQ = 20000
    private MIN_LEVEL = 30000
    private MAX_LEVEL = 100000
    private AMBITUS = this.MAX_LEVEL - this.MIN_LEVEL

    private backlightCtrl: Gpio

    private currentValue: number

    private targetValue: number

    private transitionAnimator: NodeJS.Timeout | null

    // duration of any
    private readonly TRANSITION_DURATION_MS = 4000

    constructor() {
        if (process.env.LOCAL_MODE) return

        console.log("Initializing backlight control")
        this.backlightCtrl = new Gpio(19, { mode: Gpio.OUTPUT })
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
            this.currentValue = 0
            this.targetValue = 0
            this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, 0)
            return
        }

        // clamp values to 0 - 100%
        value = Math.min(Math.max(0, value), 100)

        this.targetValue = value

        if (this.transitionAnimator) {
            clearInterval(this.transitionAnimator)
        }

        // transition in 1% steps
        const transitionSteps = Math.abs(this.targetValue - this.currentValue)
        const step = (this.currentValue < this.targetValue) ? 1 : -1

        this.transitionAnimator = setInterval(() => {
            // transition until we've reached the target value
            if (this.currentValue != this.targetValue) {
                this.setBacklightActual(this.currentValue + step)
            } else {
                clearInterval(this.transitionAnimator)
                this.transitionAnimator = null
            }
        }, this.TRANSITION_DURATION_MS / transitionSteps)
    }

    private setBacklightActual(value: number) {
        this.currentValue = value

        const dutyCycle = Math.floor(this.MIN_LEVEL + (value * this.AMBITUS) / 100)

        console.log(`Will set display PWM to ${dutyCycle}`)
        this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, dutyCycle)
    }
}
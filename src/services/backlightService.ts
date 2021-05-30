import { Gpio } from "pigpio"

export default class BacklightService {
    private readonly HW_PWM_FREQ = 20000
    private readonly MIN_LEVEL = 28000
    private readonly MAX_LEVEL = 120000
    private readonly AMBITUS = this.MAX_LEVEL - this.MIN_LEVEL

    public static readonly ADJUSTMENT_RANGE = 1000

    private backlightCtrl: Gpio

    private currentValue: number = 0

    private targetValue: number = 50

    private transitionAnimator: NodeJS.Timeout | null

    // duration of any
    private readonly TRANSITION_STEP_MS = 100

    constructor() {
        // if running locally on a PC, there's no GPIO to play with
        if (process.env.LOCAL_MODE) return

        console.log("Initializing backlight control")
        this.backlightCtrl = new Gpio(19, { mode: Gpio.OUTPUT })

        this.transitionBacklight() // init
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
            this.targetValue = null
            this.transitionBacklight()
            return
        }

        // clamp values to 0 - 1000
        value = Math.min(Math.max(0, value), BacklightService.ADJUSTMENT_RANGE)

        this.targetValue = value

        this.transitionBacklight()
    }

    private transitionBacklight() {
        if (this.targetValue === null) { // turn display off
            this.currentValue = null
            this.backlightCtrl.hardwarePwmWrite(0, 0)
            return
        } else if (this.currentValue === null) { // turn display on to target value
            this.currentValue = this.targetValue
            const targetDutyCycle = this.dutyCycleFor(this.targetValue)
            this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, targetDutyCycle)
            return
        }

        this.transitionAnimator = setInterval(() => {
            // calculate direction for current transition step
            const step = (this.currentValue < this.targetValue) ? 1 : -1
            // transition until we've reached the target value
            if (this.currentValue != this.targetValue) {
                this.currentValue += step
                const dutyCycle = this.dutyCycleFor(this.currentValue)
                this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, dutyCycle)
            } else {
                clearInterval(this.transitionAnimator)
                this.transitionAnimator = null
            }
        }, this.TRANSITION_STEP_MS)
    }

    private dutyCycleFor(value: number | null) {
        if (value === null) return 0

        return Math.floor(this.MIN_LEVEL + (value * this.AMBITUS) / BacklightService.ADJUSTMENT_RANGE)
    }
}
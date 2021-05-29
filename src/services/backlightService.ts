import { Gpio } from "pigpio"

export default class BacklightService {
    private HW_PWM_FREQ = 20000
    private MIN_LEVEL = 28000
    private MAX_LEVEL = 120000
    private AMBITUS = this.MAX_LEVEL - this.MIN_LEVEL

    private backlightCtrl: Gpio

    private currentValue: number = 0

    private targetValue: number = 50

    private transitionAnimator: NodeJS.Timeout | null

    // duration of any
    private readonly TRANSITION_DURATION_MS = 4000

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

        // clamp values to 0 - 100%
        value = Math.min(Math.max(0, value), 100)

        this.targetValue = value

        this.transitionBacklight()
    }

    private transitionBacklight() {
        console.log("transition backlight")
        if (this.targetValue === null) { // turn display off
            console.log("display will be off")
            this.currentValue = null
            this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, 0)
            return
        } else if (this.currentValue === null) { // turn display on to target value
            console.log("display was off, turning on")
            this.currentValue = this.targetValue
            const targetDutyCycle = this.dutyCycleFor(this.targetValue)
            this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, targetDutyCycle)
            return
        }

        // stop current transition
        if (this.transitionAnimator) {
            clearInterval(this.transitionAnimator)
        }

        // transition in 1% steps
        const transitionSteps = Math.abs(this.targetValue - this.currentValue)
        console.log(`Will transition in ${transitionSteps} from ${this.currentValue} to ${this.targetValue}`)
        const step = (this.currentValue < this.targetValue) ? 1 : -1

        this.transitionAnimator = setInterval(() => {
            // transition until we've reached the target value
            if (this.currentValue != this.targetValue) {
                this.currentValue += step
                const dutyCycle = this.dutyCycleFor(this.currentValue)
                this.backlightCtrl.hardwarePwmWrite(this.HW_PWM_FREQ, dutyCycle)
            } else {
                clearInterval(this.transitionAnimator)
                this.transitionAnimator = null
            }
        }, this.TRANSITION_DURATION_MS / transitionSteps)
    }

    private dutyCycleFor(value: number | null) {
        if (value === null) return 0

        return Math.floor(this.MIN_LEVEL + (value * this.AMBITUS) / 100)
    }
}
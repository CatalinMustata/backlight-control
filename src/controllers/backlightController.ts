import BacklightService from "../services/backlightService"

export default class BacklightController {
    private backlightService = new BacklightService();

    private isDisplayOn: boolean = true

    private backlightValue: number = 100

    constructor() {
        // start monitoring I2C for light sensor
    }

    public setDisplay(enabled: boolean) {
        this.isDisplayOn = enabled
        this.backlightService.setBacklight(enabled ? this.backlightValue : null)
    }

    public setBacklight(value: number) {
        this.backlightValue = value
        if (this.isDisplayOn) {
            this.backlightService.setBacklight(value)
        }
    }
}
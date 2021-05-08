import BacklightService from "../services/backlightService"

export default class BacklightController {
    private backlightService = new BacklightService();

    private isDisplayOn: boolean

    private backlightValue: number

    constructor() {
        // start monitoring I2C for light sensor
    }

    public setDisplay(enabled: boolean) {
        this.isDisplayOn = enabled
        this.backlightService.setBacklight(enabled ? this.backlightValue : null)
    }

    public setBacklight(value: number) {
        if (this.isDisplayOn) {
            this.backlightService.setBacklight(value)
        }
    }
}
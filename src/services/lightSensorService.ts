import { I2CBus, openSync } from "i2c-bus"
import { runInThisContext } from "vm"

export interface Listener {
    lightMeasurementChanged(value: number)
}

export class LightSensorService {

    private readonly I2C_ID_VCNL4010 = 0x13

    private readonly MEASURE_INTERVAL_MS = 1000

    // sets the amount of light passing through a cosmetic window in front of the sensor
    private readonly WINDOW_TRANSPARENCY_FACTOR_PERC = 100

    private initialised = false

    private luxPerCount = 0.25

    private bus: I2CBus

    private sensorAddr: number

    private readBuffer = Buffer.alloc(4, 0x00)

    private listeners: Listener[] = []

    private measurementsStarted = false

    private measureTimer = null

    constructor() {
        console.log("Initializing I2C bus")
        this.bus = openSync(1, { forceAccess: true })
        console.log(`Bus available: ${this.bus}`)

        // the less light passes through the cosmetic window, the less resolution our measurement has
        this.luxPerCount = 0.25 * (100 / this.WINDOW_TRANSPARENCY_FACTOR_PERC)
    }

    public init() {
        console.log("Scanning for I2C devices")
        const devices = this.bus.scanSync()
        console.log(`Found devices ${JSON.stringify(devices)}`)
        this.sensorAddr = devices.find(device => device == this.I2C_ID_VCNL4010)

        if (!this.initialised) {
            console.log("Failed to find light sensor. Auto dimming not available")
            return
        }

        console.log(`Found light sensor at ${this.sensorAddr}`)

        if (this.bus.readByteSync(this.sensorAddr, 0x81)) {
            console.log("Found VCNL4010. Configuring")
            this.bus.writeByteSync(this.sensorAddr, 0x83, 0b00000000) // disable proximity sensor current
            this.bus.writeByteSync(this.sensorAddr, 0x84, 0b00011101) // set defaults
            this.bus.writeByteSync(this.sensorAddr, 0x89, 0b00000000) // disable interrupts
        }
    }

    public registerListener(listener: Listener) {
        this.listeners.push(listener)

        if (!this.measurementsStarted) {
            this.startMeasurements()
        }
    }

    public deregisterListener(listener: Listener) {
        // TODO implement
    }

    private startMeasurements() {
        if (!this.initialised) return

        this.measureTimer = setInterval(() => {
            // start on-demand measurement
            this.bus.writeByteSync(this.sensorAddr, 0x80, 0b00010000)

            this.bus.readI2cBlockSync(this.sensorAddr, 0x85, 4, this.readBuffer)

            // ambient light value is 0.25 lux per count
            var light = Math.round(this.readBuffer.readUInt16BE(0) * this.luxPerCount)

            this.listeners.forEach(listener => listener.lightMeasurementChanged(light))
        }, this.MEASURE_INTERVAL_MS)
        this.measurementsStarted = true
    }

    private stopMeasurements() {
        clearInterval(this.measureTimer)
    }
}
import { I2CBus, openSync } from "i2c-bus"

export interface Listener {
    lightMeasurementChanged(value: number)
}

export class LightSensorService {

    private readonly I2C_ID_VCNL4010 = 0x13

    private readonly MEASURE_INTERVAL_MS = 1000

    private bus: I2CBus

    private sensorAddr: number

    private listeners: Listener[] = []

    private measurementsStarted = false

    private measureTimer = null

    constructor() {
        this.bus = openSync(1, { forceAccess: true })
    }

    public init() {
        const devices = this.bus.scanSync()
        console.log(`Found devices ${JSON.stringify(devices)}`)
        this.sensorAddr = devices.find(device => device == this.I2C_ID_VCNL4010)

        console.log(`Found light sensor at ${this.sensorAddr}`)

        if (this.bus.readByteSync(this.sensorAddr, 0x81)) {
            console.log("Found VCNL4010")
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
        this.measureTimer = setInterval(() => {
            // start on-demand measurement
            this.bus.writeByteSync(this.sensorAddr, 0x80, 0b00011000)

            const readBuffer = Buffer.alloc(4, 0x00)

            this.bus.readI2cBlockSync(this.sensorAddr, 0x85, 4, readBuffer)

            var light = Math.round(readBuffer.readUInt16BE(0) * 0.25)

            this.listeners.forEach(listener => listener.lightMeasurementChanged(light))
        }, this.MEASURE_INTERVAL_MS)
    }

    private stopMeasurements() {
        clearInterval(this.measureTimer)
    }
}
import { ServerRoute } from "@hapi/hapi"
import BacklightController from "./controllers/backlightController"

const backlightController = new BacklightController()

const ping: ServerRoute = {
    path: "/",
    method: "GET",
    handler: (_, h) => {
        return h.response("yes?").code(200)
    }
}

const setBacklightRoute: ServerRoute = {
    path: "/set-backlight/{value}",
    method: "POST",
    handler: (request, h) => {
        const requestedValue = request.params["value"]
        console.log(`Received request to 'set-display' to ${requestedValue}`)
        let resCode = 200
        let response = "OK"
        let value = parseInt(request.params["value"])

        if (isNaN(value)) {
            console.log(`Received invalid value`)
            resCode = 400
            response = `Invalid value: ${requestedValue}`
        }

        if (resCode === 200) {
            backlightController.setBacklight(value)
        }

        return h.response(response).code(resCode)
    }
}

const setDisplayRoute: ServerRoute = {
    path: "/set-display/{value}",
    method: "POST",
    handler: (request, h) => {
        const requestedState: string = request.params["value"]
        console.log(`Received request to 'set-backlight' to ${requestedState}`)
        let enabled: boolean
        let resCode = 200
        let response = "OK"
        switch (requestedState) {
            case "on":
                enabled = true
                break
            case "off":
                enabled = false
                break
            default:
                console.log(`Invalid param received: ${request.params["value"]}`)
                resCode = 400
                response = `Invalid value: ${requestedState}`
        }

        if (resCode === 200) {
            backlightController.setDisplay(enabled)
        }

        return h.response(response).code(resCode)
    }
}

function prepareRoutes(): ServerRoute[] {
    return [ping, setBacklightRoute, setDisplayRoute]
}

export default prepareRoutes
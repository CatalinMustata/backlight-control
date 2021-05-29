import { Server } from "@hapi/hapi"
import prepareRoutes from "./routes"

const init = async () => {
    console.log("Initializing...")
    const server = new Server({
        port: "8713",
        routes: {
            cors: {
                origin: ["http://localhost:*"]
            }
        }
    })

    const routes = prepareRoutes()

    console.log("Registering routes")
    server.route(routes)

    console.log("Starting server")
    await server.start()

    console.log("Server Started on port 8713")
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
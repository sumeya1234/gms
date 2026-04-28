import { Server } from "socket.io";
import logger from "../utils/logger.js";

export function initSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on("join_tracking_room", (data) => {
            const { requestId, role } = data;
            if (requestId) {
                const roomName = `request_${requestId}`;
                socket.join(roomName);
                logger.info(`Socket ${socket.id} (Role: ${role}) joined room: ${roomName}`);
            }
        });

        socket.on("mechanic_location_update", (data) => {
            const { requestId, latitude, longitude } = data;
            if (requestId && latitude && longitude) {
                const roomName = `request_${requestId}`;
                socket.to(roomName).emit("mechanic_location_update", { latitude, longitude });
            }
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

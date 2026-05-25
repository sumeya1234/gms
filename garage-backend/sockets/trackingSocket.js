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

        socket.on("customer_location_update", (data) => {
            const { requestId, latitude, longitude } = data;
            if (requestId && latitude && longitude) {
                const roomName = `request_${requestId}`;
                socket.to(roomName).emit("customer_location_update", { latitude, longitude });
            }
        });


        socket.on("join_complaint_room", (data) => {
            const { complaintId } = data;
            if (complaintId) {
                const roomName = `complaint_${complaintId}`;
                socket.join(roomName);
                logger.info(`Socket ${socket.id} joined complaint room: ${roomName}`);
            }
        });

        socket.on("send_complaint_message", (data) => {
            // Accept both camelCase (mobile) and PascalCase (web) field shapes
            // Coerce complaintId to Number so all clients can match it reliably
            const complaintId = Number(data.complaintId ?? data.ComplaintID);
            const message = data.message ?? data.Message;
            const senderId = data.senderId ?? data.SenderID;
            const senderName = data.senderName ?? data.SenderName;
            const senderRole = data.senderRole ?? data.SenderRole ?? 'Unknown';

            if (complaintId && message) {
                const roomName = `complaint_${complaintId}`;
                // Relay to everyone in the room EXCEPT the sender
                socket.to(roomName).emit("receive_complaint_message", {
                    complaintId,
                    SenderID: senderId,
                    Message: message,
                    SenderName: senderName,
                    SenderRole: senderRole,
                    CreatedAt: new Date().toISOString()
                });
            }
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

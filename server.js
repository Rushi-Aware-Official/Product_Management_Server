import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./db/index.js";
import HTTP from "http";
import { Server } from "socket.io";
import app from "./index.js";
import registerSocket from "./socket.js";

const PORT = process.env.PORT || 4000;

connectDB();

// Create HTTP server
const server = HTTP.createServer(app);

// Setup socket.io server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

// Make io available inside routes
app.set("io", io);

// Register socket handling
registerSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const citasRoutes = require("./routes/citas");
const asesorRoutes = require("./routes/asesor");
const residenteRoutes = require("./routes/residente");
const jefeRoutes = require("./routes/jefe");
const notificacionesRoutes = require("./routes/notificaciones");
const fotosRoutes = require("./routes/fotos");
const reportesRoutes = require("./routes/reportes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : isDev
    ? [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8082",
      ]
    : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // Peticiones sin origin (móvil nativo, Postman)
  if (isDev) {
    if (origin.includes("localhost")) return true;
    if (origin.includes("127.0.0.1")) return true;
    if (origin.includes("ngrok-free.dev")) return true;
    if (origin.includes("ngrok.io")) return true;
    // Permitir cualquier IP privada en desarrollo (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin))
      return true;
  }
  return allowedOrigins.includes(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      console.warn(`[CORS] Origen rechazado: ${origin}`);
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true,
  }),
);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`CORS WebSocket: origen no permitido → ${origin}`));
    },
    credentials: true,
  },
  // Configuración de transports para mayor compatibilidad en LAN
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 10000,
});

app.use(express.json({ limit: "10mb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // aumentado de 200 → 300 para equipos de trabajo
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiadas peticiones, intenta más tarde." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // aumentado de 10 → 20 (varios compañeros hacen login a la vez)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos.",
  },
});

app.use(globalLimiter);
app.use("/api/auth/login", authLimiter);

// ── Uploads protegidos con JWT ─────────────────────────────────────────────────
app.get("/uploads/:filename", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ ok: false, mensaje: "Sin token." });
  }
  try {
    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ ok: false, mensaje: "JWT_SECRET no configurado." });
    }
    jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }

  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ ok: false, mensaje: "Archivo no encontrado." });
  }

  res.sendFile(filePath);
});

// ── WebSockets ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

  socket.on("join_room", ({ userId, rol }) => {
    if (userId) socket.join(`user_${userId}`);
    if (rol) socket.join(`role_${rol}`);
    console.log(`[WebSocket] ${socket.id} → user_${userId} / role_${rol}`);
  });

  socket.on("disconnect", () => {
    console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
  });
});

app.set("io", io);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/asesor", asesorRoutes);
app.use("/api/residente", residenteRoutes);
app.use("/api/jefe", jefeRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/fotos", fotosRoutes);
app.use("/api/reportes", reportesRoutes);

app.get("/api/health", (_, res) =>
  res.json({ ok: true, mensaje: "VinculaTec API corriendo 🚀" }),
);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐  Modo: ${isDev ? "desarrollo" : "producción"}`);
  console.log(`🔌  WebSockets habilitados`);
  if (isDev) {
    // Mostrar la IP de red local para que los compañeros sepan qué poner en .env.local
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          console.log(
            `🖥️  IP local: http://${net.address}:${PORT}/api  ← usa esta en .env.local`,
          );
        }
      }
    }
  }
});

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

// ── Lista blanca de orígenes permitidos ──────────────────────────────────────
// SEGURIDAD FIX #9: CORS separado por ambiente. En producción solo se permiten
// dominios explícitos; en desarrollo se permite ngrok y localhost.
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : isDev
    ? [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
      ]
    : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // Peticiones sin origin (móvil nativo, Postman)
  if (isDev) {
    if (origin.includes("localhost")) return true;
    if (origin.includes("127.0.0.1")) return true;
    // En desarrollo se permite ngrok para pruebas con dispositivos físicos
    if (origin.includes("ngrok-free.dev")) return true;
    if (origin.includes("ngrok.io")) return true;
  }
  return allowedOrigins.includes(origin);
}

// ── CORS para Express ─────────────────────────────────────────────────────────
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

// ── Socket.IO con la misma lógica de CORS ────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`CORS WebSocket: origen no permitido → ${origin}`));
    },
    credentials: true,
  },
});

app.use(express.json({ limit: "10mb" }));

// ── SEGURIDAD FIX #8: Rate limiting global y específico para auth ─────────────
// Instalar con: npm install express-rate-limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiadas peticiones, intenta más tarde." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos de login por IP cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos.",
  },
});

app.use(globalLimiter);
app.use("/api/auth/login", authLimiter); // Rate limit estricto solo en login

// ── SEGURIDAD FIX #4: Uploads protegidos con autenticación ───────────────────
// Antes: app.use("/uploads", express.static("uploads"))  ← INSEGURO (público)
// Ahora: se verifica el JWT antes de servir cualquier archivo
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

  // Sanitizar el nombre del archivo para evitar path traversal
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

  // FIX #4: El cliente emite "join_room" tras iniciar sesión para que el
  // servidor pueda enviar eventos solo a usuarios/roles específicos en lugar
  // de hacer broadcast global con io.emit().
  socket.on("join_room", ({ userId, rol }) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
    if (rol) {
      socket.join(`role_${rol}`);
    }
    console.log(`[WebSocket] ${socket.id} → user_${userId} / role_${rol}`);
  });

  socket.on("disconnect", () => {
    console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
  });
});

app.set("io", io);

// ── Rutas ────────────────────────────────────────────────────────────────────
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
});

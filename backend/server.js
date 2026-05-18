const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes          = require("./routes/auth");
const citasRoutes         = require("./routes/citas");
const asesorRoutes        = require("./routes/asesor");
const residenteRoutes     = require("./routes/residente");
const jefeRoutes          = require("./routes/jefe");
const notificacionesRoutes = require("./routes/notificaciones");
const fotosRoutes         = require("./routes/fotos");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/citas",         citasRoutes);
app.use("/api/asesor",        asesorRoutes);
app.use("/api/residente",     residenteRoutes);
app.use("/api/jefe",          jefeRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/fotos",         fotosRoutes);

// Health check
app.get("/api/health", (_, res) =>
  res.json({ ok: true, mensaje: "VinculaTec API corriendo 🚀" }),
);

// ── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Servidor corriendo en http://localhost:${PORT}`);
});

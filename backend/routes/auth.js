const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { auth } = require("../middleware");

const router = express.Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password)
    return res
      .status(400)
      .json({ ok: false, mensaje: "Correo y contraseña requeridos." });

  try {
    const [rows] = await db.execute(
      "SELECT id, nombre, apellidos, correo, password_hash, rol, activo FROM usuarios WHERE correo = ?",
      [correo.toLowerCase().trim()],
    );

    if (rows.length === 0)
      return res
        .status(401)
        .json({ ok: false, mensaje: "Correo no encontrado." });

    const user = rows[0];

    if (!user.activo)
      return res
        .status(403)
        .json({ ok: false, mensaje: "Cuenta inactiva. Contacta soporte." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res
        .status(401)
        .json({ ok: false, mensaje: "Contraseña incorrecta." });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, mensaje: "JWT_SECRET no está configurado en el servidor." });
    }
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    const usuarioResponse = {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      rol: user.rol,
    };

    if (user.rol === "residente") {
      try {
        const [asesorRows] = await db.execute(
          `SELECT u.id AS usuarioId, u.nombre, u.apellidos, u.correo, a.departamento, a.num_empleado
           FROM residentes r
           JOIN asesores a ON r.asesor_id = a.id
           JOIN usuarios u ON a.usuario_id = u.id
           WHERE r.usuario_id = ?`,
          [user.id],
        );
        if (asesorRows.length > 0) {
          const a = asesorRows[0];
          usuarioResponse.asesorInfo = {
            usuarioId: String(a.usuarioId),
            nombre: `${a.nombre} ${a.apellidos}`,
            correo: a.correo,
            departamento: a.departamento || "Ciencias Básicas",
            numEmpleado: a.num_empleado || "—",
          };
        }
      } catch (_) {
        /* sin asesor asignado */
      }

      try {
        const [jefeRows] = await db.execute(
          `SELECT u.id AS usuarioId, u.nombre, u.apellidos, u.correo
           FROM jefes_vinculacion j
           JOIN usuarios u ON j.usuario_id = u.id
           LIMIT 1`,
        );
        if (jefeRows.length > 0) {
          const j = jefeRows[0];
          usuarioResponse.jefeInfo = {
            usuarioId: String(j.usuarioId),
            nombre: `${j.nombre} ${j.apellidos}`,
            correo: j.correo,
          };
        }
      } catch (_) {
        /* sin jefe */
      }
    }

    if (user.rol === "asesor") {
      try {
        const [resRows] = await db.execute(
          `SELECT u.id AS usuarioId, u.nombre, u.apellidos, u.correo,
                  r.num_control, r.carrera, r.horas_completadas, r.horas_requeridas,
                  e.nombre AS empresaNombre
           FROM asesores a
           JOIN residentes r  ON r.asesor_id = a.id
           JOIN usuarios u    ON r.usuario_id = u.id
           LEFT JOIN empresas e ON r.empresa_id = e.id
           WHERE a.usuario_id = ? AND r.estado = 'activo'`,
          [user.id],
        );
        usuarioResponse.residentesInfo = resRows.map((r) => ({
          usuarioId: String(r.usuarioId),
          nombre: `${r.nombre} ${r.apellidos}`,
          correo: r.correo,
          numControl: r.num_control,
          carrera: r.carrera,
          horasCompletadas: r.horas_completadas,
          horasRequeridas: r.horas_requeridas,
          empresa: r.empresaNombre || "—",
        }));
      } catch (_) {
        /* sin residentes */
      }
    }

    return res.json({ ok: true, token, usuario: usuarioResponse });
  } catch (err) {
    console.error("Error en login:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, nombre, apellidos, correo, rol FROM usuarios WHERE id = ?",
      [req.user.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado." });
    return res.json({ ok: true, usuario: rows[0] });
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
});

module.exports = router;

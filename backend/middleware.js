const jwt = require("jsonwebtoken");

// ── Middleware: verificar JWT ─────────────────────────────────────────────────
// SEGURIDAD FIX #1 y #3: Middleware centralizado de autenticación y roles
// Úsalo en todos los route files en lugar de definir auth localmente
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, mensaje: "JWT_SECRET no está configurado en el servidor." });
    }
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
}

// ── Middleware: verificar rol ─────────────────────────────────────────────────
// Uso: router.get("/ruta", auth, requireRol("jefe"), handler)
//      router.get("/ruta", auth, requireRol("jefe", "asesor"), handler)
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Se requiere rol: ${roles.join(" o ")}.`,
      });
    }
    next();
  };
}

module.exports = { auth, requireRol };

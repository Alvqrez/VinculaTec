-- ============================================================
-- VinculaTec — Schema MySQL
-- ============================================================

DROP DATABASE IF EXISTS vinculatec;
CREATE DATABASE vinculatec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vinculatec;

-- ── Usuarios ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            VARCHAR(50) PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('residente','asesor','jefe') NOT NULL,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rol (rol),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Empresas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id                   VARCHAR(50) PRIMARY KEY,
  nombre               VARCHAR(150) NOT NULL,
  sector               VARCHAR(100),
  ciudad               VARCHAR(100),
  estado               ENUM('Activa','Por Vencer','Nueva','Inactiva') DEFAULT 'Nueva',
  convenio_vencimiento DATE,
  contacto_nombre      VARCHAR(100),
  contacto_email       VARCHAR(150),
  contacto_telefono    VARCHAR(30),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_convenio (convenio_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Asesores ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asesores (
  id              VARCHAR(50) PRIMARY KEY,
  usuario_id      VARCHAR(50) NOT NULL UNIQUE,
  departamento    VARCHAR(100),
  num_empleado    VARCHAR(30),
  max_residentes  INT DEFAULT 10,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Jefes de Vinculación ────────────────────────────────────
CREATE TABLE IF NOT EXISTS jefes_vinculacion (
  id           VARCHAR(50) PRIMARY KEY,
  usuario_id   VARCHAR(50) NOT NULL UNIQUE,
  departamento VARCHAR(100),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Residentes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residentes (
  id                VARCHAR(50) PRIMARY KEY,
  usuario_id        VARCHAR(50) NOT NULL UNIQUE,
  num_control       VARCHAR(20) UNIQUE,
  carrera           VARCHAR(100),
  semestre          INT,
  empresa_id        VARCHAR(50),
  asesor_id         VARCHAR(50),
  horas_completadas INT         DEFAULT 0,
  horas_requeridas  INT         DEFAULT 480,
  fecha_inicio      DATE,
  fecha_fin         DATE,
  estado            ENUM('activo','completado','baja') DEFAULT 'activo',
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE SET NULL,
  FOREIGN KEY (asesor_id)   REFERENCES asesores(id)  ON DELETE SET NULL,
  INDEX idx_estado  (estado),
  INDEX idx_asesor  (asesor_id),
  INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Proyectos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proyectos (
  id               VARCHAR(50) PRIMARY KEY,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  empresa_id       VARCHAR(50),
  residente_id     VARCHAR(50),
  asesor_id        VARCHAR(50),
  periodo          VARCHAR(50),            -- ej: "2025-1", "2025-2"
  estado           ENUM('propuesto','desarrollo','revision','concluido') DEFAULT 'propuesto',
  prioridad        ENUM('Alta','Media','Baja') DEFAULT 'Media',
  tecnologias      VARCHAR(255),
  progreso         DECIMAL(5,2) DEFAULT 0,
  solicitud_avance BOOLEAN      DEFAULT FALSE,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id)   REFERENCES empresas(id)   ON DELETE SET NULL,
  FOREIGN KEY (residente_id) REFERENCES residentes(id) ON DELETE SET NULL,
  FOREIGN KEY (asesor_id)    REFERENCES asesores(id)   ON DELETE SET NULL,
  INDEX idx_estado_prioridad (estado, prioridad),
  INDEX idx_periodo           (periodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Proyecto-Asesores (múltiples asesores por proyecto) ──────
CREATE TABLE IF NOT EXISTS proyecto_asesores (
  proyecto_id  VARCHAR(50) NOT NULL,
  asesor_id    VARCHAR(50) NOT NULL,
  PRIMARY KEY (proyecto_id, asesor_id),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id)   REFERENCES asesores(id)  ON DELETE CASCADE,
  INDEX idx_asesor (asesor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reportes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reportes (
  id             VARCHAR(50) PRIMARY KEY,
  residente_id   VARCHAR(50) NOT NULL,
  tipo           ENUM('preliminar','parcial1','parcial2','parcial3','final') NOT NULL,
  fecha_limite   DATE,
  fecha_entrega  DATE,
  estado         ENUM('Pendiente','Entregado','En Revisión','Aprobado','Rechazado') DEFAULT 'Pendiente',
  calificacion   DECIMAL(5,2),
  feedback       TEXT,
  archivo_url    LONGTEXT,                 -- puede almacenar URLs, rutas, o data URIs con base64 (hasta 4GB)
  nombre_archivo VARCHAR(255),             -- nombre del archivo enviado (ej: "reporte_preliminar.pdf")
  revisado_por   VARCHAR(50),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (residente_id) REFERENCES residentes(id) ON DELETE CASCADE,
  FOREIGN KEY (revisado_por) REFERENCES usuarios(id)   ON DELETE SET NULL,
  INDEX idx_tipo       (tipo),
  INDEX idx_estado     (estado),
  INDEX idx_residente  (residente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Citas / Calendario ──────────────────────────────────────
-- FIX: id cambiado a INT AUTO_INCREMENT porque los INSERTs usan result.insertId
--      (antes era VARCHAR(50) sin DEFAULT, lo que causaba error al insertar sin proveer id)
CREATE TABLE IF NOT EXISTS citas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id  VARCHAR(50) NOT NULL,
  participante_id VARCHAR(50) NOT NULL,
  tipo            ENUM('Asesoría','Revisión','Evaluación','Entrega','Otro') DEFAULT 'Asesoría',
  motivo          VARCHAR(200),
  notas           TEXT,
  fecha_hora      DATETIME    NOT NULL,
  lugar           VARCHAR(150),
  estado          ENUM('Pendiente','Confirmada','Cancelada') DEFAULT 'Pendiente',
  external_id     VARCHAR(100),
  created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id)  REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (participante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_fecha        (fecha_hora),
  INDEX idx_estado       (estado),
  INDEX idx_solicitante  (solicitante_id),
  INDEX idx_participante (participante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Fuentes de Información ──────────────────────────────────
CREATE TABLE IF NOT EXISTS fuentes_informacion (
  id             VARCHAR(50) PRIMARY KEY,
  residente_id   VARCHAR(50) NOT NULL,
  tipo           ENUM('propia','banco','empresa') NOT NULL,
  descripcion    VARCHAR(300),
  estado         ENUM('Pendiente','Validada','Rechazada') DEFAULT 'Pendiente',
  revisado_por   VARCHAR(50),
  fecha_revision DATE,
  observaciones  TEXT,
  FOREIGN KEY (residente_id) REFERENCES residentes(id) ON DELETE CASCADE,
  FOREIGN KEY (revisado_por) REFERENCES usuarios(id)   ON DELETE SET NULL,
  INDEX idx_tipo   (tipo),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Fotos de Perfil ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fotos_perfil (
  usuario_id  VARCHAR(50) PRIMARY KEY,
  foto_base64 MEDIUMTEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Períodos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS periodos (
  id          VARCHAR(50)  PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  fecha_inicio DATE        NOT NULL,
  fecha_fin    DATE        NOT NULL,
  descripcion  TEXT,
  estado       ENUM('planificado','activo','cerrado') DEFAULT 'planificado',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Empresas por Período (N:M) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresa_periodos (
  periodo_id  VARCHAR(50) NOT NULL,
  empresa_id  VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (periodo_id, empresa_id),
  FOREIGN KEY (periodo_id) REFERENCES periodos(id)  ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Auditoría de Proyectos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id VARCHAR(50) NOT NULL,
  asesor_id VARCHAR(50) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  fase_anterior VARCHAR(50) NULL,
  fase_nueva VARCHAR(50) NULL,
  comentarios TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proyecto_id (proyecto_id),
  INDEX idx_asesor_id (asesor_id),
  INDEX idx_accion (accion),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id) REFERENCES asesores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Notificaciones ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id VARCHAR(50) NOT NULL,
  tipo_notificacion ENUM('REVISION', 'AVANCE', 'SISTEMA') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  icon VARCHAR(50) DEFAULT 'bell',
  icon_color VARCHAR(20) DEFAULT '#6B7280',
  icon_bg VARCHAR(20) DEFAULT '#F3F4F6',
  proyecto_id VARCHAR(50) NULL,
  fase VARCHAR(50) NULL,
  action_screen VARCHAR(50) NULL,
  action_label VARCHAR(100) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_tipo_notificacion (tipo_notificacion),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE OR REPLACE VIEW notificaciones_activas AS
SELECT id, usuario_id, tipo_notificacion, titulo, mensaje, is_read,
  icon, icon_color, icon_bg, proyecto_id, fase, action_screen,
  action_label, metadata, created_at, updated_at
FROM notificaciones WHERE deleted_at IS NULL;
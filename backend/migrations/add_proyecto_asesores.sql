-- ============================================================
-- Migración: tabla proyecto_asesores
-- Permite que un mismo proyecto tenga múltiples asesores.
-- Regla: cada residente sigue teniendo UN SOLO asesor (residentes.asesor_id).
-- Ejecutar una sola vez en BD existente.
-- ============================================================

CREATE TABLE IF NOT EXISTS proyecto_asesores (
  proyecto_id  VARCHAR(50) NOT NULL,
  asesor_id    VARCHAR(50) NOT NULL,
  PRIMARY KEY (proyecto_id, asesor_id),
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id)   REFERENCES asesores(id)  ON DELETE CASCADE,
  INDEX idx_asesor (asesor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrar registros existentes desde proyectos.asesor_id
INSERT IGNORE INTO proyecto_asesores (proyecto_id, asesor_id)
SELECT id, asesor_id
FROM proyectos
WHERE asesor_id IS NOT NULL;

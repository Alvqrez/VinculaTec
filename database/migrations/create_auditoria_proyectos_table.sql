-- Migration: Crear tabla de auditoría de proyectos
-- Fecha: 2025-05-25
-- Descripción: Auditoría para operaciones críticas de proyectos

CREATE TABLE IF NOT EXISTS auditoria_proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id INT NOT NULL,
  asesor_id INT NOT NULL,
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
);

-- Migration: Crear tabla de notificaciones permanentes
-- Fecha: 2025-05-25
-- Descripción: Sistema de notificaciones persistente con borrado lógico

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo_notificacion ENUM('REVISION', 'AVANCE', 'SISTEMA') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  icon VARCHAR(50) DEFAULT 'bell',
  icon_color VARCHAR(20) DEFAULT '#6B7280',
  icon_bg VARCHAR(20) DEFAULT '#F3F4F6',
  proyecto_id INT NULL,
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
);

-- Vista para notificaciones activas (sin borrado lógico)
CREATE OR REPLACE VIEW notificaciones_activas AS
SELECT 
  id, usuario_id, tipo_notificacion, titulo, mensaje, is_read,
  icon, icon_color, icon_bg, proyecto_id, fase, action_screen, 
  action_label, metadata, created_at, updated_at
FROM notificaciones 
WHERE deleted_at IS NULL;

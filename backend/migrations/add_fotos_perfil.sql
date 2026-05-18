-- Migración: Agregar tabla fotos_perfil
-- Ejecutar esto en MySQL Workbench o en la consola de MySQL para actualizar la base de datos existente

USE vinculatec;

-- Crear la tabla fotos_perfil si no existe
CREATE TABLE IF NOT EXISTS fotos_perfil (
  usuario_id  VARCHAR(50) PRIMARY KEY,
  foto_base64 TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

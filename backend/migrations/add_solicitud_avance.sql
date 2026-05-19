-- Migración: Agregar campo solicitud_avance a la tabla proyectos
-- Ejecutar esto en MySQL Workbench o en la consola de MySQL para actualizar la base de datos existente

USE vinculatec;

-- Agregar el campo solicitud_avance si no existe
ALTER TABLE proyectos 
ADD COLUMN IF NOT EXISTS solicitud_avance BOOLEAN DEFAULT FALSE;

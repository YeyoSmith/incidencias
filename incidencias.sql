-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS PARA PRODUCCIÓN
-- SISTEMA DE INCIDENCIAS SEMANALES
-- ============================================================

-- 1. Creación de la tabla de Catálogo de Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    area VARCHAR(50) NOT NULL, -- 'Desarrollo', 'Fiscal', 'Auditoría', etc.
    activo BOOLEAN DEFAULT 1   -- Permite dar de baja sin borrar historial
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Creación de la tabla de Histórico de Incidencias
CREATE TABLE IF NOT EXISTS historico_incidencias (
    id_incidencia INT AUTO_INCREMENT PRIMARY KEY,
    num_semana INT NOT NULL,
    anio INT NOT NULL,
    id_empleado INT NOT NULL,
    
    -- Campos de incidencias y excepciones (Días)
    faltas DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    vacaciones DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    permisos_con_goce DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    
    -- Campos operativos y de tiempo (Horas / Unidades)
    horas_extra INT NOT NULL DEFAULT 0,
    participacion INT NOT NULL DEFAULT 0,
    permiso_horas INT NOT NULL DEFAULT 0,
    
    -- Notas aclaratorias (Evitamos NULL usando 'Vacío' por defecto)
    comentarios VARCHAR(255) NOT NULL DEFAULT 'Vacío',
    
    -- Relación con el catálogo de empleados
    CONSTRAINT fk_incidencias_empleado 
        FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Inyección de la Columna Calculada (Blindada contra valores NULL)
-- Ejecuta la fórmula proporcional: 7 días menos faltas, menos el séptimo día proporcional (1/6 por falta), menos vacaciones.
ALTER TABLE historico_incidencias 
ADD COLUMN dias_periodo DECIMAL(4,2) 
GENERATED ALWAYS AS (
    7 - IFNULL(faltas, 0) - ((1/6) * IFNULL(faltas, 0)) - IFNULL(vacaciones, 0)
) STORED;

-- ============================================================
-- OPTIMIZACIÓN: Índices para búsquedas rápidas (Tablas de más de 10k filas)
-- ============================================================
CREATE INDEX idx_historico_busqueda ON historico_incidencias(num_semana, anio);
CREATE INDEX idx_empleados_area ON empleados(area, activo);
-- =====================================================================
-- Migración 01: catálogos del SRS (RF-13 y RF-23)
--
-- NUEVO: una migración lleva una base que YA tiene datos a la versión nueva
-- del esquema sin borrarla (db/esquema_sirai.sql sirve para bases nuevas).
--
-- Cambios:
--   1. cat_estado_asistencia: los 5 estados del SRS (se quita "retardo").
--   2. motivos_falta: columna "codigo" y las 5 causas del SRS.
--   3. Vistas reportes_asistencia y mi_asistencia con los nuevos estados.
--
-- Se corre una sola vez, con un usuario que pueda modificar tablas (root):
--   mysql --login-path=sirai sirai_dev < db/migracion_01_catalogos.sql
--
-- Seguridad: solo borra filas de catálogo que ninguna asistencia,
-- justificación o seguimiento usa. Si alguna está en uso, se conserva.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. Estados de asistencia
-- ---------------------------------------------------------------------

-- "falta" pasa a llamarse "falta_injustificada" (mismo id).
UPDATE cat_estado_asistencia
   SET codigo = 'falta_injustificada', nombre = 'Falta injustificada'
 WHERE codigo = 'falta';

-- "retardo" no está en el SRS: se borra solo si ninguna asistencia lo usa.
DELETE FROM cat_estado_asistencia
 WHERE codigo = 'retardo'
   AND id NOT IN (SELECT estado_id FROM asistencias);

-- NUEVO: INSERT IGNORE no hace nada si el código ya existe (es UNIQUE).
INSERT IGNORE INTO cat_estado_asistencia (codigo, nombre) VALUES
  ('presente',            'Presente'),
  ('falta_justificada',   'Falta justificada'),
  ('falta_injustificada', 'Falta injustificada'),
  ('licencia_medica',     'Licencia médica'),
  ('filtro_salud',        'Filtro de salud');

-- ---------------------------------------------------------------------
-- 2. Causas de falta
-- ---------------------------------------------------------------------

-- NUEVO: ALTER TABLE cambia la estructura de una tabla existente.
-- Primero la columna admite NULL para poder llenarla fila por fila.
ALTER TABLE motivos_falta ADD COLUMN codigo VARCHAR(10) NULL AFTER id;

UPDATE motivos_falta SET codigo = 'ENF_CASA' WHERE nombre = 'Enfermedad en casa';

-- Los motivos anteriores que no están en el SRS se borran si nadie los usa.
DELETE FROM motivos_falta
 WHERE codigo IS NULL
   AND id NOT IN (SELECT motivo_id FROM justificaciones)
   AND id NOT IN (SELECT motivo_id FROM seguimientos WHERE motivo_id IS NOT NULL);

INSERT IGNORE INTO motivos_falta (codigo, nombre) VALUES
  ('ENF_CASA', 'Enfermedad en casa'),
  ('ACC_EXT',  'Accidente fuera de la estancia'),
  ('PER_TUT',  'Permiso o trámite del tutor'),
  ('NO_LOC',   'No se localizó al tutor'),
  ('OTRO',     'Otro motivo');

-- Ahora el código es obligatorio y único, como en el esquema nuevo.
-- Si queda un motivo viejo en uso sin código, esta línea falla a propósito
-- para revisarlo a mano.
ALTER TABLE motivos_falta MODIFY codigo VARCHAR(10) NOT NULL, ADD UNIQUE KEY (codigo);

-- ---------------------------------------------------------------------
-- 3. Vistas (mismo texto que db/esquema_sirai.sql)
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS reportes_asistencia;
CREATE VIEW reportes_asistencia AS
SELECT
  CONCAT(e.id, '-', r.periodo)                             AS id,
  e.id                                                     AS estancia_id,
  e.nombre                                                 AS estancia_nombre,
  r.periodo                                                AS periodo,
  CAST(CONCAT(r.periodo, '-01') AS DATE)                   AS fecha_inicio,
  COUNT(*)                                                 AS total_registros,
  SUM(r.codigo IN ('presente', 'filtro_salud'))            AS presentes,
  SUM(r.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica'))
                                                           AS ausentes,
  ROUND(100 * SUM(r.codigo IN ('presente', 'filtro_salud')) / COUNT(*), 1)
                                                           AS porcentaje_asistencia
FROM (
  -- Primero se calcula el mes de cada registro; luego se agrupa.
  SELECT a.estancia_id, DATE_FORMAT(a.fecha, '%Y-%m') AS periodo, c.codigo
  FROM asistencias a
  JOIN cat_estado_asistencia c ON a.estado_id = c.id
) AS r
JOIN estancias e ON r.estancia_id = e.id
GROUP BY e.id, e.nombre, r.periodo;

DROP VIEW IF EXISTS mi_asistencia;
CREATE VIEW mi_asistencia AS
SELECT
  i.id                                                     AS id,
  it.tutor_id                                              AS tutor_id,
  i.nombre                                                 AS nombre,
  i.apellidos                                              AS apellidos,
  s.nombre                                                 AS sala_nombre,
  DATE_FORMAT(CURDATE(), '%Y-%m')                          AS periodo,
  (SELECT ROUND(100 * SUM(c.codigo IN ('presente', 'filtro_salud')) / COUNT(*), 1)
     FROM asistencias a
     JOIN cat_estado_asistencia c ON a.estado_id = c.id
    WHERE a.infante_id = i.id
      AND a.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND a.fecha <= CURDATE())                            AS porcentaje_asistencia,
  (SELECT c.nombre
     FROM asistencias a
     JOIN cat_estado_asistencia c ON a.estado_id = c.id
    WHERE a.infante_id = i.id AND a.fecha = CURDATE()
    ORDER BY a.registrado DESC
    LIMIT 1)                                               AS estado_hoy
FROM infantes i
JOIN infante_tutor it ON it.infante_id = i.id
JOIN salas s          ON i.sala_id = s.id
WHERE i.activo = TRUE;

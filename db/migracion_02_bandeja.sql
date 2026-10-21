-- =====================================================================
-- Migración 02: bandeja de faltas del doctor (RF-21 y RF-22)
--
-- Crea la vista bandeja_seguimientos en una base que ya existe.
-- No cambia ni borra datos. Se corre una sola vez:
--   mysql -u root -p sirai_dev < db/migracion_02_bandeja.sql
-- =====================================================================

SET NAMES utf8mb4;

DROP VIEW IF EXISTS bandeja_seguimientos;
-- Recurso "bandeja_seguimientos" (doctor/asesor, RF-21 y RF-22): una fila por
-- seguimiento con lo necesario para atenderlo y llamar al tutor.
-- La API filtra por la estancia del doctor; el profesor y el tutor no la ven
-- porque incluye contactos.
-- NUEVO: GROUP_CONCAT junta en un solo texto a todos los tutores del niño,
-- por ejemplo "María López (Madre): 55 1234 5678; Juan Pérez (Padre): ...".
CREATE VIEW bandeja_seguimientos AS
SELECT
  s.id                                                     AS id,
  s.asistencia_id                                          AS asistencia_id,
  a.estancia_id                                            AS estancia_id,
  a.fecha                                                  AS fecha,
  a.turno                                                  AS turno,
  CONCAT(i.nombre, ' ', i.apellidos)                       AS infante_nombre,
  sl.nombre                                                AS sala_nombre,
  c.nombre                                                 AS tipo_falta,
  s.estado                                                 AS estado,
  s.causa                                                  AS causa,
  s.fecha_retorno                                          AS fecha_retorno,
  (SELECT GROUP_CONCAT(
            CONCAT(t.nombre, ' ', t.apellidos, ' (', it.parentesco, '): ',
                   COALESCE(t.telefono, 'sin teléfono'))
            ORDER BY it.id SEPARATOR '; ')
     FROM infante_tutor it
     JOIN tutores t ON t.id = it.tutor_id
    WHERE it.infante_id = i.id)                            AS contactos
FROM seguimientos s
JOIN asistencias a           ON a.id = s.asistencia_id
JOIN infantes i              ON i.id = a.infante_id
JOIN salas sl                ON sl.id = a.sala_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id;

-- Esta migración permite actualizar la vista de la bandeja de seguimientos con información de faltas, infantes y contactos de sus tutores conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
SET NAMES utf8mb4;

DROP VIEW IF EXISTS bandeja_seguimientos;

CREATE VIEW bandeja_seguimientos AS
SELECT
  s.id AS id,
  s.asistencia_id AS asistencia_id,
  a.estancia_id AS estancia_id,
  a.fecha AS fecha,
  a.turno AS turno,
  CONCAT(i.nombre, ' ', i.apellidos) AS infante_nombre,
  sl.nombre AS sala_nombre,
  c.nombre AS tipo_falta,
  s.estado AS estado,
  s.causa AS causa,
  s.fecha_retorno AS fecha_retorno,
  (SELECT GROUP_CONCAT(
      CONCAT(t.nombre, ' ', t.apellidos, ' (', it.parentesco, '): ',
      COALESCE(t.telefono, 'sin teléfono'))
      ORDER BY it.id SEPARATOR '; ')
    FROM infante_tutor it
    JOIN tutores t ON t.id = it.tutor_id
    WHERE it.infante_id = i.id) AS contactos
FROM seguimientos s
JOIN asistencias a ON a.id = s.asistencia_id
JOIN infantes i ON i.id = a.infante_id
JOIN salas sl ON sl.id = a.sala_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id;

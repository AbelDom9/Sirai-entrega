-- Esta migración permite añadir el registro de intentos de contacto y actualizar las vistas relacionadas con alertas y seguimientos conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
SET NAMES utf8mb4;

ALTER TABLE seguimientos
  ADD COLUMN intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN ultimo_intento DATETIME NULL;

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
  s.intentos AS intentos,
  (SELECT GROUP_CONCAT(
      CONCAT(t.nombre, ' ', t.apellidos, ' (', it.parentesco, '): ',
      COALESCE(t.telefono, 'sin teléfono'))
      ORDER BY it.id SEPARATOR '; ')
    FROM infante_tutor it
    JOIN tutores t ON t.id = it.tutor_id
    WHERE it.infante_id = i.id) AS contactos,

  (SELECT GROUP_CONCAT(
      CONCAT(t.nombre, ' ', t.apellidos, ': ', COALESCE(t.telefono, 'sin teléfono'))
      ORDER BY it.id SEPARATOR '; ')
    FROM infante_tutor it
    JOIN tutores t ON t.id = it.tutor_id
    WHERE it.infante_id = i.id AND it.contact_emergencia = TRUE) AS contactos_emergencia,

  CASE
    WHEN s.estado = 'cerrado' THEN NULL
    WHEN m.codigo = 'NO_LOC' AND s.intentos = 1
      THEN CONCAT('Tutor no localizado. Segundo intento antes de las ',
      DATE_FORMAT(s.ultimo_intento + INTERVAL 4 HOUR, '%H:%i'),
      '. Avisar a los contactos de emergencia.')
    WHEN m.codigo = 'NO_LOC'
      THEN 'Tutor no localizado. Avisar a los contactos de emergencia.'
    WHEN m.codigo = 'ACC_EXT'
      THEN 'Expediente de accidente: anotar indicaciones de cuidado y plan de regreso.'
    ELSE NULL
  END AS alerta
FROM seguimientos s
JOIN asistencias a ON a.id = s.asistencia_id
JOIN infantes i ON i.id = a.infante_id
JOIN salas sl ON sl.id = a.sala_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id
LEFT JOIN motivos_falta m ON m.id = s.motivo_id;

DROP VIEW IF EXISTS mi_historial;
CREATE VIEW mi_historial AS
SELECT
  a.id AS id,
  a.infante_id AS infante_id,
  it.tutor_id AS tutor_id,
  a.fecha AS fecha,
  a.turno AS turno,
  a.hora_entrada AS hora_entrada,
  c.codigo AS estado_codigo,
  c.nombre AS estado_nombre,
  (c.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica')) AS es_falta,
  EXISTS (SELECT 1 FROM justificaciones j WHERE j.asistencia_id = a.id) AS justificada
FROM asistencias a
JOIN infante_tutor it ON it.infante_id = a.infante_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id;

-- Para elaborar el esquema de la base de datos, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender la estructura de las tablas y sus relaciones.
SET NAMES utf8mb4;

CREATE TABLE roles (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(60) NOT NULL,
  CHECK (codigo IN ('administrador', 'profesor', 'doctor_asesor', 'tutor'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (codigo, nombre) VALUES
  ('administrador', 'Administrador central'),
  ('profesor', 'Profesor / Educadora'),
  ('doctor_asesor', 'Doctor / Asesor'),
  ('tutor', 'Padre / Tutor');

CREATE TABLE estatus_infante (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO estatus_infante (codigo, nombre) VALUES
  ('inscrito', 'Inscrito'),
  ('baja_temporal', 'Baja temporal'),
  ('baja_definitiva', 'Baja definitiva');

CREATE TABLE cat_estado_asistencia (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO cat_estado_asistencia (codigo, nombre) VALUES
  ('presente', 'Presente'),
  ('falta_justificada', 'Falta justificada'),
  ('falta_injustificada', 'Falta injustificada'),
  ('licencia_medica', 'Licencia médica'),
  ('filtro_salud', 'Filtro de salud');

CREATE TABLE motivos_falta (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO motivos_falta (codigo, nombre) VALUES
  ('ENF_CASA', 'Enfermedad en casa'),
  ('ACC_EXT', 'Accidente fuera de la estancia'),
  ('PER_TUT', 'Permiso o trámite del tutor'),
  ('NO_LOC', 'No se localizó al tutor'),
  ('OTRO', 'Otro motivo');

CREATE TABLE motivos_baja (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO motivos_baja (descripcion) VALUES
  ('Cambio de domicilio'),
  ('Cambio de estancia'),
  ('Edad máxima cumplida'),
  ('Decisión de la familia'),
  ('Otro');

CREATE TABLE estancias (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave_ebdi SMALLINT UNSIGNED NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  estado VARCHAR(60) NOT NULL,
  ur VARCHAR(3) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estancia_id SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  grupo_edad VARCHAR(40) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  UNIQUE KEY (estancia_id, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE infantes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(10) NOT NULL UNIQUE,
  curp CHAR(18) NULL UNIQUE,
  nombre VARCHAR(80) NOT NULL,
  apellidos VARCHAR(160) NOT NULL,
  genero CHAR(1) NULL,
  fecha_nacimiento DATE NOT NULL,
  sala_id INT UNSIGNED NOT NULL,
  estatus_id TINYINT UNSIGNED NOT NULL,
  discapacidad VARCHAR(50) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro DATE NOT NULL,
  fecha_baja DATE NULL,
  motivo_baja_id TINYINT UNSIGNED NULL,
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (estatus_id) REFERENCES estatus_infante(id),
  FOREIGN KEY (motivo_baja_id) REFERENCES motivos_baja(id),
  KEY (sala_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellidos VARCHAR(160) NOT NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(120) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE infante_tutor (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id INT UNSIGNED NOT NULL,
  tutor_id INT UNSIGNED NOT NULL,
  parentesco VARCHAR(40) NOT NULL,
  autorizado_recoger BOOLEAN NOT NULL DEFAULT FALSE,
  contact_emergencia BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (tutor_id) REFERENCES tutores(id),
  UNIQUE KEY (infante_id, tutor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id TINYINT UNSIGNED NOT NULL,
  estancia_id SMALLINT UNSIGNED NULL,
  sala_id INT UNSIGNED NULL,
  tutor_id INT UNSIGNED NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (tutor_id) REFERENCES tutores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asistencias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id INT UNSIGNED NOT NULL,
  sala_id INT UNSIGNED NOT NULL,
  estancia_id SMALLINT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  turno VARCHAR(10) NOT NULL,
  estado_id TINYINT UNSIGNED NOT NULL,
  incidencia VARCHAR(255) NULL,
  usuario_id INT UNSIGNED NOT NULL,
  registrado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hora_entrada TIME NULL,
  hora_salida TIME NULL,
  metodo VARCHAR(10) not null default 'manual',
  CHECK (turno IN ('matutino', 'vespertino')),
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (estado_id) REFERENCES cat_estado_asistencia(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY (infante_id, fecha, turno),
  KEY (sala_id, fecha, turno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE justificaciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id INT UNSIGNED NOT NULL,
  tutor_id INT UNSIGNED NOT NULL,
  motivo_id TINYINT UNSIGNED NOT NULL,
  comentario VARCHAR(500) NULL,
  registrado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
  FOREIGN KEY (tutor_id) REFERENCES tutores(id),
  FOREIGN KEY (motivo_id) REFERENCES motivos_falta(id),
  UNIQUE KEY (asistencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seguimientos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id INT UNSIGNED NOT NULL,
  responsable_id INT UNSIGNED NULL,
  motivo_id TINYINT UNSIGNED NULL,
  causa VARCHAR(255) NULL,
  registro_llamada VARCHAR(1000) NULL,
  fecha_retorno DATE NULL,
  requiere_alta BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_alta DATE NULL,
  estado VARCHAR(12) NOT NULL DEFAULT 'pendiente',
  intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ultimo_intento DATETIME NULL,
  CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
  FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
  FOREIGN KEY (motivo_id) REFERENCES motivos_falta(id),
  UNIQUE KEY (asistencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE movimientos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  valor_antes VARCHAR(50) NULL,
  valor_despues VARCHAR(50) NULL,
  usuario_id INT UNSIGNED NOT NULL,
  registrado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  KEY (infante_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE padron_mensual (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  periodo DATE NOT NULL,
  infante_id INT UNSIGNED NOT NULL,
  estancia_id SMALLINT UNSIGNED NOT NULL,
  estatus_id TINYINT UNSIGNED NOT NULL,
  inscripcion_inicial BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (estatus_id) REFERENCES estatus_infante(id),
  UNIQUE KEY (periodo, infante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE avisos_privacidad (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  texto TEXT NOT NULL,
  vigente BOOLEAN NOT NULL DEFAULT FALSE,
  publicado DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE consentimientos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT UNSIGNED NOT NULL,
  aviso_id INT UNSIGNED NOT NULL,
  aceptado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES tutores(id),
  FOREIGN KEY (aviso_id) REFERENCES avisos_privacidad(id),
  UNIQUE KEY (tutor_id, aviso_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE log (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sujeto VARCHAR(120) NOT NULL,
  accion VARCHAR(60) NOT NULL,
  objeto VARCHAR(120) NOT NULL,
  KEY (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE VIEW reportes_asistencia AS
SELECT
  CONCAT(e.id, '-', r.periodo) AS id,
  e.id AS estancia_id,
  e.nombre AS estancia_nombre,
  e.estado AS estado,
  e.ur AS ur,
  r.periodo AS periodo,
  CAST(CONCAT(r.periodo, '-01') AS DATE) AS fecha_inicio,
  COUNT(*) AS total_registros,
  SUM(r.codigo IN ('presente', 'filtro_salud')) AS presentes,
  SUM(r.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica'))
      AS ausentes,
  ROUND(100 * SUM(r.codigo IN ('presente', 'filtro_salud')) / COUNT(*), 1)
      AS porcentaje_asistencia
FROM (
  SELECT a.estancia_id, DATE_FORMAT(a.fecha, '%Y-%m') AS periodo, c.codigo
  FROM asistencias a
  JOIN cat_estado_asistencia c ON a.estado_id = c.id
) AS r
JOIN estancias e ON r.estancia_id = e.id
GROUP BY e.id, e.nombre, r.periodo, e.estado, e.ur;

CREATE VIEW mi_asistencia AS
SELECT
  i.id AS id,
  it.tutor_id AS tutor_id,
  i.nombre AS nombre,
  i.apellidos AS apellidos,
  s.nombre AS sala_nombre,
  DATE_FORMAT(CURDATE(), '%Y-%m') AS periodo,
  (SELECT ROUND(100 * SUM(c.codigo IN ('presente', 'filtro_salud')) / COUNT(*), 1)
    FROM asistencias a
    JOIN cat_estado_asistencia c ON a.estado_id = c.id
    WHERE a.infante_id = i.id
      AND a.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND a.fecha <= CURDATE()) AS porcentaje_asistencia,
  (SELECT c.nombre
    FROM asistencias a
    JOIN cat_estado_asistencia c ON a.estado_id = c.id
    WHERE a.infante_id = i.id AND a.fecha = CURDATE()
    ORDER BY a.registrado DESC
    LIMIT 1) AS estado_hoy
FROM infantes i
JOIN infante_tutor it ON it.infante_id = i.id
JOIN salas s ON i.sala_id = s.id
WHERE i.activo = TRUE;

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

CREATE VIEW alta_pendiente AS
SELECT
  s.id AS id,
  i.id AS infante_id,
  i.sala_id AS sala_id,
  sl.estancia_id AS estancia_id
FROM seguimientos s
JOIN asistencias a ON a.id = s.asistencia_id
JOIN infantes i ON i.id = a.infante_id
JOIN salas sl ON sl.id = i.sala_id
WHERE s.requiere_alta = TRUE
  AND s.fecha_alta IS NULL;

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
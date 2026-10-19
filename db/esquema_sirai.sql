-- =====================================================================
-- SIRAI: esquema combinado (PROPUESTA para revisar con el equipo de BD/API)
--
-- Combina:
--   - Nombres de la API de Capi/Emilio y del frontend (infantes, salas,
--     apellidos, fecha_nacimiento, sala_id, activo).
--   - Ideas del padrón de Pablo (db/scheme_padron.sql): CURP única,
--     baja lógica con fecha y motivo, historial de movimientos y
--     padrón mensual.
--   - Lo que faltaba para roles y permisos: roles, usuarios, tutores,
--     asistencias, justificaciones, seguimientos y consentimientos.
--
-- Reglas que sigue:
--   - Cada tabla tiene "id" porque React-admin (Simple REST) lo necesita.
--   - Nombres en plural y snake_case, como los recursos del frontend.
--   - No se borra: se usa activo = FALSE (baja lógica).
--   - No incluye usuarios ni contraseñas de ejemplo.
--
-- MySQL 8.0.16+ o MariaDB 10.4+. Probado en MySQL 8.0.28 (base local sirai_dev, 19 oct 2026).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. Catálogos
-- ---------------------------------------------------------------------

-- Los cuatro perfiles del reporte. "codigo" es lo que devuelve POST /login
-- como "rol" y lo que compara src/permisos.ts del frontend.
CREATE TABLE roles (
  id      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo  VARCHAR(20)  NOT NULL UNIQUE,
  nombre  VARCHAR(60)  NOT NULL,
  CHECK (codigo IN ('administrador', 'profesor', 'doctor_asesor', 'tutor'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (codigo, nombre) VALUES
  ('administrador', 'Administrador central'),
  ('profesor',      'Profesor / Educadora'),
  ('doctor_asesor', 'Doctor / Asesor'),
  ('tutor',         'Padre / Tutor');

-- Estatus de inscripción del infante (de Pablo: estrato/situación).
CREATE TABLE estatus_infante (
  id      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo  VARCHAR(20)  NOT NULL UNIQUE,
  nombre  VARCHAR(60)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO estatus_infante (codigo, nombre) VALUES
  ('inscrito',        'Inscrito'),
  ('baja_temporal',   'Baja temporal'),
  ('baja_definitiva', 'Baja definitiva');

-- Estados del pase de lista. El frontend busca codigo = 'presente'
-- para el botón "Todos presentes".
CREATE TABLE cat_estado_asistencia (
  id      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo  VARCHAR(20)  NOT NULL UNIQUE,
  nombre  VARCHAR(60)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO cat_estado_asistencia (codigo, nombre) VALUES
  ('presente', 'Presente'),
  ('falta',    'Falta'),
  ('retardo',  'Retardo');

-- Motivos de falta en lenguaje sencillo (Tabla 15 del reporte).
CREATE TABLE motivos_falta (
  id      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO motivos_falta (nombre) VALUES
  ('Enfermedad en casa'),
  ('Cita médica'),
  ('Asunto familiar'),
  ('Vacaciones'),
  ('Sin motivo informado');

-- Motivos de baja (de Pablo: motivo_baja).
CREATE TABLE motivos_baja (
  id           TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  descripcion  VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO motivos_baja (descripcion) VALUES
  ('Cambio de domicilio'),
  ('Cambio de estancia'),
  ('Edad máxima cumplida'),
  ('Decisión de la familia'),
  ('Otro');

-- ---------------------------------------------------------------------
-- 2. Estructura institucional
-- ---------------------------------------------------------------------

-- Estancias (de Pablo: tabla ebdi). clave_ebdi es el número que ya usa
-- el ISSSTE; id es la llave que necesita React-admin.
CREATE TABLE estancias (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave_ebdi  SMALLINT UNSIGNED NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  estado      VARCHAR(60)  NOT NULL,
  ur          VARCHAR(3)   NOT NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salas (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estancia_id  SMALLINT UNSIGNED NOT NULL,
  nombre       VARCHAR(80)  NOT NULL,
  grupo_edad   VARCHAR(40)  NULL,
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  UNIQUE KEY (estancia_id, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. Infantes y tutores
-- ---------------------------------------------------------------------

-- Nombres de Capi/frontend + campos del padrón de Pablo.
CREATE TABLE infantes (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  matricula         VARCHAR(10)  NOT NULL UNIQUE,
  curp              CHAR(18)     NULL UNIQUE,
  nombre            VARCHAR(80)  NOT NULL,
  apellidos         VARCHAR(160) NOT NULL,
  genero            CHAR(1)      NULL,
  fecha_nacimiento  DATE         NOT NULL,
  sala_id           INT UNSIGNED NOT NULL,
  estatus_id        TINYINT UNSIGNED NOT NULL,
  discapacidad      VARCHAR(50)  NULL,              -- NULL = sin discapacidad
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  fecha_registro    DATE         NOT NULL,
  fecha_baja        DATE         NULL,
  motivo_baja_id    TINYINT UNSIGNED NULL,
  FOREIGN KEY (sala_id)        REFERENCES salas(id),
  FOREIGN KEY (estatus_id)     REFERENCES estatus_infante(id),
  FOREIGN KEY (motivo_baja_id) REFERENCES motivos_baja(id),
  KEY (sala_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos de contacto: el profesor no debe recibirlos (lo filtra la API).
CREATE TABLE tutores (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(80)  NOT NULL,
  apellidos  VARCHAR(160) NOT NULL,
  telefono   VARCHAR(20)  NULL,
  correo     VARCHAR(120) NULL,
  activo     BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Un infante puede tener varios tutores y un tutor varios hijos.
CREATE TABLE infante_tutor (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id          INT UNSIGNED NOT NULL,
  tutor_id            INT UNSIGNED NOT NULL,
  parentesco          VARCHAR(40)  NOT NULL,
  autorizado_recoger  BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (tutor_id)   REFERENCES tutores(id),
  UNIQUE KEY (infante_id, tutor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. Usuarios del sistema (login y roles)
-- ---------------------------------------------------------------------

-- POST /login busca por correo, compara password_hash y responde:
--   { token, id, fullName: nombre, rol: roles.codigo }
-- estancia_id / sala_id / tutor_id sirven para que la API filtre datos:
--   profesor -> su sala; doctor_asesor -> su estancia; tutor -> sus hijos.
CREATE TABLE usuarios (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(160) NOT NULL,
  correo         VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,             -- nunca la contraseña en texto
  rol_id         TINYINT UNSIGNED NOT NULL,
  estancia_id    SMALLINT UNSIGNED NULL,
  sala_id        INT UNSIGNED NULL,
  tutor_id       INT UNSIGNED NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (rol_id)      REFERENCES roles(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (sala_id)     REFERENCES salas(id),
  FOREIGN KEY (tutor_id)    REFERENCES tutores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. Asistencia y seguimiento
-- ---------------------------------------------------------------------

-- Una fila por niño, fecha y turno. La llave única evita duplicados
-- cuando el pase de lista se guarda dos veces (POST /asistencias/lote).
CREATE TABLE asistencias (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id   INT UNSIGNED NOT NULL,
  sala_id      INT UNSIGNED NOT NULL,
  estancia_id  SMALLINT UNSIGNED NOT NULL,
  fecha        DATE         NOT NULL,
  turno        VARCHAR(10)  NOT NULL,
  estado_id    TINYINT UNSIGNED NOT NULL,
  incidencia   VARCHAR(255) NULL,
  usuario_id   INT UNSIGNED NOT NULL,              -- quién pasó lista
  registrado   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (turno IN ('matutino', 'vespertino')),
  FOREIGN KEY (infante_id)  REFERENCES infantes(id),
  FOREIGN KEY (sala_id)     REFERENCES salas(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (estado_id)   REFERENCES cat_estado_asistencia(id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
  UNIQUE KEY (infante_id, fecha, turno),
  KEY (sala_id, fecha, turno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Justificación enviada por el tutor. "comentario" puede tener datos
-- médicos: la API no debe enviarlo al profesor.
CREATE TABLE justificaciones (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id  INT UNSIGNED NOT NULL,
  tutor_id       INT UNSIGNED NOT NULL,
  motivo_id      TINYINT UNSIGNED NOT NULL,
  comentario     VARCHAR(500) NULL,
  registrado     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
  FOREIGN KEY (tutor_id)      REFERENCES tutores(id),
  FOREIGN KEY (motivo_id)     REFERENCES motivos_falta(id),
  UNIQUE KEY (asistencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seguimiento de una falta por el doctor/asesor.
CREATE TABLE seguimientos (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id     INT UNSIGNED NOT NULL,
  responsable_id    INT UNSIGNED NULL,               -- usuario doctor_asesor
  motivo_id         TINYINT UNSIGNED NULL,
  causa             VARCHAR(255) NULL,
  registro_llamada  VARCHAR(1000) NULL,
  fecha_retorno     DATE         NULL,
  requiere_alta     BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_alta        DATE         NULL,
  estado            VARCHAR(12)  NOT NULL DEFAULT 'pendiente',
  CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
  FOREIGN KEY (asistencia_id)  REFERENCES asistencias(id),
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
  FOREIGN KEY (motivo_id)      REFERENCES motivos_falta(id),
  UNIQUE KEY (asistencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. Historial y padrón (ideas de Pablo)
-- ---------------------------------------------------------------------

-- Historial de cambios del infante: ALTA, BAJA, CAMBIO_SALA, CAMBIO_ESTATUS...
CREATE TABLE movimientos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id     INT UNSIGNED NOT NULL,
  fecha          DATE         NOT NULL,
  tipo           VARCHAR(20)  NOT NULL,
  valor_antes    VARCHAR(50)  NULL,
  valor_despues  VARCHAR(50)  NULL,
  usuario_id     INT UNSIGNED NOT NULL,
  registrado     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  KEY (infante_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Una fila por niño por mes (periodo siempre día 1, p. ej. 2026-10-01).
CREATE TABLE padron_mensual (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  periodo              DATE         NOT NULL,
  infante_id           INT UNSIGNED NOT NULL,
  estancia_id          SMALLINT UNSIGNED NOT NULL,
  estatus_id           TINYINT UNSIGNED NOT NULL,
  inscripcion_inicial  BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (infante_id)  REFERENCES infantes(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (estatus_id)  REFERENCES estatus_infante(id),
  UNIQUE KEY (periodo, infante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7. Aviso de privacidad y consentimiento
-- ---------------------------------------------------------------------

CREATE TABLE avisos_privacidad (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version   VARCHAR(20)  NOT NULL UNIQUE,
  texto     TEXT         NOT NULL,
  vigente   BOOLEAN      NOT NULL DEFAULT FALSE,
  publicado DATE         NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- La API toma tutor_id de la sesión, no del formulario.
CREATE TABLE consentimientos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tutor_id    INT UNSIGNED NOT NULL,
  aviso_id    INT UNSIGNED NOT NULL,
  aceptado    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES tutores(id),
  FOREIGN KEY (aviso_id) REFERENCES avisos_privacidad(id),
  UNIQUE KEY (tutor_id, aviso_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 8. Vistas que usa el frontend
-- ---------------------------------------------------------------------

-- Recurso "reportes_asistencia" (administrador): cifras por estancia y mes,
-- SIN nombres ni CURP de infantes (Tabla 14 del reporte).
-- "retardo" cuenta como asistencia; "falta" como ausencia.
-- La API aplica los filtros del frontend:
--   desde/hasta -> sobre fecha_inicio;  estancia_id -> sobre estancia_id.
CREATE VIEW reportes_asistencia AS
SELECT
  CONCAT(e.id, '-', r.periodo)                             AS id,
  e.id                                                     AS estancia_id,
  e.nombre                                                 AS estancia_nombre,
  r.periodo                                                AS periodo,
  CONCAT(r.periodo, '-01')                                 AS fecha_inicio,
  COUNT(*)                                                 AS total_registros,
  SUM(r.codigo IN ('presente', 'retardo'))                 AS presentes,
  SUM(r.codigo = 'falta')                                  AS ausentes,
  ROUND(100 * SUM(r.codigo IN ('presente', 'retardo')) / COUNT(*), 1)
                                                           AS porcentaje_asistencia
FROM (
  -- Primero se calcula el mes de cada registro; luego se agrupa.
  SELECT a.estancia_id, DATE_FORMAT(a.fecha, '%Y-%m') AS periodo, c.codigo
  FROM asistencias a
  JOIN cat_estado_asistencia c ON a.estado_id = c.id
) AS r
JOIN estancias e ON r.estancia_id = e.id
GROUP BY e.id, e.nombre, r.periodo;

-- Recurso "mi_asistencia" (tutor): una fila por hijo con su asistencia del
-- mes actual y el estado de hoy. La API DEBE filtrar con
--   WHERE tutor_id = <tutor_id del usuario de la sesión>
-- para que cada tutor vea solo a sus hijos.
CREATE VIEW mi_asistencia AS
SELECT
  i.id                                                     AS id,
  it.tutor_id                                              AS tutor_id,
  i.nombre                                                 AS nombre,
  i.apellidos                                              AS apellidos,
  s.nombre                                                 AS sala_nombre,
  DATE_FORMAT(CURDATE(), '%Y-%m')                          AS periodo,
  (SELECT ROUND(100 * SUM(c.codigo IN ('presente', 'retardo')) / COUNT(*), 1)
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

-- ---------------------------------------------------------------------
-- Consultas de ejemplo
-- ---------------------------------------------------------------------

-- Lo que hoy devuelve GET /api/infantes de Capi, más los ids que pide React-admin:
-- SELECT i.id, i.matricula, i.curp, i.nombre, i.apellidos, i.fecha_nacimiento,
--        i.sala_id, i.estatus_id, s.nombre AS sala
-- FROM infantes i JOIN salas s ON i.sala_id = s.id
-- WHERE i.activo = TRUE;

-- Login: rol como código para el frontend.
-- SELECT u.id, u.nombre AS fullName, u.password_hash, r.codigo AS rol
-- FROM usuarios u JOIN roles r ON u.rol_id = r.id
-- WHERE u.correo = ? AND u.activo = TRUE;

-- Cierre de mes (de Pablo):
-- INSERT INTO padron_mensual (periodo, infante_id, estancia_id, estatus_id)
-- SELECT '2026-10-01', i.id, s.estancia_id, i.estatus_id
-- FROM infantes i JOIN salas s ON i.sala_id = s.id
-- WHERE i.activo = TRUE OR i.fecha_baja >= '2026-10-01';

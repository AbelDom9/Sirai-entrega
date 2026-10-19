-- =====================================================================
-- SIRAI: versión sencilla. Una tabla por recurso de App.tsx,
-- con los mismos campos que usan las pantallas. MySQL 8.0
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Catálogos (catalogos.tsx: id y nombre)
-- ---------------------------------------------------------------------

CREATE TABLE roles (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE estatus_infante (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cat_estado_asistencia (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo  VARCHAR(30) NOT NULL UNIQUE,   -- PaseLista busca codigo = 'presente'
  nombre  VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE motivos_falta (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Estancias, salas y usuarios
-- ---------------------------------------------------------------------

CREATE TABLE estancias (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave_ebdi  VARCHAR(10)  NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  estado      VARCHAR(50)  NOT NULL,
  ur          VARCHAR(3)   NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salas (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estancia_id  INT UNSIGNED NOT NULL,
  nombre       VARCHAR(80) NOT NULL,
  grupo_edad   VARCHAR(50) NOT NULL,
  FOREIGN KEY (estancia_id) REFERENCES estancias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  correo       VARCHAR(150) NOT NULL UNIQUE,
  rol_id       INT UNSIGNED NOT NULL,
  estancia_id  INT UNSIGNED NULL,
  FOREIGN KEY (rol_id)      REFERENCES roles(id),
  FOREIGN KEY (estancia_id) REFERENCES estancias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Infantes y tutores
-- ---------------------------------------------------------------------

CREATE TABLE infantes (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  matricula         VARCHAR(10)  NOT NULL,
  curp              CHAR(18)     NOT NULL UNIQUE,
  nombre            VARCHAR(80)  NOT NULL,
  apellidos         VARCHAR(160) NOT NULL,
  fecha_nacimiento  DATE         NOT NULL,
  sala_id           INT UNSIGNED NOT NULL,
  estatus_id        INT UNSIGNED NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,   -- borrado lógico
  FOREIGN KEY (sala_id)    REFERENCES salas(id),
  FOREIGN KEY (estatus_id) REFERENCES estatus_infante(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutores (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(80)  NOT NULL,
  apellidos  VARCHAR(160) NOT NULL,
  telefono   VARCHAR(20)  NULL,
  correo     VARCHAR(150) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE infante_tutor (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id          INT UNSIGNED NOT NULL,
  tutor_id            INT UNSIGNED NOT NULL,
  parentesco          VARCHAR(30) NOT NULL,
  autorizado_recoger  BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (infante_id) REFERENCES infantes(id),
  FOREIGN KEY (tutor_id)   REFERENCES tutores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Asistencia, justificaciones y seguimiento
-- ---------------------------------------------------------------------

CREATE TABLE asistencias (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  estancia_id  INT UNSIGNED NOT NULL,
  sala_id      INT UNSIGNED NOT NULL,
  infante_id   INT UNSIGNED NOT NULL,
  fecha        DATE NOT NULL,
  turno        VARCHAR(10) NOT NULL,      -- matutino o vespertino
  estado_id    INT UNSIGNED NOT NULL,
  incidencia   VARCHAR(500) NULL,
  FOREIGN KEY (estancia_id) REFERENCES estancias(id),
  FOREIGN KEY (sala_id)     REFERENCES salas(id),
  FOREIGN KEY (infante_id)  REFERENCES infantes(id),
  FOREIGN KEY (estado_id)   REFERENCES cat_estado_asistencia(id),
  UNIQUE KEY (infante_id, fecha, turno)   -- un registro por niño, día y turno
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE justificaciones (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id  INT UNSIGNED NOT NULL,
  tutor_id       INT UNSIGNED NOT NULL,
  motivo_id      INT UNSIGNED NOT NULL,
  comentario     VARCHAR(500) NULL,
  FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
  FOREIGN KEY (tutor_id)      REFERENCES tutores(id),
  FOREIGN KEY (motivo_id)     REFERENCES motivos_falta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seguimientos (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  asistencia_id     INT UNSIGNED NOT NULL,
  responsable_id    INT UNSIGNED NOT NULL,
  motivo_id         INT UNSIGNED NULL,
  causa             VARCHAR(500) NULL,
  registro_llamada  VARCHAR(500) NULL,
  fecha_retorno     DATE NULL,
  requiere_alta     BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_alta        DATE NULL,
  estado            VARCHAR(15) NOT NULL DEFAULT 'pendiente',  -- pendiente, contactado, cerrado
  FOREIGN KEY (asistencia_id)  REFERENCES asistencias(id),
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
  FOREIGN KEY (motivo_id)      REFERENCES motivos_falta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Aviso de privacidad
-- ---------------------------------------------------------------------

CREATE TABLE avisos_privacidad (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version  VARCHAR(20) NOT NULL UNIQUE,
  texto    TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE consentimientos (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  aviso_id  INT UNSIGNED NOT NULL,
  tutor_id  INT UNSIGNED NOT NULL,
  version   VARCHAR(20) NOT NULL,          -- AvisoPrivacidad.tsx la envía
  aceptado  BOOLEAN NOT NULL,
  fecha     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aviso_id) REFERENCES avisos_privacidad(id),
  FOREIGN KEY (tutor_id) REFERENCES tutores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Reporte por estancia y mes (reportes.tsx, recurso reportes_asistencia)
-- La API filtra desde/hasta sobre periodo y estancia_id.
-- ---------------------------------------------------------------------

CREATE VIEW reportes_asistencia AS
SELECT
  CONCAT(r.estancia_id, '-', r.periodo)       AS id,
  r.estancia_id,
  e.nombre                                    AS estancia_nombre,
  r.periodo,
  COUNT(*)                                    AS total_registros,
  SUM(r.presente)                             AS presentes,
  SUM(1 - r.presente)                         AS ausentes,
  ROUND(100 * SUM(r.presente) / COUNT(*), 1)  AS porcentaje_asistencia
FROM (
  SELECT a.estancia_id,
         DATE_FORMAT(a.fecha, '%Y-%m') AS periodo,
         (c.codigo = 'presente')       AS presente
  FROM asistencias a
  JOIN cat_estado_asistencia c ON c.id = a.estado_id
) r
JOIN estancias e ON e.id = r.estancia_id
GROUP BY r.estancia_id, e.nombre, r.periodo;

-- ---------------------------------------------------------------------
-- Datos iniciales de catálogos (MODULOS_SIRAI.md)
-- ---------------------------------------------------------------------

INSERT INTO roles (nombre) VALUES
  ('Administrador'), ('Doctor/asesor'), ('Profesor'), ('Tutor');

INSERT INTO estatus_infante (nombre) VALUES
  ('Inscrito'), ('Baja');

INSERT INTO cat_estado_asistencia (codigo, nombre) VALUES
  ('presente',            'Presente'),
  ('ausente_justificado', 'Ausente justificado'),
  ('falta_injustificada', 'Falta injustificada'),
  ('comision_medica',     'Comisión médica'),
  ('filtro_sanitario',    'Filtro sanitario');

INSERT INTO motivos_falta (nombre) VALUES
  ('Enfermedad'), ('Accidente'), ('Permiso'), ('Otro'), ('Falta de respuesta');

-- ---------------------------------------------------------------------
-- Consultas que usará la API
-- ---------------------------------------------------------------------

-- Pase de lista: niños activos de una sala
-- SELECT * FROM infantes WHERE sala_id = 1 AND activo = TRUE;

-- Reportes con filtros (reportes.tsx)
-- SELECT * FROM reportes_asistencia
-- WHERE periodo BETWEEN '2026-09' AND '2026-10' AND estancia_id = 1;

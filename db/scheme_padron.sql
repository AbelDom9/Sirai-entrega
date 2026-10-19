-- =====================================================================
-- Padrón de infantes: versión sencilla
-- 3 tablas principales + 2 catálogos. MariaDB 10.4+
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------

CREATE TABLE ebdi (
  ebdi    SMALLINT UNSIGNED NOT NULL PRIMARY KEY,   -- el número que ya usan
  ur      VARCHAR(3)   NOT NULL,
  nombre  VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE motivo_baja (
  id           TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  descripcion  VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 1. infante: un registro por niño, con su situación ACTUAL
-- ---------------------------------------------------------------------

CREATE TABLE infante (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  matricula         VARCHAR(10) NOT NULL,
  curp              CHAR(18)    NULL UNIQUE,
  nombre            VARCHAR(80) NOT NULL,
  paterno           VARCHAR(80) NOT NULL,
  materno           VARCHAR(80) NULL,
  genero            CHAR(1)     NOT NULL,
  fnac              DATE        NOT NULL,
  ebdi              SMALLINT UNSIGNED NOT NULL,
  estrato           VARCHAR(3)  NOT NULL,
  discapacidad      VARCHAR(50) NULL,           -- NULL = sin discapacidad
  freg              DATE        NOT NULL,
  fbaja             DATE        NULL,           -- NULL = activo
  motivo_baja       TINYINT UNSIGNED NULL,
  comentario        VARCHAR(500) NULL,
  usuario           VARCHAR(50) NOT NULL,
  fsistema          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ebdi)        REFERENCES ebdi(ebdi),
  FOREIGN KEY (motivo_baja) REFERENCES motivo_baja(id),
  KEY (matricula),
  KEY (ebdi, fbaja)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. movimiento: historial de cambios (reemplaza todos los *Ant / *Pos)
-- ---------------------------------------------------------------------

CREATE TABLE movimiento (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id    INT UNSIGNED NOT NULL,
  fecha         DATE        NOT NULL,
  tipo          VARCHAR(15) NOT NULL,   -- ALTA, BAJA, CAMBIO_EBDI, CAMBIO_ESTRATO...
  valor_antes   VARCHAR(20) NULL,       -- p.ej. EBDI 12
  valor_despues VARCHAR(20) NULL,       -- p.ej. EBDI 35
  usuario       VARCHAR(50) NOT NULL,
  fsistema      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (infante_id) REFERENCES infante(id),
  KEY (infante_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. padron_mensual: una fila por niño por mes
--    (reemplaza las ~70 columnas inscIni* y las copias mensuales de la base)
-- ---------------------------------------------------------------------

CREATE TABLE padron_mensual (
  periodo              DATE NOT NULL,          -- siempre día 1: 2026-08-01
  infante_id           INT UNSIGNED NOT NULL,
  ebdi                 SMALLINT UNSIGNED NOT NULL,
  estrato              VARCHAR(3) NOT NULL,
  inscripcion_inicial  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (periodo, infante_id),
  FOREIGN KEY (infante_id) REFERENCES infante(id),
  FOREIGN KEY (ebdi)       REFERENCES ebdi(ebdi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Uso diario
-- ---------------------------------------------------------------------

-- Niños activos
-- SELECT * FROM infante WHERE fbaja IS NULL;

-- Cierre de mes (una sola sentencia, sin ALTER TABLE)
-- INSERT INTO padron_mensual (periodo, infante_id, ebdi, estrato)
-- SELECT '2026-10-01', id, ebdi, estrato
-- FROM infante
-- WHERE fbaja IS NULL OR fbaja >= '2026-10-01';

-- Inscripciones iniciales por EBDI y mes
-- SELECT ebdi, periodo, SUM(inscripcion_inicial) AS iniciales, COUNT(*) AS total
-- FROM padron_mensual
-- GROUP BY ebdi, periodo;

-- Para elaborar el esquema del padrón de infantes, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender la organización de los registros, los motivos de baja y las relaciones entre las tablas.
SET NAMES utf8mb4;

CREATE TABLE ebdi (
  ebdi SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
  ur VARCHAR(3) NOT NULL,
  nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE motivo_baja (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE infante (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(10) NOT NULL,
  curp CHAR(18) NULL UNIQUE,
  nombre VARCHAR(80) NOT NULL,
  paterno VARCHAR(80) NOT NULL,
  materno VARCHAR(80) NULL,
  genero CHAR(1) NOT NULL,
  fnac DATE NOT NULL,
  ebdi SMALLINT UNSIGNED NOT NULL,
  estrato VARCHAR(3) NOT NULL,
  discapacidad VARCHAR(50) NULL,
  freg DATE NOT NULL,
  fbaja DATE NULL,
  motivo_baja TINYINT UNSIGNED NULL,
  comentario VARCHAR(500) NULL,
  usuario VARCHAR(50) NOT NULL,
  fsistema DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ebdi) REFERENCES ebdi(ebdi),
  FOREIGN KEY (motivo_baja) REFERENCES motivo_baja(id),
  KEY (matricula),
  KEY (ebdi, fbaja)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE movimiento (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  infante_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  tipo VARCHAR(15) NOT NULL,
  valor_antes VARCHAR(20) NULL,
  valor_despues VARCHAR(20) NULL,
  usuario VARCHAR(50) NOT NULL,
  fsistema DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (infante_id) REFERENCES infante(id),
  KEY (infante_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE padron_mensual (
  periodo DATE NOT NULL,
  infante_id INT UNSIGNED NOT NULL,
  ebdi SMALLINT UNSIGNED NOT NULL,
  estrato VARCHAR(3) NOT NULL,
  inscripcion_inicial BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (periodo, infante_id),
  FOREIGN KEY (infante_id) REFERENCES infante(id),
  FOREIGN KEY (ebdi) REFERENCES ebdi(ebdi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

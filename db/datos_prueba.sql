-- Para elaborar los datos de prueba, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender la inserción de registros y sus relaciones dentro de la base de datos.
SET NAMES utf8mb4;

INSERT INTO estancias (clave_ebdi, nombre, estado, ur) VALUES (101, 'EBDI 101 Benito Juárez (prueba)', 'Ciudad de México', 'A1');
SET @e1 = LAST_INSERT_ID();
INSERT INTO estancias (clave_ebdi, nombre, estado, ur) VALUES (205, 'EBDI 205 Guadalajara (prueba)', 'Jalisco', 'B2');
SET @e2 = LAST_INSERT_ID();

INSERT INTO salas (estancia_id, nombre, grupo_edad) VALUES (@e1, 'Lactantes A', '6 a 18 meses');
SET @s1 = LAST_INSERT_ID();
INSERT INTO salas (estancia_id, nombre, grupo_edad) VALUES (@e1, 'Maternal A', '2 a 3 años');
SET @s2 = LAST_INSERT_ID();
INSERT INTO salas (estancia_id, nombre, grupo_edad) VALUES (@e2, 'Lactantes B', '6 a 18 meses');
SET @s3 = LAST_INSERT_ID();

SET @inscrito = (SELECT id FROM estatus_infante WHERE codigo = 'inscrito');

INSERT INTO infantes (matricula, curp, nombre, apellidos, genero, fecha_nacimiento, sala_id, estatus_id, fecha_registro)
VALUES ('DEMO01', 'LOPA240115MDFPRNA1', 'Ana', 'López Pérez', 'M', '2024-01-15', @s1, @inscrito, '2026-08-01');
SET @ana = LAST_INSERT_ID();
INSERT INTO infantes (matricula, curp, nombre, apellidos, genero, fecha_nacimiento, sala_id, estatus_id, fecha_registro)
VALUES ('DEMO02', 'LOPL240302HDFPRSA2', 'Luis', 'López Pérez', 'H', '2024-03-02', @s1, @inscrito, '2026-08-01');
SET @luis = LAST_INSERT_ID();
INSERT INTO infantes (matricula, curp, nombre, apellidos, genero, fecha_nacimiento, sala_id, estatus_id, fecha_registro)
VALUES ('DEMO03', 'RAMS240520MDFMRFA3', 'Sofía', 'Ramírez Ortiz', 'M', '2024-05-20', @s1, @inscrito, '2026-08-01');
SET @sofia = LAST_INSERT_ID();
INSERT INTO infantes (matricula, curp, nombre, apellidos, genero, fecha_nacimiento, sala_id, estatus_id, fecha_registro)
VALUES ('DEMO04', 'TOCD230810HDFRRGA4', 'Diego', 'Torres Cruz', 'H', '2023-08-10', @s2, @inscrito, '2026-08-01');
SET @diego = LAST_INSERT_ID();
INSERT INTO infantes (matricula, curp, nombre, apellidos, genero, fecha_nacimiento, sala_id, estatus_id, fecha_registro)
VALUES ('DEMO05', 'HEMM240101HJCRTTA5', 'Mateo', 'Hernández Mora', 'H', '2024-01-01', @s3, @inscrito, '2026-08-01');
SET @mateo = LAST_INSERT_ID();

INSERT INTO tutores (nombre, apellidos, telefono, correo) VALUES ('María', 'Pérez Gómez', '55 1000 0001', 'maria.demo@correo.mx');
SET @maria = LAST_INSERT_ID();
INSERT INTO tutores (nombre, apellidos, telefono, correo) VALUES ('Jorge', 'López Díaz', '55 1000 0002', NULL);
SET @jorge = LAST_INSERT_ID();
INSERT INTO tutores (nombre, apellidos, telefono, correo) VALUES ('Carmen', 'Cruz Vega', NULL, NULL);
SET @carmen = LAST_INSERT_ID();
INSERT INTO tutores (nombre, apellidos, telefono, correo) VALUES ('Rosa', 'Ortiz Luna', '55 1000 0004', NULL);
SET @rosa = LAST_INSERT_ID();

INSERT INTO infante_tutor (infante_id, tutor_id, parentesco, autorizado_recoger, contact_emergencia) VALUES
  (@ana, @maria, 'Madre', TRUE, FALSE),
  (@ana, @jorge, 'Padre', TRUE, TRUE),
  (@luis, @maria, 'Madre', TRUE, FALSE),
  (@luis, @jorge, 'Padre', TRUE, TRUE),
  (@sofia, @rosa, 'Abuela', TRUE, FALSE),
  (@diego, @carmen, 'Madre', TRUE, FALSE);

SET @hash = '$argon2id$v=19$m=65536,p=4,t=3$mngVXzvGlpHidCBPPB5bQw$R/KlYexUO9SSjOzJnEDwJzEQhx2iCa10Un9LVaENWtM';
INSERT INTO usuarios (nombre, correo, password_hash, rol_id, estancia_id, sala_id, tutor_id) VALUES
  ('Profesora Demo', 'profesor.demo@sirai.mx', @hash, (SELECT id FROM roles WHERE codigo = 'profesor'), @e1, @s1, NULL),
  ('Doctor Demo', 'doctor.demo@sirai.mx', @hash, (SELECT id FROM roles WHERE codigo = 'doctor_asesor'), @e1, NULL, NULL),
  ('María Pérez', 'tutor.demo@sirai.mx', @hash, (SELECT id FROM roles WHERE codigo = 'tutor'), NULL, NULL, @maria);
SET @prof = (SELECT id FROM usuarios WHERE correo = 'profesor.demo@sirai.mx');

SET @presente = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'presente');
SET @f_injust = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'falta_injustificada');
SET @licencia = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'licencia_medica');
SET @filtro = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'filtro_salud');
SET @antier = CURDATE() - INTERVAL 2 DAY;
SET @ayer = CURDATE() - INTERVAL 1 DAY;

INSERT INTO asistencias (infante_id, sala_id, estancia_id, fecha, turno, estado_id, hora_entrada, usuario_id) VALUES
  (@ana, @s1, @e1, @antier, 'matutino', @presente, '08:05', @prof),
  (@luis, @s1, @e1, @antier, 'matutino', @presente, '08:10', @prof),
  (@sofia, @s1, @e1, @antier, 'matutino', @presente, '08:20', @prof),
  (@ana, @s1, @e1, @ayer, 'matutino', @f_injust, NULL, @prof),
  (@luis, @s1, @e1, @ayer, 'matutino', @presente, '08:02', @prof),
  (@sofia, @s1, @e1, @ayer, 'matutino', @licencia, NULL, @prof),
  (@diego, @s2, @e1, @ayer, 'matutino', @f_injust, NULL, @prof),
  (@mateo, @s3, @e2, @ayer, 'matutino', @filtro, '08:30', @prof);

SET @doc = (SELECT id FROM usuarios WHERE correo = 'doctor.demo@sirai.mx');
INSERT INTO seguimientos (asistencia_id, responsable_id, motivo_id, causa, requiere_alta, estado)
SELECT a.id, @doc, (SELECT id FROM motivos_falta WHERE codigo = 'ENF_CASA'), 'Fiebre y tos', TRUE, 'contactado'
  FROM asistencias a WHERE a.infante_id = @sofia AND a.fecha = @ayer;
INSERT INTO seguimientos (asistencia_id, responsable_id, motivo_id, causa, estado, intentos, ultimo_intento)
SELECT a.id, @doc, (SELECT id FROM motivos_falta WHERE codigo = 'NO_LOC'), 'No contesta', 'pendiente', 1, NOW() - INTERVAL 1 HOUR
  FROM asistencias a WHERE a.infante_id = @diego AND a.fecha = @ayer;

INSERT INTO avisos_privacidad (version, texto, vigente, publicado) VALUES
  ('1.0-prueba', 'Aviso de privacidad de prueba. El ISSSTE tratará los datos de los niños y sus tutores solo para registrar la asistencia y dar seguimiento a las faltas.', TRUE, CURDATE());

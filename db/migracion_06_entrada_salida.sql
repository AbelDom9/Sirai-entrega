-- Esta migración permite añadir los horarios de entrada y salida y el método de registro a las asistencias conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
ALTER TABLE asistencias
ADD COLUMN hora_entrada TIME NULL,
ADD COLUMN hora_salida TIME NULL,
ADD COLUMN metodo VARCHAR(10) not null default 'manual';

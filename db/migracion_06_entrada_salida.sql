ALTER TABLE asistencias
ADD COLUMN hora_entrada TIME NULL,
ADD COLUMN hora_salida TIME NULL,
ADD COLUMN metodo VARCHAR(10) not null default 'manual';
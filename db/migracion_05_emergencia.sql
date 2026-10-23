-- Esta migración permite añadir un campo que identifica a los tutores designados como contacto de emergencia conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
ALTER TABLE infante_tutor ADD COLUMN contact_emergencia BOOLEAN NOT NULL DEFAULT FALSE;

# API de SIRAI

Basada en `backend/index.js` del repositorio de clase (TC2007B-421-202624), adaptada de MongoDB a MySQL. En `index.js` los comentarios indican qué es igual al ejemplo ("Como el profe:"), qué es nuevo ("NUEVO:") y qué error del ejemplo se corrigió ("CORRECCIÓN DEL EJEMPLO:").

## Preparación

1. Crear la base con `db/esquema_sirai.sql` (ver README principal).
2. Crear un usuario de MySQL solo para la API, sin permiso de borrar:
   ```sql
   CREATE USER 'sirai_api'@'localhost' IDENTIFIED BY 'una-contraseña';
   GRANT SELECT, INSERT, UPDATE ON sirai_dev.* TO 'sirai_api'@'localhost';
   ```
3. `cp .env.example .env` y completar `DB_PASSWORD` y `LLAVEJWT` (`openssl rand -hex 32`).
4. Generar el certificado HTTPS (como el ejemplo de clase), dentro de `api/`:
   ```sh
   openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
   ```
   `server.key` y `server.crt` no se suben a GitHub.
5. `npm install` y `npm start`. Debe imprimir "conectado a la base de datos" y "HTTPS Server running on port 3000".
   Como el certificado es propio (autofirmado), abre una vez https://localhost:3000 en el navegador y acepta la advertencia; si no, el frontend no podrá conectarse.
6. Crear el primer administrador (una sola vez): `node crearAdmin.js`. Pide nombre, correo y contraseña (no se muestra al escribirla). Los demás usuarios los crea el administrador desde la pantalla Usuarios.

## Rutas

Cada recurso tiene `GET /api/recurso` (lista con `_sort`, `_order`, `_start`, `_end` y filtros; `?id=1&id=2` para referencias), `GET /api/recurso/:id`, y `POST`/`PUT` si algún rol puede crear o modificar. Las reglas son las mismas de `src/permisos.ts`, y cada rol solo ve sus filas.

| Recurso | Leer | Crear / modificar | Alcance |
| --- | --- | --- | --- |
| estancias, salas | administrador, profesor, doctor/asesor | administrador | profesor: su sala/estancia; doctor: su estancia |
| infantes | los cuatro | administrador | profesor: su sala; doctor: su estancia; tutor: sus hijos |
| tutores | administrador, doctor/asesor, tutor | administrador | doctor: tutores de su estancia; tutor: él mismo |
| infante_tutor, roles | administrador | administrador (roles: solo lectura) | — |
| usuarios | administrador, doctor/asesor | administrador | doctor: doctores de su estancia. Nunca devuelve password_hash. |
| estatus_infante | administrador, profesor | — | — |
| cat_estado_asistencia, motivos_falta | los cuatro | — | — |
| asistencias | los cuatro | por lote (abajo) | igual que infantes |
| justificaciones | los cuatro | administrador, tutor | profesor sin `comentario`; tutor solo las suyas y de sus hijos |
| seguimientos | administrador, doctor/asesor | administrador, doctor/asesor | doctor: su estancia |
| reportes_asistencia (vista) | administrador | — | filtros desde/hasta y estancia |
| mi_asistencia (vista) | administrador, tutor | — | tutor: sus hijos |
| bandeja_seguimientos (vista) | doctor/asesor | — (se atiende editando el seguimiento) | su estancia; incluye contactos de todos los tutores |
| alta_pendiente (vista) | administrador, profesor, doctor/asesor | — | profesor: su sala; doctor: su estancia. Solo ids, sin motivo médico |

Rutas propias:

- `POST /api/login`: responde `{ token, id, fullName, rol }`.
- `POST /api/asistencias/lote`: pase de lista del grupo en una transacción. Si se repite, actualiza en lugar de duplicar.
  - **Corte (RF-16):** el matutino cierra a las 09:00 y el vespertino a las 14:00 (constantes `HORA_CORTE_MATUTINO` y `HORA_CORTE_VESPERTINO`, hora de la computadora donde corre la API). Antes del corte guardan el profesor de esa sala, el doctor/asesor de esa estancia y el administrador; después, solo el doctor/asesor y el administrador.
  - **Alta médica (RF-27):** si un niño tiene un seguimiento con "requiere alta" y sin fecha de alta, no se puede guardar como Presente ni Filtro de salud (responde 409 con su nombre). Los motivos ENF_CASA y ACC_EXT activan "requiere alta" automáticamente.
  - **Seguimiento automático (RF-20):** al llegar el corte, cada falta (justificada, injustificada o licencia médica) recibe un seguimiento "pendiente". Lo revisa un reloj cada minuto y al arrancar la API; también se ejecuta después de una corrección. Nunca se duplica (llave única por asistencia).
- `GET /api/avisos_privacidad/vigente` (administrador, tutor) y `POST /api/consentimientos` (tutor; el tutor sale del token).
- `GET /`: comprobación pública (solo responde un texto). `GET /api/test-db`: comprobación de la base, solo con token de administrador.

El token se envía en la cabecera `Authentication`, como en el ejemplo de clase. No hay `DELETE` (baja lógica) ni `/registrarse` (el administrador crea los usuarios).

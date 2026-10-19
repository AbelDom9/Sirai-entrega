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
4. `npm install` y `npm start`. Debe imprimir "conectado a la base de datos".

## Rutas actuales

| Ruta | Quién |
| --- | --- |
| `POST /api/login` | Todos. Responde `{ token, id, fullName, rol }`. |
| `GET /api/infantes` (lista, `?id=`, filtros) | Los cuatro roles, cada uno con su alcance: administrador todo, profesor su sala, doctor/asesor su estancia, tutor sus hijos. |
| `GET /api/infantes/:id` | Igual que la lista. |
| `POST /api/infantes`, `PUT /api/infantes/:id` | Solo administrador. |
| `GET /`, `GET /api/test-db` | Comprobación (de la API de Capi). |

El token se envía en la cabecera `Authentication`, como en el ejemplo de clase. No hay `DELETE` (baja lógica) ni `/registrarse` (el administrador crea los usuarios).

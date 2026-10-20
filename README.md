# SIRAI

Frontend académico de asistencia infantil del ISSSTE, basado en React y React-admin del tutorial de clase de test-admin. Se toma como referencia el frontend de TC2007B-421-202624 para la conexión de autenticación. La API y base de datos son responsabilidad del equipo encargado de esos módulos.

## Preparación

```sh
npm ci
cp .env.example .env
openssl req -x509 -newkey rsa:2048 -nodes -keyout frontend.key -out frontend.crt -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
npm run dev
```

Como en el ejemplo de clase, el frontend y la API usan HTTPS con certificados propios (frontend.key/crt aquí y server.key/crt en api/). No se suben a GitHub. La primera vez, el navegador mostrará una advertencia que hay que aceptar.

Configurar VITE_BACKEND con la URL de la API del equipo. No hay cuentas de demostración ni backend temporal. El login necesita la respuesta documentada en [ROLES_Y_PERMISOS.md](ROLES_Y_PERMISOS.md): token, id y rol. Hasta conectar la API no se puede iniciar una sesión real ni cargar datos.

## Roles y permisos

Las reglas de administrador, profesor, doctor/asesor y tutor se definen en src/permisos.ts. React-admin las aplica mediante authProvider.canAccess a vistas y acciones. El administrador dispone del panel Roles y permisos. Los controles de servidor y los filtros por estancia/sala/hijos deben implementarse en la API. Ver [la explicación y contrato para el equipo](ROLES_Y_PERMISOS.md).

## Comprobar

```sh
npm run test:permisos
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

Las pruebas de permisos usan Node.js 22.18 o posterior, o Node 24.

## Equipo

Repositorio privado: https://github.com/AbelDom9/sirai-admin. Cada compañero trabaja en su rama y abre un pull request. Compartir package-lock.json; no subir node_modules, dist ni .env. Los comentarios NUEVO: explican conceptos añadidos al tutorial.

## Base de datos

db/esquema_sirai.sql es una propuesta de esquema para el equipo de BD/API: combina los nombres de la API (Capi/Emilio) y del frontend con las ideas del padrón de Pablo (db/scheme_padron.sql), y agrega usuarios con rol. Se probó en MySQL 8.0.28 local (base sirai_dev): crea 18 tablas, 28 llaves foráneas y 2 vistas (reportes_asistencia y mi_asistencia).

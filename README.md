# SIRAI

Proyecto académico de registro de asistencia infantil para las Estancias de Bienestar y Desarrollo Infantil del ISSSTE.

El frontend está basado en React y React-admin del tutorial de clase de la carpeta `test-admin`. Se conserva la estructura de recursos, listas y formularios, con TypeScript, Material UI y Vite.

## Preparación

Instalar una versión de Node.js compatible con la versión de Vite indicada en `package-lock.json`.

```sh
git clone https://github.com/AbelDom9/sirai-admin.git
cd sirai-admin
npm ci
cp .env.example .env
npm run dev
```

Configurar `VITE_SIMPLE_REST_URL` en `.env` con la URL de la API. Las variables con prefijo `VITE_` son visibles para el navegador: no deben contener contraseñas ni tokens privados.

## Estado actual

Pantallas preparadas para estancias, salas, infantes, tutores, usuarios, pase de lista, justificaciones, seguimiento, privacidad y reportes. La API Node.js y la base de datos SQL todavía están pendientes; las pantallas de datos requieren esos servicios para funcionar.

El inicio de sesión es de demostración: `janedoe` y `johndoe`, ambos con la contraseña ficticia `password`. `janedoe` tiene rol local de profesor y un menú reducido. Esto no protege rutas ni datos y debe sustituirse por autenticación y autorización reales antes de usar información de infantes.

## Comprobación

```sh
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

## Trabajo en equipo

El repositorio será privado: cada colaborador debe aceptar una invitación de GitHub. Antes de trabajar, actualizar `main` y crear una rama propia.

```sh
git switch main
git pull
git switch -c nombre-del-cambio
```

Subir la rama y abrir un pull request para revisar los cambios antes de integrarlos. Compartir `package-lock.json`; no subir `node_modules`, `dist` ni `.env`.

## Documentación

- `MODULOS_SIRAI.md`: pantallas, conceptos nuevos y contrato pendiente de API.
- `PERMISOS_PASO_1.md`: explicación del rol local y menú del profesor.

Los comentarios `NUEVO:` explican las ampliaciones respecto al tutorial.

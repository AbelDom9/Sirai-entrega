# Roles y permisos del frontend SIRAI

Este apartado pertenece a sirai-admin y conserva React-admin del tutorial test-admin. Se revisó el clon /Users/abelrish/Desktop/TC2007B-421-202624 como referencia para authProvider, sesión y envío del token. El clon de clase no se modificó. No se desarrolla aquí el backend ni la base de datos, a cargo del resto del equipo.

## Qué se retiró

backend-prueba, sus dependencias, usuarios ficticios, variables VITE_API_PRUEBA, apiPrueba.ts, PruebaRoles.tsx, SoloRoles.tsx, MenuLocal.tsx, authProviderLocal.ts y el login con users.json. Los scripts SQL preliminares y el documento PERMISOS_PASO_1.md también se retiraron del proyecto para no competir con el trabajo de base de datos del equipo. Se conservó un respaldo fuera de sirai-admin en la carpeta de trabajo de este chat. No se borraron los módulos funcionales de infantes, salas, asistencia y seguimiento.

## 1 Dónde se definen los permisos

src/permisos.ts es la única tabla de reglas de la interfaz. Usa cuatro códigos: administrador, profesor, doctor_asesor y tutor. Los códigos no son nombres visibles ni IDs numéricos de SQL.

Cada regla indica recurso y acciones. Por ejemplo:

```ts
profesor: {
  pase_lista: ["show", "edit"],
  asistencias: ["list", "show"],
  justificaciones: ["list", "show"],
}
```

list = consultar listado; show = consultar detalle o pantalla; create = crear; edit = modificar. Si falta un rol, recurso o acción, se deniega el acceso. No se autoriza delete hasta acordar el flujo de baja lógica con el equipo. Las reglas son explícitas; el administrador no obtiene acceso automáticamente a futuros recursos desconocidos.

Para cambiar un permiso se edita PERMISOS en este archivo. No se guardan modificaciones de permisos en localStorage ni se presenta un formulario que aparente guardarlos sin backend. Los cuatro perfiles son fijos según el reporte. La asignación de un perfil a un usuario se mantiene como rol_id en el formulario Usuarios y requerirá la API del equipo. Los catálogos siguen siendo de consulta hasta implementar su gestión.

## 2 React-admin consulta las reglas

authProvider.ts conserva el patrón de conexión del ejemplo de clase y agrega getPermissions y canAccess. getPermissions devuelve el código de rol. canAccess evalúa recurso/acción con tienePermiso. List, Create, Edit y botones estándar como CreateButton/EditButton consultan canAccess en la versión instalada de React-admin.

Acceso.tsx usa el componente nativo CanAccess para las rutas propias: pase de lista, vista del tutor, privacidad y el panel de roles. Protege también la vista al abrir una URL directa. Admin usa requireAuth para pedir sesión antes de las rutas propias. El botón de guardar pase de lista y el consentimiento también consultan su acción específica.

Menu.tsx no compara roles: recorre MENU_POR_ROL de permisos.ts, y cada enlace de recurso además consulta canAccess("list"). Una prueba comprueba que todo recurso del menú tenga permiso list. Los menús muestran las tareas diarias de cada rol; algunos catálogos quedan consultables para resolver referencias aunque no tengan enlace visible en el menú. El panel Roles y permisos muestra una matriz calculada a partir de la configuración y solo lo abre el administrador.

## 3 Conexión con la API del equipo

No se incluye una API ni cuentas locales. Hasta conectar la API, los formularios no pueden autenticar usuarios ni cargar datos. El apartado de permisos puede validarse con pruebas de código sin inventar cuentas ni habilitar accesos de demostración.

Configurar VITE_BACKEND con la URL acordada. Como compatibilidad, se acepta VITE_SIMPLE_REST_URL si la primera no existe. sesion.ts centraliza la configuración, lectura de identidad y cliente HTTP. dataProvider usa este cliente tanto para Simple REST como para el guardado por lote.

POST /login recibe, como el ejemplo de clase:

```json
{ "username": "cuenta", "password": "contraseña" }
```

El frontend necesita esta respuesta, ampliando el ejemplo del profesor que solo devuelve token e id:

```json
{
  "token": "token-emitido-por-el-servidor",
  "id": 12,
  "fullName": "Nombre del usuario",
  "rol": "profesor"
}
```

fullName es opcional; token, id y rol son obligatorios. No se asigna un rol por defecto si falta. El backend debe obtener rol desde sus usuarios, no desde un campo elegido en la petición de login. Si el backend entrega otro formato, se adapta login en authProvider.ts y leerIdentidad en sesion.ts, sin tocar la matriz de permisos.

Se conserva sessionStorage con claves auth e identity del repositorio de clase. Como en el ejemplo del profesor, el token se envía en la cabecera Authentication (sin "Bearer") y el frontend usa ra-data-json-server: las listas envían _sort, _order, _start y _end, y el total llega en X-Total-Count, expuesta por CORS. Las rutas de la API empiezan con /api, por eso VITE_BACKEND=http://localhost:3000/api. La API está en la carpeta api/.

Al entrar: administrador → / (tablero, como indica la Tabla 14 del reporte); profesor → /pase-lista; doctor/asesor → /seguimientos; tutor → /mis-hijos. Logout limpia la sesión del navegador. checkError limpia y solicita login ante 401; 403 conserva la sesión. checkAuth comprueba la presencia/estructura de la sesión local; la expiración y revocación del token las verificará el servidor al atender cada petición. La revocación remota al cerrar sesión está pendiente del endpoint que defina el equipo.

## 4 Alcance y campos que deben filtrar en la API

| Perfil | Alcance que debe aplicar el servidor |
| --- | --- |
| Profesor | Solo su sala; asistencia, incidencias y motivos. Sin contacto de tutores ni notas médicas. |
| Doctor/Asesor | Solo su estancia; faltas, contacto del tutor, historial, retorno y alta. El recurso usuarios de referencia solo debe exponer posibles responsables de su estancia, nunca credenciales. |
| Tutor | Solo sus hijos, su propio registro de tutor y sus justificaciones/consentimientos. |
| Administrador | Gestión institucional; reportes agregados sin nombres de infantes en el tablero. |

La matriz autoriza módulos y acciones, pero no aplica por sí sola filtros de filas, proyecciones de campos, validaciones médicas ni ownership de una justificación. La API debe comprobar todo eso en cada endpoint. El token y la identidad del navegador son manipulables; los controles visuales no son una barrera de seguridad del servidor. No se marca completado el control de acceso de extremo a extremo hasta esa integración.

La pantalla de justificaciones conserva por ahora el formulario general; al integrar la API se debe derivar el tutor de la sesión y restringir asistencias a sus hijos. Retorno, alta y consentimiento requieren reglas del servidor. Enviar datos de roles a React no significa que la base de datos aplique permisos automáticamente.

## 5 Archivos para estudiar uno por uno

1. permisos.ts: códigos, reglas, acciones y función de comprobación.
2. sesion.ts: contrato con la API y sesión del ejemplo de clase.
3. authProvider.ts: getPermissions y canAccess nativos de React-admin.
4. Acceso.tsx: control de rutas propias con CanAccess.
5. Menu.tsx: opciones de navegación por perfil.
6. RolesPermisos.tsx: matriz de consulta del administrador.
7. App.tsx: conexión de los recursos existentes y rutas protegidas.

Todos contienen comentarios NUEVO: donde se incorpora un concepto respecto al tutorial. No se instalaron bibliotecas de permisos.

## 6 Comprobaciones

```sh
npm run test:permisos
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

El script de pruebas usa el runner de Node.js y lectura nativa de TypeScript (Node 22.18 o posterior, o Node 24). Las pruebas verifican límites entre perfiles, acceso desconocido denegado, consistencia de recursos y pantallas iniciales. No sustituyen pruebas de integración con API y SQL.

Referencias: https://marmelab.com/react-admin/Permissions.html y https://marmelab.com/react-admin/CanAccess.html

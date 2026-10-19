> Actualización: se retiraron el login local y las pruebas de roles. El estado actual de autorización y su conexión pendiente están documentados en ROLES_Y_PERMISOS.md; las menciones al login del generador en este documento corresponden a la primera etapa. La base SQL la desarrolla el equipo de base de datos.

# Módulos de SIRAI y conceptos nuevos

Esta etapa prepara pantallas React-admin basadas en el reporte de accesibilidad. El proveedor sigue siendo Simple REST. No se implementó una API ni una base de datos temporal. El login del generador solo sirve para desarrollo. Los recursos de usuarios y roles no aplican autorización por sí mismos.

## Estancias y salas

`estancias.tsx` conserva List/Create/Edit. Sus campos son clave_ebdi, nombre, estado y ur. `salas.tsx` relaciona cada sala con una estancia mediante estancia_id, y guarda nombre y grupo_edad. Los componentes de referencia ya aparecían en el tutorial. Lo nuevo compartido es la barra GuardarToolbar y el componente de campos reutilizables.

## Infantes y tutores

`infantes.tsx` mantiene sus campos. `tutores.tsx` añade nombre, apellidos, teléfono y correo. email() valida el formato del correo. `infanteTutores.tsx` relaciona tutor e infante, parentesco y autorización para recoger. BooleanInput y BooleanField capturan y muestran valores sí/no.

## Usuarios y catálogos

`usuarios.tsx` prepara nombre, correo, rol_id y estancia_id. No permite gestionar contraseñas ni aplica permisos. `catalogos.tsx` reutiliza la lista de consulta en roles, estatus_infante, cat_estado_asistencia y motivos_falta. recordRepresentation en App.tsx define el texto que React-admin usa al mostrar referencias.

## Pase de lista

`PaseLista.tsx` elige sala, fecha local y turno. Carga todos los infantes activos del grupo recorriendo las páginas, recupera estados existentes para ese día y turno, permite todos presentes y comentarios de incidencias. No limita el guardado a los primeros registros. Conserva las modificaciones si falla el guardado y bloquea el cambio de grupo mientras hay cambios pendientes.

useState guarda los valores de pantalla. useEffect carga datos al cambiar el grupo y descarta respuestas antiguas. useGetList consulta catálogos. useDataProvider permite cargar y guardar desde una pantalla propia. useNotify comunica resultados. guardarPaseLista extiende el proveedor con una petición POST para el grupo completo. TypeScript describe el cuerpo con PaseListaPayload y SiraiDataProvider.

La pantalla de salas muestra hasta 500 opciones y avisa si existen más; queda pendiente un selector con búsqueda en el servidor. La ruta de pase de lista requiere la API y no funciona como simulación local.

## Asistencias, justificaciones y seguimiento

`asistencias.tsx` consulta el historial y permite filtrar por fecha e infante. DateField presenta fechas y sort establece el orden inicial. `justificaciones.tsx` relaciona asistencia, tutor y motivo, con comentario. `seguimientos.tsx` captura responsable, causa, registro manual de llamada, retorno previsto, necesidad de alta y estado. choices define opciones locales; el backend deberá validar las transiciones y generar el seguimiento de una ausencia sin duplicados.

## Vista del tutor y privacidad

`MiAsistencia.tsx` espera un endpoint personal, sin filtrar el padrón general en el navegador. Presenta porcentaje, periodo, sala y estado actual en tarjetas. El historial está disponible en el recurso asistencias; su filtro obligatorio por hijos del tutor debe imponerlo el servidor.

`AvisoPrivacidad.tsx` usa useGetOne para cargar el aviso vigente oficial. La casilla y el botón se habilitan con texto y versión disponibles; el consentimiento se envía a la API. No se redactó un aviso legal ni se creó una versión ficticia. El servidor debe obtener la identidad del tutor de su sesión, establecer fecha de recepción y garantizar un registro por tutor y versión.

## Reportes y menú

`reportes.tsx` muestra cifras por estancia y periodo, sin campos de nombres de infantes. NumberField presenta cifras. Los porcentajes serán calculados en el servidor; null significa sin registros. `Menu.tsx` combina Menu.ResourceItems con enlaces a rutas propias. Layout recibe el menú mediante su propiedad menu. CustomRoutes y Route conectan pantallas personalizadas.

## Contrato pendiente de API

Configurar VITE_BACKEND con la dirección real (por ejemplo http://localhost:3000/api). Simple REST envía sort, range y filter como JSON en la consulta. La API devuelve listas como arrays y el total mediante X-Total-Count; CORS debe exponer esa cabecera. Cada registro necesita id. También debe soportar consulta por filtro id para las referencias, GET /recurso/:id, POST y PUT compatibles con el proveedor.

Recursos: estancias, salas, infantes, tutores, infante_tutor, usuarios, roles, estatus_infante, cat_estado_asistencia, motivos_falta, asistencias, justificaciones, seguimientos, reportes_asistencia, mi_asistencia, avisos_privacidad, consentimientos.

Catálogos de asistencia: presente, ausente justificado, falta injustificada, comisión médica y filtro sanitario. El estado presente debe tener codigo = "presente" para el botón Todos presentes. Motivos: enfermedad, accidente, permiso, otro y falta de respuesta. Roles: administrador, doctor/asesor, profesor y tutor. La API debe definir sus identificadores estables y el catálogo de estatus de inscripción.

GET infantes con sala_id y activo=true devuelve solo inscritos activos y sin borrado lógico. GET asistencias con sala_id, fecha y turno recupera el grupo correspondiente. POST /asistencias/lote recibe sala_id, estancia_id, fecha, turno y registros con infante_id, estado_id e incidencia. Debe validar pertenencia, permisos y catálogo, guardar en una transacción y actualizar un registro existente para la misma estancia/infante/fecha/turno, sin duplicados al reintentar. Generar seguimientos de ausencia también corresponde al servidor.

GET /mi_asistencia devuelve solo hijos del tutor autenticado: id, nombre, apellidos, sala_nombre, porcentaje_asistencia, periodo y estado_hoy. GET /reportes_asistencia devuelve id, estancia_nombre, periodo, total_registros, presentes, ausentes y porcentaje_asistencia, respetando filtros desde/hasta/estancia_id. GET /avisos_privacidad/vigente devuelve id, version y texto. POST /consentimientos acepta aviso_id, version y aceptado, y obtiene el tutor desde la sesión.

## Trabajo posterior obligatorio

Construir API Node.js y esquema SQL con utf8mb4, relaciones, índices, unicidad de CURP y borrado lógico. Sustituir el login local por autenticación real. Restringir datos y acciones por rol en el servidor y adaptar menús; impedir que un tutor consulte otros niños, que un profesor acceda a notas médicas/contactos o que el personal consulte otras estancias. Añadir validaciones de fechas, consistencia de referencias, transición de alta y conservación de datos. Verificar las pantallas con teclado, lector de pantalla, contraste, zoom y dispositivos móviles conectadas a la API.

QR, semáforo y exportación quedan fuera de esta etapa, siguiendo la prioridad del reporte. Las tablas secundarias de inscripciones y movimientos corresponden al rediseño de base de datos pendiente.

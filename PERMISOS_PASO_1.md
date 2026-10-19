# Primer paso de permisos con React-admin

Fecha: 12 de octubre de 2026. Proyecto localizado en /Users/abelrish/Desktop/sirai-admin, al que el usuario se refiere como SIARI. No se renombró la carpeta.

Este cambio sigue React y React-admin del tutorial de clase de test-admin. Se utilizan authProvider, Menu y un if de React; no se añadieron dependencias ni una biblioteca de permisos.

## 1 Usuario de prueba

En src/users.json, janedoe tiene ahora "rol": "profesor". Sus credenciales se conservaron. JSON no admite comentarios; por eso se documenta aquí. Los comentarios NUEVO: se encuentran en los archivos TypeScript que utilizan el rol.

El login existente copia el usuario, excluye su contraseña y lo guarda en localStorage. Esa copia incluye el rol. Hay que cerrar sesión y volver a entrar para que una sesión anterior incorpore el campo nuevo. johndoe no recibió un rol en este paso y conserva el menú de desarrollo.

## 2 getPermissions

En src/authProvider.ts, getPermissions lee la copia de la sesión y devuelve user.rol mediante una promesa. React-admin permite que getPermissions devuelva la representación de permisos elegida por la aplicación; aquí usamos la cadena "profesor" para mantenerlo simple. Sin un rol devuelve null. Sin sesión o con JSON inválido rechaza la promesa.

El operador ?? usa el valor a su derecha cuando el de su izquierda es null o undefined. try/catch controla el error de interpretar un JSON inválido. Ambos tienen comentarios explicativos en el código.

## 3 usePermissions y menú

En src/Menu.tsx, usePermissions obtiene el resultado de getPermissions. isPending permite esperar a que se cargue el rol y error permite mostrar un mensaje si falla. Un if muestra al profesor solamente Pase de lista e Historial de asistencia.

Menu.Item agrega la ruta propia /pase-lista. Menu.ResourceItem agrega únicamente el recurso asistencias que ya está registrado en App.tsx. Menu.ResourceItems, en plural, agrega todos los recursos y se conserva en el menú de desarrollo de los demás usuarios.

## Qué no cambia todavía

No se filtran recursos ni rutas en App.tsx. No se redirige automáticamente al profesor: al iniciar sesión sigue apareciendo el Dashboard. No se asignó una sala ni estancia al profesor. No se limita el endpoint de asistencia a su grupo ni se implementó una API. Las vistas de tutor, doctor/asesor y administrador siguen pendientes.

Ocultar opciones del menú no protege datos ni impide abrir una URL directamente. localStorage es modificable y el rol local es solamente una prueba. El control real debe usar la identidad autenticada y la autorización del servidor. No se ha implementado control de acceso completo del reporte con este cambio.

## Cómo comprobarlo

1. Iniciar el proyecto y cerrar una sesión anterior si está abierta.
2. Iniciar sesión como janedoe con su contraseña de prueba existente.
3. Comprobar que el menú muestra solamente Pase de lista e Historial de asistencia.
4. Cerrar sesión e iniciar como johndoe: conserva el menú de desarrollo.
5. No confundir esta verificación visual con una prueba de permisos del backend.

## Relación con el reporte

Este paso prepara la interfaz del profesor descrita en la tabla 14. Quedan pendientes los permisos de datos, asignación de sala/estancia, acceso restringido a motivos y ausencia de contactos/notas médicas, además de las vistas de los otros tres roles.

Referencia oficial: https://marmelab.com/react-admin/usePermissions.html

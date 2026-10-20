import type { TranslationMessages } from "react-admin";

const spanishMessages: TranslationMessages = {
    ra: {
        action: {
            add_filter: 'Añadir filtro',
            add: 'Añadir',
            back: 'Volver',
            bulk_actions: '1 elemento seleccionado |||| %{smart_count} elementos seleccionados',
            cancel: 'Cancelar',
            clear_array_input: 'Borrar la lista',
            clear_input_value: 'Borrar valor',
            clone: 'Clonar',
            confirm: 'Confirmar',
            create: 'Crear',
            create_item: 'Crear %{item}',
            delete: 'Eliminar',
            edit: 'Editar',
            export: 'Exportar',
            list: 'Listar',
            refresh: 'Refrescar',
            remove_filter: 'Eliminar este filtro',
            remove_all_filters: 'Eliminar todos los filtros',
            remove: 'Eliminar',
            reset: 'Resetear',
            save: 'Guardar',
            search: 'Buscar',
            search_columns: 'Buscar en columnas',
            select_all: 'Seleccionar todos',
            select_all_button: 'Seleccionar todos',
            select_row: 'Seleccionar esta fila',
            show: 'Mostrar',
            sort: 'Ordenar',
            undo: 'Deshacer',
            unselect: 'Deseleccionar',
            expand: 'Expandir',
            close: 'Cerrar',
            open_menu: 'Abrir menú',
            close_menu: 'Cerrar menú',
            update: 'Actualizar',
            move_up: 'Mover arriba',
            move_down: 'Mover abajo',
            open: 'Abrir',
            toggle_theme: 'Cambiar modo claro/oscuro',
            select_columns: 'Columnas',
            update_application: 'Recargar Aplicación',
        },
        boolean: {
            true: 'Sí',
            false: 'No',
            null: ' ',
        },
        page: {
            create: 'Crear %{name}',
            dashboard: 'Panel principal',
            edit: '%{name} %{recordRepresentation}',
            error: 'Algo salió mal',
            list: '%{name}',
            loading: 'Cargando',
            not_found: 'No encontrado',
            show: '%{name} %{recordRepresentation}',
            empty: 'Todavía no hay %{name}.',
            invite: '¿Quieres agregar uno?',
            access_denied: 'Acceso denegado',
            authentication_error: 'Error de autenticación',
        },
        input: {
            file: {
                upload_several:
                    'Suelte algunos archivos para subir, o haga clic para seleccionar uno.',
                upload_single: 'Suelte un archivo para subir, o haga clic para seleccionarlo.',
            },
            image: {
                upload_several:
                    'Suelte algunas imágenes para subir, o haga clic para seleccionar una.',
                upload_single:
                    'Suelte una imagen para subir, o haga clic para seleccionarla.',
            },
            references: {
                all_missing: 'No se pueden encontrar los datos de referencias.',
                many_missing:
                    'Al menos una de las referencias asociadas ya no parece estar disponible.',
                single_missing:
                    'La referencia asociada ya no parece estar disponible.',
            },
            password: {
                toggle_visible: 'Ocultar contraseña',
                toggle_hidden: 'Mostrar contraseña',
            },
        },
        message: {
            about: 'Acerca de',
            access_denied:
                "No tiene los permisos necesarios para acceder a esta página",
            are_you_sure: '¿Estás seguro?',
            authentication_error:
                'El servidor de autenticación devolvió un error y sus credenciales no pudieron ser verificadas.',
            auth_error:
                'Ocurrió un error mientras se validaba el token de autenticación.',
            bulk_delete_content:
                '¿Estás seguro de que quieres eliminar este %{name}? |||| ¿Estás seguro de que quieres eliminar estos %{smart_count} elementos?',
            bulk_delete_title:
                'Eliminar %{name} |||| Eliminar %{smart_count} %{name}',
            bulk_update_content:
                '¿Estás seguro de que quieres actualizar este %{name} %{recordRepresentation}? |||| ¿Estás seguro de que quieres actualizar estos %{smart_count} elementos?',
            bulk_update_title:
                'Actualizar %{name} %{recordRepresentation} |||| Actualizar %{smart_count} %{name}',
            clear_array_input: '¿Estás seguro de que quieres borrar toda la lista?',
            delete_content: '¿Estás seguro de que quieres eliminar este %{name}?',
            delete_title: 'Eliminar %{name} %{recordRepresentation}',
            details: 'Detalles',
            error: "Ocurrió un error en el cliente y su solicitud no pudo ser completada.",
            invalid_form: 'El formulario no es válido. Por favor, verifique los errores',
            loading: 'Cargando',
            no: 'No',
            not_found:
                'La URL que ingresaste no existe en este servidor.',
            select_all_limit_reached:
                'Se alcanzó el límite de selección.',
            unsaved_changes:
                "Hay cambios sin guardar, ¿estás seguro de que quieres ignorarlos?",
            yes: 'Sí',
            placeholder_data_warning: 'El valor de este campo no es válido, ya que no se encuentra en la lista de opciones.',
        },
        navigation: {
            clear_filters: 'Borrar filtros',
            no_filtered_results: 'No se encontraron %{name} usando los filtros actuales.',
            no_results: 'No se encontraron %{name}',
            no_more_results:
                'El número de página %{page} está fuera de los límites. Intenta con la página anterior.',
            page_out_of_boundaries: 'Número de página %{page} fuera de límites',
            page_out_from_end: 'No se puede ir después de la última página',
            page_out_from_begin: 'No se puede ir antes de la página 1',
            page_range_info: '%{offsetBegin}-%{offsetEnd} de %{total}',
            partial_page_range_info:
                '%{offsetBegin}-%{offsetEnd} de más de %{offsetEnd}',
            current_page: 'Página %{page}',
            page: 'Ir a la página %{page}',
            first: 'Ir a la primera página',
            last: 'Ir a la última página',
            next: 'Ir a la página siguiente',
            previous: 'Ir a la página anterior',
            page_rows_per_page: 'Filas por página:',
            skip_nav: 'Saltar al contenido',
        },
        sort: {
            sort_by: 'Ordenar por %{field_lower_first} %{order}',
            ASC: 'Ascendente',
            DESC: 'Descendente',
        },
        auth: {
            auth_check_error: 'Por favor, inicia sesión para continuar',
            user_menu: 'Perfil',
            username: 'Nombre de usuario',
            password: 'Contraseña',
            email: 'Correo electrónico',
            sign_in: 'Iniciar sesión',
            sign_in_error: 'Inicio de sesión fallido, por favor inténtalo de nuevo',
            logout: 'Cerrar sesión',
        },
        notification: {
            updated: 'Elemento actualizado |||| %{smart_count} elementos actualizados',
            created: 'Elemento creado',
            deleted: 'Elemento eliminado |||| %{smart_count} elementos eliminados',
            bad_item: 'Elemento incorrecto',
            item_doesnt_exist: 'El elemento no existe',
            http_error: 'Error de comunicación con el servidor',
            data_provider_error:
                ' Error en el proveedor de datos. Revise la consola para más detalles.',
            i18n_error:
                'No se pudo cargar el paquete de traducción para el idioma especificado',
            canceled: 'Acción cancelada',
            logged_out: 'Su sesión ha finalizado, por favor reconéctese.',
            not_authorized: "No está autorizado para acceder a este recurso.",
            application_update_available: 'Una nueva versión está disponible.',
            offline: 'Sin conectividad. No se pudieron obtener los datos.',
        },
        validation: {
            required: 'Requerido',
            minLength: 'Debe tener al menos %{min} caracteres',
            maxLength: 'Debe tener %{max} caracteres o menos',
            minValue: 'Debe ser al menos %{min}',
            maxValue: 'Debe ser %{max} o menos',
            number: 'Debe ser un número',
            email: 'Debe ser un correo electrónico válido',
            oneOf: 'Debe ser uno de: %{options}',
            regex: 'Debe coincidir con un formato específico (regexp): %{pattern}',
            unique: 'Debe ser único',
        },
        saved_queries: {
            label: 'Consultas guardadas',
            query_name: 'Nombre de la consulta',
            new_label: 'Guardar consulta actual...',
            new_dialog_title: 'Guardar consulta actual como',
            remove_label: 'Eliminar consulta guardada',
            remove_label_with_name: 'Eliminar consulta "%{name}"',
            remove_dialog_title: '¿Eliminar consulta guardada?',
            remove_message:
                '¿Está seguro de que quiere eliminar ese elemento de su lista de consultas guardadas?',
            help: 'Filtre la lista y guarde esta consulta para más tarde',
        },
        guesser: {
            empty: {
                title: 'Sin datos para adivinar el tipo de entrada',
                message: 'No se puede adivinar el tipo de entrada para un campo sin datos. Por favor, agregue algunos datos a este recurso y vuelva a intentarlo.',
            },
        },
        configurable: {
            customize: 'Personalizar esta página',
            configureMode: 'Configurar esta página',
            inspector: {
                title: 'Inspector',
                content: 'Pase el cursor sobre los elementos de la interfaz de usuario para configurarlos',
                reset: 'Restablecer configuración',
                hideAll: 'Ocultar todo',
                showAll: 'Mostrar todo',
            },
            Datagrid: {
                title: 'Tabla de datos',
                unlabeled: 'Columna sin etiqueta #%{column}',
            },
            SimpleForm: {
                title: 'Formulario simple',
                unlabeled: 'Input sin etiqueta #%{input}',
            },
            SimpleList: {
                title: 'Lista simple',
                primaryText: 'Texto principal',
                secondaryText: 'Texto secundario',
                tertiaryText: 'Texto terciario',
            },
        },
    },
};

export default spanishMessages;

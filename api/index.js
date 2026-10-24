// API de SIRAI
// Basada  del repositorio de que vimos en clase  (TC2007B-421-202624).
//
// Convenciones de comentarios en este archivo:
//   "Como el profe:"          -> igual que a lo que vimos en eljemplo de clase.
//   "NUEVO:"                  -> concepto que no está en el ejemplo de clase. Estas partes son investigaciones de Internet
//								Ademas de que se pudo Utilizar IA para guiarnos sobre como hacerlas. 

const express=require("express");
// NUEVO: mysql2 reemplaza a mongodb porque SIRAI usa una base SQL (MySQL).
// Su versión con promesas permite usar await, igual que el profe con mongodb.
const mysql=require("mysql2/promise");
var cors=require("cors")
const bodyParser=require("body-parser")
const argon2=require("argon2")
const jwt=require("jsonwebtoken")
// Como el profe (commit "Agregado https"): fs lee los archivos del certificado
// y https crea el servidor cifrado.
const fs=require("fs");
const https = require('https');

const app=express();
let db;
const PORT=3000;
app.use(cors());
app.use(bodyParser.json());

// Como el profe: la conexión se crea al iniciar, después de leer el .env.
// NUEVO: createPool abre varias conexiones a MySQL y las reutiliza
// (el profe usaba MongoClient). Los datos salen del .env, como en db.js de Capi.
// https://sidorares.github.io/node-mysql2/docs/documentation/promise-wrapper
async function connectToDB(){
	db=mysql.createPool({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		// NUEVO: devuelve las fechas como texto "2026-10-19" en lugar de objetos Date.
		dateStrings: true,
		// NUEVO: devuelve sumas y promedios (DECIMAL) como números y no como texto.
		decimalNumbers: true
	});
	await db.query("SELECT 1");
	console.log("conectado a la base de datos");
}

// Como el profe: guarda quién hizo qué sobre qué recurso.
// NUEVO: en SQL se guarda en la tabla "log" (el profe usaba una colección).
async function log(sujeto, accion, objeto){
	await db.query("INSERT INTO log (sujeto, accion, objeto) VALUES (?, ?, ?)", [String(sujeto), accion, objeto]);
}


// Token y roles

// Como el profe: el token llega en la cabecera "Authentication" y se verifica
// con la llave LLAVEJWT del .env. Si no es válido, jwt.verify lanza un error.
function leerToken(req){
	let token=req.get("Authentication");
	return jwt.verify(token, process.env.LLAVEJWT);
}

// NUEVO: un error con código HTTP. 400 = datos inválidos; 403 = sin permiso;
// 404 = no existe o el rol no puede verlo.
function errorHttp(status){
	let error=new Error("HTTP "+status);
	error.status=status;
	return error;
}

// NUEVO: revisa que el rol del token esté en la lista de roles permitidos.
// Es la versión del servidor de src/permisos.ts del frontend: el frontend
// solo oculta pantallas; aquí es donde realmente se niega el acceso.
function exigirRol(usuario, rolesPermitidos){
	if(!rolesPermitidos.includes(usuario.rol)){
		throw errorHttp(403);
	}
}

// responde según el error. Investgamos distitnos tipos de errores.
function responderError(error, res){
	let status=error.status || 500;
	if(error.name=="JsonWebTokenError" || error.name=="TokenExpiredError"){
		status=401;
	}
	const mensajes={
		400: "Revisa los datos enviados e inténtalo nuevamente.",
		401: "Tu sesión terminó o no es válida. Vuelve a iniciar sesión.",
		403: "No tienes permiso para realizar esta acción.",
		404: "No se encontró el registro solicitado."
	};
	if(status>=500){
		console.error(error.message);
	}
	// JSON permite que el frontend lea message sin mostrar detalles técnicos internos.
	res.status(status).json({message: mensajes[status] || "No se pudo completar la operación. Inténtalo nuevamente más tarde."});
}


// En esta parte nos guiamos con IA como investigación.
// NUEVO: cada recurso se describe con un objeto:
//   tabla:     nombre de la tabla o vista en MySQL.
//   columnas:  columnas que se pueden leer, ordenar, filtrar y guardar.
//              En SQL los nombres de columna no pueden enviarse como "?";
//              solo se aceptan los de esta lista para evitar inyección SQL.
//              (En MongoDB, como el profe, no hacía falta.)
//   busqueda:  columnas donde busca el filtro "q" (campo Buscar).
//   leer / crear / modificar: roles que pueden hacer cada acción.
//              Son las mismas reglas de src/permisos.ts.
//   alcance:   función que devuelve una condición SQL para que cada rol vea
//              solo sus registros (sala, estancia o hijos).
//   ocultas:   columnas que un rol no debe recibir.
//   validar:   función opcional que revisa o completa los datos antes de guardar.

// NUEVO (RF-10): en los catálogos, al EDITAR se ignora "codigo" (solo se cambia
// el nombre visible). Al crear, el código es obligatorio.
async function protegerCodigo(usuario, valores, cuerpo, esNuevo){
	if(esNuevo){
		if(!valores.codigo){
			throw errorHttp(400);
		}
	}else{
		delete valores.codigo;
	}
}

const TODOS=["administrador", "profesor", "doctor_asesor", "tutor"];

// atajo para "sin restricción de filas".
const sinFiltro={sql: "1=1", valores: []};

const estancias={
	tabla: "estancias",
	columnas: ["id", "clave_ebdi", "nombre", "estado", "ur", "activo"],
	busqueda: ["nombre", "estado", "ur"],
	leer: ["administrador", "profesor", "doctor_asesor"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		return {sql: "id = ?", valores: [usuario.estancia_id]};
	}
};

const salas={
	tabla: "salas",
	columnas: ["id", "estancia_id", "nombre", "grupo_edad", "activo"],
	busqueda: ["nombre", "grupo_edad"],
	leer: ["administrador", "profesor", "doctor_asesor"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="profesor") return {sql: "id = ?", valores: [usuario.sala_id]};
		return {sql: "estancia_id = ?", valores: [usuario.estancia_id]};
	}
};

const infantes={
	tabla: "infantes",
	columnas: ["id", "matricula", "curp", "nombre", "apellidos", "genero", "fecha_nacimiento",
		"sala_id", "estatus_id", "discapacidad", "activo", "fecha_registro", "fecha_baja", "motivo_baja_id"],
	busqueda: ["nombre", "apellidos", "matricula", "curp"],
	leer: TODOS,
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="profesor") return {sql: "sala_id = ?", valores: [usuario.sala_id]};
		if(usuario.rol=="doctor_asesor") return {sql: "sala_id IN (SELECT id FROM salas WHERE estancia_id = ?)", valores: [usuario.estancia_id]};
		return {sql: "id IN (SELECT infante_id FROM infante_tutor WHERE tutor_id = ?)", valores: [usuario.tutor_id]};
	},
	// El formulario de Infantes no pide la fecha de inscripción: si no viene,
	// se usa la fecha de hoy (la columna es obligatoria en la base).
	validar: async (usuario, valores, cuerpo, esNuevo)=>{
		if(esNuevo && !valores.fecha_registro){
			valores.fecha_registro=fechaHoy();
		}
	},
	// Se investigo como hacer los cambios. Se utilizo IA para guiarnos
	// NUEVO (RF-11): cada alta, cambio y baja queda en la tabla movimientos.
	despuesDeCrear: async (valores, usuario, id)=>{
		await registrarMovimiento(id, "ALTA", null, null, usuario);
	},
	despuesDeModificar: async (antes, valores, usuario)=>{
		if(valores.sala_id!==undefined && String(valores.sala_id)!=String(antes.sala_id)){
			await registrarMovimiento(antes.id, "CAMBIO_SALA", antes.sala_id, valores.sala_id, usuario);
		}
		if(valores.estatus_id!==undefined && String(valores.estatus_id)!=String(antes.estatus_id)){
			await registrarMovimiento(antes.id, "CAMBIO_ESTATUS", antes.estatus_id, valores.estatus_id, usuario);
		}
		if(valores.activo!==undefined && Number(valores.activo)==0 && Number(antes.activo)==1){
			await registrarMovimiento(antes.id, "BAJA", null, null, usuario);
		}
	}
};

// NUEVO (RF-11): guarda un movimiento del infante con la fecha de hoy y quién lo hizo.
// Se investigo como hacer los cambios. Se utilizo IA para guiarnos, y también para protegernos de inyecciones SQL
// valor_antes / valor_despues guardan el id anterior y el nuevo (sala o estatus).
async function registrarMovimiento(infanteId, tipo, antes, despues, usuario){
	await db.query(
		"INSERT INTO movimientos (infante_id, fecha, tipo, valor_antes, valor_despues, usuario_id) VALUES (?, CURDATE(), ?, ?, ?, ?)",
		[infanteId, tipo, antes===null ? null : String(antes), despues===null ? null : String(despues), usuario.usuario]
	);
}

// Solo de lectura y solo para el administrador. 
const movimientos={
	tabla: "movimientos",
	columnas: ["id", "infante_id", "fecha", "tipo", "valor_antes", "valor_despues", "usuario_id", "registrado"],
	busqueda: ["tipo"],
	columnaFecha: "fecha",
	leer: ["administrador"],
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

const padron_mensual={
	tabla: "padron_mensual",
	columnas: ["id", "periodo", "infante_id", "estancia_id", "estatus_id", "inscripcion_inicial"],
	busqueda: [],
	columnaFecha: "periodo",
	leer: ["administrador"],
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

// El profesor no tiene acceso a tutores: el reporte pide que no vea sus contactos.
const tutores={
	tabla: "tutores",
	columnas: ["id", "nombre", "apellidos", "telefono", "correo", "activo"],
	busqueda: ["nombre", "apellidos", "correo"],
	leer: ["administrador", "doctor_asesor", "tutor"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="tutor") return {sql: "id = ?", valores: [usuario.tutor_id]};
		return {
			sql: "id IN (SELECT it.tutor_id FROM infante_tutor it JOIN infantes i ON i.id = it.infante_id "+
				"JOIN salas s ON s.id = i.sala_id WHERE s.estancia_id = ?)",
			valores: [usuario.estancia_id]
		};
	}
};

const infante_tutor={
	tabla: "infante_tutor",
	columnas: ["id", "infante_id", "tutor_id", "parentesco", "autorizado_recoger", "contact_emergencia"],
	busqueda: ["parentesco"],
	leer: ["administrador"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: ()=>sinFiltro
};

// NUEVO: password_hash NO está en columnas: nunca se envía al navegador.
// Para esta parte nos guiamos con IA para la implementación del algoritmo de seguridad.
// Para crear o cambiar la contraseña, el formulario manda "password" y aquí
// se guarda cifrada con argon2 (como /registrarse del profe).
// Se siguió el Password Storage Cheat Sheet de OWASP: argon2id con parámetros por encima del mínimo recomendado
const usuarios={
	tabla: "usuarios",
	columnas: ["id", "nombre", "correo", "rol_id", "estancia_id", "sala_id", "tutor_id", "activo"],
	busqueda: ["nombre", "correo"],
	leer: ["administrador", "doctor_asesor"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		// El doctor solo ve a los doctores de su estancia (para elegir responsable).
		return {
			sql: "estancia_id = ? AND rol_id = (SELECT id FROM roles WHERE codigo = 'doctor_asesor')",
			valores: [usuario.estancia_id]
		};
	},
	validar: async (usuario, valores, cuerpo, esNuevo)=>{
		if(cuerpo.password){
			if(String(cuerpo.password).length<8){
				throw errorHttp(400);
			}
			valores.password_hash=await argon2.hash(String(cuerpo.password), {type:argon2.argon2id});
		}else if(esNuevo){
			// Un usuario nuevo necesita contraseña.
			throw errorHttp(400);
		}
	}
};

// Catálogos: solo consulta (la pantalla de catálogos aún no los administra).
const roles={
	tabla: "roles",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: ["administrador"],
	crear: [],
	modificar: ["administrador"],

	// RF-10: el código no se cambia al editar (las reglas de la API dependen de él).
	validar: protegerCodigo,
	alcance: ()=>sinFiltro
};

const estatus_infante={
	tabla: "estatus_infante",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: ["administrador", "profesor"],
	crear: ["administrador"],
	modificar: ["administrador"],

	// RF-10: el código no se cambia al editar (las reglas de la API dependen de él).
	validar: protegerCodigo,
	alcance: ()=>sinFiltro
};

const cat_estado_asistencia={
	tabla: "cat_estado_asistencia",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: TODOS,
	crear: ["administrador"],
	modificar: ["administrador"],

	// RF-10: el código no se cambia al editar (las reglas de la API dependen de él).
	validar: protegerCodigo,
	alcance: ()=>sinFiltro
};

// "codigo" (ENF_CASA, ACC_EXT, PER_TUT, NO_LOC, OTRO) lo usarán las reglas
// de alta médica y alertas; la pantalla muestra solo "nombre".
const motivos_falta={
	tabla: "motivos_falta",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: TODOS,
	crear: ["administrador"],
	modificar: ["administrador"],

	// RF-10: el código no se cambia al editar (las reglas de la API dependen de él).
	validar: protegerCodigo,
	alcance: ()=>sinFiltro
};

// Las asistencias se crean con POST /api/asistencias/lote (pase de lista).
const asistencias={
	tabla: "asistencias",
	columnas: ["id", "infante_id", "sala_id", "estancia_id", "fecha", "turno", "estado_id", "incidencia", "usuario_id", "registrado","hora_entrada", "hora_salida", "metodo"],
	busqueda: ["incidencia"],
	leer: TODOS,
	crear: [],
	modificar: [],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="profesor") return {sql: "sala_id = ?", valores: [usuario.sala_id]};
		if(usuario.rol=="doctor_asesor") return {sql: "estancia_id = ?", valores: [usuario.estancia_id]};
		return {sql: "infante_id IN (SELECT infante_id FROM infante_tutor WHERE tutor_id = ?)", valores: [usuario.tutor_id]};
	}
};

const justificaciones={
	tabla: "justificaciones",
	columnas: ["id", "asistencia_id", "tutor_id", "motivo_id", "comentario", "registrado"],
	busqueda: ["comentario"],
	leer: TODOS,
	crear: ["administrador", "tutor"],
	modificar: ["administrador", "tutor"],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="profesor") return {sql: "asistencia_id IN (SELECT id FROM asistencias WHERE sala_id = ?)", valores: [usuario.sala_id]};
		if(usuario.rol=="doctor_asesor") return {sql: "asistencia_id IN (SELECT id FROM asistencias WHERE estancia_id = ?)", valores: [usuario.estancia_id]};
		return {sql: "tutor_id = ?", valores: [usuario.tutor_id]};
	},

	// Se utilizo IA para guiarnos como implementarlo y para saber como implementrlo en otros metodos mas adelante
	// El comentario puede tener datos médicos: el profesor no lo recibe.
	ocultas: {profesor: ["comentario"]},
	validar: async (usuario, valores)=>{
		if(usuario.rol=="tutor"){
			// El tutor de la justificación es siempre el de la sesión, no el del formulario.
			valores.tutor_id=usuario.tutor_id;
			if(valores.asistencia_id!==undefined){
				// Solo puede justificar faltas de sus propios hijos.
				let [filas]=await db.query(
					"SELECT a.id FROM asistencias a JOIN infante_tutor it ON it.infante_id = a.infante_id "+
					"WHERE a.id = ? AND it.tutor_id = ?",
					[valores.asistencia_id, usuario.tutor_id]
				);
				if(filas.length==0){
					throw errorHttp(403);
				}
			}
		}
	},
	// NUEVO: al justificar una falta injustificada, pasa a "Falta justificada".
	// Se ejecuta después de guardar la justificación (ver createData).
	despuesDeCrear: async (valores)=>{
		await db.query(
			"UPDATE asistencias SET estado_id = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'falta_justificada') "+
			"WHERE id = ? AND estado_id = (SELECT id FROM cat_estado_asistencia WHERE codigo = 'falta_injustificada')",
			[valores.asistencia_id]
		);
	}
};

// Seguimientos de faltas: llamadas, causas, fecha de retorno y alta médica.
const seguimientos={
	tabla: "seguimientos",
	columnas: ["id", "asistencia_id", "responsable_id", "motivo_id", "causa", "registro_llamada",
		"fecha_retorno", "requiere_alta", "fecha_alta", "estado"],
	busqueda: ["causa", "registro_llamada"],
	leer: ["administrador", "doctor_asesor"],
	crear: ["administrador", "doctor_asesor"],
	modificar: ["administrador", "doctor_asesor"],
	// rol "profesor" no puede ver ni crear seguimientos, pero sí ve la alerta en la bandeja de asistencias.
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		return {sql: "asistencia_id IN (SELECT id FROM asistencias WHERE estancia_id = ?)", valores: [usuario.estancia_id]};
	},
	validar: async (usuario, valores)=>{
		if(usuario.rol=="doctor_asesor" && valores.asistencia_id!==undefined){
			// Solo faltas de su estancia.
			let [filas]=await db.query("SELECT id FROM asistencias WHERE id = ? AND estancia_id = ?", [valores.asistencia_id, usuario.estancia_id]);
			if(filas.length==0){
				throw errorHttp(403);
			}
		}
		// NUEVO (RN-04): "Enfermedad en casa" y "Accidente fuera de la estancia"
		// activan siempre "requiere alta", aunque el formulario diga que no.
		if(valores.motivo_id!==undefined && valores.motivo_id!==null){
			let [motivos]=await db.query("SELECT codigo FROM motivos_falta WHERE id = ?", [valores.motivo_id]);
			if(motivos.length>0 && MOTIVOS_REQUIEREN_ALTA.includes(motivos[0].codigo)){
				valores.requiere_alta=1;
			}
		}
	}
};


// Vista del esquema: cifras por estancia y mes, sin nombres de niños.
const reportes_asistencia={
	tabla: "reportes_asistencia",
	columnas: ["id", "estancia_id", "estancia_nombre", "periodo", "fecha_inicio", "estado", "ur",
		"total_registros", "presentes", "ausentes", "porcentaje_asistencia"],
	busqueda: ["estancia_nombre"],
	// NUEVO: los filtros "desde" y "hasta" del frontend se comparan con esta columna.
	columnaFecha: "fecha_inicio",
	leer: ["administrador"],
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

// NUEVO: historial de asistencia de los hijos del tutor (RF-31 y RF-32).
// Solo de lectura; "desde" filtra por fecha (la tarjeta pide el mes actual).
const mi_historial={
	tabla: "mi_historial",
	columnas: ["id", "infante_id", "tutor_id", "fecha", "turno", "hora_entrada", "estado_codigo", "estado_nombre", "es_falta", "justificada"],
	busqueda: [],
	columnaFecha: "fecha",
	leer: ["tutor"],
	crear: [],
	modificar: [],
	alcance: (usuario)=>{
		return {sql: "tutor_id = ?", valores: [usuario.tutor_id]};
	}
};

// NUEVO: causas que obligan a presentar alta médica para volver (RN-04).
const MOTIVOS_REQUIEREN_ALTA=["ENF_CASA", "ACC_EXT"];

// NUEVO: estados que significan que el niño entró a la estancia. Un niño con
// alta pendiente no puede guardarse con ninguno de ellos (RF-27).
const ESTADOS_ENTRADA=["presente", "filtro_salud"];

// NUEVO: vista del esquema con los niños que tienen alta médica pendiente.
// Solo de lectura; el profesor la usa en el pase de lista para avisar.
const alta_pendiente={
	tabla: "alta_pendiente",
	columnas: ["id", "infante_id", "sala_id", "estancia_id"],
	busqueda: [],
	leer: ["administrador", "profesor", "doctor_asesor"],
	crear: [],
	modificar: [],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		if(usuario.rol=="profesor") return {sql: "sala_id = ?", valores: [usuario.sala_id]};
		return {sql: "estancia_id = ?", valores: [usuario.estancia_id]};
	}
};

// NUEVO: vista del esquema con los seguimientos listos para atender (RF-21 y RF-22):
// nombre del niño, sala, tipo de falta y contactos de TODOS sus tutores.
// Solo de lectura y solo para el doctor/asesor, que ve únicamente su estancia.
// Para anotar la llamada se edita el seguimiento normal (/api/seguimientos/:id).
const bandeja_seguimientos={
	tabla: "bandeja_seguimientos",
	columnas: ["id", "asistencia_id", "estancia_id", "fecha", "turno", "infante_nombre", "sala_nombre",
		"tipo_falta", "estado", "causa", "fecha_retorno", "intentos", "contactos", "contactos_emergencia", "alerta"],
	busqueda: ["infante_nombre", "sala_nombre"],
	leer: ["doctor_asesor"],
	crear: [],
	modificar: [],
	alcance: (usuario)=>{
		return {sql: "estancia_id = ?", valores: [usuario.estancia_id]};
	}
};

// Vista del esquema: una fila por hijo del tutor.
const mi_asistencia={
	tabla: "mi_asistencia",
	columnas: ["id", "tutor_id", "nombre", "apellidos", "sala_nombre", "periodo", "porcentaje_asistencia", "estado_hoy"],
	busqueda: ["nombre", "apellidos"],
	leer: ["administrador", "tutor"],
	crear: [],
	modificar: [],
	alcance: (usuario)=>{
		if(usuario.rol=="administrador") return sinFiltro;
		return {sql: "tutor_id = ?", valores: [usuario.tutor_id]};
	}
};


// En esta parte utilizamos IA para guiarnos en la implementación de SQL , ya que el profesor lo hizo con MongoDB

// NUEVO: columnas que este usuario puede recibir (quita las ocultas de su rol).
function columnasVisibles(config, usuario){
	let ocultas=(config.ocultas && config.ocultas[usuario.rol]) || [];
	return config.columnas.filter((columna)=>!ocultas.includes(columna));
}

// NUEVO: convierte "true"/"false" de la URL en 1/0, que es como MySQL guarda BOOLEAN.
function valorFiltro(valor){
	if(valor=="true") return 1;
	if(valor=="false") return 0;
	return valor;
}

// NUEVO: arma el WHERE con el alcance del rol y los filtros que manda
// React-admin (por ejemplo ?sala_id=3 o ?q=Ana). Ignora parámetros que
// empiezan con "_" (_sort, _order, _start, _end) y columnas desconocidas.
function armarFiltros(config, usuario, query){
	let alcance=config.alcance(usuario);
	let visibles=columnasVisibles(config, usuario);
	let condiciones=[alcance.sql];
	let valores=[...alcance.valores];
	for(let campo in query){
		if(campo.startsWith("_")){
			continue;
		}
		if(campo=="q"){
			// Solo busca en columnas que este rol puede ver.
			let columnas=(config.busqueda || []).filter((columna)=>visibles.includes(columna));
			if(columnas.length>0){
				condiciones.push("("+columnas.map((columna)=>columna+" LIKE ?").join(" OR ")+")");
				columnas.forEach(()=>valores.push("%"+query.q+"%"));
			}
		}else if(campo=="desde" && config.columnaFecha){
			condiciones.push(config.columnaFecha+" >= ?");
			valores.push(query.desde);
		}else if(campo=="hasta" && config.columnaFecha){
			condiciones.push(config.columnaFecha+" <= ?");
			valores.push(query.hasta);
		}else if(visibles.includes(campo)){
			condiciones.push(campo+" = ?");
			valores.push(valorFiltro(query[campo]));
		}
	}
	return {where: condiciones.join(" AND "), valores: valores};
}

// Como el profe: lista ordenada y paginada con X-Total-Count.
async function getList(config, usuario, req, res){
	let visibles=columnasVisibles(config, usuario);
	let sortBy=visibles.includes(req.query._sort)?req.query._sort:"id";
	let sortOrder=req.query._order=="DESC"?"DESC":"ASC";
	let inicio=Number(req.query._start) || 0;
	let fin=Number(req.query._end) || inicio+10;
	let filtros=armarFiltros(config, usuario, req.query);
	// NUEVO: en lugar de traer todo y cortar con slice (como el profe),
	// SQL cuenta el total y devuelve solo la página con LIMIT y OFFSET.
	let [total]=await db.query("SELECT COUNT(*) AS total FROM "+config.tabla+" WHERE "+filtros.where, filtros.valores);
	let [data]=await db.query(
		"SELECT "+visibles.join(", ")+" FROM "+config.tabla+" WHERE "+filtros.where+
		" ORDER BY "+sortBy+" "+sortOrder+" LIMIT ? OFFSET ?",
		[...filtros.valores, fin-inicio, inicio]
	);
	res.set("Access-Control-Expose-Headers", "X-Total-Count");
	res.set("X-Total-Count", total[0].total);
	res.json(data);
}

// En esta parte utilizamos IA para unos problemas que se tenían por lo que se corrigo algunos aspectos del profe.
// Como el profe: varios registros por id (?id=1&id=2). Lo usan las referencias.
async function getMany(config, usuario, req, res){
	let alcance=config.alcance(usuario);
	// CORRECCIÓN DEL EJEMPLO: si llega un solo id, Express lo entrega como texto
	// y el ciclo del profe recorría sus caracteres. Aquí siempre es una lista.
	let ids=[].concat(req.query.id);
	// CORRECCIÓN DEL EJEMPLO: el profe escribió data.contact(...) (no existe);
	// debía ser concat. En SQL basta una sola consulta con IN.
	let [data]=await db.query(
		"SELECT "+columnasVisibles(config, usuario).join(", ")+" FROM "+config.tabla+" WHERE "+alcance.sql+" AND id IN (?)",
		[...alcance.valores, ids]
	);
	res.json(data);
}

// Como el profe: registros que cumplen los filtros, sin paginación.
async function getManyReference(config, usuario, req, res){
	let filtros=armarFiltros(config, usuario, req.query);
	let [data]=await db.query("SELECT "+columnasVisibles(config, usuario).join(", ")+" FROM "+config.tabla+" WHERE "+filtros.where, filtros.valores);
	res.set("Access-Control-Expose-Headers", "X-Total-Count");
	res.set("X-Total-Count", data.length);
	res.json(data);
}

// Como el profe: un registro por id.
async function getOne(config, usuario, id, req, res){
	let alcance=config.alcance(usuario);
	let [data]=await db.query(
		"SELECT "+columnasVisibles(config, usuario).join(", ")+" FROM "+config.tabla+" WHERE "+alcance.sql+" AND id = ?",
		[...alcance.valores, id]
	);
	if(data.length==0){
		// agregamos el error que hicimos al principio, 404 si no existe o si el rol no puede verlo.
		throw errorHttp(404);
	}
	res.json(data[0]);
}

// NUEVO: copia del cuerpo solo las columnas permitidas (sin id).
function valoresPermitidos(config, cuerpo){
	let valores={};
	for(let campo in cuerpo){
		if(campo!="id" && config.columnas.includes(campo)){
			valores[campo]=cuerpo[campo];
		}
	}
	return valores;
}

// Como el profe: actualiza y devuelve el registro actualizado.
async function updateData(config, usuario, id, req, res){
	let valores=valoresPermitidos(config, req.body);
	if(config.validar){
		await config.validar(usuario, valores, req.body, false);
	}
	if(Object.keys(valores).length==0){
		throw errorHttp(400);
	}
	let alcance=config.alcance(usuario);
	// NUEVO: algunos recursos necesitan los valores anteriores (movimientos, RF-11).
	let antes=null;
	if(config.despuesDeModificar){
		let [filas]=await db.query("SELECT * FROM "+config.tabla+" WHERE id = ?", [id]);
		antes=filas[0];
	}
	// NUEVO: "SET ?" de mysql2 convierte {nombre: "Ana"} en nombre = 'Ana'.
	// El alcance también va en el WHERE: nadie modifica registros que no puede ver.
	let [resultado]=await db.query(
		"UPDATE "+config.tabla+" SET ? WHERE "+alcance.sql+" AND id = ?",
		[valores, ...alcance.valores, id]
	);
	if(resultado.affectedRows==0){
		throw errorHttp(404);
	}
	if(config.despuesDeModificar && antes){
		await config.despuesDeModificar(antes, valores, usuario);
	}
	await getOne(config, usuario, id, req, res);
}

// Como el profe: crea el registro.
async function createData(config, usuario, req, res){
	let valores=valoresPermitidos(config, req.body);
	if(config.validar){
		await config.validar(usuario, valores, req.body, true);
	}
	if(Object.keys(valores).length==0){
		throw errorHttp(400);
	}
	// NUEVO: el id lo asigna MySQL (AUTO_INCREMENT); el profe lo recibía del formulario.
	let [resultado]=await db.query("INSERT INTO "+config.tabla+" SET ?", [valores]);
	// NUEVO: algunos recursos hacen algo más después de crear (justificaciones).
	if(config.despuesDeCrear){
		await config.despuesDeCrear(valores, usuario, resultado.insertId);
	}
	// NUEVO: React-admin necesita el id del registro creado en la respuesta.
	// Nunca se devuelve password_hash.
	delete valores.password_hash;
	res.json({...valores, id: resultado.insertId});
}

// Rutas

// De la API de Capi: comprobar que el servidor responde.
app.get("/", (req, res)=>{
	res.send("API de SIRAI funcionando");
});

// De la API de Capi: comprobar la conexión con la base de datos.
// Ahora pide token (como las demás rutas) y solo la usa el administrador.
app.get("/api/test-db", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador"]);
		let [resultado]=await db.query("SELECT DATABASE() AS base_de_datos");
		res.json({mensaje: "Conexión exitosa", base_de_datos: resultado[0].base_de_datos});
	}catch(error){
		responderError(error, res);
	}
});

// Explicación de IA :
//La carpeta mandada escribía las rutas de /Productos a mano. SIRAI tiene
// 15 recursos, así que esta función escribe las mismas rutas para cada uno.
// Hace exactamente lo que el profe hacía para /Productos:
//   GET    /api/recurso      -> getList, getMany o getManyReference
//   GET    /api/recurso/:id  -> getOne
//   PUT    /api/recurso/:id  -> updateData   (si algún rol puede modificar)
//   POST   /api/recurso      -> createData   (si algún rol puede crear)

//Cosas que cambiamos
// CORRECCIÓN DEL EJEMPLO: en el ejemplo, GET /:id, PUT y POST no revisaban el
// token; cualquiera podía leer o cambiar datos. Aquí todas las rutas lo revisan.


function registrarRutas(nombre, config){
	// Como el profe: una ruta GET decide entre getList, getMany y getManyReference.
	app.get("/api/"+nombre, async (req, res)=>{
		try{
			let usuario=leerToken(req);
			exigirRol(usuario, config.leer);
			await log(usuario.usuario, "consultar datos", "/"+nombre);
			if("_sort" in req.query){//getList
				await getList(config, usuario, req, res);
			}else if("id" in req.query){
				await getMany(config, usuario, req, res);
			}else{
				await getManyReference(config, usuario, req, res);
			}
		}catch(error){
			responderError(error, res);
		}
	});

	app.get("/api/"+nombre+"/:id", async (req, res)=>{
		try{
			let usuario=leerToken(req);
			exigirRol(usuario, config.leer);
			await log(usuario.usuario, "consultar registro", "/"+nombre+"/"+req.params.id);
			await getOne(config, usuario, req.params.id, req, res);
		}catch(error){
			responderError(error, res);
		}
	});

	if(config.modificar.length>0){
		app.put("/api/"+nombre+"/:id", async (req, res)=>{
			try{
				let usuario=leerToken(req);
				exigirRol(usuario, config.modificar);
				await log(usuario.usuario, "modificar", "/"+nombre+"/"+req.params.id);
				await updateData(config, usuario, req.params.id, req, res);
			}catch(error){
				responderError(error, res);
			}
		});
	}

	if(config.crear.length>0){
		app.post("/api/"+nombre, async (req, res)=>{
			try{
				let usuario=leerToken(req);
				exigirRol(usuario, config.crear);
				await log(usuario.usuario, "crear", "/"+nombre);
				await createData(config, usuario, req, res);
			}catch(error){
				responderError(error, res);
			}
		});
	}
}

// Hora de Corte y seguimiento de faltas

// hora en que se cierra el pase de lista de cada turno (RN-02 del SRS).
// El SRS fija 09:00 para el matutino; 14:00 para el vespertino es decisión
// del equipo. Se comparan como texto "HH:MM" con la hora de esta computadora.
const HORA_CORTE_MATUTINO="09:00";
const HORA_CORTE_VESPERTINO="14:00";

//Estados de asistencia que significan que el niño no entró a la estancia y hay que hacer seguimiento.
const ESTADOS_FALTA=["falta_justificada", "falta_injustificada", "licencia_medica"];
// Solo el administrador y el doctor/asesor pueden corregir después del corte.
const ROLES_CORRIGEN_DESPUES_DEL_CORTE=["administrador", "doctor_asesor"];

// sirve para poner un cero delante de los números de un dígito (mes, día, hora, minuto). Se necesita para que la fecha y hora se comparen como texto.
function dosDigitos(numero){
	if(numero<10){
		return "0"+numero;
	}
	return String(numero);
}

// Se utiliza para introducir la fecha de hoy en los filtros de la bandeja de seguimientos y en el pase de lista.
// https://marmelab.com/react-admin/TimeInput.html
function fechaHoy(){
	let ahora=new Date();
	return ahora.getFullYear()+"-"+dosDigitos(ahora.getMonth()+1)+"-"+dosDigitos(ahora.getDate());
}

function horaActual(){
	let ahora=new Date();
	return dosDigitos(ahora.getHours())+":"+dosDigitos(ahora.getMinutes());
}

function horaCorte(turno){
	if(turno=="matutino"){
		return HORA_CORTE_MATUTINO;
	}
	return HORA_CORTE_VESPERTINO;
}

// Los textos "AAAA-MM-DD" y "HH:MM" se pueden comparar con < y >=.
function turnoCerrado(fecha, turno){
	let hoy=fechaHoy();
	if(fecha<hoy){
		return true;
	}
	if(fecha>hoy){
		return false;
	}
	return horaActual()>=horaCorte(turno);
}

// NUEVO: crea un seguimiento "pendiente" para cada falta de un turno ya
// cerrado que todavía no tenga uno. La llave única de seguimientos
// (asistencia_id) y el NOT EXISTS evitan duplicados aunque se llame
// muchas veces. Devuelve cuántos seguimientos creó.
// En las partes de SQL se hizo con apoyo de IA 

async function generarSeguimientos(){
	let hoy=fechaHoy();
	// Turnos de HOY que ya pasaron su hora de corte.
	let cerradosHoy=[];
	if(turnoCerrado(hoy, "matutino")){
		cerradosHoy.push("matutino");
	}
	if(turnoCerrado(hoy, "vespertino")){
		cerradosHoy.push("vespertino");
	}
	if(cerradosHoy.length==0){
		// "IN ()" vacío no es válido en SQL; este valor no coincide con ningún turno.
		cerradosHoy.push("ninguno");
	}
	// NUEVO: INSERT ... SELECT crea filas a partir del resultado de una consulta.
	let [resultado]=await db.query(
		"INSERT INTO seguimientos (asistencia_id, estado) "+
		"SELECT a.id, 'pendiente' FROM asistencias a "+
		"JOIN cat_estado_asistencia c ON c.id = a.estado_id "+
		"WHERE c.codigo IN (?) "+
		"AND (a.fecha < ? OR (a.fecha = ? AND a.turno IN (?))) "+
		"AND NOT EXISTS (SELECT 1 FROM seguimientos s WHERE s.asistencia_id = a.id)",
		[ESTADOS_FALTA, hoy, hoy, cerradosHoy]
	);
	if(resultado.affectedRows>0){
		await log("sistema", "generar seguimientos", resultado.affectedRows+" faltas");
	}
	return resultado.affectedRows;
}

// NUEVO: pase de lista de todo el grupo en un solo envío (PaseLista.tsx).
// Usa una transacción: o se guardan todos los niños o ninguno.
// Endpoint: POST /api/asistencias/lote
// Se utilizo IA para endpoints
app.post("/api/asistencias/lote", async (req, res)=>{
	let conexion;
	try{
		let usuario=leerToken(req);
		// El doctor/asesor también puede, para corregir después del corte.
		exigirRol(usuario, ["administrador", "profesor", "doctor_asesor"]);
		let {sala_id, fecha, turno, registros}=req.body;
		if(!sala_id || !fecha || !["matutino", "vespertino"].includes(turno) || !Array.isArray(registros) || registros.length==0){
			throw errorHttp(400);
		}
		// El profesor solo pasa lista de su sala.
		if(usuario.rol=="profesor" && Number(sala_id)!=Number(usuario.sala_id)){
			throw errorHttp(403);
		}
		// La estancia se toma de la sala en la base, no del navegador.
		let [salasEncontradas]=await db.query("SELECT estancia_id FROM salas WHERE id = ?", [sala_id]);
		if(salasEncontradas.length==0){
			throw errorHttp(400);
		}
		let estancia_id=salasEncontradas[0].estancia_id;
		// El doctor/asesor solo corrige salas de su estancia.
		if(usuario.rol=="doctor_asesor" && Number(estancia_id)!=Number(usuario.estancia_id)){
			throw errorHttp(403);
		}
		// NUEVO: corte del pase de lista. Después de la hora de corte, el
		// profesor ya no puede guardar; solo administrador y doctor/asesor.
		let cerrado=turnoCerrado(fecha, turno);
		if(cerrado && !ROLES_CORRIGEN_DESPUES_DEL_CORTE.includes(usuario.rol)){
			// "message" es el texto que React-admin muestra con el error.
			res.status(403).json({message: "El pase de lista "+turno+" cerró a las "+horaCorte(turno)});
			return;
		}
		// Todos los niños deben ser activos y de esa sala.
		let ids=registros.map((registro)=>registro.infante_id);
		let [ninos]=await db.query("SELECT id FROM infantes WHERE sala_id = ? AND activo = TRUE AND id IN (?)", [sala_id, ids]);
		if(ninos.length!=new Set(ids.map(String)).size){
			throw errorHttp(400);
		}
		// NUEVO (RF-27): un niño con alta médica pendiente no puede guardarse como
		// Presente ni Filtro de salud. Si pasa, no se guarda nada y se dice quién es.
		let [estadosEntrada]=await db.query("SELECT id FROM cat_estado_asistencia WHERE codigo IN (?)", [ESTADOS_ENTRADA]);
		let idsEntrada=estadosEntrada.map((estado)=>Number(estado.id));
		let ninosQueEntran=[];
		for(let registro of registros){
			if(idsEntrada.includes(Number(registro.estado_id))){
				ninosQueEntran.push(registro.infante_id);
			}
		}
		if(ninosQueEntran.length>0){
			let [bloqueados]=await db.query(
				"SELECT DISTINCT CONCAT(i.nombre, ' ', i.apellidos) AS nombre FROM alta_pendiente ap "+
				"JOIN infantes i ON i.id = ap.infante_id WHERE ap.infante_id IN (?)",
				[ninosQueEntran]
			);
			if(bloqueados.length>0){
				let nombres=bloqueados.map((fila)=>fila.nombre).join(", ");
				res.status(409).json({message: nombres+" requiere alta médica para entrar"});
				return;
			}
		}
		await log(usuario.usuario, "pase de lista", "/asistencias/lote sala "+sala_id+" "+fecha+" "+turno);
		conexion=await db.getConnection();
		await conexion.beginTransaction();
		for(let registro of registros){
			let horaEntrada=null;
			if(idsEntrada.includes(Number(registro.estado_id))){
				if(/^([01]\d|2[0-3]):[0-5]\d$/.test(registro.hora_entrada || "")){
					horaEntrada=registro.hora_entrada;
				}else{
					horaEntrada=horaActual();
				}
			}
			await conexion.query(
			"INSERT INTO asistencias (infante_id, sala_id, estancia_id, fecha, turno, estado_id, incidencia, usuario_id, hora_entrada) "+
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?,?) "+
				"ON DUPLICATE KEY UPDATE estado_id = VALUES(estado_id), incidencia = VALUES(incidencia), usuario_id = VALUES(usuario_id), hora_entrada = VALUES(hora_entrada)",
				[registro.infante_id, sala_id, estancia_id, fecha, turno, registro.estado_id, registro.incidencia || null, usuario.usuario, horaEntrada]
			);
		}
		await conexion.commit();
		let seguimientosCreados=0;
		if(cerrado){
			seguimientosCreados=await generarSeguimientos();
		}
		res.json({guardados: registros.length, seguimientos_creados: seguimientosCreados});
	}catch(error){
		if(conexion){
			await conexion.rollback();
		}
		responderError(error, res);
	}finally{
		if(conexion){
			conexion.release();
		}
	}
});
app.put("/api/asistencias/:id/salida", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		// Solo el doctor/asesor registra la salida (decisión de diseño del equipo).
		exigirRol(usuario, ["doctor_asesor"]);
		// Se reutiliza el alcance de asistencias: el doctor solo ve su estancia.
		// Si la asistencia es de otra estancia, responde 404.
		let alcance=asistencias.alcance(usuario);
		let [filas]=await db.query(
			"SELECT id, fecha, hora_entrada, hora_salida FROM asistencias WHERE id = ? AND "+alcance.sql,
			[req.params.id, ...alcance.valores]
		);
		if(filas.length==0){
			throw errorHttp(404);
		}
		let asistencia=filas[0];
		// Solo puede salir un niño que entró.
		if(!asistencia.hora_entrada){
			res.status(409).json({message: "No se puede registrar la salida de un niño que no entró"});
			return;
		}
		// Hora enviada (HH:MM) o, si no viene, la hora del servidor.
		let horaSalida=horaActual();
		if(req.body.hora_salida!==undefined){
			if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(req.body.hora_salida))){
				throw errorHttp(400);
			}
			horaSalida=req.body.hora_salida;
		}
		// MySQL devuelve TIME como "08:30:00"; se comparan solo horas y minutos.
		if(horaSalida<=String(asistencia.hora_entrada).slice(0, 5)){
			res.status(400).json({message: "La salida debe ser después de la entrada ("+String(asistencia.hora_entrada).slice(0, 5)+")"});
			return;
		}
		await db.query("UPDATE asistencias SET hora_salida = ? WHERE id = ?", [horaSalida, asistencia.id]);
		await log(usuario.usuario, "registrar salida", "/asistencias/"+asistencia.id+"/salida "+horaSalida);
		res.json({id: asistencia.id, hora_salida: horaSalida});
	}catch(error){
		responderError(error, res);
	}
});

// NUEVO (RF-24): el doctor/asesor registra un intento de llamada al tutor.
// Suma 1 a "intentos" y guarda la hora; la bandeja usa esa hora para avisar
// del segundo intento dentro de 4 horas.
app.post("/api/seguimientos/:id/intento", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador", "doctor_asesor"]);
		let alcance=seguimientos.alcance(usuario);
		let [resultado]=await db.query(
			"UPDATE seguimientos SET intentos = intentos + 1, ultimo_intento = NOW() WHERE "+alcance.sql+" AND id = ?",
			[...alcance.valores, req.params.id]
		);
		if(resultado.affectedRows==0){
			throw errorHttp(404);
		}
		await log(usuario.usuario, "intento de llamada", "/seguimientos/"+req.params.id);
		res.json({id: Number(req.params.id)});
	}catch(error){
		responderError(error, res);
	}
});

// NUEVO (RF-11): cierre de mes. Guarda una fila por cada niño activo con su
// estancia y estatus. INSERT IGNORE + llave única (periodo, infante_id) evitan
// duplicar si se presiona dos veces. "inscripcion_inicial" es verdadero si es
// el primer mes del niño en el padrón.
app.post("/api/padron_mensual/cierre", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador"]);
		let hoy=fechaHoy();
		let periodo=hoy.slice(0, 8)+"01";
		let [resultado]=await db.query(
			"INSERT IGNORE INTO padron_mensual (periodo, infante_id, estancia_id, estatus_id, inscripcion_inicial) "+
			"SELECT ?, i.id, s.estancia_id, i.estatus_id, "+
			"NOT EXISTS (SELECT 1 FROM padron_mensual p WHERE p.infante_id = i.id AND p.periodo < ?) "+
			"FROM infantes i JOIN salas s ON s.id = i.sala_id WHERE i.activo = TRUE",
			[periodo, periodo]
		);
		await log(usuario.usuario, "cierre de mes", "/padron_mensual "+periodo);
		res.json({periodo: periodo, agregados: resultado.affectedRows});
	}catch(error){
		responderError(error, res);
	}
});

// NUEVO: aviso de privacidad vigente (AvisoPrivacidad.tsx pide el id "vigente").
app.get("/api/avisos_privacidad/vigente", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador", "tutor"]);
		let [filas]=await db.query("SELECT id, version, texto, publicado FROM avisos_privacidad WHERE vigente = TRUE ORDER BY publicado DESC LIMIT 1");
		if(filas.length==0){
			throw errorHttp(404);
		}
		res.json(filas[0]);
	}catch(error){
		responderError(error, res);
	}
});

// NUEVO: el tutor registra su consentimiento. El tutor sale del token.
app.post("/api/consentimientos", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["tutor"]);
		let aviso_id=req.body.aviso_id;
		let [avisos]=await db.query("SELECT id FROM avisos_privacidad WHERE id = ?", [aviso_id]);
		if(avisos.length==0){
			throw errorHttp(400);
		}
		await log(usuario.usuario, "consentimiento", "/consentimientos aviso "+aviso_id);
		// INSERT IGNORE: si ya aceptó esa versión, no se duplica (llave única).
		await db.query("INSERT IGNORE INTO consentimientos (tutor_id, aviso_id) VALUES (?, ?)", [usuario.tutor_id, aviso_id]);
		let [filas]=await db.query("SELECT id, tutor_id, aviso_id, aceptado FROM consentimientos WHERE tutor_id = ? AND aviso_id = ?", [usuario.tutor_id, aviso_id]);
		res.json(filas[0]);
	}catch(error){
		responderError(error, res);
	}
});

registrarRutas("estancias", estancias);
registrarRutas("salas", salas);
registrarRutas("infantes", infantes);
registrarRutas("tutores", tutores);
registrarRutas("infante_tutor", infante_tutor);
registrarRutas("usuarios", usuarios);
registrarRutas("roles", roles);
registrarRutas("estatus_infante", estatus_infante);
registrarRutas("cat_estado_asistencia", cat_estado_asistencia);
registrarRutas("motivos_falta", motivos_falta);
registrarRutas("asistencias", asistencias);
registrarRutas("justificaciones", justificaciones);
registrarRutas("seguimientos", seguimientos);
registrarRutas("reportes_asistencia", reportes_asistencia);
registrarRutas("mi_asistencia", mi_asistencia);
registrarRutas("bandeja_seguimientos", bandeja_seguimientos);
registrarRutas("alta_pendiente", alta_pendiente);
registrarRutas("mi_historial", mi_historial);
registrarRutas("movimientos", movimientos);
registrarRutas("padron_mensual", padron_mensual);


// Como el profe: /login con usuario y contraseña.
app.post("/api/login", async (req, res)=>{
	try{
		let user=req.body.username;
		let pass=req.body.password;
		// NUEVO: el usuario es el correo, y se une con roles para obtener el código del rol.
		// Esto con fin de que el token guarde el rol y el alcance (estancia, sala, tutor) del usuario.
		let [filas]=await db.query(
			"SELECT u.id, u.nombre, u.password_hash, u.estancia_id, u.sala_id, u.tutor_id, r.codigo AS rol "+
			"FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ? AND u.activo = TRUE",
			[user]
		);


		let data=filas[0];
		if(data==null){
			res.status(401).json({message: "Usuario o contraseña incorrectos."});
			// Integramos un await, por que en el del profe no estaba y luego aeptaba cualquier contraseña aunque el usuario no existiera.

		}else if(await argon2.verify(data.password_hash, String(pass))){
			// NUEVO: el token guarda también el rol y el alcance (estancia, sala, tutor)
			// para que cada ruta sepa qué puede ver este usuario.
			let token=jwt.sign({
				"usuario": data.id,
				"rol": data.rol,
				"estancia_id": data.estancia_id,
				"sala_id": data.sala_id,
				"tutor_id": data.tutor_id
			}, process.env.LLAVEJWT, {expiresIn:1000})
			await log(data.id, "iniciar sesión", "/login");
			// NUEVO: además de token e id (profe), se envían fullName y rol para el frontend.
			res.json({"token":token, "id":data.id, "fullName":data.nombre, "rol":data.rol});
		}else{
			res.status(401).json({message: "Usuario o contraseña incorrectos."});
		}
	}catch(error){
		responderError(error, res);
	}
})

// Las rutas inexistentes y los errores del procesamiento de JSON también se traducen.
app.use((req, res)=>{
	res.status(404).json({message: "No se encontró la dirección solicitada."});
});
app.use((error, req, res, next)=>{
	responderError(error, res);
});

// Como el profe: servidor HTTPS con server.key y server.crt.
// HTTPS cifra el token y las contraseñas mientras viajan por la red.
// Los archivos se generan con openssl (ver api/README.md) y no se suben a GitHub.
const options = {
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.crt')
};

// NUEVO: revisa el corte una vez. Si algo falla, lo anota y la API sigue.
// Esta es para el corte y seguimiento de faltas, que se hace al arrancar y cada minuto (setInterval).
async function revisarCorte(){
	try{
		let creados=await generarSeguimientos();
		if(creados>0){
			console.log("Seguimientos creados por el corte: "+creados);
		}
	}catch(error){
		console.error("No se pudieron generar los seguimientos: "+error.message);
	}
}

https.createServer(options, app).listen(PORT, async () => {
	await process.loadEnvFile(".env");
	await connectToDB();
	console.log('HTTPS Server running on port 3000');
	// NUEVO: al arrancar se revisa el corte (por si la API estaba apagada a la
	// hora de corte) y después, con setInterval, cada minuto (60 000 ms).
	await revisarCorte();
	setInterval(revisarCorte, 60000);
});

/* Como el profe: versión HTTP, solo para pruebas sin certificado.
app.listen(PORT, async ()=>{
	await process.loadEnvFile(".env")
	await connectToDB();
	console.log("aplicacion iniciada en puerto 3000")
	await revisarCorte();
	setInterval(revisarCorte, 60000);
});*/

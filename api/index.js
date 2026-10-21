// API de SIRAI.
// Basada en backend/index.js del repositorio de clase (TC2007B-421-202624).
// Se conserva su estructura: funciones genéricas getList, getMany,
// getManyReference, getOne, updateData y createData, una ruta GET que decide
// entre ellas, log() y /login con argon2 + jsonwebtoken.
//
// Convenciones de comentarios en este archivo:
//   "Como el profe:"          -> igual que el ejemplo de clase.
//   "NUEVO:"                  -> concepto que no está en el ejemplo de clase.
//   "CORRECCIÓN DEL EJEMPLO:" -> error del ejemplo de clase que aquí se corrige.

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

// =====================================================================
// Token y roles
// =====================================================================

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

// NUEVO: responde según el error. El profe respondía 401 siempre.
function responderError(error, res){
	if(error.status){
		res.sendStatus(error.status);
	}else if(error.name=="JsonWebTokenError" || error.name=="TokenExpiredError"){
		res.sendStatus(401);
	}else{
		console.error(error.message);
		res.sendStatus(500);
	}
}

// =====================================================================
// Configuración de cada tabla
// =====================================================================
//
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

const TODOS=["administrador", "profesor", "doctor_asesor", "tutor"];

// NUEVO: atajo para "sin restricción de filas".
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
	}
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
	columnas: ["id", "infante_id", "tutor_id", "parentesco", "autorizado_recoger"],
	busqueda: ["parentesco"],
	leer: ["administrador"],
	crear: ["administrador"],
	modificar: ["administrador"],
	alcance: ()=>sinFiltro
};

// NUEVO: password_hash NO está en columnas: nunca se envía al navegador.
// Para crear o cambiar la contraseña, el formulario manda "password" y aquí
// se guarda cifrada con argon2 (como /registrarse del profe).
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
	modificar: [],
	alcance: ()=>sinFiltro
};

const estatus_infante={
	tabla: "estatus_infante",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: ["administrador", "profesor"],
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

const cat_estado_asistencia={
	tabla: "cat_estado_asistencia",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: TODOS,
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

// "codigo" (ENF_CASA, ACC_EXT, PER_TUT, NO_LOC, OTRO) lo usarán las reglas
// de alta médica y alertas; la pantalla muestra solo "nombre".
const motivos_falta={
	tabla: "motivos_falta",
	columnas: ["id", "codigo", "nombre"],
	busqueda: ["nombre"],
	leer: TODOS,
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
};

// Las asistencias se crean con POST /api/asistencias/lote (pase de lista).
const asistencias={
	tabla: "asistencias",
	columnas: ["id", "infante_id", "sala_id", "estancia_id", "fecha", "turno", "estado_id", "incidencia", "usuario_id", "registrado"],
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
	}
};

const seguimientos={
	tabla: "seguimientos",
	columnas: ["id", "asistencia_id", "responsable_id", "motivo_id", "causa", "registro_llamada",
		"fecha_retorno", "requiere_alta", "fecha_alta", "estado"],
	busqueda: ["causa", "registro_llamada"],
	leer: ["administrador", "doctor_asesor"],
	crear: ["administrador", "doctor_asesor"],
	modificar: ["administrador", "doctor_asesor"],
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
	}
};

// Vista del esquema: cifras por estancia y mes, sin nombres de niños.
const reportes_asistencia={
	tabla: "reportes_asistencia",
	columnas: ["id", "estancia_id", "estancia_nombre", "periodo", "fecha_inicio",
		"total_registros", "presentes", "ausentes", "porcentaje_asistencia"],
	busqueda: ["estancia_nombre"],
	// NUEVO: los filtros "desde" y "hasta" del frontend se comparan con esta columna.
	columnaFecha: "fecha_inicio",
	leer: ["administrador"],
	crear: [],
	modificar: [],
	alcance: ()=>sinFiltro
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

// =====================================================================
// Funciones genéricas (las mismas del profe, escritas en SQL)
// =====================================================================

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
		// NUEVO: 404 si no existe o si el rol no puede verlo.
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
	// NUEVO: "SET ?" de mysql2 convierte {nombre: "Ana"} en nombre = 'Ana'.
	// El alcance también va en el WHERE: nadie modifica registros que no puede ver.
	let [resultado]=await db.query(
		"UPDATE "+config.tabla+" SET ? WHERE "+alcance.sql+" AND id = ?",
		[valores, ...alcance.valores, id]
	);
	if(resultado.affectedRows==0){
		throw errorHttp(404);
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
	// NUEVO: React-admin necesita el id del registro creado en la respuesta.
	// Nunca se devuelve password_hash.
	delete valores.password_hash;
	res.json({...valores, id: resultado.insertId});
}

// =====================================================================
// Rutas
// =====================================================================

// De la API de Capi: comprobar que el servidor responde.
app.get("/", (req, res)=>{
	res.send("API de SIRAI funcionando");
});

// De la API de Capi: comprobar la conexión con la base de datos.
// CORRECCIÓN: antes era pública y cualquiera podía ver el nombre de la base.
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

// NUEVO: el profe escribía las rutas de /Productos a mano. SIRAI tiene
// 15 recursos, así que esta función escribe las mismas rutas para cada uno.
// Hace exactamente lo que el profe hacía para /Productos:
//   GET    /api/recurso      -> getList, getMany o getManyReference
//   GET    /api/recurso/:id  -> getOne
//   PUT    /api/recurso/:id  -> updateData   (si algún rol puede modificar)
//   POST   /api/recurso      -> createData   (si algún rol puede crear)
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

// Rutas propias que deben ir ANTES de registrarRutas, porque Express revisa
// las rutas en orden y "/api/avisos_privacidad/:id" atraparía "vigente".

// =====================================================================
// Corte del pase de lista y seguimiento automático (RF-16 y RF-20)
// =====================================================================

// NUEVO: hora en que se cierra el pase de lista de cada turno (RN-02 del SRS).
// El SRS fija 09:00 para el matutino; 14:00 para el vespertino es decisión
// del equipo. Se comparan como texto "HH:MM" con la hora de esta computadora.
const HORA_CORTE_MATUTINO="09:00";
const HORA_CORTE_VESPERTINO="14:00";

// NUEVO: estados que cuentan como falta y generan un seguimiento (RN-03).
const ESTADOS_FALTA=["falta_justificada", "falta_injustificada", "licencia_medica"];

// NUEVO: después del corte solo estos roles pueden corregir el pase de lista.
const ROLES_CORRIGEN_DESPUES_DEL_CORTE=["administrador", "doctor_asesor"];

// NUEVO: rellena con un cero a la izquierda: 7 -> "07".
function dosDigitos(numero){
	if(numero<10){
		return "0"+numero;
	}
	return String(numero);
}

// NUEVO: fecha de hoy como "2026-10-21", con la hora local (no UTC).
function fechaHoy(){
	let ahora=new Date();
	return ahora.getFullYear()+"-"+dosDigitos(ahora.getMonth()+1)+"-"+dosDigitos(ahora.getDate());
}

// NUEVO: hora actual como "08:45".
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

// NUEVO: true si el pase de lista de esa fecha y turno ya cerró.
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
		await log(usuario.usuario, "pase de lista", "/asistencias/lote sala "+sala_id+" "+fecha+" "+turno);
		// NUEVO: getConnection toma una conexión del pool para la transacción.
		conexion=await db.getConnection();
		await conexion.beginTransaction();
		for(let registro of registros){
			// NUEVO: ON DUPLICATE KEY UPDATE: si ya existe la asistencia de ese niño,
			// fecha y turno (llave única), se actualiza en lugar de duplicarse.
			await conexion.query(
				"INSERT INTO asistencias (infante_id, sala_id, estancia_id, fecha, turno, estado_id, incidencia, usuario_id) "+
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?) "+
				"ON DUPLICATE KEY UPDATE estado_id = VALUES(estado_id), incidencia = VALUES(incidencia), usuario_id = VALUES(usuario_id)",
				[registro.infante_id, sala_id, estancia_id, fecha, turno, registro.estado_id, registro.incidencia || null, usuario.usuario]
			);
		}
		await conexion.commit();
		// NUEVO: si el turno ya estaba cerrado (corrección), se crean de una vez
		// los seguimientos de las faltas que todavía no tengan uno.
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

// NUEVO: no hay rutas DELETE. El profe borraba registros; en SIRAI se usa baja
// lógica (activo = FALSE) y nadie tiene permiso "delete" en src/permisos.ts.

// NUEVO: no hay ruta /registrarse. En SIRAI el administrador crea los usuarios
// (POST /api/usuarios) y el primero se crea con "node crearAdmin.js".

// Como el profe: /login con usuario y contraseña.
app.post("/api/login", async (req, res)=>{
	try{
		let user=req.body.username;
		let pass=req.body.password;
		// NUEVO: el usuario es el correo, y se une con roles para obtener el código del rol.
		let [filas]=await db.query(
			"SELECT u.id, u.nombre, u.password_hash, u.estancia_id, u.sala_id, u.tutor_id, r.codigo AS rol "+
			"FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ? AND u.activo = TRUE",
			[user]
		);
		let data=filas[0];
		if(data==null){
			res.sendStatus(401);
		// CORRECCIÓN DEL EJEMPLO: el profe escribió argon2.verify(...) sin await.
		// verify devuelve una promesa, y una promesa siempre cuenta como verdadera,
		// así que el ejemplo aceptaba CUALQUIER contraseña. Con await se revisa de verdad.
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
			res.sendStatus(401);
		}
	}catch(error){
		responderError(error, res);
	}
})

// Como el profe: servidor HTTPS con server.key y server.crt.
// HTTPS cifra el token y las contraseñas mientras viajan por la red.
// Los archivos se generan con openssl (ver api/README.md) y no se suben a GitHub.
const options = {
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.crt')
};

// NUEVO: revisa el corte una vez. Si algo falla, lo anota y la API sigue.
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

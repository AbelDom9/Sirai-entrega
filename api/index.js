// API de SIRAI.
// Basada en backend/index.js del repositorio de clase (TC2007B-421-202624).
// Se conserva su estructura: funciones genéricas getList, getMany,
// getManyReference, getOne, updateData y createData, una ruta por recurso,
// log() y /login con argon2 + jsonwebtoken.
//
// Convenciones de comentarios en este archivo:
//   "Como el profe:"       -> igual que el ejemplo de clase.
//   "NUEVO:"               -> concepto que no está en el ejemplo de clase.
//   "CORRECCIÓN DEL EJEMPLO:" -> error del ejemplo de clase que aquí se corrige.

const express=require("express");
// NUEVO: mysql2 reemplaza a mongodb porque SIRAI usa una base SQL (MySQL).
// Su versión con promesas permite usar await, igual que el profe con mongodb.
const mysql=require("mysql2/promise");
var cors=require("cors")
const bodyParser=require("body-parser")
const argon2=require("argon2")
const jwt=require("jsonwebtoken")

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
		dateStrings: true
	});
	await db.query("SELECT 1");
	console.log("conectado a la base de datos");
}

// Como el profe: guarda quién hizo qué sobre qué recurso.
// NUEVO: en SQL se guarda en la tabla "log" (el profe usaba una colección).
async function log(sujeto, accion, objeto){
	await db.query("INSERT INTO log (sujeto, accion, objeto) VALUES (?, ?, ?)", [String(sujeto), accion, objeto]);
}

// ---------------------------------------------------------------------
// Token y roles
// ---------------------------------------------------------------------

// Como el profe: el token llega en la cabecera "Authentication" y se verifica
// con la llave LLAVEJWT del .env. Si no es válido, jwt.verify lanza un error.
function leerToken(req){
	let token=req.get("Authentication");
	return jwt.verify(token, process.env.LLAVEJWT);
}

// NUEVO: un error con código HTTP. 401 = sin sesión válida; 403 = sin permiso.
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

// NUEVO: responde 401 o 403 según el error. El profe respondía 401 siempre.
function responderError(error, res){
	if(error.status==403){
		res.sendStatus(403);
	}else if(error.status==404){
		res.sendStatus(404);
	}else if(error.status==400){
		res.sendStatus(400);
	}else if(error.name=="JsonWebTokenError" || error.name=="TokenExpiredError"){
		res.sendStatus(401);
	}else{
		console.error(error.message);
		res.sendStatus(500);
	}
}

// ---------------------------------------------------------------------
// Configuración de cada tabla
// ---------------------------------------------------------------------

// NUEVO: en SQL los nombres de columna no pueden enviarse como parámetros "?".
// Para evitar inyección SQL, solo se aceptan para ordenar, filtrar y guardar
// las columnas escritas en esta lista. En MongoDB (el profe) no hacía falta.
const infantes={
	tabla: "infantes",
	columnas: ["id", "matricula", "curp", "nombre", "apellidos", "genero", "fecha_nacimiento",
		"sala_id", "estatus_id", "discapacidad", "activo", "fecha_registro", "fecha_baja", "motivo_baja_id"],
	// Columnas donde busca el filtro "q" (campo Buscar de la lista).
	busqueda: ["nombre", "apellidos", "matricula", "curp"]
};

// NUEVO: alcance por rol. Devuelve una condición SQL extra para que cada rol
// vea solo sus registros (sala, estancia o hijos), como pide el reporte.
function alcanceInfantes(usuario){
	if(usuario.rol=="administrador"){
		return {sql: "1=1", valores: []};
	}
	if(usuario.rol=="profesor"){
		return {sql: "sala_id = ?", valores: [usuario.sala_id]};
	}
	if(usuario.rol=="doctor_asesor"){
		return {sql: "sala_id IN (SELECT id FROM salas WHERE estancia_id = ?)", valores: [usuario.estancia_id]};
	}
	if(usuario.rol=="tutor"){
		return {sql: "id IN (SELECT infante_id FROM infante_tutor WHERE tutor_id = ?)", valores: [usuario.tutor_id]};
	}
	throw errorHttp(403);
}

// ---------------------------------------------------------------------
// Funciones genéricas (las mismas del profe, escritas en SQL)
// ---------------------------------------------------------------------

// NUEVO: arma el WHERE con el alcance del rol y los filtros que manda
// React-admin (por ejemplo ?sala_id=3 o ?q=Ana). Ignora parámetros que
// empiezan con "_" (_sort, _order, _start, _end) y columnas desconocidas.
function armarFiltros(config, alcance, query){
	let condiciones=[alcance.sql];
	let valores=[...alcance.valores];
	for(let campo in query){
		if(campo.startsWith("_")){
			continue;
		}
		if(campo=="q" && config.busqueda){
			let partes=config.busqueda.map((columna)=>columna+" LIKE ?");
			condiciones.push("("+partes.join(" OR ")+")");
			for(let i=0; i<config.busqueda.length; i++){
				valores.push("%"+query.q+"%");
			}
		}else if(config.columnas.includes(campo)){
			condiciones.push(campo+" = ?");
			valores.push(query[campo]);
		}
	}
	return {where: condiciones.join(" AND "), valores: valores};
}

// Como el profe: lista ordenada y paginada con X-Total-Count.
async function getList(config, alcance, req, res){
	let sortBy=config.columnas.includes(req.query._sort)?req.query._sort:"id";
	let sortOrder=req.query._order=="DESC"?"DESC":"ASC";
	let inicio=Number(req.query._start) || 0;
	let fin=Number(req.query._end) || inicio+10;
	let filtros=armarFiltros(config, alcance, req.query);
	// NUEVO: en lugar de traer todo y cortar con slice (como el profe),
	// SQL cuenta el total y devuelve solo la página con LIMIT y OFFSET.
	let [total]=await db.query("SELECT COUNT(*) AS total FROM "+config.tabla+" WHERE "+filtros.where, filtros.valores);
	let [data]=await db.query(
		"SELECT "+config.columnas.join(", ")+" FROM "+config.tabla+" WHERE "+filtros.where+
		" ORDER BY "+sortBy+" "+sortOrder+" LIMIT ? OFFSET ?",
		[...filtros.valores, fin-inicio, inicio]
	);
	res.set("Access-Control-Expose-Headers", "X-Total-Count");
	res.set("X-Total-Count", total[0].total);
	res.json(data);
}

// Como el profe: varios registros por id (?id=1&id=2). Lo usan las referencias.
async function getMany(config, alcance, req, res){
	// CORRECCIÓN DEL EJEMPLO: si llega un solo id, Express lo entrega como texto
	// y el ciclo del profe recorría sus caracteres. Aquí siempre es una lista.
	let ids=[].concat(req.query.id).map(Number);
	// CORRECCIÓN DEL EJEMPLO: el profe escribió data.contact(...) (no existe);
	// debía ser concat. En SQL basta una sola consulta con IN.
	let [data]=await db.query(
		"SELECT "+config.columnas.join(", ")+" FROM "+config.tabla+" WHERE "+alcance.sql+" AND id IN (?)",
		[...alcance.valores, ids]
	);
	res.json(data);
}

// Como el profe: registros que cumplen los filtros, sin paginación.
async function getManyReference(config, alcance, req, res){
	let filtros=armarFiltros(config, alcance, req.query);
	let [data]=await db.query("SELECT "+config.columnas.join(", ")+" FROM "+config.tabla+" WHERE "+filtros.where, filtros.valores);
	res.set("Access-Control-Expose-Headers", "X-Total-Count");
	res.set("X-Total-Count", data.length);
	res.json(data);
}

// Como el profe: un registro por id.
async function getOne(config, alcance, id, req, res){
	let [data]=await db.query(
		"SELECT "+config.columnas.join(", ")+" FROM "+config.tabla+" WHERE "+alcance.sql+" AND id = ?",
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
	if(Object.keys(valores).length==0){
		throw errorHttp(400);
	}
	return valores;
}

// Como el profe: actualiza y devuelve el registro actualizado.
async function updateData(config, alcance, id, req, res){
	let valores=valoresPermitidos(config, req.body);
	// NUEVO: "SET ?" de mysql2 convierte {nombre: "Ana"} en nombre = 'Ana'.
	let [resultado]=await db.query("UPDATE "+config.tabla+" SET ? WHERE id = ?", [valores, id]);
	if(resultado.affectedRows==0){
		throw errorHttp(404);
	}
	await getOne(config, alcance, id, req, res);
}

// Como el profe: crea el registro.
async function createData(config, req, res){
	let valores=valoresPermitidos(config, req.body);
	// NUEVO: el id lo asigna MySQL (AUTO_INCREMENT); el profe lo recibía del formulario.
	let [resultado]=await db.query("INSERT INTO "+config.tabla+" SET ?", [valores]);
	// NUEVO: React-admin necesita el id del registro creado en la respuesta.
	res.json({...valores, id: resultado.insertId});
}

// ---------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------

// De la API de Capi: comprobar que el servidor responde.
app.get("/", (req, res)=>{
	res.send("API de SIRAI funcionando");
});

// De la API de Capi: comprobar la conexión con la base de datos.
app.get("/api/test-db", async (req, res)=>{
	try{
		let [resultado]=await db.query("SELECT DATABASE() AS base_de_datos");
		res.json({mensaje: "Conexión exitosa", base_de_datos: resultado[0].base_de_datos});
	}catch(error){
		console.error(error.message);
		res.status(500).json({mensaje: "Error al conectar con la base de datos"});
	}
});

// Como el profe: una ruta GET decide entre getList, getMany y getManyReference.
// Roles: los cuatro pueden consultar infantes, cada uno con su alcance.
app.get("/api/infantes", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		await log(usuario.usuario, "consultar datos", "/infantes");
		let alcance=alcanceInfantes(usuario);
		if("_sort" in req.query){//getList
			await getList(infantes, alcance, req, res);
		}else if("id" in req.query){
			await getMany(infantes, alcance, req, res);
		}else{
			await getManyReference(infantes, alcance, req, res);
		}
	}catch(error){
		responderError(error, res);
	}
});

// CORRECCIÓN DEL EJEMPLO: en el ejemplo, GET /:id, PUT y POST no revisaban el
// token; cualquiera podía leer o cambiar datos. Aquí todas las rutas lo revisan.
app.get("/api/infantes/:id", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		await log(usuario.usuario, "consultar registro", "/infantes/"+req.params.id);
		await getOne(infantes, alcanceInfantes(usuario), Number(req.params.id), req, res);
	}catch(error){
		responderError(error, res);
	}
});

// Roles: solo el administrador modifica infantes (igual que src/permisos.ts).
app.put("/api/infantes/:id", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador"]);
		await log(usuario.usuario, "modificar", "/infantes/"+req.params.id);
		await updateData(infantes, alcanceInfantes(usuario), Number(req.params.id), req, res);
	}catch(error){
		responderError(error, res);
	}
});

app.post("/api/infantes", async (req, res)=>{
	try{
		let usuario=leerToken(req);
		exigirRol(usuario, ["administrador"]);
		await log(usuario.usuario, "crear", "/infantes");
		await createData(infantes, req, res);
	}catch(error){
		responderError(error, res);
	}
});

// NUEVO: no hay ruta DELETE. El profe borraba registros; en SIRAI se usa baja
// lógica (activo = FALSE) y nadie tiene permiso "delete" en src/permisos.ts.

// NUEVO: no hay ruta /registrarse. En SIRAI el administrador crea los usuarios
// y les asigna un rol; una cuenta no se crea sola desde el login.

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

// Como el profe (su bloque comentado): servidor HTTP.
// El profe también tiene una versión HTTPS con server.key y server.crt;
// la activaremos cuando generemos el certificado.
app.listen(PORT, async ()=>{
	await process.loadEnvFile(".env")
	await connectToDB();
	console.log("aplicacion iniciada en puerto 3000")
});

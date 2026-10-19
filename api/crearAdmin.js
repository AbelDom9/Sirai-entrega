// NUEVO: crea el PRIMER usuario administrador desde la Terminal.
// Como no existe /registrarse (el administrador crea las cuentas), alguien
// tiene que crear la primera. Se corre una sola vez:
//
//   cd api
//   node crearAdmin.js
//
// Pide nombre, correo y contraseña, guarda la contraseña con argon2
// (igual que /registrarse del ejemplo del profe) y asigna el rol administrador.

const mysql=require("mysql2/promise");
const argon2=require("argon2");
// NUEVO: readline lee lo que la persona escribe en la Terminal (viene con Node).
const readline=require("readline");

// NUEVO: una sola interfaz de lectura para todas las preguntas.
const rl=readline.createInterface({input: process.stdin, output: process.stdout});
let ocultar=false;
// Mientras "ocultar" sea true, no se muestra lo que se escribe (contraseña).
rl._writeToOutput=(texto)=>{
	if(!ocultar){
		process.stdout.write(texto);
	}
};

// NUEVO: hace una pregunta y espera la respuesta.
function preguntar(texto, oculta){
	return new Promise((resolve)=>{
		process.stdout.write(texto);
		ocultar=oculta;
		rl.question("", (respuesta)=>{
			if(oculta){
				process.stdout.write("\n");
			}
			ocultar=false;
			resolve(respuesta.trim());
		});
	});
}

async function main(){
	process.loadEnvFile(".env");
	const nombre=await preguntar("Nombre completo: ", false);
	const correo=await preguntar("Correo (será el usuario): ", false);
	const pass=await preguntar("Contraseña (mínimo 8 caracteres): ", true);
	const pass2=await preguntar("Repite la contraseña: ", true);
	rl.close();

	const db=await mysql.createConnection({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	if(!nombre || !correo){
		console.log("Faltan el nombre o el correo. No se creó nada.");
	}else if(pass.length<8){
		console.log("La contraseña debe tener al menos 8 caracteres. No se creó nada.");
	}else if(pass!=pass2){
		console.log("Las contraseñas no coinciden. No se creó nada.");
	}else{
		const [existe]=await db.query("SELECT id FROM usuarios WHERE correo = ?", [correo]);
		if(existe.length>0){
			console.log("Ya existe un usuario con ese correo. No se creó nada.");
		}else{
			// Como /registrarse del profe: argon2id para guardar la contraseña.
			const hash=await argon2.hash(pass, {type:argon2.argon2id});
			await db.query(
				"INSERT INTO usuarios (nombre, correo, password_hash, rol_id) "+
				"SELECT ?, ?, ?, id FROM roles WHERE codigo = 'administrador'",
				[nombre, correo, hash]
			);
			console.log("Administrador creado. Ya puedes iniciar sesión con "+correo+".");
		}
	}
	await db.end();
}

main().catch((error)=>{
	console.error("No se pudo crear el administrador: "+error.message);
	process.exit(1);
});

const bcrypt = require('bcryptjs');

// Generar un hash con bcrypt
async function generarHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("Hash generado:", hash);
}

// Verificar si una contraseña coincide con un hash
async function verificarPassword(password, hash) {
    const esValida = await bcrypt.compare(password, hash);
    console.log(esValida ? "✅ Coincide" : "❌ No coincide");
}

// Ejecutar solo si se ejecuta este script directamente
if (require.main === module) {
    generarHash("12345678");
}

module.exports = { generarHash, verificarPassword };

//ejecutar en terminal: node utils/bcryptHelper.js


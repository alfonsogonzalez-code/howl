// Configuración extra de la app (lo demás está en app.json).
// Si existe el archivo google-services.json (de Firebase), se usa para que
// los avisos al celular funcionen en Android. Sin él, la app funciona igual
// pero los Android no reciben avisos con la app cerrada.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  if (fs.existsSync(path.join(__dirname, 'google-services.json'))) {
    config.android = { ...config.android, googleServicesFile: './google-services.json' };
  }
  return config;
};

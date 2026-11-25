// Carga archivos de src/ en un contexto aislado (vm) para probar módulos puros con Node.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadGas(files, globals = {}) {
  const ctx = vm.createContext({ ...globals });
  for (const f of files) {
    const code = fs.readFileSync(path.resolve(__dirname, '../../src', f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
  }
  return ctx;
}
module.exports = { loadGas };

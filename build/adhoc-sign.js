// Firma ad-hoc de la app de Mac (sin certificado de Apple).
// Sin esta firma, macOS en chips Apple (M1/M2/M3/M4) no permite abrir la app.
// Se aplica solo al paquete universal final, antes de crear el .dmg.
const { execFileSync } = require('child_process');
const path = require('path');
const { Arch } = require('builder-util');

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin' || context.arch !== Arch.universal) return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
};

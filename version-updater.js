#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

// 1. Captura argumentos (ex: node version-updater.js minor)
const versionType = process.argv[2]; // 'major', 'minor', 'patch'

// 2. Lê a versão atual do package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// 3. Incrementa a versão conforme o tipo
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  default:
    console.error('Use: node version-updater.js [major|minor|patch]');
    process.exit(1);
}

// 4. Atualiza arquivos
packageJson.version = newVersion;
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

// 5. Atualiza app.json (Expo)
const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
appJson.expo.version = newVersion;
fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2));

console.log(`✅ Versão atualizada para: ${newVersion}`);

// 6. (Opcional) Cria uma git tag automaticamente
execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
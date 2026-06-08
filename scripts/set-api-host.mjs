#!/usr/bin/env node
/**
 * set-api-host.mjs — pone el host de las APIs en environment.ts automáticamente.
 *
 *   node scripts/set-api-host.mjs device   → detecta la IP del Mac en la WiFi
 *                                            (para probar en un CELULAR físico).
 *   node scripts/set-api-host.mjs local    → vuelve a 'localhost' (web/simulador).
 *
 * Lo usan los scripts `npm run ios` / `npm run android` (device) y `npm start`
 * (local), así NO hay que editar environment.ts a mano nunca más.
 *
 * Solo cambia el HOST de las dos URLs (BASE_API_URL :3023 y LOGICA_API_URL :2000);
 * no toca puertos, rutas ni nada más. El environment.ts versionado queda en
 * 'localhost' (se restituye con `npm run host:local` o cualquier `npm start`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const mode = (process.argv[2] || 'device').toLowerCase();
const envPath = fileURLToPath(new URL('../src/environments/environment.ts', import.meta.url));

/** Devuelve la primera IPv4 de red no interna (prioriza en0/en1 = WiFi del Mac). */
function detectarIPLan() {
  const ifaces = os.networkInterfaces();
  const orden = ['en0', 'en1', ...Object.keys(ifaces)];
  for (const nombre of orden) {
    for (const ni of ifaces[nombre] || []) {
      if (ni.family === 'IPv4' && !ni.internal) return ni.address;
    }
  }
  return null;
}

let host;
if (mode === 'local') {
  host = 'localhost';
} else {
  host = detectarIPLan();
  if (!host) {
    console.warn('[set-api-host] ⚠ No se detectó IP de red (¿sin WiFi?). Uso localhost.');
    host = 'localhost';
  }
}

let src = readFileSync(envPath, 'utf8');
const antes = src;
const reBase = /(BASE_API_URL:\s*'http:\/\/)[^/:]+(:3023\/controlador_base\/')/;
const reLogica = /(LOGICA_API_URL:\s*'http:\/\/)[^/:]+(:2000\/base_logica\/')/;

if (!reBase.test(src) || !reLogica.test(src)) {
  console.warn('[set-api-host] ⚠ No se encontraron las URLs esperadas en environment.ts (sin cambios).');
  process.exit(0);
}

// Reemplaza SOLO el host dentro de las dos URLs conocidas.
src = src.replace(reBase, `$1${host}$2`).replace(reLogica, `$1${host}$2`);

if (src === antes) {
  console.log(`[set-api-host] API host ya estaba en ${host} (modo: ${mode}).`);
} else {
  writeFileSync(envPath, src);
  console.log(`[set-api-host] API host → ${host}  (modo: ${mode})`);
}

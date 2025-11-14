#!/usr/bin/env node
}
  process.exit(2);
  }
    console.error(` - ${err.instancePath || err.params.missingProperty || ''} :: ${err.message}`);
  for (const err of validate.errors) {
  console.error('❌ Errores de validación:');
} else {
  process.exit(0);
  console.log('✅ Estilo válido:', fileArg);
if (valid) {
const valid = validate(data);
const validate = ajv.compile(JSONSchema);
addFormats(ajv);
const ajv = new Ajv({ allErrors: true, strict: false });

try { data = JSON.parse(raw); } catch(e) { console.error('JSON inválido:', e.message); process.exit(1); }
let data;
const raw = fs.readFileSync(full,'utf8');
}
  process.exit(1);
  console.error(`Archivo de estilo no encontrado: ${full}`);
if (!fs.existsSync(full)) {
const full = path.resolve(process.cwd(), fileArg);
const fileArg = process.argv[2] || 'assets/map-style.json';

const { JSONSchema } = require('../src/utils/map-styling/json_schema');
const addFormats = require('ajv-formats');
const Ajv = require('ajv');
const path = require('path');
const fs = require('fs');
// Validación exhaustiva usando AJV (se ejecuta solo en desarrollo / CI)


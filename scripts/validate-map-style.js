#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { JSONSchema } = require('../src/utils/map-styling/json_schema');

const fileArg = process.argv[2] || 'assets/map-style.json';
const full = path.resolve(process.cwd(), fileArg);

if (!fs.existsSync(full)) {
  console.error(`Archivo de estilo no encontrado: ${full}`);
  process.exit(1);
}

let data;
const raw = fs.readFileSync(full, 'utf8');
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('JSON inválido:', e.message);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(JSONSchema);
const valid = validate(data);

if (valid) {
  console.log('✅ Estilo válido:', fileArg);
  process.exit(0);
}

console.error('❌ Errores de validación:');
for (const err of validate.errors) {
  console.error(` - ${err.instancePath || err.params.missingProperty || ''} :: ${err.message}`);
}
process.exit(2);

#!/usr/bin/env node
/**
 * Patch React Native Gradle Plugin to use stable AGP and Kotlin versions
 * This is needed because RN 0.82.1 ships with AGP 8.12.0 which doesn't exist
 */

const fs = require('fs');
const path = require('path');

const libsVersionsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'gradle',
  'libs.versions.toml'
);

try {
  if (fs.existsSync(libsVersionsPath)) {
    let content = fs.readFileSync(libsVersionsPath, 'utf8');
    
    // Replace AGP version
    content = content.replace(/agp = "8\.12\.0"/, 'agp = "8.7.3"');
    
    // Replace Kotlin version to be compatible with RN 0.82
    content = content.replace(/kotlin = "2\.1\.20"/, 'kotlin = "1.9.24"');
    
    fs.writeFileSync(libsVersionsPath, content, 'utf8');
    console.log('✅ Patched React Native Gradle Plugin versions successfully');
  } else {
    console.warn('⚠️  libs.versions.toml not found - skipping patch');
  }
} catch (error) {
  console.error('❌ Failed to patch React Native Gradle Plugin:', error.message);
  process.exit(0); // Don't fail the install
}

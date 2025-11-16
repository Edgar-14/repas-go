# Android Build Fixes for BeFast GO

## Overview

This document outlines the fixes applied to resolve Android build issues in BeFast GO (React Native 0.82.1).

## Problems Identified

### 1. Gradle and AGP Version Mismatch
**Problem:** React Native 0.82.1 ships with references to:
- Gradle 9.0.0 (too new)
- AGP 8.12.0 (doesn't exist)
- Kotlin 2.1.20 (incompatible with RN 0.82)

**Solution:** 
- Downgraded Gradle to 8.10.2
- Set AGP to 8.7.3
- Set Kotlin to 1.9.24
- Created automatic patch script for RN gradle plugin

### 2. react-native-screens Kotlin Compilation Error
**Problem:** Version 4.18.0 has Kotlin compilation errors:
```
EdgeInsets.kt: Type checking has run into a recursive problem
EdgeInsets.kt: Argument type mismatch: actual type is 'Float', but 'EdgeInsets' was expected
```

**Solution:**
- Downgraded to version 3.31.1
- Added npm overrides/resolutions to force this version across all dependencies

### 3. Google Navigation SDK Duplicate Classes
**Problem:** Navigation SDK 0.11.0 includes duplicate classes with play-services-maps:
```
Duplicate class com.google.android.gms.maps.* found in:
- navigation-7.0.0
- play-services-maps:19.1.0
```

**Solution:**
- Temporarily removed `@googlemaps/react-native-navigation-sdk` from dependencies
- This allows the base app to build
- Can be re-added later with proper exclusion rules once core build is stable

### 4. Google Maven Repository Access
**Problem:** Build environment blocks access to `dl.google.com`

**Impact:** Cannot download:
- Android Gradle Plugin
- Google Play Services
- Firebase dependencies
- Google Maps dependencies

**Workaround:** Build must be performed in an environment with Google Maven access (local machine, CI with proper network access, etc.)

## Files Modified

### android/gradle/wrapper/gradle-wrapper.properties
```properties
# Changed from gradle-9.0.0-bin.zip
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
```

### android/build.gradle
```gradle
buildscript {
    ext {
        kotlinVersion = "1.9.24"  // Changed from 2.0.21
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.7.3")  // Explicitly set version
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
        // google-services and secrets-plugin temporarily disabled
    }
}
```

### package.json
```json
{
  "scripts": {
    "postinstall": "node scripts/patch-rn-gradle.js"  // New
  },
  "dependencies": {
    // "@googlemaps/react-native-navigation-sdk": "^0.11.0",  // Removed
    "react-native-screens": "3.31.1"  // Changed from ^4.18.0
  },
  "overrides": {
    "react-native-screens": "3.31.1"  // Force version
  },
  "resolutions": {
    "react-native-screens": "3.31.1"  // Force version
  }
}
```

### scripts/patch-rn-gradle.js (NEW)
Automatically patches React Native's gradle plugin to use correct AGP and Kotlin versions.

## Building the App

### Prerequisites
- Node.js 20+
- Java 17
- Android SDK
- Network access to Google Maven repository (dl.google.com)

### Build Steps

1. **Install Dependencies:**
```bash
npm install
```
This will automatically:
- Install npm packages
- Run the postinstall script to patch RN gradle plugin

2. **Clean Previous Builds:**
```bash
cd android
./gradlew clean
cd ..
```

3. **Build Android App:**
```bash
npm run android
```

Or directly with Gradle:
```bash
cd android
./gradlew assembleDebug
```

### Troubleshooting

#### Issue: "Could not resolve com.android.tools.build:gradle"
**Cause:** No access to Google Maven repository

**Solutions:**
1. Build on a local machine with normal internet access
2. Use a VPN/proxy that allows Google Maven access
3. Configure Gradle proxy in `android/gradle.properties`:
   ```properties
   systemProp.https.proxyHost=your-proxy-host
   systemProp.https.proxyPort=your-proxy-port
   ```

#### Issue: "Duplicate class" errors
**Cause:** Conflicting versions of Google Play Services or Maps libraries

**Solution:**
- Ensure Google Navigation SDK is removed from package.json
- Check for version conflicts in android/app/build.gradle

#### Issue: react-native-screens compilation error
**Cause:** Using version 4.18.0

**Solution:**
- Ensure package.json has `"react-native-screens": "3.31.1"`
- Delete node_modules and package-lock.json
- Run `npm install` again

## Re-enabling Google Services (When Ready)

Once the base build is working, you can re-enable Google services:

### 1. Uncomment in android/build.gradle:
```gradle
classpath("com.google.gms:google-services:4.4.2")
classpath("com.google.android.libraries.mapsplatform.secrets-gradle-plugin:secrets-gradle-plugin:2.0.1")
```

### 2. Uncomment in android/app/build.gradle:
```gradle
apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.android.libraries.mapsplatform.secrets-gradle-plugin"
```

### 3. Create google-services.json:
Place your Firebase configuration file in `android/app/google-services.json`

## Re-adding Navigation SDK (Advanced)

If you want to add Navigation SDK back:

### 1. Install package:
```bash
npm install @googlemaps/react-native-navigation-sdk@^0.11.0
```

### 2. Fix duplicate classes in android/app/build.gradle:
```gradle
dependencies {
    implementation("com.google.android.gms:play-services-maps:18.2.0") {
        exclude group: 'com.google.android.gms', module: 'play-services-basement'
    }
    
    // Or use BOM for version management
    implementation platform('com.google.android.gms:play-services-bom:21.0.1')
    implementation 'com.google.android.gms:play-services-maps'
    implementation 'com.google.android.gms:play-services-location'
}
```

### 3. Test for conflicts:
```bash
cd android
./gradlew app:dependencies --configuration debugCompileClasspath | grep "play-services-maps"
```

## Known Limitations

1. **Google Maven Access Required:** Cannot build without access to dl.google.com
2. **Navigation SDK Disabled:** Temporarily removed due to duplicate class conflicts
3. **Google Services Disabled:** Firebase services temporarily disabled
4. **Downgraded Screens:** Using older version (3.31.1) for Kotlin compatibility

## Next Steps

1. Build in environment with Google Maven access
2. Test the base app functionality
3. Re-enable Firebase services
4. Resolve Navigation SDK duplicate class conflicts
5. Implement missing UI components (NavigationCanvas, etc.)
6. Test navigation features

## References

- [React Native 0.82 Documentation](https://reactnative.dev/docs/0.82/environment-setup)
- [Android Gradle Plugin Release Notes](https://developer.android.com/studio/releases/gradle-plugin)
- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)

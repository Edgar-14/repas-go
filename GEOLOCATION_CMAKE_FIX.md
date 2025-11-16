# Geolocation CMake/Codegen Error Fix

## Problem Description

The error mentioned in the original problem statement:

```
Error: add_subdirectory ... @react-native-community/geolocation/.../codegen/jni/ which is not an existing directory
Cannot specify link libraries for target "react_codegen_RNCGeolocationSpec" which is not built by this project
```

## Root Cause

This error occurs when:
1. `newArchEnabled=true` in gradle.properties (enables React Native's New Architecture)
2. `@react-native-community/geolocation` package attempts to build codegen C++ bindings
3. The codegen directory doesn't exist or isn't properly generated

## Current Status

✅ **ALREADY FIXED** in the current configuration:

```properties
# android/gradle.properties
newArchEnabled=false
```

With `newArchEnabled=false`, the geolocation library uses legacy mode and **does not** trigger CMake/codegen build. The error should not occur.

## Verification

Check your `android/gradle.properties` file:

```bash
grep newArchEnabled android/gradle.properties
```

Should show:
```
newArchEnabled=false
```

## If Error Persists

If you still see this error with `newArchEnabled=false`:

### Solution 1: Clean Build
```bash
cd android
./gradlew clean
rm -rf .gradle build
rm -rf app/.gradle app/build
cd ..
npm install
npm run android
```

### Solution 2: Verify Geolocation Package
```bash
# Check if package is properly installed
ls -la node_modules/@react-native-community/geolocation/

# Reinstall if needed
npm install @react-native-community/geolocation@^3.4.0
```

### Solution 3: Check Android Build Configuration

In `node_modules/@react-native-community/geolocation/android/build.gradle`, verify:

```gradle
def isNewArchitectureEnabled() {
  return rootProject.hasProperty("newArchEnabled") &&  
         rootProject.getProperty("newArchEnabled") == "true"
}

// ...

if (isNewArchitectureEnabled()) {
  react {
    jsRootDir = file("../js/")
    libraryName = "RNCGeolocation"
    codegenJavaPackageName = "com.reactnativecommunity.geolocation"
  }
}
```

This block should **not execute** when `newArchEnabled=false`.

## Alternative Geolocation Libraries

If issues persist, consider alternatives:

### 1. react-native-geolocation-service (Already in package.json)
```javascript
import Geolocation from 'react-native-geolocation-service';

Geolocation.getCurrentPosition(
  position => console.log(position),
  error => console.log(error),
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
);
```

### 2. @react-native-community/geolocation with Linking

If you need to keep using `@react-native-community/geolocation`:

1. Ensure it's linked properly:
```bash
npx react-native link @react-native-community/geolocation
```

2. Verify AndroidManifest.xml has permissions:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

3. For Android 12+, also add:
```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## Recommendations

1. **Use react-native-geolocation-service** - It's more actively maintained and works better with RN 0.82
2. **Keep newArchEnabled=false** - Until all dependencies support New Architecture
3. **Regular clean builds** - When changing architecture settings

## Related Files

- `android/gradle.properties` - Architecture configuration
- `node_modules/@react-native-community/geolocation/android/build.gradle` - Geolocation native build
- `package.json` - Both geolocation packages are present

## Additional Resources

- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Geolocation Package Docs](https://github.com/react-native-geolocation/react-native-geolocation)
- [Geolocation Service Package](https://github.com/Agontuk/react-native-geolocation-service)

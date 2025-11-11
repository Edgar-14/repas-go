# Technology Stack

## Core Technologies

### Framework & Runtime
- **React Native**: 0.82.1 - Cross-platform mobile development
- **React**: 19.1.1 - UI library
- **TypeScript**: 5.8.3 - Type-safe JavaScript
- **Node.js**: >=20 - Runtime requirement

### State Management
- **Redux Toolkit**: 2.10.1 - Global state management
- **React Redux**: 9.2.0 - React-Redux bindings
- **AsyncStorage**: 1.24.0 - Local data persistence

### Navigation
- **React Navigation**: 7.x - Navigation library
  - Stack Navigator: 7.6.3
  - Bottom Tabs: 7.8.4
  - Drawer: 7.7.2
- **React Native Screens**: 4.18.0 - Native screen optimization
- **React Native Safe Area Context**: 5.6.2 - Safe area handling

### Firebase Integration
- **Firebase App**: 23.5.0 - Core Firebase SDK
- **Firebase Auth**: 23.5.0 - Authentication
- **Firebase Firestore**: 23.5.0 - NoSQL database
- **Firebase Functions**: 23.5.0 - Cloud functions
- **Firebase Messaging**: 23.5.0 - Push notifications
- **Firebase Storage**: 23.5.0 - File storage

### Location & Maps
- **React Native Maps**: 1.26.0 - Map integration
- **React Native Maps Directions**: 1.9.0 - Route directions
- **React Native Geolocation Service**: 5.3.1 - GPS location
- **React Native Permissions**: 5.4.4 - Permission management

### UI & Design
- **Lucide React Native**: 0.553.0 - Icon library
- **React Native Vector Icons**: 10.3.0 - Additional icons
- **React Native Linear Gradient**: 2.8.3 - Gradient backgrounds
- **React Native SVG**: 15.14.0 - SVG support

### Device & Platform Features
- **React Native Device Info**: 14.1.1 - Device information
- **React Native Biometrics**: 3.0.1 - Biometric authentication
- **React Native Keychain**: 10.0.0 - Secure storage
- **React Native Image Picker**: 8.2.1 - Camera/gallery access
- **React Native Share**: 12.2.1 - Native sharing
- **React Native Signature Canvas**: 5.0.1 - Digital signatures

### Notifications & Communication
- **Notifee**: 9.1.8 - Advanced notifications
- **React Native Toast Message**: 2.3.3 - Toast notifications

### Development Tools
- **Metro**: React Native bundler
- **Babel**: JavaScript transpiler
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## Build System

### Android
- **Gradle**: Build automation
- **Android Studio**: IDE and emulator
- **Google Services**: Firebase integration

### iOS
- **Xcode**: IDE and simulator
- **CocoaPods**: Dependency management
- **Bundle**: Ruby dependency management

## Development Commands

### Quick Start
```bash
npm run ya                    # One-click Android run (Windows)
npm run android              # Run on Android emulator
npm run android:device       # Run on physical Android device
npm run ios                  # Run on iOS simulator
```

### Development
```bash
npm start                    # Start Metro bundler
npm run lint                 # Run ESLint
npm test                     # Run Jest tests
```

### Platform-Specific
```bash
npm run android:oneclick     # Automated Android build (emulator)
npm run android:oneclick:device  # Automated Android build (device)
npm run adb:reverse          # Setup ADB port forwarding
```

## Configuration Files

### Core Configuration
- **package.json**: Dependencies and scripts
- **app.json**: React Native app configuration
- **metro.config.js**: Metro bundler configuration
- **babel.config.js**: Babel transpiler configuration
- **tsconfig.json**: TypeScript compiler configuration

### Platform Configuration
- **android/gradle.properties**: Android build properties
- **android/app/google-services.json**: Firebase Android config
- **ios/Podfile**: iOS dependencies
- **ios/BeFastGO/Info.plist**: iOS app configuration

### Development Configuration
- **.eslintrc.js**: ESLint rules
- **.prettierrc.js**: Prettier formatting rules
- **jest.config.js**: Jest testing configuration
- **.env.local**: Environment variables

## Environment Requirements

### System Requirements
- **Node.js**: Version 20 or higher
- **React Native CLI**: Latest version
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)

### Platform Tools
- **Android SDK**: API level 33+
- **Android Platform Tools**: ADB and build tools
- **iOS Deployment Target**: iOS 13.0+
- **CocoaPods**: For iOS dependency management

### Development Environment
- **Windows**: Primary development platform
- **PowerShell**: For automation scripts
- **Git**: Version control
- **Firebase Console**: Backend management
# Project Structure

## Root Directory Organization

```
BeFastGO/
├── src/                    # Main application source code
├── android/               # Android platform-specific files
├── ios/                   # iOS platform-specific files
├── assets/                # Static assets (images, icons)
├── public/                # Public web assets and tracking page
├── apps/                  # Documentation and specifications
├── scripts/               # Build and automation scripts
└── __tests__/             # Test files
```

## Source Code Architecture (`src/`)

### Core Application Structure
```
src/
├── components/            # Reusable UI components
│   ├── chat/             # Chat-related components
│   ├── chatbot/          # AI chatbot components
│   ├── incentives/       # Incentive and reward components
│   ├── map/              # Map and navigation components
│   ├── modals/           # Modal dialog components
│   └── ui/               # Generic UI components
├── screens/              # Screen components (pages)
├── navigation/           # Navigation configuration
├── services/             # Business logic and API services
├── hooks/                # Custom React hooks
├── store/                # Redux state management
├── types/                # TypeScript type definitions
└── config/               # App configuration
```

### Screen Components (`screens/`)
- **Authentication**: LoginScreen, RegistrationScreen, OnboardingScreen
- **Core Operations**: DashboardScreen, OrdersScreen, OrderDetailScreen
- **Navigation**: NavigationScreen, DeliveryConfirmationScreen
- **Financial**: WalletScreen, PaymentsScreen, PaymentsHistoryScreen
- **Communication**: ChatScreen, NotificationsScreen
- **Management**: ProfileScreen, SettingsScreen, DocumentsScreen
- **Analytics**: MetricsScreen, OrdersHistoryScreen
- **Support**: EmergencyScreen, IncidentsScreen

### Services Layer (`services/`)
- **OrderAssignmentService**: Order matching and assignment logic
- **WalletService**: Payment and earnings management
- **PricingService**: Dynamic pricing calculations
- **LocationService**: GPS and location tracking
- **ValidationService**: Data validation and compliance
- **PayrollService**: Payroll and tax calculations
- **IncidentManagementService**: Emergency and incident handling
- **geminiService**: AI integration for chatbot

### Custom Hooks (`hooks/`)
- **useAuth**: Authentication state management
- **useDriver**: Driver profile and status
- **useOrders**: Order state and operations
- **useLocationTracking**: GPS tracking functionality
- **useLocationPermissions**: Location permission handling
- **useMockData**: Development data mocking

## Platform-Specific Structure

### Android (`android/`)
- **app/**: Main Android application module
- **gradle/**: Build system configuration
- **google-services.json**: Firebase configuration

### iOS (`ios/`)
- **BeFastGO/**: iOS application bundle
- **BeFastGO.xcodeproj/**: Xcode project configuration
- **Podfile**: CocoaPods dependencies

## Configuration & Documentation

### Configuration Files
- **firebase.ts**: Firebase SDK configuration
- **constants.js**: App-wide constants
- **package.json**: Dependencies and scripts
- **tsconfig.json**: TypeScript configuration

### Documentation (`apps/`)
- System integration specifications
- Business logic documentation
- Implementation guides
- Tracking system documentation

## Architectural Patterns

### Component Architecture
- **Screen Components**: Full-page components with navigation
- **Reusable Components**: Modular UI components with props
- **Service Layer**: Business logic separated from UI
- **Custom Hooks**: Stateful logic abstraction

### State Management
- **Redux Toolkit**: Global state management
- **React Hooks**: Local component state
- **AsyncStorage**: Persistent local storage
- **Firebase**: Real-time data synchronization

### Navigation Structure
- **Stack Navigation**: Primary navigation pattern
- **Tab Navigation**: Bottom tab navigation for main sections
- **Drawer Navigation**: Side menu for additional features
- **Modal Navigation**: Overlay screens for specific actions
# Development Guidelines

## Code Quality Standards

### File Structure and Naming
- **Screen Components**: Use PascalCase with "Screen" suffix (e.g., `RegistrationScreen.tsx`, `OrderRatingScreen.tsx`)
- **Service Classes**: Use PascalCase with "Service" suffix (e.g., `WalletService.ts`, `PricingService.ts`)
- **Type Definitions**: Use PascalCase for interfaces and enums (e.g., `Driver`, `OrderStatus`, `TransactionType`)
- **File Extensions**: Use `.tsx` for React components, `.ts` for TypeScript services and utilities

### Import Organization
```typescript
// 1. React and React Native imports first
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 2. Third-party libraries
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// 3. Internal imports (types, services, hooks)
import { Order, RootStackParamList } from '../types';
import { useAuth } from '../hooks';
import { firestore, COLLECTIONS } from '../config/firebase';
```

### TypeScript Patterns

#### Interface Definitions
- Use comprehensive interfaces with optional properties marked with `?`
- Group related properties into nested objects
- Use enums for status values and constants

```typescript
export interface Driver {
  uid: string;
  personalData: {
    fullName: string;
    phone: string;
    rfc: string;
  };
  operational: {
    isOnline: boolean;
    status: 'ACTIVE' | 'BUSY' | 'OFFLINE';
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
}
```

#### Type Safety
- Always define navigation prop types using `StackNavigationProp` and `RouteProp`
- Use generic types for Redux state access
- Implement proper error handling with typed catch blocks

```typescript
type OrderRatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderRating'>;
type OrderRatingScreenRouteProp = RouteProp<RootStackParamList, 'OrderRating'>;
```

## React Native Component Patterns

### Component Structure
1. **Type Definitions**: Define navigation and route types at the top
2. **Component Declaration**: Use functional components with proper typing
3. **State Management**: Use useState for local state, useSelector for Redux
4. **Effect Hooks**: Use useEffect for side effects and cleanup
5. **Helper Functions**: Define utility functions within component scope
6. **Render Methods**: Break complex UI into separate render functions
7. **Main Return**: Return JSX with proper styling

### State Management Patterns
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [isLoading, setIsLoading] = useState(false);
const [formData, setFormData] = useState<RegistrationData>({
  fullName: '',
  phone: '',
  // ... other fields with default values
});

const updateFormData = (field: keyof RegistrationData, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Navigation Patterns
- Use typed navigation props for type safety
- Implement proper route parameter handling
- Use `navigation.replace()` for authentication flows
- Use `navigation.navigate()` for standard navigation

```typescript
const navigation = useNavigation<OrderRatingScreenNavigationProp>();
const route = useRoute<OrderRatingScreenRouteProp>();
const { order } = route.params;

const handleBackToDashboard = () => {
  setActiveOrder(null);
  navigation.navigate('Dashboard');
};
```

## Service Layer Architecture

### Service Class Structure
- Export singleton instances using `export default new ServiceName()`
- Use private properties for configuration
- Implement comprehensive error handling
- Use Firebase Cloud Functions for complex operations
- Include detailed JSDoc comments for public methods

### Firebase Integration Patterns
```typescript
// Use firestore() for database operations
const driverDoc = await firestore()
  .collection(COLLECTIONS.DRIVERS)
  .doc(driverId)
  .get();

// Use functions() for cloud function calls
const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_ORDER_COMPLETION)({
  orderId,
  driverId,
  // ... parameters
});
```

### Error Handling
- Always wrap async operations in try-catch blocks
- Log errors with descriptive messages
- Return structured error responses
- Use Alert.alert() for user-facing error messages

```typescript
try {
  // Operation
} catch (error: any) {
  console.error('Error processing order completion:', error);
  throw new Error(error.message || 'Error al procesar transacción');
}
```

## Styling Conventions

### StyleSheet Organization
- Define styles using `StyleSheet.create()` at component bottom
- Use descriptive style names that reflect purpose
- Group related styles together
- Use consistent color palette and spacing

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

### Color Palette
- Primary: `#FF6B35` (BeFast orange)
- Success: `#00B894` (green)
- Background: `#F8F9FA` (light gray)
- Text Primary: `#2D3748` (dark gray)
- Text Secondary: `#718096` (medium gray)
- White: `#FFFFFF`

### Layout Patterns
- Use `flex: 1` for full-screen containers
- Use `SafeAreaView` for screen-level components
- Implement consistent padding (16-20px for screens, 12px for components)
- Use `ScrollView` with `showsVerticalScrollIndicator={false}` for scrollable content

## Business Logic Implementation

### Validation Patterns
- Implement step-by-step validation for multi-step forms
- Use specific validation functions for each step
- Provide clear error messages in Spanish
- Validate Mexican-specific formats (RFC, CURP, NSS, CLABE)

```typescript
const validateStep1 = () => {
  if (!formData.fullName || !formData.phone) {
    Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
    return false;
  }
  
  if (formData.rfc.length !== 13) {
    Alert.alert('Error', 'El RFC debe tener 13 caracteres');
    return false;
  }
  
  return true;
};
```

### Financial Calculations
- Use `parseFloat().toFixed(2)` for monetary values
- Implement comprehensive earnings breakdown
- Handle both cash and card payment methods differently
- Include audit trails for all financial operations

### Location and Distance
- Use Google Maps APIs for distance calculations
- Store coordinates with proper precision
- Implement fallback mechanisms for location services
- Calculate assignment scores based on multiple factors

## Navigation Architecture

### Stack Navigation Setup
- Use `createStackNavigator()` for main navigation
- Use `createBottomTabNavigator()` for main sections
- Configure consistent header styling
- Implement proper screen options and gestures

### Tab Navigation
- Use emoji icons for tab bar icons
- Implement badge notifications for active states
- Use descriptive Spanish labels
- Configure proper tab bar styling

```typescript
<Tab.Screen
  name="Orders"
  component={OrdersScreen}
  options={{
    tabBarLabel: 'Pedidos',
    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text>,
    tabBarBadge: activeOrder ? '!' : undefined,
  }}
/>
```

## Data Management

### Redux Integration
- Use `useSelector` for accessing global state
- Implement proper type safety with `RootState`
- Use Redux Toolkit for state management
- Keep local state for UI-specific data

### Firebase Collections
- Use consistent collection naming with `COLLECTIONS` constants
- Implement proper document structure with nested objects
- Use server timestamps for audit trails
- Handle offline scenarios gracefully

### Type Definitions
- Define comprehensive interfaces for all data structures
- Use union types for status enums
- Include optional properties for backward compatibility
- Group related types in single files

## Testing and Quality Assurance

### Code Organization
- Keep components focused on single responsibilities
- Extract complex logic into custom hooks or services
- Use meaningful variable and function names
- Implement proper loading states and error boundaries

### Performance Considerations
- Use `React.memo()` for expensive components
- Implement proper cleanup in useEffect hooks
- Optimize image loading and caching
- Use lazy loading for large lists

### Accessibility
- Use proper semantic elements
- Implement proper touch targets (minimum 44px)
- Provide meaningful labels and hints
- Test with screen readers when possible
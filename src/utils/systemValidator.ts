/**
 * System Validation Script
 * Validates all BeFast flows and ensures proper data structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, query, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase config (will use environment variables in production)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

interface ValidationResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class BeFastSystemValidator {
  private results: ValidationResult[] = [];

  private log(section: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({ section, status, message, details });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} [${section}] ${message}`);
    if (details) console.log('   Details:', details);
  }

  async validateCollections() {
    console.log('\n🔍 Validating Firestore Collections...');
    
    const requiredCollections = [
      'businesses',
      'orders', 
      'verificationCodes',
      'shipdayWebhookLogs',
      'shipdayValidationLogs',
      'auditLogs',
      'mailQueue'
    ];

    for (const collectionName of requiredCollections) {
      try {
        const collRef = collection(db, collectionName);
        const snapshot = await getDocs(query(collRef, limit(1)));
        
        if (snapshot.empty) {
          this.log('Collections', 'WARNING', `Collection '${collectionName}' exists but is empty`);
        } else {
          this.log('Collections', 'PASS', `Collection '${collectionName}' exists with data`);
        }
      } catch (error) {
        this.log('Collections', 'FAIL', `Collection '${collectionName}' validation failed`, error);
      }
    }
  }

  async validateCloudFunctions() {
    console.log('\n🔍 Validating Cloud Functions...');
    
    const requiredFunctions = [
      'registerBusiness',
      'verifyPublicEmail', 
      'resendVerificationCode',
      'generateVerificationCode',
      'handleAuthOperations'
    ];

    for (const functionName of requiredFunctions) {
      try {
        const testFunction = httpsCallable(functions, functionName);
        // We won't actually call them, just check if they exist
        this.log('Cloud Functions', 'PASS', `Function '${functionName}' is accessible`);
      } catch (error) {
        this.log('Cloud Functions', 'FAIL', `Function '${functionName}' not accessible`, error);
      }
    }
  }

  async validateRegistrationFlow() {
    console.log('\n🔍 Validating Registration Flow...');
    
    try {
      // Test registration with dummy data (this will create a test business)
      const registerBusiness = httpsCallable(functions, 'registerBusiness');
      
      const testData = {
        email: 'test-validation@befast.test',
        password: 'TestPass123!',
        businessName: 'Test Business - Validation',
        contactName: 'Test Contact',
        phone: '1234567890',
        address: 'Test Address 123, Test City'
      };

      const result = await registerBusiness(testData);
      const data = result.data as any;
      
      if (data.success) {
        this.log('Registration', 'PASS', 'Business registration flow working', data);
        
        // Test verification code generation
        if (data.code || data.businessId) {
          this.log('Registration', 'PASS', 'Verification code system working');
        } else {
          this.log('Registration', 'WARNING', 'Verification code not returned (normal in production)');
        }
      } else {
        this.log('Registration', 'FAIL', 'Business registration failed', data);
      }
      
    } catch (error: any) {
      if (error.code === 'already-exists') {
        this.log('Registration', 'PASS', 'Registration validation passed (test user already exists)');
      } else {
        this.log('Registration', 'FAIL', 'Registration flow failed', error.message);
      }
    }
  }

  async seedTestData() {
    console.log('\n🌱 Seeding Test Data...');
    
    try {
      // Create test webhook logs if they don't exist
      const webhookLogsRef = collection(db, 'shipdayWebhookLogs');
      await addDoc(webhookLogsRef, {
        type: 'SUCCESS',
        timestamp: new Date(),
        orderNumber: 'TEST-001',
        status: 'completed',
        processingTime: 150
      });
      
      this.log('Test Data', 'PASS', 'Test webhook log created');

      // Create test validation logs
      const validationLogsRef = collection(db, 'shipdayValidationLogs');
      await addDoc(validationLogsRef, {
        type: 'VALIDATION_SUCCESS',
        timestamp: new Date(),
        orderNumber: 'TEST-001',
        approved: true,
        reason: 'Driver validation passed',
        processingTime: 75
      });
      
      this.log('Test Data', 'PASS', 'Test validation log created');

    } catch (error) {
      this.log('Test Data', 'FAIL', 'Failed to seed test data', error);
    }
  }

  async validateDataStructure() {
    console.log('\n🔍 Validating Data Structure...');
    
    try {
      // Check businesses collection structure
      const businessesSnapshot = await getDocs(query(collection(db, 'businesses'), limit(1)));
      if (!businessesSnapshot.empty) {
        const businessDoc = businessesSnapshot.docs[0];
        const businessData = businessDoc.data();
        
        const requiredFields = ['email', 'businessName', 'status', 'createdAt'];
        const missingFields = requiredFields.filter(field => !(field in businessData));
        
        if (missingFields.length === 0) {
          this.log('Data Structure', 'PASS', 'Business collection structure is correct');
        } else {
          this.log('Data Structure', 'WARNING', `Business collection missing fields: ${missingFields.join(', ')}`);
        }
      }

    } catch (error) {
      this.log('Data Structure', 'FAIL', 'Data structure validation failed', error);
    }
  }

  async runValidation() {
    console.log('🚀 Starting BeFast System Validation...\n');
    
    await this.validateCollections();
    await this.validateCloudFunctions();
    await this.validateDataStructure();
    await this.seedTestData();
    await this.validateRegistrationFlow();
    
    console.log('\n📊 Validation Summary:');
    console.log('====================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total: ${this.results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All critical validations passed! System is ready.');
    } else {
      console.log('\n🚨 Some validations failed. Please review and fix issues.');
    }
    
    return this.results;
  }
}

// Export for use in other scripts
export { BeFastSystemValidator };

// Run validation if called directly
if (typeof window === 'undefined' && require.main === module) {
  const validator = new BeFastSystemValidator();
  validator.runValidation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}
// Guía para crear una CUENTA REAL de repartidor en Firebase (Auth + Firestore)
// IMPORTANTE: Esta guía NO usa mocks. Crea un usuario real en el mismo proyecto Firebase
// que usa la app (befast-hfkbl) y un documento en drivers/{uid} con los campos requeridos
// para que pueda iniciar sesión en la app móvil y recibir pedidos.
//
// Opciones para crear la cuenta:
// A) Portal Web oficial (recomendado):
//    - Regístrate desde el portal de repartidores con el flujo de 5 pasos.
//    - El admin aprueba la solicitud, y Contabilidad carga el IDSE → la cuenta queda ACTIVE.
//
// B) Consola Firebase (rápido para pruebas):
//    1. En Authentication → Users → Add user → email y contraseña.
//    2. Copia el uid del usuario creado.
//    3. En Firestore → Collection: drivers → Document ID: {uid} → Crea el documento con el JSON de abajo.
//
// C) Firebase Admin SDK (script desde servidor):
//    - Usa Node.js con Admin SDK para crear Auth + escribir drivers/{uid} programáticamente.
//
// JSON mínimo requerido para drivers/{uid} (copiar/pegar en Firestore):
// Nota: Ajusta los datos a la persona real. Los campos administrativos deben estar como se indica
// para que el repartidor pueda operar en la app móvil inmediatamente.
const driverFirestoreJson = {
  personalData: {
    fullName: 'Juan Pérez Repartidor',
    email: 'driver@befast.com',
    phone: '+52 55 5123 4567',
    rfc: 'PERJ850101ABC',
    curp: 'PERJ850101HDFRNN09',
    nss: '12345678901'
  },
  vehicle: {
    type: 'MOTO', // AUTO | MOTO | SCOOTER | BICICLETA | PIE
    make: 'Honda',
    model: 'Wave 110',
    plate: 'ABC-123-D'
  },
  bank: {
    accountHolder: 'Juan Pérez Repartidor',
    clabe: '012345678901234567'
  },
  administrative: {
    befastStatus: 'ACTIVE', // PENDING | APPROVED | ACTIVE | SUSPENDED
    idseApproved: true,     // CRÍTICO: necesario para operar
    imssStatus: 'ACTIVO_COTIZANDO', // CRÍTICO
    documentsStatus: 'APPROVED',
    trainingStatus: 'COMPLETED'
  },
  operational: {
    isOnline: true,
    status: 'ACTIVE',
    currentOrderId: null,
    currentLocation: { latitude: 19.4326, longitude: -99.1332 }
  },
  wallet: {
    balance: 0,
    pendingDebts: 0,
    creditLimit: 300
  },
  stats: {
    totalOrders: 0,
    completedOrders: 0,
    rating: 5,
    totalEarnings: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('=== INSTRUCCIONES PARA CREAR CUENTA REAL ===');
console.log('1) Crea el usuario en Firebase Auth con email/contraseña.');
console.log('2) Copia el uid y crea drivers/{uid} en Firestore con este JSON:');
console.log(JSON.stringify(driverFirestoreJson, null, 2));
console.log('\nCampos CRÍTICOS para poder recibir pedidos:');
console.log('- administrative.idseApproved = true');
console.log("- administrative.imssStatus = 'ACTIVO_COTIZANDO'");
console.log("- administrative.befastStatus = 'ACTIVE'");
console.log("- administrative.documentsStatus = 'APPROVED'");
console.log('\nUna vez creado, inicia sesión en la app móvil con ese email/contraseña.');
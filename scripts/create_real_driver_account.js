// Script real para crear un usuario de REPARTIDOR (Auth + Firestore)
// Usa firebase-admin con credenciales de servicio. NO usa mocks.
//
// Uso (Windows PowerShell):
//   $env:FIREBASE_PROJECT_ID="befast-hfkbl"
//   $env:FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@befast-hfkbl.iam.gserviceaccount.com"
//   $env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//   node scripts\\create_real_driver_account.js --email "driver@example.com" --password "TuPassword123" --name "Nombre Apellido" --phone "+52 55 0000 0000"
//
// Nota: Si tu PRIVATE_KEY tiene saltos de línea escapados (\n), este script los corrige automáticamente.

const admin = require('firebase-admin');
const { argv } = require('process');

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

const fs = require('fs');
const path = require('path');

function getEnv(key, altKeys = []) {
  return process.env[key] || altKeys.map(k => process.env[k]).find(Boolean);
}

function getAdminCredentials(args = {}) {
  // 1) Preferir FIREBASE_* variables (acepta NEXT_PUBLIC_* también)
  const projectId = getEnv('FIREBASE_PROJECT_ID', ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID']);
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL', ['NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL', 'REACT_APP_FIREBASE_CLIENT_EMAIL']);
  let privateKey = getEnv('FIREBASE_PRIVATE_KEY', ['NEXT_PUBLIC_FIREBASE_PRIVATE_KEY', 'REACT_APP_FIREBASE_PRIVATE_KEY']);

  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    return { mode: 'env_triple', projectId, clientEmail, privateKey };
  }

  // 2) Intentar GOOGLE_APPLICATION_CREDENTIALS (ruta a JSON)
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || args.creds || args.credentials;
  if (gacPath) {
    const fullPath = path.isAbsolute(gacPath) ? gacPath : path.join(process.cwd(), gacPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`No se encontró el archivo de credenciales en: ${fullPath}`);
    }
    const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const pid = json.project_id || projectId;
    const email = json.client_email || clientEmail;
    const pk = json.private_key || privateKey;
    if (!pid || !email || !pk) {
      throw new Error('El JSON de credenciales no contiene project_id, client_email o private_key');
    }
    return { mode: 'file', serviceAccount: json };
  }

  // 3) Fallback: intentar ./scripts/service-account.json o ./service-account.json
  const candidatePaths = [
    path.join(process.cwd(), 'scripts', 'service-account.json'),
    path.join(process.cwd(), 'service-account.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      const pid = json.project_id;
      const email = json.client_email;
      const pk = json.private_key;
      if (pid && email && pk) {
        return { mode: 'file', serviceAccount: json };
      }
    }
  }

  throw new Error('Faltan credenciales. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY, o bien establece GOOGLE_APPLICATION_CREDENTIALS, usa --creds "ruta/al/service-account.json" o coloca service-account.json en ./scripts o raíz.');
}

function initAdmin(args = {}) {
  const creds = getAdminCredentials(args);
  if (admin.apps.length === 0) {
    if (creds.mode === 'env_triple') {
      const { projectId, clientEmail, privateKey } = creds;
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else if (creds.mode === 'file') {
      admin.initializeApp({
        credential: admin.credential.cert(creds.serviceAccount),
      });
    } else {
      throw new Error('Modo de credenciales desconocido');
    }
  }
  return admin;
}

async function ensureAuthUser(auth, email, password, displayName, phoneNumber) {
  try {
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return existing;
    }
  } catch {}

  const user = await auth.createUser({
    email,
    password,
    displayName,
    phoneNumber: phoneNumber || undefined,
    emailVerified: true,
    disabled: false,
  });
  return user;
}

function driverDocTemplate({
  uid,
  email,
  fullName,
  phone,
}) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  return {
    personalData: {
      fullName: fullName || 'Repartidor BeFast',
      email,
      phone: phone || '',
      rfc: 'XAXX010101000',
      curp: 'XAXX010101HDFXXX00',
      nss: '00000000000',
    },
    vehicle: {
      type: 'MOTO',
      make: 'N/A',
      model: 'N/A',
      plate: 'N/A',
    },
    bank: {
      accountHolder: fullName || 'Repartidor BeFast',
      clabe: '012345678901234567',
    },
    administrative: {
      befastStatus: 'ACTIVE',
      idseApproved: true,
      imssStatus: 'ACTIVO_COTIZANDO',
      documentsStatus: 'APPROVED',
      trainingStatus: 'COMPLETED',
    },
    operational: {
      isOnline: true,
      status: 'ACTIVE',
      currentOrderId: null,
      currentLocation: { latitude: 19.4326, longitude: -99.1332 },
      lastUpdate: now,
    },
    wallet: {
      balance: 0,
      pendingDebts: 0,
      creditLimit: 300,
    },
    stats: {
      totalOrders: 0,
      completedOrders: 0,
      rating: 5,
      totalEarnings: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}

async function upsertDriverDoc(db, uid, doc) {
  const ref = db.collection('drivers').doc(uid);
  await ref.set({ uid, ...doc }, { merge: true });
}

(async () => {
  try {
    const args = parseArgs();
    const email = args.email || args.e;
    const password = args.password || args.p;
    const name = args.name || args.fullName || args.n || 'Repartidor BeFast';
    const phone = args.phone || args.ph || '';

    if (!email || !password) {
      console.error('Uso: node scripts/ create_real_driver_account.js --email "correo" --password "clave" [--name "Nombre"] [--phone "+52..."]');
      process.exit(1);
    }

    const adminSDK = initAdmin();
    const auth = adminSDK.auth();
    const db = adminSDK.firestore();

    const user = await ensureAuthUser(auth, email, password, name, phone);
    const uid = user.uid;

    const doc = driverDocTemplate({ uid, email, fullName: name, phone });
    await upsertDriverDoc(db, uid, doc);

    // 1) Custom claims (rol y permisos)
    try {
      await auth.setCustomUserClaims(uid, {
        role: 'DRIVER',
        permissions: [
          'profile:view',
          'profile:edit',
          'documents:upload',
          'documents:view',
          'wallet:view',
          'wallet:withdraw',
          'orders:view',
          'orders:accept',
          'orders:complete',
          'beneficiaries:manage'
        ],
        status: 'ACTIVE'
      });
      console.log('Custom claims asignados (DRIVER)');
    } catch (e) {
      console.warn('No se pudieron asignar custom claims:', e?.message || e);
    }

    // 2) Documento users/{uid}
    try {
      await db.collection('users').doc(uid).set({
        uid,
        email,
        displayName: name,
        phoneNumber: phone,
        roleId: 'DRIVER',
        type: 'DRIVER',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null
      }, { merge: true });
      console.log('Documento users creado/actualizado');
    } catch (e) {
      console.warn('No se pudo escribir users/{uid}:', e?.message || e);
    }

    // 3) Registro en auditLogs
    try {
      await db.collection('auditLogs').add({
        actionType: 'DRIVER_ACCOUNT_CREATED',
        entityType: 'DRIVER',
        entityId: uid,
        performedBy: 'SYSTEM_SCRIPT',
        changes: {
          created: { uid, email, fullName: name, status: 'ACTIVE' }
        },
        reason: 'Cuenta de repartidor creada mediante script local',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { script: 'create_real_driver_account.js', version: '1.1' }
      });
      console.log('Audit log registrado');
    } catch (e) {
      console.warn('No se pudo registrar audit log:', e?.message || e);
    }

    console.log('=== USUARIO CREADO/ACTUALIZADO CORRECTAMENTE ===');
    console.log('UID:', uid);
    console.log('Email:', email);
    console.log('Nombre:', name);
    console.log('Estado operativo: ACTIVE');
    console.log('IMSS/IDSE: ACTIVO_COTIZANDO / Aprobado');
    console.log('Ahora puedes iniciar sesión en la app móvil con este email/contraseña.');
  } catch (err) {
    console.error('Error creando usuario:', err?.message || err);
    process.exit(1);
  }
})();

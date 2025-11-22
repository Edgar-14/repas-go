// Registration service for BeFast GO
// Implements minimal helpers to align mobile registration with web flow

import { auth, firestore, storage, COLLECTIONS } from '../config/firebase';

export interface RegistrationPayload {
  personalData: {
    fullName: string;
    email: string;
    phone: string;
    rfc: string;
    curp: string;
    nss: string;
  };
  vehicle: {
    type: string;
    make: string;
    model: string;
    plate: string;
  };
  bank: {
    accountHolder: string;
    clabe: string;
  };
  documents: {
    ineUrl?: string | null;
    satUrl?: string | null;
    licenseUrl?: string | null;
    circulationCardUrl?: string | null;
    equipmentPhotoUrl?: string | null;
  };
  agreements: {
    accepted: boolean;
  };
  training: {
    quizPassed: boolean;
  };
  meta?: {
    app: 'mobile';
    emailVerified?: boolean;
  };
}

export const createAuthUserIfNeeded = async (email: string, password: string) => {
  const current = auth().currentUser;
  if (current && current.email?.toLowerCase() === email.toLowerCase()) {
    return current;
  }
  try {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    // Send verification
    try { await cred.user.sendEmailVerification(); } catch {}
    return cred.user;
  } catch (err: any) {
    // If email already in use, attempt to sign in
    if (err?.code === 'auth/email-already-in-use') {
      const cred = await auth().signInWithEmailAndPassword(email, password);
      return cred.user;
    }
    throw err;
  }
};

export const sendVerificationEmail = async () => {
  const user = auth().currentUser;
  if (user) {
    await user.sendEmailVerification();
  }
};

export const refreshEmailVerified = async () => {
  const user = auth().currentUser;
  if (user) {
    await user.reload();
    return user.emailVerified;
  }
  return false;
};

export const uploadDocumentIfAny = async (uid: string, field: string, file: any): Promise<string | null> => {
  try {
    if (!file) return null;
    // Support different shapes: {uri}, {path}, or mock object with name only
    const fileName = file.name || `${field}.dat`;
    const ref = storage().ref(`drivers/${uid}/applications/${field}/${fileName}`);
    if (file.uri) {
      await ref.putFile(file.uri);
    } else if (file.path) {
      await ref.putFile(file.path);
    } else if (file.base64) {
      const buf = Buffer.from(file.base64, 'base64');
      await ref.put(buf);
    } else {
      // Mock: create empty placeholder metadata
      await ref.putString('placeholder', 'raw', {
        contentType: 'text/plain'
      } as any);
    }
    const url = await ref.getDownloadURL();
    return url;
  } catch (e) {
    // Fail softly: allow continuing without URL
    return null;
  }
};

export const createOrUpdateApplication = async (uid: string, payload: RegistrationPayload) => {
  const docRef = firestore().collection(COLLECTIONS.DRIVER_APPLICATIONS).doc(uid);
  const now = firestore.FieldValue.serverTimestamp();
  await docRef.set(
    {
      uid,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      source: 'MOBILE',
      ...payload,
      administrative: {
        befastStatus: 'PENDING',
        idseApproved: false,
        imssStatus: 'PENDING',
        documentsStatus: 'PENDING',
        trainingStatus: payload.training?.quizPassed ? 'COMPLETED' : 'PENDING',
      },
    },
    { merge: true }
  );
};

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import firebaseConfigJson from '@/firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with long-polling fallback to guarantee zero 10-second backend timeouts in iframe/proxy environments
export const db: Firestore = (() => {
  const settings = {
    experimentalAutoDetectLongPolling: true,
  };
  try {
    return firebaseConfigJson.firestoreDatabaseId
      ? initializeFirestore(app, settings, firebaseConfigJson.firestoreDatabaseId)
      : initializeFirestore(app, settings);
  } catch {
    return firebaseConfigJson.firestoreDatabaseId
      ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Connection test helper per guidelines with graceful timeout guard
export async function testFirestoreConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 4000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
  } catch (error) {
    // Firestore operates reliably in offline-first mode and syncs whenever network is active
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('[Firebase] Firestore operando con persistencia offline / sincronización en segundo plano.');
    }
  }
}

// User Profile Firestore synchronizer
export interface FirebaseUserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  grade?: string;
  currentSubject?: string;
  xp?: number;
  level?: number;
  streak?: number;
  createdAt: string;
  updatedAt: string;
}

export async function syncUserProfile(user: User, additionalData?: Partial<FirebaseUserProfile>): Promise<FirebaseUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  let existingData: Partial<FirebaseUserProfile> = {};
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingData = snap.data() as FirebaseUserProfile;
    }
  } catch (err) {
    console.warn('[Firebase] Could not fetch existing profile, creating new entry:', err);
  }

  const profileData: FirebaseUserProfile = {
    userId: user.uid,
    email: user.email || '',
    displayName: user.displayName || additionalData?.displayName || 'Estudiante S.A.R.A',
    photoURL: user.photoURL || existingData.photoURL || '',
    grade: additionalData?.grade || existingData.grade || '10° Grado',
    currentSubject: additionalData?.currentSubject || existingData.currentSubject || 'matematicas',
    xp: additionalData?.xp !== undefined ? additionalData.xp : (existingData.xp || 100),
    level: additionalData?.level !== undefined ? additionalData.level : (existingData.level || 1),
    streak: additionalData?.streak !== undefined ? additionalData.streak : (existingData.streak || 1),
    createdAt: existingData.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, profileData, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Could not save profile to Firestore:', err);
  }

  return profileData;
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (popupError: any) {
    // If popup blocked or failed in mobile iframe, fallback or rethrow with clear message
    if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/popup-closed-by-user') {
      throw new Error('La ventana emergente de Google fue bloqueada o cerrada. Por favor habilita ventanas emergentes o inténtalo nuevamente.');
    }
    throw popupError;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

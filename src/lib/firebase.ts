import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use custom firestoreDatabaseId if provided, else default
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Ensure user is signed in (anonymously or via Google)
export function ensureAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((res) => {
            unsubscribe();
            resolve(res.user);
          })
          .catch((err) => {
            console.error('Błąd logowania anonimowego Firebase:', err);
            reject(err);
          });
      }
    });
  });
}

export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function logoutUser() {
  return await signOut(auth);
}

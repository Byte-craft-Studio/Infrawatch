import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PLACEHOLDER CONFIG — replace with the real values from the Firebase
// console (Project settings → General → Your apps) once the project
// exists. Do not commit real keys directly if this repo is ever made
// public; move these into environment variables at that point.
const firebaseConfig = {
  apiKey: 'PLACEHOLDER_API_KEY',
  authDomain: 'PLACEHOLDER.firebaseapp.com',
  projectId: 'PLACEHOLDER_PROJECT_ID',
  storageBucket: 'PLACEHOLDER.appspot.com',
  messagingSenderId: 'PLACEHOLDER_SENDER_ID',
  appId: 'PLACEHOLDER_APP_ID',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase Auth needs explicit persistence setup in React Native,
// otherwise a citizen would be signed out (and get a new anonymous
// UID) every time they close the app — which would silently break
// vote tracking and report history.
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if already initialized (e.g. fast refresh in dev)
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export default app;

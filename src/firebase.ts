import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== 'undefined' && firebaseConfig.oAuthClientId) {
  (window as any).__GOOGLE_CLIENT_ID__ = firebaseConfig.oAuthClientId;
}

// Target firestore default or custom database
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-armsptmitrajasat-52aae9e1-5f32-4716-863f-a8a1a969eef9'
);
export default app;

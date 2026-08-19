/* Firestore persistence for the per-user food diary and settings.
 *
 * Everything for one user lives in a single document (userMeals/{uid}):
 * meals, calorie goal, and meal templates. Designed for bootcamp-scale
 * traffic; every mutation merges a patch into that document.
 * All functions degrade gracefully — callers treat failures as "local
 * storage only" rather than breaking the app.
 */

import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

export async function loadUserDoc(uid) {
  const snapshot = await getDoc(doc(db, 'userMeals', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

export async function saveUserDoc(uid, patch) {
  await setDoc(doc(db, 'userMeals', uid), patch, { merge: true });
}
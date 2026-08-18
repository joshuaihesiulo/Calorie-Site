/* Firestore persistence for the per-user food diary.
 *
 * The whole meal list is stored in one document per user (userMeals/{uid}).
 * Designed for bootcamp-scale traffic; every mutation rewrites the list.
 * All functions degrade gracefully — callers treat failures as "local
 * storage only" rather than breaking the app.
 */

import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

export async function loadMealsFromFirestore(uid) {
  const snapshot = await getDoc(doc(db, 'userMeals', uid));
  if (!snapshot.exists()) return null;
  const meals = snapshot.data()?.meals;
  return Array.isArray(meals) ? meals : null;
}

export async function saveMealsToFirestore(uid, meals) {
  await setDoc(doc(db, 'userMeals', uid), { meals }, { merge: true });
}
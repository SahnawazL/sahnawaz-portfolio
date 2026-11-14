// Demo sign-in for the promo film's demo build: an admin is already signed in.
const user = { uid: "demoAdmin0000000000000000001", email: "admin@demo.local", displayName: "Admin", emailVerified: true, isAnonymous: false, photoURL: null, phoneNumber: null,
  providerData: [{ providerId: "google.com" }], metadata: { creationTime: "Mon, 01 Sep 2025 10:00:00 GMT", lastSignInTime: new Date().toUTCString() },
  getIdToken: async () => "demo-token", getIdTokenResult: async () => ({ token: "demo-token", claims: { admin: true } }), reload: async () => {}, toJSON() { return {}; } };
const listeners = new Set();
const auth = { currentUser: user, app: {}, languageCode: "en", settings: {}, onAuthStateChanged: cb => onAuthStateChanged(auth, cb), signOut: async () => {}, authStateReady: async () => {}, useDeviceLanguage() {} };
export function getAuth() { return auth; }
export function initializeAuth() { return auth; }
export function onAuthStateChanged(a, cb) { const f = typeof cb === "function" ? cb : cb && cb.next; listeners.add(f); setTimeout(() => f && f(user), 30); return () => listeners.delete(f); }
export function onIdTokenChanged(a, cb) { return onAuthStateChanged(a, cb); }
export const browserLocalPersistence = {}, indexedDBLocalPersistence = {}, browserSessionPersistence = {}, inMemoryPersistence = {};
export async function setPersistence() {}
export class GoogleAuthProvider { static credential() { return {}; } static credentialFromResult() { return {}; } static credentialFromError() { return null; } addScope() { return this; } setCustomParameters() { return this; } }
export class RecaptchaVerifier { constructor() {} render() { return Promise.resolve(0); } clear() {} verify() { return Promise.resolve(""); } }
const ok = async () => ({ user });
export const signInWithPopup = ok, signInWithRedirect = ok, signInWithCredential = ok, signInWithEmailAndPassword = ok, createUserWithEmailAndPassword = ok, signInAnonymously = ok;
export async function getRedirectResult() { return null; }
export async function signInWithPhoneNumber() { return { confirm: ok }; }
export async function sendPasswordResetEmail() {} export async function sendEmailVerification() {} export async function updateProfile() {}
export async function signOut() {} export async function deleteUser() {} export async function reauthenticateWithCredential() { return { user }; } export async function reauthenticateWithPopup() { return { user }; }
export function connectAuthEmulator() {} export const EmailAuthProvider = { credential: () => ({}) };

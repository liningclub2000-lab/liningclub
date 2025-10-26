// firebase-auth.js (modular SDK)
// Include as ES module after firebase-config.js:
// <script type="module" src="/firebase-auth.js"></script>

import { auth, db, firebaseConfig } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Optional: default actionCodeSettings for email-link sign-in (change url to your finish page)
const defaultActionCodeSettings = {
  url: window.location.origin + "/finishSignIn.html",
  handleCodeInApp: true,
  // iOS/android fields optional; customize if needed
  // iOS: { bundleId: 'com.example.ios' },
  // android: { packageName: 'com.example.android', installApp: true, minimumVersion: '12' },
  // linkDomain: 'custom-domain.com'
};

function mapFirebaseUserToLocal(profile, fbUser) {
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: profile?.name || fbUser.displayName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    purchases: profile?.purchases || [],
    wishlist: profile?.wishlist || [],
    cartCount: profile?.cartCount || 0,
    joined: profile?.joined || new Date().toISOString()
  };
}

// Listen for auth state changes and call setCurrentUser (your script.js function)
onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    try {
      const userDocRef = doc(db, "users", fbUser.uid);
      const snap = await getDoc(userDocRef);
      const profile = snap.exists() ? snap.data() : {};
      const localUser = mapFirebaseUserToLocal(profile, fbUser);
      if (typeof setCurrentUser === "function") setCurrentUser(localUser);
    } catch (err) {
      console.error("Failed loading profile from Firestore:", err);
      if (typeof setCurrentUser === "function") setCurrentUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || ''
      });
    }
  } else {
    if (typeof setCurrentUser === "function") setCurrentUser(null);
  }
});

// Register with email + password and create Firestore profile
export async function registerWithFirebase({ name, email, phone, password }) {
  if (!email || !password) throw new Error("Email and password required");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    try { await updateProfile(cred.user, { displayName: name }); } catch (e) { console.warn(e); }
  }
  const userDocRef = doc(db, "users", cred.user.uid);
  const userProfile = {
    name: name || "",
    email,
    phone: phone || "",
    address: "",
    purchases: [],
    wishlist: [],
    cartCount: 0,
    joined: new Date().toISOString()
  };
  await setDoc(userDocRef, userProfile, { merge: true });
  return cred.user;
}

// Sign in with email + password
export async function signInWithFirebase({ email, password }) {
  if (!email || !password) throw new Error("Email and password required");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Sign out
export async function signOutFirebase() {
  await signOut(auth);
}

// Send passwordless sign-in link to email
export async function sendSignInLinkToEmailHelper(email, actionCodeSettings = defaultActionCodeSettings) {
  if (!email) throw new Error("Email required");
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
  return true;
}

// Handle finishing sign-in from an email link (call on your finishSignIn.html)
export async function handleEmailLinkSignIn(currentUrl = window.location.href) {
  if (!isSignInWithEmailLink(auth, currentUrl)) return null;
  let email = window.localStorage.getItem("emailForSignIn");
  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
  }
  if (!email) throw new Error("Email required to complete sign-in");
  const result = await signInWithEmailLink(auth, email, currentUrl);
  window.localStorage.removeItem("emailForSignIn");

  // Ensure Firestore profile exists for new users
  const fbUser = result.user;
  const userDocRef = doc(db, "users", fbUser.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    const profile = {
      name: fbUser.displayName || "",
      email: fbUser.email || email,
      phone: "",
      address: "",
      purchases: [],
      wishlist: [],
      cartCount: 0,
      joined: new Date().toISOString()
    };
    await setDoc(userDocRef, profile, { merge: true });
  }
  return result;
}

// Expose convenience on window for pages that don't use import
window.registerWithFirebase = registerWithFirebase;
window.signInWithFirebase = signInWithFirebase;
window.signOutFirebase = signOutFirebase;
window.sendSignInLinkToEmailHelper = sendSignInLinkToEmailHelper;
window.handleEmailLinkSignIn = handleEmailLinkSignIn;
// firebase-config.js
// Use as ES module: include with <script type="module" src="/firebase-config.js"></script>
// Replace values if you need; these are taken from the snippet you provided.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";

// Your web app's Firebase configuration (from Firebase Console -> Project settings)
const firebaseConfig = {
  apiKey: "AIzaSyC0adi7l8iR2PwiCqfWkfiV7agVuj_AqDQ",
  authDomain: "liningclubwebstore.firebaseapp.com",
  projectId: "liningclubwebstore",
  storageBucket: "liningclubwebstore.firebasestorage.app",
  messagingSenderId: "608319201669",
  appId: "1:608319201669:web:b15bdb2e5ad3ccac1964ec",
  measurementId: "G-6P7FXBH23B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics is optional; wrap in try/catch (may fail in non-browser env or if disabled)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // ignore if analytics not available
  analytics = null;
}

// Export named instances for use in other modules
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics, firebaseConfig };
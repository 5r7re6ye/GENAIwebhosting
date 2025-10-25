import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCYPsr0Af3l1cduRt2nS9llaCuvnPhrpAA",
    authDomain: "genai-d165d.firebaseapp.com",
    databaseURL: "https://genai-d165d-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "genai-d165d",
    storageBucket: "genai-d165d.appspot.com",
    messagingSenderId: "986154840713",
    appId: "1:986154840713:web:c2b1813d279013d8618c58",
    measurementId: "G-B3WP0XPS3Z"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable App Check with debug token for local development
(window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// Temporarily disable App Check to test uploads
// initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider('6LeK2fArAAAAACpBXrfUcTfJwTO4njElBr2WNr2P'),
//   isTokenAutoRefreshEnabled: true,
// });

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
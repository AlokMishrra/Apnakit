// Firebase Phone Authentication configuration
// Get these values from Firebase Console → Project Settings → Your apps → Web app

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nishumart.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nishumart",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nishumart.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

export const isFirebaseConfigured = () => {
  return (
    !!firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("your-") &&
    !!firebaseConfig.projectId
  );
};

export default firebaseConfig;

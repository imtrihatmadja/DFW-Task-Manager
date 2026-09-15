import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const customDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential && credential.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const ensureDriveToken = async () => {
  if (cachedAccessToken) return cachedAccessToken;
  
  // If no token, force re-auth to get the token (usually instant if already logged in)
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential && credential.accessToken) {
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  }
  throw new Error("Could not get Google Drive access token");
}

export const getAccessToken = () => cachedAccessToken;

export const logOut = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

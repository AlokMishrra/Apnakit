"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
  applicationVerifier,
} from "firebase/auth";
import firebaseConfig, { isFirebaseConfigured } from "@/lib/firebase-config";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;
  if (!firebaseApp) {
    try {
      firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      firebaseAuth = getAuth(firebaseApp);
      // Disable app verification for development — allows testing without app verification
      try {
        if (firebaseAuth.settings) {
          (firebaseAuth.settings as any).appVerificationDisabledForTesting = false;
        }
      } catch {}
    } catch (err) {
      console.error("Firebase init failed:", err);
      return null;
    }
  }
  return firebaseAuth;
}

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export function resetRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {}
    recaptchaVerifier = null;
  }
  confirmationResult = null;
  // Clean up any leftover reCAPTCHA iframes
  try {
    document.querySelectorAll('iframe[src*="recaptcha"]').forEach((el) => el.remove());
  } catch {}
}

/**
 * Setup invisible reCAPTCHA verifier
 * Container must exist in DOM before calling
 */
export function setupRecaptcha(containerId = "firebase-recaptcha-container"): Promise<RecaptchaVerifier> {
  return new Promise((resolve, reject) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      reject(new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* credentials to .env.local"));
      return;
    }
    if (recaptchaVerifier) {
      resolve(recaptchaVerifier);
      return;
    }
    const container = document.getElementById(containerId);
    if (!container) {
      reject(
        new Error(
          `reCAPTCHA container #${containerId} not found in DOM. It must be rendered before calling this function.`
        )
      );
      return;
    }
    // Clear any old reCAPTCHA iframes
    try {
      container.innerHTML = "";
    } catch {}
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          resetRecaptcha();
        },
      });
      recaptchaVerifier
        .render()
        .then(() => {
          if (recaptchaVerifier) resolve(recaptchaVerifier);
          else reject(new Error("reCAPTCHA verifier disappeared"));
        })
        .catch((err) => {
          console.error("reCAPTCHA render failed:", err);
          reject(err);
        });
    } catch (err) {
      console.error("RecaptchaVerifier init failed:", err);
      reject(err);
    }
  });
}

/**
 * Send OTP via Firebase to a phone number
 * Auto-handles reCAPTCHA setup
 */
export async function sendFirebaseOtp(
  phoneNumber: string,
  recaptchaContainerId = "firebase-recaptcha-container"
): Promise<ConfirmationResult> {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }
  // Ensure E.164 format (Firebase requires +countrycode)
  let formatted = phoneNumber.replace(/[\s\-()]/g, "");
  if (!formatted.startsWith("+")) {
    // Default to +91 for 10-digit Indian numbers
    if (/^\d{10}$/.test(formatted)) {
      formatted = `+91${formatted}`;
    } else {
      throw new Error("Phone number must include country code (e.g. +91...)");
    }
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase Phone Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* credentials to .env.local"
    );
  }

  if (confirmationResult) {
    // Already sent — return existing
    return confirmationResult;
  }

  // Set up reCAPTCHA if not already done
  let verifier = recaptchaVerifier;
  if (!verifier) {
    verifier = await setupRecaptcha(recaptchaContainerId);
  }

  try {
    confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
    return confirmationResult;
  } catch (err: any) {
    console.error("Firebase signInWithPhoneNumber error:", err?.code, err?.message);
    // Reset reCAPTCHA on failure
    resetRecaptcha();
    throw err;
  }
}

/**
 * Verify the OTP code entered by the user
 * Returns the Firebase ID token (to send to backend)
 */
export async function verifyFirebaseOtp(code: string): Promise<string> {
  if (!confirmationResult) {
    throw new Error("No OTP request in progress. Please request OTP first.");
  }
  if (!code || code.length !== 6) {
    throw new Error("Please enter the 6-digit code.");
  }
  try {
    const credential = await confirmationResult.confirm(code);
    const idToken = await credential.user.getIdToken();
    resetRecaptcha();
    return idToken;
  } catch (err: any) {
    console.error("Firebase verify error:", err?.code, err?.message);
    // Don't reset reCAPTCHA on wrong code (let user retry)
    if (err?.code === "auth/code-expired" || err?.code === "auth/invalid-verification-code") {
      throw err;
    }
    resetRecaptcha();
    throw err;
  }
}

export function isFirebaseAuthAvailable(): boolean {
  return isFirebaseConfigured();
}

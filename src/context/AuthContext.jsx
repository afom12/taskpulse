import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth user
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc (has the role)
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) { setProfile(null); setLoading(false); }
      }),
    []
  );

  // Live profile: if an admin changes your role, the UI updates instantly.
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => { setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null); setLoading(false); },
      () => setLoading(false)
    );
  }, [user]);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Everyone starts as "user". Security rules forbid self-promotion to admin.
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email, role: "user", createdAt: serverTimestamp(),
    });
  };

  const value = {
    user, profile, loading,
    isAdmin: profile?.role === "admin",
    login, register,
    logout: () => signOut(auth),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

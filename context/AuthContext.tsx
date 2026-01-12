import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  impersonateUser: (uid: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (firebaseUser: User, name?: string) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUser(userSnap.data() as UserProfile);
    } else {
      // Create new user profile
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: name || firebaseUser.displayName || 'Étudiant',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${name || firebaseUser.displayName || 'User'}`,
        role: firebaseUser.email === 'jacqueslaurine@live.be' ? 'superadmin' : 'student',
        bio: '',
        hasFullAccess: firebaseUser.email === 'jacqueslaurine@live.be' // Superadmin has full access
      };
      await setDoc(userRef, newProfile);
      setUser(newProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only sync if we are NOT impersonating
      if (firebaseUser && !originalUser) {
        await syncUserProfile(firebaseUser);
      } else if (!firebaseUser && !originalUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [originalUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(result.user, name);
    } catch (error) {
      console.error("Error signing up", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (originalUser) {
        stopImpersonation();
        return;
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser && !originalUser) {
      await syncUserProfile(firebaseUser);
    }
  };

  const impersonateUser = async (uid: string) => {
    if (!user) return;

    // Store current admin if not already stored
    if (!originalUser) {
      setOriginalUser(user);
    }

    setLoading(true);
    try {
      const targetUserRef = doc(db, 'users', uid);
      const targetUserSnap = await getDoc(targetUserRef);
      if (targetUserSnap.exists()) {
        setUser(targetUserSnap.data() as UserProfile);
      } else {
        alert("Impossible de trouver le profil utilisateur cible.");
        if (!originalUser) setOriginalUser(null);
      }
    } catch (e) {
      console.error("Impersonation failed", e);
    } finally {
      setLoading(false);
    }
  };

  const stopImpersonation = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      refreshUser,
      impersonateUser,
      stopImpersonation,
      isImpersonating: !!originalUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


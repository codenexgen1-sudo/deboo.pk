import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type { AdminRecord, PermissionKey, RoleName, UserProfile } from '../types/ecommerce';
import { hasRbacPermission, ROLE_DEFAULT_PERMISSIONS } from '../utils/commerce';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  adminRecord: AdminRecord | null;
  role: RoleName;
  permissions: PermissionKey[];
  isAuthReady: boolean;
  isStaff: boolean;
  can: (perm: PermissionKey) => boolean;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<{ needsVerification: boolean }>;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<{ emailVerified: boolean }>;
  resendVerificationEmail: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateUserProfile: (updates: { fullName: string; phone?: string; photoUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const syncUserDocuments = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setAdminRecord(null);
      return;
    }

    const isBootstrapAdmin =
      Boolean(user.emailVerified) &&
      (user.email || '').toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL.toLowerCase();

    // Sync user profile only when emailVerified is true (enforced by firestore.rules)
    if (user.emailVerified) {
      const userRef = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const initialRole: RoleName = isBootstrapAdmin ? 'Super Admin' : 'Customer';
          const newProfilePayload = {
            uid: user.uid,
            fullName: user.displayName || user.email?.split('@')[0] || 'Deboo Client',
            email: user.email || '',
            phone: user.phoneNumber || '',
            photoUrl: user.photoURL || '',
            role: 'Customer' as RoleName, // Firestore rules mandate role == 'Customer' on self-create
            emailVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfilePayload);
          setProfile({
            uid: user.uid,
            fullName: newProfilePayload.fullName,
            email: newProfilePayload.email,
            phone: newProfilePayload.phone,
            photoUrl: newProfilePayload.photoUrl,
            role: initialRole,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          const data = snap.data();
          setProfile({
            uid: data.uid,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || '',
            photoUrl: data.photoUrl || '',
            role: isBootstrapAdmin ? 'Super Admin' : (data.role as RoleName) || 'Customer',
            emailVerified: Boolean(user.emailVerified),
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Profile sync notice:', err);
      }

      // Check RBAC /admins/{uid}
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          const d = adminSnap.data();
          setAdminRecord({
            uid: d.uid,
            email: d.email,
            fullName: d.fullName,
            role: d.role,
            permissions: d.permissions || [],
            active: Boolean(d.active),
            assignedBy: d.assignedBy,
            createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        } else if (isBootstrapAdmin) {
          const bootstrapAdmin: AdminRecord = {
            uid: user.uid,
            email: user.email || BOOTSTRAP_SUPER_ADMIN_EMAIL,
            fullName: user.displayName || 'Super Admin',
            role: 'Super Admin',
            permissions: ROLE_DEFAULT_PERMISSIONS['Super Admin'],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setAdminRecord(bootstrapAdmin);
          // Persist bootstrapped super admin record so RBAC list is grounded
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: bootstrapAdmin.email,
            fullName: bootstrapAdmin.fullName,
            role: 'Super Admin',
            permissions: ROLE_DEFAULT_PERMISSIONS['Super Admin'],
            active: true,
            assignedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          setAdminRecord(null);
        }
      } catch (err) {
        if (isBootstrapAdmin) {
          setAdminRecord({
            uid: user.uid,
            email: user.email || BOOTSTRAP_SUPER_ADMIN_EMAIL,
            fullName: user.displayName || 'Super Admin',
            role: 'Super Admin',
            permissions: ROLE_DEFAULT_PERMISSIONS['Super Admin'],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setAdminRecord(null);
        }
      }
    } else {
      // Unverified email user signed in just to see verification page
      setProfile({
        uid: user.uid,
        fullName: user.displayName || user.email?.split('@')[0] || 'Client',
        email: user.email || '',
        role: 'Customer',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setAdminRecord(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await syncUserDocuments(user);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, [syncUserDocuments]);

  const signInWithGoogle = useCallback(async (rememberMe = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const registerWithEmail = useCallback(async (fullName: string, email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: fullName.trim() });
    await sendEmailVerification(cred.user);
    return { needsVerification: !cred.user.emailVerified };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string, rememberMe = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { emailVerified: cred.user.emailVerified };
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active user session found.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Please sign in again before updating your password.');
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const updateUserProfile = useCallback(
    async (updates: { fullName: string; phone?: string; photoUrl?: string }) => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateProfile(auth.currentUser, {
          displayName: updates.fullName.trim(),
          photoURL: updates.photoUrl?.trim() || undefined,
        });
        await updateDoc(userRef, {
          fullName: updates.fullName.trim(),
          phone: (updates.phone || '').trim(),
          photoUrl: (updates.photoUrl || '').trim(),
          emailVerified: auth.currentUser.emailVerified,
          updatedAt: serverTimestamp(),
        });
        await syncUserDocuments(auth.currentUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    },
    [syncUserDocuments]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshUserState = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setFirebaseUser({ ...auth.currentUser } as User);
      await syncUserDocuments(auth.currentUser);
    }
  }, [syncUserDocuments]);

  const role: RoleName = useMemo(() => {
    if (
      firebaseUser?.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      return 'Super Admin';
    }
    if (adminRecord?.active) return adminRecord.role;
    return profile?.role || 'Customer';
  }, [firebaseUser, adminRecord, profile]);

  const permissions = useMemo(() => {
    if (role === 'Super Admin') return ROLE_DEFAULT_PERMISSIONS['Super Admin'];
    if (adminRecord?.active && adminRecord.permissions.length > 0) return adminRecord.permissions;
    return ROLE_DEFAULT_PERMISSIONS[role] || [];
  }, [role, adminRecord]);

  const isStaff = useMemo(() => role !== 'Customer' && Boolean(firebaseUser?.emailVerified), [role, firebaseUser]);

  const can = useCallback(
    (perm: PermissionKey) => hasRbacPermission(role, permissions, perm),
    [role, permissions]
  );

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      adminRecord,
      role,
      permissions,
      isAuthReady,
      isStaff,
      can,
      signInWithGoogle,
      registerWithEmail,
      loginWithEmail,
      resendVerificationEmail,
      requestPasswordReset,
      changePassword,
      updateUserProfile,
      logout,
      refreshUserState,
    }),
    [
      firebaseUser,
      profile,
      adminRecord,
      role,
      permissions,
      isAuthReady,
      isStaff,
      can,
      signInWithGoogle,
      registerWithEmail,
      loginWithEmail,
      resendVerificationEmail,
      requestPasswordReset,
      changePassword,
      updateUserProfile,
      logout,
      refreshUserState,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

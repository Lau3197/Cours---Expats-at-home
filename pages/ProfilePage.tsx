
import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Mail, Shield, Bell, CreditCard, ChevronRight, Save, Loader2, X, Eye, EyeOff, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImageToImgBB } from '../services/imgbb';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';

interface ProfilePageProps {
  user: UserProfile;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user: initialUser }) => {
  const { user: authUser, refreshUser } = useAuth();
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [bio, setBio] = useState(initialUser.bio || '');
  const [avatar, setAvatar] = useState(initialUser.avatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // États pour les notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Synchroniser avec les données utilisateur mises à jour
  useEffect(() => {
    if (authUser) {
      setName(authUser.name);
      setEmail(authUser.email);
      setBio(authUser.bio || '');
      setAvatar(authUser.avatar);
      
      // Charger les préférences de notifications
      if ((authUser as any).notifications) {
        setEmailNotifications((authUser as any).notifications.email !== false);
        setCourseUpdates((authUser as any).notifications.courseUpdates !== false);
        setWeeklyReports((authUser as any).notifications.weeklyReports === true);
      }
    }
  }, [authUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setAvatarError('Veuillez sélectionner une image valide');
      setTimeout(() => setAvatarError(''), 5000);
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('L\'image est trop grande (max 5MB)');
      setTimeout(() => setAvatarError(''), 5000);
      return;
    }

    setUploading(true);
    setAvatarError('');
    setAvatarSuccess('');
    
    try {
      const imageUrl = await uploadImageToImgBB(file);
      setAvatar(imageUrl);
      setAvatarSuccess('Avatar mis à jour ! Sauvegardez pour appliquer les changements.');
      setTimeout(() => setAvatarSuccess(''), 5000);
    } catch (error: any) {
      setAvatarError(error.message || 'Erreur lors de l\'upload de l\'image');
      setTimeout(() => setAvatarError(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) {
      setError('Vous devez être connecté pour sauvegarder');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, {
        name,
        bio,
        avatar
      });

      setSuccess('Profil mis à jour avec succès !');
      setAvatarSuccess('');
      setAvatarError('');
      
      // Rafraîchir le profil utilisateur
      await refreshUser();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!authUser || !auth.currentUser) {
      setPasswordError('Vous devez être connecté');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Changer le mot de passe
      await updatePassword(auth.currentUser, newPassword);

      setPasswordSuccess('Mot de passe changé avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Mot de passe actuel incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Le nouveau mot de passe est trop faible');
      } else {
        setPasswordError(error.message || 'Erreur lors du changement de mot de passe');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!authUser) return;

    setSavingNotifications(true);
    try {
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, {
        notifications: {
          email: emailNotifications,
          courseUpdates,
          weeklyReports
        }
      });
      setSuccess('Préférences de notifications sauvegardées !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingNotifications(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic leading-tight">Your <span className="text-[#dd8b8b] not-italic">Identity.</span></h1>
        <p className="text-[#5A6B70]/50 mt-4 sans-handwritten text-xl italic">Craft your public appearance in the community.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm text-center">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-[#dd8b8b]/10 group-hover:border-[#dd8b8b] transition-all">
                {uploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#F9F7F2]">
                    <Loader2 className="w-8 h-8 text-[#dd8b8b] animate-spin" />
                  </div>
                ) : (
                  <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
                )}
              </div>
              <button 
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 p-2.5 bg-[#E8C586] text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mt-6">{name}</h3>
            <p className="text-xs font-black sans-geometric uppercase tracking-widest text-[#dd8b8b] mt-1">{authUser?.role || initialUser.role}</p>
            {uploading && (
              <div className="mt-4 p-3 rounded-2xl text-xs font-bold bg-blue-50 text-blue-500 border border-blue-100">
                Upload en cours...
              </div>
            )}
            {avatarSuccess && !uploading && (
              <div className="mt-4 p-3 rounded-2xl text-xs font-bold bg-green-50 text-green-500 border border-green-100">
                {avatarSuccess}
              </div>
            )}
            {avatarError && !uploading && (
              <div className="mt-4 p-3 rounded-2xl text-xs font-bold bg-red-50 text-red-500 border border-red-100">
                {avatarError}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
            <h3 className="text-xl font-bold text-[#5A6B70] serif-display italic mb-8">Détails Personnels</h3>
            {(error || success) && (
              <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${
                error ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'
              }`}>
                {error || success}
              </div>
            )}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Nom Complet</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 text-sm font-bold text-[#5A6B70] outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Adresse Email</label>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 text-sm font-bold text-[#5A6B70]/50 outline-none transition-all cursor-not-allowed" 
                  />
                  <p className="text-[9px] text-[#5A6B70]/40 mt-1 italic">L'email ne peut pas être modifié</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Biographie</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez-nous de vous..."
                  className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 text-sm font-bold text-[#5A6B70] outline-none transition-all min-h-[120px] resize-none" 
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex items-center gap-3 bg-[#dd8b8b] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#c97a7a] transition-all sans-geometric uppercase tracking-widest text-xs shadow-xl shadow-[#dd8b8b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Sauvegarder
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    if (authUser) {
                      setName(authUser.name);
                      setBio(authUser.bio || '');
                      setAvatar(authUser.avatar);
                    } else {
                      setName(initialUser.name);
                      setBio(initialUser.bio || '');
                      setAvatar(initialUser.avatar);
                    }
                    setError('');
                    setSuccess('');
                  }}
                  className="px-8 py-4 bg-[#F9F7F2] text-[#5A6B70] font-bold rounded-2xl border border-[#dd8b8b]/10 hover:border-[#dd8b8b] transition-all sans-geometric uppercase tracking-widest text-xs"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>

          {/* Section Sécurité - Changement de mot de passe */}
          <div className="bg-white p-10 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-400"><Shield className="w-5 h-5" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#5A6B70] serif-display italic">Sécurité</h3>
                <p className="text-[10px] font-black text-[#5A6B70]/40 uppercase tracking-widest">Changer votre mot de passe</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-6 p-4 rounded-2xl text-sm font-bold bg-red-50 text-red-500 border border-red-100">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-6 p-4 rounded-2xl text-sm font-bold bg-green-50 text-green-500 border border-green-100">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Mot de passe actuel</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 pr-12 text-sm font-bold text-[#5A6B70] outline-none transition-all" 
                    placeholder="Entrez votre mot de passe actuel"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 pr-12 text-sm font-bold text-[#5A6B70] outline-none transition-all" 
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black sans-geometric uppercase tracking-widest text-[#5A6B70]/40 mb-2">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#F9F7F2] border-2 border-transparent focus:border-[#dd8b8b]/20 rounded-2xl p-4 pr-12 text-sm font-bold text-[#5A6B70] outline-none transition-all" 
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-3 bg-[#dd8b8b] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#c97a7a] transition-all sans-geometric uppercase tracking-widest text-xs shadow-xl shadow-[#dd8b8b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Changement...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section Notifications */}
          <div className="bg-white p-10 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-50 p-3 rounded-xl text-purple-400"><Bell className="w-5 h-5" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#5A6B70] serif-display italic">Notifications</h3>
                <p className="text-[10px] font-black text-[#5A6B70]/40 uppercase tracking-widest">Gérer vos préférences</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl">
                <div>
                  <div className="font-bold text-[#5A6B70] text-sm mb-1">Notifications par email</div>
                  <div className="text-xs text-[#5A6B70]/60">Recevoir des emails concernant votre compte</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-[#5A6B70]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#dd8b8b]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl">
                <div>
                  <div className="font-bold text-[#5A6B70] text-sm mb-1">Mises à jour de cours</div>
                  <div className="text-xs text-[#5A6B70]/60">Notifications pour les nouveaux contenus</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseUpdates}
                    onChange={(e) => setCourseUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-[#5A6B70]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#dd8b8b]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-2xl">
                <div>
                  <div className="font-bold text-[#5A6B70] text-sm mb-1">Rapports hebdomadaires</div>
                  <div className="text-xs text-[#5A6B70]/60">Recevoir un résumé de votre progression</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyReports}
                    onChange={(e) => setWeeklyReports(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-[#5A6B70]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#dd8b8b]"></div>
                </label>
              </div>

              <button 
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="flex items-center gap-3 bg-[#dd8b8b] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#c97a7a] transition-all sans-geometric uppercase tracking-widest text-xs shadow-xl shadow-[#dd8b8b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNotifications ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Sauvegarder les préférences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

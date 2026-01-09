import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Github, Chrome } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2] px-4">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#dd8b8b]/10">
        <div className="px-8 pt-12 pb-8">
          <div className="flex justify-center mb-8">
            <img src="https://i.ibb.co/chry57j9/Logo-Expatsathome-forlightmode.png" alt="Logo" className="h-16" />
          </div>
          
          <h2 className="text-3xl font-black text-[#5A6B70] text-center mb-2 sans-geometric uppercase tracking-tighter">
            {isLogin ? 'Bon retour !' : 'Créer un compte'}
          </h2>
          <p className="text-[#5A6B70]/60 text-center mb-8 font-medium">
            {isLogin ? 'Connectez-vous pour continuer votre apprentissage' : 'Commencez votre voyage vers la maîtrise du français'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#dd8b8b]" />
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#dd8b8b] text-sm font-bold text-[#5A6B70]"
                  required
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#dd8b8b]" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#dd8b8b] text-sm font-bold text-[#5A6B70]"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#dd8b8b]" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#dd8b8b] text-sm font-bold text-[#5A6B70]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dd8b8b] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-[#c97a7a] transition-all shadow-lg shadow-[#dd8b8b]/20 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#dd8b8b]/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-[#5A6B70]/30 bg-white px-4">
              Ou continuer avec
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-[#dd8b8b]/10 text-[#5A6B70] rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm hover:bg-[#F9F7F2] transition-all"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>

          <p className="text-center mt-8 text-sm font-bold text-[#5A6B70]/60">
            {isLogin ? "Vous n'avez pas de compte ?" : "Déjà un compte ?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[#dd8b8b] hover:underline"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;


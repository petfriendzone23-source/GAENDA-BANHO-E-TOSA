import React from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn as LogInIcon, UserPlus, Lock, Mail, AlertCircle, Key, ArrowLeft, CheckCircle2 } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = React.useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const [cachedLogo, setCachedLogo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const logo = localStorage.getItem('cachedLogoUrl');
    if (logo) setCachedLogo(logo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-api-key') {
        setError('Chave de API inválida. Verifique os Secrets no AI Studio.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login por e-mail/senha não está habilitado no Firebase Console. Por favor, habilite-o.');
      } else {
        setError(`Erro: ${err.message || 'Verifique sua conexão e tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 bg-slate-900 text-white text-center">
          <img src={cachedLogo || "/logo.png"} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" referrerPolicy="no-referrer" />
          <h1 className="text-2xl font-bold">Pet Friends Zone</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão de Pet Shop e Banho e Tosa</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {mode !== 'forgot' ? (
              <motion.div
                key="tabs"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex bg-slate-100 p-1 rounded-xl mb-8"
              >
                <button 
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Entrar
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Criar Conta
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-header"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mb-8"
              >
                <button 
                  onClick={() => setMode('signin')}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors mb-4"
                >
                  <ArrowLeft size={16} />
                  Voltar para o Login
                </button>
                <h2 className="text-xl font-bold text-slate-900">Recuperar Senha</h2>
                <p className="text-slate-500 text-sm">Enviaremos um link para o seu e-mail.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Senha</label>
                  {mode === 'signin' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && <LogInIcon size={20} />}
                  {mode === 'signup' && <UserPlus size={20} />}
                  {mode === 'forgot' && <Key size={20} />}
                  {mode === 'signin' && 'Entrar no Sistema'}
                  {mode === 'signup' && 'Criar minha Conta'}
                  {mode === 'forgot' && 'Enviar Link de Recuperação'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs">
              Ao entrar, você concorda com nossos termos de uso.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;

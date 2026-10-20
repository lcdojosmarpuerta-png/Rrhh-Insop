import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: { username: string; nombre: string; cargo: string; rol: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (username.trim() === 'MariaP26' && password === 'MariaP26*') {
        const user = {
          username: 'MariaP26',
          nombre: 'Lcda. Maria Peña',
          cargo: 'Enlaces RRHH',
          rol: 'Analista Principal de Gestión Humana'
        };
        onLoginSuccess(user);
      } else {
        setError('Usuario o contraseña incorrectos. Verifique sus credenciales institucionales.');
        setIsLoading(false);
      }
    }, 400);
  };

  const fillAuthorizedCredentials = () => {
    setUsername('MariaP26');
    setPassword('MariaP26*');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0B4F9C]/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Venezuelan Tricolor Ribbon */}
        <div className="h-1.5 w-full grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        {/* Institutional Header Banner */}
        <div className="p-6 text-center bg-slate-900 text-white relative">
          <div className="w-20 h-20 mx-auto mb-3 bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="Logo INSOPESCA"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">
            República Bolivariana de Venezuela
          </div>
          <div className="text-xs font-semibold text-slate-300">
            Ministerio del Poder Popular de Pesca y Acuicultura
          </div>
          <div className="text-base font-extrabold text-white mt-1">
            INSOPESCA · SIGEF-RRHH
          </div>
          <div className="text-[11px] text-sky-300 font-medium">
            Sistema Integral de Gestión de Capital Humano
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">
              Inicio de Sesión Institucional
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingrese con sus credenciales autorizadas de Gestión Humana
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Usuario del Sistema
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: MariaP26"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick autofill helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={fillAuthorizedCredentials}
                className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0B4F9C] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rellenar credenciales autorizadas (MariaP26)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <span>Validando acceso...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Acceso Seguro · Certificación APN · DGRRHH</span>
          </div>

        </div>

      </div>
    </div>
  );
};

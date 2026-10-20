import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Landmark } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { username: string; nombre: string; cargo: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('MariaP26');
  const [password, setPassword] = useState('MariaP26*');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      // Validate credentials specified by the user: MariaP26 / MariaP26*
      if (username.trim() === 'MariaP26' && password === 'MariaP26*') {
        const authData = {
          username: 'MariaP26',
          nombre: 'Lcda. Maria Peña',
          cargo: 'Enlaces RRHH'
        };
        localStorage.setItem('sigef_auth_user', JSON.stringify(authData));
        onLoginSuccess(authData);
      } else {
        setError('Credenciales no autorizadas. Ingrese el usuario y contraseña institucional correspondientes.');
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('MariaP26');
    setPassword('MariaP26*');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      
      {/* Background Subtle Gradient & Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B4F9C]/25 via-slate-950 to-slate-950 pointer-events-none"></div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Tricolor Ribbon on Top */}
        <div className="h-1.5 w-full grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        {/* Card Header with Logo */}
        <div className="p-6 pb-5 text-center bg-slate-50 border-b border-slate-200">
          <div className="w-20 h-20 bg-white p-1.5 rounded-2xl mx-auto shadow-md border border-slate-200 mb-3 flex items-center justify-center">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="Logo Oficial INSOPESCA"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            República Bolivariana de Venezuela
          </div>
          <div className="text-xs font-bold text-slate-800 uppercase">
            Ministerio de Pesca y Acuicultura
          </div>
          <div className="text-sm font-black text-[#0B4F9C] uppercase tracking-tight">
            INSOPESCA · SIGEF-RRHH
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sistema Integral de Gestión de Capital Humano
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Usuario Institucional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. MariaP26"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Credential Helper Box */}
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-950 flex items-center justify-between">
            <div>
              <div className="font-bold text-[#0B4F9C]">Credenciales oficiales:</div>
              <div className="font-mono text-[11px] text-slate-700">
                Usuario: <strong>MariaP26</strong> | Clave: <strong>MariaP26*</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] text-[#0B4F9C] hover:underline font-bold whitespace-nowrap ml-2"
            >
              Completar
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-2">⟳</span>
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#FFD100]" />
            )}
            <span>{loading ? 'Verificando credenciales...' : 'Ingresar al Sistema'}</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center leading-normal pt-2">
            Acceso restringido a la Dirección General de Recursos Humanos y Enlaces Institucionales de INSOPESCA.
          </div>

        </form>

      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 mt-6 relative z-10 font-medium">
        INSOPESCA · Instituto Socialista de la Pesca y Acuicultura · República Bolivariana de Venezuela
      </div>

    </div>
  );
};

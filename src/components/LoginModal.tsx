import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Clock, MonitorSmartphone } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export interface SessionNotice {
  type: 'inactividad' | 'nuevo_equipo';
  message: string;
}

interface LoginModalProps {
  onLoginSuccess: (user: { username: string; nombre: string; cargo: string; rol: string }) => void;
  onCancel?: () => void;
  sessionNotice?: SessionNotice | null;
}

const BACKGROUND_IMAGES_4K = [
  {
    src: '/assets/aistudio/Insopesca_MAT__5__5b2abe2b.JPG',
    title: 'Despliegue Institucional INSOPESCA',
  },
  {
    src: '/assets/aistudio/WhatsApp-Image-2024-07-11-at-13.57.222_d20c47e1.jpeg',
    title: 'Soberanía Alimentaria y Producción Pesquera',
  },
  {
    src: '/assets/aistudio/istockphoto-464664291-612x612_86bc293d.jpg',
    title: 'Flota y Actividad Pesquera Sustentable',
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onCancel, sessionNotice }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Transición automática de las imágenes de fondo en 4K
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % BACKGROUND_IMAGES_4K.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanUser = username.trim();

    try {
      // Consultar tabla usuarios_sistema en Supabase si está disponible
      const { data, error: dbErr } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('username', cleanUser)
        .eq('password_hash', password)
        .eq('activo', true)
        .maybeSingle();

      if (!dbErr && data) {
        onLoginSuccess({
          username: data.username,
          nombre: data.nombre,
          cargo: data.cargo,
          rol: data.rol
        });
        return;
      }
    } catch {
      // Continuar a validación de respaldo institucional
    }

    // Validación institucional autorizada de respaldo
    if (cleanUser === 'MariaP26' && password === 'MariaP26*') {
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
  };

  const fillAuthorizedCredentials = () => {
    setUsername('MariaP26');
    setPassword('MariaP26*');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-16 overflow-y-auto bg-slate-950">
      
      {/* Full-Screen 4K Ultra-HD Institutional Background with Automatic Transitions */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        {BACKGROUND_IMAGES_4K.map((img, index) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <img
              src={img.src}
              alt={img.title}
              className="w-full h-full object-cover object-center contrast-110 saturate-115 brightness-95"
            />
          </div>
        ))}

        {/* High-Definition Vignette & Readability Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/50 to-[#0B4F9C]/45" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/25 to-slate-950/75" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md my-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
        
        {/* Venezuelan Tricolor Ribbon */}
        <div className="h-1.5 w-full grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        {/* Institutional Header Banner */}
        <div className="p-4 sm:p-6 text-center bg-slate-900 text-white relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 bg-white p-1.5 sm:p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
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
        <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">
              Inicio de Sesión Institucional
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingrese con sus credenciales certificadas de Gestión Humana
            </p>
          </div>

          {sessionNotice && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
              sessionNotice.type === 'inactividad'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}>
              {sessionNotice.type === 'inactividad' ? (
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              ) : (
                <MonitorSmartphone className="w-4 h-4 shrink-0 mt-0.5 text-[#0B4F9C]" />
              )}
              <div className="leading-relaxed">
                <div className="font-bold">
                  {sessionNotice.type === 'inactividad'
                    ? 'Sesión Cerrada por Inactividad (10 min)'
                    : 'Inicio Detectado en Equipo / Sesión Nueva'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {sessionNotice.message}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Usuario Certificado
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
                className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0B4F9C] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Volver al Formulario de Registro de Empleado
              </button>
            )}
          </form>

          {/* Security badge */}
          <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acceso Seguro · Supabase Cloud · DGRRHH</span>
            </div>
            <div className="text-[9px] text-slate-400">
              Cierre automático por seguridad tras 10 minutos de inactividad
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

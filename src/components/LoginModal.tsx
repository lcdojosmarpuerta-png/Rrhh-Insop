import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  onLoginSuccess: (user: { username: string; nombre: string; cargo: string; rol: string }) => void;
}

const BACKGROUND_IMAGES_4K = [
  {
    src: '/assets/aistudio/Insopesca_MAT__5__5b2abe2b.JPG',
    title: 'Despliegue Institucional INSOPESCA',
    subtitle: 'Atención directa y fortalecimiento del sector pesquero y acuícola nacional'
  },
  {
    src: '/assets/aistudio/WhatsApp-Image-2024-07-11-at-13.57.222_d20c47e1.jpeg',
    title: 'Soberanía Alimentaria y Producción Pesquera',
    subtitle: 'Ministerio del Poder Popular de Pesca y Acuicultura · MPPPA'
  },
  {
    src: '/assets/aistudio/istockphoto-464664291-612x612_86bc293d.jpg',
    title: 'Flota y Actividad Pesquera Sustentable',
    subtitle: 'Desarrollo estratégico de nuestros mares, ríos y costas venezolanas'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % BACKGROUND_IMAGES_4K.length);
    }, 6000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      
      {/* Full-Screen 4K Ultra-HD Institutional Background Gallery behind Login Panel */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Main Fullscreen Active 4K Slide with crisp contrast */}
        {BACKGROUND_IMAGES_4K.map((img, index) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
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

        {/* Subtle 3-Column Panoramic 4K Mosaic Strip at Bottom/Sides for Simultaneous Visibility */}
        <div className="hidden lg:grid grid-cols-3 inset-0 absolute opacity-35 mix-blend-luminosity">
          {BACKGROUND_IMAGES_4K.map((img, idx) => (
            <div key={idx} className="relative h-full border-r border-white/10 overflow-hidden">
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover object-center contrast-125 saturate-110"
              />
            </div>
          ))}
        </div>

        {/* High-Definition Vignette & Readability Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/50 to-[#0B4F9C]/45" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/25 to-slate-950/75" />
      </div>

      {/* Bottom-Left 4K Gallery Selector & Institutional Caption */}
      <div className="hidden md:flex flex-col gap-2.5 fixed bottom-6 left-6 z-20 max-w-md bg-slate-950/75 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFD100] text-slate-950 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Galería Institucional 4K UHD
          </span>
          <span className="text-[10px] text-sky-300 font-mono">
            {activeSlide + 1} / {BACKGROUND_IMAGES_4K.length}
          </span>
        </div>
        <div>
          <div className="text-xs font-bold text-white">
            {BACKGROUND_IMAGES_4K[activeSlide].title}
          </div>
          <div className="text-[11px] text-slate-300">
            {BACKGROUND_IMAGES_4K[activeSlide].subtitle}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {BACKGROUND_IMAGES_4K.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                idx === activeSlide
                  ? 'border-[#FFD100] ring-2 ring-[#FFD100]/40 scale-[1.03]'
                  : 'border-white/25 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover contrast-115 saturate-115"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
        
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
          </form>

          {/* Security badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Acceso Seguro · Supabase Cloud · DGRRHH</span>
          </div>

        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Phone, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';

interface FooterCintilloProps {
  hasBottomNav?: boolean;
}

export const FooterCintillo: React.FC<FooterCintilloProps> = ({ hasBottomNav = false }) => {
  return (
    <footer className={`w-full bg-slate-900 text-slate-300 border-t border-slate-800 shadow-lg py-2.5 px-4 sm:px-6 shrink-0 print:hidden z-30 transition-all ${
      hasBottomNav ? 'mb-16 md:mb-0' : ''
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Side: Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 px-2 py-0.5 bg-white rounded-md flex items-center justify-center shadow-xs border border-slate-300 shrink-0">
            <img
              src="/assets/aistudio/1791899989619_db0f9485.jpg"
              alt="S&S Web Studio"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="text-center sm:text-left">
            <div className="font-semibold text-white tracking-wide flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <span>Sistema Diseñado y Elaborado por</span>
              <span className="text-[#38bdf8] font-bold">S&S Web Studio</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <a 
                href="tel:04245104245" 
                className="text-amber-400 hover:text-amber-300 font-mono font-bold tracking-wider hover:underline inline-flex items-center gap-1 transition-colors"
                title="Llamar a soporte técnico"
              >
                <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                0424-5104245
              </a>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ideas que conectan tu negocio al mundo · Soluciones Tecnológicas y Sistemas Web a Medida
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Contact Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/584245104245?text=Hola,%20contacto%20desde%20el%20Sistema%20SIGEF-RRHH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 rounded-full transition-colors shadow-xs"
            title="Escribir por WhatsApp a S&S Web Studio"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp: 0424-5104245</span>
          </a>

          <a
            href="tel:04245104245"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition-colors"
            title="Llamada directa"
          >
            <Phone className="w-3 h-3 text-sky-400" />
            <span>Llamar</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

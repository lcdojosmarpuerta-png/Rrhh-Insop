import React, { useState } from 'react';
import { Search, UserPlus, X, Building2, LogOut } from 'lucide-react';
import { Funcionario } from '../types/rrhh';

interface HeaderProps {
  onNewRegistro: () => void;
  onSelectFuncionario: (f: Funcionario) => void;
  funcionarios: Funcionario[];
  activeView: string;
  currentUser?: { username: string; nombre: string; cargo: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewRegistro,
  onSelectFuncionario,
  funcionarios,
  activeView,
  currentUser,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Search results
  const results = searchTerm.trim().length >= 2
    ? funcionarios.filter(f => {
        const term = searchTerm.toLowerCase();
        const cedulaLimpia = f.identificacion.cedula.replace(/\D/g, '');
        const termLimpio = term.replace(/\D/g, '');
        const matchCedula = termLimpio && cedulaLimpia.includes(termLimpio);
        const matchNombre = `${f.identificacion.nombres} ${f.identificacion.apellidos}`.toLowerCase().includes(term);
        const matchCargo = f.situacionLaboral.cargoNominal.toLowerCase().includes(term);
        return matchCedula || matchNombre || matchCargo;
      }).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md no-print">
      {/* Venezuelan Tricolor Ribbon accent matching INSOPESCA Logo */}
      <div className="h-1 w-full grid grid-cols-12">
        <div className="col-span-5 bg-[#FFD100]"></div>
        <div className="col-span-4 bg-[#0B4F9C]"></div>
        <div className="col-span-3 bg-[#D91424]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Institutional Brand with Official INSOPESCA Logo */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Official Logo Container */}
            <div className="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
              <img
                src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                alt="Logo INSOPESCA"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100]"></span>
                <span>MPPPA · INSOPESCA</span>
                <span className="hidden md:inline text-slate-500 font-normal">| GESTIÓN HUMANA</span>
              </div>
              <div className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-2">
                <span>SIGEF-RRHH</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0B4F9C]/80 text-sky-200 border border-[#0B4F9C]">
                  Expediente Digital
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Global Search Bar */}
          <div className="relative flex-1 max-w-lg mx-2 hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-sky-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearching(true)}
                placeholder="Búsqueda rápida por Cédula, Nombres o Cargo..."
                className="w-full pl-9 pr-9 py-1.5 text-sm bg-slate-800 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown search results */}
            {isSearching && searchTerm.trim().length >= 2 && (
              <div 
                className="absolute left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 text-slate-200"
                onMouseLeave={() => setIsSearching(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 bg-slate-850 border-b border-slate-700 flex justify-between">
                  <span>RESULTADOS DE BÚSQUEDA ({results.length})</span>
                  <span className="text-[10px] text-sky-300">Presiona para abrir ficha</span>
                </div>
                {results.length > 0 ? (
                  <div className="divide-y divide-slate-700/60 max-h-64 overflow-y-auto">
                    {results.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onSelectFuncionario(f);
                          setIsSearching(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700/60 flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-600 shrink-0 border border-slate-500">
                          {f.identificacion.fotoUrl ? (
                            <img src={f.identificacion.fotoUrl} alt={f.identificacion.nombres} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                              {f.identificacion.nombres.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 truncate flex items-center gap-2">
                            <span>{f.identificacion.nombres} {f.identificacion.apellidos}</span>
                            <span className="font-mono text-[11px] text-slate-400 font-normal">
                              C.I. {f.identificacion.tipoCedula}-{f.identificacion.cedula}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {f.situacionLaboral.cargoNominal} · {f.situacionLaboral.sedeRegion}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No se encontraron funcionarios con el criterio ingresado.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 3: Primary Action & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewRegistro}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] rounded-lg shadow-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-sky-400 border border-blue-500/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Registro</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#0B4F9C] border border-sky-400/50 flex items-center justify-center text-[#FFD100] font-bold text-xs shadow-sm">
                MP
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser?.nombre || 'Lcda. Maria Peña'}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser?.cargo || 'Enlaces RRHH'}
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 ml-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Cerrar sesión institucional"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

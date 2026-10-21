import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';

interface SidebarProps {
  activeView: 'dashboard' | 'directorio' | 'captacion' | 'respaldo';
  onViewChange: (view: 'dashboard' | 'directorio' | 'captacion' | 'respaldo') => void;
  totalFuncionarios: number;
  totalCompletos: number;
  totalProximosJubilar: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  totalFuncionarios,
  totalCompletos,
  totalProximosJubilar,
  isCollapsed,
  onToggleCollapse
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Inicio/Resumen',
      sublabel: 'KPIs e Indicadores',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'captacion',
      label: 'Registro Empleado',
      sublabel: 'Formulario de Captación',
      icon: UserPlus,
      badge: 'Nuevo'
    },
    {
      id: 'directorio',
      label: 'Directorio General',
      sublabel: 'Padrón y Auditoría',
      icon: Users,
      badge: totalFuncionarios
    },
    {
      id: 'respaldo',
      label: 'Respaldo',
      sublabel: 'Exportar / Importar JSON',
      icon: Database,
      badge: null
    }
  ] as const;

  return (
    <aside 
      className={`hidden md:flex bg-slate-900 border-r border-slate-800 flex-col transition-all duration-200 no-print ${
        isCollapsed ? 'w-20' : 'w-68'
      }`}
    >
      {/* INSOPESCA Brand Banner */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 border border-slate-300 shadow-xs">
              <img
                src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                alt="Logo INSOPESCA"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white tracking-wide truncate">
                INSOPESCA
              </div>
              <div className="text-[10px] text-sky-200 font-medium truncate">
                Pesca y Acuicultura
              </div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-md bg-white p-0.5 mx-auto flex items-center justify-center shadow-xs">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="Logo INSOPESCA"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-[#0B4F9C] text-white shadow-sm ring-1 ring-sky-400/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#FFD100]' : 'text-slate-400 group-hover:text-slate-200'}`} />
              
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="truncate leading-tight font-semibold">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </div>
                </div>
              )}

              {!isCollapsed && item.badge !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono tabular-nums font-semibold ${
                  isActive 
                    ? 'bg-[#073870] text-[#FFD100]' 
                    : item.badge === 'Nuevo' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapse */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-800 text-slate-200 text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Summary Widget */}
      {!isCollapsed && (
        <div className="p-3.5 m-3 rounded-lg bg-slate-850 border border-slate-800 text-slate-300 relative overflow-hidden">
          {/* Subtle tricolor line on widget */}
          <div className="absolute top-0 inset-x-0 h-0.5 flex">
            <div className="w-1/2 bg-[#FFD100]"></div>
            <div className="w-1/4 bg-[#0B4F9C]"></div>
            <div className="w-1/4 bg-[#D91424]"></div>
          </div>

          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>RESUMEN DE CENSO</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Plantilla Registrada:</span>
              <span className="font-mono tabular-nums font-bold text-white">{totalFuncionarios}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Expedientes 100%:</span>
              <span className="font-mono tabular-nums text-emerald-400 font-bold">{totalCompletos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Próximos a Jubilar:</span>
              <span className="font-mono tabular-nums text-[#FFD100] font-bold">{totalProximosJubilar}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>Padrón censal oficial de INSOPESCA y entes adscritos.</span>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
        {!isCollapsed ? (
          <div>
            <div className="font-bold text-slate-300">INSOPESCA · DGRRHH</div>
            <div className="text-slate-500">Sistema Certificado APN</div>
          </div>
        ) : (
          <span className="font-mono text-slate-400">v3.4</span>
        )}
      </div>
    </aside>
  );
};

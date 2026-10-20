import React from 'react';
import { 
  Users, 
  FileCheck, 
  Clock, 
  Building2, 
  UserPlus, 
  AlertTriangle, 
  MapPin,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { Funcionario, calcularCompletitudExpediente, evaluarEstatusJubilacion } from '../types/rrhh';

interface DashboardProps {
  funcionarios: Funcionario[];
  onNavigateToDirectorio: (filterCondition?: string) => void;
  onNavigateToCaptacion: () => void;
  onSelectFuncionario: (f: Funcionario) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  funcionarios,
  onNavigateToDirectorio,
  onNavigateToCaptacion,
  onSelectFuncionario
}) => {
  // 1. Cálculos de KPIs
  const total = funcionarios.length;
  const fijos = funcionarios.filter(f => f.situacionLaboral.condicion === 'FIJO').length;
  const contratados = funcionarios.filter(f => f.situacionLaboral.condicion === 'CONTRATADO').length;
  const jubilados = funcionarios.filter(f => f.situacionLaboral.condicion === 'JUBILADO' || f.situacionLaboral.condicion === 'PENSIONADO').length;
  const altoNivel = funcionarios.filter(f => f.situacionLaboral.condicion === 'ALTO_NIVEL' || f.situacionLaboral.condicion === 'COMISION_SERVICIO').length;

  // Expedientes completos
  const completitudes = funcionarios.map(f => ({
    funcionario: f,
    ...calcularCompletitudExpediente(f)
  }));
  const expedientesCompletos = completitudes.filter(c => c.completo).length;
  const expedientesIncompletos = total - expedientesCompletos;
  const porcentajeAuditoriaGlobal = total > 0 ? Math.round((expedientesCompletos / total) * 100) : 0;

  // Próximos a jubilación
  const listaJubilacion = funcionarios.map(f => {
    const estatus = evaluarEstatusJubilacion(
      f.identificacion.fechaNacimiento,
      f.identificacion.genero,
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    return { funcionario: f, estatus };
  }).filter(item => item.estatus.proximo || item.estatus.califica);

  // Distribución por Unidad Administrativa
  const porUnidad: Record<string, number> = {};
  funcionarios.forEach(f => {
    const unidad = f.situacionLaboral.unidadAdministrativa || 'Sin adscripción';
    porUnidad[unidad] = (porUnidad[unidad] || 0) + 1;
  });
  const unidadesOrdenadas = Object.entries(porUnidad).sort((a, b) => b[1] - a[1]);

  // Distribución por Sede Regional
  const porSede: Record<string, number> = {};
  funcionarios.forEach(f => {
    const sede = f.situacionLaboral.sedeRegion || 'Sin sede asignada';
    porSede[sede] = (porSede[sede] || 0) + 1;
  });
  const sedesOrdenadas = Object.entries(porSede).sort((a, b) => b[1] - a[1]);

  // Distribución por Nivel de Instrucción
  const porInstruccion: Record<string, number> = {};
  funcionarios.forEach(f => {
    const nivel = f.perfilAcademico?.nivelInstruccion || 'NO_REGISTRADO';
    porInstruccion[nivel] = (porInstruccion[nivel] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* Ministerial Welcome & Action Banner with Official INSOPESCA Branding */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0B4F9C]/90 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
        {/* Tricolor Ribbon on top border */}
        <div className="absolute top-0 inset-x-0 h-1 grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 pt-2">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-sky-100 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#FFD100]"></span>
              <span>República Bolivariana de Venezuela</span>
              <span aria-hidden="true">·</span>
              <span>MPPPA / INSOPESCA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Gestión Integral de Capital Humano
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Padrón censal, auditoría de expedientes digitales y control de personal del <strong>Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)</strong>, entes adscritos y el Ministerio del Poder Popular para la Pesca y Acuicultura.
            </p>
            
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={onNavigateToCaptacion}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFD100] hover:bg-[#E5BC00] text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Nuevo Registro de Personal</span>
              </button>
              <button
                onClick={() => onNavigateToDirectorio()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all backdrop-blur-xs"
              >
                <Users className="w-4 h-4 text-[#FFD100]" />
                <span>Directorio Completo ({total})</span>
              </button>
            </div>
          </div>

          {/* INSOPESCA Featured Logo Seal Card */}
          <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-white/80 shrink-0 self-center md:self-auto hidden sm:block">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="INSOPESCA Logo Oficial"
              className="w-36 h-36 object-contain"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Personal */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Servidores
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4F9C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {total}
            </span>
            <span className="text-xs text-slate-500">en plantilla</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Fijos: <strong className="text-slate-900 font-mono-numbers">{fijos}</strong></span>
            <span>Contratados: <strong className="text-slate-900 font-mono-numbers">{contratados}</strong></span>
          </div>
        </div>

        {/* KPI 2: Condición Jurídica Laboral */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estabilidad Laboral
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0B4F9C] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B4F9C] font-mono-numbers">
              {Math.round((fijos / (total || 1)) * 100)}%
            </span>
            <span className="text-xs text-slate-500">personal fijo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Alto Nivel: <strong className="text-slate-900 font-mono-numbers">{altoNivel}</strong></span>
            <span>Jubilados: <strong className="text-slate-900 font-mono-numbers">{jubilados}</strong></span>
          </div>
        </div>

        {/* KPI 3: Expedientes Digitales */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Auditoría Digital
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              porcentajeAuditoriaGlobal >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {porcentajeAuditoriaGlobal}%
            </span>
            <span className="text-xs text-emerald-700 font-medium">expedientes al día</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{expedientesCompletos} Completos</span>
            <span className="text-amber-700 font-medium">{expedientesIncompletos} Pendientes</span>
          </div>
        </div>

        {/* KPI 4: Próximos a Jubilarse */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Régimen Jubilación
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900 font-mono-numbers">
              {listaJubilacion.length}
            </span>
            <span className="text-xs text-slate-500">califican / próximos</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Ley Estatuto APN</span>
            <button 
              onClick={() => onNavigateToDirectorio('jubilacion')}
              className="text-[#0B4F9C] hover:underline font-semibold text-[11px]"
            >
              Auditar lista
            </button>
          </div>
        </div>

      </div>

      {/* Main Analysis Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Distribución por Dependencia Administrativa */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Distribución por Unidad Administrativa
              </h2>
              <p className="text-xs text-slate-500">
                Direcciones de Línea de INSOPESCA y Entes del Sector
              </p>
            </div>
            <span className="text-xs font-mono-numbers text-slate-500">
              {unidadesOrdenadas.length} adscripciones
            </span>
          </div>

          <div className="space-y-3.5">
            {unidadesOrdenadas.slice(0, 6).map(([unidad, cantidad]) => {
              const porcentaje = Math.round((cantidad / total) * 100);
              return (
                <div key={unidad} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[280px]" title={unidad}>
                      {unidad}
                    </span>
                    <span className="font-mono-numbers font-semibold text-slate-700 shrink-0">
                      {cantidad} ({porcentaje}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0B4F9C] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(porcentaje, 5)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Distribución por Sede Territorial y Formación */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Despliegue Territorial INSOPESCA
                </h2>
                <p className="text-xs text-slate-500">
                  Sedes regionales, inspectorías, puertos y muelles de descarga
                </p>
              </div>
              <MapPin className="w-4 h-4 text-[#0B4F9C]" />
            </div>

            <div className="space-y-3 mb-5">
              {sedesOrdenadas.slice(0, 5).map(([sede, cantidad]) => {
                const porcentaje = Math.round((cantidad / total) * 100);
                return (
                  <div key={sede} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-medium truncate max-w-[260px]">
                        {sede}
                      </span>
                      <span className="font-mono-numbers font-semibold text-slate-700 shrink-0">
                        {cantidad} servidores
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#0B4F9C] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(porcentaje, 6)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrucción Académica Bar Summary */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#0B4F9C]" />
              <span>Nivel Académico del Personal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">Universitarios</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {(porInstruccion['UNIVERSITARIO'] || 0) + (porInstruccion['MAESTRIA'] || 0) + (porInstruccion['DOCTORADO'] || 0) + (porInstruccion['ESPECIALIZACION'] || 0)}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">TSU</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {porInstruccion['TSU'] || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">Bachilleres</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {porInstruccion['BACHILLER'] || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Alertas Tempranas de Gestión de Personal */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Alertas de Jubilación y Auditoría Normativa APN
              </h2>
              <p className="text-xs text-slate-500">
                Funcionarios de INSOPESCA con calificación para trámite de jubilación
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToDirectorio('jubilacion')}
            className="text-xs text-[#0B4F9C] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos los casos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {listaJubilacion.slice(0, 4).map(({ funcionario, estatus }) => (
            <div 
              key={funcionario.id} 
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => onSelectFuncionario(funcionario)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  {funcionario.identificacion.fotoUrl ? (
                    <img 
                      src={funcionario.identificacion.fotoUrl} 
                      alt={funcionario.identificacion.nombres} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                      {funcionario.identificacion.nombres.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}</span>
                    <span className="font-mono-numbers text-[11px] text-slate-500 font-normal">
                      C.I. {funcionario.identificacion.tipoCedula}-{funcionario.identificacion.cedula}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {funcionario.situacionLaboral.cargoNominal} · {funcionario.situacionLaboral.sedeRegion}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:self-center self-start pl-12 sm:pl-0">
                <div className="text-right">
                  <div className="text-xs font-semibold text-amber-800">
                    {estatus.motivo}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ingreso: {funcionario.situacionLaboral.fechaIngresoMinisterio} (+{funcionario.situacionLaboral.anosServicioPrevioAPN}a APN)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFuncionario(funcionario);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0B4F9C] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors shrink-0"
                >
                  Ver Ficha
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

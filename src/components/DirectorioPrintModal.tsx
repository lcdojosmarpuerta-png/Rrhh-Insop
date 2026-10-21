import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Users, 
  ShoppingBag, 
  ClipboardCheck, 
  Calendar, 
  MapPin, 
  Tag, 
  Fingerprint, 
  PenTool,
  ShieldCheck,
  Building2,
  FileText,
  SlidersHorizontal,
  Check,
  Phone,
  Mail,
  GraduationCap,
  CreditCard,
  Shirt
} from 'lucide-react';
import { Funcionario, calcularAntiguedad, calcularCompletitudExpediente } from '../types/rrhh';
import { 
  exportToExcelXLS, 
  exportCombosAlimenticiosXLS, 
  exportAsistenciaActividadesXLS,
  exportDirectorioPersonalizadoXLS 
} from '../utils/excelExport';

export type PrintModelType = 'directorio' | 'combos' | 'asistencia';

export interface DirectorioColumnOption {
  id: string;
  label: string;
  shortLabel: string;
  category: 'identificacion' | 'laboral' | 'contacto' | 'academico' | 'control';
  defaultEnabled: boolean;
}

export const DIRECTORIO_COLUMN_OPTIONS: DirectorioColumnOption[] = [
  { id: 'cedula', label: 'Cédula de Identidad', shortLabel: 'Cédula', category: 'identificacion', defaultEnabled: true },
  { id: 'nombres', label: 'Nombres y Apellidos', shortLabel: 'Nombres y Apellidos', category: 'identificacion', defaultEnabled: true },
  { id: 'cargo', label: 'Cargo Nominal / Funcional', shortLabel: 'Cargo', category: 'laboral', defaultEnabled: true },
  { id: 'unidad', label: 'Unidad Administrativa', shortLabel: 'Unidad Administrativa', category: 'laboral', defaultEnabled: true },
  { id: 'sede', label: 'Sede / Región', shortLabel: 'Sede / Región', category: 'laboral', defaultEnabled: true },
  { id: 'telefono', label: 'Teléfono Móvil', shortLabel: 'Teléfono', category: 'contacto', defaultEnabled: false },
  { id: 'email', label: 'Correo Electrónico', shortLabel: 'Correo Electrónico', category: 'contacto', defaultEnabled: false },
  { id: 'fechaIngreso', label: 'Fecha de Ingreso', shortLabel: 'Fecha Ingreso', category: 'laboral', defaultEnabled: false },
  { id: 'antiguedad', label: 'Antigüedad APN Total', shortLabel: 'Antigüedad APN', category: 'laboral', defaultEnabled: true },
  { id: 'completitud', label: 'Estatus Expediente (% Exp.)', shortLabel: '% Expediente', category: 'control', defaultEnabled: true },
  { id: 'instruccion', label: 'Nivel Académico / Profesión', shortLabel: 'Nivel / Profesión', category: 'academico', defaultEnabled: false },
  { id: 'banco', label: 'Banco y Cuenta Nómina', shortLabel: 'Banco / Cuenta', category: 'laboral', defaultEnabled: false },
  { id: 'carnet', label: 'Carnet de Identificación', shortLabel: 'Carnet ID', category: 'laboral', defaultEnabled: false },
  { id: 'tallas', label: 'Tallas de Uniforme (C/P/Z)', shortLabel: 'Tallas Uniforme', category: 'identificacion', defaultEnabled: false },
  { id: 'cargaFamiliar', label: 'Carga Familiar', shortLabel: 'Carga Familiar', category: 'identificacion', defaultEnabled: false },
  { id: 'firma', label: 'Casilla de Firma / Verificación', shortLabel: 'Firma / Verificación', category: 'control', defaultEnabled: false },
];

interface DirectorioPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionarios: Funcionario[];
  activeFilters: {
    condicion: string;
    sede: string;
    estatus: string;
    searchTerm: string;
  };
  currentUser?: { username: string; nombre: string; cargo: string } | null;
  initialModel?: PrintModelType;
}

export const DirectorioPrintModal: React.FC<DirectorioPrintModalProps> = ({
  isOpen,
  onClose,
  funcionarios,
  activeFilters,
  currentUser,
  initialModel = 'directorio'
}) => {
  const [selectedModel, setSelectedModel] = useState<PrintModelType>(initialModel);

  // Settings for Directorio General custom column selector
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DIRECTORIO_COLUMN_OPTIONS.forEach(c => {
      init[c.id] = c.defaultEnabled;
    });
    return init;
  });

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev => {
      const next = { ...prev, [id]: !prev[id] };
      const count = Object.values(next).filter(Boolean).length;
      return count > 0 ? next : prev; // Al menos 1 columna visible
    });
  };

  const handleSelectAllColumns = () => {
    const updated: Record<string, boolean> = {};
    DIRECTORIO_COLUMN_OPTIONS.forEach(c => {
      updated[c.id] = true;
    });
    setSelectedColumns(updated);
  };

  const handleResetDefaultColumns = () => {
    const updated: Record<string, boolean> = {};
    DIRECTORIO_COLUMN_OPTIONS.forEach(c => {
      updated[c.id] = c.defaultEnabled;
    });
    setSelectedColumns(updated);
  };

  const handleSelectContactPreset = () => {
    const updated: Record<string, boolean> = {};
    DIRECTORIO_COLUMN_OPTIONS.forEach(c => {
      updated[c.id] = ['cedula', 'nombres', 'cargo', 'sede', 'telefono', 'email'].includes(c.id);
    });
    setSelectedColumns(updated);
  };

  const handleSelectAuditPreset = () => {
    const updated: Record<string, boolean> = {};
    DIRECTORIO_COLUMN_OPTIONS.forEach(c => {
      updated[c.id] = ['cedula', 'nombres', 'cargo', 'unidad', 'antiguedad', 'completitud', 'firma'].includes(c.id);
    });
    setSelectedColumns(updated);
  };

  const activeColumnsCount = Object.values(selectedColumns).filter(Boolean).length;

  // Settings for Combos Alimenticios
  const [periodoCombos, setPeriodoCombos] = useState('Marzo 2026');
  const [puntoEntregaCombos, setPuntoEntregaCombos] = useState('Sede Regional Barinas - Depósito Central');
  const [tipoCombo, setTipoCombo] = useState('Combo Proteico Institucional (CLAP Especial)');
  const [defaultComboQty, setDefaultComboQty] = useState<number>(1);
  const [cantidadesCombos, setCantidadesCombos] = useState<Record<string, number>>({});

  // Handler for custom editable combo quantities
  const handleUpdateCantidad = (id: string, qty: number) => {
    setCantidadesCombos(prev => ({
      ...prev,
      [id]: Math.max(1, qty)
    }));
  };

  const handleSetDefaultComboQty = (qty: number) => {
    const val = Math.max(1, qty);
    setDefaultComboQty(val);
    const updated: Record<string, number> = {};
    funcionarios.forEach(f => {
      updated[f.id] = val;
    });
    setCantidadesCombos(updated);
  };

  // Total Combos calculation based on editable quantities
  const totalCombosAsignados = funcionarios.reduce((acc, f) => {
    const qty = cantidadesCombos[f.id] ?? defaultComboQty;
    return acc + qty;
  }, 0);

  // Settings for Asistencia a Actividades
  const [nombreActividad, setNombreActividad] = useState('Reunión Estratégica Operativa y Balance Institucional 2026');
  const [lugarActividad, setLugarActividad] = useState('Auditorio Principal - Sede Regional Barinas');
  const [fechaActividad, setFechaActividad] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (selectedModel === 'combos') {
      exportCombosAlimenticiosXLS(funcionarios, periodoCombos, puntoEntregaCombos, cantidadesCombos);
    } else if (selectedModel === 'asistencia') {
      exportAsistenciaActividadesXLS(funcionarios, nombreActividad, lugarActividad, fechaActividad);
    } else {
      exportDirectorioPersonalizadoXLS(funcionarios, selectedColumns);
    }
  };

  const fechaEmision = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const horaEmision = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print bg-slate-900 text-white border-b border-slate-800 shrink-0">
          
          {/* Top row */}
          <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-300 shrink-0">
                <img
                  src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                  alt="Logo INSOPESCA"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                  <span>Módulo de Impresión y Generación de Nóminas</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded">
                    {funcionarios.length} Registros Activos
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Seleccione el modelo oficial de nómina o padrón institucional para imprimir o guardar como PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg transition-colors shadow-xs cursor-pointer"
                title="Descargar datos en formato Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Exportar Excel (.xls)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] rounded-lg shadow-sm transition-colors border border-blue-400/40 cursor-pointer"
                title="Abrir cuadro de impresión del navegador"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Cerrar vista"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Model Switcher Tabs */}
          <div className="px-4 py-2.5 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
                Modelo:
              </span>

              {/* Tab 1: Directorio General */}
              <button
                type="button"
                onClick={() => setSelectedModel('directorio')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === 'directorio'
                    ? 'bg-[#0B4F9C] text-white shadow-md border border-blue-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Directorio General</span>
              </button>

              {/* Tab 2: Combos Alimenticios */}
              <button
                type="button"
                onClick={() => setSelectedModel('combos')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === 'combos'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                <span>Recepción de Combos Alimenticios</span>
              </button>

              {/* Tab 3: Asistencia a Actividades */}
              <button
                type="button"
                onClick={() => setSelectedModel('asistencia')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === 'asistencia'
                    ? 'bg-purple-600 text-white shadow-md border border-purple-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>Asistencia a Actividades</span>
              </button>
            </div>

            {/* Quick Helper Badge */}
            <div className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
              <span>Formato oficial adaptado para papel Carta / Oficio</span>
            </div>
          </div>

          {/* Model-specific Config Controls (Directorio, Combos or Asistencia) */}
          {selectedModel === 'directorio' && (
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        Filtro de Campos a Imprimir en Directorio:
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/60 text-blue-200 border border-blue-500/30">
                        {activeColumnsCount} de {DIRECTORIO_COLUMN_OPTIONS.length} campos activos
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Selecciona o desmarca los campos que deseas visualizar en la planilla impresa y exportación Excel
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] shrink-0">
                  <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Vistas rápidas:</span>
                  <button
                    type="button"
                    onClick={handleResetDefaultColumns}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    title="Campos oficiales por defecto (Cédula, Nombres, Cargo, Unidad, Sede, APN, Exp.)"
                  >
                    Predeterminado
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectContactPreset}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    title="Directorio de contacto con Teléfonos y Correos"
                  >
                    Contacto
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAuditPreset}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    title="Planilla para auditoría y firmas de control"
                  >
                    Auditoría / Firmas
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllColumns}
                    className="px-2.5 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-700/50 transition-colors cursor-pointer"
                    title="Activar todas las columnas disponibles"
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Column selector pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                {DIRECTORIO_COLUMN_OPTIONS.map(col => {
                  const isChecked = Boolean(selectedColumns[col.id]);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => toggleColumn(col.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#0B4F9C] text-white border-blue-400 shadow-xs'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700/70'
                      }`}
                      title={`Haz clic para ${isChecked ? 'ocultar' : 'mostrar'} la columna "${col.label}"`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-white text-[#0B4F9C] font-black' : 'border border-slate-600'
                      }`}>
                        {isChecked && '✓'}
                      </span>
                      <span>{col.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedModel === 'combos' && (
            <div className="px-4 py-2 bg-slate-900 flex flex-wrap items-center gap-4 text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Período:</span>
                <input
                  type="text"
                  value={periodoCombos}
                  onChange={(e) => setPeriodoCombos(e.target.value)}
                  placeholder="Ej: Marzo 2026"
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-emerald-500 w-32"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Punto de Entrega:</span>
                <input
                  type="text"
                  value={puntoEntregaCombos}
                  onChange={(e) => setPuntoEntregaCombos(e.target.value)}
                  placeholder="Ej: Sede Regional Barinas"
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-emerald-500 w-60"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Beneficio:</span>
                <input
                  type="text"
                  value={tipoCombo}
                  onChange={(e) => setTipoCombo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-emerald-500 w-52"
                />
              </div>

              {/* Editable default quantity for all */}
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded border border-emerald-500/40">
                <span className="text-emerald-400 font-semibold">Cant. General:</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={defaultComboQty}
                  onChange={(e) => handleSetDefaultComboQty(parseInt(e.target.value) || 1)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-bold text-xs w-14 text-center focus:outline-hidden focus:border-emerald-400"
                  title="Cambiar la cantidad para todos los funcionarios de la nómina"
                />
                <span className="text-[10px] text-slate-400">(Modifica todos)</span>
              </div>
            </div>
          )}

          {selectedModel === 'asistencia' && (
            <div className="px-4 py-2 bg-slate-900 flex flex-wrap items-center gap-4 text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Nombre de la Actividad:</span>
                <input
                  type="text"
                  value={nombreActividad}
                  onChange={(e) => setNombreActividad(e.target.value)}
                  placeholder="Nombre de la jornada o reunión"
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-purple-500 w-72"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Lugar / Salón:</span>
                <input
                  type="text"
                  value={lugarActividad}
                  onChange={(e) => setLugarActividad(e.target.value)}
                  placeholder="Lugar de la convocatoria"
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-purple-500 w-52"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Fecha:</span>
                <input
                  type="date"
                  value={fechaActividad}
                  onChange={(e) => setFechaActividad(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>
          )}

        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
          <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none print:text-black">
            
            {/* Venezuelan Tricolor Ribbon */}
            <div className="h-1.5 w-full grid grid-cols-12 mb-5">
              <div className="col-span-5 bg-[#FFD100]"></div>
              <div className="col-span-4 bg-[#0B4F9C]"></div>
              <div className="col-span-3 bg-[#D91424]"></div>
            </div>

            {/* Official Institutional Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg p-1 bg-white border border-slate-300 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                    alt="INSOPESCA Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                    República Bolivariana de Venezuela
                  </div>
                  <div className="text-[10px] font-bold text-slate-700">
                    Ministerio del Poder Popular de Pesca y Acuicultura
                  </div>
                  <div className="text-[10px] font-semibold text-[#0B4F9C]">
                    Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Dirección General de Recursos Humanos · Oficina de Gestión Humana · Gerencia Regional Barinas
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-600 font-mono">
                <div><span className="font-bold text-slate-800">Control SIGEF:</span> DGRRHH-{selectedModel.toUpperCase()}-{new Date().getFullYear()}</div>
                <div><span className="font-bold text-slate-800">Fecha Emisión:</span> {fechaEmision}</div>
                <div><span className="font-bold text-slate-800">Hora:</span> {horaEmision}</div>
                <div><span className="font-bold text-slate-800">Operador:</span> {currentUser?.nombre || 'Lcda. Maria Peña'}</div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* MODELO 1: DIRECTORIO GENERAL DE PERSONAL                */}
            {/* (COLUMNA CONDICION ELIMINADA SEGÚN SOLICITUD)          */}
            {/* ======================================================== */}
            {selectedModel === 'directorio' && (
              <>
                {/* Title Banner */}
                <div className="my-5 text-center bg-slate-50 border border-slate-200 py-3 px-4 rounded-lg">
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    Reporte Oficial del Directorio General de Personal
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Padrón consolidado de funcionarios activos, contratados y directivos del MPPPA - INSOPESCA
                  </p>
                </div>

                {/* Applied Filters Context */}
                <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Sede / Región:</span>
                    <span className="font-semibold text-slate-800">{activeFilters.sede}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Estatus Expediente:</span>
                    <span className="font-semibold text-slate-800">{activeFilters.estatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Registrados:</span>
                    <span className="font-bold text-[#0B4F9C] font-mono">{funcionarios.length} funcionarios</span>
                  </div>
                </div>

                {/* Directorio Data Table with Customizable Columns */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B4F9C] text-white text-[11px] font-bold">
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-8">N°</th>
                        {selectedColumns.cedula && (
                          <th className="py-2 px-3 border-r border-blue-900/50 w-24">Cédula</th>
                        )}
                        {selectedColumns.nombres && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Nombres y Apellidos</th>
                        )}
                        {selectedColumns.cargo && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Cargo Nominal / Funcional</th>
                        )}
                        {selectedColumns.unidad && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Unidad Administrativa</th>
                        )}
                        {selectedColumns.sede && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Sede / Región</th>
                        )}
                        {selectedColumns.telefono && (
                          <th className="py-2 px-3 border-r border-blue-900/50 w-28">Teléfono</th>
                        )}
                        {selectedColumns.email && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Correo</th>
                        )}
                        {selectedColumns.fechaIngreso && (
                          <th className="py-2 px-2.5 text-center border-r border-blue-900/50 w-24">Fecha Ingreso</th>
                        )}
                        {selectedColumns.antiguedad && (
                          <th className="py-2 px-2.5 text-center border-r border-blue-900/50 w-20">APN Total</th>
                        )}
                        {selectedColumns.completitud && (
                          <th className="py-2 px-2.5 text-center border-r border-blue-900/50 w-16">Exp.</th>
                        )}
                        {selectedColumns.instruccion && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Nivel / Profesión</th>
                        )}
                        {selectedColumns.banco && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Banco / Cuenta</th>
                        )}
                        {selectedColumns.carnet && (
                          <th className="py-2 px-2.5 text-center border-r border-blue-900/50 w-24">Carnet ID</th>
                        )}
                        {selectedColumns.tallas && (
                          <th className="py-2 px-2 text-center border-r border-blue-900/50 w-24">Tallas</th>
                        )}
                        {selectedColumns.cargaFamiliar && (
                          <th className="py-2 px-3 border-r border-blue-900/50">Carga Familiar</th>
                        )}
                        {selectedColumns.firma && (
                          <th className="py-2 px-3 text-center w-28">Firma / Control</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {funcionarios.map((f, index) => {
                        const antiguedad = calcularAntiguedad(
                          f.situacionLaboral.fechaIngresoMinisterio,
                          f.situacionLaboral.anosServicioPrevioAPN
                        );
                        const completitud = calcularCompletitudExpediente(f);

                        return (
                          <tr 
                            key={f.id} 
                            className={`text-[11px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                          >
                            <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                              {index + 1}
                            </td>
                            {selectedColumns.cedula && (
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap border-r border-slate-200">
                                {f.identificacion.tipoCedula}-{f.identificacion.cedula}
                              </td>
                            )}
                            {selectedColumns.nombres && (
                              <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                                {f.identificacion.nombres} {f.identificacion.apellidos}
                              </td>
                            )}
                            {selectedColumns.cargo && (
                              <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                                <div className="font-medium text-slate-900">{f.situacionLaboral.cargoNominal}</div>
                                {f.situacionLaboral.cargoFuncional && f.situacionLaboral.cargoFuncional !== f.situacionLaboral.cargoNominal && (
                                  <div className="text-[10px] text-slate-500 italic">Func: {f.situacionLaboral.cargoFuncional}</div>
                                )}
                              </td>
                            )}
                            {selectedColumns.unidad && (
                              <td className="py-2 px-3 text-slate-600 text-[10px] border-r border-slate-200">
                                {f.situacionLaboral.unidadAdministrativa}
                              </td>
                            )}
                            {selectedColumns.sede && (
                              <td className="py-2 px-3 text-slate-700 border-r border-slate-200 whitespace-nowrap text-[10px]">
                                {f.situacionLaboral.sedeRegion}
                              </td>
                            )}
                            {selectedColumns.telefono && (
                              <td className="py-2 px-3 text-slate-700 font-mono text-[10px] border-r border-slate-200 whitespace-nowrap">
                                {f.contacto.telefonoMovil || 'N/A'}
                              </td>
                            )}
                            {selectedColumns.email && (
                              <td className="py-2 px-3 text-slate-600 text-[10px] border-r border-slate-200 truncate max-w-36">
                                {f.contacto.emailInstitucional || f.contacto.emailPersonal || 'N/A'}
                              </td>
                            )}
                            {selectedColumns.fechaIngreso && (
                              <td className="py-2 px-2.5 text-center font-mono text-[10px] text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                {f.situacionLaboral.fechaIngresoMinisterio || 'N/A'}
                              </td>
                            )}
                            {selectedColumns.antiguedad && (
                              <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                                {antiguedad.anosTotalesAPN}a
                              </td>
                            )}
                            {selectedColumns.completitud && (
                              <td className="py-2 px-2.5 text-center border-r border-slate-200">
                                <span className={`font-mono text-[10px] font-bold ${
                                  completitud.completo ? 'text-emerald-700' : 'text-amber-700'
                                }`}>
                                  {completitud.porcentaje}%
                                </span>
                              </td>
                            )}
                            {selectedColumns.instruccion && (
                              <td className="py-2 px-3 text-slate-700 text-[10px] border-r border-slate-200">
                                <span className="font-semibold block">{f.perfilAcademico.nivelInstruccion}</span>
                                <span className="text-slate-500 text-[9px]">{f.perfilAcademico.profesionOficio || f.perfilAcademico.tituloObtenido || '-'}</span>
                              </td>
                            )}
                            {selectedColumns.banco && (
                              <td className="py-2 px-3 text-slate-700 text-[10px] border-r border-slate-200">
                                <div className="font-medium">{f.situacionLaboral.banco || 'N/A'}</div>
                                <div className="font-mono text-[9px] text-slate-500">
                                  {f.situacionLaboral.cuentaNomina ? `••••${f.situacionLaboral.cuentaNomina.slice(-4)}` : 'S/C'}
                                </div>
                              </td>
                            )}
                            {selectedColumns.carnet && (
                              <td className="py-2 px-2 text-center text-[10px] border-r border-slate-200 whitespace-nowrap">
                                <span className={`font-semibold ${
                                  f.situacionLaboral.poseeCarnet ? 'text-emerald-700 font-bold' : 'text-slate-400'
                                }`}>
                                  {f.situacionLaboral.poseeCarnet ? (f.situacionLaboral.codigoCarnet || '✓ Sí') : '✕ No'}
                                </span>
                              </td>
                            )}
                            {selectedColumns.tallas && (
                              <td className="py-2 px-2 text-center text-[10px] text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                <span className="font-mono font-semibold">C:{f.identificacion.tallaCamisa || '-'}</span>{' '}
                                <span className="font-mono font-semibold">P:{f.identificacion.tallaPantalon || '-'}</span>{' '}
                                <span className="font-mono font-semibold">Z:{f.identificacion.tallaCalzado || '-'}</span>
                              </td>
                            )}
                            {selectedColumns.cargaFamiliar && (
                              <td className="py-2 px-3 text-slate-700 text-[10px] border-r border-slate-200">
                                {f.cargaFamiliar?.familiares && f.cargaFamiliar.familiares.length > 0 ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-[#0B4F9C] text-[10px]">
                                      {f.cargaFamiliar.familiares.length} {f.cargaFamiliar.familiares.length === 1 ? 'familiar' : 'familiares'}
                                    </div>
                                    {f.cargaFamiliar.familiares.map(fam => (
                                      <div key={fam.id} className="text-[9.5px] leading-tight text-slate-700">
                                        • <span className="font-semibold text-slate-900">{fam.nombres} {fam.apellidos}</span> ({fam.parentesco})
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Sin carga registrada</span>
                                )}
                              </td>
                            )}
                            {selectedColumns.firma && (
                              <td className="py-2 px-3 text-center">
                                <div className="h-7 border-b border-dashed border-slate-400 mx-auto w-24"></div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* MODELO 2: RECEPCIÓN DE COMBOS ALIMENTICIOS              */}
            {/* (CAMPO CANTIDAD EDITABLE POR FILA Y EN LOTE)             */}
            {/* ======================================================== */}
            {selectedModel === 'combos' && (
              <>
                {/* Title Banner */}
                <div className="my-5 text-center bg-emerald-50/70 border border-emerald-200 py-3 px-4 rounded-lg">
                  <h1 className="text-base font-black text-emerald-950 uppercase tracking-wide">
                    Planilla Oficial de Control y Entrega de Beneficio Alimentario
                  </h1>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    Programa de Protección Social y Seguridad Alimentaria · Nómina de Recepción de Combos
                  </p>
                </div>

                {/* Combos Meta Information Grid */}
                <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Período de Asignación:</span>
                    <span className="font-bold text-slate-900">{periodoCombos}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Punto de Distribución:</span>
                    <span className="font-semibold text-slate-900">{puntoEntregaCombos}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Tipo de Beneficio:</span>
                    <span className="font-semibold text-slate-900">{tipoCombo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Asignaciones:</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {totalCombosAsignados} Combos ({funcionarios.length} Beneficiarios)
                    </span>
                  </div>
                </div>

                {/* Combos Printable Table with EDITABLE Quantity */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B4F9C] text-white text-[11px] font-bold">
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-8">N°</th>
                        <th className="py-2 px-3 border-r border-blue-900/50 w-24">Cédula</th>
                        <th className="py-2 px-3 border-r border-blue-900/50">Nombres y Apellidos</th>
                        <th className="py-2 px-3 border-r border-blue-900/50">Cargo / Dependencia</th>
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-20">
                          <span>Cant.</span>
                          <span className="block text-[9px] font-normal text-sky-200 print:hidden">(Editable)</span>
                        </th>
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-14">Recibió</th>
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-24">Fecha</th>
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-24">Huella Dactilar</th>
                        <th className="py-2 px-3 text-center w-36">Firma del Trabajador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {funcionarios.map((f, index) => {
                        const qty = cantidadesCombos[f.id] ?? defaultComboQty;
                        return (
                          <tr 
                            key={f.id} 
                            className={`text-[11px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} h-16`}
                          >
                            <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                              {index + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap border-r border-slate-200">
                              {f.identificacion.tipoCedula}-{f.identificacion.cedula}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                              <div>{f.identificacion.nombres} {f.identificacion.apellidos}</div>
                              <span className="text-[10px] text-slate-500 font-normal">{f.contacto.telefonoMovil}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                              <div className="font-medium text-slate-900">{f.situacionLaboral.cargoFuncional || f.situacionLaboral.cargoNominal}</div>
                              <div className="text-[10px] text-slate-500">{f.situacionLaboral.sedeRegion}</div>
                            </td>
                            {/* Editable Quantity Column */}
                            <td className="py-2 px-2 text-center border-r border-slate-200">
                              <div className="print:hidden flex items-center justify-center">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={qty}
                                  onChange={(e) => handleUpdateCantidad(f.id, parseInt(e.target.value) || 1)}
                                  className="w-14 text-center font-bold text-xs py-1 px-1 bg-white border border-emerald-400 text-emerald-950 rounded shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                  title="Haga clic para editar la cantidad de combos de este trabajador"
                                />
                              </div>
                              <div className="hidden print:block font-bold text-xs text-slate-900 font-mono">
                                {qty}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center border-r border-slate-200">
                              <div className="w-5 h-5 mx-auto border border-slate-400 rounded-sm"></div>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 whitespace-nowrap">
                              ___/___/2026
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200">
                              <div className="w-16 h-12 mx-auto border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-[9px] text-slate-400">
                                <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                                <span>Pulgar Der.</span>
                              </div>
                            </td>
                            <td className="py-1 px-2 text-center">
                              <div className="w-full h-12 border-b border-slate-400 flex items-end justify-center pb-0.5">
                                <span className="text-[9px] text-slate-300">Rúbrica</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Combos Delivery Summary Box */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Compromiso Institucional:</span>
                    <span className="text-slate-600 ml-1">
                      El trabajador certifica haber recibido a entera satisfacción la cantidad de combos alimenticios indicada.
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono font-bold text-slate-800">
                    <span>Total Combos a Entregar: {totalCombosAsignados} unidades</span>
                    <span>Beneficiarios: [ ___ / {funcionarios.length} ]</span>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* MODELO 3: ASISTENCIA A ACTIVIDADES                      */}
            {/* (ELIMINADAS HORA DE ENTRADA Y HORA DE SALIDA)            */}
            {/* ======================================================== */}
            {selectedModel === 'asistencia' && (
              <>
                {/* Title Banner */}
                <div className="my-5 text-center bg-purple-50/70 border border-purple-200 py-3 px-4 rounded-lg">
                  <h1 className="text-base font-black text-purple-950 uppercase tracking-wide">
                    Planilla Oficial de Control de Asistencia a Actividades Institucionales
                  </h1>
                  <p className="text-xs text-purple-800 font-semibold mt-0.5">
                    Registro de Participación en Asambleas, Mesas de Trabajo y Jornadas Operativas Extraordinarias
                  </p>
                </div>

                {/* Activity Meta Information Grid */}
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Actividad / Convocatoria:</span>
                    <span className="font-bold text-slate-900">{nombreActividad}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Lugar de Realización:</span>
                    <span className="font-semibold text-slate-900">{lugarActividad}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Fecha / Convocados:</span>
                    <span className="font-semibold text-slate-900">{fechaActividad} ({funcionarios.length} funcionarios)</span>
                  </div>
                </div>

                {/* Attendance Printable Table WITHOUT Hora Entrada & Hora Salida */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B4F9C] text-white text-[11px] font-bold">
                        <th className="py-2 px-2 text-center border-r border-blue-900/50 w-8">N°</th>
                        <th className="py-2 px-3 border-r border-blue-900/50 w-24">Cédula</th>
                        <th className="py-2 px-3 border-r border-blue-900/50">Nombres y Apellidos</th>
                        <th className="py-2 px-3 border-r border-blue-900/50">Dependencia / Unidad Administrativa</th>
                        <th className="py-2 px-3 border-r border-blue-900/50">Cargo Funcional</th>
                        <th className="py-2 px-3 text-center border-r border-blue-900/50 w-44">Firma / Rúbrica del Asistente</th>
                        <th className="py-2 px-3 text-center w-36">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {funcionarios.map((f, index) => (
                        <tr 
                          key={f.id} 
                          className={`text-[11px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} h-16`}
                        >
                          <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap border-r border-slate-200">
                            {f.identificacion.tipoCedula}-{f.identificacion.cedula}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            {f.identificacion.nombres} {f.identificacion.apellidos}
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-[10px] border-r border-slate-200">
                            {f.situacionLaboral.unidadAdministrativa}
                          </td>
                          <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
                            {f.situacionLaboral.cargoFuncional || f.situacionLaboral.cargoNominal}
                          </td>
                          <td className="py-1 px-3 text-center border-r border-slate-200">
                            <div className="w-full h-11 border-b border-slate-400 flex items-end justify-center pb-0.5">
                              <span className="text-[9px] text-slate-300">Rúbrica de Asistencia</span>
                            </div>
                          </td>
                          <td className="py-1 px-3 text-center text-slate-400 text-[10px]">
                            <div className="w-full h-11 border-b border-dashed border-slate-200 flex items-center justify-center">
                              <span className="text-[9px] text-slate-400">[ Conforme ]</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Attendance Summary */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Estatus de la Convocatoria:</span>
                    <span className="text-slate-600 ml-1">
                      Constancia expedida para el expediente administrativo y justificación de actividades extraordinarias.
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono font-bold text-slate-800">
                    <span>Total Asistentes: [ ___ / {funcionarios.length} ]</span>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* OFFICIAL SIGNATURES BLOCK (COMMON TO ALL MODELS)         */}
            {/* ======================================================== */}
            <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-10 text-center text-xs">
              <div>
                <div className="h-14 flex items-end justify-center">
                  <div className="w-52 border-b-2 border-slate-800"></div>
                </div>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  {currentUser?.nombre || 'Lcda. Maria Peña'}
                </div>
                <div className="text-[11px] text-[#0B4F9C] font-bold">
                  {currentUser?.cargo || 'Enlaces RRHH'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Dirección General de Recursos Humanos · INSOPESCA
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Elaboración y Verificación de Listado
                </div>
              </div>

              <div>
                <div className="h-14 flex items-end justify-center">
                  <div className="w-52 border-b-2 border-slate-800"></div>
                </div>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  Lcda. Mirla Escalona
                </div>
                <div className="text-[11px] text-[#0B4F9C] font-bold">
                  Gerente Regional Barinas
                </div>
                <div className="text-[10px] text-slate-500">
                  Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Visto Bueno y Autorización Institucional
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* CINTILLO / CREDIT WATERMARK BY S&S WEB STUDIO            */}
            {/* ======================================================== */}
            <div className="mt-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
              <div className="text-center sm:text-left">
                Documento oficial generado electrónicamente por SIGEF-RRHH · MPPPA / INSOPESCA.
                Válido para auditorías y trámites ante la Administración Pública Nacional (APN).
              </div>

              <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-1 rounded-md shrink-0">
                <img
                  src="/assets/aistudio/1791899989619_db0f9485.jpg"
                  alt="S&S Web Studio"
                  className="h-4 w-auto object-contain"
                />
                <span className="font-semibold text-slate-700">
                  Sistema Diseñado y Elaborado por S&S Web Studio - 0424-5104245
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

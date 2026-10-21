import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  X,
  ShoppingBag,
  ClipboardCheck,
  ChevronDown
} from 'lucide-react';
import { 
  Funcionario, 
  calcularCompletitudExpediente, 
  evaluarEstatusJubilacion, 
  calcularAntiguedad,
  CondicionLaboral 
} from '../types/rrhh';
import { exportToExcelXLS, exportToCSVStructured } from '../utils/excelExport';
import { DirectorioPrintModal, PrintModelType } from './DirectorioPrintModal';

interface DirectorioProps {
  funcionarios: Funcionario[];
  initialFilter?: string;
  onViewFicha: (f: Funcionario) => void;
  onEditFuncionario: (f: Funcionario) => void;
  onPrintFicha: (f: Funcionario) => void;
  onDeleteFuncionario: (id: string) => void;
  currentUser?: { username: string; nombre: string; cargo: string } | null;
}

export const Directorio: React.FC<DirectorioProps> = ({
  funcionarios,
  initialFilter,
  onViewFicha,
  onEditFuncionario,
  onPrintFicha,
  onDeleteFuncionario,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [condicionFilter, setCondicionFilter] = useState<string>('TODOS');
  const [sedeFilter, setSedeFilter] = useState<string>('TODAS');
  const [estatusFilter, setEstatusFilter] = useState<string>(
    initialFilter === 'jubilacion' ? 'JUBILACION' : 'TODOS'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModel, setPrintModel] = useState<PrintModelType>('directorio');
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);

  const handleOpenPrint = (model: PrintModelType = 'directorio') => {
    setPrintModel(model);
    setIsPrintModalOpen(true);
    setIsPrintDropdownOpen(false);
  };

  // Extract unique sedes
  const sedesList = useMemo(() => {
    const set = new Set<string>();
    funcionarios.forEach(f => {
      if (f.situacionLaboral.sedeRegion) set.add(f.situacionLaboral.sedeRegion);
    });
    return Array.from(set).sort();
  }, [funcionarios]);

  // Filtered dataset
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(f => {
      // 1. Search text
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const cedulaClean = f.identificacion.cedula.replace(/\D/g, '');
        const termClean = term.replace(/\D/g, '');
        const matchCedula = termClean && cedulaClean.includes(termClean);
        const matchNombre = `${f.identificacion.nombres} ${f.identificacion.apellidos}`.toLowerCase().includes(term);
        const matchCargo = f.situacionLaboral.cargoNominal.toLowerCase().includes(term);
        const matchNomina = f.situacionLaboral.codigoNomina.toLowerCase().includes(term);
        if (!matchCedula && !matchNombre && !matchCargo && !matchNomina) return false;
      }

      // 2. Condicion filter
      if (condicionFilter !== 'TODOS' && f.situacionLaboral.condicion !== condicionFilter) {
        return false;
      }

      // 3. Sede filter
      if (sedeFilter !== 'TODAS' && f.situacionLaboral.sedeRegion !== sedeFilter) {
        return false;
      }

      // 4. Estatus filter
      if (estatusFilter === 'COMPLETO') {
        const { completo } = calcularCompletitudExpediente(f);
        if (!completo) return false;
      } else if (estatusFilter === 'INCOMPLETO') {
        const { completo } = calcularCompletitudExpediente(f);
        if (completo) return false;
      } else if (estatusFilter === 'JUBILACION') {
        const jubilacion = evaluarEstatusJubilacion(
          f.identificacion.fechaNacimiento,
          f.identificacion.genero,
          f.situacionLaboral.fechaIngresoMinisterio,
          f.situacionLaboral.anosServicioPrevioAPN
        );
        if (!jubilacion.califica && !jubilacion.proximo) return false;
      }

      return true;
    });
  }, [funcionarios, searchTerm, condicionFilter, sedeFilter, estatusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredFuncionarios.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFuncionarios.slice(start, start + pageSize);
  }, [filteredFuncionarios, currentPage, pageSize]);

  // Export handlers
  const handleExportExcel = () => {
    exportToExcelXLS(filteredFuncionarios);
  };

  const handleExportCSV = () => {
    exportToCSVStructured(filteredFuncionarios);
  };

  const getCondicionBadge = (condicion: CondicionLaboral) => {
    switch (condicion) {
      case 'FIJO':
        return <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fijo</span>;
      case 'CONTRATADO':
        return <span className="text-[11px] font-medium text-[#0B4F9C] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Contratado</span>;
      case 'ALTO_NIVEL':
        return <span className="text-[11px] font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Alto Nivel</span>;
      case 'COMISION_SERVICIO':
        return <span className="text-[11px] font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Comisión</span>;
      case 'JUBILADO':
      case 'PENSIONADO':
        return <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{condicion}</span>;
      default:
        return <span className="text-[11px] text-slate-700">{condicion}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        {/* Tricolor Ribbon on top border */}
        <div className="absolute top-0 inset-x-0 h-1 grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shrink-0">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="Logo INSOPESCA"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Directorio General</span>
              <span className="text-xs font-mono-numbers px-2 py-0.5 rounded-full bg-slate-100 text-[#0B4F9C] font-bold border border-slate-200">
                {filteredFuncionarios.length} de {funcionarios.length}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Padrón oficial del talento humano, expedientes digitales y auditoría APN de INSOPESCA.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          
          {/* Action button: Split Dropdown for Print / PDF Models */}
          <div className="relative inline-flex rounded-lg shadow-xs">
            <button
              type="button"
              onClick={() => handleOpenPrint('directorio')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] rounded-l-lg border-y border-l border-blue-400/40 transition-colors cursor-pointer min-h-[36px]"
              title="Imprimir / Guardar PDF del Directorio General"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span><span className="hidden sm:inline">Imprimir / Guardar </span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintDropdownOpen(prev => !prev)}
              className="px-2 py-1.5 text-white bg-[#0B4F9C] hover:bg-[#083E7D] border border-blue-400/40 rounded-r-lg border-l-blue-900/40 transition-colors cursor-pointer min-h-[36px]"
              title="Seleccionar modelo de nómina para imprimir"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {isPrintDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setIsPrintDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Modelos de Impresión de Nómina
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPrint('directorio')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-blue-50 text-[#0B4F9C] flex items-center justify-center shrink-0">
                    <Printer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Directorio General</div>
                    <div className="text-[10px] text-slate-500">Padrón con campos seleccionables para impresión</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrint('combos')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50/70 flex items-center gap-2.5 transition-colors border-t border-slate-100"
                >
                  <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950">Recepción de Combos</div>
                    <div className="text-[10px] text-slate-500">Nómina con huella dactilar y entrega</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrint('asistencia')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-purple-50/70 flex items-center gap-2.5 transition-colors border-t border-slate-100"
                >
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-950">Asistencia a Actividades</div>
                    <div className="text-[10px] text-slate-500">Horas de entrada, salida y firmas</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Action button: Exportar Excel (.xls) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-xs cursor-pointer min-h-[36px]"
            title="Exportar en Excel (.xls) con todas las columnas y filas ordenadas"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span><span className="hidden sm:inline">Exportar </span>Excel (.xls)</span>
          </button>

          {/* Action button: Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors shadow-xs cursor-pointer min-h-[36px]"
            title="Exportar formato CSV compatible"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por cédula, nombre o nómina..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Condicion laboral filter */}
          <div>
            <select
              value={condicionFilter}
              onChange={(e) => {
                setCondicionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODOS">Todas las Condiciones Laborales</option>
              <option value="FIJO">Fijo (Personal de Carrera)</option>
              <option value="CONTRATADO">Contratado</option>
              <option value="ALTO_NIVEL">Alto Nivel / Dirección</option>
              <option value="COMISION_SERVICIO">Comisión de Servicio</option>
              <option value="JUBILADO">Jubilado</option>
              <option value="PENSIONADO">Pensionado</option>
            </select>
          </div>

          {/* Sede regional filter */}
          <div>
            <select
              value={sedeFilter}
              onChange={(e) => {
                setSedeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODAS">Todas las Sedes / Regiones</option>
              {sedesList.map(sede => (
                <option key={sede} value={sede}>{sede}</option>
              ))}
            </select>
          </div>

          {/* Estatus del expediente */}
          <div>
            <select
              value={estatusFilter}
              onChange={(e) => {
                setEstatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODOS">Todos los Estados de Expediente</option>
              <option value="COMPLETO">Expediente al 100% (Auditado)</option>
              <option value="INCOMPLETO">Expediente Incompleto (Pendiente)</option>
              <option value="JUBILACION">Próximo a Jubilación / Califica</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Funcionario / Cédula</th>
                <th className="py-3 px-4">Cargo Nominal y Funcional</th>
                <th className="py-3 px-4">Adscripción / Sede</th>
                <th className="py-3 px-4 text-center">Antigüedad APN</th>
                <th className="py-3 px-4 text-center">Expediente</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((f) => {
                  const { porcentaje, completo } = calcularCompletitudExpediente(f);
                  const { anosTotalesAPN } = calcularAntiguedad(
                    f.situacionLaboral.fechaIngresoMinisterio,
                    f.situacionLaboral.anosServicioPrevioAPN
                  );
                  const jubilacion = evaluarEstatusJubilacion(
                    f.identificacion.fechaNacimiento,
                    f.identificacion.genero,
                    f.situacionLaboral.fechaIngresoMinisterio,
                    f.situacionLaboral.anosServicioPrevioAPN
                  );

                  return (
                    <tr 
                      key={f.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onViewFicha(f)}
                    >
                      {/* Funcionario / Foto / Cedula */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {f.identificacion.fotoUrl ? (
                              <img 
                                src={f.identificacion.fotoUrl} 
                                alt={f.identificacion.nombres} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                {f.identificacion.nombres.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 truncate">
                              {f.identificacion.nombres} {f.identificacion.apellidos}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-numbers">
                              {f.identificacion.tipoCedula}-{f.identificacion.cedula} · RIF: {f.identificacion.tipoRif}-{f.identificacion.rif}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={f.situacionLaboral.cargoNominal}>
                          {f.situacionLaboral.cargoNominal}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={f.situacionLaboral.cargoFuncional}>
                          {f.situacionLaboral.cargoFuncional}
                        </div>
                      </td>

                      {/* Adscripción y Sede */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 truncate" title={f.situacionLaboral.unidadAdministrativa}>
                          {f.situacionLaboral.unidadAdministrativa}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                          <span>{f.situacionLaboral.sedeRegion}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({f.situacionLaboral.codigoNomina})</span>
                        </div>
                      </td>

                      {/* Antigüedad APN */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-mono-numbers font-semibold text-slate-800">
                          {anosTotalesAPN} años
                        </span>
                        {jubilacion.proximo && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            Próximo a Jubilar
                          </div>
                        )}
                        {jubilacion.califica && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Califica Jubilación
                          </div>
                        )}
                      </td>

                      {/* Completitud */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${completo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-mono-numbers font-bold text-slate-700">
                            {porcentaje}%
                          </span>
                        </div>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${completo ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewFicha(f)}
                            className="p-1.5 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Ver Expediente Integral 360°"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => onEditFuncionario(f)}
                            className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Editar Datos del Funcionario"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onPrintFicha(f)}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Imprimir Hoja de Servicio Oficial"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === f.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200">
                              <span className="text-[10px] text-red-700 font-semibold">¿Eliminar?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteFuncionario(f.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-200 rounded hover:bg-slate-300"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(f.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Dar de baja / Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-semibold text-slate-700 mb-1">No se encontraron resultados</div>
                      <p className="text-xs text-slate-500 mb-3">
                        Intente ajustar los términos de búsqueda o restablecer los filtros seleccionados.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCondicionFilter('TODOS');
                          setSedeFilter('TODAS');
                          setEstatusFilter('TODOS');
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                      >
                        Restablecer Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (< sm screens) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {paginatedData.length > 0 ? (
            paginatedData.map((f) => {
              const { porcentaje, completo } = calcularCompletitudExpediente(f);
              const { anosTotalesAPN } = calcularAntiguedad(
                f.situacionLaboral.fechaIngresoMinisterio,
                f.situacionLaboral.anosServicioPrevioAPN
              );
              const jubilacion = evaluarEstatusJubilacion(
                f.identificacion.fechaNacimiento,
                f.identificacion.genero,
                f.situacionLaboral.fechaIngresoMinisterio,
                f.situacionLaboral.anosServicioPrevioAPN
              );

              return (
                <div 
                  key={f.id}
                  className="p-3.5 bg-white hover:bg-slate-50 transition-colors space-y-2.5"
                >
                  {/* Row 1: Avatar, Name, Cedula, Condition */}
                  <div 
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => onViewFicha(f)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
                        {f.identificacion.fotoUrl ? (
                          <img 
                            src={f.identificacion.fotoUrl} 
                            alt={f.identificacion.nombres} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                            {f.identificacion.nombres.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {f.identificacion.nombres} {f.identificacion.apellidos}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {f.identificacion.tipoCedula}-{f.identificacion.cedula}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {f.situacionLaboral.condicion}
                    </span>
                  </div>

                  {/* Row 2: Cargo & Sede */}
                  <div 
                    className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-1 cursor-pointer"
                    onClick={() => onViewFicha(f)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">{f.situacionLaboral.cargoNominal || 'Sin cargo asignado'}</span>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">{anosTotalesAPN}a APN</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {f.situacionLaboral.unidadAdministrativa} · {f.situacionLaboral.sedeRegion}
                    </div>
                    {jubilacion.proximo && (
                      <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                        Próximo a Jubilar
                      </div>
                    )}
                    {jubilacion.califica && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                        Califica Jubilación
                      </div>
                    )}
                  </div>

                  {/* Row 3: Expediente progress & Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${completo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[11px] font-bold text-slate-700">Expediente {porcentaje}%</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewFicha(f)}
                        className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                        title="Ver Ficha Integral 360°"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditFuncionario(f)}
                        className="p-2 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                        title="Editar Expediente"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintFicha(f)}
                        className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                        title="Imprimir Hoja de Servicio"
                      >
                        <Printer className="w-4 h-4 text-slate-700" />
                      </button>

                      {deleteConfirmId === f.id ? (
                        <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteFuncionario(f.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 rounded-md"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-200 rounded-md"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(f.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="font-semibold text-slate-700 text-sm mb-1">No se encontraron resultados</div>
              <p className="text-xs text-slate-500">Ajuste los filtros o términos de búsqueda.</p>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
            </select>
            <span>de <strong className="font-mono-numbers text-slate-800">{filteredFuncionarios.length}</strong> funcionarios</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Página <strong className="font-mono-numbers text-slate-800">{currentPage}</strong> de <strong className="font-mono-numbers text-slate-800">{totalPages}</strong></span>
            <div className="inline-flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Official Printable Report & PDF Modal */}
      <DirectorioPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        funcionarios={filteredFuncionarios}
        activeFilters={{
          condicion: condicionFilter,
          sede: sedeFilter,
          estatus: estatusFilter,
          searchTerm: searchTerm
        }}
        currentUser={currentUser}
        initialModel={printModel}
      />

    </div>
  );
};

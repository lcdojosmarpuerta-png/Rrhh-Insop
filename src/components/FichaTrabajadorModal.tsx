import React from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  Building2, 
  FileText,
  User,
  HeartPulse,
  Users,
  GraduationCap,
  MapPin
} from 'lucide-react';
import { 
  Funcionario, 
  calcularAntiguedad, 
  calcularCompletitudExpediente, 
  evaluarEstatusJubilacion,
  calcularEdad 
} from '../types/rrhh';

interface FichaTrabajadorModalProps {
  funcionario: Funcionario | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (f: Funcionario) => void;
}

export const FichaTrabajadorModal: React.FC<FichaTrabajadorModalProps> = ({
  funcionario,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !funcionario) return null;

  const antiguedad = calcularAntiguedad(
    funcionario.situacionLaboral.fechaIngresoMinisterio,
    funcionario.situacionLaboral.anosServicioPrevioAPN
  );
  const completitud = calcularCompletitudExpediente(funcionario);
  const jubilacion = evaluarEstatusJubilacion(
    funcionario.identificacion.fechaNacimiento,
    funcionario.identificacion.genero,
    funcionario.situacionLaboral.fechaIngresoMinisterio,
    funcionario.situacionLaboral.anosServicioPrevioAPN
  );
  const edad = calcularEdad(funcionario.identificacion.fechaNacimiento);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Toolbar (Screen only) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                alt="Logo INSOPESCA"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-300 truncate">
                INSOPESCA · Expediente
              </div>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                {funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onEdit(funcionario)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              <span>Editar</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#FFD100] hover:bg-[#E5BC00] rounded-lg flex items-center gap-1.5 shadow-sm transition-colors min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span><span className="hidden sm:inline">Imprimir </span>Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content (Formatted for Screen & Printable @media print) */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-800 text-xs">
          
          {/* Official Letterhead with INSOPESCA Logo, Escudo and QR */}
          <div className="border-b-2 border-slate-900 pb-4">
            
            {/* Tricolor line atop sheet */}
            <div className="h-1.5 w-full grid grid-cols-12 mb-3 rounded-full overflow-hidden">
              <div className="col-span-5 bg-[#FFD100]"></div>
              <div className="col-span-4 bg-[#0B4F9C]"></div>
              <div className="col-span-3 bg-[#D91424]"></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              
              {/* INSOPESCA Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 p-1 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                  alt="INSOPESCA Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Central Official Typography */}
              <div className="flex-1 text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  República Bolivariana de Venezuela
                </div>
                <div className="text-xs font-bold text-slate-800 uppercase">
                  Ministerio del Poder Popular para la Pesca y Acuicultura
                </div>
                <div className="text-sm font-black text-[#0B4F9C] uppercase tracking-tight">
                  Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  Dirección General de Recursos Humanos · Sistema Integrado SIGEF-RRHH
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  HOJA DE SERVICIO Y EXPEDIENTE DEL SERVIDOR PÚBLICO
                </div>
              </div>

              {/* QR Code and Document Reference */}
              <div className="text-right shrink-0">
                <div className="w-16 h-16 bg-slate-50 border border-slate-300 p-1 rounded mx-auto mb-1 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800">
                    <path fill="currentColor" d="M2 2h8v8H2zm2 2v4h4V4zm-2 8h8v8H2zm2 2v4h4v-4zm10-12h8v8h-8zm2 2v4h4V4zm2 12h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm0-4h2v2h-2zm-4-2h2v2h-2zm6 2h2v2h-2zm0-6h2v2h-2zm-6 2h2v2h-2z" />
                  </svg>
                </div>
                <div className="text-[9px] font-mono-numbers text-slate-500">
                  REG: {funcionario.id}
                </div>
                <div className="text-[9px] font-mono-numbers text-slate-400">
                  Emisión: {new Date().toLocaleDateString('es-VE')}
                </div>
              </div>

            </div>
          </div>

          {/* Section 1: Identification & Photo */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              
              {/* Photo Box */}
              <div className="w-24 h-28 rounded-lg overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0 shadow-xs relative">
                {funcionario.identificacion.fotoUrl ? (
                  <img 
                    src={funcionario.identificacion.fotoUrl} 
                    alt={funcionario.identificacion.nombres}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-[#0B4F9C] text-white text-[9px] text-center font-bold py-0.5">
                  INSOPESCA
                </div>
              </div>

              {/* Identity Details */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Cédula de Identidad</span>
                  <span className="text-xs font-bold text-slate-900 font-mono-numbers">
                    {funcionario.identificacion.tipoCedula}-{funcionario.identificacion.cedula}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">RIF SENIAT</span>
                  <span className="text-xs font-bold text-slate-900 font-mono-numbers">
                    {funcionario.identificacion.tipoRif}-{funcionario.identificacion.rif}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Nombres y Apellidos</span>
                  <span className="text-xs font-bold text-slate-900">
                    {funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Edad / Nacimiento</span>
                  <span className="text-xs font-medium text-slate-900">
                    {edad} años ({funcionario.identificacion.fechaNacimiento})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Lugar Nacimiento</span>
                  <span className="text-xs font-medium text-slate-800">
                    {funcionario.identificacion.lugarNacimiento || 'No registrado'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Género / Edo. Civil</span>
                  <span className="text-xs font-medium text-slate-800">
                    {funcionario.identificacion.genero === 'M' ? 'Masculino' : 'Femenino'} · {funcionario.identificacion.estadoCivil}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Grupo Sanguíneo</span>
                  <span className="text-xs font-bold text-red-700 font-mono-numbers">
                    {funcionario.identificacion.tipoSangre}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Tallas Dotación</span>
                  <span className="text-xs font-medium text-slate-800 font-mono-numbers">
                    Cam: {funcionario.identificacion.tallaCamisa} | Pant: {funcionario.identificacion.tallaPantalon} | Calz: {funcionario.identificacion.tallaCalzado}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Contacto y Domicilio */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <MapPin className="w-3.5 h-3.5 text-[#0B4F9C]" />
              <span>Contacto y Ubicación Geográfica</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Teléfono Móvil</span>
                <span className="text-xs font-mono-numbers text-slate-900 font-medium">
                  {funcionario.contacto.telefonoMovil || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Teléfono Habitación</span>
                <span className="text-xs font-mono-numbers text-slate-900 font-medium">
                  {funcionario.contacto.telefonoHabitacion || 'N/A'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-semibold block">Correos Electrónicos</span>
                <span className="text-xs text-slate-800">
                  Inst: {funcionario.contacto.emailInstitucional || 'N/A'} | Pers: {funcionario.contacto.emailPersonal || 'N/A'}
                </span>
              </div>
              <div className="sm:col-span-4 pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block">Dirección de Habitación</span>
                <span className="text-xs text-slate-800">
                  {funcionario.contacto.calleCasa}, {funcionario.contacto.sector}, Parroquia {funcionario.contacto.parroquia}, Municipio {funcionario.contacto.municipio}, Estado {funcionario.contacto.estado}.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Situación Laboral y Antigüedad APN */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Building2 className="w-3.5 h-3.5 text-[#0B4F9C]" />
              <span>Situación Administrativa y Antigüedad APN</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Condición Laboral</span>
                <span className="text-xs font-bold text-[#0B4F9C]">
                  {funcionario.situacionLaboral.condicion}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Código de Nómina</span>
                <span className="text-xs font-mono-numbers text-slate-900 font-medium">
                  {funcionario.situacionLaboral.codigoNomina}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-semibold block">Unidad de Adscripción</span>
                <span className="text-xs font-bold text-slate-800">
                  {funcionario.situacionLaboral.unidadAdministrativa}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Cargo Nominal (RAC)</span>
                <span className="text-xs text-slate-800 font-medium">
                  {funcionario.situacionLaboral.cargoNominal}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Cargo Funcional</span>
                <span className="text-xs text-slate-800">
                  {funcionario.situacionLaboral.cargoFuncional || 'Mismo nominal'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Sede / Región</span>
                <span className="text-xs text-slate-800">
                  {funcionario.situacionLaboral.sedeRegion}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Fecha Ingreso Organismo</span>
                <span className="text-xs font-mono-numbers text-slate-900">
                  {funcionario.situacionLaboral.fechaIngresoMinisterio}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Carnet de Identificación</span>
                <span className={`text-xs font-bold ${
                  funcionario.situacionLaboral.poseeCarnet ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  {funcionario.situacionLaboral.poseeCarnet 
                    ? `✓ SÍ POSEE ${funcionario.situacionLaboral.codigoCarnet ? `(${funcionario.situacionLaboral.codigoCarnet})` : ''}` 
                    : '✕ NO POSEE'}
                </span>
              </div>

              {/* Antigüedad Consolidada */}
              <div className="sm:col-span-4 bg-sky-50/70 p-2.5 rounded border border-sky-200 flex flex-wrap justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-[#0B4F9C]">Antigüedad Total Consolidada APN:</span>
                  <strong className="text-slate-900 font-mono-numbers ml-1">{antiguedad.anosTotalesAPN} años de servicio</strong>
                  <span className="text-slate-600 ml-2">({antiguedad.anosMinisterio}a en INSOPESCA/MPPPA + {funcionario.situacionLaboral.anosServicioPrevioAPN}a anteriores)</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  {jubilacion.motivo}
                </div>
              </div>

              {/* Datos Bancarios */}
              <div className="sm:col-span-4 pt-1 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">Banco Emisor:</span>
                  <span className="ml-1 text-slate-800 font-medium">{funcionario.situacionLaboral.banco}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">Cuenta Nómina:</span>
                  <span className="ml-1 font-mono-numbers text-slate-900 font-bold tracking-wider">
                    {funcionario.situacionLaboral.cuentaNomina || 'No asignada'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Perfil Académico y Cursos */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0B4F9C]" />
              <span>Perfil Académico y Certificaciones</span>
            </h3>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Nivel de Instrucción</span>
                  <span className="text-xs font-bold text-slate-900">{funcionario.perfilAcademico.nivelInstruccion}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Profesión / Oficio</span>
                  <span className="text-xs text-slate-800">{funcionario.perfilAcademico.profesionOficio || 'N/A'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 font-semibold block">Título y Casa de Estudios</span>
                  <span className="text-xs font-medium text-slate-800">
                    {funcionario.perfilAcademico.tituloObtenido} ({funcionario.perfilAcademico.institucion}, {funcionario.perfilAcademico.anoGraduacion})
                  </span>
                </div>
              </div>

              {funcionario.perfilAcademico.cursosCertificaciones.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Cursos y Talleres Registrados:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                    {funcionario.perfilAcademico.cursosCertificaciones.map(c => (
                      <li key={c.id}>
                        <strong>{c.nombreCurso}</strong> · {c.institucion} ({c.ano}) - {c.horasAcademicas} horas.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Carga Familiar y Salud */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Carga Familiar */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Users className="w-3.5 h-3.5 text-[#0B4F9C]" />
                <span>Carga Familiar ({funcionario.cargaFamiliar.familiares.length})</span>
              </h3>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                {funcionario.cargaFamiliar.familiares.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {funcionario.cargaFamiliar.familiares.map(fam => (
                      <div key={fam.id} className="py-1 flex justify-between text-xs">
                        <div>
                          <strong className="text-slate-900">{fam.nombres} {fam.apellidos}</strong>
                          <div className="text-[10px] text-slate-500">
                            {fam.parentesco} · {fam.cedula ? `C.I. ${fam.cedula}` : 'Menor de edad'} {fam.estudia ? '· (Estudiante)' : ''}
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono-numbers text-slate-500">
                          {calcularEdad(fam.fechaNacimiento)} años
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Sin carga familiar declarada.</span>
                )}
                <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                  Vivienda: <strong>{funcionario.cargaFamiliar.tipoVivienda}</strong>
                </div>
              </div>
            </div>

            {/* Ficha Médica y Emergencia */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <HeartPulse className="w-3.5 h-3.5 text-[#0B4F9C]" />
                <span>Salud y Contacto de Auxilio</span>
              </h3>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Alergias / Patologías:</span>
                  <span className="text-slate-800">{funcionario.salud.alergias || 'Ninguna'} · {funcionario.salud.patologiasCronicas || 'Sin patologías'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Tratamiento Médico Permanente:</span>
                  <span className="text-slate-800">{funcionario.salud.tratamientoPermanente || 'Ninguno'}</span>
                </div>
                <div className="pt-1 border-t border-slate-100 bg-amber-50/60 p-2 rounded border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Contacto en Caso de Emergencia:</span>
                  <div className="font-semibold text-slate-900">{funcionario.salud.contactoEmergenciaNombre} ({funcionario.salud.contactoEmergenciaParentesco})</div>
                  <div className="font-mono-numbers text-slate-700">{funcionario.salud.contactoEmergenciaTelefono}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Section 6: Expediente Digital Status */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <FileText className="w-3.5 h-3.5 text-[#0B4F9C]" />
              <span>Soportes Probatorios en Repositorio Digital</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {funcionario.expedienteDigital.map(doc => {
                const cargado = Boolean(doc.nombreArchivo);
                return (
                  <div key={doc.id} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 text-[11px]">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${cargado ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 block truncate">{doc.titulo}</span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {cargado ? `${doc.tamanoKb} KB · Cotejado` : 'No consignado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formal Signatures and Institutional Seals (Print-ready) */}
          <div className="pt-8 mt-6 border-t border-slate-200 print-break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              
              {/* 1. Funcionario Signature */}
              <div className="space-y-1">
                <div className="h-16 border-b border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">Firma del Servidor Público</span>
                </div>
                <div className="font-bold text-slate-900">
                  {funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}
                </div>
                <div className="text-[10px] text-slate-600 font-mono-numbers font-semibold">
                  C.I. {funcionario.identificacion.tipoCedula}-{funcionario.identificacion.cedula}
                </div>
                <div className="text-[9px] text-slate-400">
                  Declaración Jurada y Conformidad
                </div>
              </div>

              {/* 2. Enlace RRHH / Verificación */}
              <div className="space-y-1">
                <div className="h-16 border-b border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">Cotejado y Verificado por</span>
                </div>
                <div className="font-bold text-slate-900">
                  Lcda. Maria Peña
                </div>
                <div className="text-[10px] text-[#0B4F9C] font-bold">
                  Enlaces RRHH · Gestión Humana
                </div>
                <div className="text-[9px] text-slate-400">
                  INSOPESCA / MPPPA
                </div>
              </div>

              {/* 3. Gerente Regional Barinas Signature & Stamp */}
              <div className="space-y-1">
                <div className="h-16 border-b border-slate-400 flex items-end justify-center pb-1 relative">
                  {/* Official Ink Stamp */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#0B4F9C] text-[#0B4F9C] flex flex-col items-center justify-center text-[6.5px] font-black uppercase p-1 transform rotate-[-6deg] leading-tight bg-white/40">
                      <span>INSOPESCA</span>
                      <span className="text-[6px]">GERENCIA REGIONAL</span>
                      <span className="text-[7px]">BARINAS</span>
                      <span className="text-[5.5px] font-bold">VISTO BUENO / AUTORIZADO</span>
                      <span className="font-mono text-[7px]">2026</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">Firma y Sello de Autorización</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  Lcda. Mirla Escalona
                </div>
                <div className="text-[10px] text-[#0B4F9C] font-bold">
                  Gerente Regional Barinas
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">
                  Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)
                </div>
              </div>

            </div>

            <div className="text-center text-[9px] text-slate-400 mt-6 font-mono">
              Documento emitido formalmente por el Sistema SIGEF-RRHH · Instituto Socialista de la Pesca y Acuicultura (INSOPESCA) / MPPPA · Validez oficial para fines administrativos y auditoría de la Contraloría General.
            </div>

            {/* S&S Web Studio Cintillo in Ficha */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] text-slate-500">
              <span>Constancia de Expediente Digital Homologado · Sistema Integral de Gestión de Capital Humano</span>
              <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded shrink-0">
                <img
                  src="/assets/aistudio/1791899989619_db0f9485.jpg"
                  alt="S&S Web Studio"
                  className="h-3.5 w-auto object-contain"
                />
                <span className="font-medium text-slate-700">
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

import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Users, 
  HeartPulse, 
  FileCheck2, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  Building,
  CreditCard,
  Eye,
  Camera,
  X
} from 'lucide-react';
import { 
  Funcionario, 
  Familiar, 
  CursoCertificacion, 
  DocumentoSoporte,
  TipoDocumentoSoporte,
  CampoPersonalizado,
  calcularAntiguedad, 
  calcularCompletitudExpediente,
  calcularEdad
} from '../types/rrhh';
import { StorageService } from '../services/storageService';

interface WizardCaptacionProps {
  initialFuncionario?: Funcionario | null;
  onSave: (funcionario: Funcionario) => void;
  onCancel: () => void;
  onPreviewDocument?: (doc: DocumentoSoporte) => void;
}

const DEFAULT_DOCUMENTS: Omit<DocumentoSoporte, 'id'>[] = [
  { tipo: 'CEDULA', titulo: 'Cédula de Identidad Ampliada', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: true },
  { tipo: 'RIF', titulo: 'Registro de Información Fiscal (RIF Vigente)', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: true },
  { tipo: 'SINTESIS_CURRICULAR', titulo: 'Síntesis Curricular con Soportes', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: true },
  { tipo: 'FONDO_NEGRO_TITULO', titulo: 'Fondo Negro Certificado del Título', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: true },
  { tipo: 'PARTIDA_NACIMIENTO', titulo: 'Partidas de Nacimiento Hijos (Carga Familiar)', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: false },
  { tipo: 'ANTECEDENTES_FP023', titulo: 'Antecedentes de Servicios en APN (FP-023)', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: true },
  { tipo: 'FE_DE_VIDA', titulo: 'Constancia de Fe de Vida 2026', nombreArchivo: '', tamanoKb: 0, fechaCarga: '', verificado: false, obligatorio: false }
];

export const WizardCaptacion: React.FC<WizardCaptacionProps> = ({
  initialFuncionario,
  onSave,
  onCancel,
  onPreviewDocument
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Form State
  const [form, setForm] = useState<Funcionario>(() => {
    if (initialFuncionario) {
      return JSON.parse(JSON.stringify(initialFuncionario));
    }
    const baseNew: Funcionario = {
      id: `f-${Date.now()}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
      fechaUltimaActualizacion: new Date().toISOString().split('T')[0],
      identificacion: {
        fotoUrl: '',
        tipoCedula: 'V',
        cedula: '',
        tipoRif: 'V',
        rif: '',
        nombres: '',
        apellidos: '',
        fechaNacimiento: '1990-01-01',
        lugarNacimiento: '',
        genero: 'M',
        estadoCivil: 'SOLTERO',
        lateralidad: 'DIESTRO',
        tipoSangre: 'O+',
        tallaCamisa: 'M',
        tallaPantalon: '32',
        tallaCalzado: '40'
      },
      contacto: {
        telefonoMovil: '',
        telefonoHabitacion: '',
        emailInstitucional: '',
        emailPersonal: '',
        estado: 'Caracas (Distrito Capital)',
        municipio: 'Libertador',
        parroquia: 'Altagracia',
        sector: '',
        calleCasa: ''
      },
      situacionLaboral: {
        condicion: 'FIJO',
        codigoNomina: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        cargoNominal: '',
        cargoFuncional: '',
        unidadAdministrativa: 'Dirección General de Recursos Pesqueros y Acuícolas',
        sedeRegion: 'Sede Central Caracas',
        fechaIngresoMinisterio: new Date().toISOString().split('T')[0],
        anosServicioPrevioAPN: 0,
        banco: 'Banco de Venezuela (0102)',
        cuentaNomina: '',
        poseeCarnet: false,
        codigoCarnet: '',
        estatusCarnet: 'NO_POSEE'
      },
      perfilAcademico: {
        nivelInstruccion: 'UNIVERSITARIO',
        profesionOficio: '',
        tituloObtenido: '',
        institucion: '',
        anoGraduacion: 2015,
        cursosCertificaciones: []
      },
      cargaFamiliar: {
        tipoVivienda: 'PROPIA',
        observacionesVivienda: '',
        familiares: []
      },
      salud: {
        alergias: '',
        patologiasCronicas: '',
        discapacidadCertificada: false,
        codigoConapdis: '',
        tratamientoPermanente: '',
        contactoEmergenciaNombre: '',
        contactoEmergenciaParentesco: '',
        contactoEmergenciaTelefono: ''
      },
      expedienteDigital: DEFAULT_DOCUMENTS.map((doc, idx) => ({
        ...doc,
        id: `doc-init-${idx}`
      })),
      notasAuditoria: ''
    };
    return baseNew;
  });

  // Calculate live completion
  const completitud = calcularCompletitudExpediente(form);
  const antiguedad = calcularAntiguedad(
    form.situacionLaboral.fechaIngresoMinisterio,
    form.situacionLaboral.anosServicioPrevioAPN
  );

  const steps = [
    { number: 1, title: 'Identificación y Biometría', short: 'Identificación', icon: User },
    { number: 2, title: 'Contacto y Ubicación', short: 'Ubicación', icon: MapPin },
    { number: 3, title: 'Situación Laboral', short: 'Laboral', icon: Briefcase },
    { number: 4, title: 'Perfil Académico', short: 'Académico', icon: GraduationCap },
    { number: 5, title: 'Carga Familiar', short: 'Familia', icon: Users },
    { number: 6, title: 'Salud y Seguridad', short: 'Salud', icon: HeartPulse },
    { number: 7, title: 'Expediente Digital', short: 'Documentos', icon: FileCheck2 }
  ];

  // Handlers for dynamic collections
  const addFamiliar = () => {
    const nuevo: Familiar = {
      id: `fam-${Date.now()}`,
      parentesco: 'HIJO',
      nombres: '',
      apellidos: '',
      cedula: '',
      fechaNacimiento: '2015-01-01',
      genero: 'M',
      estudia: true,
      discapacidad: false
    };
    setForm(prev => ({
      ...prev,
      cargaFamiliar: {
        ...prev.cargaFamiliar,
        familiares: [...prev.cargaFamiliar.familiares, nuevo]
      }
    }));
  };

  const removeFamiliar = (id: string) => {
    setForm(prev => ({
      ...prev,
      cargaFamiliar: {
        ...prev.cargaFamiliar,
        familiares: prev.cargaFamiliar.familiares.filter(f => f.id !== id)
      }
    }));
  };

  const updateFamiliar = (id: string, field: keyof Familiar, value: any) => {
    setForm(prev => ({
      ...prev,
      cargaFamiliar: {
        ...prev.cargaFamiliar,
        familiares: prev.cargaFamiliar.familiares.map(f => 
          f.id === id ? { ...f, [field]: value } : f
        )
      }
    }));
  };

  const addCurso = () => {
    const nuevo: CursoCertificacion = {
      id: `cur-${Date.now()}`,
      nombreCurso: '',
      institucion: '',
      ano: new Date().getFullYear(),
      horasAcademicas: 40
    };
    setForm(prev => ({
      ...prev,
      perfilAcademico: {
        ...prev.perfilAcademico,
        cursosCertificaciones: [...prev.perfilAcademico.cursosCertificaciones, nuevo]
      }
    }));
  };

  const removeCurso = (id: string) => {
    setForm(prev => ({
      ...prev,
      perfilAcademico: {
        ...prev.perfilAcademico,
        cursosCertificaciones: prev.perfilAcademico.cursosCertificaciones.filter(c => c.id !== id)
      }
    }));
  };

  const updateCurso = (id: string, field: keyof CursoCertificacion, value: any) => {
    setForm(prev => ({
      ...prev,
      perfilAcademico: {
        ...prev.perfilAcademico,
        cursosCertificaciones: prev.perfilAcademico.cursosCertificaciones.map(c => 
          c.id === id ? { ...c, [field]: value } : c
        )
      }
    }));
  };

  // Document Upload simulator / Real file reader
  const handleFileUpload = (docId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setForm(prev => ({
        ...prev,
        expedienteDigital: prev.expedienteDigital.map(d => {
          if (d.id === docId) {
            return {
              ...d,
              nombreArchivo: file.name,
              tamanoKb: Math.round(file.size / 1024),
              fechaCarga: new Date().toISOString().split('T')[0],
              verificado: true,
              previewUrl: dataUrl
            };
          }
          return d;
        })
      }));
    };
    reader.readAsDataURL(file);
  };

  // Avatar Photo Upload
  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(prev => ({
        ...prev,
        identificacion: {
          ...prev.identificacion,
          fotoUrl: e.target?.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.identificacion.nombres.trim()) newErrors.nombres = 'Los nombres son obligatorios';
      if (!form.identificacion.apellidos.trim()) newErrors.apellidos = 'Los apellidos son obligatorios';
      if (!form.identificacion.cedula.trim()) newErrors.cedula = 'El número de cédula es obligatorio';
      if (!form.identificacion.rif.trim()) newErrors.rif = 'El RIF es obligatorio';
    }

    if (currentStep === 2) {
      if (!form.contacto.telefonoMovil.trim()) newErrors.telefonoMovil = 'El teléfono móvil es obligatorio';
      if (!form.contacto.emailPersonal.trim()) newErrors.emailPersonal = 'El correo electrónico es obligatorio';
      if (!form.contacto.estado.trim()) newErrors.estado = 'El estado geográfico es obligatorio';
      if (!form.contacto.municipio.trim()) newErrors.municipio = 'El municipio es obligatorio';
    }

    if (currentStep === 3) {
      if (!form.situacionLaboral.cargoNominal.trim()) newErrors.cargoNominal = 'El cargo nominal es obligatorio';
      if (!form.situacionLaboral.unidadAdministrativa.trim()) newErrors.unidadAdministrativa = 'La unidad administrativa es obligatoria';
      if (!form.situacionLaboral.fechaIngresoMinisterio) newErrors.fechaIngresoMinisterio = 'La fecha de ingreso es obligatoria';
      
      const cuentaClean = form.situacionLaboral.cuentaNomina.replace(/\D/g, '');
      if (cuentaClean && cuentaClean.length !== 20) {
        newErrors.cuentaNomina = 'La cuenta nómina debe poseer exactamente 20 dígitos bancarios';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(s => Math.min(s + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (finalizar: boolean = false) => {
    if (finalizar && !validateCurrentStep()) {
      return;
    }
    onSave(form);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner & Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
        {/* Venezuelan Tricolor Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shrink-0">
              <img
                src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                alt="INSOPESCA Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#0B4F9C] uppercase tracking-wider">
                INSOPESCA · {initialFuncionario ? 'Actualización de Expediente' : 'Censo y Captación de Personal'}
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {form.identificacion.nombres && form.identificacion.apellidos
                  ? `${form.identificacion.nombres} ${form.identificacion.apellidos}`
                  : 'Nuevo Servidor Público'}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Cédula: <strong>{form.identificacion.tipoCedula}-{form.identificacion.cedula || 'Sin asignar'}</strong></span>
                <span>·</span>
                <span>Nómina: <strong>{form.situacionLaboral.codigoNomina}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Area: Completeness Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Completeness Badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">
                  Expediente al {completitud.porcentaje}%
                </div>
                <div className="text-[11px] text-slate-500">
                  {completitud.completo ? 'Auditoría conforme' : `${completitud.pendientes.length} campos pendientes`}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center font-mono-numbers font-bold text-xs relative">
                <span className={completitud.completo ? 'text-emerald-700' : 'text-[#0B4F9C]'}>
                  {completitud.porcentaje}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Step Selector Bar */}
        <div className="border-t border-slate-100 pt-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {steps.map(step => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isPast = currentStep > step.number;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                    isActive
                      ? 'bg-[#0B4F9C] text-white shadow-xs'
                      : isPast
                        ? 'bg-sky-50 text-[#0B4F9C] hover:bg-sky-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                    isActive
                      ? 'bg-[#07366B] text-[#FFD100]'
                      : isPast
                        ? 'bg-sky-200 text-[#0B4F9C]'
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : step.number}
                  </div>
                  <span className="text-[11px] font-semibold truncate max-w-full hidden md:block">
                    {step.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Notice */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>¡Expediente guardado exitosamente en el sistema de almacenamiento local del SIGEF-RRHH!</span>
        </div>
      )}

      {/* Form Content by Step */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        
        {/* STEP 1: IDENTIFICACIÓN Y BIOMETRÍA */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 1: Datos de Identificación y Biometría
                </h2>
                <p className="text-xs text-slate-500">
                  Filiación legal, documento de identidad, características biométricas y tallas para dotación ministerial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Photo Box */}
              <div className="md:col-span-1 flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-32 h-36 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 overflow-hidden relative group mb-3 shadow-inner flex items-center justify-center">
                  {form.identificacion.fotoUrl ? (
                    <img 
                      src={form.identificacion.fotoUrl} 
                      alt="Carnet" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-slate-400 text-center p-2">
                      <Camera className="w-8 h-8 mx-auto mb-1 text-slate-400" />
                      <span className="text-[10px] leading-tight block">Foto Carnet (Fondo Blanco)</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs font-medium">
                    <span>Cambiar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }} 
                    />
                  </label>
                </div>
                
                <label className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors shadow-xs">
                  <span>Cargar Fotografía</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }} 
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-2">
                  Formato tipo carnet 3x4 fondo blanco (JPG/PNG).
                </span>
              </div>

              {/* Personal Data Inputs */}
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Tipo y Cédula */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula de Identidad *
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={form.identificacion.tipoCedula}
                      onChange={(e) => setForm({
                        ...form,
                        identificacion: { ...form.identificacion, tipoCedula: e.target.value as 'V' | 'E' }
                      })}
                      className="w-16 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="V">V-</option>
                      <option value="E">E-</option>
                    </select>
                    <input
                      type="text"
                      value={form.identificacion.cedula}
                      onChange={(e) => setForm({
                        ...form,
                        identificacion: { ...form.identificacion, cedula: e.target.value }
                      })}
                      placeholder="Ej. 18.450.320"
                      className={`flex-1 px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono-numbers ${
                        errors.cedula ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.cedula && <span className="text-[10px] text-red-600">{errors.cedula}</span>}
                </div>

                {/* Tipo y RIF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RIF Vigente *
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={form.identificacion.tipoRif}
                      onChange={(e) => setForm({
                        ...form,
                        identificacion: { ...form.identificacion, tipoRif: e.target.value as any }
                      })}
                      className="w-16 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="V">V-</option>
                      <option value="J">J-</option>
                      <option value="E">E-</option>
                      <option value="G">G-</option>
                    </select>
                    <input
                      type="text"
                      value={form.identificacion.rif}
                      onChange={(e) => setForm({
                        ...form,
                        identificacion: { ...form.identificacion, rif: e.target.value }
                      })}
                      placeholder="Ej. 18450320-4"
                      className={`flex-1 px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono-numbers ${
                        errors.rif ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.rif && <span className="text-[10px] text-red-600">{errors.rif}</span>}
                </div>

                {/* Género */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Género *
                  </label>
                  <select
                    value={form.identificacion.genero}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, genero: e.target.value as 'M' | 'F' }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                {/* Nombres */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombres Completos *
                  </label>
                  <input
                    type="text"
                    value={form.identificacion.nombres}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, nombres: e.target.value }
                    })}
                    placeholder="Ej. Pedro José"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      errors.nombres ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.nombres && <span className="text-[10px] text-red-600">{errors.nombres}</span>}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    value={form.identificacion.apellidos}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, apellidos: e.target.value }
                    })}
                    placeholder="Ej. Gómez Salazar"
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      errors.apellidos ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.apellidos && <span className="text-[10px] text-red-600">{errors.apellidos}</span>}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={form.identificacion.fechaNacimiento}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, fechaNacimiento: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono-numbers"
                  />
                  <span className="text-[10px] text-slate-400">
                    Edad calculada: {calcularEdad(form.identificacion.fechaNacimiento)} años
                  </span>
                </div>

                {/* Lugar de Nacimiento */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lugar de Nacimiento (Ciudad / Estado)
                  </label>
                  <input
                    type="text"
                    value={form.identificacion.lugarNacimiento}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, lugarNacimiento: e.target.value }
                    })}
                    placeholder="Ej. Cumaná, Estado Sucre"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Estado Civil */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={form.identificacion.estadoCivil}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, estadoCivil: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="SOLTERO">Soltero/a</option>
                    <option value="CASADO">Casado/a</option>
                    <option value="DIVORCIADO">Divorciado/a</option>
                    <option value="VIUDO">Viudo/a</option>
                    <option value="CONCUBINATO">Unión Estable de Hechos</option>
                  </select>
                </div>

                {/* Lateralidad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lateralidad
                  </label>
                  <select
                    value={form.identificacion.lateralidad}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, lateralidad: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="DIESTRO">Diestro</option>
                    <option value="ZURDO">Zurdo</option>
                    <option value="AMBIDIESTRO">Ambidiestro</option>
                  </select>
                </div>

                {/* Tipo de Sangre */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grupo Sanguíneo
                  </label>
                  <select
                    value={form.identificacion.tipoSangre}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, tipoSangre: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Tallas de Dotación Textil y Calzado */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Tallas para Dotación de Uniforme y Seguridad Industrial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Talla de Camisa / Chaqueta
                  </label>
                  <select
                    value={form.identificacion.tallaCamisa}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, tallaCamisa: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="SS">SS (Extra Pequeña)</option>
                    <option value="S">S (Pequeña)</option>
                    <option value="M">M (Mediana)</option>
                    <option value="L">L (Grande)</option>
                    <option value="XL">XL (Extra Grande)</option>
                    <option value="XXL">XXL (Doble Extra)</option>
                    <option value="XXXL">XXXL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Talla de Pantalón
                  </label>
                  <input
                    type="text"
                    value={form.identificacion.tallaPantalon}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, tallaPantalon: e.target.value }
                    })}
                    placeholder="Ej. 30, 32, 34, 36..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Talla de Calzado / Botas
                  </label>
                  <input
                    type="text"
                    value={form.identificacion.tallaCalzado}
                    onChange={(e) => setForm({
                      ...form,
                      identificacion: { ...form.identificacion, tallaCalzado: e.target.value }
                    })}
                    placeholder="Ej. 38, 40, 42..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: CONTACTO Y UBICACIÓN */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 2: Contacto y Ubicación Geográfica
                </h2>
                <p className="text-xs text-slate-500">
                  Canales de comunicación oficiales y desglose político-territorial del domicilio del servidor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Teléfono Móvil */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono Móvil (WhatsApp) *
                </label>
                <input
                  type="text"
                  value={form.contacto.telefonoMovil}
                  onChange={(e) => setForm({
                    ...form,
                    contacto: { ...form.contacto, telefonoMovil: e.target.value }
                  })}
                  placeholder="Ej. 0414-1234567 / 0412 / 0416 / 0424"
                  className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg font-mono-numbers ${
                    errors.telefonoMovil ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.telefonoMovil && <span className="text-[10px] text-red-600">{errors.telefonoMovil}</span>}
              </div>

              {/* Teléfono Habitación */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Habitación / Fijo
                </label>
                <input
                  type="text"
                  value={form.contacto.telefonoHabitacion}
                  onChange={(e) => setForm({
                    ...form,
                    contacto: { ...form.contacto, telefonoHabitacion: e.target.value }
                  })}
                  placeholder="Ej. 0212-5551234 / 0293..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                />
              </div>

              {/* Correo Institucional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Institucional (@pesca.gob.ve)
                </label>
                <input
                  type="email"
                  value={form.contacto.emailInstitucional}
                  onChange={(e) => setForm({
                    ...form,
                    contacto: { ...form.contacto, emailInstitucional: e.target.value }
                  })}
                  placeholder="usuario@pesca.gob.ve"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Correo Personal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Personal *
                </label>
                <input
                  type="email"
                  value={form.contacto.emailPersonal}
                  onChange={(e) => setForm({
                    ...form,
                    contacto: { ...form.contacto, emailPersonal: e.target.value }
                  })}
                  placeholder="usuario@gmail.com"
                  className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg ${
                    errors.emailPersonal ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.emailPersonal && <span className="text-[10px] text-red-600">{errors.emailPersonal}</span>}
              </div>

            </div>

            {/* Dirección Geográfica */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Dirección de Habitación Detallada
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={form.contacto.estado}
                    onChange={(e) => setForm({
                      ...form,
                      contacto: { ...form.contacto, estado: e.target.value }
                    })}
                    placeholder="Ej. Sucre, Miranda, Zulia..."
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg ${
                      errors.estado ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Municipio *
                  </label>
                  <input
                    type="text"
                    value={form.contacto.municipio}
                    onChange={(e) => setForm({
                      ...form,
                      contacto: { ...form.contacto, municipio: e.target.value }
                    })}
                    placeholder="Ej. Sucre, Libertador..."
                    className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg ${
                      errors.municipio ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parroquia
                  </label>
                  <input
                    type="text"
                    value={form.contacto.parroquia}
                    onChange={(e) => setForm({
                      ...form,
                      contacto: { ...form.contacto, parroquia: e.target.value }
                    })}
                    placeholder="Ej. Altagracia, Santa Inés..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sector / Urbanización
                  </label>
                  <input
                    type="text"
                    value={form.contacto.sector}
                    onChange={(e) => setForm({
                      ...form,
                      contacto: { ...form.contacto, sector: e.target.value }
                    })}
                    placeholder="Ej. Los Chaimas, Casco Central..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Avenida / Calle / Edificio o Casa / N° Apto
                  </label>
                  <input
                    type="text"
                    value={form.contacto.calleCasa}
                    onChange={(e) => setForm({
                      ...form,
                      contacto: { ...form.contacto, calleCasa: e.target.value }
                    })}
                    placeholder="Ej. Calle 3 con Av. Principal, Res. El Faro, Piso 2, Apto 2-A"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

              </div>
            </div>

          </div>
        )}

        {/* STEP 3: SITUACIÓN ADMINISTRATIVA Y LABORAL */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 3: Situación Administrativa y Laboral
                </h2>
                <p className="text-xs text-slate-500">
                  Condición jurídica de nómina, cargos, cálculo normativo de antigüedad APN y cuenta bancaria.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Condición Laboral */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condición del Trabajador *
                </label>
                <select
                  value={form.situacionLaboral.condicion}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, condicion: e.target.value as any }
                  })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  <option value="FIJO">Fijo (Personal de Carrera)</option>
                  <option value="CONTRATADO">Personal Contratado</option>
                  <option value="ALTO_NIVEL">Alto Nivel / Cargo de Confianza</option>
                  <option value="COMISION_SERVICIO">Comisión de Servicio</option>
                  <option value="JUBILADO">Jubilado</option>
                  <option value="PENSIONADO">Pensionado</option>
                </select>
              </div>

              {/* Código Nómina */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Nómina
                </label>
                <input
                  type="text"
                  value={form.situacionLaboral.codigoNomina}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, codigoNomina: e.target.value }
                  })}
                  placeholder="Ej. EMP-00421"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                />
              </div>

              {/* Sede / Región */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sede / Región Pesquera *
                </label>
                <input
                  type="text"
                  value={form.situacionLaboral.sedeRegion}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, sedeRegion: e.target.value }
                  })}
                  placeholder="Ej. Sede Central Caracas, Sucre, Zulia, Falcón..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Cargo Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo Nominal (RAC) *
                </label>
                <input
                  type="text"
                  value={form.situacionLaboral.cargoNominal}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, cargoNominal: e.target.value }
                  })}
                  placeholder="Ej. Biólogo Marino I, Analista de Personal..."
                  className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg ${
                    errors.cargoNominal ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.cargoNominal && <span className="text-[10px] text-red-600">{errors.cargoNominal}</span>}
              </div>

              {/* Cargo Funcional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo Funcional (Desempeño Real)
                </label>
                <input
                  type="text"
                  value={form.situacionLaboral.cargoFuncional}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, cargoFuncional: e.target.value }
                  })}
                  placeholder="Ej. Jefe de Muelle de Faena, Supervisor..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Unidad Administrativa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidad Administrativa de Adscripción *
                </label>
                <input
                  type="text"
                  value={form.situacionLaboral.unidadAdministrativa}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, unidadAdministrativa: e.target.value }
                  })}
                  placeholder="Ej. Dirección General de Recursos Pesqueros..."
                  className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg ${
                    errors.unidadAdministrativa ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.unidadAdministrativa && <span className="text-[10px] text-red-600">{errors.unidadAdministrativa}</span>}
              </div>

              {/* Fecha Ingreso Ministerio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Ingreso al Ministerio *
                </label>
                <input
                  type="date"
                  value={form.situacionLaboral.fechaIngresoMinisterio}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, fechaIngresoMinisterio: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                />
              </div>

              {/* Años Previos en la APN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Años Previos en APN (FP-023)
                </label>
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={form.situacionLaboral.anosServicioPrevioAPN}
                  onChange={(e) => setForm({
                    ...form,
                    situacionLaboral: { ...form.situacionLaboral, anosServicioPrevioAPN: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                />
                <span className="text-[10px] text-slate-400">
                  Años certificados en otros organismos del Estado
                </span>
              </div>

              {/* Cálculo Automático de Antigüedad Total */}
              <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-blue-900 uppercase">
                  Antigüedad Total Consolidada APN
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-blue-950 font-mono-numbers">
                    {antiguedad.anosTotalesAPN} años
                  </span>
                  <span className="text-[11px] text-blue-800">
                    ({antiguedad.anosMinisterio}a en MPPPA + {form.situacionLaboral.anosServicioPrevioAPN}a previas)
                  </span>
                </div>
              </div>

            </div>

            {/* Datos Bancarios (Cuenta Nómina 20 Dígitos) */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span>Datos Bancarios para Pago de Nómina y Primas</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Entidad Bancaria
                  </label>
                  <select
                    value={form.situacionLaboral.banco}
                    onChange={(e) => setForm({
                      ...form,
                      situacionLaboral: { ...form.situacionLaboral, banco: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Banco de Venezuela (0102)">Banco de Venezuela (0102)</option>
                    <option value="Banco Bicentenario del Pueblo (0175)">Banco Bicentenario del Pueblo (0175)</option>
                    <option value="Banco del Tesoro (0163)">Banco del Tesoro (0163)</option>
                    <option value="Banco Agrícola de Venezuela (0166)">Banco Agrícola de Venezuela (0166)</option>
                    <option value="Banesco (0134)">Banesco (0134)</option>
                    <option value="Mercantil (0105)">Banco Mercantil (0105)</option>
                    <option value="BBVA Provincial (0108)">BBVA Provincial (0108)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      N° Cuenta Nómina (20 Dígitos)
                    </label>
                    <span className="text-[10px] font-mono-numbers text-slate-500">
                      {form.situacionLaboral.cuentaNomina.replace(/\D/g, '').length}/20 dígitos
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={24}
                    value={form.situacionLaboral.cuentaNomina}
                    onChange={(e) => setForm({
                      ...form,
                      situacionLaboral: { ...form.situacionLaboral, cuentaNomina: e.target.value }
                    })}
                    placeholder="Ej. 01020345670100123456"
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg font-mono-numbers tracking-wider ${
                      errors.cuentaNomina ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.cuentaNomina && <span className="text-[10px] text-red-600">{errors.cuentaNomina}</span>}
                </div>
              </div>
            </div>

            {/* Carnet de Identificación Institucional */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0B4F9C]" />
                <span>Carnet de Identificación Institucional</span>
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-0.5">
                      ¿Posee Carnet de Identificación Institucional? *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Indique si el funcionario cuenta con porte de carnet / acreditación oficial emitida por INSOPESCA o MPPPA
                    </p>
                  </div>
                  
                  {/* Selector Sí / No con botones visuales */}
                  <div className="inline-flex rounded-lg p-1 bg-slate-200 border border-slate-300 shrink-0">
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        situacionLaboral: {
                          ...form.situacionLaboral,
                          poseeCarnet: true,
                          estatusCarnet: form.situacionLaboral.estatusCarnet === 'NO_POSEE' ? 'VIGENTE' : (form.situacionLaboral.estatusCarnet || 'VIGENTE')
                        }
                      })}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        form.situacionLaboral.poseeCarnet === true
                          ? 'bg-[#0B4F9C] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ✓ SÍ POSEE
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        situacionLaboral: {
                          ...form.situacionLaboral,
                          poseeCarnet: false,
                          codigoCarnet: '',
                          estatusCarnet: 'NO_POSEE'
                        }
                      })}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        form.situacionLaboral.poseeCarnet === false
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ✕ NO POSEE
                    </button>
                  </div>
                </div>

                {/* Campos si posee carnet */}
                {form.situacionLaboral.poseeCarnet && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Código / Serial del Carnet
                      </label>
                      <input
                        type="text"
                        value={form.situacionLaboral.codigoCarnet || ''}
                        onChange={(e) => setForm({
                          ...form,
                          situacionLaboral: { ...form.situacionLaboral, codigoCarnet: e.target.value }
                        })}
                        placeholder="Ej. CARNET-INS-00421"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono-numbers focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="text-[10px] text-slate-400">
                        Número visible o código impreso en el carnet institucional
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estatus del Carnet
                      </label>
                      <select
                        value={form.situacionLaboral.estatusCarnet || 'VIGENTE'}
                        onChange={(e) => setForm({
                          ...form,
                          situacionLaboral: { ...form.situacionLaboral, estatusCarnet: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                      >
                        <option value="VIGENTE">Vigente y Activo</option>
                        <option value="EN_TRAMITE">En Trámite de Emisión</option>
                        <option value="VENCIDO">Vencido / Por Renovar</option>
                        <option value="EXTRAVIADO">Reportado Extraviado / Deteriorado</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: PERFIL ACADÉMICO */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 4: Perfil Académico y Profesional
                </h2>
                <p className="text-xs text-slate-500">
                  Nivel de instrucción formal, títulos obtenidos y registro de certificaciones complementarias.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Nivel de Instrucción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nivel de Instrucción *
                </label>
                <select
                  value={form.perfilAcademico.nivelInstruccion}
                  onChange={(e) => setForm({
                    ...form,
                    perfilAcademico: { ...form.perfilAcademico, nivelInstruccion: e.target.value as any }
                  })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="PRIMARIA">Educación Primaria</option>
                  <option value="BACHILLER">Bachiller</option>
                  <option value="TSU">Técnico Superior Universitario (TSU)</option>
                  <option value="UNIVERSITARIO">Profesional Universitario / Licenciado / Ingeniero</option>
                  <option value="ESPECIALIZACION">Especialización</option>
                  <option value="MAESTRIA">Maestría / Magíster</option>
                  <option value="DOCTORADO">Doctorado / PhD</option>
                </select>
              </div>

              {/* Profesión u Oficio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesión u Oficio Principal
                </label>
                <input
                  type="text"
                  value={form.perfilAcademico.profesionOficio}
                  onChange={(e) => setForm({
                    ...form,
                    perfilAcademico: { ...form.perfilAcademico, profesionOficio: e.target.value }
                  })}
                  placeholder="Ej. Biólogo Marino, Veterinario, Abogado..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Año de Graduación */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Año de Graduación
                </label>
                <input
                  type="number"
                  min="1960"
                  max={new Date().getFullYear()}
                  value={form.perfilAcademico.anoGraduacion}
                  onChange={(e) => setForm({
                    ...form,
                    perfilAcademico: { ...form.perfilAcademico, anoGraduacion: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                />
              </div>

              {/* Título Obtenido */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título Obtenido
                </label>
                <input
                  type="text"
                  value={form.perfilAcademico.tituloObtenido}
                  onChange={(e) => setForm({
                    ...form,
                    perfilAcademico: { ...form.perfilAcademico, tituloObtenido: e.target.value }
                  })}
                  placeholder="Ej. Licenciada en Biología Marina mención Recursos Vivos"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Institución */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institución / Universidad
                </label>
                <input
                  type="text"
                  value={form.perfilAcademico.institucion}
                  onChange={(e) => setForm({
                    ...form,
                    perfilAcademico: { ...form.perfilAcademico, institucion: e.target.value }
                  })}
                  placeholder="Ej. Universidad de Oriente (UDO), UCV, UNET..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

            </div>

            {/* Cursos y Certificaciones Dinámicos */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cursos, Diplomados y Certificaciones Adicionales
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cursos de adiestramiento en pesca, acuicultura, seguridad marítima o gestión pública.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCurso}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Curso</span>
                </button>
              </div>

              {form.perfilAcademico.cursosCertificaciones.length > 0 ? (
                <div className="space-y-3">
                  {form.perfilAcademico.cursosCertificaciones.map((curso, idx) => (
                    <div key={curso.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 items-end">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Nombre del Curso / Taller</label>
                        <input
                          type="text"
                          value={curso.nombreCurso}
                          onChange={(e) => updateCurso(curso.id, 'nombreCurso', e.target.value)}
                          placeholder="Ej. Manejo de Calidad en Cavas Frigoríficas"
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Institución Emisora</label>
                        <input
                          type="text"
                          value={curso.institucion}
                          onChange={(e) => updateCurso(curso.id, 'institucion', e.target.value)}
                          placeholder="Ej. INSOPESCA / FAO"
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Año</label>
                        <input
                          type="number"
                          value={curso.ano}
                          onChange={(e) => updateCurso(curso.id, 'ano', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono-numbers"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Horas</label>
                        <input
                          type="number"
                          value={curso.horasAcademicas || 0}
                          onChange={(e) => updateCurso(curso.id, 'horasAcademicas', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono-numbers"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeCurso(curso.id)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Eliminar curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                  No se han registrado certificaciones complementarias. Presione "Agregar Curso" para registrar diplomados o talleres.
                </div>
              )}
            </div>

          </div>
        )}

        {/* STEP 5: CARGA FAMILIAR Y SOCIOECONÓMICA */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Fase 5: Carga Familiar y Socioeconómica
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registro de beneficiarios para primas por hijos, guarderías, seguro de vida y situación habitacional.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addFamiliar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Familiar</span>
              </button>
            </div>

            {/* Lista dinámica de Familiares */}
            <div className="space-y-4">
              {form.cargaFamiliar.familiares.length > 0 ? (
                form.cargaFamiliar.familiares.map((fam, idx) => (
                  <div key={fam.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>Familiar: {fam.nombres || 'Nuevo Pariente'} ({fam.parentesco})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFamiliar(fam.id)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Parentesco */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Parentesco *
                        </label>
                        <select
                          value={fam.parentesco}
                          onChange={(e) => updateFamiliar(fam.id, 'parentesco', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="HIJO">Hijo</option>
                          <option value="HIJA">Hija</option>
                          <option value="CONYUGE">Cónyuge / Pareja</option>
                          <option value="MADRE">Madre</option>
                          <option value="PADRE">Padre</option>
                          <option value="HERMANO">Hermano</option>
                          <option value="HERMANA">Hermana</option>
                          <option value="OTRO">Otro Familiar</option>
                        </select>
                      </div>

                      {/* Nombres */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Nombres *
                        </label>
                        <input
                          type="text"
                          value={fam.nombres}
                          onChange={(e) => updateFamiliar(fam.id, 'nombres', e.target.value)}
                          placeholder="Ej. Diego Alejandro"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      {/* Apellidos */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          value={fam.apellidos}
                          onChange={(e) => updateFamiliar(fam.id, 'apellidos', e.target.value)}
                          placeholder="Ej. Gómez Bermúdez"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      {/* Cédula */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cédula (si aplica)
                        </label>
                        <input
                          type="text"
                          value={fam.cedula || ''}
                          onChange={(e) => updateFamiliar(fam.id, 'cedula', e.target.value)}
                          placeholder="Ej. 31.440.119"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                        />
                      </div>

                      {/* Fecha Nacimiento */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          value={fam.fechaNacimiento}
                          onChange={(e) => updateFamiliar(fam.id, 'fechaNacimiento', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                        />
                        <span className="text-[10px] text-slate-400">
                          Edad: {calcularEdad(fam.fechaNacimiento)} años
                        </span>
                      </div>

                      {/* Género */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Género
                        </label>
                        <select
                          value={fam.genero}
                          onChange={(e) => updateFamiliar(fam.id, 'genero', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>

                      {/* Condición Estudio (Prima) */}
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={fam.estudia}
                            onChange={(e) => updateFamiliar(fam.id, 'estudia', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span>Condición de Estudio (Prima Hijos)</span>
                        </label>
                      </div>

                      {/* Discapacidad */}
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={fam.discapacidad}
                            onChange={(e) => updateFamiliar(fam.id, 'discapacidad', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span>Discapacidad Certificada</span>
                        </label>
                      </div>

                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    No se han registrado familiares en la carga
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Presione el botón "Agregar Familiar" para consignar hijos, cónyuge o padres dependientes.
                  </p>
                  <button
                    type="button"
                    onClick={addFamiliar}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    + Registrar Primer Familiar
                  </button>
                </div>
              )}
            </div>

            {/* Datos de Vivienda */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Datos Socioeconómicos de Vivienda
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Vivienda
                  </label>
                  <select
                    value={form.cargaFamiliar.tipoVivienda}
                    onChange={(e) => setForm({
                      ...form,
                      cargaFamiliar: { ...form.cargaFamiliar, tipoVivienda: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="PROPIA">Vivienda Propia (Totalmente Pagada)</option>
                    <option value="ALQUILADA">Alquilada / Arrendada</option>
                    <option value="FAMILIAR">Casa Familiar / Padres o Parientes</option>
                    <option value="ADJUDICADA_GMVV">Adjudicada por Gran Misión Vivienda Venezuela (GMVV)</option>
                    <option value="OTRA">Otra Modalidad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observaciones Habitacionales / Crédito BANAVIH
                  </label>
                  <input
                    type="text"
                    value={form.cargaFamiliar.observacionesVivienda || ''}
                    onChange={(e) => setForm({
                      ...form,
                      cargaFamiliar: { ...form.cargaFamiliar, observacionesVivienda: e.target.value }
                    })}
                    placeholder="Ej. Crédito hipotecario en amortización..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 6: SALUD Y SEGURIDAD SOCIAL */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 6: Salud y Seguridad Social
                </h2>
                <p className="text-xs text-slate-500">
                  Ficha médica laboral, patologías crónicas, CONAPDIS y contactos de auxilio inmediato.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alergias Medicamentosas / Alimentarias
                </label>
                <input
                  type="text"
                  value={form.salud.alergias}
                  onChange={(e) => setForm({
                    ...form,
                    salud: { ...form.salud, alergias: e.target.value }
                  })}
                  placeholder="Ej. Penicilina, sulfas, mariscos, ninguna..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patologías Crónicas Diagnosticadas
                </label>
                <input
                  type="text"
                  value={form.salud.patologiasCronicas}
                  onChange={(e) => setForm({
                    ...form,
                    salud: { ...form.salud, patologiasCronicas: e.target.value }
                  })}
                  placeholder="Ej. Hipertensión arterial, Asma, Diabetes..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tratamiento Médico Permanente
                </label>
                <input
                  type="text"
                  value={form.salud.tratamientoPermanente}
                  onChange={(e) => setForm({
                    ...form,
                    salud: { ...form.salud, tratamientoPermanente: e.target.value }
                  })}
                  placeholder="Ej. Losartán 50mg diario, Insulina, etc."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

            </div>

            {/* Discapacidad Certificada CONAPDIS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={form.salud.discapacidadCertificada}
                  onChange={(e) => setForm({
                    ...form,
                    salud: { ...form.salud, discapacidadCertificada: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>El trabajador posee certificación de discapacidad CONAPDIS</span>
              </label>

              {form.salud.discapacidadCertificada && (
                <div className="pl-6 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° de Certificado CONAPDIS
                  </label>
                  <input
                    type="text"
                    value={form.salud.codigoConapdis || ''}
                    onChange={(e) => setForm({
                      ...form,
                      salud: { ...form.salud, codigoConapdis: e.target.value }
                    })}
                    placeholder="Ej. CONAPDIS-2024-DF-00123"
                    className="w-full sm:w-80 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              )}
            </div>

            {/* Contacto de Emergencia */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Contacto en Caso de Emergencia *
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    value={form.salud.contactoEmergenciaNombre}
                    onChange={(e) => setForm({
                      ...form,
                      salud: { ...form.salud, contactoEmergenciaNombre: e.target.value }
                    })}
                    placeholder="Ej. María Elena Salazar"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parentesco con el Servidor
                  </label>
                  <input
                    type="text"
                    value={form.salud.contactoEmergenciaParentesco}
                    onChange={(e) => setForm({
                      ...form,
                      salud: { ...form.salud, contactoEmergenciaParentesco: e.target.value }
                    })}
                    placeholder="Ej. Cónyuge, Madre, Hermano..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono de Emergencia *
                  </label>
                  <input
                    type="text"
                    value={form.salud.contactoEmergenciaTelefono}
                    onChange={(e) => setForm({
                      ...form,
                      salud: { ...form.salud, contactoEmergenciaTelefono: e.target.value }
                    })}
                    placeholder="Ej. 0414-7654321 / 0212..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 7: EXPEDIENTE DIGITAL */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fase 7: Expediente Digital (Soportes Probatorios)
                </h2>
                <p className="text-xs text-slate-500">
                  Zona de carga Drag & Drop para documentos probatorios reglamentarios del expediente institucional.
                </p>
              </div>
            </div>

            {/* Document list with individual Drop Zones */}
            <div className="space-y-3">
              {form.expedienteDigital.map((doc) => {
                const isLoaded = Boolean(doc.nombreArchivo);

                return (
                  <div 
                    key={doc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isLoaded 
                        ? 'bg-slate-50 border-slate-200' 
                        : doc.obligatorio 
                          ? 'bg-white border-dashed border-amber-300' 
                          : 'bg-white border-dashed border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isLoaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {doc.titulo}
                            </h4>
                            {doc.obligatorio && (
                              <span className="text-[10px] text-red-600 font-semibold">
                                * Obligatorio
                              </span>
                            )}
                            {isLoaded ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Cargado y Cotejado
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Pendiente por Cargar
                              </span>
                            )}
                          </div>
                          
                          {isLoaded ? (
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono-numbers">
                              Archivo: <strong className="text-slate-800">{doc.nombreArchivo}</strong> · {doc.tamanoKb} KB · Cargado el {doc.fechaCarga}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Formatos admitidos: PDF, JPG, PNG (Máx 5MB).
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isLoaded && onPreviewDocument && (
                          <button
                            type="button"
                            onClick={() => onPreviewDocument(doc)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Previsualizar</span>
                          </button>
                        )}

                        <label className="px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-xs flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isLoaded ? 'Reemplazar' : 'Subir Archivo'}</span>
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(doc.id, file);
                            }}
                          />
                        </label>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drag & Drop General Area info */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Norma de Custodia del Expediente Digital:</strong>
                Todos los documentos subidos son almacenados en el repositorio digital del Ministerio, garantizando la trazabilidad ante auditorías de la Contraloría General de la República y la Dirección General de Recursos Humanos.
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar / Volver
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Guardar Borrador</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          )}

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0B4F9C] hover:bg-[#083E7D] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>Siguiente Fase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar y Consolidar Expediente</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

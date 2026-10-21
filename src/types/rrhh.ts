/**
 * Tipos y definiciones de datos para el Sistema de Gestión de Capital Humano
 * Dirección General de Recursos Humanos - MPPPA
 */

export type CondicionLaboral = 
  | 'FIJO' 
  | 'CONTRATADO' 
  | 'ALTO_NIVEL' 
  | 'COMISION_SERVICIO' 
  | 'JUBILADO' 
  | 'PENSIONADO';

export type NivelInstruccion = 
  | 'PRIMARIA'
  | 'BACHILLER' 
  | 'TSU' 
  | 'UNIVERSITARIO' 
  | 'ESPECIALIZACION' 
  | 'MAESTRIA' 
  | 'DOCTORADO';

export type Parentesco = 
  | 'HIJO' 
  | 'HIJA' 
  | 'CONYUGE' 
  | 'MADRE' 
  | 'PADRE' 
  | 'HERMANO'
  | 'HERMANA'
  | 'OTRO';

export type TipoDocumentoSoporte = 
  | 'CEDULA' 
  | 'RIF' 
  | 'SINTESIS_CURRICULAR' 
  | 'FONDO_NEGRO_TITULO' 
  | 'PARTIDA_NACIMIENTO' 
  | 'ANTECEDENTES_FP023' 
  | 'FE_DE_VIDA'
  | 'CERTIFICADO_CONAPDIS'
  | 'OTRO';

export interface Familiar {
  id: string;
  parentesco: Parentesco;
  nombres: string;
  apellidos: string;
  cedula?: string;
  fechaNacimiento: string;
  genero: 'M' | 'F';
  estudia: boolean;
  discapacidad: boolean;
}

export interface CursoCertificacion {
  id: string;
  nombreCurso: string;
  institucion: string;
  ano: number;
  horasAcademicas?: number;
}

export interface DocumentoSoporte {
  id: string;
  tipo: TipoDocumentoSoporte;
  titulo: string;
  nombreArchivo: string;
  tamanoKb: number;
  fechaCarga: string;
  verificado: boolean;
  previewUrl?: string;
  obligatorio: boolean;
}

export interface IdentificacionBiometria {
  fotoUrl: string;
  tipoCedula: 'V' | 'E';
  cedula: string;
  tipoRif: 'V' | 'J' | 'E' | 'G';
  rif: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  genero: 'M' | 'F';
  estadoCivil: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONCUBINATO';
  lateralidad: 'DIESTRO' | 'ZURDO' | 'AMBIDIESTRO';
  tipoSangre: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  tallaCamisa: 'SS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  tallaPantalon: string; // ej. 30, 32, 34, etc.
  tallaCalzado: string; // ej. 37, 38, 41, etc.
}

export interface ContactoUbicacion {
  telefonoMovil: string;
  telefonoHabitacion: string;
  emailInstitucional: string;
  emailPersonal: string;
  estado: string;
  municipio: string;
  parroquia: string;
  sector: string;
  calleCasa: string;
}

export interface SituacionLaboral {
  condicion: CondicionLaboral;
  codigoNomina: string;
  cargoNominal: string;
  cargoFuncional: string;
  unidadAdministrativa: string;
  sedeRegion: string;
  fechaIngresoMinisterio: string; // YYYY-MM-DD
  anosServicioPrevioAPN: number;
  banco: string;
  cuentaNomina: string; // 20 dígitos
  poseeCarnet?: boolean;
  codigoCarnet?: string;
  estatusCarnet?: string;
}

export interface PerfilAcademico {
  nivelInstruccion: NivelInstruccion;
  profesionOficio: string;
  tituloObtenido: string;
  institucion: string;
  anoGraduacion: number;
  cursosCertificaciones: CursoCertificacion[];
}

export interface CargaFamiliarSocioeconomica {
  familiares: Familiar[];
  tipoVivienda: 'PROPIA' | 'ALQUILADA' | 'FAMILIAR' | 'ADJUDICADA_GMVV' | 'OTRA';
  observacionesVivienda?: string;
}

export interface SaludSeguridad {
  alergias: string;
  patologiasCronicas: string;
  discapacidadCertificada: boolean;
  codigoConapdis?: string;
  tratamientoPermanente: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaParentesco: string;
  contactoEmergenciaTelefono: string;
}

export interface CampoPersonalizado {
  id: string;
  etiqueta: string;
  valor: string;
  categoria?: 'IDENTIFICACION' | 'LABORAL' | 'SOCIOECONOMICO' | 'ACADEMICO' | 'SALUD' | 'OTRO';
}

export interface Funcionario {
  id: string;
  fechaRegistro: string;
  fechaUltimaActualizacion: string;
  identificacion: IdentificacionBiometria;
  contacto: ContactoUbicacion;
  situacionLaboral: SituacionLaboral;
  perfilAcademico: PerfilAcademico;
  cargaFamiliar: CargaFamiliarSocioeconomica;
  salud: SaludSeguridad;
  expedienteDigital: DocumentoSoporte[];
  camposPersonalizados?: CampoPersonalizado[];
  notasAuditoria?: string;
}

// Utilidades de cálculo normativo APN (Administración Pública Nacional)

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const fechaNac = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return isNaN(edad) ? 0 : edad;
}

export function calcularAntiguedad(fechaIngresoMinisterio: string, anosPreviosAPN: number = 0): {
  anosMinisterio: number;
  mesesMinisterio: number;
  anosTotalesAPN: number;
} {
  if (!fechaIngresoMinisterio) {
    return { anosMinisterio: 0, mesesMinisterio: 0, anosTotalesAPN: anosPreviosAPN || 0 };
  }
  const fechaIng = new Date(fechaIngresoMinisterio);
  const hoy = new Date();
  
  let anosMin = hoy.getFullYear() - fechaIng.getFullYear();
  let mesesMin = hoy.getMonth() - fechaIng.getMonth();
  
  if (mesesMin < 0 || (mesesMin === 0 && hoy.getDate() < fechaIng.getDate())) {
    anosMin--;
    mesesMin += 12;
  }
  if (anosMin < 0) anosMin = 0;
  if (mesesMin < 0) mesesMin = 0;

  const anosTotalesAPN = anosMin + (Number(anosPreviosAPN) || 0);

  return {
    anosMinisterio: anosMin,
    mesesMinisterio: mesesMin,
    anosTotalesAPN: anosTotalesAPN
  };
}

export function evaluarEstatusJubilacion(
  fechaNacimiento: string,
  genero: 'M' | 'F',
  fechaIngresoMinisterio: string,
  anosPreviosAPN: number
): {
  califica: boolean;
  proximo: boolean;
  motivo: string;
} {
  const edad = calcularEdad(fechaNacimiento);
  const { anosTotalesAPN } = calcularAntiguedad(fechaIngresoMinisterio, anosPreviosAPN);
  
  // Regla general de la Ley del Estatuto de la Función Pública:
  // Mujeres: 55 años de edad + mínimo 25 años de servicio
  // Hombres: 60 años de edad + mínimo 25 años de servicio
  // O 30 años de servicio continuos en APN
  const edadExigida = genero === 'F' ? 55 : 60;
  
  if (anosTotalesAPN >= 30) {
    return {
      califica: true,
      proximo: false,
      motivo: `Cumple tiempo máximo de servicio (${anosTotalesAPN} años en APN)`
    };
  }

  if (edad >= edadExigida && anosTotalesAPN >= 25) {
    return {
      califica: true,
      proximo: false,
      motivo: `Cumple edad reglamentaria (${edad} años) y servicio (${anosTotalesAPN} años APN)`
    };
  }

  // Próximo a jubilar: a menos de 2 años de la edad o del tiempo
  if ((edad >= edadExigida - 2 && anosTotalesAPN >= 23) || (anosTotalesAPN >= 28)) {
    return {
      califica: false,
      proximo: true,
      motivo: `Próximo a régimen de jubilación (Edad: ${edad}/${edadExigida}, Años APN: ${anosTotalesAPN}/25)`
    };
  }

  return {
    califica: false,
    proximo: false,
    motivo: `Activo regular (Edad: ${edad} años, Antigüedad APN: ${anosTotalesAPN} años)`
  };
}

export function calcularCompletitudExpediente(f: Partial<Funcionario>): {
  porcentaje: number;
  pendientes: string[];
  completo: boolean;
} {
  const pendientes: string[] = [];
  let puntos = 0;
  const maxPuntos = 12;

  // 1. Identificación básica
  if (f.identificacion?.cedula && f.identificacion?.nombres && f.identificacion?.apellidos) {
    puntos += 2;
  } else {
    pendientes.push('Datos personales de identificación');
  }

  // 2. Foto carnet
  if (f.identificacion?.fotoUrl) {
    puntos += 1;
  } else {
    pendientes.push('Fotografía tipo carnet');
  }

  // 3. Tallas de dotación
  if (f.identificacion?.tallaCamisa && f.identificacion?.tallaCalzado) {
    puntos += 1;
  } else {
    pendientes.push('Tallas de dotación de uniforme');
  }

  // 4. Contacto y ubicación
  if (f.contacto?.telefonoMovil && f.contacto?.estado && f.contacto?.municipio) {
    puntos += 2;
  } else {
    pendientes.push('Ubicación geográfica y teléfono móvil');
  }

  // 5. Situación laboral y cuenta nómina
  if (f.situacionLaboral?.condicion && f.situacionLaboral?.unidadAdministrativa && f.situacionLaboral?.fechaIngresoMinisterio) {
    puntos += 2;
  } else {
    pendientes.push('Situación administrativa y fecha de ingreso');
  }

  if (f.situacionLaboral?.cuentaNomina && f.situacionLaboral.cuentaNomina.replace(/\D/g, '').length === 20) {
    puntos += 1;
  } else {
    pendientes.push('Cuenta bancaria nómina (20 dígitos)');
  }

  // 6. Perfil académico
  if (f.perfilAcademico?.nivelInstruccion && f.perfilAcademico?.tituloObtenido) {
    puntos += 1;
  } else {
    pendientes.push('Perfil académico y título obtenido');
  }

  // 7. Salud y contacto de emergencia
  if (f.salud?.contactoEmergenciaNombre && f.salud?.contactoEmergenciaTelefono) {
    puntos += 1;
  } else {
    pendientes.push('Contacto en caso de emergencia');
  }

  // 8. Expediente Digital (Opcional - sin restricciones para nuevo registro)
  // No penaliza ni exige documentos obligatorios si se dejan en blanco
  const docs = f.expedienteDigital || [];
  const tieneDocs = docs.some(d => Boolean(d.nombreArchivo));
  if (tieneDocs) {
    puntos += 1;
  }

  const porcentaje = Math.min(100, Math.round((puntos / 11) * 100));
  return {
    porcentaje,
    pendientes,
    completo: porcentaje >= 100
  };
}

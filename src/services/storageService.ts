import { Funcionario } from '../types/rrhh';
import { INITIAL_FUNCIONARIOS } from '../data/mockData';
import { supabase } from './supabaseClient';

const LOCAL_CACHE_KEY = 'sigef_rrhh_supabase_cache_v1';

export type CloudSyncStatus = 'checking' | 'connected' | 'table_missing' | 'error';

interface FuncionarioDbRow {
  id: string;
  fecha_registro: string;
  fecha_ultima_actualizacion: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  cargo_nominal: string;
  unidad_administrativa: string;
  sede_region: string;
  condicion: string;
  identificacion: Funcionario['identificacion'];
  contacto: Funcionario['contacto'];
  situacion_laboral: Funcionario['situacionLaboral'];
  perfil_academico: Funcionario['perfilAcademico'];
  carga_familiar: Funcionario['cargaFamiliar'];
  salud: Funcionario['salud'];
  expediente_digital: Funcionario['expedienteDigital'];
  notas_auditoria?: string | null;
}

/**
 * Comprime imágenes base64 pesadas (ej. fotos de cámara de 5MB+) a formato carnet ligero (~25-40KB)
 * para evitar QuotaExceededError en localStorage y lentitud en consultas a Supabase.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxWidth = 420,
  maxHeight = 520,
  quality = 0.82
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 120_000) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

function toDbRow(f: Funcionario): FuncionarioDbRow {
  const cleanF = { ...f };
  delete cleanF.camposPersonalizados;

  return {
    id: cleanF.id,
    fecha_registro: cleanF.fechaRegistro || new Date().toISOString().split('T')[0],
    fecha_ultima_actualizacion: cleanF.fechaUltimaActualizacion || new Date().toISOString().split('T')[0],
    cedula: `${cleanF.identificacion.tipoCedula}-${cleanF.identificacion.cedula}`,
    nombres: cleanF.identificacion.nombres,
    apellidos: cleanF.identificacion.apellidos,
    cargo_nominal: cleanF.situacionLaboral.cargoNominal,
    unidad_administrativa: cleanF.situacionLaboral.unidadAdministrativa,
    sede_region: cleanF.situacionLaboral.sedeRegion,
    condicion: cleanF.situacionLaboral.condicion,
    identificacion: cleanF.identificacion,
    contacto: cleanF.contacto,
    situacion_laboral: cleanF.situacionLaboral,
    perfil_academico: cleanF.perfilAcademico,
    carga_familiar: cleanF.cargaFamiliar,
    salud: cleanF.salud,
    expediente_digital: cleanF.expedienteDigital || [],
    notas_auditoria: cleanF.notasAuditoria || null,
  };
}

function fromDbRow(row: any): Funcionario {
  return {
    id: row.id,
    fechaRegistro: row.fecha_registro || new Date().toISOString().split('T')[0],
    fechaUltimaActualizacion: row.fecha_ultima_actualizacion || new Date().toISOString().split('T')[0],
    identificacion: row.identificacion,
    contacto: row.contacto,
    situacionLaboral: row.situacion_laboral,
    perfilAcademico: row.perfil_academico,
    cargaFamiliar: row.carga_familiar,
    salud: row.salud,
    expedienteDigital: Array.isArray(row.expediente_digital) ? row.expediente_digital : [],
    notasAuditoria: row.notas_auditoria || undefined,
  };
}

export class StorageService {
  private static memoryCache: Funcionario[] | null = null;
  private static pendingSaves: Map<string, Funcionario> = new Map();
  private static syncStatus: CloudSyncStatus = 'checking';
  private static lastSyncError: string | null = null;

  static getSyncStatus(): { status: CloudSyncStatus; error: string | null } {
    return {
      status: this.syncStatus,
      error: this.lastSyncError,
    };
  }

  private static setStatus(status: CloudSyncStatus, error: string | null = null) {
    this.syncStatus = status;
    this.lastSyncError = error;
    window.dispatchEvent(new Event('sigef_cloud_status_changed'));
  }

  private static updateCache(list: Funcionario[]) {
    const cleaned = list.map(f => {
      const copy = { ...f };
      delete copy.camposPersonalizados;
      return copy;
    });
    this.memoryCache = cleaned;

    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cleaned));
    } catch {
      // Fallback seguro si algún archivo/foto excede la cuota de 5MB de localStorage:
      // guarda el 100% de los datos de texto y metadatos para no perder nunca registros ni actualizaciones
      try {
        const lightList = cleaned.map(f => ({
          ...f,
          identificacion: {
            ...f.identificacion,
            fotoUrl:
              f.identificacion?.fotoUrl && f.identificacion.fotoUrl.length > 150_000
                ? ''
                : f.identificacion?.fotoUrl || '',
          },
          expedienteDigital: (f.expedienteDigital || []).map(d => ({
            ...d,
            previewUrl: d.previewUrl && d.previewUrl.length > 150_000 ? undefined : d.previewUrl,
          })),
        }));
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(lightList));
      } catch {
        // ignore if storage completely disabled
      }
    }
    window.dispatchEvent(new Event('sigef_storage_updated'));
  }

  /**
   * Obtiene el listado en memoria o localStorage mientras se completa la consulta asíncrona a Supabase
   */
  static getFuncionarios(): Funcionario[] {
    if (this.memoryCache) {
      return this.memoryCache;
    }
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryCache = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    this.memoryCache = [...INITIAL_FUNCIONARIOS];
    return this.memoryCache;
  }

  /**
   * Consulta REAL a Supabase (SELECT) para obtener todos los funcionarios,
   * preservando cualquier guardado/actualización local reciente y optimizando fotos pesadas.
   */
  static async fetchFuncionariosFromCloud(): Promise<Funcionario[]> {
    this.setStatus('checking', null);
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('fecha_ultima_actualizacion', { ascending: false });

      if (error) {
        const code = (error as any).code || '';
        const msg = error.message || 'Error al consultar Supabase';
        if (code === '42P01' || code === 'PGRST205' || msg.includes('does not exist') || msg.includes('schema cache')) {
          this.setStatus('table_missing', 'Las tablas aún no han sido creadas en Supabase. Ejecute el script SQL provisto en el SQL Editor de Supabase.');
        } else {
          this.setStatus('error', msg);
        }
        return this.getFuncionarios();
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          const seedRows = INITIAL_FUNCIONARIOS.map(toDbRow);
          const { error: insertErr } = await supabase
            .from('funcionarios')
            .upsert(seedRows, { onConflict: 'id' });

          if (!insertErr) {
            this.setStatus('connected', null);
            this.updateCache(INITIAL_FUNCIONARIOS);
            return INITIAL_FUNCIONARIOS;
          }
        } else {
          const mapped = await Promise.all(
            data.map(async (row) => {
              const func = fromDbRow(row);
              // Si existe una actualización local pendiente o recién guardada, preservarla
              if (this.pendingSaves.has(func.id)) {
                return this.pendingSaves.get(func.id)!;
              }
              // Si la fotografía en la nube pesa más de 200KB (ej. 5.4MB de cámara cruda), comprimirla automáticamente
              if (func.identificacion?.fotoUrl && func.identificacion.fotoUrl.length > 200_000) {
                const compressedFoto = await compressBase64Image(func.identificacion.fotoUrl);
                if (compressedFoto.length < func.identificacion.fotoUrl.length) {
                  func.identificacion = {
                    ...func.identificacion,
                    fotoUrl: compressedFoto,
                  };
                  // Actualizar en segundo plano en Supabase para optimizar futuras cargas
                  supabase
                    .from('funcionarios')
                    .update({ identificacion: func.identificacion })
                    .eq('id', func.id)
                    .then(() => {});
                }
              }
              return func;
            })
          );

          // Incluir cualquier registro nuevo en pendingSaves que aún no haya aparecido en el SELECT
          for (const [pendingId, pendingFunc] of this.pendingSaves.entries()) {
            if (!mapped.some(m => m.id === pendingId)) {
              mapped.unshift(pendingFunc);
            }
          }

          this.setStatus('connected', null);
          this.updateCache(mapped);
          return mapped;
        }
      }

      this.setStatus('connected', null);
      return this.getFuncionarios();
    } catch (err: any) {
      this.setStatus('error', err?.message || 'Error de red al conectar con Supabase');
      return this.getFuncionarios();
    }
  }

  static getFuncionarioById(id: string): Funcionario | undefined {
    const list = this.getFuncionarios();
    return list.find(f => f.id === id);
  }

  /**
   * Busca si ya existe un funcionario registrado con el mismo número de cédula en la base de datos.
   * Selecciona solo columnas ligeras en Supabase para respuesta instantánea (<100ms).
   */
  static async findByCedula(
    cedula: string,
    tipoCedula: string = 'V',
    excludeId?: string
  ): Promise<{ existe: boolean; funcionario?: Funcionario }> {
    const cleanNum = (cedula || '').replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 4) {
      return { existe: false };
    }

    const cleanTipo = (tipoCedula || 'V').toUpperCase();

    // 1. Búsqueda en memoria / caché local
    const currentList = this.getFuncionarios();
    const foundInCache = currentList.find(f => {
      if (excludeId && f.id === excludeId) return false;
      const fNum = (f.identificacion?.cedula || '').replace(/\D/g, '');
      const fTipo = (f.identificacion?.tipoCedula || 'V').toUpperCase();
      return fNum === cleanNum && (!cleanTipo || !fTipo || fTipo === cleanTipo);
    });

    if (foundInCache) {
      return { existe: true, funcionario: foundInCache };
    }

    // 2. Consulta ligera y rápida en tiempo real a Supabase (sin descargar blobs de 10MB)
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, cedula, nombres, apellidos, cargo_nominal, unidad_administrativa, sede_region, condicion');

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          if (excludeId && row.id === excludeId) continue;
          const parts = String(row.cedula || '').split('-');
          const rowTipo = (parts.length > 1 ? parts[0] : 'V').toUpperCase();
          const rowNum = String(row.cedula || '').replace(/\D/g, '');
          if (rowNum === cleanNum && (!cleanTipo || !rowTipo || rowTipo === cleanTipo)) {
            const fullMatch = currentList.find(f => f.id === row.id);
            return {
              existe: true,
              funcionario: fullMatch || ({
                id: row.id,
                fechaRegistro: '',
                fechaUltimaActualizacion: '',
                identificacion: {
                  fotoUrl: '',
                  tipoCedula: (rowTipo === 'E' ? 'E' : 'V'),
                  cedula: rowNum,
                  tipoRif: 'V',
                  rif: '',
                  nombres: row.nombres || '',
                  apellidos: row.apellidos || '',
                  fechaNacimiento: '1990-01-01',
                  lugarNacimiento: '',
                  genero: 'M',
                  estadoCivil: 'SOLTERO',
                  lateralidad: 'DIESTRO',
                  tipoSangre: 'O+',
                  tallaCamisa: 'M',
                  tallaPantalon: '32',
                  tallaCalzado: '40',
                },
                contacto: {
                  telefonoMovil: '',
                  telefonoHabitacion: '',
                  emailInstitucional: '',
                  emailPersonal: '',
                  estado: '',
                  municipio: '',
                  parroquia: '',
                  sector: '',
                  calleCasa: '',
                },
                situacionLaboral: {
                  condicion: (row.condicion as any) || 'FIJO',
                  codigoNomina: '',
                  cargoNominal: row.cargo_nominal || '',
                  cargoFuncional: '',
                  unidadAdministrativa: row.unidad_administrativa || '',
                  sedeRegion: row.sede_region || '',
                  fechaIngresoMinisterio: '',
                  anosServicioPrevioAPN: 0,
                  banco: '',
                  cuentaNomina: '',
                },
                perfilAcademico: {
                  nivelInstruccion: 'UNIVERSITARIO',
                  profesionOficio: '',
                  tituloObtenido: '',
                  institucion: '',
                  anoGraduacion: 2020,
                  cursosCertificaciones: [],
                },
                cargaFamiliar: {
                  familiares: [],
                  tipoVivienda: 'PROPIA',
                },
                salud: {
                  alergias: '',
                  patologiasCronicas: '',
                  discapacidadCertificada: false,
                  tratamientoPermanente: '',
                  contactoEmergenciaNombre: '',
                  contactoEmergenciaParentesco: '',
                  contactoEmergenciaTelefono: '',
                },
                expedienteDigital: [],
              } as Funcionario),
            };
          }
        }
      }
    } catch {
      // Si falla la conexión a Supabase, se mantiene el resultado de la caché local
    }

    return { existe: false };
  }

  /**
   * Guarda o actualiza un funcionario en Supabase (UPSERT atómico) y actualiza
   * inmediatamente el estado en memoria y caché local para Inicio y Directorio.
   */
  static async saveFuncionario(
    funcionario: Funcionario
  ): Promise<{ success: boolean; error?: string; duplicateFuncionario?: Funcionario }> {
    // Condición estricta: No guardar en la base de datos si existen campos obligatorios vacíos
    const emptyFields: string[] = [];
    if (!funcionario.identificacion?.nombres?.trim()) emptyFields.push('Nombres');
    if (!funcionario.identificacion?.apellidos?.trim()) emptyFields.push('Apellidos');
    if (!funcionario.identificacion?.cedula?.trim()) emptyFields.push('Cédula de Identidad');
    if (!funcionario.identificacion?.rif?.trim()) emptyFields.push('RIF');
    if (!funcionario.identificacion?.fechaNacimiento?.trim()) emptyFields.push('Fecha de Nacimiento');
    if (!funcionario.contacto?.telefonoMovil?.trim()) emptyFields.push('Teléfono Móvil');
    if (!funcionario.contacto?.emailPersonal?.trim()) emptyFields.push('Correo Personal');
    if (!funcionario.contacto?.estado?.trim()) emptyFields.push('Estado');
    if (!funcionario.contacto?.municipio?.trim()) emptyFields.push('Municipio');
    if (!funcionario.situacionLaboral?.cargoNominal?.trim()) emptyFields.push('Cargo Nominal');
    if (!funcionario.situacionLaboral?.unidadAdministrativa?.trim()) emptyFields.push('Unidad Administrativa');
    if (!funcionario.situacionLaboral?.sedeRegion?.trim()) emptyFields.push('Sede/Región');
    if (!funcionario.situacionLaboral?.fechaIngresoMinisterio?.trim()) emptyFields.push('Fecha de Ingreso');

    if (emptyFields.length > 0) {
      return {
        success: false,
        error: `No se puede guardar en la base de datos: existen campos obligatorios vacíos (${emptyFields.join(', ')}).`,
      };
    }

    // Comprimir foto si es excesivamente grande antes de persistir
    let fotoOptimizada = funcionario.identificacion.fotoUrl || '';
    if (fotoOptimizada.length > 120_000) {
      fotoOptimizada = await compressBase64Image(fotoOptimizada);
    }

    const updated: Funcionario = {
      ...funcionario,
      identificacion: {
        ...funcionario.identificacion,
        fotoUrl: fotoOptimizada,
      },
      fechaUltimaActualizacion: new Date().toISOString().split('T')[0],
    };
    delete updated.camposPersonalizados;

    // 1. Actualizar inmediatamente la caché en memoria y localStorage ANTES de las llamadas de red
    // para que Inicio y Directorio reflejen el cambio al instante sin condiciones de carrera
    const currentList = [...this.getFuncionarios()];
    const existingIndex = currentList.findIndex(f => f.id === updated.id);
    const isUpdate = existingIndex >= 0;

    // Verificar duplicidad de cédula contra otros IDs en memoria
    const cleanNum = (updated.identificacion.cedula || '').replace(/\D/g, '');
    const cleanTipo = (updated.identificacion.tipoCedula || 'V').toUpperCase();
    const localDup = currentList.find(f => {
      if (f.id === updated.id) return false;
      const fNum = (f.identificacion?.cedula || '').replace(/\D/g, '');
      const fTipo = (f.identificacion?.tipoCedula || 'V').toUpperCase();
      return fNum === cleanNum && fTipo === cleanTipo;
    });

    if (localDup) {
      return {
        success: false,
        error: 'Empleado ya Registrado',
        duplicateFuncionario: localDup,
      };
    }

    this.pendingSaves.set(updated.id, updated);

    if (isUpdate) {
      currentList[existingIndex] = updated;
    } else {
      currentList.unshift(updated);
    }
    this.updateCache(currentList);

    const dbRow = toDbRow(updated);

    try {
      // 2. UPSERT atómico en Supabase: inserta si no existe o actualiza si ya existe el ID
      const { error: upsertError } = await supabase
        .from('funcionarios')
        .upsert([dbRow], { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }

      this.pendingSaves.delete(updated.id);

      // Registrar en bitácora de auditoría en Supabase (no bloqueante)
      supabase.from('bitacora_auditoria').insert([
        {
          accion: isUpdate ? 'ACTUALIZAR_EXPEDIENTE' : 'CREAR_EXPEDIENTE',
          funcionario_id: updated.id,
          detalle: `${updated.identificacion.tipoCedula}-${updated.identificacion.cedula} - ${updated.identificacion.nombres} ${updated.identificacion.apellidos}`,
          usuario: 'MariaP26',
        },
      ]).then(() => {});

      this.setStatus('connected', null);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar en Supabase';
      this.setStatus('error', msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Guarda una lista completa de funcionarios en Supabase (UPSERT masivo)
   */
  static async saveFuncionarios(list: Funcionario[]): Promise<{ success: boolean; error?: string }> {
    this.updateCache(list);
    try {
      const rows = list.map(toDbRow);
      const { error } = await supabase
        .from('funcionarios')
        .upsert(rows, { onConflict: 'id' });

      if (error) throw error;
      this.setStatus('connected', null);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error al sincronizar lote con Supabase';
      this.setStatus('error', msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Elimina un funcionario de Supabase (DELETE)
   */
  static async deleteFuncionario(id: string): Promise<boolean> {
    this.pendingSaves.delete(id);
    const list = this.getFuncionarios();
    const target = list.find(f => f.id === id);
    const filtered = list.filter(f => f.id !== id);
    this.updateCache(filtered);

    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (target) {
        supabase.from('bitacora_auditoria').insert([
          {
            accion: 'ELIMINAR_EXPEDIENTE',
            funcionario_id: id,
            detalle: `${target.identificacion.tipoCedula}-${target.identificacion.cedula} - ${target.identificacion.nombres} ${target.identificacion.apellidos}`,
            usuario: 'MariaP26',
          },
        ]).then(() => {});
      }

      this.setStatus('connected', null);
      return true;
    } catch (err: any) {
      this.setStatus('error', err?.message || 'Error al eliminar en Supabase');
      return false;
    }
  }

  /**
   * Restablece la base de datos en Supabase a los registros iniciales oficiales
   */
  static async resetToDefault(): Promise<void> {
    this.pendingSaves.clear();
    this.updateCache(INITIAL_FUNCIONARIOS);
    try {
      await supabase.from('funcionarios').delete().neq('id', '');
      const seedRows = INITIAL_FUNCIONARIOS.map(toDbRow);
      const { error } = await supabase
        .from('funcionarios')
        .upsert(seedRows, { onConflict: 'id' });
      if (error) throw error;
      this.setStatus('connected', null);
    } catch (err: any) {
      this.setStatus('error', err?.message || 'Error al restablecer datos en Supabase');
    }
  }

  static exportToJson(): void {
    const list = this.getFuncionarios();
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `SIGEF_RRHH_MPPPA_RESPALDO_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async importFromJson(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'El archivo JSON no contiene una lista válida de funcionarios.' };
      }
      const isValid = parsed.every(item => item && item.id && item.identificacion && item.situacionLaboral);
      if (!isValid) {
        return { success: false, count: 0, error: 'El archivo contiene registros que no cumplen la estructura de SIGEF-RRHH.' };
      }

      await this.saveFuncionarios(parsed);
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Error al procesar el archivo JSON.' };
    }
  }
}

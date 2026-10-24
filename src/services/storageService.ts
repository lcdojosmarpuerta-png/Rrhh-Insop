import { Funcionario, DocumentoSoporte } from '../types/rrhh';
import { INITIAL_FUNCIONARIOS } from '../data/mockData';
import { supabase } from './supabaseClient';

const LOCAL_CACHE_KEY = 'sigef_rrhh_supabase_cache_v1';
const LOCAL_CACHE_TIMESTAMP_KEY = 'sigef_rrhh_supabase_cache_ts_v1';
const CLOUD_FETCH_TTL_MS = 10 * 60 * 1000; // 10 minutos de caché para evitar descargas repetitivas (Egress)

/**
 * Columnas ligeras que se consultan por defecto para el Inicio y el Directorio.
 * Excluye `expediente_digital` (documentos escaneados en base64) para ahorrar hasta un 95% de Egress en Supabase.
 * `expediente_digital` se descarga bajo demanda (lazy-load) o usando la versión ligera en caché.
 */
const LIGHT_FUNCIONARIO_COLUMNS =
  'id, fecha_registro, fecha_ultima_actualizacion, cedula, nombres, apellidos, cargo_nominal, unidad_administrativa, sede_region, condicion, identificacion, contacto, situacion_laboral, perfil_academico, carga_familiar, salud, notas_auditoria';

export type CloudSyncStatus = 'checking' | 'connected' | 'table_missing' | 'error';

export interface EgressOptimizationStats {
  lastSyncTimestamp: number | null;
  cachedRecordsCount: number;
  estimatedSavedBytes: number;
  lazyLoadedDossiersCount: number;
}

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
 * Comprime imágenes base64 pesadas (ej. fotos de cámara de 5MB+) a formato carnet ultra-ligero (~15-30KB)
 * para reducir drásticamente el Egress de Supabase y evitar QuotaExceededError en localStorage.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxWidth = 320,
  maxHeight = 400,
  quality = 0.74
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 35_000) {
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
          // Intentar WebP primero (30% más ligero que JPEG) o JPEG como respaldo universal
          let compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }
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

/**
 * Comprime documentos probatorios en formato imagen (cédula, RIF, títulos escaneados)
 * manteniendo legibilidad de impresión en tamaño Carta (~75-120KB en vez de 4-8MB).
 */
export async function compressDocumentBase64(
  dataUrl: string,
  maxWidth = 1000,
  maxHeight = 1350,
  quality = 0.72
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 90_000) {
    return dataUrl;
  }
  return compressBase64Image(dataUrl, maxWidth, maxHeight, quality);
}

/**
 * Optimiza todos los documentos de un expediente digital antes de guardarlos en Supabase.
 */
async function optimizeExpedienteDigital(
  docs: DocumentoSoporte[] | undefined
): Promise<DocumentoSoporte[]> {
  if (!Array.isArray(docs) || docs.length === 0) return [];
  return Promise.all(
    docs.map(async (d) => {
      if (d.previewUrl && d.previewUrl.startsWith('data:image/') && d.previewUrl.length > 90_000) {
        const compressedUrl = await compressDocumentBase64(d.previewUrl);
        const newSizeKb = Math.max(1, Math.round((compressedUrl.length * 0.75) / 1024));
        return {
          ...d,
          previewUrl: compressedUrl,
          tamanoKb: newSizeKb,
        };
      }
      return d;
    })
  );
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

function fromDbRow(row: any, existingCached?: Funcionario): Funcionario {
  const cloudDocs = Array.isArray(row.expediente_digital) ? row.expediente_digital : null;
  const cachedDocs = existingCached?.expedienteDigital || [];

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
    // Si la consulta fue ligera (sin expediente_digital), conservar los metadatos/documentos de la caché local
    expedienteDigital: cloudDocs !== null ? cloudDocs : cachedDocs,
    notasAuditoria: row.notas_auditoria || undefined,
  };
}

export class StorageService {
  private static memoryCache: Funcionario[] | null = null;
  private static pendingSaves: Map<string, Funcionario> = new Map();
  private static loadedFullExpedienteIds: Set<string> = new Set();
  private static syncStatus: CloudSyncStatus = 'checking';
  private static lastSyncError: string | null = null;
  private static inFlightFetchPromise: Promise<Funcionario[]> | null = null;
  private static estimatedSavedBytes: number = 0;

  static getSyncStatus(): { status: CloudSyncStatus; error: string | null } {
    return {
      status: this.syncStatus,
      error: this.lastSyncError,
    };
  }

  static getEgressStats(): EgressOptimizationStats {
    let lastTs: number | null = null;
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_TIMESTAMP_KEY);
      if (raw) lastTs = Number(raw) || null;
    } catch {}
    const list = this.getFuncionarios();
    return {
      lastSyncTimestamp: lastTs,
      cachedRecordsCount: list.length,
      estimatedSavedBytes: this.estimatedSavedBytes,
      lazyLoadedDossiersCount: this.loadedFullExpedienteIds.size,
    };
  }

  private static setStatus(status: CloudSyncStatus, error: string | null = null) {
    this.syncStatus = status;
    this.lastSyncError = error;
    window.dispatchEvent(new Event('sigef_cloud_status_changed'));
  }

  private static isCacheFresh(): boolean {
    try {
      const rawTs = localStorage.getItem(LOCAL_CACHE_TIMESTAMP_KEY);
      const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
      if (!rawTs || !cachedData) return false;
      const elapsed = Date.now() - Number(rawTs);
      return elapsed >= 0 && elapsed < CLOUD_FETCH_TTL_MS;
    } catch {
      return false;
    }
  }

  private static markCacheTimestamp() {
    try {
      localStorage.setItem(LOCAL_CACHE_TIMESTAMP_KEY, String(Date.now()));
    } catch {}
  }

  private static updateCache(list: Funcionario[], updateTimestamp = false) {
    const cleaned = list.map(f => {
      const copy = { ...f };
      delete copy.camposPersonalizados;
      return copy;
    });
    this.memoryCache = cleaned;

    if (updateTimestamp) {
      this.markCacheTimestamp();
    }

    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cleaned));
    } catch {
      // Fallback seguro si algún archivo/foto excede la cuota de 5MB de localStorage
      try {
        const lightList = cleaned.map(f => ({
          ...f,
          identificacion: {
            ...f.identificacion,
            fotoUrl:
              f.identificacion?.fotoUrl && f.identificacion.fotoUrl.length > 100_000
                ? ''
                : f.identificacion?.fotoUrl || '',
          },
          expedienteDigital: (f.expedienteDigital || []).map(d => ({
            ...d,
            previewUrl: d.previewUrl && d.previewUrl.length > 80_000 ? undefined : d.previewUrl,
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
   * Obtiene el listado en memoria o localStorage sin generar tráfico hacia Supabase (0 bytes de Egress).
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
   * Consulta optimizada a Supabase con:
   * 1. Caché inteligente con TTL (evita re-descargar toda la tabla al recargar o cambiar de vista).
   * 2. Deduplicación de peticiones en vuelo (inFlightFetchPromise).
   * 3. Proyección ligera de columnas (`LIGHT_FUNCIONARIO_COLUMNS`) que omite `expediente_digital` (documentos base64 pesados),
   *    reduciendo el Egress de cada consulta global en más de un 90%.
   * 4. Respuestas mínimas (`returning: 'minimal'`) en escrituras automáticas.
   */
  static async fetchFuncionariosFromCloud(options?: { forceRefresh?: boolean }): Promise<Funcionario[]> {
    const force = options?.forceRefresh === true;

    // Si la caché local es reciente (< 10 min) y no es forzado, reutilizar sin consumir Egress
    if (!force && this.isCacheFresh()) {
      const cachedList = this.getFuncionarios();
      if (cachedList.length > 0) {
        this.estimatedSavedBytes += cachedList.length * 45_000;
        this.setStatus('connected', null);
        return cachedList;
      }
    }

    // Deduplicar peticiones simultáneas
    if (this.inFlightFetchPromise) {
      return this.inFlightFetchPromise;
    }

    this.inFlightFetchPromise = this.executeCloudFetch();
    try {
      return await this.inFlightFetchPromise;
    } finally {
      this.inFlightFetchPromise = null;
    }
  }

  private static async executeCloudFetch(): Promise<Funcionario[]> {
    this.setStatus('checking', null);
    try {
      const currentCached = this.getFuncionarios();
      const cachedById = new Map<string, Funcionario>(currentCached.map(f => [f.id, f]));

      // Consulta proyectada: NO descarga `expediente_digital` masivo en el listado general
      const { data, error } = await supabase
        .from('funcionarios')
        .select(LIGHT_FUNCIONARIO_COLUMNS)
        .order('fecha_ultima_actualizacion', { ascending: false });

      if (error) {
        const code = (error as any).code || '';
        const msg = error.message || 'Error al consultar Supabase';
        if (code === '42P01' || code === 'PGRST205' || msg.includes('does not exist') || msg.includes('schema cache')) {
          this.setStatus('table_missing', 'Las tablas aún no han sido creadas en Supabase. Ejecute el script SQL provisto en el SQL Editor de Supabase.');
        } else {
          this.setStatus('error', msg);
        }
        return currentCached;
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          const seedRows = INITIAL_FUNCIONARIOS.map(toDbRow);
          const { error: insertErr } = await supabase
            .from('funcionarios')
            .upsert(seedRows, { onConflict: 'id', returning: 'minimal' } as any);

          if (!insertErr) {
            this.setStatus('connected', null);
            this.updateCache(INITIAL_FUNCIONARIOS, true);
            return INITIAL_FUNCIONARIOS;
          }
        } else {
          this.estimatedSavedBytes += data.length * 120_000; // Ahorro estimado por omitir blobs de expediente_digital
          const mapped = await Promise.all(
            data.map(async (row: any) => {
              const existing = cachedById.get(row.id);
              const func = fromDbRow(row, existing);

              if (this.pendingSaves.has(func.id)) {
                return this.pendingSaves.get(func.id)!;
              }

              // Si la fotografía en la nube pesa más de 90KB, comprimirla y actualizar con returning: 'minimal'
              if (func.identificacion?.fotoUrl && func.identificacion.fotoUrl.length > 90_000) {
                const compressedFoto = await compressBase64Image(func.identificacion.fotoUrl);
                if (compressedFoto.length < func.identificacion.fotoUrl.length) {
                  func.identificacion = {
                    ...func.identificacion,
                    fotoUrl: compressedFoto,
                  };
                  supabase
                    .from('funcionarios')
                    .update({ identificacion: func.identificacion }, { returning: 'minimal' } as any)
                    .eq('id', func.id)
                    .then(() => {});
                }
              }
              return func;
            })
          );

          for (const [pendingId, pendingFunc] of this.pendingSaves.entries()) {
            if (!mapped.some(m => m.id === pendingId)) {
              mapped.unshift(pendingFunc);
            }
          }

          this.setStatus('connected', null);
          this.updateCache(mapped, true);
          return mapped;
        }
      }

      this.setStatus('connected', null);
      return currentCached;
    } catch (err: any) {
      this.setStatus('error', err?.message || 'Error de red al conectar con Supabase');
      return this.getFuncionarios();
    }
  }

  /**
   * Carga bajo demanda (Lazy Loading) únicamente la columna `expediente_digital` de un funcionario específico
   * cuando el usuario abre su Ficha 360°, edita el empleado o imprime sus documentos probatorios.
   * Evita descargar megabytes de documentos de todos los empleados en cada carga de página.
   */
  static async ensureExpedienteDigitalLoaded(funcionarioId: string): Promise<Funcionario | undefined> {
    const list = [...this.getFuncionarios()];
    const index = list.findIndex(f => f.id === funcionarioId);
    const localFunc = index >= 0 ? list[index] : undefined;

    if (!funcionarioId || this.loadedFullExpedienteIds.has(funcionarioId)) {
      return localFunc;
    }

    // Si ya tiene documentos con previewUrl en memoria, marcar como cargado
    if (localFunc?.expedienteDigital?.some(d => Boolean(d.previewUrl))) {
      this.loadedFullExpedienteIds.add(funcionarioId);
      return localFunc;
    }

    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, expediente_digital')
        .eq('id', funcionarioId)
        .maybeSingle();

      if (!error && data && Array.isArray((data as any).expediente_digital)) {
        const rawDocs: DocumentoSoporte[] = (data as any).expediente_digital;
        const optimizedDocs = await optimizeExpedienteDigital(rawDocs);
        this.loadedFullExpedienteIds.add(funcionarioId);

        if (index >= 0) {
          const updatedFunc: Funcionario = {
            ...list[index],
            expedienteDigital: optimizedDocs.length > 0 ? optimizedDocs : list[index].expedienteDigital,
          };
          list[index] = updatedFunc;
          this.updateCache(list, false);
          return updatedFunc;
        }
      }
    } catch {
      // Fallback silencioso a datos en caché
    }

    return localFunc;
  }

  static getFuncionarioById(id: string): Funcionario | undefined {
    const list = this.getFuncionarios();
    return list.find(f => f.id === id);
  }

  /**
   * Busca si ya existe un funcionario registrado con el mismo número de cédula.
   * 1. Primero verifica en la caché local en memoria (0 bytes de Egress).
   * 2. Si requiere consultar Supabase, filtra en el servidor con `.ilike('cedula', ...)` y `.limit(5)`
   *    en lugar de descargar toda la tabla de funcionarios.
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

    // 1. Búsqueda instantánea en memoria / caché local (0 Egress)
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

    // Si la caché está sincronizada y fresca, no es necesario hacer otra consulta a Supabase
    if (this.syncStatus === 'connected' && this.isCacheFresh() && currentList.length > 0) {
      this.estimatedSavedBytes += 4_000;
      return { existe: false };
    }

    // 2. Consulta filtrada a nivel de servidor en Supabase (solo filas que coincidan con la cédula, máx 5)
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, cedula, nombres, apellidos, cargo_nominal, unidad_administrativa, sede_region, condicion')
        .ilike('cedula', `%${cleanNum}%`)
        .limit(5);

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
   * Guarda o actualiza un funcionario en Supabase usando `returning: 'minimal'`
   * para que Supabase no devuelva el registro completo (con fotos y documentos base64) en la respuesta HTTP.
   */
  static async saveFuncionario(
    funcionario: Funcionario
  ): Promise<{ success: boolean; error?: string; duplicateFuncionario?: Funcionario }> {
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

    // Comprimir foto carnet y documentos base64 antes de persistir para minimizar el tamaño en BD y Egress futuro
    let fotoOptimizada = funcionario.identificacion.fotoUrl || '';
    if (fotoOptimizada.length > 35_000) {
      fotoOptimizada = await compressBase64Image(fotoOptimizada);
    }

    const docsOptimizados = await optimizeExpedienteDigital(funcionario.expedienteDigital);

    const updated: Funcionario = {
      ...funcionario,
      identificacion: {
        ...funcionario.identificacion,
        fotoUrl: fotoOptimizada,
      },
      expedienteDigital: docsOptimizados,
      fechaUltimaActualizacion: new Date().toISOString().split('T')[0],
    };
    delete updated.camposPersonalizados;

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

    // Si es una actualización y no se han cambiado datos, evitar llamada redundante a Supabase
    if (isUpdate && JSON.stringify(currentList[existingIndex]) === JSON.stringify(updated)) {
      this.estimatedSavedBytes += 35_000;
      return { success: true };
    }

    this.pendingSaves.set(updated.id, updated);
    this.loadedFullExpedienteIds.add(updated.id);

    if (isUpdate) {
      currentList[existingIndex] = updated;
    } else {
      currentList.unshift(updated);
    }
    this.updateCache(currentList, true);

    const dbRow = toDbRow(updated);

    try {
      // UPSERT con returning: 'minimal' -> 0 bytes de payload de retorno desde PostgREST
      const { error: upsertError } = await supabase
        .from('funcionarios')
        .upsert([dbRow], { onConflict: 'id', returning: 'minimal' } as any);

      if (upsertError) {
        throw upsertError;
      }

      this.pendingSaves.delete(updated.id);

      // Registrar en bitácora de auditoría con returning: 'minimal'
      supabase
        .from('bitacora_auditoria')
        .insert(
          [
            {
              accion: isUpdate ? 'ACTUALIZAR_EXPEDIENTE' : 'CREAR_EXPEDIENTE',
              funcionario_id: updated.id,
              detalle: `${updated.identificacion.tipoCedula}-${updated.identificacion.cedula} - ${updated.identificacion.nombres} ${updated.identificacion.apellidos}`,
              usuario: 'MariaP26',
            },
          ],
          { returning: 'minimal' } as any
        )
        .then(() => {});

      this.setStatus('connected', null);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar en Supabase';
      this.setStatus('error', msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Guarda una lista completa de funcionarios en Supabase optimizando imágenes y sin devolver el payload (`returning: 'minimal'`)
   */
  static async saveFuncionarios(list: Funcionario[]): Promise<{ success: boolean; error?: string }> {
    try {
      const optimizedList = await Promise.all(
        list.map(async (f) => {
          const foto =
            f.identificacion?.fotoUrl && f.identificacion.fotoUrl.length > 35_000
              ? await compressBase64Image(f.identificacion.fotoUrl)
              : f.identificacion?.fotoUrl || '';
          const docs = await optimizeExpedienteDigital(f.expedienteDigital);
          return {
            ...f,
            identificacion: {
              ...f.identificacion,
              fotoUrl: foto,
            },
            expedienteDigital: docs,
          };
        })
      );

      this.updateCache(optimizedList, true);

      const rows = optimizedList.map(toDbRow);
      const { error } = await supabase
        .from('funcionarios')
        .upsert(rows, { onConflict: 'id', returning: 'minimal' } as any);

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
   * Elimina un funcionario de Supabase (DELETE con returning: 'minimal')
   */
  static async deleteFuncionario(id: string): Promise<boolean> {
    this.pendingSaves.delete(id);
    this.loadedFullExpedienteIds.delete(id);
    const list = this.getFuncionarios();
    const target = list.find(f => f.id === id);
    const filtered = list.filter(f => f.id !== id);
    this.updateCache(filtered, true);

    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete({ returning: 'minimal' } as any)
        .eq('id', id);

      if (error) throw error;

      if (target) {
        supabase
          .from('bitacora_auditoria')
          .insert(
            [
              {
                accion: 'ELIMINAR_EXPEDIENTE',
                funcionario_id: id,
                detalle: `${target.identificacion.tipoCedula}-${target.identificacion.cedula} - ${target.identificacion.nombres} ${target.identificacion.apellidos}`,
                usuario: 'MariaP26',
              },
            ],
            { returning: 'minimal' } as any
          )
          .then(() => {});
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
    this.loadedFullExpedienteIds.clear();
    this.updateCache(INITIAL_FUNCIONARIOS, true);
    try {
      await supabase.from('funcionarios').delete({ returning: 'minimal' } as any).neq('id', '');
      const seedRows = INITIAL_FUNCIONARIOS.map(toDbRow);
      const { error } = await supabase
        .from('funcionarios')
        .upsert(seedRows, { onConflict: 'id', returning: 'minimal' } as any);
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

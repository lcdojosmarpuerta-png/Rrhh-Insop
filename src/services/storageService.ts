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

function toDbRow(f: Funcionario): FuncionarioDbRow {
  // Asegurar que no lleve camposPersonalizados obsoletos
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
    } catch (e) {
      // ignore cache write issues
    }
    window.dispatchEvent(new Event('sigef_storage_updated'));
  }

  /**
   * Obtiene el listado en memoria mientras se completa la consulta asíncrona a Supabase
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
    } catch (e) {
      // ignore
    }
    this.memoryCache = [...INITIAL_FUNCIONARIOS];
    return this.memoryCache;
  }

  /**
   * Consulta REAL a Supabase (SELECT) para obtener todos los funcionarios
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
          // Sembrar los datos iniciales en Supabase automáticamente si la tabla está recién creada y vacía
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
          const mapped = data.map(fromDbRow);
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
   * Busca si ya existe un funcionario registrado con el mismo número de cédula en la base de datos
   * Compara los dígitos numéricos en la caché local y en Supabase en la nube
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

    // 2. Consulta en tiempo real a Supabase en la nube
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          if (excludeId && row.id === excludeId) continue;
          const rowFunc = fromDbRow(row);
          const rowNum = (rowFunc.identificacion?.cedula || row.cedula || '').replace(/\D/g, '');
          const rowTipo = (rowFunc.identificacion?.tipoCedula || 'V').toUpperCase();
          if (rowNum === cleanNum && (!cleanTipo || !rowTipo || rowTipo === cleanTipo)) {
            return { existe: true, funcionario: rowFunc };
          }
        }
      }
    } catch (e) {
      // Si falla la conexión a Supabase, se mantiene el resultado de la caché local
    }

    return { existe: false };
  }

  /**
   * Guarda o actualiza un funcionario en Supabase (INSERT / UPDATE)
   * Valida previamente que no exista duplicidad de cédula para un nuevo registro
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

    // Verificación de duplicados por número de cédula
    const dupCheck = await this.findByCedula(
      funcionario.identificacion.cedula,
      funcionario.identificacion.tipoCedula,
      funcionario.id
    );

    if (dupCheck.existe && dupCheck.funcionario) {
      return {
        success: false,
        error: 'Empleado ya Registrado',
        duplicateFuncionario: dupCheck.funcionario,
      };
    }

    const updated: Funcionario = {
      ...funcionario,
      fechaUltimaActualizacion: new Date().toISOString().split('T')[0],
    };
    delete updated.camposPersonalizados;

    // Actualizar estado en memoria inmediatamente para respuesta instantánea de la UI
    const currentList = [...this.getFuncionarios()];
    const existingIndex = currentList.findIndex(f => f.id === updated.id);
    const isUpdate = existingIndex >= 0;

    if (isUpdate) {
      currentList[existingIndex] = updated;
    } else {
      currentList.unshift(updated);
    }
    this.updateCache(currentList);

    const dbRow = toDbRow(updated);

    try {
      if (isUpdate) {
        // Consulta UPDATE en Supabase
        const { error } = await supabase
          .from('funcionarios')
          .update(dbRow)
          .eq('id', updated.id);

        if (error) {
          // Respaldo con upsert si el registro no existía aún en la nube
          const { error: upsertError } = await supabase
            .from('funcionarios')
            .upsert([dbRow], { onConflict: 'id' });
          if (upsertError) throw upsertError;
        }
      } else {
        // Consulta INSERT en Supabase
        const { error } = await supabase
          .from('funcionarios')
          .insert([dbRow]);

        if (error) {
          const { error: upsertError } = await supabase
            .from('funcionarios')
            .upsert([dbRow], { onConflict: 'id' });
          if (upsertError) throw upsertError;
        }
      }

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
    this.updateCache(INITIAL_FUNCIONARIOS);
    try {
      // Eliminar registros actuales y sembrar los oficiales
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

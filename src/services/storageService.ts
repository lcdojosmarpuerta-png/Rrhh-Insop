import { Funcionario, CampoPersonalizado } from '../types/rrhh';
import { INITIAL_FUNCIONARIOS } from '../data/mockData';

const STORAGE_KEY = 'sigef_rrhh_mpppa_personal_v1';
const PRESET_FIELDS_KEY = 'sigef_campos_preestablecidos_v1';

export const INITIAL_PRESET_FIELDS: { etiqueta: string; categoria?: any }[] = [
  { etiqueta: 'Serial Carnet de la Patria', categoria: 'IDENTIFICACION' },
  { etiqueta: 'Rol de Sistema SIGEF', categoria: 'LABORAL' },
  { etiqueta: 'Resolución de Designación en Gaceta', categoria: 'LABORAL' },
  { etiqueta: 'Región Hidrográfica Asignada', categoria: 'LABORAL' }
];

export class StorageService {
  /**
   * Obtiene la lista oficial de campos preestablecidos del sistema
   */
  static getCamposPreestablecidos(): { etiqueta: string; categoria?: any }[] {
    try {
      const data = localStorage.getItem(PRESET_FIELDS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    // Si no existen, inicializar con los campos iniciales
    try {
      localStorage.setItem(PRESET_FIELDS_KEY, JSON.stringify(INITIAL_PRESET_FIELDS));
    } catch (e) {}
    return INITIAL_PRESET_FIELDS;
  }

  /**
   * Agrega un nuevo campo preestablecido y lo propaga a TODOS los expedientes existentes
   */
  static addCampoPreestablecido(campo: { etiqueta: string; categoria?: any; valorDefault?: string }): void {
    const etiquetaTrim = campo.etiqueta.trim();
    if (!etiquetaTrim) return;

    // 1. Guardar en la lista global de campos preestablecidos
    const currentDefs = this.getCamposPreestablecidos();
    const exists = currentDefs.some(d => d.etiqueta.toLowerCase() === etiquetaTrim.toLowerCase());
    if (!exists) {
      currentDefs.push({ etiqueta: etiquetaTrim, categoria: campo.categoria || 'OTRO' });
      try {
        localStorage.setItem(PRESET_FIELDS_KEY, JSON.stringify(currentDefs));
      } catch (e) {}
    }

    // 2. Propagar el campo a TODOS los expedientes existentes en la base de datos
    const list = this.getFuncionarios();
    let modifiedAny = false;

    const updatedList = list.map(f => {
      const campos = f.camposPersonalizados ? [...f.camposPersonalizados] : [];
      const hasField = campos.some(c => c.etiqueta.toLowerCase() === etiquetaTrim.toLowerCase());
      if (!hasField) {
        modifiedAny = true;
        campos.push({
          id: `cp-glob-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          etiqueta: etiquetaTrim,
          valor: campo.valorDefault || '',
          categoria: campo.categoria || 'OTRO'
        });
        return {
          ...f,
          camposPersonalizados: campos,
          fechaUltimaActualizacion: new Date().toISOString().split('T')[0]
        };
      }
      return f;
    });

    if (modifiedAny) {
      this.saveFuncionarios(updatedList);
    } else {
      window.dispatchEvent(new Event('sigef_storage_updated'));
    }
  }

  /**
   * Asegura que un funcionario tenga todos los campos preestablecidos
   */
  static populatePreestablecidosEnFuncionario(f: Funcionario): Funcionario {
    const presetDefs = this.getCamposPreestablecidos();
    const currentCampos = f.camposPersonalizados ? [...f.camposPersonalizados] : [];
    let added = false;

    presetDefs.forEach(preset => {
      const exists = currentCampos.some(c => c.etiqueta.toLowerCase() === preset.etiqueta.toLowerCase());
      if (!exists) {
        currentCampos.push({
          id: `cp-def-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          etiqueta: preset.etiqueta,
          valor: '',
          categoria: preset.categoria
        });
        added = true;
      }
    });

    if (added) {
      return { ...f, camposPersonalizados: currentCampos };
    }
    return f;
  }

  static getFuncionarios(): Funcionario[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const syncedInit = INITIAL_FUNCIONARIOS.map(f => this.populatePreestablecidosEnFuncionario(f));
        this.saveFuncionarios(syncedInit);
        return syncedInit;
      }
      const parsed: Funcionario[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out old demo dummy records (f-001-mpppa to f-015) to leave site clean with added data
        let cleaned = parsed.filter(item => !item.id.match(/^f-00\d-mpppa$|^f-01\d-mpppa$|-duplicate-check$/));
        
        let modified = cleaned.length !== parsed.length;
        INITIAL_FUNCIONARIOS.forEach(initF => {
          const existingIdx = cleaned.findIndex(existing => existing.id === initF.id || existing.identificacion.cedula === initF.identificacion.cedula);
          if (existingIdx === -1) {
            cleaned.push(initF);
            modified = true;
          }
        });

        // Ensure all funcionarios have all pre-established fields
        cleaned = cleaned.map(f => {
          const synced = this.populatePreestablecidosEnFuncionario(f);
          if (synced !== f) modified = true;
          return synced;
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      const syncedInit = INITIAL_FUNCIONARIOS.map(f => this.populatePreestablecidosEnFuncionario(f));
      this.saveFuncionarios(syncedInit);
      return syncedInit;
    } catch (e) {
      console.error('Error al leer de localStorage:', e);
      return INITIAL_FUNCIONARIOS.map(f => this.populatePreestablecidosEnFuncionario(f));
    }
  }

  static getFuncionarioById(id: string): Funcionario | undefined {
    const list = this.getFuncionarios();
    return list.find(f => f.id === id);
  }

  static saveFuncionarios(list: Funcionario[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('sigef_storage_updated'));
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }

  static saveFuncionario(funcionario: Funcionario): void {
    const list = this.getFuncionarios();
    const index = list.findIndex(f => f.id === funcionario.id);
    const updated = {
      ...funcionario,
      fechaUltimaActualizacion: new Date().toISOString().split('T')[0]
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveFuncionarios(list);
  }

  static deleteFuncionario(id: string): boolean {
    const list = this.getFuncionarios();
    const filtered = list.filter(f => f.id !== id);
    if (filtered.length !== list.length) {
      this.saveFuncionarios(filtered);
      return true;
    }
    return false;
  }

  static resetToDefault(): void {
    this.saveFuncionarios(INITIAL_FUNCIONARIOS);
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

  static importFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'El archivo JSON no contiene una lista válida de funcionarios.' };
      }
      // Simple validation for basic fields
      const isValid = parsed.every(item => item && item.id && item.identificacion && item.situacionLaboral);
      if (!isValid) {
        return { success: false, count: 0, error: 'El archivo contiene registros que no cumplen la estructura de SIGEF-RRHH.' };
      }

      this.saveFuncionarios(parsed);
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Error al procesar el archivo JSON.' };
    }
  }
}

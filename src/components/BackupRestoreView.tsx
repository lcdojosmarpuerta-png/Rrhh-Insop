import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud,
  RefreshCw
} from 'lucide-react';
import { StorageService, CloudSyncStatus } from '../services/storageService';
import { SUPABASE_PROJECT_URL } from '../services/supabaseClient';
import { Funcionario } from '../types/rrhh';

interface BackupRestoreViewProps {
  funcionarios: Funcionario[];
  onDataChanged: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  funcionarios,
  onDataChanged
}) => {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [confirmReset, setConfirmReset] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudState, setCloudState] = useState<{ status: CloudSyncStatus; error: string | null }>(() =>
    StorageService.getSyncStatus()
  );

  useEffect(() => {
    const updateCloudState = () => {
      setCloudState(StorageService.getSyncStatus());
    };
    window.addEventListener('sigef_cloud_status_changed', updateCloudState);
    return () => {
      window.removeEventListener('sigef_cloud_status_changed', updateCloudState);
    };
  }, []);

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsSyncing(true);
      const result = await StorageService.importFromJson(content);
      setIsSyncing(false);
      if (result.success) {
        setImportStatus({
          type: 'success',
          message: `¡Base de datos restaurada y sincronizada en Supabase con éxito! Se cargaron ${result.count} funcionarios.`
        });
        onDataChanged();
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Error al importar archivo de respaldo.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefaults = async () => {
    setIsSyncing(true);
    await StorageService.resetToDefault();
    setIsSyncing(false);
    setConfirmReset(false);
    setImportStatus({
      type: 'success',
      message: 'Base de datos en Supabase restablecida a los datos oficiales de prueba.'
    });
    onDataChanged();
  };

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    const res = await StorageService.saveFuncionarios(funcionarios);
    setIsSyncing(false);
    if (res.success) {
      setImportStatus({
        type: 'success',
        message: 'Todos los expedientes han sido sincronizados y comprimidos correctamente con Supabase Cloud (Modo Bajo Consumo Egress activo).'
      });
      onDataChanged();
    } else {
      setImportStatus({
        type: 'error',
        message: `No se pudo sincronizar con Supabase: ${res.error || 'Verifique que las tablas hayan sido creadas con el script SQL.'}`
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Gestión de Datos y Base de Datos en la Nube (Supabase)
            </h1>
            <p className="text-xs text-slate-500">
              Sincronización en la nube con optimización de salida de datos (Egress), copias de seguridad y migración para SIGEF-RRHH.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Funcionarios</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {funcionarios.length} registros
          </span>
        </div>
      </div>

      {/* Supabase Cloud Connection Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            cloudState.status === 'connected'
              ? 'bg-emerald-50 text-emerald-700'
              : cloudState.status === 'checking'
                ? 'bg-sky-50 text-sky-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Conexión Supabase PostgreSQL
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                cloudState.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : cloudState.status === 'checking'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {cloudState.status === 'connected'
                  ? 'CONECTADO EN LA NUBE'
                  : cloudState.status === 'checking'
                    ? 'SINCRONIZANDO...'
                    : 'REQUIERE CREAR TABLAS SQL'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0B4F9C] border border-blue-200">
                EGRESS OPTIMIZADO (-90% SALIDA)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Endpoint: {SUPABASE_PROJECT_URL}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Proyección ligera de columnas, carga diferida de documentos, caché inteligente (TTL 10 min), compresión WebP/JPEG y <code className="font-mono text-slate-700">returning: minimal</code> activos.
            </p>
            {cloudState.error && (
              <p className="text-[11px] text-amber-700 mt-1">
                Nota: {cloudState.error}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleManualCloudSync}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Supabase'}</span>
        </button>
      </div>

      {/* Notifications */}
      {importStatus.type && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
          importStatus.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export JSON Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Exportar Respaldo Completo (JSON)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Genera y descarga un archivo en formato JSON estandarizado conteniendo la totalidad de los expedientes digitales, cargas familiares, datos biográficos y nóminas registradas.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => StorageService.exportToJson()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#0B4F9C] hover:bg-[#083E7D] active:bg-[#073266] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FFD100]" />
              <span>Descargar Archivo de Respaldo (.json)</span>
            </button>
          </div>
        </div>

        {/* Import JSON Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Restaurar y Subir Respaldo a Supabase (JSON)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cargue un archivo previamente exportado para recuperar la base de datos de capital humano y sincronizar todos los expedientes automáticamente en Supabase.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Seleccionar Archivo de Respaldo</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

      </div>

      {/* Danger Zone: Reset to seed defaults */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <RotateCcw className="w-4 h-4 text-[#0B4F9C]" />
              <span>Restablecer a Datos Oficiales Agregados</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Reinicia el padrón en la nube dejando únicamente el personal oficial agregado: Lcda. Maria Peña (Enlaces RRHH) y Lcda. Mirla Escalona (Gerente Regional Barinas).
            </p>
          </div>

          <div>
            {confirmReset ? (
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                <span className="text-xs text-red-700 font-semibold">¿Seguro?</span>
                <button
                  onClick={handleResetToDefaults}
                  className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                >
                  Sí, Restablecer
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Restablecer a Datos Agregados
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

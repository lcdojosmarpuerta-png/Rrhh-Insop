import React from 'react';
import { X, FileText, CheckCircle2, Download, Printer, Shield } from 'lucide-react';
import { DocumentoSoporte } from '../types/rrhh';

interface DocumentViewerModalProps {
  documento: DocumentoSoporte | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documento,
  isOpen,
  onClose
}) => {
  if (!isOpen || !documento) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-800/80 flex items-center justify-center text-blue-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {documento.titulo}
              </h3>
              <p className="text-xs text-slate-400 font-mono-numbers">
                {documento.nombreArchivo} · {documento.tamanoKb} KB · {documento.fechaCarga}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Cotejado DGRRHH</span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Canvas Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center">
          {documento.previewUrl && documento.previewUrl.startsWith('data:image') ? (
            <div className="max-w-xl max-h-[70vh] bg-white p-2 rounded-lg shadow-md border border-slate-300">
              <img 
                src={documento.previewUrl} 
                alt={documento.titulo} 
                className="max-h-[65vh] w-auto mx-auto object-contain" 
              />
            </div>
          ) : (
            /* Official Simulated Government Document Sheet */
            <div className="bg-white w-full max-w-lg shadow-lg border border-slate-300 rounded-lg p-8 space-y-6 text-slate-800">
              
              {/* Document Letterhead */}
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-14 h-14 p-0.5 shrink-0">
                  <img
                    src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
                    alt="Logo INSOPESCA"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                    República Bolivariana de Venezuela
                  </div>
                  <div className="text-[11px] font-extrabold uppercase text-slate-900">
                    Ministerio del Poder Popular para la Pesca y Acuicultura
                  </div>
                  <div className="text-xs font-black text-[#0B4F9C] uppercase">
                    INSOPESCA · EXPEDIENTE DIGITAL
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Dirección General de Recursos Humanos · Repositorio Certificado
                  </div>
                </div>
              </div>

              {/* Document Identity Stamp */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>DOCUMENTO PROBATORIO OFICIAL</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {documento.tipo}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Título: <strong>{documento.titulo}</strong>
                </div>
                <div className="text-xs text-slate-600 font-mono-numbers">
                  Archivo Digital: <strong>{documento.nombreArchivo}</strong>
                </div>
                <div className="text-xs text-slate-600 font-mono-numbers">
                  Fecha de Carga: {documento.fechaCarga}
                </div>
              </div>

              {/* Watermark & Security Seal */}
              <div className="py-6 text-center border-y border-dashed border-slate-200 my-4 relative">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-600 text-emerald-700 mx-auto flex flex-col items-center justify-center p-1 text-[8px] font-bold uppercase rotate-[-6deg]">
                  <Shield className="w-5 h-5 mb-0.5 text-emerald-600" />
                  <span>COTEJADO</span>
                  <span>CONFORME</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Este soporte probatorio digital se encuentra debidamente validado y vinculado al expediente único del servidor público en el sistema SIGEF-RRHH.
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>SEGURIDAD DGRRHH-MPPPA</span>
                <span>REGISTRO AUDITABLE</span>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
};

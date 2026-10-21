/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Directorio } from './components/Directorio';
import { WizardCaptacion } from './components/WizardCaptacion';
import { FichaTrabajadorModal } from './components/FichaTrabajadorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { BackupRestoreView } from './components/BackupRestoreView';
import { LoginModal } from './components/LoginModal';
import { FooterCintillo } from './components/FooterCintillo';
import { StorageService } from './services/storageService';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Database 
} from 'lucide-react';
import { 
  Funcionario, 
  DocumentoSoporte, 
  calcularCompletitudExpediente, 
  evaluarEstatusJubilacion 
} from './types/rrhh';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string; nombre: string; cargo: string; rol: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sigef_auth_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Detectar si se accedió mediante el enlace compartido para mostrar únicamente el módulo de Registro Empleado
  const [isRegistroOnlyMode, setIsRegistroOnlyMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('modulo') || params.get('vista');
      if (mod === 'registro' || mod === 'registro-empleado' || mod === 'captacion') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [showCertificadoLoginModal, setShowCertificadoLoginModal] = useState(false);

  const [activeView, setActiveView] = useState<'dashboard' | 'directorio' | 'captacion' | 'respaldo'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('modulo') || params.get('vista');
      if (mod === 'registro' || mod === 'registro-empleado' || mod === 'captacion') {
        return 'captacion';
      }
    } catch {}
    return 'dashboard';
  });

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => StorageService.getFuncionarios());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleRegistroOnlyMode = (enabled: boolean) => {
    setIsRegistroOnlyMode(enabled);
    try {
      if (enabled) {
        setEditingFuncionario(null);
        setActiveView('captacion');
        const url = new URL(window.location.href);
        url.searchParams.set('modulo', 'registro');
        window.history.replaceState({}, '', url.toString());
      } else {
        localStorage.removeItem('sigef_modo_solo_registro');
        const url = new URL(window.location.href);
        url.searchParams.delete('modulo');
        url.searchParams.delete('vista');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  // Authentication Handlers
  const handleLogin = (user: { username: string; nombre: string; cargo: string; rol: string }) => {
    localStorage.setItem('sigef_auth_session', JSON.stringify(user));
    setCurrentUser(user);
    setShowCertificadoLoginModal(false);
    // Si el usuario certificado inicia sesión desde el modo compartido, desbloquear todos los módulos
    if (isRegistroOnlyMode) {
      handleToggleRegistroOnlyMode(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sigef_auth_session');
    setCurrentUser(null);
  };

  // Modals & Active Selections
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [viewingFicha, setViewingFicha] = useState<Funcionario | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<DocumentoSoporte | null>(null);
  const [directorioFilter, setDirectorioFilter] = useState<string | undefined>(undefined);

  // Sync state with storage & Supabase Cloud
  const reloadData = useCallback(() => {
    setFuncionarios([...StorageService.getFuncionarios()]);
  }, []);

  useEffect(() => {
    // Cargar inicialmente desde Supabase en la nube
    StorageService.fetchFuncionariosFromCloud().then((cloudData) => {
      setFuncionarios([...cloudData]);
    });

    const handleStorageUpdate = () => {
      reloadData();
    };
    window.addEventListener('sigef_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('sigef_storage_updated', handleStorageUpdate);
    };
  }, [reloadData]);

  // Metric counts for sidebar
  const totalFuncionarios = funcionarios.length;
  const totalCompletos = funcionarios.filter(f => calcularCompletitudExpediente(f).completo).length;
  const totalProximosJubilar = funcionarios.filter(f => {
    const j = evaluarEstatusJubilacion(
      f.identificacion.fechaNacimiento,
      f.identificacion.genero,
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    return j.proximo || j.califica;
  }).length;

  // Actions
  const handleStartNewRegistro = () => {
    setEditingFuncionario(null);
    setActiveView('captacion');
  };

  const handleEditFuncionario = (f: Funcionario) => {
    setEditingFuncionario(f);
    setActiveView('captacion');
    if (viewingFicha) {
      setViewingFicha(null);
    }
  };

  const handleSaveFuncionario = async (f: Funcionario, redirectAfterSave: boolean = false) => {
    await StorageService.saveFuncionario(f);
    reloadData();
    if (redirectAfterSave && !isRegistroOnlyMode) {
      setActiveView('directorio');
    }
  };

  const handleDeleteFuncionario = async (id: string) => {
    await StorageService.deleteFuncionario(id);
    reloadData();
  };

  const handlePrintFicha = (f: Funcionario) => {
    setViewingFicha(f);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleNavigateToDirectorioWithFilter = (filterCondition?: string) => {
    setDirectorioFilter(filterCondition);
    setActiveView('directorio');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      
      {/* Institutional Top Bar */}
      <Header
        onNewRegistro={handleStartNewRegistro}
        onSelectFuncionario={(f) => setViewingFicha(f)}
        funcionarios={funcionarios}
        activeView={activeView}
        currentUser={currentUser}
        onLogout={handleLogout}
        isRegistroOnlyMode={isRegistroOnlyMode}
        onToggleRegistroOnlyMode={handleToggleRegistroOnlyMode}
        onRequestCertificadoLogin={() => setShowCertificadoLoginModal(true)}
      />

      {/* Main Workspace with Sidebar (Sidebar hidden in Registro-Only mode) */}
      <div className="flex-1 flex overflow-hidden">
        
        {!isRegistroOnlyMode && (
          <Sidebar
            activeView={activeView}
            onViewChange={(view) => {
              if (view === 'captacion' && activeView !== 'captacion') {
                setEditingFuncionario(null);
              }
              if (view === 'directorio') {
                setDirectorioFilter(undefined);
              }
              setActiveView(view);
            }}
            totalFuncionarios={totalFuncionarios}
            totalCompletos={totalCompletos}
            totalProximosJubilar={totalProximosJubilar}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          />
        )}

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            
            {isRegistroOnlyMode ? (
              /* En modo compartido solo se visualiza el Módulo de Registro de Empleado */
              <WizardCaptacion
                initialFuncionario={null}
                onSave={handleSaveFuncionario}
                onCancel={() => {}}
                onPreviewDocument={(doc) => setPreviewingDocument(doc)}
                isRegistroOnlyMode={true}
                onToggleRegistroOnlyMode={handleToggleRegistroOnlyMode}
              />
            ) : (
              <>
                {/* View 1: Dashboard */}
                {activeView === 'dashboard' && (
                  <Dashboard
                    funcionarios={funcionarios}
                    onNavigateToDirectorio={handleNavigateToDirectorioWithFilter}
                    onNavigateToCaptacion={handleStartNewRegistro}
                    onSelectFuncionario={(f) => setViewingFicha(f)}
                  />
                )}

                {/* View 2: Directorio General */}
                {activeView === 'directorio' && (
                  <Directorio
                    funcionarios={funcionarios}
                    initialFilter={directorioFilter}
                    onViewFicha={(f) => setViewingFicha(f)}
                    onEditFuncionario={handleEditFuncionario}
                    onPrintFicha={handlePrintFicha}
                    onDeleteFuncionario={handleDeleteFuncionario}
                    currentUser={currentUser}
                  />
                )}

                {/* View 3: Captación y Censo (Wizard Maestro 7 Fases) */}
                {activeView === 'captacion' && (
                  <WizardCaptacion
                    initialFuncionario={editingFuncionario}
                    onSave={handleSaveFuncionario}
                    onCancel={() => setActiveView('directorio')}
                    onPreviewDocument={(doc) => setPreviewingDocument(doc)}
                    isRegistroOnlyMode={false}
                    onToggleRegistroOnlyMode={handleToggleRegistroOnlyMode}
                    onSelectExisting={(f) => setViewingFicha(f)}
                  />
                )}

                {/* View 4: Respaldo y Base de Datos */}
                {activeView === 'respaldo' && (
                  <BackupRestoreView
                    funcionarios={funcionarios}
                    onDataChanged={reloadData}
                  />
                )}
              </>
            )}

          </div>
        </main>
      </div>

      {/* Institutional Footer Cintillo by S&S Web Studio */}
      <FooterCintillo hasBottomNav={!isRegistroOnlyMode} />

      {/* Mobile Bottom Touch Navigation Bar (Pattern 1 Mobile Guidelines) */}
      {!isRegistroOnlyMode && (
        <nav 
          aria-label="Navegación móvil"
          className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around h-16 md:hidden px-1 shadow-2xl pb-safe"
        >
          {/* 1. Inicio */}
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              activeView === 'dashboard' ? 'text-[#FFD100]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Inicio</span>
          </button>

          {/* 2. Registro */}
          <button
            type="button"
            onClick={() => {
              setEditingFuncionario(null);
              setActiveView('captacion');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              activeView === 'captacion' ? 'text-[#FFD100]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Registro</span>
          </button>

          {/* 3. Directorio */}
          <button
            type="button"
            onClick={() => {
              setDirectorioFilter(undefined);
              setActiveView('directorio');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition-colors cursor-pointer relative ${
              activeView === 'directorio' ? 'text-[#FFD100]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {totalFuncionarios > 0 && (
                <span className="absolute -top-1 -right-3 px-1 min-w-[15px] h-3.5 bg-[#0B4F9C] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {totalFuncionarios}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1">Directorio</span>
          </button>

          {/* 4. Respaldo */}
          <button
            type="button"
            onClick={() => setActiveView('respaldo')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              activeView === 'respaldo' ? 'text-[#FFD100]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Respaldo</span>
          </button>
        </nav>
      )}

      {/* Modal 1: Ficha Integral del Trabajador 360° & Print preview */}
      <FichaTrabajadorModal
        funcionario={viewingFicha}
        isOpen={Boolean(viewingFicha)}
        onClose={() => setViewingFicha(null)}
        onEdit={handleEditFuncionario}
      />

      {/* Modal 2: Visor de Documentos Digitales */}
      <DocumentViewerModal
        documento={previewingDocument}
        isOpen={Boolean(previewingDocument)}
        onClose={() => setPreviewingDocument(null)}
      />

      {/* Institutional Authentication Modal */}
      {((!currentUser && !isRegistroOnlyMode) || showCertificadoLoginModal) && (
        <LoginModal
          onLoginSuccess={handleLogin}
          onCancel={isRegistroOnlyMode ? () => setShowCertificadoLoginModal(false) : undefined}
        />
      )}

    </div>
  );
}

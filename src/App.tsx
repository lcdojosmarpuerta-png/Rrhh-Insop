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

  const [activeView, setActiveView] = useState<'dashboard' | 'directorio' | 'captacion' | 'respaldo'>('dashboard');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => StorageService.getFuncionarios());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authentication Handlers
  const handleLogin = (user: { username: string; nombre: string; cargo: string; rol: string }) => {
    localStorage.setItem('sigef_auth_session', JSON.stringify(user));
    setCurrentUser(user);
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

  // Sync state with storage
  const reloadData = useCallback(() => {
    setFuncionarios(StorageService.getFuncionarios());
  }, []);

  useEffect(() => {
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

  const handleSaveFuncionario = (f: Funcionario) => {
    StorageService.saveFuncionario(f);
    reloadData();
    // After finalizing, return to Directorio
    setActiveView('directorio');
  };

  const handleDeleteFuncionario = (id: string) => {
    StorageService.deleteFuncionario(id);
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
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Sidebar */}
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

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
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
              />
            )}

            {/* View 4: Respaldo y Base de Datos */}
            {activeView === 'respaldo' && (
              <BackupRestoreView
                funcionarios={funcionarios}
                onDataChanged={reloadData}
              />
            )}

          </div>
        </main>
      </div>

      {/* Institutional Footer Cintillo by S&S Web Studio */}
      <FooterCintillo />

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
      {!currentUser && (
        <LoginModal onLoginSuccess={handleLogin} />
      )}

    </div>
  );
}

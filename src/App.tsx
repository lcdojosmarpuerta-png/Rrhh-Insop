/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Directorio } from './components/Directorio';
import { WizardCaptacion } from './components/WizardCaptacion';
import { FichaTrabajadorModal } from './components/FichaTrabajadorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { BackupRestoreView } from './components/BackupRestoreView';
import { LoginModal, SessionNotice } from './components/LoginModal';
import { FooterCintillo } from './components/FooterCintillo';
import { StorageService } from './services/storageService';
import { printExpedienteCarta } from './utils/printUtils';
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

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos exactos (600,000 ms)
const AUTH_SESSION_KEY = 'sigef_auth_session';
const DEVICE_ID_KEY = 'sigef_device_id';
const TAB_SESSION_KEY = 'sigef_tab_session_active';

interface AuthUser {
  username: string;
  nombre: string;
  cargo: string;
  rol: string;
}

interface StoredAuthSession {
  user: AuthUser;
  deviceId: string;
  deviceSignature: string;
  lastActivity: number;
}

function getBrowserDeviceSignature(): string {
  try {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const lang = navigator.language || '';
    const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    return `${platform}|${lang}|${screenRes}|${ua.slice(0, 80)}`;
  } catch {
    return 'unknown-device';
  }
}

function getOrCreateDeviceId(): { deviceId: string; isNewDevice: boolean } {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return { deviceId: existing, isNewDevice: false };
    }
    const created = `DEV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, created);
    return { deviceId: created, isNewDevice: true };
  } catch {
    return { deviceId: 'fallback-device', isNewDevice: true };
  }
}

function evaluateInitialSession(): { user: AuthUser | null; notice: SessionNotice | null } {
  try {
    const { deviceId, isNewDevice } = getOrCreateDeviceId();
    const signature = getBrowserDeviceSignature();
    const savedRaw = localStorage.getItem(AUTH_SESSION_KEY);
    const isTabActive = sessionStorage.getItem(TAB_SESSION_KEY) === 'true';

    // Si es un equipo nuevo o no existe sesión previa guardada
    if (isNewDevice || !savedRaw) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return {
        user: null,
        notice: {
          type: 'nuevo_equipo',
          message: 'Se ha detectado el inicio del sitio en este equipo. Inicie sesión con sus credenciales certificadas.'
        }
      };
    }

    const parsed = JSON.parse(savedRaw) as Partial<StoredAuthSession> & Partial<AuthUser>;

    // Si el formato guardado es antiguo (sin validación de equipo o sin timestamp de actividad)
    if (!parsed.user || !parsed.deviceId || !parsed.lastActivity) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return {
        user: null,
        notice: {
          type: 'nuevo_equipo',
          message: 'Verificación de equipo requerida. Por favor inicie sesión para vincular su acceso en este dispositivo.'
        }
      };
    }

    // Verificar coincidencia de identidad del equipo y firma del navegador
    if (parsed.deviceId !== deviceId || parsed.deviceSignature !== signature || !isTabActive) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return {
        user: null,
        notice: {
          type: 'nuevo_equipo',
          message: 'Nuevo inicio del sitio detectado en este equipo o navegador. Por seguridad institucional, inicie sesión.'
        }
      };
    }

    // Verificar si transcurrieron más de 10 minutos sin uso del sistema
    const elapsed = Date.now() - parsed.lastActivity;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(TAB_SESSION_KEY);
      return {
        user: null,
        notice: {
          type: 'inactividad',
          message: 'Su sesión fue cerrada automáticamente tras detectarse más de 10 minutos sin uso del sistema.'
        }
      };
    }

    return { user: parsed.user, notice: null };
  } catch {
    return { user: null, notice: null };
  }
}

export default function App() {
  const [initialAuth] = useState(() => evaluateInitialSession());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialAuth.user);
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(initialAuth.notice);
  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageSyncRef = useRef<number>(0);

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

  // Modals & Active Selections
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [viewingFicha, setViewingFicha] = useState<Funcionario | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<DocumentoSoporte | null>(null);
  const [directorioFilter, setDirectorioFilter] = useState<string | undefined>(undefined);

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
  const handleLogin = (user: AuthUser) => {
    const { deviceId } = getOrCreateDeviceId();
    const now = Date.now();
    lastActivityRef.current = now;
    lastStorageSyncRef.current = now;

    const sessionPayload: StoredAuthSession = {
      user,
      deviceId,
      deviceSignature: getBrowserDeviceSignature(),
      lastActivity: now
    };

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionPayload));
      sessionStorage.setItem(TAB_SESSION_KEY, 'true');
    } catch {}

    setCurrentUser(user);
    setSessionNotice(null);
    setShowCertificadoLoginModal(false);
    // Si el usuario certificado inicia sesión desde el modo compartido, desbloquear todos los módulos
    if (isRegistroOnlyMode) {
      handleToggleRegistroOnlyMode(false);
    }
  };

  const handleLogout = useCallback((reason?: 'inactividad' | 'manual') => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(TAB_SESSION_KEY);
    } catch {}
    setCurrentUser(null);
    setViewingFicha(null);
    setPreviewingDocument(null);

    if (reason === 'inactividad') {
      setSessionNotice({
        type: 'inactividad',
        message: 'Se detectaron 10 minutos sin uso del sistema. Por seguridad, su sesión ha sido cerrada automáticamente.'
      });
    } else {
      setSessionNotice(null);
    }
  }, []);

  // Detector de inactividad de 10 minutos (600,000 ms)
  useEffect(() => {
    if (!currentUser) return;

    const registerActivity = () => {
      const now = Date.now();
      // Si al volver a interactuar ya habían pasado los 10 minutos, cerrar sesión de inmediato
      if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('inactividad');
        return;
      }

      lastActivityRef.current = now;

      // Persistir la marca de tiempo cada 2 segundos como máximo para optimizar rendimiento
      if (now - lastStorageSyncRef.current > 2000) {
        lastStorageSyncRef.current = now;
        try {
          const raw = localStorage.getItem(AUTH_SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as StoredAuthSession;
            parsed.lastActivity = now;
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
          }
        } catch {}
      }
    };

    const checkInactivity = () => {
      const now = Date.now();
      try {
        const raw = localStorage.getItem(AUTH_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredAuthSession;
          if (parsed.lastActivity && parsed.lastActivity > lastActivityRef.current) {
            lastActivityRef.current = parsed.lastActivity;
          }
        }
      } catch {}

      if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('inactividad');
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, registerActivity, { passive: true });
    });

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const intervalId = window.setInterval(checkInactivity, 5000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, registerActivity);
      });
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [currentUser, handleLogout]);

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

  const handleSaveFuncionario = async (f: Funcionario, redirectAfterSave: boolean = false): Promise<boolean> => {
    const res = await StorageService.saveFuncionario(f);
    reloadData();
    if (!res.success) {
      console.warn('Aviso de sincronización:', res.error);
      if (res.duplicateFuncionario) {
        return false;
      }
    }
    if (redirectAfterSave && !isRegistroOnlyMode) {
      setActiveView('directorio');
    }
    return true;
  };

  const handleDeleteFuncionario = async (id: string) => {
    await StorageService.deleteFuncionario(id);
    reloadData();
  };

  const handlePrintFicha = (f: Funcionario) => {
    setViewingFicha(f);
    setTimeout(() => {
      printExpedienteCarta(f);
    }, 150);
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
        onLogout={() => handleLogout('manual')}
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-36 md:pb-24">
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

      {/* Institutional Footer Cintillo by S&S Web Studio - Siempre visible en pantalla */}
      <FooterCintillo hasBottomNav={!isRegistroOnlyMode && Boolean(currentUser) && !showCertificadoLoginModal} />

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
          sessionNotice={sessionNotice}
        />
      )}

    </div>
  );
}

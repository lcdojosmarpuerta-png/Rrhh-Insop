# Sistema Integral de Gestión de Capital Humano (SIGEF-RRHH) - Ministerio del Poder Popular para la Pesca y Acuicultura

Sistema de información gubernamental para la Dirección General de Recursos Humanos destinado al censo, captación, actualización y auditoría del expediente digital de funcionarios activos, contratados, jubilados y pensionados.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> - **Identidad Institucional:** Ministerio del Poder Popular para la Pesca y Acuicultura (MPPPA) - Dirección General de Recursos Humanos.
> - **Persistencia y Reportes:** Almacenamiento local persistente (`localStorage`) enriquecido con datos precargados realistas de la APN, con capacidad de exportación/importación de base de datos e impresión de Ficha Oficial / Constancia con membrete ministerial.
> - **Expediente Digital:** Área de carga de documentos probatorios con Drag & Drop, validación de formatos (PDF, JPG, PNG) y pesos, visualizador interactivo en modal y badges de estado de verificación.

---

### 1. Overview & Core Concept

El sistema **SIGEF-RRHH** es una plataforma SPA modular de alto rendimiento diseñada para estandarizar el registro administrativo de servidores públicos del MPPPA y sus entes adscritos (INSOPESCA, FONPESCA, CENIPA). Permite:
1. **Captación Integral**: Formulario maestro de 7 fases con cálculo automático de antigüedad acumulada en la APN, cálculo de porcentaje de completitud del expediente y validación estricta de documentos de identidad (V/E, RIF, Cuenta Nómina de 20 dígitos).
2. **Directorio y Búsqueda Rápida**: Listado dinámico con filtros multifactoriales (por Cédula, Condición laboral, Dependencia administrativa, Rango de antigüedad y Estado de expediente).
3. **Dashboard Analítico**: Indicadores de gestión de personal, alertas tempranas para procesos de jubilación (según régimen de la Ley del Estatuto de la Función Pública), distribución por direcciones de línea y sedes pesqueras.
4. **Ficha Oficial e Historial Digital**: Expediente 360° imprimible en formato de hoja de servicio ministerial, con sellos institucionales, código QR de verificación de autenticidad y visualizador de soportes probatorios.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Flujo de Censo y Captación (Wizard)**:
   - El analista de RRHH o el funcionario inicia un nuevo registro o edita uno existente.
   - Navega secuencialmente o mediante la barra de progreso lateral por los 7 módulos:
     1. *Identificación y Biometría* (Foto carnet, cédula, tallas de dotación textil/calzado, grupo sanguíneo).
     2. *Ubicación y Contacto* (Teléfonos, correos, desglose geográfico político-territorial).
     3. *Situación Administrativa* (Condición, nómina, cargo nominal vs funcional, adscripción, cálculo automático de años APN + años en el Ministerio, cuenta bancaria 20 dígitos).
     4. *Formación Académica* (Instrucción, profesiones marítimas/agropecuarias/administrativas, registro dinámico de certificaciones).
     5. *Carga Familiar* (Gestión dinámica de familiares con validación de asignaciones por hijos/guardería y condiciones especiales de discapacidad).
     6. *Salud y Seguridad Laboral* (Alergias, patologías crónicas, certificación CONAPDIS y contacto de emergencia).
     7. *Expediente Digital* (Carga y validación de soportes: Cédula, RIF, Síntesis Curricular, Títulos, FP-023, Fe de Vida).
   - Guardado automático y actualización en vivo del indicador de completitud (ej. "Expediente al 92%").

2. **Flujo del Directorio y Auditoría**:
   - Búsqueda en tiempo real desde el encabezado superior o la vista de directorio.
   - Paginación, ordenación y acceso instantáneo a la Ficha Resumen 360°, edición del expediente o impresión de la Hoja de Servicio.

3. **Flujo del Dashboard Estadístico**:
   - Monitoreo de KPIs: Total trabajadores, Fijos vs Contratados, Índice de expedientes completos, Próximos a Jubilarse (mujeres $\ge 55$ / hombres $\ge 60$ o 25+ años de servicio APN).
   - Visualización de distribución de personal por Dirección General (Acuicultura, Pesca Artesanal, Sanidad Pesquera, Despacho, etc.).

#### B. Visual Identity & Theme
- **Paleta Institucional Sobria**:
  - Azul Marino Profundo Institucional: `#1E3A8A` (Header, acentos principales, botones primarios).
  - Azul Océano / Pesca: `#0284C7` (Acentos de navegación y estados activos).
  - Fondo Estructural: `#F8FAFC` (Slate neutro para descanso visual en jornadas de carga intensiva).
  - Superficies y Tarjetas: `#FFFFFF` con bordes sutiles `border-slate-200`.
  - Acentos de Estado: Verde Esmeralda `#059669` (Expediente Completo / Activo), Ámbar `#D97706` (Próximo a Jubilar / Documento Pendiente), Rojo Carmesí `#DC2626` (Incompleto / Alerta de Salud).
- **Tipografía y Legibilidad**:
  - Interfaz y Títulos: `Plus Jakarta Sans` y `Manrope` para jerarquía limpia y ejecutiva.
  - Métricas, Cédulas, Cuentas Bancarias y Tablas: `font-mono tabular-nums` para alineación perfecta sin desplazamientos.
- **Top Bar Contract**:
  - Barra de 1 sola fila con membrete ministerial en una sola línea, buscador global por Cédula/Nombre y tarjeta compacta de analista de guardia.
- **Sidebar de Navegación**:
  - Colapsable, con accesos directos a Dashboard, Directorio de Funcionarios, Captación de Nuevo Expediente y Exportar/Importar Base de Datos.

---

### 3. Key Product Decisions & Trade-Offs

- **Persistencia en LocalStorage con Sincronización Reactiva**:
  - *Decisión*: Gestión del estado con un store centralizado que persiste en `localStorage` con precarga inicial de 8 funcionarios representativos con perfiles completos y diversos (Directores, Biólogos, Inspectores Pesqueros, Obreros de Acuicultura, Jubilados).
  - *Razón*: Garantiza que la aplicación funcione inmediatamente sin configuraciones complejas, preservando todos los cambios, altas y ediciones que realice el usuario.
- **Cálculo Automático de Antigüedad y Estatus de Jubilación**:
  - *Decisión*: Calcular en tiempo real la antigüedad total sumando la fecha de ingreso al Ministerio y los años reconocidos en la APN (antecedentes de servicio), evaluando automáticamente si el funcionario califica para el programa de jubilaciones.
  - *Razón*: Ahorra horas de cálculo manual a los analistas de personal y previene inconsistencias en primas de antigüedad.
- **Generador de Ficha Oficial Imprimible (Hoja de Servicio Ministerial)**:
  - *Decisión*: Plantilla optimizada para impresión (CSS `@media print`) con formato legal formal, membrete de la República Bolivariana de Venezuela, Ministerio de Pesca y Acuicultura, sellos de la DGRRHH y código QR con verificación digital.
  - *Razón*: Cumple con el requerimiento gubernamental de entrega de comprobantes físicos y expedientes en papel para auditorías de la Contraloría General.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SIGEF-RRHH ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│     Global State        │                             │    Persistent Store     │
│ (Personnel, UI Filters, │◄───────────────────────────►│ (localStorage + JSON    │
│  Active View, Selection)│                             │  Export / Backup Seed)  │
└─────────────────────────┘                             └─────────────────────────┘
     │
     ├───────────────────────────────────────────────────────┐
     ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│    App Navigation Bar   │                             │  Sidebar Navigation     │
│  - Ministerial Header   │                             │  - Dashboard Analítico  │
│  - Live Cédula Search   │                             │  - Directorio General   │
│  - User Profile & Role  │                             │  - Formulario Captación │
└─────────────────────────┘                             │  - Respaldar / Cargar   │
     │                                                  └─────────────────────────┘
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Main Content Views                            │
├─────────────────────────┬─────────────────────────┬─────────────────────┤
│ 1. Dashboard View       │ 2. Directorio Personal  │ 3. Formulario       │
│  - KPI Cards            │  - Tabla filtrable      │    Maestro (Wizard) │
│  - Demografía Laboral   │  - Paginación dinámica  │  - 7 Módulos        │
│  - Alertas Jubilación   │  - Acciones rápidas     │  - Carga Familiar   │
│  - Gráfico Adscripciones│  - Ficha 360° modal     │  - Drag & Drop Docs │
│                         │  - Impresión de Ficha   │  - Barra progreso % │
└─────────────────────────┴─────────────────────────┴─────────────────────┘
```

#### Estructura de Entidades de Datos
- **`Funcionario`**:
  - `id`: Identificador único UUID.
  - `identificacion`: Cédula (V/E), RIF, Nombres, Apellidos, Nacimiento, Lugar, Género, Estado Civil, Lateralidad, Grupo Sanguíneo, Tallas (camisa, pantalón, calzado), Foto (DataURL o avatar oficial).
  - `contacto`: Teléfono móvil, habitación, email institucional, email personal, dirección completa (Estado, Municipio, Parroquia, Sector, Calle/Casa).
  - `situacionLaboral`: Condición (Fijo, Contratado, Alto Nivel, Comisión, Jubilado, Pensionado), Código Nómina, Cargo Nominal, Cargo Funcional, Unidad/Dirección, Sede/Región, Fecha Ingreso, Años APN previo, Antigüedad Total calculada, Banco, Cuenta Nómina (20 dígitos).
  - `perfilAcademico`: Nivel de instrucción, Profesión/Oficio, Títulos, Institución, Año de grado, Cursos adicionales.
  - `cargaFamiliar`: Lista de parientes (`nombre`, `parentesco`, `cedula`, `fechaNacimiento`, `genero`, `estudia`, `discapacidad`), Datos de Vivienda (Propia, Alquilada, Familiar).
  - `salud`: Alergias, Patologías crónicas, Discapacidad certificada CONAPDIS, Tratamiento permanente, Contacto emergencia (Nombre, parentesco, teléfono).
  - `expedienteDigital`: Registro de soportes (`tipo`, `nombreArchivo`, `tamano`, `fechaCarga`, `verificado`, `previewUrl`).
  - `completitud`: Porcentaje calculado (0-100%) y campos pendientes.

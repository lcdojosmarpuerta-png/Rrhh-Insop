import {
  Funcionario,
  DocumentoSoporte,
  calcularEdad,
  calcularAntiguedad,
  calcularCompletitudExpediente,
  evaluarEstatusJubilacion,
} from '../types/rrhh';

function escapeHtml(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerIframePrint(htmlContent: string) {
  const existingIframe = document.getElementById('sigef-print-iframe');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'sigef-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const waitForImagesAndPrint = () => {
    const images = Array.from(doc.images || []);
    const promises = images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    Promise.all(promises).then(() => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('Error al invocar impresión en iframe:', err);
          window.print();
        }
      }, 250);
    });
  };

  if (doc.readyState === 'complete') {
    waitForImagesAndPrint();
  } else {
    iframe.onload = waitForImagesAndPrint;
  }
}

/**
 * Imprime la Ficha / Expediente Integral del Trabajador en formato Tamaño Carta (Letter 8.5" x 11")
 * mostrando el 100% de la información registrada en las 7 fases.
 */
export function printExpedienteCarta(funcionario: Funcionario) {
  const {
    identificacion,
    contacto,
    situacionLaboral,
    perfilAcademico,
    cargaFamiliar,
    salud,
    expedienteDigital,
    fechaRegistro,
    fechaUltimaActualizacion,
    notasAuditoria,
  } = funcionario;

  const edad = calcularEdad(identificacion.fechaNacimiento);
  const antiguedad = calcularAntiguedad(
    situacionLaboral.fechaIngresoMinisterio,
    situacionLaboral.anosServicioPrevioAPN
  );
  const completitud = calcularCompletitudExpediente(funcionario);
  const jubilacion = evaluarEstatusJubilacion(
    identificacion.fechaNacimiento,
    identificacion.genero,
    situacionLaboral.fechaIngresoMinisterio,
    situacionLaboral.anosServicioPrevioAPN
  );

  const origin = window.location.origin;
  const logoInsopesca = `${origin}/assets/aistudio/LOGO-INSOPESCA_83aabce5.png`;
  const logoSys = `${origin}/assets/aistudio/1791899989619_db0f9485.jpg`;

  const fotoHtml = identificacion.fotoUrl
    ? `<img src="${identificacion.fotoUrl}" alt="Foto Carnet" class="photo-box" />`
    : `<div class="photo-placeholder">FOTO<br/>CARNET<br/>INSOPESCA</div>`;

  const cursosHtml =
    perfilAcademico.cursosCertificaciones && perfilAcademico.cursosCertificaciones.length > 0
      ? `<table class="data-table">
          <thead>
            <tr>
              <th>Nombre del Curso / Taller / Certificación</th>
              <th>Institución Capacitadora</th>
              <th>Año</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            ${perfilAcademico.cursosCertificaciones
              .map(
                c => `
              <tr>
                <td><strong>${escapeHtml(c.nombreCurso)}</strong></td>
                <td>${escapeHtml(c.institucion)}</td>
                <td>${escapeHtml(c.ano)}</td>
                <td>${escapeHtml(c.horasAcademicas || 0)} horas</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<div class="empty-note">Sin cursos o certificaciones adicionales registradas.</div>`;

  const familiaresHtml =
    cargaFamiliar.familiares && cargaFamiliar.familiares.length > 0
      ? `<table class="data-table">
          <thead>
            <tr>
              <th>Parentesco</th>
              <th>Nombres y Apellidos</th>
              <th>Cédula</th>
              <th>Fecha Nac. / Edad</th>
              <th>Género</th>
              <th>Estudia</th>
              <th>Discapacidad</th>
            </tr>
          </thead>
          <tbody>
            ${cargaFamiliar.familiares
              .map(
                fam => `
              <tr>
                <td><strong>${escapeHtml(fam.parentesco)}</strong></td>
                <td>${escapeHtml(fam.nombres)} ${escapeHtml(fam.apellidos)}</td>
                <td>${escapeHtml(fam.cedula || 'Menor s/c')}</td>
                <td>${escapeHtml(fam.fechaNacimiento)} (${calcularEdad(fam.fechaNacimiento)} años)</td>
                <td>${fam.genero === 'M' ? 'Masculino' : 'Femenino'}</td>
                <td>${fam.estudia ? 'SÍ' : 'NO'}</td>
                <td>${fam.discapacidad ? 'SÍ' : 'NO'}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : `<div class="empty-note">Sin carga familiar declarada en el expediente.</div>`;

  const docsHtml =
    expedienteDigital && expedienteDigital.length > 0
      ? `<table class="data-table">
          <thead>
            <tr>
              <th>Recaudo / Documento del Expediente Digital (Fase 7)</th>
              <th>Tipo</th>
              <th>Estatus</th>
              <th>Archivo / Tamaño</th>
              <th>Fecha Carga</th>
            </tr>
          </thead>
          <tbody>
            ${expedienteDigital
              .map(d => {
                const cargado = Boolean(d.nombreArchivo);
                return `
              <tr>
                <td><strong>${escapeHtml(d.titulo)}</strong></td>
                <td>${escapeHtml(d.tipo)}</td>
                <td>${cargado ? '<span class="badge-ok">✓ CARGADO Y COTEJADO</span>' : '<span class="badge-pending">OPCIONAL / EN BLANCO</span>'}</td>
                <td>${cargado ? `${escapeHtml(d.nombreArchivo)} (${escapeHtml(d.tamanoKb)} KB)` : '—'}</td>
                <td>${escapeHtml(d.fechaCarga || '—')}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>`
      : `<div class="empty-note">Sin registro de documentos digitales.</div>`;

  const carnetLabel = situacionLaboral.poseeCarnet
    ? `SÍ POSEE ${situacionLaboral.codigoCarnet ? `(Cód: ${situacionLaboral.codigoCarnet})` : ''} ${situacionLaboral.estatusCarnet ? `[${situacionLaboral.estatusCarnet}]` : ''}`
    : `NO POSEE ${situacionLaboral.estatusCarnet ? `(${situacionLaboral.estatusCarnet})` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Expediente Carta - ${escapeHtml(identificacion.tipoCedula)}-${escapeHtml(identificacion.cedula)} ${escapeHtml(identificacion.nombres)} ${escapeHtml(identificacion.apellidos)}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.75cm 0.95cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 8.6pt;
      line-height: 1.3;
    }
    .sheet {
      width: 100%;
      max-width: 19.7cm;
      margin: 0 auto;
    }
    .tricolor {
      height: 5px;
      display: grid;
      grid-template-columns: 5fr 4fr 3fr;
      margin-bottom: 6px;
      border-radius: 2px;
      overflow: hidden;
    }
    .tri-y { background: #FFD100; }
    .tri-b { background: #0B4F9C; }
    .tri-r { background: #D91424; }
    .inst-header {
      border-bottom: 2px solid #0f2537;
      padding-bottom: 6px;
      margin-bottom: 7px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .inst-logo {
      width: 54px;
      height: 54px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .inst-center {
      flex: 1;
      text-align: center;
      line-height: 1.22;
    }
    .inst-center .rep {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #475569;
    }
    .inst-center .min {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e293b;
    }
    .inst-center .ins {
      font-size: 9.5pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0B4F9C;
    }
    .inst-center .sub {
      font-size: 7.5pt;
      font-weight: 700;
      color: #334155;
    }
    .inst-right {
      text-align: right;
      font-size: 7pt;
      color: #334155;
      line-height: 1.3;
      flex-shrink: 0;
      border: 1px solid #cbd5e1;
      padding: 4px 7px;
      border-radius: 4px;
      background: #f8fafc;
    }
    .doc-title-bar {
      background: #0f2537;
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;
    }
    .doc-title-bar h1 {
      margin: 0;
      font-size: 9.8pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .doc-title-bar span {
      font-size: 7.8pt;
      font-weight: 700;
      background: #FFD100;
      color: #0f172a;
      padding: 1.5px 8px;
      border-radius: 3px;
    }
    .hero-card {
      display: flex;
      gap: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 7px 9px;
      background: #f8fafc;
      margin-bottom: 7px;
      align-items: center;
    }
    .photo-box {
      width: 2.4cm;
      height: 2.9cm;
      object-fit: cover;
      border: 1.5px solid #0B4F9C;
      border-radius: 4px;
      flex-shrink: 0;
      background: #fff;
    }
    .photo-placeholder {
      width: 2.4cm;
      height: 2.9cm;
      border: 1.5px dashed #64748b;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 6.8pt;
      font-weight: 700;
      color: #64748b;
      flex-shrink: 0;
      background: #fff;
    }
    .hero-details {
      flex: 1;
    }
    .hero-name {
      font-size: 12pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .hero-cargo {
      font-size: 8.8pt;
      font-weight: 700;
      color: #0B4F9C;
      margin: 0 0 5px 0;
      text-transform: uppercase;
    }
    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .badge {
      font-size: 7.2pt;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .section {
      margin-bottom: 7px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-header {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: 800;
      font-size: 8pt;
      text-transform: uppercase;
      padding: 3.5px 8px;
      border-bottom: 1px solid #cbd5e1;
      letter-spacing: 0.3px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px 9px;
      padding: 5px 8px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px 9px;
      padding: 5px 8px;
    }
    .col-span-2 { grid-column: span 2; }
    .col-span-3 { grid-column: span 3; }
    .col-span-4 { grid-column: span 4; }
    .field {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 1px;
    }
    .field-value {
      font-size: 8pt;
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 3.5px 6px;
      font-size: 6.8pt;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
    }
    .data-table td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .empty-note {
      padding: 5px 8px;
      font-size: 7.5pt;
      color: #64748b;
      font-style: italic;
    }
    .badge-ok {
      color: #047857;
      font-weight: 800;
      font-size: 7pt;
    }
    .badge-pending {
      color: #64748b;
      font-weight: 700;
      font-size: 7pt;
    }
    .apn-banner {
      background: #f0f9ff;
      border-top: 1px solid #bae6fd;
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.6pt;
    }
    .signatures {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      padding-top: 6px;
    }
    .sig-box {
      text-align: center;
      padding-top: 28px;
      position: relative;
    }
    .sig-line {
      border-top: 1px solid #334155;
      padding-top: 3px;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 6.8pt;
      color: #475569;
    }
    .stamp-circle {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(-6deg);
      width: 62px;
      height: 62px;
      border: 1.5px dashed #0B4F9C;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 5.2pt;
      font-weight: 900;
      color: #0B4F9C;
      line-height: 1.1;
      opacity: 0.85;
      pointer-events: none;
    }
    .footer-meta {
      margin-top: 8px;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="tricolor">
      <div class="tri-y"></div>
      <div class="tri-b"></div>
      <div class="tri-r"></div>
    </div>

    <div class="inst-header">
      <img src="${logoInsopesca}" alt="INSOPESCA" class="inst-logo" />
      <div class="inst-center">
        <div class="rep">República Bolivariana de Venezuela</div>
        <div class="min">Ministerio del Poder Popular para la Pesca y Acuicultura</div>
        <div class="ins">Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)</div>
        <div class="sub">Dirección General de Recursos Humanos · Sistema Integrado SIGEF-RRHH</div>
      </div>
      <div class="inst-right">
        <strong>HOJA DE SERVICIO (CARTA)</strong><br/>
        ID: <strong>${escapeHtml(funcionario.id)}</strong><br/>
        Registro: ${escapeHtml(fechaRegistro)}<br/>
        Actualizado: ${escapeHtml(fechaUltimaActualizacion)}<br/>
        Completitud: <strong>${completitud.porcentaje}%</strong>
      </div>
    </div>

    <div class="doc-title-bar">
      <h1>Expediente Integral de Personal Activo y Jubilado</h1>
      <span>${escapeHtml(situacionLaboral.condicion)}</span>
    </div>

    <div class="hero-card">
      ${fotoHtml}
      <div class="hero-details">
        <div class="hero-name">${escapeHtml(identificacion.nombres)} ${escapeHtml(identificacion.apellidos)}</div>
        <div class="hero-cargo">${escapeHtml(situacionLaboral.cargoNominal)} — ${escapeHtml(situacionLaboral.unidadAdministrativa)}</div>
        <div class="badges-row">
          <span class="badge">C.I.: ${escapeHtml(identificacion.tipoCedula)}-${escapeHtml(identificacion.cedula)}</span>
          <span class="badge">RIF: ${escapeHtml(identificacion.tipoRif)}-${escapeHtml(identificacion.rif)}</span>
          <span class="badge">Cód. Nómina: ${escapeHtml(situacionLaboral.codigoNomina)}</span>
          <span class="badge">Sede/Región: ${escapeHtml(situacionLaboral.sedeRegion)}</span>
          <span class="badge">Antigüedad Total APN: ${antiguedad.anosTotalesAPN} años</span>
        </div>
      </div>
    </div>

    <!-- FASE 1: IDENTIFICACIÓN Y BIOMETRÍA -->
    <div class="section">
      <div class="section-header">Fase 1: Datos de Identificación, Biometría y Dotación</div>
      <div class="grid-4">
        <div class="field">
          <span class="field-label">Nombres Completos</span>
          <span class="field-value">${escapeHtml(identificacion.nombres)}</span>
        </div>
        <div class="field">
          <span class="field-label">Apellidos Completos</span>
          <span class="field-value">${escapeHtml(identificacion.apellidos)}</span>
        </div>
        <div class="field">
          <span class="field-label">Cédula de Identidad</span>
          <span class="field-value">${escapeHtml(identificacion.tipoCedula)}-${escapeHtml(identificacion.cedula)}</span>
        </div>
        <div class="field">
          <span class="field-label">RIF SENIAT</span>
          <span class="field-value">${escapeHtml(identificacion.tipoRif)}-${escapeHtml(identificacion.rif)}</span>
        </div>
        <div class="field">
          <span class="field-label">Fecha de Nacimiento / Edad</span>
          <span class="field-value">${escapeHtml(identificacion.fechaNacimiento)} (${edad} años)</span>
        </div>
        <div class="field">
          <span class="field-label">Lugar de Nacimiento</span>
          <span class="field-value">${escapeHtml(identificacion.lugarNacimiento)}</span>
        </div>
        <div class="field">
          <span class="field-label">Género / Estado Civil</span>
          <span class="field-value">${identificacion.genero === 'M' ? 'Masculino' : 'Femenino'} / ${escapeHtml(identificacion.estadoCivil)}</span>
        </div>
        <div class="field">
          <span class="field-label">Lateralidad / Grupo Sanguíneo</span>
          <span class="field-value">${escapeHtml(identificacion.lateralidad)} / ${escapeHtml(identificacion.tipoSangre)}</span>
        </div>
        <div class="field col-span-4">
          <span class="field-label">Tallas de Dotación Textil y Calzado</span>
          <span class="field-value">Camisa: ${escapeHtml(identificacion.tallaCamisa)} &nbsp;|&nbsp; Pantalón: ${escapeHtml(identificacion.tallaPantalon)} &nbsp;|&nbsp; Calzado: ${escapeHtml(identificacion.tallaCalzado)}</span>
        </div>
      </div>
    </div>

    <!-- FASE 2: CONTACTO Y UBICACIÓN -->
    <div class="section">
      <div class="section-header">Fase 2: Contacto y Ubicación Geográfica Domiciliaria</div>
      <div class="grid-4">
        <div class="field">
          <span class="field-label">Teléfono Móvil (WhatsApp)</span>
          <span class="field-value">${escapeHtml(contacto.telefonoMovil)}</span>
        </div>
        <div class="field">
          <span class="field-label">Teléfono Habitación</span>
          <span class="field-value">${escapeHtml(contacto.telefonoHabitacion || 'N/A')}</span>
        </div>
        <div class="field">
          <span class="field-label">Correo Personal</span>
          <span class="field-value">${escapeHtml(contacto.emailPersonal)}</span>
        </div>
        <div class="field">
          <span class="field-label">Correo Institucional</span>
          <span class="field-value">${escapeHtml(contacto.emailInstitucional || 'N/A')}</span>
        </div>
        <div class="field">
          <span class="field-label">Estado Geográfico</span>
          <span class="field-value">${escapeHtml(contacto.estado)}</span>
        </div>
        <div class="field">
          <span class="field-label">Municipio / Parroquia</span>
          <span class="field-value">${escapeHtml(contacto.municipio)} / ${escapeHtml(contacto.parroquia)}</span>
        </div>
        <div class="field">
          <span class="field-label">Sector / Urbanización</span>
          <span class="field-value">${escapeHtml(contacto.sector)}</span>
        </div>
        <div class="field">
          <span class="field-label">Calle / Av. / Casa o Edif.</span>
          <span class="field-value">${escapeHtml(contacto.calleCasa)}</span>
        </div>
      </div>
    </div>

    <!-- FASE 3: SITUACIÓN LABORAL -->
    <div class="section">
      <div class="section-header">Fase 3: Situación Administrativa, Laboral y Nómina (APN / INSOPESCA)</div>
      <div class="grid-4">
        <div class="field">
          <span class="field-label">Condición Laboral</span>
          <span class="field-value">${escapeHtml(situacionLaboral.condicion)}</span>
        </div>
        <div class="field">
          <span class="field-label">Código de Nómina</span>
          <span class="field-value">${escapeHtml(situacionLaboral.codigoNomina)}</span>
        </div>
        <div class="field">
          <span class="field-label">Fecha Ingreso Organismo</span>
          <span class="field-value">${escapeHtml(situacionLaboral.fechaIngresoMinisterio)}</span>
        </div>
        <div class="field">
          <span class="field-label">Carnet Institucional</span>
          <span class="field-value">${escapeHtml(carnetLabel)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Cargo Nominal (RAC)</span>
          <span class="field-value">${escapeHtml(situacionLaboral.cargoNominal)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Cargo Funcional / Desempeño</span>
          <span class="field-value">${escapeHtml(situacionLaboral.cargoFuncional || situacionLaboral.cargoNominal)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Unidad Administrativa de Adscripción</span>
          <span class="field-value">${escapeHtml(situacionLaboral.unidadAdministrativa)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Sede / Región Pesquera</span>
          <span class="field-value">${escapeHtml(situacionLaboral.sedeRegion)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Entidad Bancaria Nómina</span>
          <span class="field-value">${escapeHtml(situacionLaboral.banco)}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Número de Cuenta Nómina (20 Dígitos)</span>
          <span class="field-value">${escapeHtml(situacionLaboral.cuentaNomina || 'No asignada')}</span>
        </div>
      </div>
      <div class="apn-banner">
        <div>
          <strong>Antigüedad Total Consolidada APN: ${antiguedad.anosTotalesAPN} años</strong>
          (${antiguedad.anosMinisterio} años, ${antiguedad.mesesMinisterio} meses en INSOPESCA/MPPPA + ${escapeHtml(situacionLaboral.anosServicioPrevioAPN)} años previos en APN)
        </div>
        <div><strong>Estatus Jubilación:</strong> ${escapeHtml(jubilacion.motivo)}</div>
      </div>
    </div>

    <!-- FASE 4: PERFIL ACADÉMICO -->
    <div class="section">
      <div class="section-header">Fase 4: Perfil Académico y Certificaciones</div>
      <div class="grid-4">
        <div class="field">
          <span class="field-label">Nivel de Instrucción</span>
          <span class="field-value">${escapeHtml(perfilAcademico.nivelInstruccion)}</span>
        </div>
        <div class="field">
          <span class="field-label">Profesión u Oficio</span>
          <span class="field-value">${escapeHtml(perfilAcademico.profesionOficio)}</span>
        </div>
        <div class="field">
          <span class="field-label">Título Académico Obtenido</span>
          <span class="field-value">${escapeHtml(perfilAcademico.tituloObtenido)}</span>
        </div>
        <div class="field">
          <span class="field-label">Institución y Año de Grado</span>
          <span class="field-value">${escapeHtml(perfilAcademico.institucion)} (${escapeHtml(perfilAcademico.anoGraduacion)})</span>
        </div>
      </div>
      ${cursosHtml}
    </div>

    <!-- FASE 5: CARGA FAMILIAR Y SOCIOECONÓMICO -->
    <div class="section">
      <div class="section-header">Fase 5: Carga Familiar y Condición Socioeconómica / Vivienda</div>
      <div class="grid-3">
        <div class="field">
          <span class="field-label">Tenencia / Tipo de Vivienda</span>
          <span class="field-value">${escapeHtml(cargaFamiliar.tipoVivienda)}</span>
        </div>
        <div class="field">
          <span class="field-label">Total Carga Familiar Registrada</span>
          <span class="field-value">${cargaFamiliar.familiares?.length || 0} integrante(s)</span>
        </div>
        <div class="field">
          <span class="field-label">Observaciones Habitacionales / BANAVIH</span>
          <span class="field-value">${escapeHtml(cargaFamiliar.observacionesVivienda || 'Sin observaciones')}</span>
        </div>
      </div>
      ${familiaresHtml}
    </div>

    <!-- FASE 6: SALUD Y SEGURIDAD -->
    <div class="section">
      <div class="section-header">Fase 6: Salud, Seguridad Social y Contacto de Emergencia</div>
      <div class="grid-4">
        <div class="field">
          <span class="field-label">Alergias Medicamentosas / Alim.</span>
          <span class="field-value">${escapeHtml(salud.alergias || 'Ninguna')}</span>
        </div>
        <div class="field">
          <span class="field-label">Patologías Crónicas</span>
          <span class="field-value">${escapeHtml(salud.patologiasCronicas || 'Ninguna')}</span>
        </div>
        <div class="field">
          <span class="field-label">Tratamiento Médico Permanente</span>
          <span class="field-value">${escapeHtml(salud.tratamientoPermanente || 'Ninguno')}</span>
        </div>
        <div class="field">
          <span class="field-label">Certificación CONAPDIS</span>
          <span class="field-value">${salud.discapacidadCertificada ? `SÍ (${escapeHtml(salud.codigoConapdis || 'Certificado')})` : 'NO'}</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Contacto en Caso de Emergencia</span>
          <span class="field-value">${escapeHtml(salud.contactoEmergenciaNombre)} (${escapeHtml(salud.contactoEmergenciaParentesco)})</span>
        </div>
        <div class="field col-span-2">
          <span class="field-label">Teléfono de Auxilio / Emergencia</span>
          <span class="field-value">${escapeHtml(salud.contactoEmergenciaTelefono)}</span>
        </div>
      </div>
    </div>

    <!-- FASE 7: EXPEDIENTE DIGITAL -->
    <div class="section">
      <div class="section-header">Fase 7: Soportes Probatorios del Expediente Digital y Auditoría</div>
      ${docsHtml}
      ${
        notasAuditoria
          ? `<div class="grid-3"><div class="field col-span-3"><span class="field-label">Notas de Auditoría RRHH</span><span class="field-value">${escapeHtml(notasAuditoria)}</span></div></div>`
          : ''
      }
    </div>

    <!-- FIRMAS Y SELLOS OFICIALES -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line">${escapeHtml(identificacion.nombres)} ${escapeHtml(identificacion.apellidos)}</div>
        <div class="sig-sub">C.I. ${escapeHtml(identificacion.tipoCedula)}-${escapeHtml(identificacion.cedula)} · Firma del Servidor Público</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Lcda. Maria Peña</div>
        <div class="sig-sub">Enlaces RRHH · Gestión Humana INSOPESCA</div>
      </div>
      <div class="sig-box">
        <div class="stamp-circle">
          <span>INSOPESCA</span>
          <span>GERENCIA REG.</span>
          <span>BARINAS</span>
          <span>AUTORIZADO</span>
          <span>2026</span>
        </div>
        <div class="sig-line">Lcda. Mirla Escalona</div>
        <div class="sig-sub">Gerente Regional Barinas · INSOPESCA</div>
      </div>
    </div>

    <div class="footer-meta">
      <span>Documento oficial emitido en Tamaño Carta (Letter 8.5" × 11") · Sistema SIGEF-RRHH INSOPESCA / MPPPA</span>
      <span style="display:flex;align-items:center;gap:5px;">
        <img src="${logoSys}" alt="S&S" style="height:12px;width:auto;object-fit:contain;" />
        Sistema Diseñado y Elaborado por S&S Web Studio - 0424-5104245
      </span>
    </div>
  </div>
</body>
</html>`;

  triggerIframePrint(html);
}

/**
 * Imprime un documento digital individual cargado en la Fase 7 (Opción 7) en tamaño Carta.
 */
export function printDocumentoSoporte(
  docItem: DocumentoSoporte,
  funcionario?: Partial<Funcionario>
) {
  printDocumentosLote([docItem], funcionario);
}

/**
 * Imprime uno o varios documentos digitales agregados en la Opción 7 del registro de empleado en formato Carta.
 */
export function printDocumentosLote(
  docs: DocumentoSoporte[],
  funcionario?: Partial<Funcionario>
) {
  const validDocs = docs.filter(d => Boolean(d.nombreArchivo) || Boolean(d.previewUrl));
  if (validDocs.length === 0) return;

  const origin = window.location.origin;
  const logoInsopesca = `${origin}/assets/aistudio/LOGO-INSOPESCA_83aabce5.png`;

  const cedula = funcionario?.identificacion?.cedula || 'S/C';
  const tipoCedula = funcionario?.identificacion?.tipoCedula || 'V';
  const nombreCompleto =
    `${funcionario?.identificacion?.nombres || ''} ${funcionario?.identificacion?.apellidos || ''}`.trim() ||
    'Servidor Público Registrado';
  const cargo = funcionario?.situacionLaboral?.cargoNominal || 'Personal INSOPESCA';
  const sede = funcionario?.situacionLaboral?.sedeRegion || 'INSOPESCA';

  const pagesHtml = validDocs
    .map((docItem, idx) => {
      const isImage = Boolean(docItem.previewUrl && docItem.previewUrl.startsWith('data:image'));
      const isPdf = Boolean(docItem.previewUrl && docItem.previewUrl.startsWith('data:application/pdf'));

      let bodyContent = '';
      if (isImage && docItem.previewUrl) {
        bodyContent = `
          <div class="attachment-container">
            <img src="${docItem.previewUrl}" alt="${escapeHtml(docItem.titulo)}" class="attachment-img" />
          </div>
        `;
      } else if (isPdf && docItem.previewUrl) {
        bodyContent = `
          <div class="attachment-container">
            <embed src="${docItem.previewUrl}" type="application/pdf" width="100%" height="760px" />
            <div class="pdf-note">
              Documento PDF adjunto: <strong>${escapeHtml(docItem.nombreArchivo || docItem.titulo)}</strong> (${escapeHtml(docItem.tamanoKb)} KB)
            </div>
          </div>
        `;
      } else {
        bodyContent = `
          <div class="cert-card">
            <h3>Constancia de Soporte Documental en Expediente Digital (Fase 7)</h3>
            <p>Se certifica que en el Módulo de Expediente Digital (Opción 7) del Sistema SIGEF-RRHH de INSOPESCA se encuentra consignado y verificado el siguiente recaudo probatorio:</p>
            <table class="meta-table">
              <tr><th>Denominación del Recaudo:</th><td><strong>${escapeHtml(docItem.titulo)}</strong></td></tr>
              <tr><th>Clasificación Documental:</th><td>${escapeHtml(docItem.tipo)}</td></tr>
              <tr><th>Archivo Digital Asociado:</th><td>${escapeHtml(docItem.nombreArchivo || 'Soporte Digitalizado')}</td></tr>
              <tr><th>Tamaño del Soporte:</th><td>${escapeHtml(docItem.tamanoKb)} KB</td></tr>
              <tr><th>Fecha de Carga en Sistema:</th><td>${escapeHtml(docItem.fechaCarga || new Date().toISOString().split('T')[0])}</td></tr>
              <tr><th>Estatus de Auditoría DGRRHH:</th><td>COTEJADO Y CONSIGNADO EN EXPEDIENTE</td></tr>
            </table>
          </div>
        `;
      }

      return `
        <div class="doc-page ${idx < validDocs.length - 1 ? 'page-break' : ''}">
          <div class="doc-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <img src="${logoInsopesca}" alt="INSOPESCA" style="width:38px;height:38px;object-fit:contain;" />
              <div>
                <strong>INSOPESCA — DIRECCIÓN GENERAL DE RECURSOS HUMANOS (SIGEF-RRHH)</strong><br/>
                Impresión de Soporte de Expediente Digital (Opción 7) — Formato Tamaño Carta
              </div>
            </div>
            <div style="text-align:right;">
              <strong>Soporte ${idx + 1} de ${validDocs.length}</strong><br/>
              Fecha Carga: ${escapeHtml(docItem.fechaCarga || new Date().toLocaleDateString('es-VE'))}
            </div>
          </div>
          <div class="worker-banner">
            <div><strong>Servidor Público:</strong> ${escapeHtml(nombreCompleto)} &nbsp;|&nbsp; <strong>C.I.:</strong> ${escapeHtml(tipoCedula)}-${escapeHtml(cedula)}</div>
            <div><strong>Cargo / Adscripción:</strong> ${escapeHtml(cargo)} — ${escapeHtml(sede)}</div>
            <div><strong>Documento Impreso:</strong> <span style="color:#0B4F9C;font-weight:800;">${escapeHtml(docItem.titulo)}</span> (${escapeHtml(docItem.nombreArchivo)} · ${escapeHtml(docItem.tamanoKb)} KB)</div>
          </div>
          ${bodyContent}
          <div class="doc-footer">
            <span>SIGEF-RRHH INSOPESCA — Soporte Documental Impreso en Formato Carta (Letter)</span>
            <span>C.I.: ${escapeHtml(tipoCedula)}-${escapeHtml(cedula)} | ${escapeHtml(docItem.titulo)}</span>
          </div>
        </div>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Documentos Expediente Digital - ${escapeHtml(nombreCompleto)}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.8cm 1cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .doc-page {
      width: 100%;
      max-width: 19.6cm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 24.5cm;
    }
    .page-break {
      page-break-after: always;
    }
    .doc-header {
      border-bottom: 2px solid #0f2537;
      padding-bottom: 6px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #1e293b;
    }
    .worker-banner {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 8.5pt;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .attachment-container {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      min-height: 19.5cm;
      max-height: 21cm;
      overflow: hidden;
    }
    .attachment-img {
      max-width: 100%;
      max-height: 20cm;
      object-fit: contain;
      border-radius: 4px;
    }
    .cert-card {
      border: 2px solid #0B4F9C;
      border-radius: 6px;
      padding: 20px;
      margin-top: 20px;
      background: #f8fafc;
    }
    .cert-card h3 {
      margin-top: 0;
      color: #0B4F9C;
      text-transform: uppercase;
      font-size: 11pt;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 9pt;
    }
    .meta-table th, .meta-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    .meta-table th {
      width: 38%;
      background: #e2e8f0;
    }
    .pdf-note {
      margin-top: 8px;
      font-size: 8pt;
      color: #475569;
    }
    .doc-footer {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

  triggerIframePrint(html);
}

export interface DirectorioLandscapePrintOptions {
  model: 'directorio' | 'combos' | 'asistencia';
  selectedColumns: Record<string, boolean>;
  activeFilters: {
    condicion: string;
    sede: string;
    estatus: string;
    searchTerm: string;
  };
  currentUser?: { username: string; nombre: string; cargo: string } | null;
  combosConfig?: {
    periodo: string;
    puntoEntrega: string;
    tipoCombo: string;
    defaultQty: number;
    cantidades: Record<string, number>;
  };
  asistenciaConfig?: {
    nombreActividad: string;
    lugarActividad: string;
    fechaActividad: string;
  };
}

/**
 * Imprime el Directorio General (o modelos de Nómina/Combos/Asistencia) en
 * Formato Oficial Tamaño Carta Sentido Horizontal (Letter Landscape 11" x 8.5"),
 * incluyendo toda la información agregada de los trabajadores sin recortes.
 */
export function printDirectorioCartaHorizontal(
  funcionarios: Funcionario[],
  options: DirectorioLandscapePrintOptions
) {
  const { model, selectedColumns, activeFilters, currentUser, combosConfig, asistenciaConfig } = options;

  const origin = window.location.origin;
  const logoInsopesca = `${origin}/assets/aistudio/LOGO-INSOPESCA_83aabce5.png`;
  const logoSys = `${origin}/assets/aistudio/1791899989619_db0f9485.jpg`;

  const fechaEmision = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const horaEmision = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let titleBannerHtml = '';
  let metaGridHtml = '';
  let tableHtml = '';

  if (model === 'directorio') {
    titleBannerHtml = `
      <div class="title-banner">
        <h1>REPORTE OFICIAL DEL DIRECTORIO GENERAL DE PERSONAL — FORMATO CARTA HORIZONTAL</h1>
        <p>Padrón Integral Consolidado de Personal Activo, Contratado, Alto Nivel y Jubilados · Información Completa del Expediente (Fases 1 a 7)</p>
      </div>
    `;

    metaGridHtml = `
      <div class="meta-bar">
        <div><strong>Sede / Región:</strong> ${escapeHtml(activeFilters.sede)}</div>
        <div><strong>Condición:</strong> ${escapeHtml(activeFilters.condicion)}</div>
        <div><strong>Estatus Expediente:</strong> ${escapeHtml(activeFilters.estatus)}</div>
        <div><strong>Total Funcionarios Impresos:</strong> <span style="color:#0B4F9C;font-weight:900;">${funcionarios.length} registro(s)</span></div>
      </div>
    `;

    const ths: string[] = ['<th style="width:22px;text-align:center;">N°</th>'];
    if (selectedColumns.cedula) ths.push('<th>Identificación y Biometría</th>');
    if (selectedColumns.nombres) ths.push('<th>Nombres, Apellidos y Nómina</th>');
    if (selectedColumns.cargo) ths.push('<th>Cargo Nominal / Funcional</th>');
    if (selectedColumns.unidad) ths.push('<th>Unidad Administrativa</th>');
    if (selectedColumns.sede) ths.push('<th>Sede / Región</th>');
    if (selectedColumns.telefono) ths.push('<th>Teléfonos</th>');
    if (selectedColumns.email) ths.push('<th>Correos y Dirección de Habitación</th>');
    if (selectedColumns.fechaIngreso) ths.push('<th style="text-align:center;">Ingreso / APN Previo</th>');
    if (selectedColumns.antiguedad) ths.push('<th style="text-align:center;">Antigüedad Total / Jubilación</th>');
    if (selectedColumns.instruccion) ths.push('<th>Perfil Académico y Cursos</th>');
    if (selectedColumns.banco) ths.push('<th>Banco y Cuenta Nómina</th>');
    if (selectedColumns.carnet) ths.push('<th style="text-align:center;">Carnet ID</th>');
    if (selectedColumns.tallas) ths.push('<th style="text-align:center;">Tallas Dotación</th>');
    if (selectedColumns.cargaFamiliar) ths.push('<th>Carga Familiar y Vivienda</th>');
    if (selectedColumns.salud) ths.push('<th>Salud, CONAPDIS y Emergencia</th>');
    if (selectedColumns.completitud) ths.push('<th>Expediente Digital / Auditoría</th>');
    if (selectedColumns.firma) ths.push('<th style="width:65px;text-align:center;">Firma</th>');

    const rows = funcionarios
      .map((f, idx) => {
        const edad = calcularEdad(f.identificacion.fechaNacimiento);
        const antiguedad = calcularAntiguedad(
          f.situacionLaboral.fechaIngresoMinisterio,
          f.situacionLaboral.anosServicioPrevioAPN
        );
        const completitud = calcularCompletitudExpediente(f);
        const jubilacion = evaluarEstatusJubilacion(
          f.identificacion.fechaNacimiento,
          f.identificacion.genero,
          f.situacionLaboral.fechaIngresoMinisterio,
          f.situacionLaboral.anosServicioPrevioAPN
        );
        const docsCargados = (f.expedienteDigital || []).filter(d => Boolean(d.nombreArchivo));

        const tds: string[] = [`<td style="text-align:center;font-weight:700;">${idx + 1}</td>`];

        if (selectedColumns.cedula) {
          tds.push(`
            <td>
              <div><strong>C.I.: ${escapeHtml(f.identificacion.tipoCedula)}-${escapeHtml(f.identificacion.cedula)}</strong></div>
              <div>RIF: ${escapeHtml(f.identificacion.tipoRif)}-${escapeHtml(f.identificacion.rif)}</div>
              <div class="sub-line">Nac: ${escapeHtml(f.identificacion.fechaNacimiento)} (${edad}a)</div>
              ${f.identificacion.lugarNacimiento ? `<div class="sub-line">Lugar: ${escapeHtml(f.identificacion.lugarNacimiento)}</div>` : ''}
              <div class="sub-line">${f.identificacion.genero === 'M' ? 'Masc.' : 'Fem.'} · ${escapeHtml(f.identificacion.estadoCivil)} · ${escapeHtml(f.identificacion.lateralidad)} · <strong>Sangre: ${escapeHtml(f.identificacion.tipoSangre)}</strong></div>
            </td>
          `);
        }

        if (selectedColumns.nombres) {
          tds.push(`
            <td>
              <div style="font-weight:800;color:#0f172a;text-transform:uppercase;">${escapeHtml(f.identificacion.nombres)} ${escapeHtml(f.identificacion.apellidos)}</div>
              <div class="sub-line">Condición: <strong>${escapeHtml(f.situacionLaboral.condicion)}</strong></div>
              <div class="sub-line">Cód. Nómina: <strong>${escapeHtml(f.situacionLaboral.codigoNomina)}</strong></div>
            </td>
          `);
        }

        if (selectedColumns.cargo) {
          tds.push(`
            <td>
              <div style="font-weight:700;">${escapeHtml(f.situacionLaboral.cargoNominal)}</div>
              ${
                f.situacionLaboral.cargoFuncional &&
                f.situacionLaboral.cargoFuncional !== f.situacionLaboral.cargoNominal
                  ? `<div class="sub-line"><em>Func.: ${escapeHtml(f.situacionLaboral.cargoFuncional)}</em></div>`
                  : ''
              }
            </td>
          `);
        }

        if (selectedColumns.unidad) {
          tds.push(`<td>${escapeHtml(f.situacionLaboral.unidadAdministrativa)}</td>`);
        }

        if (selectedColumns.sede) {
          tds.push(`<td><strong>${escapeHtml(f.situacionLaboral.sedeRegion)}</strong></td>`);
        }

        if (selectedColumns.telefono) {
          tds.push(`
            <td>
              <div><strong>Móvil:</strong> ${escapeHtml(f.contacto.telefonoMovil)}</div>
              ${f.contacto.telefonoHabitacion ? `<div class="sub-line">Hab: ${escapeHtml(f.contacto.telefonoHabitacion)}</div>` : ''}
            </td>
          `);
        }

        if (selectedColumns.email) {
          tds.push(`
            <td>
              <div>${escapeHtml(f.contacto.emailPersonal)}</div>
              ${f.contacto.emailInstitucional ? `<div class="sub-line">Inst: ${escapeHtml(f.contacto.emailInstitucional)}</div>` : ''}
              <div class="sub-line"><strong>Dir:</strong> ${escapeHtml(f.contacto.estado)}, Mun. ${escapeHtml(f.contacto.municipio)}, Pq. ${escapeHtml(f.contacto.parroquia)}${f.contacto.sector ? `, Sec. ${escapeHtml(f.contacto.sector)}` : ''}${f.contacto.calleCasa ? `, ${escapeHtml(f.contacto.calleCasa)}` : ''}</div>
            </td>
          `);
        }

        if (selectedColumns.fechaIngreso) {
          tds.push(`
            <td style="text-align:center;">
              <div><strong>${escapeHtml(f.situacionLaboral.fechaIngresoMinisterio)}</strong></div>
              <div class="sub-line">Previo APN: ${escapeHtml(f.situacionLaboral.anosServicioPrevioAPN)}a</div>
            </td>
          `);
        }

        if (selectedColumns.antiguedad) {
          tds.push(`
            <td style="text-align:center;">
              <div style="font-weight:800;color:#0B4F9C;">${antiguedad.anosTotalesAPN} años APN</div>
              <div class="sub-line">(${antiguedad.anosMinisterio}a Min. + ${escapeHtml(f.situacionLaboral.anosServicioPrevioAPN)}a prev.)</div>
              <div class="sub-line">${jubilacion.califica ? '<strong style="color:#047857;">Califica Jubilación</strong>' : jubilacion.proximo ? '<strong style="color:#b45309;">Próximo a Jubilar</strong>' : 'Activo Regular'}</div>
            </td>
          `);
        }

        if (selectedColumns.instruccion) {
          const cursosStr =
            f.perfilAcademico.cursosCertificaciones && f.perfilAcademico.cursosCertificaciones.length > 0
              ? f.perfilAcademico.cursosCertificaciones
                  .map(c => `${escapeHtml(c.nombreCurso)} (${escapeHtml(c.ano)})`)
                  .join(', ')
              : '';
          tds.push(`
            <td>
              <div><strong>${escapeHtml(f.perfilAcademico.nivelInstruccion)}</strong></div>
              <div>${escapeHtml(f.perfilAcademico.profesionOficio || f.perfilAcademico.tituloObtenido)}</div>
              ${
                f.perfilAcademico.institucion
                  ? `<div class="sub-line">${escapeHtml(f.perfilAcademico.institucion)} (${escapeHtml(f.perfilAcademico.anoGraduacion)})</div>`
                  : ''
              }
              ${cursosStr ? `<div class="sub-line"><strong>Cursos:</strong> ${cursosStr}</div>` : ''}
            </td>
          `);
        }

        if (selectedColumns.banco) {
          tds.push(`
            <td>
              <div style="font-weight:700;">${escapeHtml(f.situacionLaboral.banco)}</div>
              <div class="sub-line" style="font-family:monospace;">${escapeHtml(f.situacionLaboral.cuentaNomina || 'Sin cuenta')}</div>
            </td>
          `);
        }

        if (selectedColumns.carnet) {
          tds.push(`
            <td style="text-align:center;">
              <div><strong>${f.situacionLaboral.poseeCarnet ? '✓ SÍ' : '✕ NO'}</strong></div>
              ${f.situacionLaboral.codigoCarnet ? `<div class="sub-line">${escapeHtml(f.situacionLaboral.codigoCarnet)}</div>` : ''}
              ${f.situacionLaboral.estatusCarnet ? `<div class="sub-line">${escapeHtml(f.situacionLaboral.estatusCarnet)}</div>` : ''}
            </td>
          `);
        }

        if (selectedColumns.tallas) {
          tds.push(`
            <td style="text-align:center;">
              <div><strong>C:</strong> ${escapeHtml(f.identificacion.tallaCamisa)}</div>
              <div><strong>P:</strong> ${escapeHtml(f.identificacion.tallaPantalon)}</div>
              <div><strong>Z:</strong> ${escapeHtml(f.identificacion.tallaCalzado)}</div>
            </td>
          `);
        }

        if (selectedColumns.cargaFamiliar) {
          const fams = f.cargaFamiliar?.familiares || [];
          const famHtml =
            fams.length > 0
              ? fams
                  .map(
                    fam =>
                      `<div class="sub-line">• <strong>${escapeHtml(fam.nombres)} ${escapeHtml(fam.apellidos)}</strong> (${escapeHtml(fam.parentesco)}, ${calcularEdad(fam.fechaNacimiento)}a${fam.cedula ? `, C.I.${escapeHtml(fam.cedula)}` : ''})</div>`
                  )
                  .join('')
              : '<div class="sub-line">Sin carga familiar</div>';
          tds.push(`
            <td>
              <div><strong>Vivienda: ${escapeHtml(f.cargaFamiliar.tipoVivienda)}</strong> (${fams.length} fam.)</div>
              ${f.cargaFamiliar.observacionesVivienda ? `<div class="sub-line">${escapeHtml(f.cargaFamiliar.observacionesVivienda)}</div>` : ''}
              ${famHtml}
            </td>
          `);
        }

        if (selectedColumns.salud) {
          tds.push(`
            <td>
              <div><strong>Patol./Alerg.:</strong> ${escapeHtml(f.salud.patologiasCronicas || 'Ninguna')} / ${escapeHtml(f.salud.alergias || 'Ninguna')}</div>
              ${f.salud.tratamientoPermanente ? `<div class="sub-line">Trat.: ${escapeHtml(f.salud.tratamientoPermanente)}</div>` : ''}
              <div class="sub-line"><strong>CONAPDIS:</strong> ${f.salud.discapacidadCertificada ? `SÍ (${escapeHtml(f.salud.codigoConapdis || 'Cert.')})` : 'NO'}</div>
              <div class="sub-line"><strong>Emergencia:</strong> ${escapeHtml(f.salud.contactoEmergenciaNombre)} (${escapeHtml(f.salud.contactoEmergenciaParentesco)}) ${escapeHtml(f.salud.contactoEmergenciaTelefono)}</div>
            </td>
          `);
        }

        if (selectedColumns.completitud) {
          tds.push(`
            <td>
              <div style="font-weight:800;color:${completitud.completo ? '#047857' : '#0B4F9C'};">${completitud.porcentaje}% (${docsCargados.length} doc.)</div>
              ${
                docsCargados.length > 0
                  ? `<div class="sub-line">${docsCargados.map(d => escapeHtml(d.tipo)).join(', ')}</div>`
                  : '<div class="sub-line">Sin adjuntos</div>'
              }
              ${f.notasAuditoria ? `<div class="sub-line"><em>Nota: ${escapeHtml(f.notasAuditoria)}</em></div>` : ''}
            </td>
          `);
        }

        if (selectedColumns.firma) {
          tds.push(`<td style="text-align:center;"><div style="height:22px;border-bottom:1px dashed #64748b;"></div></td>`);
        }

        return `<tr>${tds.join('')}</tr>`;
      })
      .join('');

    tableHtml = `
      <table class="dir-table">
        <thead>
          <tr>${ths.join('')}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } else if (model === 'combos') {
    const periodo = combosConfig?.periodo || '2026';
    const punto = combosConfig?.puntoEntrega || 'Sede INSOPESCA';
    const beneficio = combosConfig?.tipoCombo || 'Combo Alimenticio';
    const defQty = combosConfig?.defaultQty ?? 1;
    const cantidades = combosConfig?.cantidades || {};
    const totalCombos = funcionarios.reduce((acc, f) => acc + (cantidades[f.id] ?? defQty), 0);

    titleBannerHtml = `
      <div class="title-banner">
        <h1>PLANILLA OFICIAL DE CONTROL Y ENTREGA DE BENEFICIO ALIMENTARIO (CARTA HORIZONTAL)</h1>
        <p>Programa de Protección Social y Seguridad Alimentaria · Nómina de Recepción de Combos</p>
      </div>
    `;

    metaGridHtml = `
      <div class="meta-bar">
        <div><strong>Período:</strong> ${escapeHtml(periodo)}</div>
        <div><strong>Punto de Distribución:</strong> ${escapeHtml(punto)}</div>
        <div><strong>Beneficio:</strong> ${escapeHtml(beneficio)}</div>
        <div><strong>Total Asignación:</strong> <span style="color:#047857;font-weight:900;">${totalCombos} Combos (${funcionarios.length} Beneficiarios)</span></div>
      </div>
    `;

    const rows = funcionarios
      .map((f, idx) => {
        const qty = cantidades[f.id] ?? defQty;
        return `
          <tr>
            <td style="text-align:center;font-weight:700;">${idx + 1}</td>
            <td style="font-weight:800;white-space:nowrap;">${escapeHtml(f.identificacion.tipoCedula)}-${escapeHtml(f.identificacion.cedula)}</td>
            <td>
              <div style="font-weight:800;">${escapeHtml(f.identificacion.nombres)} ${escapeHtml(f.identificacion.apellidos)}</div>
              <div class="sub-line">Tel: ${escapeHtml(f.contacto.telefonoMovil)}</div>
            </td>
            <td>
              <div style="font-weight:700;">${escapeHtml(f.situacionLaboral.cargoFuncional || f.situacionLaboral.cargoNominal)}</div>
              <div class="sub-line">${escapeHtml(f.situacionLaboral.unidadAdministrativa)} · ${escapeHtml(f.situacionLaboral.sedeRegion)}</div>
            </td>
            <td style="text-align:center;font-weight:900;font-size:9pt;">${qty}</td>
            <td style="text-align:center;">[ &nbsp;&nbsp; ]</td>
            <td style="text-align:center;">___/___/2026</td>
            <td style="height:42px;"></td>
            <td style="height:42px;"></td>
          </tr>
        `;
      })
      .join('');

    tableHtml = `
      <table class="dir-table">
        <thead>
          <tr>
            <th style="width:26px;text-align:center;">N°</th>
            <th style="width:85px;">Cédula</th>
            <th>Nombres y Apellidos / Contacto</th>
            <th>Cargo y Unidad de Adscripción</th>
            <th style="width:48px;text-align:center;">Cant.</th>
            <th style="width:52px;text-align:center;">Recibió</th>
            <th style="width:78px;text-align:center;">Fecha</th>
            <th style="width:90px;text-align:center;">Huella Dactilar</th>
            <th style="width:130px;text-align:center;">Firma del Trabajador</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } else {
    const actividad = asistenciaConfig?.nombreActividad || 'Jornada Institucional';
    const lugar = asistenciaConfig?.lugarActividad || 'Sede INSOPESCA';
    const fecha = asistenciaConfig?.fechaActividad || new Date().toISOString().split('T')[0];

    titleBannerHtml = `
      <div class="title-banner">
        <h1>PLANILLA OFICIAL DE CONTROL DE ASISTENCIA A ACTIVIDADES INSTITUCIONALES (CARTA HORIZONTAL)</h1>
        <p>Registro de Participación en Asambleas, Mesas de Trabajo y Jornadas Operativas Extraordinarias</p>
      </div>
    `;

    metaGridHtml = `
      <div class="meta-bar">
        <div><strong>Actividad:</strong> ${escapeHtml(actividad)}</div>
        <div><strong>Lugar:</strong> ${escapeHtml(lugar)}</div>
        <div><strong>Fecha:</strong> ${escapeHtml(fecha)}</div>
        <div><strong>Total Convocados:</strong> <span style="color:#0B4F9C;font-weight:900;">${funcionarios.length} funcionario(s)</span></div>
      </div>
    `;

    const rows = funcionarios
      .map(
        (f, idx) => `
          <tr>
            <td style="text-align:center;font-weight:700;">${idx + 1}</td>
            <td style="font-weight:800;white-space:nowrap;">${escapeHtml(f.identificacion.tipoCedula)}-${escapeHtml(f.identificacion.cedula)}</td>
            <td>
              <div style="font-weight:800;">${escapeHtml(f.identificacion.nombres)} ${escapeHtml(f.identificacion.apellidos)}</div>
              <div class="sub-line">Tel: ${escapeHtml(f.contacto.telefonoMovil)} · ${escapeHtml(f.contacto.emailPersonal)}</div>
            </td>
            <td>${escapeHtml(f.situacionLaboral.unidadAdministrativa)} (${escapeHtml(f.situacionLaboral.sedeRegion)})</td>
            <td>${escapeHtml(f.situacionLaboral.cargoFuncional || f.situacionLaboral.cargoNominal)}</td>
            <td style="height:38px;"></td>
            <td style="height:38px;"></td>
          </tr>
        `
      )
      .join('');

    tableHtml = `
      <table class="dir-table">
        <thead>
          <tr>
            <th style="width:26px;text-align:center;">N°</th>
            <th style="width:85px;">Cédula</th>
            <th>Nombres y Apellidos / Contacto</th>
            <th>Dependencia / Unidad Administrativa</th>
            <th>Cargo Funcional / Nominal</th>
            <th style="width:150px;text-align:center;">Firma / Rúbrica del Asistente</th>
            <th style="width:120px;text-align:center;">Observaciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  const activeColCount = Object.values(selectedColumns).filter(Boolean).length;
  const fontSizePt = model === 'directorio' && activeColCount > 10 ? '6.4pt' : '7.2pt';
  const cellPad = model === 'directorio' && activeColCount > 10 ? '3px 3.5px' : '4px 5px';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Directorio General Carta Horizontal - INSOPESCA (${funcionarios.length} registros)</title>
  <style>
    @page {
      size: letter landscape;
      margin: 0.55cm 0.7cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: ${fontSizePt};
      line-height: 1.24;
    }
    .landscape-sheet {
      width: 100%;
      max-width: 26.5cm;
      margin: 0 auto;
    }
    .tricolor {
      height: 5px;
      display: grid;
      grid-template-columns: 5fr 4fr 3fr;
      margin-bottom: 5px;
      border-radius: 2px;
      overflow: hidden;
    }
    .tri-y { background: #FFD100; }
    .tri-b { background: #0B4F9C; }
    .tri-r { background: #D91424; }
    .inst-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f2537;
      padding-bottom: 5px;
      margin-bottom: 6px;
      gap: 12px;
    }
    .inst-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .inst-logo {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }
    .inst-titles .rep {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      letter-spacing: 0.5px;
    }
    .inst-titles .min {
      font-size: 7.8pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .inst-titles .ins {
      font-size: 9pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0B4F9C;
    }
    .inst-titles .sub {
      font-size: 7pt;
      color: #475569;
      font-weight: 600;
    }
    .inst-meta {
      text-align: right;
      font-size: 6.8pt;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      line-height: 1.3;
    }
    .title-banner {
      background: #0f2537;
      color: #ffffff;
      text-align: center;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    .title-banner h1 {
      margin: 0;
      font-size: 9pt;
      font-weight: 900;
      letter-spacing: 0.4px;
    }
    .title-banner p {
      margin: 1px 0 0 0;
      font-size: 6.8pt;
      color: #cbd5e1;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 8px;
      margin-bottom: 6px;
      font-size: 7pt;
    }
    .dir-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
      font-size: ${fontSizePt};
    }
    .dir-table thead {
      display: table-header-group;
    }
    .dir-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .dir-table th {
      background: #0B4F9C;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      padding: ${cellPad};
      border: 1px solid #083E7D;
      text-align: left;
      font-size: ${fontSizePt};
      vertical-align: middle;
    }
    .dir-table td {
      padding: ${cellPad};
      border: 1px solid #cbd5e1;
      vertical-align: top;
      color: #0f172a;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .dir-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .sub-line {
      font-size: 92%;
      color: #475569;
      margin-top: 1px;
    }
    .signatures-row {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      page-break-inside: avoid;
      break-inside: avoid;
      text-align: center;
    }
    .sig-col {
      padding-top: 22px;
    }
    .sig-line {
      width: 210px;
      margin: 0 auto;
      border-top: 1.5px solid #0f172a;
      padding-top: 3px;
      font-weight: 800;
      font-size: 7.5pt;
      color: #0f172a;
    }
    .sig-role {
      font-size: 6.8pt;
      font-weight: 700;
      color: #0B4F9C;
    }
    .sig-org {
      font-size: 6.3pt;
      color: #64748b;
    }
    .footer-cintillo {
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.5pt;
      color: #64748b;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="landscape-sheet">
    <div class="tricolor">
      <div class="tri-y"></div>
      <div class="tri-b"></div>
      <div class="tri-r"></div>
    </div>

    <div class="inst-header">
      <div class="inst-left">
        <img src="${logoInsopesca}" alt="INSOPESCA" class="inst-logo" />
        <div class="inst-titles">
          <div class="rep">República Bolivariana de Venezuela</div>
          <div class="min">Ministerio del Poder Popular de Pesca y Acuicultura (MPPPA)</div>
          <div class="ins">Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)</div>
          <div class="sub">Dirección General de Recursos Humanos · Oficina de Gestión Humana · Gerencia Regional Barinas</div>
        </div>
      </div>
      <div class="inst-meta">
        <div><strong>FORMATO OFICIAL CARTA HORIZONTAL (LETTER LANDSCAPE)</strong></div>
        <div><strong>Control SIGEF:</strong> DGRRHH-${model.toUpperCase()}-${new Date().getFullYear()}</div>
        <div><strong>Emisión:</strong> ${escapeHtml(fechaEmision)} — ${escapeHtml(horaEmision)}</div>
        <div><strong>Operador:</strong> ${escapeHtml(currentUser?.nombre || 'Lcda. Maria Peña')}</div>
      </div>
    </div>

    ${titleBannerHtml}
    ${metaGridHtml}
    ${tableHtml}

    <div class="signatures-row">
      <div class="sig-col">
        <div class="sig-line">${escapeHtml(currentUser?.nombre || 'Lcda. Maria Peña')}</div>
        <div class="sig-role">${escapeHtml(currentUser?.cargo || 'Enlaces RRHH')}</div>
        <div class="sig-org">Dirección General de Recursos Humanos · INSOPESCA</div>
      </div>
      <div class="sig-col">
        <div class="sig-line">Lcda. Mirla Escalona</div>
        <div class="sig-role">Gerente Regional Barinas</div>
        <div class="sig-org">Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)</div>
      </div>
    </div>

    <div class="footer-cintillo">
      <span>Documento oficial generado por SIGEF-RRHH · MPPPA / INSOPESCA — Impresión Tamaño Carta Sentido Horizontal (11" × 8.5")</span>
      <span style="display:flex;align-items:center;gap:5px;">
        <img src="${logoSys}" alt="S&S" style="height:11px;width:auto;object-fit:contain;" />
        <strong>Sistema Diseñado y Elaborado por S&S Web Studio - 0424-5104245</strong>
      </span>
    </div>
  </div>
</body>
</html>`;

  triggerIframePrint(html);
}

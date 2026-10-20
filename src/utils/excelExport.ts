import { 
  Funcionario, 
  calcularAntiguedad, 
  calcularCompletitudExpediente, 
  calcularEdad, 
  evaluarEstatusJubilacion 
} from '../types/rrhh';

/**
 * Escapa caracteres especiales para el formato XML de Excel Spreadsheet 2003
 */
function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Exporta el directorio de personal a un archivo de Excel nativo (.xls XML Spreadsheet)
 * con diseño institucional de INSOPESCA, columnas ordenadas y datos tipados.
 */
export function exportToExcelXLS(funcionarios: Funcionario[], filename?: string): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `SIGEF_RRHH_DIRECTORIO_INSOPESCA_${dateStr}.xls`;

  // Definición de columnas ordenadas con todos los campos del expediente
  const columns = [
    { label: 'N°', width: 40 },
    { label: 'Cédula de Identidad', width: 110 },
    { label: 'Tipo C.I.', width: 60 },
    { label: 'RIF', width: 100 },
    { label: 'Nombres', width: 140 },
    { label: 'Apellidos', width: 140 },
    { label: 'Género', width: 70 },
    { label: 'Fecha Nacimiento', width: 100 },
    { label: 'Edad', width: 50 },
    { label: 'Lugar de Nacimiento', width: 150 },
    { label: 'Estado Civil', width: 90 },
    { label: 'Lateralidad', width: 90 },
    { label: 'Tipo de Sangre', width: 80 },
    { label: 'Talla Camisa', width: 80 },
    { label: 'Talla Pantalón', width: 90 },
    { label: 'Talla Calzado', width: 80 },
    
    // Contacto y Ubicación
    { label: 'Teléfono Móvil', width: 110 },
    { label: 'Teléfono Habitación', width: 110 },
    { label: 'Email Institucional', width: 160 },
    { label: 'Email Personal', width: 160 },
    { label: 'Estado', width: 110 },
    { label: 'Municipio', width: 110 },
    { label: 'Parroquia', width: 110 },
    { label: 'Sector', width: 120 },
    { label: 'Dirección Detallada', width: 220 },

    // Situación Laboral
    { label: 'Condición Laboral', width: 110 },
    { label: 'Código Nómina', width: 90 },
    { label: 'Cargo Nominal', width: 180 },
    { label: 'Cargo Funcional', width: 180 },
    { label: 'Unidad Administrativa', width: 220 },
    { label: 'Sede / Región', width: 150 },
    { label: 'Fecha Ingreso Ministerio', width: 120 },
    { label: 'Años en Ministerio', width: 110 },
    { label: 'Años Previos APN', width: 110 },
    { label: 'Total Antigüedad APN', width: 120 },
    { label: 'Estatus Jubilación', width: 130 },
    { label: 'Banco Nómina', width: 150 },
    { label: 'Cuenta Nómina (20 dígitos)', width: 170 },

    // Perfil Académico
    { label: 'Nivel Instrucción', width: 120 },
    { label: 'Profesión / Oficio', width: 160 },
    { label: 'Título Obtenido', width: 180 },
    { label: 'Institución / Universidad', width: 180 },
    { label: 'Año Graduación', width: 90 },
    { label: 'Cursos y Certificaciones', width: 220 },

    // Carga Familiar
    { label: 'Total Familiares', width: 100 },
    { label: 'Total Hijos', width: 80 },
    { label: 'Detalle Carga Familiar', width: 250 },
    { label: 'Tipo de Vivienda', width: 110 },
    { label: 'Observaciones Vivienda', width: 180 },

    // Salud y Seguridad
    { label: 'Alergias', width: 130 },
    { label: 'Patologías Crónicas', width: 140 },
    { label: 'Discapacidad Certificada', width: 130 },
    { label: 'Código CONAPDIS', width: 110 },
    { label: 'Tratamiento Permanente', width: 160 },
    { label: 'Contacto Emergencia (Nombre)', width: 150 },
    { label: 'Parentesco Emergencia', width: 120 },
    { label: 'Teléfono Emergencia', width: 110 },

    // Expediente Digital
    { label: '% Completitud', width: 90 },
    { label: 'Estado Expediente', width: 110 },
    { label: 'Soportes Cargados', width: 220 },
    { label: 'Soportes Faltantes', width: 200 },

    // Campos Adicionales y Auditoría
    { label: 'Campos Personalizados Adicionales', width: 240 },
    { label: 'ID Sistema', width: 110 },
    { label: 'Fecha de Registro', width: 110 },
    { label: 'Última Actualización', width: 120 }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>INSOPESCA - Dirección General de Recursos Humanos</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>Ministerio del Poder Popular de Pesca y Acuicultura</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#073870"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#073870"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#073870"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#073870"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B4F9C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sBanner">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#0B4F9C" ss:Bold="1"/>
  </Style>
  <Style ss:ID="sSubtitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="sCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="sCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="sCellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="sCellPercent">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#059669"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Directorio Personal INSOPESCA">
  <Table ss:DefaultRowHeight="20">
`;

  // Anchos de columna
  columns.forEach(col => {
    xml += `   <Column ss:Width="${col.width}"/>\n`;
  });

  // Fila de Encabezado Institucional
  xml += `   <Row ss:Height="26">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="sBanner">
     <Data ss:Type="String">INSTITUTO SOCIALISTA DE LA PESCA Y ACUICULTURA (INSOPESCA) - DIRECTORIO GENERAL DE PERSONAL</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="sSubtitle">
     <Data ss:Type="String">Ministerio del Poder Popular de Pesca y Acuicultura | Dirección General de Recursos Humanos | Fecha de Emisión: ${dateStr} | Total Registros: ${funcionarios.length}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="28">
`;

  // Fila de Títulos de Columna
  columns.forEach(col => {
    xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Filas de Datos
  funcionarios.forEach((f, idx) => {
    const edad = calcularEdad(f.identificacion.fechaNacimiento);
    const antiguedad = calcularAntiguedad(
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    const jubilacion = evaluarEstatusJubilacion(
      f.identificacion.fechaNacimiento,
      f.identificacion.genero,
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    const completitud = calcularCompletitudExpediente(f);

    const cursosTexto = f.perfilAcademico.cursosCertificaciones && f.perfilAcademico.cursosCertificaciones.length > 0
      ? f.perfilAcademico.cursosCertificaciones.map(c => `${c.nombreCurso} (${c.institucion}, ${c.ano})`).join('; ')
      : 'Sin cursos registrados';

    const familiares = f.cargaFamiliar.familiares || [];
    const totalHijos = familiares.filter(fam => fam.parentesco === 'HIJO' || fam.parentesco === 'HIJA').length;
    const detalleFamiliares = familiares.length > 0
      ? familiares.map(fam => `${fam.parentesco}: ${fam.nombres} ${fam.apellidos} (${fam.cedula || 'S/C'})`).join('; ')
      : 'Sin carga familiar registrada';

    const soportesCargados = f.expedienteDigital
      .filter(doc => doc.nombreArchivo)
      .map(doc => doc.titulo)
      .join('; ') || 'Ninguno cargado';

    const soportesFaltantes = f.expedienteDigital
      .filter(doc => doc.obligatorio && !doc.nombreArchivo)
      .map(doc => doc.titulo)
      .join('; ') || 'Ninguno (Expediente Completo)';

    const camposPersonalizadosTexto = f.camposPersonalizados && f.camposPersonalizados.length > 0
      ? f.camposPersonalizados.map(cp => `${cp.etiqueta}: ${cp.valor}`).join('; ')
      : 'Ninguno';

    xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(`${f.identificacion.tipoCedula}-${f.identificacion.cedula}`)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tipoCedula)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(`${f.identificacion.tipoRif}-${f.identificacion.rif}`)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.identificacion.nombres)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.identificacion.apellidos)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.genero === 'M' ? 'Masculino' : 'Femenino')}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.fechaNacimiento)}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${edad}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.identificacion.lugarNacimiento || 'No especificado')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.identificacion.estadoCivil)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.identificacion.lateralidad)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tipoSangre)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tallaCamisa)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tallaPantalon)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tallaCalzado)}</Data></Cell>

    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.telefonoMovil)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.telefonoHabitacion || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.emailInstitucional)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.emailPersonal)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.estado)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.municipio)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.parroquia)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.sector)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.contacto.calleCasa)}</Data></Cell>

    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.condicion)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.codigoNomina)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.cargoNominal)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.cargoFuncional)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.unidadAdministrativa)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.sedeRegion)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.situacionLaboral.fechaIngresoMinisterio)}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${antiguedad.anosMinisterio}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${f.situacionLaboral.anosServicioPrevioAPN || 0}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${antiguedad.anosTotalesAPN}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(jubilacion.califica ? 'Califica Jubilación' : jubilacion.proximo ? 'Próximo a Jubilar' : 'Activo Ordinario')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.banco)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.situacionLaboral.cuentaNomina)}</Data></Cell>

    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.perfilAcademico.nivelInstruccion)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.perfilAcademico.profesionOficio)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.perfilAcademico.tituloObtenido)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.perfilAcademico.institucion)}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${f.perfilAcademico.anoGraduacion || 0}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(cursosTexto)}</Data></Cell>

    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${familiares.length}</Data></Cell>
    <Cell ss:StyleID="sCellNumber"><Data ss:Type="Number">${totalHijos}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(detalleFamiliares)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.cargaFamiliar.tipoVivienda)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.cargaFamiliar.observacionesVivienda || 'Sin observaciones')}</Data></Cell>

    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.alergias || 'Ninguna')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.patologiasCronicas || 'Ninguna')}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.salud.discapacidadCertificada ? 'SÍ' : 'NO')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.codigoConapdis || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.tratamientoPermanente || 'Ninguno')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.contactoEmergenciaNombre || 'No indicado')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.contactoEmergenciaParentesco || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.salud.contactoEmergenciaTelefono || 'N/A')}</Data></Cell>

    <Cell ss:StyleID="sCellPercent"><Data ss:Type="String">${completitud.porcentaje}%</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(completitud.completo ? 'Completo (100%)' : 'Incompleto (Faltan recaudos)')}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(soportesCargados)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(soportesFaltantes)}</Data></Cell>

    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(camposPersonalizadosTexto)}</Data></Cell>
    <Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXml(f.id)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.fechaRegistro)}</Data></Cell>
    <Cell ss:StyleID="sCellCenter"><Data ss:Type="String">${escapeXml(f.fechaUltimaActualizacion)}</Data></Cell>
   </Row>\n`;
  });

  xml += `  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Print>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitPane>
    <TopRowBottomPane>4</TopRowBottomPane>
    <LeftColumnRightPane>6</LeftColumnRightPane>
    <ActivePane>0</ActivePane>
   </SplitPane>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
    <Pane>
     <Number>2</Number>
    </Pane>
    <Pane>
     <Number>1</Number>
    </Pane>
    <Pane>
     <Number>0</Number>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exportación adicional a CSV estructurado con BOM UTF-8
 */
export function exportToCSVStructured(funcionarios: Funcionario[], filename?: string): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `SIGEF_RRHH_DIRECTORIO_INSOPESCA_${dateStr}.csv`;

  const headers = [
    'N°',
    'Cedula',
    'TipoCedula',
    'RIF',
    'Nombres',
    'Apellidos',
    'Genero',
    'FechaNacimiento',
    'Edad',
    'LugarNacimiento',
    'EstadoCivil',
    'Lateralidad',
    'TipoSangre',
    'TallaCamisa',
    'TallaPantalon',
    'TallaCalzado',
    'TelefonoMovil',
    'TelefonoHabitacion',
    'EmailInstitucional',
    'EmailPersonal',
    'Estado',
    'Municipio',
    'Parroquia',
    'Sector',
    'DireccionDetallada',
    'CondicionLaboral',
    'CodigoNomina',
    'CargoNominal',
    'CargoFuncional',
    'UnidadAdministrativa',
    'SedeRegion',
    'FechaIngresoMinisterio',
    'AnosMinisterio',
    'AnosPreviosAPN',
    'TotalAntiguedadAPN',
    'EstatusJubilacion',
    'BancoNomina',
    'CuentaNomina',
    'NivelInstruccion',
    'ProfesionOficio',
    'TituloObtenido',
    'Institucion',
    'AnoGraduacion',
    'CursosCertificaciones',
    'TotalFamiliares',
    'TotalHijos',
    'DetalleFamiliares',
    'TipoVivienda',
    'ObservacionesVivienda',
    'Alergias',
    'PatologiasCronicas',
    'DiscapacidadCertificada',
    'CodigoConapdis',
    'TratamientoPermanente',
    'ContactoEmergencia',
    'ParentescoEmergencia',
    'TelefonoEmergencia',
    'PorcentajeCompletitud',
    'EstadoExpediente',
    'SoportesCargados',
    'SoportesFaltantes',
    'CamposPersonalizados',
    'IdSistema',
    'FechaRegistro',
    'UltimaActualizacion'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = funcionarios.map((f, idx) => {
    const edad = calcularEdad(f.identificacion.fechaNacimiento);
    const antiguedad = calcularAntiguedad(
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    const jubilacion = evaluarEstatusJubilacion(
      f.identificacion.fechaNacimiento,
      f.identificacion.genero,
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    const completitud = calcularCompletitudExpediente(f);
    const familiares = f.cargaFamiliar.familiares || [];
    const totalHijos = familiares.filter(fam => fam.parentesco === 'HIJO' || fam.parentesco === 'HIJA').length;

    const cursosTexto = f.perfilAcademico.cursosCertificaciones && f.perfilAcademico.cursosCertificaciones.length > 0
      ? f.perfilAcademico.cursosCertificaciones.map(c => `${c.nombreCurso} (${c.institucion})`).join('; ')
      : '';

    const detalleFamiliares = familiares.length > 0
      ? familiares.map(fam => `${fam.parentesco}: ${fam.nombres} ${fam.apellidos}`).join('; ')
      : '';

    const soportesCargados = f.expedienteDigital
      .filter(doc => doc.nombreArchivo)
      .map(doc => doc.titulo)
      .join('; ');

    const soportesFaltantes = f.expedienteDigital
      .filter(doc => doc.obligatorio && !doc.nombreArchivo)
      .map(doc => doc.titulo)
      .join('; ');

    const camposPersonalizadosTexto = f.camposPersonalizados && f.camposPersonalizados.length > 0
      ? f.camposPersonalizados.map(cp => `${cp.etiqueta}: ${cp.valor}`).join('; ')
      : '';

    return [
      idx + 1,
      escapeCsv(`${f.identificacion.tipoCedula}-${f.identificacion.cedula}`),
      escapeCsv(f.identificacion.tipoCedula),
      escapeCsv(`${f.identificacion.tipoRif}-${f.identificacion.rif}`),
      escapeCsv(f.identificacion.nombres),
      escapeCsv(f.identificacion.apellidos),
      escapeCsv(f.identificacion.genero),
      escapeCsv(f.identificacion.fechaNacimiento),
      edad,
      escapeCsv(f.identificacion.lugarNacimiento),
      escapeCsv(f.identificacion.estadoCivil),
      escapeCsv(f.identificacion.lateralidad),
      escapeCsv(f.identificacion.tipoSangre),
      escapeCsv(f.identificacion.tallaCamisa),
      escapeCsv(f.identificacion.tallaPantalon),
      escapeCsv(f.identificacion.tallaCalzado),
      escapeCsv(f.contacto.telefonoMovil),
      escapeCsv(f.contacto.telefonoHabitacion),
      escapeCsv(f.contacto.emailInstitucional),
      escapeCsv(f.contacto.emailPersonal),
      escapeCsv(f.contacto.estado),
      escapeCsv(f.contacto.municipio),
      escapeCsv(f.contacto.parroquia),
      escapeCsv(f.contacto.sector),
      escapeCsv(f.contacto.calleCasa),
      escapeCsv(f.situacionLaboral.condicion),
      escapeCsv(f.situacionLaboral.codigoNomina),
      escapeCsv(f.situacionLaboral.cargoNominal),
      escapeCsv(f.situacionLaboral.cargoFuncional),
      escapeCsv(f.situacionLaboral.unidadAdministrativa),
      escapeCsv(f.situacionLaboral.sedeRegion),
      escapeCsv(f.situacionLaboral.fechaIngresoMinisterio),
      antiguedad.anosMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN || 0,
      antiguedad.anosTotalesAPN,
      escapeCsv(jubilacion.califica ? 'Califica' : jubilacion.proximo ? 'Próximo' : 'Activo'),
      escapeCsv(f.situacionLaboral.banco),
      escapeCsv(f.situacionLaboral.cuentaNomina),
      escapeCsv(f.perfilAcademico.nivelInstruccion),
      escapeCsv(f.perfilAcademico.profesionOficio),
      escapeCsv(f.perfilAcademico.tituloObtenido),
      escapeCsv(f.perfilAcademico.institucion),
      f.perfilAcademico.anoGraduacion || '',
      escapeCsv(cursosTexto),
      familiares.length,
      totalHijos,
      escapeCsv(detalleFamiliares),
      escapeCsv(f.cargaFamiliar.tipoVivienda),
      escapeCsv(f.cargaFamiliar.observacionesVivienda),
      escapeCsv(f.salud.alergias),
      escapeCsv(f.salud.patologiasCronicas),
      f.salud.discapacidadCertificada ? 'SÍ' : 'NO',
      escapeCsv(f.salud.codigoConapdis),
      escapeCsv(f.salud.tratamientoPermanente),
      escapeCsv(f.salud.contactoEmergenciaNombre),
      escapeCsv(f.salud.contactoEmergenciaParentesco),
      escapeCsv(f.salud.contactoEmergenciaTelefono),
      escapeCsv(`${completitud.porcentaje}%`),
      escapeCsv(completitud.completo ? 'Completo' : 'Incompleto'),
      escapeCsv(soportesCargados),
      escapeCsv(soportesFaltantes),
      escapeCsv(camposPersonalizadosTexto),
      escapeCsv(f.id),
      escapeCsv(f.fechaRegistro),
      escapeCsv(f.fechaUltimaActualizacion)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta la Nómina de Control y Recepción de Combos Alimenticios a Excel (.xls XML)
 */
export function exportCombosAlimenticiosXLS(
  funcionarios: Funcionario[],
  periodo: string = 'Marzo 2026',
  puntoEntrega: string = 'Sede Regional Barinas',
  cantidadesCombos?: Record<string, number>
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = `NOMINA_COMBOS_ALIMENTICIOS_INSOPESCA_${dateStr}.xls`;

  const columns = [
    { label: 'N°', width: 40 },
    { label: 'Cédula de Identidad', width: 110 },
    { label: 'Nombres y Apellidos', width: 200 },
    { label: 'Cargo Nominal / Funcional', width: 220 },
    { label: 'Unidad Administrativa', width: 220 },
    { label: 'Sede / Región', width: 140 },
    { label: 'Condición', width: 90 },
    { label: 'Cant. Combos', width: 90 },
    { label: 'Recibido Conforme', width: 110 },
    { label: 'Fecha Recepción', width: 110 },
    { label: 'Firma / Rúbrica', width: 130 },
    { label: 'Huella Dactilar', width: 110 },
    { label: 'Observaciones', width: 160 }
  ];

  const colTags = columns.map(c => `   <Column ss:Width="${c.width}"/>`).join('\n');

  const rowsXml = funcionarios.map((f, idx) => {
    const qty = (cantidadesCombos && cantidadesCombos[f.id]) ? cantidadesCombos[f.id] : 1;
    return `   <Row ss:Height="26">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tipoCedula)}-${escapeXml(f.identificacion.cedula)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.identificacion.nombres)} ${escapeXml(f.identificacion.apellidos)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.cargoNominal || f.situacionLaboral.cargoFuncional)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.unidadAdministrativa)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.sedeRegion)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.situacionLaboral.condicion)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${qty}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">[   ]</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">____/____/2026</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">________________</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">[ HUELLA ]</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String"></Data></Cell>
   </Row>`;
  }).join('\n');

  const headerCells = columns.map(c => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#0B4F9C" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#475569" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B4F9C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Combos Alimenticios">
  <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${funcionarios.length + 8}" x:FullColumns="1" x:FullRows="1">
${colTags}
   <Row ss:Height="24">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">REPÚBLICA BOLIVARIANA DE VENEZUELA - MPPPA - INSOPESCA</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">CONTROL Y RECEPCIÓN DE BENEFICIO ALIMENTICIO (COMBOS ALIMENTICIOS)</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Subtitle">
     <Data ss:Type="String">Período: ${escapeXml(periodo)} | Punto de Entrega: ${escapeXml(puntoEntrega)} | Total Beneficiarios: ${funcionarios.length}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="26">
    ${headerCells}
   </Row>
${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta la Planilla de Asistencia a Actividades a Excel (.xls XML)
 */
export function exportAsistenciaActividadesXLS(
  funcionarios: Funcionario[],
  nombreActividad: string = 'Jornada Institucional',
  lugar: string = 'Sede Regional Barinas',
  fecha: string = new Date().toISOString().split('T')[0]
): void {
  const finalFilename = `ASISTENCIA_ACTIVIDADES_INSOPESCA_${fecha}.xls`;

  const columns = [
    { label: 'N°', width: 40 },
    { label: 'Cédula de Identidad', width: 110 },
    { label: 'Nombres y Apellidos', width: 200 },
    { label: 'Unidad Administrativa / Dependencia', width: 240 },
    { label: 'Cargo Nominal / Funcional', width: 230 },
    { label: 'Sede / Región', width: 150 },
    { label: 'Firma / Rúbrica del Asistente', width: 170 },
    { label: 'Observaciones', width: 180 }
  ];

  const colTags = columns.map(c => `   <Column ss:Width="${c.width}"/>`).join('\n');

  const rowsXml = funcionarios.map((f, idx) => {
    return `   <Row ss:Height="26">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.identificacion.tipoCedula)}-${escapeXml(f.identificacion.cedula)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.identificacion.nombres)} ${escapeXml(f.identificacion.apellidos)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.unidadAdministrativa)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.cargoNominal || f.situacionLaboral.cargoFuncional)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.sedeRegion)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">________________</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String"></Data></Cell>
   </Row>`;
  }).join('\n');

  const headerCells = columns.map(c => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#0B4F9C" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#475569" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B4F9C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Asistencia a Actividades">
  <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${funcionarios.length + 8}" x:FullColumns="1" x:FullRows="1">
${colTags}
   <Row ss:Height="24">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">REPÚBLICA BOLIVARIANA DE VENEZUELA - MPPPA - INSOPESCA</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">CONTROL OFICIAL DE ASISTENCIA A ACTIVIDADES Y JORNADAS</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Subtitle">
     <Data ss:Type="String">Actividad: ${escapeXml(nombreActividad)} | Lugar: ${escapeXml(lugar)} | Fecha: ${escapeXml(fecha)} | Convocados: ${funcionarios.length}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="26">
    ${headerCells}
   </Row>
${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el Directorio General a Excel con las columnas personalizadas seleccionadas por el usuario
 */
export function exportDirectorioPersonalizadoXLS(
  funcionarios: Funcionario[],
  selectedColumns: Record<string, boolean>,
  filename?: string
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `SIGEF_RRHH_DIRECTORIO_PERSONALIZADO_${dateStr}.xls`;

  // Construir array dinámico de columnas según selectedColumns
  const columns: { id: string; label: string; width: number }[] = [
    { id: 'num', label: 'N°', width: 40 }
  ];

  if (selectedColumns.cedula) columns.push({ id: 'cedula', label: 'Cédula', width: 110 });
  if (selectedColumns.nombres) columns.push({ id: 'nombres', label: 'Nombres y Apellidos', width: 220 });
  if (selectedColumns.cargo) columns.push({ id: 'cargo', label: 'Cargo Nominal / Funcional', width: 200 });
  if (selectedColumns.unidad) columns.push({ id: 'unidad', label: 'Unidad Administrativa', width: 220 });
  if (selectedColumns.sede) columns.push({ id: 'sede', label: 'Sede / Región', width: 140 });
  if (selectedColumns.telefono) columns.push({ id: 'telefono', label: 'Teléfono Móvil', width: 120 });
  if (selectedColumns.email) columns.push({ id: 'email', label: 'Correo Electrónico', width: 180 });
  if (selectedColumns.fechaIngreso) columns.push({ id: 'fechaIngreso', label: 'Fecha Ingreso', width: 110 });
  if (selectedColumns.antiguedad) columns.push({ id: 'antiguedad', label: 'Antigüedad APN', width: 120 });
  if (selectedColumns.completitud) columns.push({ id: 'completitud', label: '% Expediente', width: 90 });
  if (selectedColumns.instruccion) columns.push({ id: 'instruccion', label: 'Nivel Académico / Profesión', width: 180 });
  if (selectedColumns.banco) columns.push({ id: 'banco', label: 'Banco / Cuenta Nómina', width: 190 });
  if (selectedColumns.carnet) columns.push({ id: 'carnet', label: 'Carnet de Identificación', width: 140 });
  if (selectedColumns.tallas) columns.push({ id: 'tallas', label: 'Tallas (Camisa/Pant./Calz.)', width: 140 });
  if (selectedColumns.camposPersonalizados) columns.push({ id: 'camposPersonalizados', label: 'Campos Adicionales', width: 180 });
  if (selectedColumns.firma) columns.push({ id: 'firma', label: 'Firma / Verificación', width: 140 });

  const colTags = columns.map(c => `    <Column ss:Width="${c.width}"/>`).join('\n');
  const headerCells = columns.map(c => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('');

  const rowsXml = funcionarios.map((f, index) => {
    const antiguedad = calcularAntiguedad(
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    const completitud = calcularCompletitudExpediente(f);
    const cells: string[] = [];

    // N°
    cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${index + 1}</Data></Cell>`);

    if (selectedColumns.cedula) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(`${f.identificacion.tipoCedula}-${f.identificacion.cedula}`)}</Data></Cell>`);
    }
    if (selectedColumns.nombres) {
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(`${f.identificacion.nombres} ${f.identificacion.apellidos}`)}</Data></Cell>`);
    }
    if (selectedColumns.cargo) {
      const cargoDesc = f.situacionLaboral.cargoFuncional && f.situacionLaboral.cargoFuncional !== f.situacionLaboral.cargoNominal
        ? `${f.situacionLaboral.cargoNominal} (Func: ${f.situacionLaboral.cargoFuncional})`
        : f.situacionLaboral.cargoNominal;
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(cargoDesc)}</Data></Cell>`);
    }
    if (selectedColumns.unidad) {
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.situacionLaboral.unidadAdministrativa)}</Data></Cell>`);
    }
    if (selectedColumns.sede) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.situacionLaboral.sedeRegion)}</Data></Cell>`);
    }
    if (selectedColumns.telefono) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.contacto.telefonoMovil || 'N/A')}</Data></Cell>`);
    }
    if (selectedColumns.email) {
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(f.contacto.emailInstitucional || f.contacto.emailPersonal || 'N/A')}</Data></Cell>`);
    }
    if (selectedColumns.fechaIngreso) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(f.situacionLaboral.fechaIngresoMinisterio || 'N/A')}</Data></Cell>`);
    }
    if (selectedColumns.antiguedad) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(`${antiguedad.anosTotalesAPN} años`)}</Data></Cell>`);
    }
    if (selectedColumns.completitud) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(`${completitud.porcentaje}%`)}</Data></Cell>`);
    }
    if (selectedColumns.instruccion) {
      const acadDesc = `${f.perfilAcademico.nivelInstruccion} - ${f.perfilAcademico.profesionOficio || f.perfilAcademico.tituloObtenido || 'Sin especificar'}`;
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(acadDesc)}</Data></Cell>`);
    }
    if (selectedColumns.banco) {
      const bco = `${f.situacionLaboral.banco || 'N/A'} - ${f.situacionLaboral.cuentaNomina || 'Sin cuenta'}`;
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(bco)}</Data></Cell>`);
    }
    if (selectedColumns.carnet) {
      const carnetVal = f.situacionLaboral.poseeCarnet
        ? (f.situacionLaboral.codigoCarnet ? `SÍ (${f.situacionLaboral.codigoCarnet})` : 'SÍ')
        : 'NO';
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(carnetVal)}</Data></Cell>`);
    }
    if (selectedColumns.tallas) {
      const tallasDesc = `Camisa: ${f.identificacion.tallaCamisa || '-'} / Pant.: ${f.identificacion.tallaPantalon || '-'} / Calz.: ${f.identificacion.tallaCalzado || '-'}`;
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(tallasDesc)}</Data></Cell>`);
    }
    if (selectedColumns.camposPersonalizados) {
      const cpText = f.camposPersonalizados && f.camposPersonalizados.length > 0
        ? f.camposPersonalizados.map(cp => `${cp.etiqueta}: ${cp.valor}`).join(' | ')
        : 'N/A';
      cells.push(`<Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(cpText)}</Data></Cell>`);
    }
    if (selectedColumns.firma) {
      cells.push(`<Cell ss:StyleID="DataCenter"><Data ss:Type="String"></Data></Cell>`);
    }

    return `    <Row ss:Height="22">\n      ${cells.join('\n      ')}\n    </Row>`;
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="13" ss:Color="#0B4F9C" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#475569" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B4F9C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Directorio Personal">
  <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${funcionarios.length + 8}" x:FullColumns="1" x:FullRows="1">
${colTags}
   <Row ss:Height="24">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">REPÚBLICA BOLIVARIANA DE VENEZUELA - MPPPA - INSOPESCA</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Title">
     <Data ss:Type="String">DIRECTORIO GENERAL DE PERSONAL (CAMPOS PERSONALIZADOS)</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${columns.length - 1}" ss:StyleID="Subtitle">
     <Data ss:Type="String">Emisión: ${new Date().toLocaleDateString('es-VE')} | Total Funcionarios: ${funcionarios.length} | Columnas activas: ${columns.length - 1}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="26">
    ${headerCells}
   </Row>
${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



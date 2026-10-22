import React, { useState } from 'react';
import { 
  Users, 
  FileCheck, 
  Clock, 
  Building2, 
  UserPlus, 
  AlertTriangle, 
  MapPin,
  GraduationCap,
  ArrowRight,
  HeartPulse,
  Home,
  IdCard,
  Shirt,
  Baby,
  Landmark,
  UserCheck,
  Cake,
  Calendar
} from 'lucide-react';
import { Funcionario, calcularCompletitudExpediente, evaluarEstatusJubilacion, calcularEdad, calcularAntiguedad } from '../types/rrhh';

interface DashboardProps {
  funcionarios: Funcionario[];
  onNavigateToDirectorio: (filterCondition?: string) => void;
  onNavigateToCaptacion: () => void;
  onSelectFuncionario: (f: Funcionario) => void;
}

/**
 * Normaliza un texto para agrupar campos iguales sin importar
 * mayúsculas/minúsculas, acentos o espacios repetidos.
 */
function normalizarClaveAgrupacion(valor?: string): string {
  if (!valor) return '';
  return valor
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:-]+$/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function agruparCamposIguales(
  valores: Array<string | undefined>,
  etiquetaPorDefecto: string
): Array<[string, number]> {
  const mapa = new Map<string, { label: string; count: number }>();

  valores.forEach(raw => {
    const limpio = (raw || '').trim().replace(/\s+/g, ' ');
    const clave = normalizarClaveAgrupacion(limpio) || normalizarClaveAgrupacion(etiquetaPorDefecto);
    const existente = mapa.get(clave);
    if (existente) {
      existente.count += 1;
    } else {
      mapa.set(clave, {
        label: limpio || etiquetaPorDefecto,
        count: 1
      });
    }
  });

  return Array.from(mapa.values())
    .sort((a, b) => b.count - a.count)
    .map(item => [item.label, item.count]);
}

export const Dashboard: React.FC<DashboardProps> = ({
  funcionarios,
  onNavigateToDirectorio,
  onNavigateToCaptacion,
  onSelectFuncionario
}) => {
  // 1. Cálculos de KPIs Principales
  const total = funcionarios.length;
  const fijos = funcionarios.filter(f => f.situacionLaboral.condicion === 'FIJO').length;
  const contratados = funcionarios.filter(f => f.situacionLaboral.condicion === 'CONTRATADO').length;
  const jubilados = funcionarios.filter(f => f.situacionLaboral.condicion === 'JUBILADO' || f.situacionLaboral.condicion === 'PENSIONADO').length;
  const altoNivel = funcionarios.filter(f => f.situacionLaboral.condicion === 'ALTO_NIVEL' || f.situacionLaboral.condicion === 'COMISION_SERVICIO').length;

  // Expedientes completos
  const completitudes = funcionarios.map(f => ({
    funcionario: f,
    ...calcularCompletitudExpediente(f)
  }));
  const expedientesCompletos = completitudes.filter(c => c.completo).length;
  const expedientesIncompletos = total - expedientesCompletos;
  const porcentajeAuditoriaGlobal = total > 0 ? Math.round((expedientesCompletos / total) * 100) : 0;

  // Próximos a jubilación
  const listaJubilacion = funcionarios.map(f => {
    const estatus = evaluarEstatusJubilacion(
      f.identificacion.fechaNacimiento,
      f.identificacion.genero,
      f.situacionLaboral.fechaIngresoMinisterio,
      f.situacionLaboral.anosServicioPrevioAPN
    );
    return { funcionario: f, estatus };
  }).filter(item => item.estatus.proximo || item.estatus.califica);

  // 2. Indicadores Demográficos y de Antigüedad
  const mujeres = funcionarios.filter(f => f.identificacion.genero === 'F').length;
  const hombres = funcionarios.filter(f => f.identificacion.genero === 'M').length;
  const pctMujeres = total > 0 ? Math.round((mujeres / total) * 100) : 0;
  const pctHombres = total > 0 ? 100 - pctMujeres : 0;

  const edades = funcionarios.map(f => calcularEdad(f.identificacion.fechaNacimiento)).filter(e => e > 0);
  const edadPromedio = edades.length > 0 ? Math.round(edades.reduce((acc, val) => acc + val, 0) / edades.length) : 0;

  const antiguedadesAPN = funcionarios.map(f => 
    calcularAntiguedad(f.situacionLaboral.fechaIngresoMinisterio, f.situacionLaboral.anosServicioPrevioAPN).anosTotalesAPN
  );
  const antiguedadPromedioAPN = antiguedadesAPN.length > 0
    ? Math.round(antiguedadesAPN.reduce((acc, val) => acc + val, 0) / antiguedadesAPN.length)
    : 0;

  const rangosEdad = {
    jovenes: edades.filter(e => e <= 30).length,
    adultoJoven: edades.filter(e => e >= 31 && e <= 45).length,
    adultoMayor: edades.filter(e => e >= 46 && e <= 59).length,
    terceraEdad: edades.filter(e => e >= 60).length
  };

  // 3. Indicadores de Bienestar Social, Carga Familiar, Menores de Edad (Sexo y Edad) y Vivienda
  const todosFamiliares = funcionarios.flatMap(f => f.cargaFamiliar?.familiares || []);
  const totalFamiliares = todosFamiliares.length;
  const trabajadoresConCarga = funcionarios.filter(f => (f.cargaFamiliar?.familiares?.length || 0) > 0).length;
  const familiaresEstudiantes = todosFamiliares.filter(fam => fam.estudia).length;

  // Menores de edad (< 18 años) de la carga familiar clasificados por sexo y edad
  const menoresConEdad = todosFamiliares
    .map(fam => ({
      ...fam,
      edad: fam.fechaNacimiento ? calcularEdad(fam.fechaNacimiento) : -1
    }))
    .filter(fam => fam.edad >= 0 && fam.edad < 18);

  const totalMenoresEdad = menoresConEdad.length;
  const menoresFemenino = menoresConEdad.filter(m => m.genero === 'F').length;
  const menoresMasculino = menoresConEdad.filter(m => m.genero === 'M').length;

  const rangosMenores = [
    {
      etiqueta: '0 a 2 años (Maternal)',
      rangoCorto: '0 - 2 años',
      femenino: menoresConEdad.filter(m => m.edad >= 0 && m.edad <= 2 && m.genero === 'F').length,
      masculino: menoresConEdad.filter(m => m.edad >= 0 && m.edad <= 2 && m.genero === 'M').length,
      total: menoresConEdad.filter(m => m.edad >= 0 && m.edad <= 2).length
    },
    {
      etiqueta: '3 a 5 años (Preescolar)',
      rangoCorto: '3 - 5 años',
      femenino: menoresConEdad.filter(m => m.edad >= 3 && m.edad <= 5 && m.genero === 'F').length,
      masculino: menoresConEdad.filter(m => m.edad >= 3 && m.edad <= 5 && m.genero === 'M').length,
      total: menoresConEdad.filter(m => m.edad >= 3 && m.edad <= 5).length
    },
    {
      etiqueta: '6 a 11 años (Primaria)',
      rangoCorto: '6 - 11 años',
      femenino: menoresConEdad.filter(m => m.edad >= 6 && m.edad <= 11 && m.genero === 'F').length,
      masculino: menoresConEdad.filter(m => m.edad >= 6 && m.edad <= 11 && m.genero === 'M').length,
      total: menoresConEdad.filter(m => m.edad >= 6 && m.edad <= 11).length
    },
    {
      etiqueta: '12 a 17 años (Adolescentes)',
      rangoCorto: '12 - 17 años',
      femenino: menoresConEdad.filter(m => m.edad >= 12 && m.edad <= 17 && m.genero === 'F').length,
      masculino: menoresConEdad.filter(m => m.edad >= 12 && m.edad <= 17 && m.genero === 'M').length,
      total: menoresConEdad.filter(m => m.edad >= 12 && m.edad <= 17).length
    }
  ];

  // Desglose por edad puntual (0 a 17) y sexo
  const menoresPorEdadExacta: Array<{ edad: number; f: number; m: number; total: number }> = [];
  for (let e = 0; e < 18; e++) {
    const fCount = menoresConEdad.filter(m => m.edad === e && m.genero === 'F').length;
    const mCount = menoresConEdad.filter(m => m.edad === e && m.genero === 'M').length;
    if (fCount + mCount > 0) {
      menoresPorEdadExacta.push({ edad: e, f: fCount, m: mCount, total: fCount + mCount });
    }
  }

  const porVivienda: Record<string, number> = {
    PROPIA: 0,
    ADJUDICADA_GMVV: 0,
    FAMILIAR: 0,
    ALQUILADA: 0,
    OTRA: 0
  };
  funcionarios.forEach(f => {
    const tipo = f.cargaFamiliar?.tipoVivienda || 'OTRA';
    porVivienda[tipo] = (porVivienda[tipo] || 0) + 1;
  });
  const sinViviendaPropia = (porVivienda['FAMILIAR'] || 0) + (porVivienda['ALQUILADA'] || 0) + (porVivienda['OTRA'] || 0);

  // 4. Indicadores de Salud y CONAPDIS
  const conDiscapacidad = funcionarios.filter(f => f.salud?.discapacidadCertificada).length;
  const conPatologias = funcionarios.filter(f => {
    const pat = (f.salud?.patologiasCronicas || '').trim().toUpperCase();
    return pat !== '' && pat !== 'NINGUNA' && pat !== 'NO' && pat !== 'N/A' && pat !== 'SANO';
  }).length;
  const conTratamiento = funcionarios.filter(f => {
    const trat = (f.salud?.tratamientoPermanente || '').trim().toUpperCase();
    return trat !== '' && trat !== 'NINGUNO' && trat !== 'NO' && trat !== 'N/A';
  }).length;

  // 5. Indicadores de Carnetización, Bancos y Dotación de Uniformes (Camisa, Pantalón y Calzado)
  const conCarnetVigente = funcionarios.filter(f => f.situacionLaboral.poseeCarnet && f.situacionLaboral.estatusCarnet !== 'VENCIDO' && f.situacionLaboral.estatusCarnet !== 'EXTRAVIADO').length;
  const sinCarnetOVencido = total - conCarnetVigente;
  const pctCarnetizados = total > 0 ? Math.round((conCarnetVigente / total) * 100) : 0;

  // Tallas de Camisa
  const tallasCamisaOrder: Array<'SS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'> = ['SS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const porTallaCamisa: Record<string, number> = {};
  funcionarios.forEach(f => {
    const talla = (f.identificacion?.tallaCamisa || 'M').trim().toUpperCase();
    porTallaCamisa[talla] = (porTallaCamisa[talla] || 0) + 1;
  });

  // Tallas de Pantalón (agrupadas y ordenadas numéricamente)
  const tallasPantalonOrdenadas = agruparCamposIguales(
    funcionarios.map(f => f.identificacion?.tallaPantalon || 'S/T'),
    'S/T'
  ).sort((a, b) => {
    const numA = parseInt(a[0], 10);
    const numB = parseInt(b[0], 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a[0].localeCompare(b[0]);
  });

  // Tallas de Calzado (agrupadas y ordenadas numéricamente)
  const tallasCalzadoOrdenadas = agruparCamposIguales(
    funcionarios.map(f => f.identificacion?.tallaCalzado || 'S/T'),
    'S/T'
  ).sort((a, b) => {
    const numA = parseInt(a[0], 10);
    const numB = parseInt(b[0], 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a[0].localeCompare(b[0]);
  });

  // Bancos (agrupados si son iguales)
  const bancosOrdenados = agruparCamposIguales(
    funcionarios.map(f => f.situacionLaboral.banco),
    'Sin banco asignado'
  );

  // Distribución por Unidad Administrativa (agrupada si los campos son iguales)
  const unidadesOrdenadas = agruparCamposIguales(
    funcionarios.map(f => f.situacionLaboral.unidadAdministrativa),
    'Sin adscripción'
  );

  // Distribución por Sede Regional / Despliegue Territorial (agrupada si los campos son iguales)
  const sedesOrdenadas = agruparCamposIguales(
    funcionarios.map(f => f.situacionLaboral.sedeRegion),
    'Sin sede asignada'
  );

  // Distribución por Nivel de Instrucción
  const porInstruccion: Record<string, number> = {};
  funcionarios.forEach(f => {
    const nivel = f.perfilAcademico?.nivelInstruccion || 'NO_REGISTRADO';
    porInstruccion[nivel] = (porInstruccion[nivel] || 0) + 1;
  });

  // 6. Cumpleañeros del Mes (Trabajadores y Carga Familiar)
  const hoy = new Date();
  const mesActualIndex = hoy.getMonth();
  const diaHoy = hoy.getDate();
  const anioActual = hoy.getFullYear();

  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [mesCumpleanos, setMesCumpleanos] = useState<number>(mesActualIndex);

  const parseFechaNacimiento = (fechaStr?: string): { dia: number; mes: number; anio: number } | null => {
    if (!fechaStr) return null;
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);
      if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia) && mes >= 0 && mes <= 11) {
        return { dia, mes, anio };
      }
    }
    return null;
  };

  // Conteo de cumpleañeros por cada mes del año (0 a 11)
  const conteoPorMes = Array.from({ length: 12 }, (_, mIdx) => {
    return funcionarios.filter(f => {
      const fn = parseFechaNacimiento(f.identificacion.fechaNacimiento);
      return fn && fn.mes === mIdx;
    }).length;
  });

  // Lista de trabajadores que cumplen años en el mes seleccionado
  const cumpleanerosDelMes = funcionarios
    .map(f => {
      const fn = parseFechaNacimiento(f.identificacion.fechaNacimiento);
      if (!fn || fn.mes !== mesCumpleanos) return null;
      const edadACumplir = anioActual - fn.anio;
      const esHoy = fn.mes === mesActualIndex && fn.dia === diaHoy;
      return {
        funcionario: f,
        dia: fn.dia,
        mes: fn.mes,
        edadACumplir,
        esHoy
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.dia - b.dia);

  // Próximos cumpleañeros del año (para mostrar también referencia rápida si el mes seleccionado no tiene registros)
  const proximosCumpleaneros = funcionarios
    .map(f => {
      const fn = parseFechaNacimiento(f.identificacion.fechaNacimiento);
      if (!fn) return null;
      let proxFecha = new Date(anioActual, fn.mes, fn.dia);
      const hoySinHora = new Date(anioActual, mesActualIndex, diaHoy);
      if (proxFecha < hoySinHora) {
        proxFecha = new Date(anioActual + 1, fn.mes, fn.dia);
      }
      const diasFaltantes = Math.round((proxFecha.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24));
      return {
        funcionario: f,
        dia: fn.dia,
        mes: fn.mes,
        nombreMes: NOMBRES_MESES[fn.mes],
        edadACumplir: proxFecha.getFullYear() - fn.anio,
        diasFaltantes
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.diasFaltantes - b.diasFaltantes)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Ministerial Welcome & Action Banner with Official INSOPESCA Branding */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0B4F9C]/90 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
        {/* Tricolor Ribbon on top border */}
        <div className="absolute top-0 inset-x-0 h-1 grid grid-cols-12">
          <div className="col-span-5 bg-[#FFD100]"></div>
          <div className="col-span-4 bg-[#0B4F9C]"></div>
          <div className="col-span-3 bg-[#D91424]"></div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 pt-2">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-sky-100 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#FFD100]"></span>
              <span>República Bolivariana de Venezuela</span>
              <span aria-hidden="true">·</span>
              <span>MPPPA / INSOPESCA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Gestión Integral de Capital Humano
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Padrón censal, auditoría de expedientes digitales y control de personal del <strong>Instituto Socialista de la Pesca y Acuicultura (INSOPESCA)</strong>, entes adscritos y el Ministerio del Poder Popular para la Pesca y Acuicultura.
            </p>
            
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={onNavigateToCaptacion}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFD100] hover:bg-[#E5BC00] text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Nuevo Registro de Personal</span>
              </button>
              <button
                onClick={() => onNavigateToDirectorio()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all backdrop-blur-xs"
              >
                <Users className="w-4 h-4 text-[#FFD100]" />
                <span>Directorio Completo ({total})</span>
              </button>
            </div>
          </div>

          {/* INSOPESCA Featured Logo Seal Card */}
          <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-white/80 shrink-0 self-center md:self-auto hidden sm:block">
            <img
              src="/assets/aistudio/LOGO-INSOPESCA_83aabce5.png"
              alt="INSOPESCA Logo Oficial"
              className="w-36 h-36 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Personal */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Servidores
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4F9C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {total}
            </span>
            <span className="text-xs text-slate-500">en plantilla</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Fijos: <strong className="text-slate-900 font-mono-numbers">{fijos}</strong></span>
            <span>Contratados: <strong className="text-slate-900 font-mono-numbers">{contratados}</strong></span>
          </div>
        </div>

        {/* KPI 2: Condición Jurídica Laboral */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estabilidad Laboral
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0B4F9C] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B4F9C] font-mono-numbers">
              {Math.round((fijos / (total || 1)) * 100)}%
            </span>
            <span className="text-xs text-slate-500">personal fijo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Alto Nivel: <strong className="text-slate-900 font-mono-numbers">{altoNivel}</strong></span>
            <span>Jubilados: <strong className="text-slate-900 font-mono-numbers">{jubilados}</strong></span>
          </div>
        </div>

        {/* KPI 3: Expedientes Digitales */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Auditoría Digital
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              porcentajeAuditoriaGlobal >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {porcentajeAuditoriaGlobal}%
            </span>
            <span className="text-xs text-emerald-700 font-medium">expedientes al día</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{expedientesCompletos} Completos</span>
            <span className="text-amber-700 font-medium">{expedientesIncompletos} Pendientes</span>
          </div>
        </div>

        {/* KPI 4: Próximos a Jubilarse */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Régimen Jubilación
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900 font-mono-numbers">
              {listaJubilacion.length}
            </span>
            <span className="text-xs text-slate-500">califican / próximos</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Antigüedad prom.: <strong className="text-slate-900 font-mono-numbers">{antiguedadPromedioAPN}a APN</strong></span>
            <button 
              onClick={() => onNavigateToDirectorio('jubilacion')}
              className="text-[#0B4F9C] hover:underline font-semibold text-[11px]"
            >
              Auditar lista
            </button>
          </div>
        </div>

      </div>

      {/* Secondary Executive KPIs Grid (Row 2: Demografía, Carga Familiar, Salud/CONAPDIS, Carnetización) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 5: Equidad de Género y Edad Promedio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Demografía y Género
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {edadPromedio}
            </span>
            <span className="text-xs text-slate-500">años (edad promedio)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Mujeres: <strong className="text-rose-700 font-mono-numbers">{mujeres} ({pctMujeres}%)</strong></span>
            <span>Hombres: <strong className="text-[#0B4F9C] font-mono-numbers">{hombres} ({pctHombres}%)</strong></span>
          </div>
        </div>

        {/* KPI 6: Carga Familiar y Menores de Edad */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Carga Familiar y Menores
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-900 font-mono-numbers">
              {totalMenoresEdad}
            </span>
            <span className="text-xs text-slate-500">menores (&lt;18a) / {totalFamiliares} dep.</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Niñas (F): <strong className="text-rose-700 font-mono-numbers">{menoresFemenino}</strong></span>
            <span>Niños (M): <strong className="text-[#0B4F9C] font-mono-numbers">{menoresMasculino}</strong></span>
          </div>
        </div>

        {/* KPI 7: Salud Ocupacional y CONAPDIS */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Salud y CONAPDIS
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#D91424] flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {conPatologias}
            </span>
            <span className="text-xs text-slate-500">con condición médica</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>CONAPDIS: <strong className="text-[#D91424] font-mono-numbers">{conDiscapacidad}</strong></span>
            <span>Tratamiento: <strong className="text-slate-900 font-mono-numbers">{conTratamiento}</strong></span>
          </div>
        </div>

        {/* KPI 8: Control de Carnetización Institucional */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Carnetización
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0B4F9C] flex items-center justify-center">
              <IdCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-numbers">
              {pctCarnetizados}%
            </span>
            <span className="text-xs text-slate-500">con carnet vigente</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{conCarnetVigente} Vigentes</span>
            <span className="text-rose-700 font-medium">{sinCarnetOVencido} Sin carnet/Venc.</span>
          </div>
        </div>

      </div>

      {/* Main Analysis Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Distribución por Dependencia Administrativa */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Distribución por Unidad Administrativa
              </h2>
              <p className="text-xs text-slate-500">
                Direcciones de Línea de INSOPESCA y Entes del Sector (Agrupadas)
              </p>
            </div>
            <span className="text-xs font-mono-numbers text-slate-500">
              {unidadesOrdenadas.length} adscripciones
            </span>
          </div>

          <div className="space-y-3.5">
            {unidadesOrdenadas.slice(0, 6).map(([unidad, cantidad]) => {
              const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
              return (
                <div key={unidad} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[280px]" title={unidad}>
                      {unidad}
                    </span>
                    <span className="font-mono-numbers font-semibold text-slate-700 shrink-0">
                      {cantidad} ({porcentaje}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0B4F9C] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(porcentaje, 5)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Distribución por Sede Territorial (Agrupada) y Formación */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Despliegue Territorial INSOPESCA
                </h2>
                <p className="text-xs text-slate-500">
                  Sedes regionales e inspectorías agrupadas automáticamente por nombre igual
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono-numbers text-slate-500">
                  {sedesOrdenadas.length} {sedesOrdenadas.length === 1 ? 'sede' : 'sedes'}
                </span>
                <MapPin className="w-4 h-4 text-[#0B4F9C]" />
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {sedesOrdenadas.slice(0, 6).map(([sede, cantidad]) => {
                const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
                return (
                  <div key={sede} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-medium truncate max-w-[260px]" title={sede}>
                        {sede}
                      </span>
                      <span className="font-mono-numbers font-semibold text-slate-700 shrink-0">
                        {cantidad} {cantidad === 1 ? 'servidor' : 'servidores'} ({porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#0B4F9C] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(porcentaje, 6)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrucción Académica Bar Summary */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#0B4F9C]" />
              <span>Nivel Académico del Personal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">Universitarios</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {(porInstruccion['UNIVERSITARIO'] || 0) + (porInstruccion['MAESTRIA'] || 0) + (porInstruccion['DOCTORADO'] || 0) + (porInstruccion['ESPECIALIZACION'] || 0)}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">TSU</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {porInstruccion['TSU'] || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <div className="text-slate-500 text-[11px]">Bachilleres</div>
                <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                  {porInstruccion['BACHILLER'] || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Menores de Edad en Carga Familiar (Clasificados por Sexo y Edad) + Consolidado Completo de Tallas de Dotación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel: Menores de Edad de la Carga Familiar Clasificados por Sexo y Edad */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Menores de Edad en Carga Familiar (Sexo y Edad)
                </h2>
                <p className="text-xs text-slate-500">
                  Hijos y dependientes menores de 18 años clasificados por género y rango etario
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Baby className="w-4 h-4" />
              </div>
            </div>

            {/* Resumen General de Menores por Sexo */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Total Menores (&lt;18a)</div>
                <div className="text-xl font-extrabold text-slate-900 font-mono-numbers mt-0.5">
                  {totalMenoresEdad}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-[11px] font-semibold text-rose-800">Femenino (Niñas)</div>
                <div className="text-xl font-extrabold text-rose-700 font-mono-numbers mt-0.5">
                  {menoresFemenino}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="text-[11px] font-semibold text-blue-800">Masculino (Niños)</div>
                <div className="text-xl font-extrabold text-[#0B4F9C] font-mono-numbers mt-0.5">
                  {menoresMasculino}
                </div>
              </div>
            </div>

            {/* Tabla por Rangos de Edad y Sexo */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-left font-bold">Grupo de Edad</th>
                    <th className="py-2 px-2 text-center font-bold text-rose-700">Femenino (F)</th>
                    <th className="py-2 px-2 text-center font-bold text-[#0B4F9C]">Masculino (M)</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-900">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rangosMenores.map((rango) => (
                    <tr key={rango.rangoCorto} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-800">{rango.etiqueta}</td>
                      <td className="py-2 px-2 text-center font-mono-numbers font-semibold text-rose-700">
                        {rango.femenino}
                      </td>
                      <td className="py-2 px-2 text-center font-mono-numbers font-semibold text-[#0B4F9C]">
                        {rango.masculino}
                      </td>
                      <td className="py-2 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        {rango.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose por Edad Exacta (Año a Año) y Sexo */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              <span>Detalle por Edad Exacta y Sexo</span>
              <span className="text-teal-700 font-semibold">{familiaresEstudiantes} estudiando</span>
            </div>
            {menoresPorEdadExacta.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {menoresPorEdadExacta.map((item) => (
                  <div
                    key={item.edad}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
                  >
                    <span className="font-bold text-slate-800 font-mono-numbers">
                      {item.edad} {item.edad === 1 ? 'año' : 'años'}:
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono-numbers">{item.total}</span>
                    <span className="text-[11px] text-slate-500 font-mono-numbers">
                      (
                      <span className="text-rose-700 font-semibold">F:{item.f}</span>
                      {' · '}
                      <span className="text-[#0B4F9C] font-semibold">M:{item.m}</span>
                      )
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Sin menores de edad registrados en la carga familiar actual.
              </p>
            )}
          </div>
        </div>

        {/* Panel: Consolidado de Tallas de Dotación (Camisa, Pantalón y Calzado) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Consolidado de Tallas de Dotación
                </h2>
                <p className="text-xs text-slate-500">
                  Camisa, pantalón y calzado del personal registrado ({total} servidores)
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4F9C] flex items-center justify-center shrink-0">
                <Shirt className="w-4 h-4" />
              </div>
            </div>

            {/* 1. Tallas de Camisa */}
            <div className="mb-4">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>1. Tallas de Camisa</span>
                <span className="text-[10px] text-slate-400 font-normal">Corte Institucional</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {tallasCamisaOrder.map((talla) => (
                  <div key={talla} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500">{talla}</div>
                    <div className="font-mono-numbers font-extrabold text-[#0B4F9C] text-sm mt-0.5">
                      {porTallaCamisa[talla] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Tallas de Pantalón */}
            <div className="mb-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>2. Tallas de Pantalón</span>
                <span className="text-[10px] text-slate-400 font-normal">Agrupadas por medida</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tallasPantalonOrdenadas.map(([talla, cantidad]) => (
                  <div
                    key={talla}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-50/70 border border-sky-200 flex items-center gap-2 text-xs"
                  >
                    <span className="text-slate-600 font-medium">Talla <strong className="text-slate-900 font-mono-numbers">{talla}</strong>:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[#0B4F9C] font-mono-numbers font-extrabold border border-sky-200">
                      {cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Tallas de Calzado */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>3. Tallas de Calzado / Botas</span>
              <span className="text-[10px] text-slate-400 font-normal">Numeración nacional</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tallasCalzadoOrdenadas.map(([talla, cantidad]) => (
                <div
                  key={talla}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-xs"
                >
                  <span className="text-slate-600 font-medium">N° <strong className="text-slate-900 font-mono-numbers">{talla}</strong>:</span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-amber-900 font-mono-numbers font-extrabold border border-amber-200">
                    {cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Institutional Indicators Row 2 (2 Columns: Vivienda/Demografía y Bancarización) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Situación Habitacional y Estructura Etaria */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Censo de Vivienda y Demografía Laboral
                </h2>
                <p className="text-xs text-slate-500">
                  Tenencia de vivienda y grupos etarios de los trabajadores
                </p>
              </div>
              <Home className="w-4 h-4 text-[#0B4F9C]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div className="text-emerald-800 text-[11px] font-medium">Vivienda Propia</div>
                <div className="font-mono-numbers font-extrabold text-emerald-950 text-base">
                  {porVivienda['PROPIA'] || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-blue-800 text-[11px] font-medium">Adjudicada GMVV</div>
                <div className="font-mono-numbers font-extrabold text-blue-950 text-base">
                  {porVivienda['ADJUDICADA_GMVV'] || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-amber-800 text-[11px] font-medium">Vivienda Familiar</div>
                <div className="font-mono-numbers font-extrabold text-amber-950 text-base">
                  {porVivienda['FAMILIAR'] || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                <div className="text-rose-800 text-[11px] font-medium">Alquilada / Otra</div>
                <div className="font-mono-numbers font-extrabold text-rose-950 text-base">
                  {(porVivienda['ALQUILADA'] || 0) + (porVivienda['OTRA'] || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              <span>Pirámide Etaria de Trabajadores</span>
              <span className="text-amber-700 font-semibold">{sinViviendaPropia} requieren apoyo hab.</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">≤30 años</div>
                <div className="font-mono-numbers font-bold text-slate-900">{rangosEdad.jovenes}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">31-45a</div>
                <div className="font-mono-numbers font-bold text-slate-900">{rangosEdad.adultoJoven}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">46-59a</div>
                <div className="font-mono-numbers font-bold text-slate-900">{rangosEdad.adultoMayor}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500">60+ años</div>
                <div className="font-mono-numbers font-bold text-amber-800">{rangosEdad.terceraEdad}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Bancarización de Nómina y Carga Familiar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Entidades Bancarias de Nómina
                </h2>
                <p className="text-xs text-slate-500">
                  Distribución de cuentas bancarias (20 dígitos) agrupadas por entidad
                </p>
              </div>
              <Landmark className="w-4 h-4 text-[#0B4F9C]" />
            </div>

            <div className="space-y-2.5 mb-4">
              {bancosOrdenados.slice(0, 4).map(([banco, cantidad]) => {
                const pct = total > 0 ? Math.round((cantidad / total) * 100) : 0;
                return (
                  <div key={banco} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-[260px]" title={banco}>
                        {banco}
                      </span>
                      <span className="font-mono-numbers font-semibold text-slate-700 shrink-0">
                        {cantidad} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#0B4F9C] h-full rounded-full" 
                        style={{ width: `${Math.max(pct, 6)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Trabajadores con carga familiar: <strong className="text-slate-900 font-mono-numbers">{trabajadoresConCarga}</strong>
            </span>
            <span className="text-[11px] font-semibold text-[#0B4F9C]">
              {total > 0 ? Math.round((trabajadoresConCarga / total) * 100) : 0}% de la plantilla
            </span>
          </div>
        </div>

      </div>

      {/* Panel de Cumpleañeros del Mes */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Cumpleañeros del Mes de {NOMBRES_MESES[mesCumpleanos]}
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono-numbers font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {cumpleanerosDelMes.length} {cumpleanerosDelMes.length === 1 ? 'servidor' : 'servidores'}
                </span>
                {mesCumpleanos === mesActualIndex && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Mes Actual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Natalicios del personal activo y adscrito a INSOPESCA ordenados por día del mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mesCumpleanos !== mesActualIndex && (
              <button
                type="button"
                onClick={() => setMesCumpleanos(mesActualIndex)}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#0B4F9C] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                Volver a {NOMBRES_MESES[mesActualIndex]} (Actual)
              </button>
            )}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={mesCumpleanos}
                onChange={(e) => setMesCumpleanos(Number(e.target.value))}
                aria-label="Seleccionar mes de cumpleaños"
                className="pl-8 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4F9C] cursor-pointer"
              >
                {NOMBRES_MESES.map((nombre, idx) => (
                  <option key={nombre} value={idx}>
                    {nombre} ({conteoPorMes[idx]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Barra rápida de los 12 meses con indicador de cantidad */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 mb-4 pb-3 border-b border-slate-100">
          {NOMBRES_MESES.map((nombre, idx) => {
            const activo = idx === mesCumpleanos;
            const esMesActual = idx === mesActualIndex;
            const cant = conteoPorMes[idx];
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => setMesCumpleanos(idx)}
                className={`px-2 py-1.5 rounded-lg text-center transition-all border cursor-pointer flex flex-col items-center justify-center ${
                  activo
                    ? 'bg-[#0B4F9C] text-white border-[#0B4F9C] shadow-xs'
                    : esMesActual
                    ? 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {nombre.slice(0, 3)}
                </span>
                <span className={`text-xs font-mono-numbers font-extrabold ${
                  activo ? 'text-[#FFD100]' : cant > 0 ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {cant}
                </span>
              </button>
            );
          })}
        </div>

        {/* Listado de Cumpleañeros del Mes Seleccionado */}
        {cumpleanerosDelMes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cumpleanerosDelMes.map(({ funcionario, dia, edadACumplir, esHoy }) => (
              <div
                key={funcionario.id}
                onClick={() => onSelectFuncionario(funcionario)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  esHoy
                    ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-300 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar o Foto con insignia de día */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs">
                      {funcionario.identificacion.fotoUrl ? (
                        <img
                          src={funcionario.identificacion.fotoUrl}
                          alt={funcionario.identificacion.nombres}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                          {funcionario.identificacion.nombres.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={` -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[10px] font-mono-numbers font-extrabold border shadow-2xs text-center ${
                      esHoy
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-[#0B4F9C] text-white border-blue-900'
                    }`}>
                      Día {String(dia).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}
                      </span>
                      {esHoy && (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 rounded">
                          ¡Hoy!
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers">
                      C.I. {funcionario.identificacion.tipoCedula}-{funcionario.identificacion.cedula}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate" title={funcionario.situacionLaboral.unidadAdministrativa}>
                      {funcionario.situacionLaboral.cargoNominal} · {funcionario.situacionLaboral.sedeRegion}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] font-bold text-amber-700 uppercase">
                      {String(dia).padStart(2, '0')} {NOMBRES_MESES[mesCumpleanos].slice(0, 3)}
                    </div>
                    <div className="text-xs font-mono-numbers font-extrabold text-slate-900">
                      {edadACumplir} años
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-700">
                No hay servidores registrados con fecha de cumpleaños en el mes de {NOMBRES_MESES[mesCumpleanos]}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Puede seleccionar otro mes en las pestañas superiores o consultar los próximos natalicios programados a continuación:
              </p>
            </div>

            {proximosCumpleaneros.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Próximos Cumpleaños en el Calendario Institucional</span>
                  <span className="text-[10px] text-slate-400 font-normal">Orden cronológico</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {proximosCumpleaneros.map(({ funcionario, dia, nombreMes, edadACumplir, diasFaltantes }) => (
                    <div
                      key={funcionario.id}
                      onClick={() => onSelectFuncionario(funcionario)}
                      className="p-2.5 rounded-xl bg-amber-50/40 hover:bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          {funcionario.identificacion.fotoUrl ? (
                            <img
                              src={funcionario.identificacion.fotoUrl}
                              alt={funcionario.identificacion.nombres}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                              {funcionario.identificacion.nombres.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {funcionario.situacionLaboral.unidadAdministrativa}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono-numbers font-bold text-[#0B4F9C]">
                          {String(dia).padStart(2, '0')} de {nombreMes}
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold">
                          Cumple {edadACumplir}a {diasFaltantes === 0 ? '(¡Hoy!)' : `(en ${diasFaltantes}d)`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alertas Tempranas de Gestión de Personal */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Alertas de Jubilación y Auditoría Normativa APN
              </h2>
              <p className="text-xs text-slate-500">
                Funcionarios de INSOPESCA con calificación para trámite de jubilación
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToDirectorio('jubilacion')}
            className="text-xs text-[#0B4F9C] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos los casos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {listaJubilacion.slice(0, 4).map(({ funcionario, estatus }) => (
            <div 
              key={funcionario.id} 
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => onSelectFuncionario(funcionario)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  {funcionario.identificacion.fotoUrl ? (
                    <img 
                      src={funcionario.identificacion.fotoUrl} 
                      alt={funcionario.identificacion.nombres} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                      {funcionario.identificacion.nombres.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{funcionario.identificacion.nombres} {funcionario.identificacion.apellidos}</span>
                    <span className="font-mono-numbers text-[11px] text-slate-500 font-normal">
                      C.I. {funcionario.identificacion.tipoCedula}-{funcionario.identificacion.cedula}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {funcionario.situacionLaboral.cargoNominal} · {funcionario.situacionLaboral.sedeRegion}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:self-center self-start pl-12 sm:pl-0">
                <div className="text-right">
                  <div className="text-xs font-semibold text-amber-800">
                    {estatus.motivo}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ingreso: {funcionario.situacionLaboral.fechaIngresoMinisterio} (+{funcionario.situacionLaboral.anosServicioPrevioAPN}a APN)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFuncionario(funcionario);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0B4F9C] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors shrink-0"
                >
                  Ver Ficha
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

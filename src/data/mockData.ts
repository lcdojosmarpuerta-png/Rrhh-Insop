import { Funcionario } from '../types/rrhh';

export const INITIAL_FUNCIONARIOS: Funcionario[] = [
  {
    id: 'f-maria-pena-rrhh',
    fechaRegistro: '2023-01-10',
    fechaUltimaActualizacion: '2026-03-15',
    identificacion: {
      fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      tipoCedula: 'V',
      cedula: '21.458.712',
      tipoRif: 'V',
      rif: '21458712-8',
      nombres: 'Maria Alejandra',
      apellidos: 'Peña Rodríguez',
      fechaNacimiento: '1993-04-18',
      lugarNacimiento: 'Caracas, Distrito Capital',
      genero: 'F',
      estadoCivil: 'SOLTERO',
      lateralidad: 'DIESTRO',
      tipoSangre: 'O+',
      tallaCamisa: 'S',
      tallaPantalon: '28',
      tallaCalzado: '37'
    },
    contacto: {
      telefonoMovil: '0412-8902145',
      telefonoHabitacion: '0212-4829900',
      emailInstitucional: 'mpena@insopesca.gob.ve',
      emailPersonal: 'maria.pena.rrhh@gmail.com',
      estado: 'Caracas (Distrito Capital)',
      municipio: 'Libertador',
      parroquia: 'San Bernardino',
      sector: 'San Bernardino Norte',
      calleCasa: 'Avenida Vollmer, Residencias Los Samanes, Piso 5, Apto 5-A'
    },
    situacionLaboral: {
      condicion: 'FIJO',
      codigoNomina: 'EMP-00388',
      cargoNominal: 'Analista de Recursos Humanos III',
      cargoFuncional: 'Enlaces RRHH',
      unidadAdministrativa: 'Oficina de Gestión Humana / Dirección General de Recursos Humanos',
      sedeRegion: 'Sede Central Caracas / Enlaces Regionales',
      fechaIngresoMinisterio: '2018-06-15',
      anosServicioPrevioAPN: 2,
      banco: 'Banco de Venezuela (0102)',
      cuentaNomina: '01020188990100456789',
      poseeCarnet: true,
      codigoCarnet: 'CARNET-INS-00388',
      estatusCarnet: 'VIGENTE'
    },
    perfilAcademico: {
      nivelInstruccion: 'UNIVERSITARIO',
      profesionOficio: 'Licenciada en Relaciones Industriales y Gestión del Talento',
      tituloObtenido: 'Licenciada en Relaciones Industriales',
      institucion: 'Universidad Central de Venezuela (UCV)',
      anoGraduacion: 2016,
      cursosCertificaciones: [
        {
          id: 'cur-mp-1',
          nombreCurso: 'Gestión Integral del Expediente Digital en la Administración Pública Nacional',
          institucion: 'Escuela Venezolana de Planificación (EVP)',
          ano: 2023,
          horasAcademicas: 90
        },
        {
          id: 'cur-mp-2',
          nombreCurso: 'Régimen de Jubilaciones y Pensiones según Ley del Estatuto de la Función Pública',
          institucion: 'Superintendencia de Seguridad Social (SISS)',
          ano: 2024,
          horasAcademicas: 60
        }
      ]
    },
    cargaFamiliar: {
      tipoVivienda: 'FAMILIAR',
      observacionesVivienda: 'Residencia en núcleo familiar principal',
      familiares: [
        {
          id: 'fam-mp-1',
          parentesco: 'MADRE',
          nombres: 'Carmen Elena',
          apellidos: 'Rodríguez de Peña',
          cedula: '7.821.450',
          fechaNacimiento: '1962-09-12',
          genero: 'F',
          estudia: false,
          discapacidad: false
        }
      ]
    },
    salud: {
      alergias: 'Ninguna conocida',
      patologiasCronicas: 'Ninguna',
      discapacidadCertificada: false,
      tratamientoPermanente: 'Ninguno',
      contactoEmergenciaNombre: 'Carmen Elena Rodríguez',
      contactoEmergenciaParentesco: 'Madre',
      contactoEmergenciaTelefono: '0414-2331189'
    },
    expedienteDigital: [
      {
        id: 'doc-mp-1',
        tipo: 'CEDULA',
        titulo: 'Cédula de Identidad Ampliada',
        nombreArchivo: 'CI_V21458712_Pena_Maria.pdf',
        tamanoKb: 410,
        fechaCarga: '2023-01-10',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-mp-2',
        tipo: 'RIF',
        titulo: 'Registro de Información Fiscal (RIF Vigente)',
        nombreArchivo: 'RIF_V214587128_SENIAT.pdf',
        tamanoKb: 340,
        fechaCarga: '2024-02-15',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-mp-3',
        tipo: 'FONDO_NEGRO_TITULO',
        titulo: 'Fondo Negro Certificado de Título Lic. Relaciones Industriales UCV',
        nombreArchivo: 'Titulo_UCV_Pena_FondoNegro.pdf',
        tamanoKb: 1150,
        fechaCarga: '2023-01-11',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-mp-4',
        tipo: 'SINTESIS_CURRICULAR',
        titulo: 'Síntesis Curricular Certificada con Soportes',
        nombreArchivo: 'Curriculum_Pena_Maria_RRHH.pdf',
        tamanoKb: 780,
        fechaCarga: '2025-05-20',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-mp-5',
        tipo: 'ANTECEDENTES_FP023',
        titulo: 'Constancia de Antecedentes de Servicios FP-023 APN',
        nombreArchivo: 'FP023_Pena_Maria_Antiguedad.pdf',
        tamanoKb: 620,
        fechaCarga: '2023-01-12',
        verificado: true,
        obligatorio: true
      }
    ],
    camposPersonalizados: [
      {
        id: 'cp-mp-1',
        etiqueta: 'Rol de Sistema SIGEF',
        valor: 'Usuario Administrador / Enlace Principal RRHH'
      },
      {
        id: 'cp-mp-2',
        etiqueta: 'Serial Carnet de la Patria',
        valor: '001928471203'
      }
    ]
  },
  {
    id: 'f-mirla-escalona-barinas',
    fechaRegistro: '2022-09-01',
    fechaUltimaActualizacion: '2026-03-12',
    identificacion: {
      fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
      tipoCedula: 'V',
      cedula: '14.892.341',
      tipoRif: 'V',
      rif: '14892341-3',
      nombres: 'Mirla Coromoto',
      apellidos: 'Escalona Briceño',
      fechaNacimiento: '1978-08-14',
      lugarNacimiento: 'Barinas, Estado Barinas',
      genero: 'F',
      estadoCivil: 'CASADO',
      lateralidad: 'DIESTRO',
      tipoSangre: 'A+',
      tallaCamisa: 'M',
      tallaPantalon: '32',
      tallaCalzado: '37'
    },
    contacto: {
      telefonoMovil: '0414-5789123',
      telefonoHabitacion: '0273-5321144',
      emailInstitucional: 'mescalona@insopesca.gob.ve',
      emailPersonal: 'mirla.escalona.barinas@gmail.com',
      estado: 'Barinas',
      municipio: 'Barinas',
      parroquia: 'Alto Barinas',
      sector: 'Alto Barinas Norte',
      calleCasa: 'Avenida Francia con Calle 5, Quinta Los Bucares, N° 12-B'
    },
    situacionLaboral: {
      condicion: 'ALTO_NIVEL',
      codigoNomina: 'DIR-00108',
      cargoNominal: 'Gerente Regional',
      cargoFuncional: 'Gerente Regional Barinas',
      unidadAdministrativa: 'Gerencia Regional Barinas / Subgerencia Operativa Los Llanos',
      sedeRegion: 'Sede Regional Barinas',
      fechaIngresoMinisterio: '2017-02-01',
      anosServicioPrevioAPN: 8,
      banco: 'Banco de Venezuela (0102)',
      cuentaNomina: '01020456780100987654',
      poseeCarnet: true,
      codigoCarnet: 'CARNET-INS-00108',
      estatusCarnet: 'VIGENTE'
    },
    perfilAcademico: {
      nivelInstruccion: 'ESPECIALIZACION',
      profesionOficio: 'Licenciada en Administración de Empresas Agropecuarias y Pesqueras',
      tituloObtenido: 'Especialista en Gerencia del Sector Público',
      institucion: 'Universidad Nacional Experimental de los Llanos Occidentales Ezequiel Zamora (UNELLEZ)',
      anoGraduacion: 2011,
      cursosCertificaciones: [
        {
          id: 'cur-me-1',
          nombreCurso: 'Alta Gerencia Pública y Conducción Territorial de Políticas de Pesca Continental',
          institucion: 'Escuela Venezolana de Planificación (EVP)',
          ano: 2022,
          horasAcademicas: 140
        },
        {
          id: 'cur-me-2',
          nombreCurso: 'Desarrollo de Cuencas Hidrográficas y Ordenamiento de Pesca Fluvial en los Llanos',
          institucion: 'INSOPESCA - CENIPA',
          ano: 2024,
          horasAcademicas: 80
        }
      ]
    },
    cargaFamiliar: {
      tipoVivienda: 'PROPIA',
      observacionesVivienda: 'Vivienda unifamiliar propia',
      familiares: [
        {
          id: 'fam-me-1',
          parentesco: 'CONYUGE',
          nombres: 'José Gregorio',
          apellidos: 'Mendoza Pérez',
          cedula: '13.560.892',
          fechaNacimiento: '1976-11-20',
          genero: 'M',
          estudia: false,
          discapacidad: false
        },
        {
          id: 'fam-me-2',
          parentesco: 'HIJO',
          nombres: 'Gabriel Alejandro',
          apellidos: 'Mendoza Escalona',
          cedula: '31.450.210',
          fechaNacimiento: '2008-05-19',
          genero: 'M',
          estudia: true,
          discapacidad: false
        }
      ]
    },
    salud: {
      alergias: 'Alergia al polen estacional',
      patologiasCronicas: 'Hipertensión arterial controlada',
      discapacidadCertificada: false,
      tratamientoPermanente: 'Losartán Potásico 50mg / diario',
      contactoEmergenciaNombre: 'José Gregorio Mendoza',
      contactoEmergenciaParentesco: 'Cónyuge',
      contactoEmergenciaTelefono: '0414-5339901'
    },
    expedienteDigital: [
      {
        id: 'doc-me-1',
        tipo: 'CEDULA',
        titulo: 'Cédula de Identidad Ampliada',
        nombreArchivo: 'CI_V14892341_Escalona_Mirla.pdf',
        tamanoKb: 490,
        fechaCarga: '2022-09-01',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-me-2',
        tipo: 'RIF',
        titulo: 'Registro de Información Fiscal (RIF Vigente)',
        nombreArchivo: 'RIF_V148923413_SENIAT.pdf',
        tamanoKb: 360,
        fechaCarga: '2024-03-01',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-me-3',
        tipo: 'FONDO_NEGRO_TITULO',
        titulo: 'Fondo Negro Certificado del Título Universitario UNELLEZ',
        nombreArchivo: 'Titulo_UNELLEZ_Escalona_FondoNegro.pdf',
        tamanoKb: 1320,
        fechaCarga: '2022-09-02',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-me-4',
        tipo: 'SINTESIS_CURRICULAR',
        titulo: 'Síntesis Curricular Oficial de Alto Nivel con Soportes',
        nombreArchivo: 'CV_Escalona_Mirla_Gerencia_Barinas.pdf',
        tamanoKb: 920,
        fechaCarga: '2025-08-14',
        verificado: true,
        obligatorio: true
      },
      {
        id: 'doc-me-5',
        tipo: 'ANTECEDENTES_FP023',
        titulo: 'Constancia de Antecedentes de Servicios FP-023 APN (8 años previos)',
        nombreArchivo: 'FP023_Escalona_Mirla_APN.pdf',
        tamanoKb: 880,
        fechaCarga: '2022-09-03',
        verificado: true,
        obligatorio: true
      }
    ],
    camposPersonalizados: [
      {
        id: 'cp-me-1',
        etiqueta: 'Resolución de Designación en Gaceta',
        valor: 'Gaceta Oficial N° 42.110 - Gerente Regional INSOPESCA Barinas'
      },
      {
        id: 'cp-me-2',
        etiqueta: 'Región Hidrográfica Asignada',
        valor: 'Cuenca del Río Apure - Barinas - Los Llanos'
      }
    ]
  }
];

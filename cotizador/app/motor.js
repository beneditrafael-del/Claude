// Motor de cálculo del cotizador GH.
//  - Una abertura tiene un marco total (ancho × alto) que se puede dividir con parantes (verticales)
//    o travesaños (horizontales) en secciones. Cada sección tiene su tipo, hojas, mano y mosquitero.
//  - hetmo(): reproduce el "Análisis de importes" de Hetmo a partir del despiece.
//    Exacto (al centavo) para una sola sección de: corrediza Prime 74 2 hojas, de abrir DC 66-85 1 hoja
//    y paño fijo DC, verificado contra capturas de Hetmo. El resto se arma por analogía (aproximado).
(function (root) {
  'use strict';

  const TIPOS = {
    abrir:     { nombre: 'De abrir',        hojas: [1, 2, 3], ficha: '108 DC 66-85', mosq: 'fijo', desc: 'de abrir' },
    oscilo:    { nombre: 'Oscilobatiente',  hojas: [1, 2],    ficha: '108 DC 66-85', mosq: 'fijo', desc: 'oscilobatiente' },
    corrediza: { nombre: 'Corrediza',       hojas: [2, 3, 4], ficha: '175 LINEA PRIME 74', mosq: 'corredizo', desc: 'corrediza' },
    pano:      { nombre: 'Paño fijo',       hojas: [0],       ficha: 'Paño fijo DC 58-66', mosq: 'fijo', desc: 'paño fijo' },
    proy:      { nombre: 'Proyectante',     hojas: [1],       ficha: 'DC 66-85', mosq: 'fijo', desc: 'proyectante' },
    band:      { nombre: 'Banderola',       hojas: [1],       ficha: 'DC 66-85', mosq: 'fijo', desc: 'banderola' },
    puerta:    { nombre: 'Puerta DC 100',   hojas: [1, 2],    ficha: '109 DC 66-100', mosq: null, desc: 'puerta de rebatir' },
  };

  const COLORES = {
    blanco:      { nombre: 'Blanco' },
    golden:      { nombre: 'Golden Oak' },
    nogal:       { nombre: 'Nogal' },
    grafito:     { nombre: 'Gris Grafito' },
    negro:       { nombre: 'Negro (Jet Black)' },
    turner:      { nombre: 'Turner Oak' },
    bic_golden:  { nombre: 'Blanco int. / Golden Oak ext.' },
    bic_grafito: { nombre: 'Blanco int. / Gris Grafito ext.' },
    bic_negro:   { nombre: 'Blanco int. / Negro ext.' },
  };

  // Vidrios: precio en pesos por m² de la lista de almacén (corregido ×1,001 como lo toma Hetmo)
  // y separador de cámara en pesos por metro.
  const VIDRIOS = {
    dvh:        { nombre: 'DVH 4/12/4 incoloro',          cod: '4/12/4 INC',     ars: 34379, camara: 'C12', wmaker: 'doble vidriado hermetico 4/12/4', multWM: 1.00 },
    dvh_lam:    { nombre: 'DVH laminado 3+3 / 9 / 4',     cod: '3+3/9/4 INC',    ars: 72169, camara: 'C9',  wmaker: 'doble vidriado hermetico lam 3+3 + camara 9 + float 4', multWM: 1.17 },
    dvh_lamlam: { nombre: 'DVH laminado 3+3 / 9 / 3+3',   cod: '3+3/9/3+3 INC',  ars: 109959, camara: 'C9', wmaker: 'doble vid lam 3+3 + camara 9 + lam 3+3', multWM: 1.28 },
    dvh_sat:    { nombre: 'DVH 4/12/4 satinado',          cod: '4/12/4 SAT',     ars: 122196, camara: 'C12', wmaker: 'doble vidriado hermetico 4/12/4 satinado', multWM: 1.10 },
    dvh_temp:   { nombre: 'DVH 4/12/4 templado',          cod: '4/12/4 TEMP',    ars: 74373, camara: 'C12', wmaker: 'doble vidriado hermetico 4/12/4 templado', multWM: 1.20 },
    lam33:      { nombre: 'Laminado 3+3 incoloro',        cod: '3+3 INC',        ars: 54980, camara: null, wmaker: 'laminado 3+3 incoloro', multWM: 0.55 },
    float4:     { nombre: 'Float 4 mm incoloro',          cod: '4 INC',          ars: 17190, camara: null, wmaker: 'float 4mm incoloro', multWM: 0.24 },
    sat4:       { nombre: 'Satinado 4 mm',                cod: '4 SAT',          ars: 61098, camara: null, wmaker: 'satinado 4mm', multWM: 0.60 },
    // Resto de la lista de almacén de Hetmo (pesos por m² ×1,001 como los toma Hetmo)
    "4 OP": { nombre: "Float 4 mm opacid", cod: "4 OP", ars: 14709, camara: null },
    "4 TEMP": { nombre: "4 mm templado", cod: "4 TEMP", ars: 37186, camara: null },
    "4/9/4 GR": { nombre: "DVH 4/9/4 gris", cod: "4/9/4 GR", ars: 37607, camara: "C9" },
    "4/9/4 INC": { nombre: "DVH 4/9/4 incoloro", cod: "4/9/4 INC", ars: 34379, camara: "C9" },
    "3+3 ESM": { nombre: "Laminado 3+3 esmerilado", cod: "3+3 ESM", ars: 85088, camara: null },
    "3+3/12/3+3 INC": { nombre: "DVH 3+3/12/3+3 incoloro", cod: "3+3/12/3+3 INC", ars: 109959, camara: "C12" },
    "3+3/12/4 INC": { nombre: "DVH 3+3/12/4 incoloro", cod: "3+3/12/4 INC", ars: 72169, camara: "C12" },
    "3+3/12/4+4 INC": { nombre: "DVH 3+3/12/4+4 incoloro", cod: "3+3/12/4+4 INC", ars: 122958, camara: "C12" },
    "3+3/12/5 INC": { nombre: "DVH 3+3/12/5 incoloro", cod: "3+3/12/5 INC", ars: 77241, camara: "C12" },
    "3+3/12/5+5 INC": { nombre: "DVH 3+3/12/5+5 incoloro", cod: "3+3/12/5+5 INC", ars: 128107, camara: "C12" },
    "3+3/12/6 INC": { nombre: "DVH 3+3/12/6 incoloro", cod: "3+3/12/6 INC", ars: 84154, camara: "C12" },
    "3+3/15/3+3 INC": { nombre: "DVH 3+3/15/3+3 incoloro", cod: "3+3/15/3+3 INC", ars: 109959, camara: "C12" },
    "3+3/15/4+4 INC": { nombre: "DVH 3+3/15/4+4 incoloro", cod: "3+3/15/4+4 INC", ars: 122958, camara: "C12" },
    "3+3/6/4 INC": { nombre: "DVH 3+3/6/4 incoloro", cod: "3+3/6/4 INC", ars: 72169, camara: "C9" },
    "3+3/9/4 OP": { nombre: "DVH 3+3/9/4 opacid", cod: "3+3/9/4 OP", ars: 69943, camara: "C9" },
    "3+3/9/4+4 INC": { nombre: "DVH 3+3/9/4+4 incoloro", cod: "3+3/9/4+4 INC", ars: 122958, camara: "C9" },
    "3+3/9/5 GR": { nombre: "DVH 3+3/9/5 gris", cod: "3+3/9/5 GR", ars: 28968, camara: "C9" },
    "3+3/9/5 INC": { nombre: "DVH 3+3/9/5 incoloro", cod: "3+3/9/5 INC", ars: 77241, camara: "C9" },
    "3+3/9/5 Temp": { nombre: "DVH 3+3/9/5 templado", cod: "3+3/9/5 Temp", ars: 99042, camara: "C9" },
    "3+3/9/5+5 INC": { nombre: "DVH 3+3/9/5+5 incoloro", cod: "3+3/9/5+5 INC", ars: 128107, camara: "C9" },
    "3+3/9/6 INC": { nombre: "DVH 3+3/9/6 incoloro", cod: "3+3/9/6 INC", ars: 84154, camara: "C9" },
    "3+3/9/6TEMP": { nombre: "DVH 3+3/9/6 templado", cod: "3+3/9/6TEMP", ars: 105041, camara: "C9" },
    "3+5/12/4+4": { nombre: "DVH 3+5/12/4+4", cod: "3+5/12/4+4", ars: 109620, camara: "C12" },
    "4+4 INC": { nombre: "Laminado 4+4 incoloro", cod: "4+4 INC", ars: 67978, camara: null },
    "4+4/12/4 INC": { nombre: "DVH 4+4/12/4 incoloro", cod: "4+4/12/4 INC", ars: 85168, camara: "C12" },
    "4+4/12/4+4 INC": { nombre: "DVH 4+4/12/4+4 incoloro", cod: "4+4/12/4+4 INC", ars: 135956, camara: "C12" },
    "4+4/12/5 INC": { nombre: "DVH 4+4/12/5 incoloro", cod: "4+4/12/5 INC", ars: 90240, camara: "C12" },
    "4+4/12/5+5 INC": { nombre: "DVH 4+4/12/5+5 incoloro", cod: "4+4/12/5+5 INC", ars: 141105, camara: "C12" },
    "4+4/12/6 INC": { nombre: "DVH 4+4/12/6 incoloro", cod: "4+4/12/6 INC", ars: 97152, camara: "C12" },
    "4+4/12/6T": { nombre: "DVH 4+4/12/6 templado", cod: "4+4/12/6T", ars: 118039, camara: "C12" },
    "4+4/12/8temp": { nombre: "DVH 4+4/12/8 templado", cod: "4+4/12/8temp", ars: 127335, camara: "C12" },
    "4+4/15/4+4 INC": { nombre: "DVH 4+4/15/4+4 incoloro", cod: "4+4/15/4+4 INC", ars: 135956, camara: "C12" },
    "4+4/15/5+5 INC": { nombre: "DVH 4+4/15/5+5 incoloro", cod: "4+4/15/5+5 INC", ars: 141105, camara: "C12" },
    "4+4/9/4 INC": { nombre: "DVH 4+4/9/4 incoloro", cod: "4+4/9/4 INC", ars: 85168, camara: "C9" },
    "4+4/9/4+4 INC": { nombre: "DVH 4+4/9/4+4 incoloro", cod: "4+4/9/4+4 INC", ars: 135956, camara: "C9" },
    "4+4/9/5 INC": { nombre: "DVH 4+4/9/5 incoloro", cod: "4+4/9/5 INC", ars: 90240, camara: "C9" },
    "4+4/9/5+5 INC": { nombre: "DVH 4+4/9/5+5 incoloro", cod: "4+4/9/5+5 INC", ars: 141105, camara: "C9" },
    "4+4/9/6 INC": { nombre: "DVH 4+4/9/6 incoloro", cod: "4+4/9/6 INC", ars: 97152, camara: "C9" },
    "4+4/9/6TEMP": { nombre: "DVH 4+4/9/6 templado", cod: "4+4/9/6TEMP", ars: 118039, camara: "C9" },
    "5 BCE": { nombre: "Float 5 mm bronce", cod: "5 BCE", ars: 54108, camara: null },
    "5 GR": { nombre: "Float 5 mm gris", cod: "5 GR", ars: 54108, camara: null },
    "5 INC": { nombre: "Float 5 mm incoloro", cod: "5 INC", ars: 22262, camara: null },
    "5 TEMP": { nombre: "5 mm templado", cod: "5 TEMP", ars: 44062, camara: null },
    "5 Temp/9/5 Temp": { nombre: "DVH 5/9/5 templado", cod: "5 Temp/9/5 Temp", ars: 88125, camara: "C9" },
    "5/12/5 BCE": { nombre: "DVH 5/12/5 bronce", cod: "5/12/5 BCE", ars: 48017, camara: "C12" },
    "5/12/5 GR": { nombre: "DVH 5/12/5 gris", cod: "5/12/5 GR", ars: 48017, camara: "C12" },
    "5/12/5 INC": { nombre: "DVH 5/12/5 incoloro", cod: "5/12/5 INC", ars: 44524, camara: "C12" },
    "5/9/5 BCE": { nombre: "DVH 5/9/5 bronce", cod: "5/9/5 BCE", ars: 48017, camara: "C9" },
    "5/9/5 INC": { nombre: "DVH 5/9/5 incoloro", cod: "5/9/5 INC", ars: 44524, camara: "C9" },
    "5+5 ESM": { nombre: "Laminado 5+5 esmerilado", cod: "5+5 ESM", ars: 93774, camara: null },
    "5+5 INC": { nombre: "Laminado 5+5 incoloro", cod: "5+5 INC", ars: 73127, camara: null },
    "5+5/12/4 INC": { nombre: "DVH 5+5/12/4 incoloro", cod: "5+5/12/4 INC", ars: 90317, camara: "C12" },
    "5+5/12/5 INC": { nombre: "DVH 5+5/12/5 incoloro", cod: "5+5/12/5 INC", ars: 95389, camara: "C12" },
    "5+5/12/5+5 INC": { nombre: "DVH 5+5/12/5+5 incoloro", cod: "5+5/12/5+5 INC", ars: 146254, camara: "C12" },
    "5+5/12/6 INC": { nombre: "DVH 5+5/12/6 incoloro", cod: "5+5/12/6 INC", ars: 102301, camara: "C12" },
    "5+5/15/5+5 INC": { nombre: "DVH 5+5/15/5+5 incoloro", cod: "5+5/15/5+5 INC", ars: 146254, camara: "C12" },
    "5+5/9/4 INC": { nombre: "DVH 5+5/9/4 incoloro", cod: "5+5/9/4 INC", ars: 90317, camara: "C9" },
    "5+5/9/5 INC": { nombre: "DVH 5+5/9/5 incoloro", cod: "5+5/9/5 INC", ars: 95389, camara: "C9" },
    "5+5/9/5+5 INC": { nombre: "DVH 5+5/9/5+5 incoloro", cod: "5+5/9/5+5 INC", ars: 146254, camara: "C9" },
    "5+5/9/6 INC": { nombre: "DVH 5+5/9/6 incoloro", cod: "5+5/9/6 INC", ars: 87538, camara: "C9" },
    "5T/12/5T": { nombre: "DVH 5/12/5 templado", cod: "5T/12/5T", ars: 75408, camara: "C12" },
    "6 INC": { nombre: "Float 6 mm incoloro", cod: "6 INC", ars: 29174, camara: null },
    "6/12/6 INC": { nombre: "DVH 6/12/6 incoloro", cod: "6/12/6 INC", ars: 58348, camara: "C12" },
    "6/9/6 BCE": { nombre: "DVH 6/9/6 bronce", cod: "6/9/6 BCE", ars: 60614, camara: "C9" },
    "6/9/6 INC": { nombre: "DVH 6/9/6 incoloro", cod: "6/9/6 INC", ars: 58348, camara: "C9" },
    "6+6/12/4 INC": { nombre: "DVH 6+6/12/4 incoloro", cod: "6+6/12/4 INC", ars: 61755, camara: "C12" },
    "6+6/12/5 INC": { nombre: "DVH 6+6/12/5 incoloro", cod: "6+6/12/5 INC", ars: 66095, camara: "C12" },
    "6+6/12/6 INC": { nombre: "DVH 6+6/12/6 incoloro", cod: "6+6/12/6 INC", ars: 72009, camara: "C12" },
    "6+6/9/4 INC": { nombre: "DVH 6+6/9/4 incoloro", cod: "6+6/9/4 INC", ars: 77284, camara: "C9" },
    "6+6/9/6 INC": { nombre: "DVH 6+6/9/6 incoloro", cod: "6+6/9/6 INC", ars: 87538, camara: "C9" },
    "6T/12/3+3 INC": { nombre: "DVH 6 templado/12/3+3", cod: "6T/12/3+3 INC", ars: 105041, camara: "C12" },
    "6T/12/6T": { nombre: "DVH 6/12/6 templado", cod: "6T/12/6T", ars: 100123, camara: "C12" },
    "8 TEMP": { nombre: "8 mm templado", cod: "8 TEMP", ars: 59357, camara: null },
  };
  const CAMARAS = { C9: 11996, C12: 13979, C20: 18369 };

  const PARAMETROS_BASE = {
    tipoCambio: 1540,          // dólar con el que Hetmo pasa vidrios y cámaras a USD
    margen: 55,                // tarifa general
    mermaLineal: 1.07,         // Compra → Venta 1 en artículos por metro (perfiles, refuerzos, cámara)
    montajeMl: 17,             // montaje: USD por metro de perímetro, va en Venta 1
    incluirMontaje: 1,         // 1 = el precio incluye montaje como en Hetmo
    recargoHerrajeGU: 1.1466,  // Hetmo valúa GU 14,66% arriba de la lista de almacén
    descuento: 0, dtoFijo: 0, dtoAplica: 'todo', dtoCarp: 0, dtoVid: 0, dtoMont: 0, dtoMosq: 0, iva: 21,
  };

  // Precios por metro o por unidad (USD) tomados del despiece de Hetmo; color: tabla de almacén.
  // [descripción, grupo, precio blanco, {precios por color}, lineal]
  const ART = {
    '110331000': ['HOJA PRIME 74', 'perfiles', 4.905, { golden: 8.083, nogal: 7.99, grafito: 8.0, negro: 8.62, turner: 8.66, bic_golden: 7.8, bic_negro: 8.49 }, 1],
    '112501000': ['MARCO DZ', 'perfiles', 5.774, { golden: 10.882, bic_golden: 7.46, bic_negro: 8.15 }, 1],
    '112601000': ['MARCO 3 GUIAS DZ', 'perfiles', 11.2, { bic_golden: 11.21, bic_negro: 11.8 }, 1],
    '113341000': ['TAPA HOJA PRIME', 'perfiles', 0.792, { golden: 1.099 }, 1],
    '113411000': ['Tapa encuentro DZ', 'perfiles', 0.134, null, 1],
    '113451000': ['ENCUENTRO PRIME 74', 'perfiles', 0.826, { golden: 1.19, nogal: 1.19, grafito: 1.14, negro: 1.28, turner: 1.31 }, 1],
    '144410300': ['GUIA PRIME', 'perfiles', 3.492, null, 1],
    '410061000': ['CONTRAVIDRIO 6,5MM', 'perfiles', 0.783, { golden: 1.063, grafito: 1.06, nogal: 1.06, negro: 1.28, turner: 1.47 }, 1],
    '112241000': ['MARCO DC 58-66', 'perfiles', 5.461, { golden: 8.47, nogal: 8.47, grafito: 8.5, negro: 8.82, turner: 9.77, bic_golden: 7.98, bic_negro: 8.17 }, 1],
    '110201000': ['HOJA APERTURA INTERIOR DC 85', 'perfiles', 5.666, { golden: 9.63, nogal: 9.63, grafito: 9.63, negro: 10.83, turner: 12.41, bic_golden: 8.87, bic_negro: 9.06 }, 1],
    '110211000': ['HOJA PUERTA AP. INT. DC 100', 'perfiles', 6.32, { golden: 11.08, nogal: 11.08, grafito: 11.08, negro: 13.26, turner: 15.19, bic_golden: 9.2, bic_negro: 9.43 }, 1],
    '111231000': ['BATIENTE DC', 'perfiles', 5.15, { golden: 8.24, nogal: 8.24, grafito: 8.24, negro: 9.82, turner: 11.25, bic_golden: 6.31, bic_negro: 6.72 }, 1],
    '410181000': ['CONTRAVIDRIO 18,5MM', 'perfiles', 1.231, { golden: 2.1, nogal: 2.1, grafito: 2.1, negro: 2.35, turner: 2.69 }, 1],
    '913151000': ['TAPA CANAL HERRAJE', 'perfiles', 0.271, null, 1],
    '913051000': ['PERFIL REMATE INTERIOR 40MM', 'tapajuntas', 0.975, { golden: 2.045 }, 1],
    '920100015': ['REFUERZO ABIERTO 30X20', 'refuerzos', 1.717, null, 1],
    '920220015': ['REFUERZO ABIERTO 37x15 mm', 'refuerzos', 1.609, null, 1],
    '920090015': ['REFUERZO ABIERTO 30X35', 'refuerzos', 2.519, null, 1],
    '920470013': ['Refuerzo 30,4 x 25,4 mm', 'refuerzos', 2.438, null, 1],
    '920480013': ['Refuerzo 30,4 x 25,4 mm abierto', 'refuerzos', 1.992, null, 1],
    '920070025': ['REFUERZO PESADO HOJA DC 100', 'refuerzos', 4.81, null, 1],
    '932003300': ['COLIZA DZ CON FILM SEAL 5x7', 'juntas', 0.336, null, 0],
    '145040000': ['Puente de acristalar DZ 46', 'accesorios', 0.53, null, 0],
    '145101000': ['Cortaviento DZ 46', 'accesorios', 0.836, null, 0],
    '145231000': ['TOPE AMORTIGUADOR', 'accesorios', 0.567, null, 0],
    '145060000': ['PUENTE DE ACRISTALAR DC', 'accesorios', 0.205, null, 0],
    '945131000': ['TAPA DESAGUE', 'accesorios', 0.214, null, 0],
    '945160000': ['Calzo 4 mm', 'accesorios', 0.205, null, 0],
    '945675000': ['PIEZA DE CLIPAR PARA TAPAJUNTAS 91305', 'accesorios', 0.241, null, 0],
    '945685000': ['ESCUADRA PARA TAPAJUNTAS 91305', 'accesorios', 0.344, null, 0],
    'VR-T-01':   ['Tornillo cabezón 9,1 mm', 'accesorios', 0.1, null, 0],
    'TR-16':     ['TORNILLO 3.9x16mm', 'tornilleria', 0.3, null, 0],
    // Herraje GU (precio ya con el recargo que aplica Hetmo)
    'GU-C-906':  ['MANILLA DIRIGENT-F 33', 'herraje', 5.486, null, 0],
    'GU-E-138':  ['CERRADERO IN-LINE SIN GUIA', 'herraje', 0.642, null, 0],
    'GU-E-181':  ['SEGURO ANTIELEVACION IN-LINE', 'herraje', 0.642, null, 0],
    'GU-L-250':  ['RUEDA FIJA 60 KG 21 MM', 'herraje', 4.349, null, 0],
    'GU-L-252':  ['Tornillo de manilla M5 x 40 mm', 'herraje', 0.211, null, 0],
    'GU-6-342':  ['BISAGRA OCULTA UNI-JET PARTE HOJA', 'herraje', 1.835, null, 0],
    'GU-6-360':  ['SOPORTE COMPAS UNI-JET', 'herraje', 1.183, null, 0],
    'GU-6-361':  ['BISAGRA AL CANTO UNI-JET', 'herraje', 3.394, null, 0],
    'GU-6-368':  ['SOPORTE DE ESQUINA UNI-JET', 'herraje', 4.615, null, 0],
    'GU-6-391':  ['FALSO COMPAS UNI-JET D+S', 'herraje', 6.725, null, 0],
    'GU-9-408':  ['BISAGRA OCULTA MARCO R13', 'herraje', 1.284, null, 0],
    'GU-9-447':  ['Cerradero R13', 'herraje', 0.835, null, 0],
    'GU-9-488':  ['EJE SOPORTE DE COMPAS UNI-JET', 'herraje', 0.376, null, 0],
    'GU-K-186':  ['KIT 4 TAPAS BIS. AL CANTO UNI-JET', 'herraje', 1.651, null, 0],
    'GU-OSC':    ['COMPAS OSCILOBATIENTE UNI-JET (calibrado con presupuestos)', 'herraje', 29.7, null, 0],
    'GU-PROY':   ['COMPASES PROYECTANTE (aprox.)', 'herraje', 21.4, null, 0],
    'GU-PAS':    ['PASADORES HOJA PASIVA (aprox.)', 'herraje', 9.5, null, 0],
    'CERR-MP':   ['CERRADURA MULTIPUNTO 25/92', 'herraje', 35.17, null, 0],
    'BIS-PTA':   ['BISAGRA PUERTA (aprox.)', 'herraje', 8.0, null, 0],
    'GU-BAND':   ['COMPASES BANDEROLA UNI-JET (calibrado con presupuestos)', 'herraje', 0.5, null, 0],
    '111251000': ['POSTE DC 58', 'perfiles', 6.54, { golden: 11.18, bic_grafito: 7.52 }, 1],
    '145070000': ['KIT ESCUADRA POSTE DC', 'accesorios', 2.66, null, 0],
    '913091000': ['PERFIL ACOPLE 20X3 MM', 'perfiles', 0.07, { golden: 1.2, turner: 1.57, negro: 1.38 }, 1],
  };
  const COLOR_FALLBACK = { blanco: 1, golden: 1.70, nogal: 1.70, grafito: 1.70, negro: 1.82, turner: 1.95, bic_golden: 1.38, bic_grafito: 1.38, bic_negro: 1.45 };

  // Cremonas GU por rango de altura (precio de almacén; se le aplica el recargo GU)
  const CREMONA_INLINE = [[600, 7.01, 'G-19505 E7,5 200-600'], [1000, 15.97, 'G-15383 E7,5 600-1000'], [1600, 17.29, 'G-15383 E7,5 1000-1600'], [2500, 25.38, 'G-15383 E7,5 1801-2500']];
  const CREMONA_CANTO = [[600, 5.13, 'E15 310-600'], [800, 5.13, 'E15 601-800'], [900, 5.41, 'E15 801-900'], [1000, 5.13, 'E15 801-1000'], [1100, 6.15, 'E15 1001-1100'], [1200, 5.79, 'E15 1001-1200'], [1300, 7.17, 'E15 1201-1300'], [1400, 6.51, 'E15 1201-1400'], [1500, 8.0, 'E15 1401-1500'], [1600, 7.41, 'E15 1401-1600'], [1800, 8.37, 'E15 1601-1800'], [2000, 9.62, 'E15 1801-2800'], [2200, 11.37, 'E15 2001-2200'], [99999, 11.37, 'E15 2001-2200']];
  const rango = (tabla, h) => tabla.find(r => h <= r[0]) || tabla[tabla.length - 1];

  const esColor = c => c && c !== 'blanco';

  // ---------- Secciones ----------
  // Devuelve las secciones con su ancho/alto real y qué hay en cada lado:
  // 'ext' = borde exterior (marco + tapajuntas), 'poste' = parante/travesaño DC compartido (sin marco),
  // 'acople' = marco propio unido a la sección vecina (cuando hay una corrediza de por medio).
  function secciones(item) {
    const S = (item.secciones && item.secciones.length ? item.secciones : [{ tipo: 'corrediza', hojas: 2 }]).map(s => Object.assign({}, s));
    const div = S.length > 1 ? (item.division === 'h' ? 'h' : 'v') : 'no';
    const total = div === 'h' ? item.alto : item.ancho;
    let usado = 0;
    S.forEach((s, i) => {
      const m = i === S.length - 1 ? total - usado : Math.max(200, Math.round(+s.medida || total / S.length));
      s.medida = m; usado += m;
      s.w = div === 'v' ? m : item.ancho; s.h = div === 'h' ? m : item.alto;
      s.lados = { t: 'ext', b: 'ext', l: 'ext', r: 'ext' };
    });
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      const union = a.tipo === 'corrediza' || b.tipo === 'corrediza' ? 'acople' : 'poste';
      if (div === 'v') { a.lados.r = union; b.lados.l = union } else { a.lados.b = union; b.lados.t = union }
    }
    return { div, secciones: S };
  }

  // Cada pieza: { cod, uds, largo (mm, 0 si es por unidad), det }
  function ficha(s, color) {
    const L = [], vid = [], W = s.w, H = s.h, ld = s.lados;
    const p = (cod, uds, largo, det) => { if (uds > 0) L.push({ cod, uds, largo, det: det || '' }) };
    const col = esColor(color);
    let tr = 0; const trs = (largo, paso) => { tr += Math.ceil(Math.max(largo, 1) / paso) };
    const lados = [['t', W], ['b', W], ['l', H], ['r', H]];
    const remate = () => {
      const clip = x => Math.ceil((x + 70) / 300);   // un clip cada 300 mm de tapajuntas
      let clips = 0, vrt = 0;
      for (const [k, x] of lados) if (ld[k] === 'ext') { p('913051000', 1, x + 70, 'tapajuntas'); clips += clip(x); vrt += Math.round((x + 70) / 350) }
      const esq = [['t', 'l'], ['t', 'r'], ['b', 'l'], ['b', 'r']].filter(([a, b]) => ld[a] === 'ext' && ld[b] === 'ext').length;
      p('945675000', clips, 0); p('945685000', esq, 0); p('VR-T-01', vrt, 0);
    };
    const tipo = s.tipo, n = s.hojas || 0;
    if (tipo === 'corrediza') {
      const hw = Math.round(W / n) - 5, hh = H - 90;
      const marco = n === 3 ? '112601000' : '112501000';
      p('110331000', 2 * n, hw, 'hoja horizontal'); p('110331000', 2 * n, hh, 'hoja vertical');
      for (const [k, x] of lados) p(marco, 1, x + 6, 'marco');
      p('113341000', 2 * (n - 1), H - 98); p('113411000', 2 * (n - 1), H - 98); p('113451000', 2 * (n - 1), H - 98);
      p('144410300', n === 3 ? 3 : 2, W - 112, 'guía');
      const gw = Math.round(W / n) - 131, gh = H - 216;
      for (let i = 0; i < n; i++) { vid.push([gw, gh]); p('410061000', 2, gw + 8); p('410061000', 2, gh + 8) }
      const pasoH = col ? 170 : 250, pasoM = col ? 200 : 300;
      p('920100015', 2 * n, hw - 130, 'refuerzo hoja'); p('920100015', 2 * n, hh - 130, 'refuerzo hoja');
      // hojas en blanco: un tornillo cada 250 mm descontando 30 mm de punta; en color, cada 170 mm
      const trsH = l => col ? trs(l, pasoH) : trs(l - 30, 250);
      for (let i = 0; i < 2 * n; i++) { trsH(hw - 130); trsH(hh - 130) }
      for (const [k, x] of lados) { p('920220015', 1, x - 88, 'refuerzo marco'); trs(x - 88, pasoM) }
      p('932003300', 2 * (n - 1), 0, (H - 96) + ' mm'); if (n > 1) L[L.length - 1].cantM = (H - 96) / 1000;
      p('145040000', 4 * n, 0); p('145101000', 2 * (n - 1), 0); p('145231000', 2 * n, 0);
      p('945131000', Math.max(2, Math.ceil(W / 750)), 0); p('945160000', 4 * n, 0);
      remate();
      const cr = rango(CREMONA_INLINE, hh - 100), moviles = n === 3 ? 2 : n;
      p('GU-C-906', moviles, 0); p('GU-E-138', 2 * n, 0); p('GU-E-181', n, 0);
      L.push({ cod: 'CREMONA-IL', uds: moviles, largo: 0, det: cr[2], precio: cr[1] });
      p('GU-L-250', 2 * n, 0); p('GU-L-252', 2 * moviles, 0);
    } else {
      // Marco DC: solo en los lados exteriores o acoplados (en los lados con poste no lleva marco).
      const conMarco = k => ld[k] !== 'poste';
      for (const [k, x] of lados) if (conMarco(k)) p('112241000', 1, x + 6, 'marco');
      const refM = { t: '920470013', b: '920480013', l: '920480013', r: '920480013' };
      for (const [k, x] of lados) if (conMarco(k)) { p(refM[k], 1, x - 116, 'refuerzo marco'); trs(x - 116, 250) }
      if (tipo === 'pano') {
        p('145060000', 4, 0);
        const gw = W - 104, gh = H - 104; vid.push([gw, gh]);
        p('410181000', 2, gw + 8); p('410181000', 2, gh + 8);
        p('945131000', 2, 0); p('945160000', 4, 0);
      } else {
        const puerta = tipo === 'puerta';
        const hw = n === 1 ? W - 74 : Math.round(W / n) - 30, hh = H - 74;
        const hoja = puerta ? '110211000' : '110201000';
        p(hoja, 2 * n, hw, 'hoja horizontal'); p(hoja, 2 * n, hh, 'hoja vertical');
        if (n > 1) p('111231000', n - 1, hh, 'batiente central');
        p('145060000', 4 * n, 0);
        const gw = hw - 148, gh = hh - 148 - (puerta ? 100 : 0);
        for (let i = 0; i < n; i++) { vid.push([gw, gh]); p('410181000', 2, gw + 8); p('410181000', 2, gh + 8) }
        p('913151000', n, (tipo === 'proy' || tipo === 'band' ? W : H) - 120);
        const ref = puerta ? '920070025' : '920090015';
        p(ref, 2 * n, hw - 160, 'refuerzo hoja'); p(ref, 2 * n, hh - 160, 'refuerzo hoja');
        for (let i = 0; i < 2 * n; i++) { trs(hw - 160, 250); trs(hh - 160, 250) }
        p('945131000', 2, 0); p('945160000', 4 * n, 0);
        if (puerta) {
          p('BIS-PTA', 3 * n, 0); p('CERR-MP', 1, 0); p('GU-C-906', 1, 0); if (n > 1) p('GU-PAS', n - 1, 0);
        } else {
          ['GU-6-342', 'GU-6-360', 'GU-6-361', 'GU-6-368', 'GU-6-391', 'GU-9-408', 'GU-9-488', 'GU-K-186'].forEach(c => p(c, n, 0));
          p('GU-9-447', 2 * n, 0); p('GU-C-906', 1, 0); p('GU-L-252', 2, 0);
          const cr = rango(CREMONA_CANTO, (tipo === 'proy' || tipo === 'band' ? hw : hh) - 100);
          L.push({ cod: 'CREMONA-CA', uds: 1, largo: 0, det: cr[2], precio: cr[1] });
          if (n > 1) p('GU-PAS', n - 1, 0);
          const osc = tipo === 'oscilo' ? n : (s.osc || []).slice(0, n).filter(Boolean).length;
          p('GU-OSC', osc, 0);
          if (tipo === 'proy') p('GU-PROY', 1, 0);
          if (tipo === 'band') p('GU-BAND', 1, 0);
        }
      }
      remate();
    }
    p('TR-16', tr, 0);
    return { piezas: L, vidrios: vid, tornillos: tr };
  }

  // Fabricación (USD de compra): un fijo por tipología + USD 0,0757 por tornillo TR-16 + USD 0,408 por m² de vidrio.
  // Calibrado con 4 corredizas de Hetmo (1000×900, 1500×1100 blanca y golden, 2000×1500): error < 0,01.
  // De abrir y paño fijo: el fijo sale de una captura cada uno; el resto de las tipologías, por analogía.
  function fabricacion(s, tornillos, m2) {
    const n = s.hojas || 0;
    let base;
    if (s.tipo === 'corrediza') base = 92.3123 * (1 + 0.4 * (n - 2));
    else if (s.tipo === 'pano') base = 37.591;
    else {
      base = 69.009 * (n === 1 ? 1 : n === 2 ? 1.7 : 2.4);
      if (s.tipo === 'puerta') base *= 1.3;
      const osc = s.tipo === 'oscilo' ? n : (s.osc || []).slice(0, n).filter(Boolean).length;
      base += 7 * osc;
    }
    return base + 0.0757 * tornillos + 0.40807 * m2;
  }
  const ACRISTALAMIENTO = 2.9165; // por vidrio

  function mosquitero(s, color) {
    if (!s.mosq) return 0;
    const t = TIPOS[s.tipo]; if (!t || !t.mosq) return 0;
    const W = s.w / 1000, H = s.h / 1000, fc = esColor(color) ? 1.27 : 1;
    // Corredizo: calibrado con el presupuesto Hetmo N° 240 (mismo presupuesto con y sin mosquitera, 26/10/2026).
    if (t.mosq === 'corredizo') { const n = s.hojas || 2, nm = n === 3 ? 2 : Math.max(1, Math.floor(n / 2)); return nm * (132.06 + 56.55 * W * 2 / n + 28 * (H - 2)) * fc }
    return (40 + 70 * W * H) * fc;
  }

  // Línea de la corrediza: Hetmo usa LINEA PRIME (90/44) en las altas y PRIME 74 en el resto.
  const lineaCorr = s => s.linea === 'P74' || s.linea === 'P90' ? s.linea : (s.h >= 1900 ? 'P90' : 'P74');
  // Ajustes calibrados contra presupuestos reales de Hetmo (hasta tener sus despieces):
  // carpintería Prime 90/44 vs Prime 74 (N° 240), corrediza de 3 hojas y puertas DC 100.
  const AJUSTE = { P90: 1.405, corr3: 0.72, puerta: 1.63 };
  function ajusteSeccion(s) {
    if (s.tipo === 'corrediza') return (lineaCorr(s) === 'P90' ? AJUSTE.P90 : 1) * (s.hojas === 3 ? AJUSTE.corr3 : 1);
    if (s.tipo === 'puerta') return AJUSTE.puerta;
    return 1;
  }

  function esExacto(item) {
    const { secciones: S } = secciones(item);
    if (S.length !== 1) return false;
    const s = S[0];
    return (s.tipo === 'corrediza' && s.hojas === 2 && lineaCorr(s) === 'P74') || s.tipo === 'pano' || (s.tipo === 'abrir' && s.hojas === 1 && !(s.osc || [])[0]);
  }

  function hetmo(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const color = item.color || 'blanco';
    const { div, secciones: S } = secciones(item);
    const G = { perfiles: 0, refuerzos: 0, juntas: 0, tornilleria: 0, accesorios: 0, tapajuntas: 0, vidrios: 0, herraje: 0, fabricacion: 0, acristalamiento: 0 };
    const V1 = Object.assign({}, G), det = [];
    const vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh, usdM2 = vid.ars / P.tipoCambio;
    const agregar = (pz, seccion) => {
      let desc, grupo, precio, lineal;
      if (pz.precio != null) { desc = 'CREMONA ' + pz.det; grupo = 'herraje'; precio = pz.precio * P.recargoHerrajeGU; lineal = 0 }
      else {
        const a = ART[pz.cod]; desc = a[0]; grupo = a[1]; lineal = a[4]; precio = a[2];
        if (esColor(color) && grupo !== 'refuerzos' && a[3] !== null) precio = (a[3] && a[3][color]) || a[2] * COLOR_FALLBACK[color];
      }
      const cant = pz.largo ? pz.uds * pz.largo / 1000 : pz.cantM ? pz.uds * pz.cantM : pz.uds;
      const imp = cant * precio;
      G[grupo] += imp; V1[grupo] += imp * (lineal ? P.mermaLineal : 1);
      det.push({ seccion, cod: pz.cod, desc, grupo, uds: pz.uds, largo: pz.largo, cant, unidad: pz.largo || pz.cantM ? 'm' : 'u', det: pz.det, precio, importe: imp });
    };
    let mosq = 0;
    S.forEach((s, i) => {
      const nombre = S.length > 1 ? `S${i + 1}` : '';
      const antes = Object.assign({}, G), antes1 = Object.assign({}, V1);
      const { piezas, vidrios, tornillos } = ficha(s, color);
      for (const pz of piezas) agregar(pz, nombre);
      for (const [gw, gh] of vidrios) {
        const a = Math.max(0.5, Math.ceil(gw / 10) * Math.ceil(gh / 10) / 10000), imp = a * usdM2;
        G.vidrios += imp; V1.vidrios += imp;
        det.push({ seccion: nombre, cod: vid.cod, desc: vid.nombre, grupo: 'vidrios', uds: 1, cant: a, unidad: 'm²', det: `${gw} × ${gh}`, precio: usdM2, importe: imp });
        if (vid.camara) {
          const per = 2 * (gw + gh) / 1000, pc = CAMARAS[vid.camara] / P.tipoCambio, ic = per * pc;
          G.vidrios += ic; V1.vidrios += ic * P.mermaLineal;
          det.push({ seccion: nombre, cod: vid.camara, desc: 'Separador cámara ' + vid.camara, grupo: 'vidrios', uds: 1, cant: per, unidad: 'm', det: 'perímetro del vidrio', precio: pc, importe: ic });
        }
      }
      const fb = fabricacion(s, tornillos, vidrios.reduce((t, [a, b]) => t + Math.max(a, 0) * Math.max(b, 0) / 1e6, 0));
      G.fabricacion += fb; V1.fabricacion += fb;
      const ac = ACRISTALAMIENTO * vidrios.length; G.acristalamiento += ac; V1.acristalamiento += ac;
      const f = ajusteSeccion(s);
      if (f !== 1) {
        let delta = 0;
        for (const k of Object.keys(G)) if (k !== 'vidrios' && k !== 'acristalamiento') {
          const d = (G[k] - antes[k]) * (f - 1); delta += d; G[k] += d; V1[k] += (V1[k] - antes1[k]) * (f - 1);
        }
        det.push({ seccion: nombre, cod: 'AJUSTE', desc: s.tipo === 'corrediza' && lineaCorr(s) === 'P90' ? 'Ajuste línea Prime 90/44 (calibrado con presupuestos)' : 'Ajuste calibrado con presupuestos', grupo: 'ajuste', uds: 1, cant: 1, unidad: 'u', det: '×' + f.toFixed(3) + ' sobre carpintería', precio: delta, importe: delta });
      }
      mosq += mosquitero(s, color);
    });
    // Uniones entre secciones: poste DC compartido o acople entre marcos.
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], largo = div === 'v' ? item.alto : item.ancho;
      const union = div === 'v' ? a.lados.r : a.lados.b, nombre = `S${i + 1}/S${i + 2}`;
      if (union === 'poste') {
        agregar({ cod: '111251000', uds: 1, largo: largo - 60, det: div === 'v' ? 'parante' : 'travesaño' }, nombre);
        agregar({ cod: '920480013', uds: 1, largo: largo - 116, det: 'refuerzo poste' }, nombre);
        agregar({ cod: '145070000', uds: 2, largo: 0 }, nombre);
        agregar({ cod: 'TR-16', uds: Math.ceil((largo - 116) / 250), largo: 0 }, nombre);
        G.fabricacion += 12; V1.fabricacion += 12;
      } else {
        agregar({ cod: '913091000', uds: 1, largo, det: 'acople entre marcos' }, nombre);
        agregar({ cod: 'TR-16', uds: Math.ceil(largo / 300), largo: 0 }, nombre);
        G.fabricacion += 6; V1.fabricacion += 6;
      }
    }
    const per = 2 * (item.ancho + item.alto) / 1000;
    const montaje = P.montajeMl * per;
    const compra = Object.values(G).reduce((s, x) => s + x, 0);
    const venta1 = Object.values(V1).reduce((s, x) => s + x, 0) + montaje;
    const mg = 1 + P.margen / 100;
    const carpinteria = (V1.perfiles + V1.refuerzos + V1.juntas + V1.tornilleria + V1.accesorios + V1.tapajuntas + V1.herraje + V1.fabricacion) * mg;
    return { detalle: det, compra: G, venta1Grupos: V1, montaje, totalCompra: compra, venta1, venta: venta1 * mg,
      carpinteria, vidrios: (V1.vidrios + V1.acristalamiento) * mg, montajeVenta: montaje * mg, mosq, exacto: esExacto(item), secciones: S, division: div };
  }

  // ---------- Precio para el presupuesto ----------
  function precio(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const h = hetmo(item, P);
    const montaje = P.incluirMontaje ? h.montajeVenta : 0;
    // Mosquitero: Hetmo lo cotiza con otra ficha; mientras tanto se estima con los precios de WMaker.
    return { carpinteria: h.carpinteria, vidrios: h.vidrios, montaje, mosq: h.mosq, unitario: h.carpinteria + h.vidrios + montaje + h.mosq, hetmo: h };
  }

  const MANO = { izq: 'izquierda', der: 'derecha' };
  function descSeccion(s) {
    const t = TIPOS[s.tipo]; let d = t.desc;
    if (s.tipo === 'corrediza') d += lineaCorr(s) === 'P90' ? ' línea Prime 90/44' : ' línea Prime 74';
    if (s.tipo !== 'pano' && s.hojas) d += ` ${s.hojas === 1 ? '1 hoja' : s.hojas + ' hojas'}`;
    if (s.tipo === 'abrir' && (s.osc || []).slice(0, s.hojas).some(Boolean)) {
      const o = s.osc.slice(0, s.hojas).map((x, i) => x ? i + 1 : 0).filter(Boolean);
      d += s.hojas === 1 ? ' oscilobatiente' : ` (oscila ${o.length === s.hojas ? 'todas' : 'hoja ' + o.join(' y ')})`;
    }
    if (s.tipo !== 'pano' && s.tipo !== 'proy' && s.tipo !== 'band' && s.mano) d += `, ${s.tipo === 'corrediza' ? 'cierre' : 'herraje'} a la ${MANO[s.mano]}`;
    if (s.mosq && t.mosq) d += t.mosq === 'corredizo' ? ', con mosquitero corredizo' : ', con mosquitero fijo';
    return d;
  }
  function descripcion(item) {
    const col = COLORES[item.color] || COLORES.blanco, vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const { div, secciones: S } = secciones(item);
    let d;
    if (S.length === 1) d = 'Ventana ' + descSeccion(S[0]);
    else {
      const pos = div === 'h' ? (i => i === 0 ? 'arriba' : i === S.length - 1 ? 'abajo' : 'al medio') : (i => i === 0 ? 'izquierda' : i === S.length - 1 ? 'derecha' : 'centro');
      d = `Ventana compuesta con ${S.length - 1} ${div === 'h' ? 'travesaño' + (S.length > 2 ? 's' : '') : 'parante' + (S.length > 2 ? 's' : '')}: ` +
        S.map((s, i) => `${pos(i)} ${descSeccion(s)} (${s.medida} mm)`).join('; ');
    }
    return d + `. Línea Muchtek, color ${col.nombre.toLowerCase()}, vidrios ${vid.nombre.toLowerCase()}. Medidas: ${item.ancho}x${item.alto}`;
  }

  // Convierte ítems guardados con el formato anterior (tipologia) al de secciones.
  function migrar(it) {
    if (it.secciones) return it;
    const m = { corr2: ['corrediza', 2], corr3: ['corrediza', 3], abrir1: ['abrir', 1], abrir2: ['abrir', 2], osc1: ['oscilo', 1], osc2: ['oscilo', 2], pano: ['pano', 0], proy: ['proy', 1], puerta1: ['puerta', 1], puerta2: ['puerta', 2] }[it.tipologia] || ['corrediza', 2];
    const r = Object.assign({}, it, { division: 'no', secciones: [{ tipo: m[0], hojas: m[1], mano: 'izq', mosq: !!it.mosquitero, osc: [] }] });
    delete r.tipologia; delete r.mosquitero; return r;
  }

  // Descuentos: por renglón (item.descuento), por rubro (P.dtoCarp, dtoVid, dtoMont, dtoMosq),
  // y general en % (P.descuento) o monto fijo (P.dtoFijo), aplicado a 'todo', 'sin' IVA o 'con' IVA (P.dtoAplica).
  // Cada renglón va "con IVA" (por defecto) o "sin IVA" (item.iva === 'sin'); el IVA se suma solo a lo que va con IVA.
  function totales(items, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const nuevo = () => ({ lista: 0, dtoRenglon: 0, dtoRubros: 0, neto: 0, dtoGeneral: 0, total: 0, iva: 0, totalFinal: 0, carpinteria: 0, vidrios: 0, montaje: 0, mosq: 0, unidades: 0 });
    const G = { con: nuevo(), sin: nuevo() };
    const rub = { carpinteria: P.dtoCarp || 0, vidrios: P.dtoVid || 0, montaje: P.dtoMont || 0, mosq: P.dtoMosq || 0 };
    let compra = 0;
    for (const it of items) {
      const p = precio(it, P), n = it.cantidad || 1, fr = 1 - (it.descuento || 0) / 100;
      const g = G[it.iva === 'sin' ? 'sin' : 'con'];
      g.lista += p.unitario * n; g.unidades += n; compra += p.hetmo.totalCompra * n;
      for (const k of Object.keys(rub)) {
        const bruto = p[k] * n, trasRenglon = bruto * fr, neto = trasRenglon * (1 - rub[k] / 100);
        g.dtoRenglon += bruto - trasRenglon; g.dtoRubros += trasRenglon - neto; g.neto += neto; g[k] += neto;
      }
    }
    const aplica = P.dtoAplica || 'todo';
    const objetivo = ['con', 'sin'].filter(k => aplica === 'todo' || aplica === k);
    const baseObj = objetivo.reduce((s, k) => s + G[k].neto, 0);
    for (const k of ['con', 'sin']) {
      const g = G[k];
      if (objetivo.includes(k)) {
        g.dtoGeneral = g.neto * (P.descuento || 0) / 100;
        if (P.dtoFijo && baseObj > 0) g.dtoGeneral += P.dtoFijo * g.neto / baseObj;
        g.dtoGeneral = Math.min(g.dtoGeneral, g.neto);
      }
      g.total = g.neto - g.dtoGeneral;
      const f = g.neto ? g.total / g.neto : 1;
      for (const c of Object.keys(rub)) g[c] *= f;
      g.iva = k === 'con' ? g.total * P.iva / 100 : 0;
      g.totalFinal = g.total + g.iva;
    }
    const sum = c => G.con[c] + G.sin[c];
    return { grupos: G, lista: sum('lista'), dtoRenglon: sum('dtoRenglon'), dtoRubros: sum('dtoRubros'), dtoGeneral: sum('dtoGeneral'),
      total: sum('total'), iva: G.con.iva, totalPagar: G.con.totalFinal + G.sin.totalFinal, compra,
      carpinteria: sum('carpinteria'), vidrios: sum('vidrios'), montaje: sum('montaje'), mosq: sum('mosq'), unidades: sum('unidades'),
      hayCon: G.con.unidades > 0, haySin: G.sin.unidades > 0 };
  }

  const api = { AJUSTE, lineaCorr, TIPOS, COLORES, VIDRIOS, PARAMETROS_BASE, ART, secciones, hetmo, precio, descripcion, descSeccion, totales, migrar, esExacto };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MotorGH = api;
})(typeof window !== 'undefined' ? window : globalThis);

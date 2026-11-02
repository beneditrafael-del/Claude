// Motor de cálculo del cotizador GH.
//  - hetmo(): reproduce el "Análisis de importes" de Hetmo a partir del despiece de cada ficha técnica.
//    Exacto (al centavo) para Prime 74 2 guías, DC 66-85 1 hoja y paño fijo DC, verificado contra
//    capturas de Hetmo. El resto de las tipologías se arma por analogía y se marca como aproximado.
//  - precioWMaker(): precio de lista calibrado con presupuestos reales de WMaker (referencia).
(function (root) {
  'use strict';

  const TIPOLOGIAS = {
    corr2:  { nombre: 'Corrediza Prime 74, 2 hojas',  prefijo: 'V',  hojas: 2, desc: 'Ventana corrediza linea Prime 74', ficha: '175 LINEA PRIME 74 - 2 GUIAS', exacto: true, mosq: true },
    abrir1: { nombre: 'De abrir DC 66-85, 1 hoja',    prefijo: 'V',  hojas: 1, desc: 'Ventana de abrir linea DC 66-85', ficha: '108 DC 66-85', exacto: true, mosq: true },
    pano:   { nombre: 'Paño fijo DC',                 prefijo: 'V',  hojas: 0, desc: 'Paño fijo linea DC 58-66', ficha: 'Paño fijo DC 58-66', exacto: true },
    corr3:  { nombre: 'Corrediza Prime 74, 3 hojas',  prefijo: 'V',  hojas: 3, desc: 'Ventana corrediza linea Prime 74', ficha: '176 LINEA PRIME 74 - 3 GUIAS', mosq: true },
    abrir2: { nombre: 'De abrir DC 66-85, 2 hojas',   prefijo: 'V',  hojas: 2, desc: 'Ventana de abrir linea DC 66-85', ficha: '108 DC 66-85', mosq: true },
    osc1:   { nombre: 'Oscilobatiente DC, 1 hoja',    prefijo: 'V',  hojas: 1, desc: 'Ventana oscilobatiente linea DC 66-85', ficha: '108 DC 66-85', mosq: true },
    osc2:   { nombre: 'Oscilobatiente DC, 2 hojas',   prefijo: 'V',  hojas: 2, desc: 'Ventana oscilobatiente linea DC 66-85', ficha: '108 DC 66-85', mosq: true },
    proy:   { nombre: 'Proyectante DC',               prefijo: 'V',  hojas: 1, desc: 'Ventana proyectante linea DC 66-85', ficha: 'DC 66-85', mosq: true },
    puerta1:{ nombre: 'Puerta DC 100, 1 hoja',        prefijo: 'P',  hojas: 1, desc: 'Puerta de rebatir linea DC 100', ficha: '109 DC 66-100' },
    puerta2:{ nombre: 'Puerta DC 100, 2 hojas',       prefijo: 'P',  hojas: 2, desc: 'Puerta de rebatir linea DC 100', ficha: '109 DC 66-100' },
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
  };
  const CAMARAS = { C9: 11996, C12: 13979, C20: 18369 };

  const PARAMETROS_BASE = {
    tipoCambio: 1540,          // dólar con el que Hetmo pasa vidrios y cámaras a USD
    margen: 55,                // tarifa general
    mermaLineal: 1.07,         // Compra → Venta 1 en artículos por metro (perfiles, refuerzos, cámara)
    montajeMl: 17,             // montaje: USD por metro de perímetro, va en Venta 1
    incluirMontaje: 1,         // 1 = el precio incluye montaje como en Hetmo
    recargoHerrajeGU: 1.1466,  // Hetmo valúa GU 14,66% arriba de la lista de almacén
    descuento: 0, iva: 21,
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
    'GU-OSC':    ['COMPAS OSCILOBATIENTE UNI-JET (aprox.)', 'herraje', 15.5, null, 0],
    'GU-PROY':   ['COMPASES PROYECTANTE (aprox.)', 'herraje', 21.4, null, 0],
    'GU-PAS':    ['PASADORES HOJA PASIVA (aprox.)', 'herraje', 9.5, null, 0],
    'CERR-MP':   ['CERRADURA MULTIPUNTO 25/92', 'herraje', 35.17, null, 0],
    'BIS-PTA':   ['BISAGRA PUERTA (aprox.)', 'herraje', 8.0, null, 0],
  };
  const COLOR_FALLBACK = { blanco: 1, golden: 1.70, nogal: 1.70, grafito: 1.70, negro: 1.82, turner: 1.95, bic_golden: 1.38, bic_grafito: 1.38, bic_negro: 1.45 };

  // Cremonas GU por rango de altura (precio de almacén; se le aplica el recargo GU)
  const CREMONA_INLINE = [[600, 7.01, 'G-19505 E7,5 200-600'], [1000, 15.97, 'G-15383 E7,5 600-1000'], [1600, 17.29, 'G-15383 E7,5 1000-1600'], [2500, 25.38, 'G-15383 E7,5 1801-2500']];
  const CREMONA_CANTO = [[600, 5.13, 'E15 310-600'], [800, 5.13, 'E15 601-800'], [900, 5.41, 'E15 801-900'], [1000, 5.13, 'E15 801-1000'], [1100, 6.15, 'E15 1001-1100'], [1200, 5.79, 'E15 1001-1200'], [1300, 7.17, 'E15 1201-1300'], [1400, 6.51, 'E15 1201-1400'], [1500, 8.0, 'E15 1401-1500'], [1600, 7.41, 'E15 1401-1600'], [1800, 8.37, 'E15 1601-1800'], [2000, 9.62, 'E15 1801-2800'], [2200, 11.37, 'E15 2001-2200'], [99999, 11.37, 'E15 2001-2200']];
  const rango = (tabla, h) => tabla.find(r => h <= r[0]) || tabla[tabla.length - 1];

  const esColor = c => c && c !== 'blanco';

  // ---------- Fichas técnicas ----------
  // Cada pieza: [código, uds, largo mm (0 si es por unidad), detalle]
  function ficha(tip, W, H, color) {
    const L = [], vid = [];
    const p = (cod, uds, largo, det) => { if (uds > 0) L.push({ cod, uds, largo, det: det || '' }) };
    const col = esColor(color);
    // tornillos TR-16 por cada tramo de refuerzo
    let tr = 0; const trs = (largo, paso) => { tr += Math.ceil(largo / paso) };
    const remate = () => {
      p('913051000', 2, W + 70, 'tapajuntas horizontal'); p('913051000', 2, H + 70, 'tapajuntas vertical');
      const clip = x => Math.max(3, Math.floor(x / 250));
      p('945675000', 2 * clip(W) + 2 * clip(H), 0); p('945685000', 4, 0);
      p('VR-T-01', 2 * Math.round((W + 70) / 350) + 2 * Math.round((H + 70) / 350), 0);
    };
    if (tip === 'corr2' || tip === 'corr3') {
      const n = tip === 'corr3' ? 3 : 2;
      const hw = Math.round(W / n) - 5, hh = H - 90;
      p('110331000', 2 * n, hw, 'hoja horizontal'); p('110331000', 2 * n, hh, 'hoja vertical');
      if (n === 2) { p('112501000', 2, W + 6, 'marco'); p('112501000', 2, H + 6, 'marco') }
      else { p('112601000', 2, W + 6, 'marco 3 guías'); p('112601000', 2, H + 6, 'marco 3 guías') }
      p('113341000', 2 * (n - 1), H - 98); p('113411000', 2 * (n - 1), H - 98); p('113451000', 2 * (n - 1), H - 98);
      p('144410300', n === 2 ? 2 : 3, W - 112, 'guía');
      const gw = Math.round(W / n) - 131, gh = H - 216;
      for (let i = 0; i < n; i++) { vid.push([gw, gh]); p('410061000', 2, gw + 8); p('410061000', 2, gh + 8) }
      const pasoH = col ? 170 : 250, pasoM = col ? 200 : 300;
      p('920100015', 2 * n, hw - 130, 'refuerzo hoja'); p('920100015', 2 * n, hh - 130, 'refuerzo hoja');
      for (let i = 0; i < 2 * n; i++) { trs(hw - 130, pasoH); trs(hh - 130, pasoH) }
      p('920220015', 2, W - 88, 'refuerzo marco'); p('920220015', 2, H - 88, 'refuerzo marco');
      for (let i = 0; i < 2; i++) { trs(W - 88, pasoM); trs(H - 88, pasoM) }
      p('932003300', 2 * (n - 1), 0, (H - 96) + ' mm'); L[L.length - 1].cantM = (H - 96) / 1000;
      p('145040000', 4 * n, 0); p('145101000', 2 * (n - 1), 0); p('145231000', 2 * n, 0);
      p('945131000', 2, 0); p('945160000', 4 * n, 0);
      remate();
      const cr = rango(CREMONA_INLINE, hh - 100);
      p('GU-C-906', n - 1 + (n === 3 ? 0 : 1), 0); p('GU-E-138', 2 * n, 0); p('GU-E-181', n, 0);
      L.push({ cod: 'CREMONA-IL', uds: n, largo: 0, det: cr[2], precio: cr[1] });
      p('GU-L-250', 2 * n, 0); p('GU-L-252', 2 * n, 0);
    } else if (tip === 'pano') {
      p('112241000', 2, W + 6, 'marco'); p('112241000', 2, H + 6, 'marco');
      p('145060000', 4, 0);
      const gw = W - 104, gh = H - 104; vid.push([gw, gh]);
      p('410181000', 2, gw + 8); p('410181000', 2, gh + 8);
      p('920470013', 1, W - 116, 'refuerzo marco'); p('920480013', 1, W - 116, 'refuerzo marco'); p('920480013', 2, H - 116, 'refuerzo marco');
      for (let i = 0; i < 2; i++) { trs(W - 116, 250); trs(H - 116, 250) }
      p('945131000', 2, 0); p('945160000', 4, 0);
      remate();
    } else {
      // DC 66-85 (abrir / oscilo / proyectante) y DC 100 (puerta)
      const n = TIPOLOGIAS[tip].hojas, puerta = tip.startsWith('puerta');
      const hw = n === 1 ? W - 74 : Math.round(W / 2) - 30, hh = H - 74;
      p('112241000', 2, W + 6, 'marco'); p('112241000', 2, H + 6, 'marco');
      p(puerta ? '110211000' : '110201000', 2 * n, hw, 'hoja horizontal'); p(puerta ? '110211000' : '110201000', 2 * n, hh, 'hoja vertical');
      if (n === 2) p('111231000', 1, hh, 'batiente central');
      p('145060000', 4 * n, 0);
      const gw = hw - 148, gh = hh - 148 - (puerta ? 100 : 0);
      for (let i = 0; i < n; i++) { vid.push([gw, gh]); p('410181000', 2, gw + 8); p('410181000', 2, gh + 8) }
      p('913151000', n, H - 120);
      p(puerta ? '920070025' : '920090015', 2 * n, hw - 160, 'refuerzo hoja'); p(puerta ? '920070025' : '920090015', 2 * n, hh - 160, 'refuerzo hoja');
      for (let i = 0; i < 2 * n; i++) { trs(hw - 160, 250); trs(hh - 160, 250) }
      p('920470013', 1, W - 116, 'refuerzo marco'); p('920480013', 1, W - 116, 'refuerzo marco'); p('920480013', 2, H - 116, 'refuerzo marco');
      for (let i = 0; i < 2; i++) { trs(W - 116, 250); trs(H - 116, 250) }
      p('945131000', 2, 0); p('945160000', 4 * n, 0);
      remate();
      if (puerta) {
        p('BIS-PTA', 3 * n, 0); p('CERR-MP', 1, 0); p('GU-C-906', 1, 0); if (n === 2) p('GU-PAS', 1, 0);
      } else {
        ['GU-6-342', 'GU-6-360', 'GU-6-361', 'GU-6-368', 'GU-6-391', 'GU-9-408', 'GU-9-488', 'GU-K-186'].forEach(c => p(c, n, 0));
        p('GU-9-447', 2 * n, 0); p('GU-C-906', 1, 0); p('GU-L-252', 2, 0);
        const cr = rango(CREMONA_CANTO, hh - 100);
        L.push({ cod: 'CREMONA-CA', uds: 1, largo: 0, det: cr[2], precio: cr[1] });
        if (n === 2) p('GU-PAS', 1, 0);
        if (tip.startsWith('osc')) p('GU-OSC', n, 0);
        if (tip === 'proy') p('GU-PROY', 1, 0);
      }
    }
    p('TR-16', tr, 0);
    return { piezas: L, vidrios: vid };
  }

  // Fabricación (USD de compra): calibrada con las capturas; escala con el perímetro.
  const FABRICACION = { corr2: [96.238, 5.2], corr3: [96.238 * 1.4, 5.2], pano: [39.13, 4.0], abrir1: [70.946, 3.2], abrir2: [70.946 * 1.7, 3.2], osc1: [70.946 * 1.1, 3.2], osc2: [70.946 * 1.85, 3.2], proy: [70.946, 3.2], puerta1: [70.946 * 1.3, 3.2], puerta2: [70.946 * 2.1, 3.2] };
  const ACRISTALAMIENTO = 2.9165; // por vidrio

  function hetmo(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const W = item.ancho, H = item.alto, color = item.color || 'blanco';
    const { piezas, vidrios } = ficha(item.tipologia, W, H, color);
    const G = { perfiles: 0, refuerzos: 0, juntas: 0, tornilleria: 0, accesorios: 0, tapajuntas: 0, vidrios: 0, herraje: 0, fabricacion: 0, acristalamiento: 0 };
    const V1 = Object.assign({}, G);
    const det = [];
    for (const pz of piezas) {
      let desc, grupo, precio, lineal;
      if (pz.precio != null) { desc = 'CREMONA ' + pz.det; grupo = 'herraje'; precio = pz.precio * P.recargoHerrajeGU; lineal = 0 }
      else {
        const a = ART[pz.cod]; desc = a[0]; grupo = a[1]; lineal = a[4];
        precio = a[2];
        if (esColor(color) && grupo !== 'refuerzos' && a[3] !== null) precio = (a[3] && a[3][color]) || a[2] * COLOR_FALLBACK[color];
      }
      const cant = pz.largo ? pz.uds * pz.largo / 1000 : pz.cantM ? pz.uds * pz.cantM : pz.uds;
      const imp = cant * precio;
      G[grupo] += imp; V1[grupo] += imp * (lineal ? P.mermaLineal : 1);
      det.push({ cod: pz.cod, desc, grupo, uds: pz.uds, largo: pz.largo, cant, unidad: pz.largo || pz.cantM ? 'm' : 'u', det: pz.det, precio, importe: imp });
    }
    const vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const usdM2 = vid.ars / P.tipoCambio;
    for (const [gw, gh] of vidrios) {
      const a = Math.max(0.5, Math.ceil(gw / 10) * Math.ceil(gh / 10) / 10000);
      const imp = a * usdM2; G.vidrios += imp; V1.vidrios += imp;
      det.push({ cod: vid.cod, desc: vid.nombre, grupo: 'vidrios', uds: 1, cant: a, unidad: 'm²', det: `${gw} × ${gh}`, precio: usdM2, importe: imp });
      if (vid.camara) {
        const per = 2 * (gw + gh) / 1000, pc = CAMARAS[vid.camara] / P.tipoCambio, ic = per * pc;
        G.vidrios += ic; V1.vidrios += ic * P.mermaLineal;
        det.push({ cod: vid.camara, desc: 'Separador cámara ' + vid.camara, grupo: 'vidrios', uds: 1, cant: per, unidad: 'm', det: 'perímetro del vidrio', precio: pc, importe: ic });
      }
    }
    const per = 2 * (W + H) / 1000;
    const [fb, pref] = FABRICACION[item.tipologia];
    G.fabricacion = fb * (0.5 + 0.5 * per / pref) * (esColor(color) ? 1.0173 : 1);
    G.acristalamiento = ACRISTALAMIENTO * vidrios.length;
    V1.fabricacion = G.fabricacion; V1.acristalamiento = G.acristalamiento;
    const montaje = P.montajeMl * per;
    const compra = Object.values(G).reduce((s, x) => s + x, 0);
    const venta1 = Object.values(V1).reduce((s, x) => s + x, 0) + montaje;
    const mg = 1 + P.margen / 100;
    const carpinteria = (V1.perfiles + V1.refuerzos + V1.juntas + V1.tornilleria + V1.accesorios + V1.tapajuntas + V1.herraje + V1.fabricacion) * mg;
    const vidriosV = (V1.vidrios + V1.acristalamiento) * mg;
    const montajeV = montaje * mg;
    return { detalle: det, compra: G, venta1Grupos: V1, montaje, totalCompra: compra, venta1, venta: venta1 * mg,
      carpinteria, vidrios: vidriosV, montajeVenta: montajeV, exacto: !!TIPOLOGIAS[item.tipologia].exacto };
  }

  // ---------- Referencia WMaker (precio de lista GH calibrado) ----------
  function basicoWM(tip, W, H) {
    switch (tip) {
      case 'pano': return 25.6 + 36.9 * W + 89.2 * H;
      case 'corr2': return 81.1 + 209.1 * W + 188.5 * H;
      case 'corr3': return (81.1 + 209.1 * W + 188.5 * H) * 1.30;
      case 'abrir1': return 32.1 + 87.5 * W + 198.5 * H;
      case 'abrir2': return 111.3 + 107.0 * W + 309.7 * H;
      case 'osc1': return (32.1 + 87.5 * W + 198.5 * H) * 1.45;
      case 'osc2': return (111.3 + 107.0 * W + 309.7 * H) * 1.37;
      case 'proy': return 15.4 + 208.3 * W + 291.0 * H;
      case 'puerta1': return 868.7 + 13 * (W + H);
      case 'puerta2': return (868.7 + 13 * (W + H)) * 1.9;
    }
    return 0;
  }
  function vidrioWM(tip, W, H) {
    const a = Math.max(0, (W - 0.1) * (H - 0.1)); let v;
    if (tip === 'pano') v = 154.5 * a;
    else if (tip.startsWith('corr')) v = 141 * a - 28;
    else if (tip === 'abrir1' || tip === 'osc1') v = 129.8 * a - 9.5;
    else if (tip === 'abrir2' || tip === 'osc2') v = 133.5 * a - 31.2;
    else if (tip === 'proy') v = 141 * a - 19.1;
    else v = 155 * a - 30;
    return Math.max(v, 60 * a, 8);
  }
  function mosquiteroWM(tip, W, H) {
    if (tip.startsWith('corr')) { const n = tip === 'corr3' ? 2 : 1; return n * (45.4 + 120.4 * (W / (tip === 'corr3' ? 3 : 2)) * H) }
    return 40 + 70 * W * H;
  }
  function precioWMaker(item) {
    const W = item.ancho / 1000, H = item.alto / 1000, fc = esColor(item.color) ? 1.27 : 1;
    const v = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const basico = basicoWM(item.tipologia, W, H) * fc, vidrio = vidrioWM(item.tipologia, W, H) * v.multWM;
    const mosq = item.mosquitero && TIPOLOGIAS[item.tipologia].mosq ? mosquiteroWM(item.tipologia, W, H) * fc : 0;
    return { basico, vidrio, mosq, unitario: basico + vidrio + mosq };
  }

  // ---------- Precio para el presupuesto ----------
  function precio(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const h = hetmo(item, P);
    const montaje = P.incluirMontaje ? h.montajeVenta : 0;
    // Mosquitero: Hetmo lo cotiza con otra ficha; mientras tanto se usa la referencia WMaker.
    const mosq = item.mosquitero && TIPOLOGIAS[item.tipologia].mosq ? mosquiteroWM(item.tipologia, item.ancho / 1000, item.alto / 1000) * (esColor(item.color) ? 1.27 : 1) : 0;
    return { carpinteria: h.carpinteria, vidrios: h.vidrios, montaje, mosq, unitario: h.carpinteria + h.vidrios + montaje + mosq, hetmo: h };
  }

  function descripcion(item) {
    const t = TIPOLOGIAS[item.tipologia], col = COLORES[item.color] || COLORES.blanco, vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    let d = t.desc;
    if (t.hojas > 0) d += ` de ${t.hojas === 1 ? 'una hoja' : t.hojas + ' hojas'}`;
    d += `, color ${col.nombre.toLowerCase()}, con vidrios ${vid.nombre.toLowerCase()}`;
    if (item.mosquitero && t.mosq) d += ' y con mosquitero';
    return d + `. medidas : ${item.ancho}x${item.alto}`;
  }

  function totales(items, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const T = { subtotal: 0, carpinteria: 0, vidrios: 0, montaje: 0, mosq: 0, unidades: 0, compra: 0 };
    for (const it of items) {
      const p = precio(it, P), q = it.cantidad || 1;
      T.subtotal += p.unitario * q; T.carpinteria += p.carpinteria * q; T.vidrios += p.vidrios * q; T.montaje += p.montaje * q; T.mosq += p.mosq * q; T.unidades += q;
      T.compra += p.hetmo.totalCompra * q;
    }
    const f = 1 - P.descuento / 100;
    T.descuento = T.subtotal * (1 - f); T.total = T.subtotal * f;
    for (const k of ['carpinteria', 'vidrios', 'montaje', 'mosq']) T[k] *= f;
    T.iva = T.total * P.iva / 100; T.totalIva = T.total + T.iva;
    return T;
  }

  const api = { TIPOLOGIAS, COLORES, VIDRIOS, PARAMETROS_BASE, ART, hetmo, precio, precioWMaker, descripcion, totales };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MotorGH = api;
})(typeof window !== 'undefined' ? window : globalThis);

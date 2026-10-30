// Motor de cálculo del cotizador GH.
// Dos cálculos:
//  1) precioLista(): precio de lista GH (antes del descuento), calibrado contra ventanas reales de WMaker.
//  2) despieceHetmo(): despiece estimado valuado con la lista de almacén de Hetmo (Compra → Venta 1 → Venta).
//     Es una aproximación hasta tener las fichas técnicas reales de Hetmo.
(function (root) {
  'use strict';

  const TIPOLOGIAS = {
    pano:   { nombre: 'Paño fijo',                 prefijo: 'PF', hojas: 0, desc: 'Paño fijo' },
    corr2:  { nombre: 'Corrediza 2 hojas',         prefijo: 'VC', hojas: 2, desc: 'Ventana corrediza', mosq: true },
    corr3:  { nombre: 'Corrediza 3 hojas',         prefijo: 'VC', hojas: 3, desc: 'Ventana corrediza', mosq: true },
    abrir1: { nombre: 'De abrir 1 hoja',           prefijo: 'VA', hojas: 1, desc: 'Ventana de abrir', mosq: true },
    abrir2: { nombre: 'De abrir 2 hojas',          prefijo: 'VA', hojas: 2, desc: 'Ventana de abrir', mosq: true },
    osc1:   { nombre: 'Oscilobatiente 1 hoja',     prefijo: 'VO', hojas: 1, desc: 'Ventana oscilobatiente', mosq: true },
    osc2:   { nombre: 'Oscilobatiente 2 hojas',    prefijo: 'VO', hojas: 2, desc: 'Ventana oscilobatiente', mosq: true },
    proy:   { nombre: 'Proyectante',               prefijo: 'VP', hojas: 1, desc: 'Ventana proyectante', mosq: true },
    puerta1:{ nombre: 'Puerta de rebatir 1 hoja',  prefijo: 'PR', hojas: 1, desc: 'Puerta de rebatir', mosq: false },
    puerta2:{ nombre: 'Puerta de rebatir 2 hojas', prefijo: 'PR', hojas: 2, desc: 'Puerta de rebatir', mosq: false },
  };

  const COLORES = {
    blanco:      { nombre: 'Blanco',                        foliado: false, hetmo: '1000' },
    golden:      { nombre: 'Golden oak',                    foliado: true,  hetmo: '4010' },
    nogal:       { nombre: 'Nogal',                         foliado: true,  hetmo: '4100' },
    grafito:     { nombre: 'Gris grafito',                  foliado: true,  hetmo: '3110' },
    negro:       { nombre: 'Negro (Jet black)',             foliado: true,  hetmo: '5280' },
    turner:      { nombre: 'Turner oak',                    foliado: true,  hetmo: '2240' },
    bic_golden:  { nombre: 'Blanco int. / Golden oak ext.', foliado: true,  bicolor: true, hetmo: '1011' },
    bic_grafito: { nombre: 'Blanco int. / Gris grafito ext.', foliado: true, bicolor: true, hetmo: '1311' },
    bic_negro:   { nombre: 'Blanco int. / Negro ext.',      foliado: true,  bicolor: true, hetmo: '1281' },
  };

  // Multiplicadores de vidrio respecto del DVH 4/12/4, sacados de los mismos datos de WMaker.
  // usdM2Hetmo: precio de lista de almacén en pesos por m² (se pasa a USD con el tipo de cambio).
  const VIDRIOS = {
    dvh:        { nombre: 'DVH 4/12/4',                         wmaker: 'doble vidriado hermetico 4/12/4', mult: 1.00, arsM2: 34344 },
    dvh_lam:    { nombre: 'DVH laminado 3+3 / 9 / 4',           wmaker: 'doble vidriado hermetico lam 3+3 + camara 9 + float 4', mult: 1.17, arsM2: 72095 },
    dvh_lamlam: { nombre: 'DVH laminado 3+3 / 9 / 3+3',         wmaker: 'doble vid lam 3+3 + camara 9 + lam 3+3', mult: 1.28, arsM2: 109846 },
    dvh_sat:    { nombre: 'DVH 4/12/4 satinado',                wmaker: 'doble vidriado hermetico 4/12/4 satinado', mult: 1.10, arsM2: 122070 },
    lam33:      { nombre: 'Laminado 3+3 incoloro',              wmaker: 'laminado 3+3 incoloro', mult: 0.55, arsM2: 54923 },
    float4:     { nombre: 'Float 4 mm',                         wmaker: 'float 4mm incoloro', mult: 0.24, arsM2: 17172 },
    float5:     { nombre: 'Float 5 mm',                         wmaker: 'float 5mm incoloro', mult: 0.60, arsM2: 22239 },
    sat4:       { nombre: 'Satinado 4 mm',                      wmaker: 'satinado 4mm', mult: 0.60, arsM2: 61035 },
  };

  const PARAMETROS_BASE = {
    recargoColor: 1.27,        // foliado sobre básico (PF3X2 golden/blanco = 1.27; Belu Urda grafito = 1.27)
    recargoBicolor: 1.27,
    descuento: 40,
    iva: 21,
    colocacionBase: 140, colocacionM2: 28,       // Belu Urda → 250, Gandara → 350
    contramarcoMl: 9,                             // Belu Urda → 100, Gandara → 150
    redondeo: 50,
    // Hetmo
    tipoCambio: 1450,
    mermaPerfiles: 1.07,
    margen: 55,
    manoObraM2: 35, manoObraHoja: 18, acristalamientoM2: 4,
  };

  // ---------- 1) Precio de lista GH (calibrado con WMaker) ----------
  // W y H en metros. Coeficientes de regresión sobre ventanas blancas reales.
  function basicoBlanco(tip, W, H) {
    const per = 2 * (W + H);
    switch (tip) {
      case 'pano':   return 25.6 + 36.9 * W + 89.2 * H;
      case 'corr2':  return 81.1 + 209.1 * W + 188.5 * H;
      case 'corr3':  return (81.1 + 209.1 * W + 188.5 * H) * 1.30;
      case 'abrir1': return 32.1 + 87.5 * W + 198.5 * H;
      case 'abrir2': return 111.3 + 107.0 * W + 309.7 * H;
      case 'osc1':   return (32.1 + 87.5 * W + 198.5 * H) * 1.45;
      case 'osc2':   return (111.3 + 107.0 * W + 309.7 * H) * 1.37;
      case 'proy':   return 15.4 + 208.3 * W + 291.0 * H;
      case 'puerta1':return 868.7 + 6.5 * per;
      case 'puerta2':return (868.7 + 6.5 * per) * 1.90;
    }
    return 0;
  }

  function vidrioDVH(tip, W, H) {
    const a = Math.max(0, (W - 0.1) * (H - 0.1));
    let v;
    switch (tip) {
      case 'pano':   v = 154.5 * a; break;
      case 'corr2': case 'corr3': v = 141.0 * a - 28.0; break;
      case 'abrir1': case 'osc1': v = 129.8 * a - 9.5; break;
      case 'abrir2': case 'osc2': v = 133.5 * a - 31.2; break;
      case 'proy':   v = 141.0 * a - 19.1; break;
      case 'puerta1': case 'puerta2': v = 155.0 * a - 30.0; break;
      default: v = 140 * a;
    }
    return Math.max(v, 60 * a, 8);
  }

  function mosquitero(tip, W, H) {
    if (tip === 'corr2' || tip === 'corr3') {
      const n = tip === 'corr3' ? 2 : 1;            // hojas de mosquitero
      const areaHoja = (W / (tip === 'corr3' ? 3 : 2)) * H;
      return n * (45.4 + 120.4 * areaHoja);
    }
    return 40 + 70 * W * H;                          // mosquitero fijo (estimado, sin datos reales)
  }

  function precioLista(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const W = item.ancho / 1000, H = item.alto / 1000;
    const col = COLORES[item.color] || COLORES.blanco;
    const vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const fc = col.foliado ? (col.bicolor ? P.recargoBicolor : P.recargoColor) : 1;
    const basico = basicoBlanco(item.tipologia, W, H) * fc;
    const vidrio = vidrioDVH(item.tipologia, W, H) * vid.mult;
    const mosq = item.mosquitero && TIPOLOGIAS[item.tipologia].mosq ? mosquitero(item.tipologia, W, H) * fc : 0;
    return { basico, vidrio, mosq, unitario: basico + vidrio + mosq };
  }

  // ---------- 2) Despiece estimado Hetmo ----------
  // Precios de almacén (USD por metro o por unidad) en blanco; el color multiplica perfiles.
  const ALMACEN = {
    marcoDZ:      { cod: '112501000', desc: 'Marco DZ (corrediza)',         usd: 5.77, grupo: 'perfiles', color: true },
    hojaPrime74:  { cod: '110331000', desc: 'Hoja Prime 74',                usd: 4.91, grupo: 'perfiles', color: true },
    encPrime74:   { cod: '113451000', desc: 'Encuentro Prime 74',           usd: 0.83, grupo: 'perfiles', color: true },
    marcoDC:      { cod: '112231000', desc: 'Marco DC',                     usd: 5.13, grupo: 'perfiles', color: true },
    hojaDC85:     { cod: '110201000', desc: 'Hoja ap. interior DC 85',      usd: 5.67, grupo: 'perfiles', color: true },
    hojaPuertaDC: { cod: '110211000', desc: 'Hoja puerta ap. int. DC 100',  usd: 6.32, grupo: 'perfiles', color: true },
    batienteDC:   { cod: '111231000', desc: 'Batiente DC',                  usd: 5.15, grupo: 'perfiles', color: true },
    contravidrio: { cod: '410101000', desc: 'Contravidrio',                 usd: 0.95, grupo: 'perfiles', color: true },
    refMarco:     { cod: '920150015', desc: 'Refuerzo alta inercia',        usd: 3.53, grupo: 'refuerzos' },
    refHoja:      { cod: '920470013', desc: 'Refuerzo 30,4 x 25,4',         usd: 2.44, grupo: 'refuerzos' },
    refPuerta:    { cod: '920070025', desc: 'Refuerzo pesado hoja DC 100',  usd: 4.81, grupo: 'refuerzos' },
    burlete:      { cod: '930045300', desc: 'Burletes y juntas',            usd: 0.30, grupo: 'juntas' },
    tornilleria:  { cod: 'TR-16',     desc: 'Tornillería',                  usd: 0.30, grupo: 'tornilleria' },
    carros:       { cod: 'HC036',     desc: 'Kit carros Tecnocom 140 kg',   usd: 11.99, grupo: 'herraje' },
    cierreCorr:   { cod: 'VR-V.4910.0107', desc: 'Cierre oculto corredera', usd: 12.64, grupo: 'herraje' },
    calzo:        { cod: 'RT-SUP-020', desc: 'Calzo p/rueda Prime 74',      usd: 1.93, grupo: 'accesorios' },
    herrajeAbrir: { cod: 'GU UNI-JET', desc: 'Herraje GU practicable',      usd: 38.0, grupo: 'herraje' },
    herrajeOsc:   { cod: 'GU UNI-JET', desc: 'Herraje GU oscilobatiente',   usd: 62.0, grupo: 'herraje' },
    herrajeProy:  { cod: 'GU',        desc: 'Herraje proyectante (compases)', usd: 34.0, grupo: 'herraje' },
    cerradura:    { cod: 'VR-V.6426.1602', desc: 'Cerradura multipunto',    usd: 35.17, grupo: 'herraje' },
    bisagraPuerta:{ cod: 'VBH',       desc: 'Bisagras puerta (juego)',      usd: 30.0, grupo: 'herraje' },
  };
  const RECARGO_PERFIL_COLOR = { blanco: 1, golden: 1.70, nogal: 1.70, grafito: 1.70, negro: 1.82, turner: 1.70, bic_golden: 1.38, bic_grafito: 1.38, bic_negro: 1.38 };

  function lineas(tip, W, H) {
    // W, H en metros. Devuelve [clave, cantidad, unidad, detalle].
    const L = [];
    const per = 2 * (W + H);
    const vid = [];
    const add = (k, q, u, d) => L.push([k, q, u, d]);
    if (tip === 'corr2' || tip === 'corr3') {
      const n = tip === 'corr3' ? 3 : 2;
      const hw = W / n + 0.035, hh = H - 0.07;
      add('marcoDZ', per, 'm', '2×(A+H)');
      add('hojaPrime74', n * 2 * (hw + hh), 'm', `${n} hojas`);
      add('encPrime74', (n - 1) * 2 * hh, 'm', 'cruces');
      add('refMarco', per, 'm', 'marco');
      add('refHoja', n * 2 * (hw + hh), 'm', 'hojas');
      const gw = hw - 0.12, gh = hh - 0.12;
      for (let i = 0; i < n; i++) vid.push([gw, gh]);
      add('burlete', n * 2 * (hw + hh) * 2, 'm', 'felpas y juntas');
      add('carros', n, 'u', '');
      add('cierreCorr', n - 1, 'u', '');
      add('calzo', n * 2, 'u', '');
      add('tornilleria', 20 + 6 * n, 'u', '');
    } else if (tip === 'pano') {
      add('marcoDC', per, 'm', '2×(A+H)');
      add('refMarco', per, 'm', 'marco');
      vid.push([W - 0.11, H - 0.11]);
      add('burlete', per * 2, 'm', '');
      add('tornilleria', 12, 'u', '');
    } else {
      const n = TIPOLOGIAS[tip].hojas;
      const puerta = tip.startsWith('puerta');
      const hw = (W - 0.04) / n + (n > 1 ? 0.02 : 0), hh = H - 0.04;
      add('marcoDC', per, 'm', '2×(A+H)');
      add(puerta ? 'hojaPuertaDC' : 'hojaDC85', n * 2 * (hw + hh), 'm', `${n} hoja${n > 1 ? 's' : ''}`);
      if (n > 1) add('batienteDC', hh, 'm', 'batiente central');
      add('refMarco', per, 'm', 'marco');
      add(puerta ? 'refPuerta' : 'refHoja', n * 2 * (hw + hh), 'm', 'hojas');
      for (let i = 0; i < n; i++) vid.push([hw - 0.17, hh - 0.17 - (puerta ? 0.1 : 0)]);
      add('burlete', (per + n * 2 * (hw + hh)) * 1.5, 'm', '');
      const her = puerta ? 'bisagraPuerta' : tip.startsWith('osc') ? 'herrajeOsc' : tip === 'proy' ? 'herrajeProy' : 'herrajeAbrir';
      add(her, n, 'u', '');
      if (puerta) add('cerradura', 1, 'u', '');
      add('tornilleria', 16 + 8 * n, 'u', '');
    }
    const perVid = vid.reduce((s, [a, b]) => s + 2 * (Math.max(a, 0) + Math.max(b, 0)), 0);
    add('contravidrio', perVid, 'm', 'perímetro de vidrios');
    const m2 = vid.reduce((s, [a, b]) => s + Math.max(a, 0.1) * Math.max(b, 0.1), 0);
    return { lineas: L, vidrioM2: m2, vidrios: vid };
  }

  function despieceHetmo(item, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    const W = item.ancho / 1000, H = item.alto / 1000;
    const { lineas: L, vidrioM2, vidrios } = lineas(item.tipologia, W, H);
    const rc = RECARGO_PERFIL_COLOR[item.color] || 1;
    const vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const grupos = { perfiles: 0, refuerzos: 0, juntas: 0, tornilleria: 0, accesorios: 0, vidrios: 0, herraje: 0, fabricacion: 0, acristalamiento: 0 };
    const detalle = L.filter(l => l[1] > 0).map(([k, q, u, d]) => {
      const a = ALMACEN[k];
      const precio = a.usd * (a.color ? rc : 1);
      const imp = precio * q;
      grupos[a.grupo] += imp;
      return { cod: a.cod, desc: a.desc, cant: q, unidad: u, detalle: d, precio, importe: imp, grupo: a.grupo };
    });
    const vidUSD = vid.arsM2 / P.tipoCambio;
    grupos.vidrios = vidrioM2 * vidUSD;
    detalle.push({ cod: item.vidrio, desc: vid.nombre, cant: vidrioM2, unidad: 'm²', detalle: vidrios.map(([a, b]) => `${Math.round(a * 1000)}×${Math.round(b * 1000)}`).join(' + '), precio: vidUSD, importe: grupos.vidrios, grupo: 'vidrios' });
    const nh = Math.max(1, TIPOLOGIAS[item.tipologia].hojas);
    grupos.fabricacion = P.manoObraM2 * W * H + P.manoObraHoja * nh;
    grupos.acristalamiento = P.acristalamientoM2 * vidrioM2;
    const compra = Object.values(grupos).reduce((s, x) => s + x, 0);
    const venta1 = compra + (grupos.perfiles + grupos.refuerzos) * (P.mermaPerfiles - 1);
    const venta = venta1 * (1 + P.margen / 100);
    return { detalle, grupos, compra, venta1, venta };
  }

  function descripcionWMaker(item) {
    const t = TIPOLOGIAS[item.tipologia], col = COLORES[item.color] || COLORES.blanco, vid = VIDRIOS[item.vidrio] || VIDRIOS.dvh;
    const linea = item.tipologia.startsWith('corr') ? 'linea tecnocom' : 'linea tecnocom';
    const puerta = item.alto >= 2000 && item.tipologia.startsWith('corr');
    let d = (puerta ? 'Puerta corrediza' : t.desc) + ' ' + linea;
    if (t.hojas > 0) d += ` de ${t.hojas === 1 ? 'una hoja' : t.hojas + ' hojas'}`;
    d += `, color ${col.nombre.toLowerCase()}, con vidrios ${vid.wmaker}`;
    if (item.mosquitero && t.mosq) d += ' y con mosquitero';
    d += `. medidas : ${item.ancho}x${item.alto}`;
    return d;
  }

  function redondear(x, paso) { return paso > 0 ? Math.round(x / paso) * paso : x; }

  function totales(items, P) {
    P = Object.assign({}, PARAMETROS_BASE, P || {});
    let sub = 0, bas = 0, vid = 0, mos = 0, m2 = 0, ml = 0, uds = 0;
    for (const it of items) {
      const p = precioLista(it, P), q = it.cantidad || 1;
      sub += p.unitario * q; bas += p.basico * q; vid += p.vidrio * q; mos += p.mosq * q;
      m2 += (it.ancho / 1000) * (it.alto / 1000) * q; ml += 2 * (it.ancho + it.alto) / 1000 * q; uds += q;
    }
    const f = 1 - P.descuento / 100;
    const colocSug = items.length ? redondear(P.colocacionBase + P.colocacionM2 * m2, P.redondeo) : 0;
    const contraSug = items.length ? Math.max(P.redondeo, redondear(P.contramarcoMl * ml, P.redondeo)) : 0;
    return { subtotal: sub, descuento: sub * (1 - f), total: sub * f, basico: bas * f, vidrios: vid * f, mosquiteros: mos * f, m2, ml, unidades: uds, colocacionSugerida: colocSug, contramarcosSugeridos: contraSug };
  }

  const api = { TIPOLOGIAS, COLORES, VIDRIOS, ALMACEN, PARAMETROS_BASE, precioLista, despieceHetmo, descripcionWMaker, totales, basicoBlanco, vidrioDVH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MotorGH = api;
})(typeof window !== 'undefined' ? window : globalThis);

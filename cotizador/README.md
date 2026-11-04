# Cotizador GH Aberturas

Programa propio para cotizar aberturas de PVC (línea Tecnocom / Muchteck), con el objetivo de dar los mismos resultados que el sistema que usa GH hoy (WMaker / Hetmo).

## Datos reunidos hasta ahora

### `datos/wmaker_*.csv`
Ventanas reales cotizadas en WMaker, con el desglose Básico / Vidrio. Se extrajeron del Google Sheet `GH_Consolidado_Final`. La columna `Fuente` indica de dónde sale cada dato:
- `WMaker real`: dato directo del sistema.
- `PDF total + formula validada`: el total sale de un PDF y el desglose es estimado.

### Fórmulas calibradas (USD, sin descuento)
El área neta es `(ancho − 100) × (alto − 100)` en m².

| Tipología | Básico + vidrio |
|---|---|
| Paño fijo DVH 4/12/4 | 154.07 × área |
| Paño fijo laminado 3+3 / templado | 181.49 × área |
| Abrir 1 hoja DVH (también proyectante) | 128.89 × área − 9.66 |
| Abrir 2 hojas DVH | 151.97 × área − 6.90 |
| Abrir 2 hojas laminado | 205.11 × área − 71.48 |
| Corrediza 2–3 hojas DVH | 169.71 × área + 0.44 |
| Corrediza 2–3 hojas laminado | 188.37 × área − 11.95 |
| Puerta (laminado/templado) | 168.94 × área − 45.29 |

Son aproximaciones. Las curvas tienen un piso: las ventanas chicas cuestan proporcionalmente más.

### Estructura del presupuesto de WMaker (archivos `.pto`)
- Por ítem: Tipo (VC1, PR2…), cantidad, medida, descripción, precio unitario (USDxU) y total.
- Subtotal → descuento % (40% habitual) → **Total**.
- El total se desglosa en **Básico + Vidrios + Mosquiteros**.
- Nota final: colocación + contramarcos + IVA.
- Condiciones: 60% de adelanto y 40% contra entrega. Plazo de 60/80 días en blanco y de 80/110 días en color. Dólar vendedor del BNA del día de pago. El izaje se cotiza aparte.

## Pendiente
- Listas de costos de Hetmo (perfiles, herrajes, vidrios) para pasar de fórmulas por m² a un cálculo por despiece.

## Hetmo: lo que muestran las capturas (`capturas/`)

### Catálogo de fichas técnicas (MUCHTEK)
| Serie | Fichas vistas |
|---|---|
| EFFICIENT ventana/puerta | 108 DC 66-85, 109 DC 66-100. Plegables 136–148 (Ap. Int./Ext. GU, ROTO, con o sin solera). 9231–9233 DC 55-69 / 55-85 / 55-100 |
| EFFICIENT pivotante | 123–128: M.EJE 200/300/400, Ap. Int./Ext. |
| PRIME 74 (corrediza) | 175: 2 guías. 176: 3 guías. 177: 3 guías c/mosq 11251/11033 |
| PRIME 90/44 (corrediza) | 171: 2 guías. 172: 3 guías. 174/178: 3 guías c/mosq. 179: 4 guías. 180/181: 4 guías c/mosq. La 173 está discontinuada |
| MOSQUITEROS | 901/902: 11035 sin/con marco. 905: 11030. 907/908: 31016. 909: 31017. 911/912: 11032. 9011/9021: 11035 con solera. 9072–9076: fijos 31017/91305/91304/31016. 90174/90274/901174/902174: 11033. Las 9070/9071 están descatalogadas |

Otras series que aparecen: JUMBO R:2.5 mm, JUMBO R:3, MARCO MINISLIDE 2 GUÍAS, ADVANCE, ECOLIFE, EVOLUTION, LÍNEA ECO.

### Análisis de importes: cómo arma el precio
Cada partida tiene 4 columnas: **Compra → Venta 1 → % margen → Venta**.
- Venta = Venta 1 × (1 + margen). La tarifa general es del **55%**.
- Partidas:
  - Ventana: perfiles, refuerzos, juntas, tornillería, accesorios.
  - Vidrios y paneles.
  - Premarco y tapajuntas.
  - Herraje.
  - Fabricación: mano de obra de ventana y acristalamiento.
  - Montaje.
  - Persiana (sin uso en los ejemplos).
- Compra → Venta 1:
  - Ejemplo 1: perfiles y refuerzos ×1.07 (¿merma o desperdicio?); el resto ×1.00.
  - Ejemplo 2: perfiles, refuerzos y tapajuntas ×1.3375 (= 1.07 × 1.25); vidrio ×1.28; el resto ×1.25.
- Montaje: arranca en 0 en Compra y aparece recién en Venta 1. Ejemplo 1: 176.8; ejemplo 2: 760.75.
- Comprobación con el ejemplo 1:
  - Total compra 979.77, igual a la suma de la columna Compra.
  - Total venta 1 1188.03, igual a la suma de Venta 1.
  - Total venta 1841.45, igual a la suma de la columna Venta.

### Cabecera del presupuesto
- Tarifa "2 TARIFA GENERAL 55%", IVA 21%, divisa USD.
- Desglose de importes: "Carpintería + Vidrios + Monobloc + …".
- Montaje: "2 INSTALACIÓN BÁSICA".
- Amarre a obra: "Agujero 6 mm".

## Artículos de almacén de Hetmo (`datos/hetmo_articulos_almacen.csv`)
Sale del PDF "Articulos de almacen con precios HETMO" (359 páginas, unos 20.000 artículos), que está en el Drive.
- Columnas: proveedor, familia, código, descripción, color y precio.
- En el PDF original la descripción y el color se superponen, así que algunas descripciones quedan cortadas.
- **Perfiles Tecnoperfiles:** el precio parece ser USD por metro.
  - Ejemplos en blanco: Marco DC 5,13; Hoja ap. int. DC 85 5,67; Hoja Prime 74 4,91.
  - El código tiene 9 dígitos. Los dígitos 6 a 9 son el color: 1000 = Blanco, 4010 = Golden Oak, 1011 = M.Blanca F.Golden Oak, 3110 = Gris Grafito, 4100 = Nogal.
- **Recargo por color en perfiles** (mediana contra blanco):
  - Golden Oak, Nogal y Gris Grafito: ×1,70.
  - Blanco interior con color exterior: ×1,38.
  - Jet Black: ×1,82.
- **Vidrios:** el precio parece estar en **pesos por m²**. Ejemplos: 4/12/4 incoloro 34.344; 3+3/9/4 72.095; float 4 mm 17.172.
- **Herrajes** (GU, ROTO, VBH, REZE, VORNE, Häusen, Magnum): precio por unidad.

## Motor Hetmo (`app/motor.js`)
Sale de las capturas de las 4 ventanas de prueba (`capturas/hetmo_prueba/`, cargadas con el dólar a $1540) y de la tanda de 15 (`capturas/hetmo_tanda/`, con el dólar a $1565). Las 6 ventanas que hay hasta ahora dan a menos de USD 0,11 de Hetmo.

| Ventana | Ficha | Compra | Venta 1 | Venta |
|---|---|---|---|---|
| V1 corrediza 1500×1100 blanca | 175 Prime 74 2 guías | 389,25 | 488,89 | 757,77 |
| V4 la misma en golden oak | 175 | 455,43 | 559,11 | 866,63 |
| V2 abrir 600×1000 blanca | 108 DC 66-85 | 207,82 | 267,32 | 414,35 |
| V3 paño fijo 1000×1000 blanco | DC 58-66 | 144,00 | 216,93 | 336,25 |

**Reglas que aplica Hetmo:**
- **De Compra a Venta 1:**
  - Los artículos por metro suben ×1,07: perfiles, refuerzos, tapajuntas y cámara.
  - Los artículos por unidad quedan igual: herrajes, accesorios, tornillos, vidrio por m² y coliza.
  - El montaje es USD 17 por metro de perímetro y aparece recién en Venta 1.
- **Venta** = Venta 1 × 1,55.
- **Vidrio:**
  - Cada lado se redondea hacia arriba a 10 mm y se cobra un mínimo de 0,5 m².
  - Se suma la cámara (C12, C9) por metro de perímetro.
  - Los pesos se pasan a dólares con el tipo de cambio cargado.
- **Acristalamiento:** USD 2,9165 por vidrio.
- **Herraje GU:** Hetmo lo valúa ×1,1466 sobre la lista de almacén. Las cremonas se eligen por rango con el alto de la hoja menos 100.
- **Tornillos TR-16:** uno cada 250 mm de refuerzo (marco DZ: cada 300). En color, uno cada 170 mm en hoja y cada 200 en marco.
- **Tapajuntas 91305:**
  - Clips por lado: el máximo entre 3 y ancho/250 redondeado hacia abajo.
  - Tornillos VR-T-01: largo/350 redondeado, por lado.
- **Fabricación:** un fijo por tipología, más USD 0,0757 por tornillo TR-16, más USD 0,408 por m² de vidrio. Se calibró con 4 corredizas (`capturas/hetmo_tanda/`: 1000×900 y 2000×1500 al dólar de $1565) y da error menor a USD 0,01. De abrir y paño fijo se calibraron con una captura cada uno.
- **Clips del tapajuntas:** uno cada 300 mm de tapajuntas, redondeando hacia arriba.
- **Tapas de desagüe de la corrediza:** 2, o 1 cada 750 mm de ancho si eso da más.
- **Tornillos de las hojas de la corrediza en blanco:** (largo del refuerzo − 30) / 250, redondeando hacia arriba.

**Cortes:**
- **Prime 74:**
  - Marco W+6 / H+6.
  - Hoja W/2−5 / H−90.
  - Vidrio W/2−131 × H−216.
  - Guía W−112.
  - Tapa, encuentro y tapa de encuentro: H−98.
  - Refuerzo de hoja: hoja−130. Refuerzo de marco: W−88 / H−88.
- **DC 66-85:**
  - Marco W+6 / H+6.
  - Hoja W−74 / H−74.
  - Vidrio W−222 × H−222.
  - Refuerzo de hoja: hoja−160.
  - Refuerzo de marco: W−116 / H−116.
  - Tapa canal: H−120.
- **Paño fijo DC:** marco W+6 / H+6, vidrio W−104 × H−104.
- **Tapajuntas:** W+70 / H+70.
- **Contravidrio:** lado del vidrio + 8.

**Aproximadas (sin captura de Hetmo):** corrediza de 3 hojas, de abrir de 2 hojas, oscilobatientes, proyectante, puertas y mosquiteros.

## Comparación con presupuestos reales de Hetmo (`datos/presupuestos_hetmo/`)
Son 5 presupuestos con 51 ventanas. Se comparan con `node datos/presupuestos_hetmo/comparar.js datos/presupuestos_hetmo/ventanas.json 1565`.
- **Prime 90/44:** Hetmo usa la "LINEA PRIME" (90/44) en las corredizas altas y la "PRIME 74" en el resto. El cotizador la elige sola a partir de 1900 mm de alto, y se puede forzar. Su carpintería es la de Prime 74 ×1,405, calibrado con el N° 240.
- **Mosquitero corredizo:** 132,06 + 56,55 × ancho de hoja × 2 + 28 × (alto − 2), en USD de venta por hoja de mosquitero. Calibrado con el N° 240, que tiene una versión con mosquitera y otra sin.
- **Ajustes de carpintería mientras no haya despiece:**
  - Corrediza de 3 hojas ×0,72 (N° 236).
  - Puerta DC 100 ×1,63 (N° 215 y 192).
  - Compás oscilobatiente 29,7 y compás de banderola 0,5 (N° 236 y 215).
- **Resultado con los presupuestos de octubre (N° 240, 236 y 215, 33 ventanas):** error medio de 2,0%; 25 ventanas a menos de 3% y 30 a menos de 5%.
- **El N° 192, de septiembre, da 7,9% de error medio.** En golden con vidrio 5T/12/5T y en oscilobatientes golden queda 15% abajo; puede ser otra lista de precios u otro dólar.

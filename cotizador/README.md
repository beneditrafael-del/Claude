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

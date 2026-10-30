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

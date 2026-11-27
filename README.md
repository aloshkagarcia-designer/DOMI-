# DOMI · Finanzas personales

App de control de gastos personales para **iPhone y Android**. Estética premium negro y blanco, con acentos en azul eléctrico y verde fósforo.

## Funciones
- **Resumen**: balance del mes, tasa de ahorro, ritmo de gasto diario, gasto por categoría, comparativo de 6 meses y proyección al cierre.
- **Movimientos**: gastos e ingresos con categoría, cuenta, fecha y nota; búsqueda y filtros.
- **Recibos y reembolsos**: foto del ticket (cámara o galería) y gastos de trabajo *Por reembolsar → Reembolsado*.
- **Límites** por categoría con alertas al 80% y al 100%.
- **Metas de ahorro** con abonos y retiros.
- **Ajustes**: moneda, modo claro u oscuro, reporte CSV, respaldo e importación JSON.
- **Privada**: los datos viven solo en el teléfono. Sin servidor ni cuentas.

## Instalación en el celular
DOMI es una app web instalable (PWA): se instala desde el navegador, con ícono propio, a pantalla completa y funciona sin conexión.

- **iPhone**: abre el enlace en Safari → **Compartir** → **Agregar a inicio**.
- **Android**: abre el enlace en Chrome → **Instalar app** (o menú ⋮ → *Instalar app*).

La propia app muestra estas instrucciones según el teléfono. Manteniendo presionado el ícono en Android aparece el atajo **Nuevo gasto**.

## Publicarla
El repositorio es privado, así que GitHub Pages requiere plan de pago. La alternativa gratuita es **Netlify** o **Vercel**: conecta este repositorio y publícalo sin compilación (carpeta raíz).

## Probar en local
```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Marca
**DOMI** en mayúsculas compactas con punto verde final. Monograma: una **D** de trazo grueso que guarda un punto verde fósforo en su interior, el dinero a resguardo.

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#050505` | Negro profundo |
| Texto | `#F5F5F2` | Blanco cálido |
| Azul eléctrico | `#3D6BFF` | Gasto, interacción, avisos |
| Verde fósforo | `#3BFF8A` | Ingreso, logro, acción principal |

Tipografías: Inter Tight (titulares y cifras), Inter (texto), JetBrains Mono (etiquetas).

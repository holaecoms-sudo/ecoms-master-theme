# ECOMS MASTER · Despliegue multitienda

Guía para lanzar una tienda nueva (`productoN.ecoms.cl`) con el theme maestro, sin escribir Liquid.

**Principio:** el **código** se comparte y los **datos** quedan separados.

- Cada subdominio es una **tienda Shopify independiente**, con su catálogo, pedidos, pagos, Dropi y tracking.
- Todas usan el mismo theme ECOMS MASTER, con sus propios ajustes y contenido.

---

## 1. Qué hay en el theme

| Plantilla | Archivo | Para qué |
|---|---|---|
| **ECOMS Flex** (por defecto) | `templates/product.ecoms-flex.json` | Modular, sirve para cualquier categoría |
| **ECOMS Direct** | `templates/product.ecoms-direct.json` | Performance: caja de compra, urgencia real, stock real, cifras |
| **ECOMS Brand** | `templates/product.ecoms-brand.json` | Editorial premium: historia, tecnología, rutina, comunidad |

Componentes compartidos:
- **Secciones** `sections/ecoms-*` (producto, packs, reseñas, FAQ, cross-sell, upsell, etc.).
- **Snippets** `snippets/ecoms-*`.
- **Estilos:** `assets/ecoms-base.css` y `assets/ecoms-components.css`, más una piel por plantilla en `assets/ecoms-skin-{flex|direct|brand}.css`.
- **Comportamiento:** `assets/ecoms.js`.

Header (`ecoms-header`), anuncios (`ecoms-announcement`) y footer (`ecoms-footer`) son secciones propias. Con el estilo **"Según la plantilla"** cambian solos al elegir Flex, Direct o Brand.

---

## 2. Instalar el theme en una tienda nueva

**A. Por ZIP (lo más simple)**
1. En el repositorio, rama `main`, ejecuta `./scripts/package-theme.sh`. Se crea `dist/ecoms-master-<versión>.zip`.
2. En la tienda nueva: *Tienda online → Temas → Agregar tema → Subir archivo zip*.

**B. Por GitHub (para recibir mejoras después)**
1. Crea la rama de la tienda desde `main`: `git checkout -b tienda-{nombre} origin/main && git push -u origin tienda-{nombre}`.
2. En la tienda: *Temas → Agregar tema → Conectar desde GitHub* y elige `holaecoms-sudo/ecoms-master-theme` con la rama `tienda-{nombre}`.
3. Revisa *Tema → GitHub → View logs*: debe decir **"0 failed"**.

> ⚠️ **Nunca conectes dos tiendas a la misma rama.** Shopify escribe en la rama conectada cada cambio del editor (`config/settings_data.json`, `templates/*.json`, `sections/*-group.json`). Si dos tiendas comparten rama, se pisan entre ellas.

---

## 3. Elegir y configurar la plantilla

1. **Plantilla global** (header, anuncios, footer, páginas): *Personalizar → Ajustes del tema → ECOMS · Plantilla y marca → Plantilla global de la tienda*.
2. **Plantilla del producto:** en el admin del producto, *Plantilla del tema → `product.ecoms-flex` / `-direct` / `-brand`*.
   - El admin solo lista las plantillas del **tema publicado**.
   - Mientras el tema no esté publicado, usa *Personalizar → Productos → ecoms-…* con **Cambiar vista previa**.
3. **Variante de una plantilla:** en el editor, *Productos → ecoms-flex → "…" → Crear plantilla* (por ejemplo `ecoms-flex-landing2`). El sufijo `ecoms-flex*` mantiene el estilo Flex.

---

## 4. Qué se personaliza en cada tienda (sin código)

| Qué | Dónde |
|---|---|
| Logo, favicon | Ajustes del tema → Logo |
| Colores de marca (principal, oscuro, secundario, fondos, urgencia, estrellas…) | Ajustes del tema → ECOMS · Plantilla y marca |
| Tipografías por plantilla | ECOMS · Plantilla y marca → Tipografías (biblioteca de Shopify) |
| Radio de botones y tarjetas | ECOMS · Plantilla y marca → Forma |
| Anuncios, menú, prueba social del header | Editor → Header (secciones ECOMS · Anuncios / ECOMS · Header) |
| Footer: textos, menús, newsletter | Editor → Footer (ECOMS · Footer) |
| Redes sociales | Ajustes del tema → Redes sociales |
| Envío gratis (umbral en miles de CLP) y producto sugerido en el carrito | Ajustes del tema → ECOMS · Carrito |
| Producto, precio, precio de comparación, variantes, fotos, videos, inventario | Admin → Productos |
| Textos, íconos, beneficios, garantías, comparativa, FAQ, imágenes de cada sección | Editor → plantilla del producto |
| Copy por producto (ideal en tiendas con varios productos) | Metacampos del producto (ver abajo) |

**Metacampos y metaobjetos del producto (opcionales).** Créalos en *Configuración → Datos personalizados*. Si existen, reemplazan el texto de la plantilla:

| Definición | Tipo | Se muestra en |
|---|---|---|
| `ecoms.subtitle` | Texto multilínea / enriquecido | Subtítulo de la ficha |
| `ecoms.benefits` | Lista de texto de una línea | Lista de beneficios con check |
| `ecoms.faqs` | Lista de referencias a metaobjeto `ecoms_faq` (campos `question` texto, `answer` texto enriquecido) | Preguntas frecuentes (+ datos estructurados) |
| `reviews.rating`, `reviews.rating_count` | Estándar (los escribe la app de reseñas) | Estrellas y n.º de reseñas |

Además, cualquier ajuste de texto o imagen del editor se puede **conectar a un metacampo** con el ícono de "fuente dinámica".

---

## 5. Funcionalidades que requieren configuración adicional

| Funcionalidad | Qué hacer |
|---|---|
| **Packs con descuento** | *Descuentos → Descuento automático → Monto en productos* con *Cantidad mínima* (p. ej. 2 u. → 15 %, 3 u. → 25 %). Luego, en el bloque o sección Packs, pon los mismos % y marca **"Los descuentos ya existen en Shopify"**. |
| **Regalo en un pack** | Descuento automático *Compra X, lleva Y*. El regalo debe ser un producto. |
| **Kit / set (upsell)** | App gratuita **Shopify Bundles**. Selecciona el bundle en la sección Upsell. |
| **Escalas de precio complejas** | Shopify Functions (app). El theme no cambia. |
| **Reseñas con fotos y videos** | App de reseñas (Judge.me, Shopify Product Reviews, Loox…). Usa su bloque de app en la sección Reseñas y sus metacampos `reviews.*`. |
| **Cuenta regresiva** | Solo con una **fecha completa** de una promoción real (`2026-12-31 23:59`). Una hora sola se ignora a propósito, porque se reiniciaría cada día. |
| **Stock "quedan N unidades"** | Inventario controlado por Shopify. Se muestra solo bajo el máximo configurado. |
| **Envío gratis** | Tarifa gratuita real en *Configuración → Envíos*, con el mismo monto del ajuste ECOMS · Carrito. |
| **Cifras / tarjeta comunidad** | Solo cifras reales de la tienda. Sin bloques, no se muestran. |
| **Newsletter** | Se guarda como cliente suscrito en Shopify. Conéctalo a Shopify Email o Klaviyo. |
| **Meta Pixel, GA4, Google Ads** | Canales oficiales *Facebook e Instagram* y *Google y YouTube*, o *Configuración → Eventos de clientes*. No se pegan píxeles en el theme. Eventos extra del theme: `ecoms_pack_selected`, `ecoms_buy_now`, `ecoms_upsell_added`. |
| **Dropi** | App de Dropi en la tienda (pedidos y fulfillment). Independiente del theme. |

---

## 6. Conectar el subdominio (Cloudflare)

1. En Shopify: *Configuración → Dominios → Conectar dominio existente* → `productoN.ecoms.cl`.
2. En Cloudflare (zona `ecoms.cl`), crea un registro **CNAME**: nombre `productoN`, destino `shops.myshopify.com`.
   - Déjalo en **"DNS only"** (nube gris) hasta que Shopify emita el certificado SSL. Usa el destino exacto que indique el asistente de Shopify.
3. Vuelve a Shopify y verifica la conexión. Márcalo como dominio principal cuando esté listo.
4. Cada subdominio apunta a **su propia** tienda. No se comparten tiendas entre subdominios.

---

## 7. Ramas y actualizaciones

| Rama | Uso |
|---|---|
| `main` | Código maestro estable. Plantillas con contenido **neutro**, sin datos de ninguna tienda. |
| `shopify-dev` | Desarrollo y pruebas. Se conecta a un tema **sin publicar** de la tienda de pruebas. |
| `tienda-{nombre}` | Una por tienda que use GitHub. Shopify escribe aquí la configuración de esa tienda. |

**Llevar una mejora general a una tienda:**
1. Mezcla la mejora en `main` mediante un Pull Request desde `shopify-dev`.
2. En la rama de la tienda: `git checkout tienda-{nombre} && git merge origin/main`.
3. Si hay conflicto en `config/settings_data.json`, `templates/*.json` o `sections/*-group.json`, **gana la versión de la tienda**. Ese es su contenido. Del lado de `main` solo se aportan secciones, bloques o ajustes nuevos.
4. `python3 scripts/validate-templates.py` (debe decir OK) → push → revisar *View logs* en Shopify ("0 failed").
5. Para traer los cambios que Shopify escribió en la rama de una tienda: `scripts/merge-shopify-sync.sh tienda-{nombre}` (el contenido de la tienda gana en los JSON del editor).

**Reglas para no romper tiendas existentes:**
- No cambies el `id` ni el tipo de un ajuste o bloque existente. Agrega nuevos.
- Nombres de secciones, bloques y grupos de ajustes: máximo **25 caracteres**.
- Ajustes de tipo rango: máximo **< 10.000** y como mucho 101 pasos.
- `theme_author`: máximo 25 caracteres.
- El script `scripts/validate-templates.py` revisa todas estas reglas.

---

## 8. Pruebas antes de lanzar

1. **Sincronización:** *View logs* → "0 failed". En el editor no debe aparecer el aviso rojo de "color schemes".
2. **Móvil (360–430 px) y escritorio:** galería, variantes, cantidad, packs, botón fijo y carrito lateral.
3. **Compra real de prueba:**
   - Agregar 1, 2 y 3 unidades y verificar el descuento del pack en el carrito.
   - Probar "Comprar ahora" (debe ir al checkout).
   - Completar un pedido con el gateway en modo prueba, o un pedido real reembolsado.
4. **Datos reales:**
   - Precio de comparación mayor que el precio (si no, no se muestra ahorro).
   - Reseñas desde la app.
   - Cifras verificables.
   - FAQ y comparativa revisadas.
   - Fecha real de la promoción.
5. **Operación:** envío gratis igual al de *Configuración → Envíos*, Dropi conectado, pagos activos, políticas publicadas.
6. **Tracking:** eventos de Meta y Google en sus herramientas de prueba (Test Events, Tag Assistant).
7. **Velocidad:** Lighthouse móvil sobre la página de producto. Fotos optimizadas (máx. ~1600 px).
8. Recién entonces: **publicar el tema** y conectar el dominio.

---

## 9. Secciones reutilizables para landings de producto

| Sección | Para qué | Datos reales necesarios |
|---|---|---|
| `ECOMS · Cómo funciona` (estilo íconos o fotos) | 3–4 pasos de uso | — |
| `ECOMS · Especificaciones` | Tabla material, medidas, capacidad, peso, colores, contenido | Cada valor; las filas vacías no se publican. Se pueden conectar a metacampos |
| `ECOMS · Ideal para` | Usos o públicos (íconos o fotos) | — |
| `ECOMS · Imagen y texto` | Filas alternadas foto + lista + CTA | Fotos del producto (n.º configurable) |
| `ECOMS · Tabla comparativa` | Producto vs alternativa | Solo afirmaciones comprobables |
| `ECOMS · Reseñas` (muro de fotos) | Prueba social | Reseñas reales. Las marcadas «Reseña de ejemplo» solo se ven en el editor |
| `ECOMS · Barra confianza` (banda diagonal) | Compra sin riesgo | Condiciones reales de la tienda |

Bloques de la ficha (`ECOMS · Producto`): Packs (diseño «Ofertas»: total, c/u, ahorro y etiquetas), Stock real, Cuenta regresiva (estilo «Sobrio»), Garantías (estilo «Línea» como apoyo bajo el CTA), Medios de pago, Fechas de entrega, Testimonio destacado e Íconos bajo la galería.

---

## 10. Packs predeterminados, envío gratis y fichas por metacampos (v1.4)

### Pack seleccionado al cargar
Bloque **Packs** → **Pack seleccionado al cargar** (Pack 1/2/3). El formulario, el botón principal, el botón fijo y el resumen se generan en el servidor con ese pack. La cantidad real del formulario es la del pack: el carrito y Dropi reciben **N unidades de la misma variante**, sin variantes "pack" ni SKUs nuevos.
- **Nombre de las unidades (plural):** ej. «colgadores» → «10 colgadores · $3.330 c/u».
- **Mostrar «Qué incluye tu pack»:** un resumen bajo los packs con cantidad, ahorro y envío gratis, sincronizado con la selección.
- **Qué incluye (opcional)** por pack: una línea corta y verificable.
- Los precios salen siempre del precio de la variante en Shopify. El % del pack solo se muestra con «Los descuentos ya existen en Shopify» marcado. Cada % debe coincidir con un **descuento automático** de cantidad mínima.

### Envío gratis (desactivado por defecto)
*Configuración del tema → ECOMS · Carrito*:
1. Crea antes la tarifa real en *Configuración → Envío y entrega → perfil General → zona Chile*: tarifa $0 con la condición «Según el precio del pedido», mínimo igual al umbral. Confirma con Dropi el costo real del despacho.
2. Define **Envío gratis desde (miles de CLP)** y marca **El envío gratis ya existe en Shopify**.
3. Recién entonces aparecen:
   - el anuncio (bloque «Envío gratis» del header: `[amount]` = umbral),
   - la etiqueta en los packs que lo alcanzan,
   - la barra de progreso del carrito, que usa el total con descuentos y se actualiza al cambiar cantidades.

### Especificaciones por metacampo
Cada fila de `ECOMS · Especificaciones` tiene el campo **Metafield del producto**. Si el producto tiene ese metacampo, su valor reemplaza el texto fijo. Si no tiene valor, la fila no se publica.

| Fila | Metacampo sugerido (texto de una línea) |
|---|---|
| Material | `ecoms.material` |
| Medidas | `ecoms.dimensions` |
| Capacidad | `ecoms.capacity` |
| Peso soportado | `ecoms.max_weight` |
| Sistema de uso | `ecoms.usage` |
| Colores disponibles | `ecoms.colors` |
| Contenido del paquete | `ecoms.package_contents` |

Créalos en *Configuración → Datos personalizados → Productos*.

### Otros ajustes
- **FAQ:** cada pregunta tiene **Respuesta sin confirmar (borrador)**. Los borradores solo se ven en el editor y no entran en los datos estructurados.
- **Galería:**
  - **Formato de las fotos:** 1:1, 4:5 o 4:3.
  - **Ajuste:** con «Completa» la foto vertical no se recorta.
  - **Mostrar videos primero** y **Reproducir videos automáticamente**: sube el video demostrativo en *Productos → Multimedia*.
- **Nombre visible de la tienda** (*ECOMS · Plantilla y marca*): reemplaza el nombre interno de Shopify en el pie, el título de la pestaña y `og:site_name`.

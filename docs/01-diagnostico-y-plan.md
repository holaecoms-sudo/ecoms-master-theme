# ECOMS MASTER · Diagnóstico, arquitectura y plan

Fecha: 2026-10-08 · Rama: `claude/gifted-maxwell-sxrubg`

Fuentes analizadas:

- **Mockup** `docs/design/ecoms-master-mockup.html` (referencia principal de diseño). Incluye 3 plantillas × 3 marcas de ejemplo y 57 imágenes en base64, ya extraídas a `docs/design/mockup-images/`.
- **ZIP** `ECOMS_MASTER_v1_1_FLEX_BRAND_DIRECT.zip` (punto de partida técnico). Se importó sin cambios en el commit `95ebe7f`.
- **Repositorio**: estaba vacío, sin ramas ni commits.

---

## 1. Diagnóstico de lo que ya estaba desarrollado (ZIP v1.1)

| Área | Estado en v1.1 |
|---|---|
| Base | Dawn 16.0.0 completo y sin errores de Liquid (theme-check limpio, salvo los avisos propios de Dawn). |
| Plantillas | `product.ecoms-flex`, `product.ecoms-brand` y `product.ecoms-direct`. Las tres usan casi las mismas secciones en distinto orden. |
| Bloques ECOMS en `main-product` | Etiqueta, 3 beneficios, packs, 3 textos de confianza y campaña con fecha. |
| Secciones ECOMS (10) | Confianza, beneficios, historia, comparación, reseñas, UGC, FAQ, upsell, pasos, antes/después. Son versiones mínimas de 6 a 18 líneas. |
| CSS/JS | `ecoms-master.css` (144 líneas) y `ecoms-master.js` (63 líneas), cargados solo en las plantillas `product.ecoms-*`. |
| Colores | 6 ajustes atados a cada plantilla (Flex/Brand/Direct · botones/oscuro), no a la marca. |
| Carrito | Tipo «notificación» por defecto (no lateral). |

Lo que estaba bien resuelto y se conservó: el uso de Dawn sin romper su formulario, variantes ni checkout; las plantillas JSON separadas; y la idea de no inventar datos (avisos «solo con fecha real» y «reseñas autorizadas»).

## 2. Diferencias entre el mockup y las plantillas Shopify v1.1

**Concepto.** En el mockup, la **plantilla** (estructura y tipografía) y la **marca** (colores y contenido) son independientes: Flex funciona con Hidra, Aurea o Brillo. En v1.1 los colores estaban atados a la plantilla, así que no se podía tener «Flex con la paleta de la tienda X».

**ECOMS FLEX (mockup de la botella) frente a v1.1:**

| Mockup | v1.1 | Ahora (v1.2) |
|---|---|---|
| Íconos de características bajo la galería | No existía | Bloque `ECOMS · Íconos bajo la galería` |
| Calificación con estrellas y n.º de reseñas | Bloque `rating` de Dawn («4.8 / 5») | Bloque `ECOMS · Calificación` desde metacampos reales |
| Caja de urgencia con cuenta regresiva d/h/m/s | Texto «0d 00h 00m», sin cajas | Cajas d/h/m/s con fecha real, se oculta al vencer |
| Botón «Agregar al carrito - $total» + «Comprar ahora» | Solo el botón de Dawn | Total en vivo según pack + «Comprar ahora» real (agrega y va al checkout) |
| Grilla de 4 garantías con íconos | 3 textos con «✓» | Bloque `ECOMS · Garantías (4)` con íconos SVG |
| Banda de beneficios con íconos | 3 textos | Sección `ECOMS · Barra confianza` |
| Packs en tarjetas con imagen, etiqueta y % de ahorro | Radios con precio = unitario × cantidad (sin descuento real) | Tarjetas con imagen, etiqueta y ahorro ligados a descuentos automáticos |
| Íconos de beneficios (4) | Emojis | Íconos SVG del set del mockup |
| Banda lifestyle oscura con 4 fotos | No existía | Sección `ECOMS · Lifestyle` |
| Comparativa + reseñas lado a lado, UGC + FAQ, cross-sell + upsell | Todo a ancho completo, apilado | Ajuste «Mitad izquierda / derecha» por sección |
| Cross-sell con botón «Agregar» y upsell (set) con precio tachado | Enlaces «Ver producto» | Agregar real con la API del carrito + precio de comparación real |
| Barra sticky (mobile) y tarjeta flotante (escritorio) que agrega al carrito | Solo hacía scroll al botón | Envía el formulario nativo de Dawn |
| Carrito lateral con barra de envío gratis, sugerido y ahorro | Sin carrito lateral por defecto | Barra de envío, producto sugerido y ahorro real |
| Tipografía Plus Jakarta Sans | Assistant (Dawn) | Plus Jakarta Sans desde la biblioteca de Shopify (editable) |
| Barra de anuncios y footer oscuros | Esquema Dawn | Estilo ECOMS opcional (`Aplicar estilo ECOMS…`) |

**ECOMS BRAND (mockup de belleza)** requiere, además: Playfair Display + Jost, galería 4:5 con fila de miniaturas, packs en lista con regalo en el pack 3, banda de garantías, historia a dos columnas, tecnología (imagen + lista), banner de 3 columnas, rutina en 4 pasos, UGC con citas y video, reseñas con mini-fotos, cross-sell de 4 y set destacado. En v1.1 solo cambiaba la fuente a Georgia y el color.

**ECOMS DIRECT (mockup del cepillo)** requiere: Archivo, caja de compra separada en una 3.ª columna, temporizador en la barra de anuncios, barra de envío gratis y de stock en la caja de compra, packs con precio unitario y -%, problema/solución con antes/después + cita, cifras, bloque «únete a miles» y rail de cross-sell. En v1.1 era casi idéntica a Flex.

## 3. Funcionalidades incompletas o simuladas en v1.1

1. **Packs simulados.** Solo cambiaban la cantidad y mostraban unitario × N, sin ningún descuento en Shopify.
2. **Sticky ATC.** Solo hacía scroll al botón principal; no agregaba al carrito.
3. **Upsell.** Eran enlaces, sin agregar al carrito. No había cross-sell en el carrito.
4. **Envío gratis.** No existía la barra.
5. **Reseñas.** Eran bloques manuales sin promedio; no se podía usar el bloque de una app de reseñas.
6. **UGC.** Solo fotos; no aceptaba video.
7. **FAQ.** Sin datos estructurados FAQPage para SEO.
8. **Cuenta regresiva.** Funcionaba, pero se mostraba en el formato «0d 00h 00m» y no validaba la fecha en el servidor.
9. **Tracking.** No había nada específico (ni eventos propios).
10. **Carrito.** «Notificación» por defecto, en lugar del carrito lateral del mockup.
11. **CSS.** Afectaba las tarjetas de Dawn de forma global (`.ecoms-section:nth-child(even)`) y había tamaños fijos en rem que no seguían el mockup.

## 4. Arquitectura técnica definitiva

```
Dawn 16 (intacto salvo 4 enganches mínimos)
├── layout/theme.liquid      → render 'ecoms-head' + clases de body ('ecoms-body-class')
├── sections/main-product    → bloques ecoms_* (render 'ecoms-product-block'), íconos bajo galería, sticky
└── snippets/cart-drawer     → render 'ecoms-cart-extras' (envío gratis, sugerido, ahorro)

Capa ECOMS (todo con prefijo ecoms-/ec-)
├── config/settings_schema   → «ECOMS · Plantilla y marca», «ECOMS · Carrito»
├── snippets/
│   ├── ecoms-skin / -head / -body-class   → resuelve plantilla, tokens --ec-*, fuentes, CSS/JS
│   ├── ecoms-icon                         → set SVG del mockup (30+ íconos, select en el editor)
│   ├── ecoms-product-block                → bloques del producto principal
│   ├── ecoms-packs / -countdown / -rating / -sticky-atc / -media-features
│   ├── ecoms-add-button                   → agregar al carrito (AJAX) para productos secundarios
│   ├── ecoms-cart-extras                  → extras del carrito lateral
│   └── ecoms-section-style                → ancho (completo / mitad) y márgenes de cada sección
├── sections/ecoms-*                       → 13 secciones reutilizables por las 3 plantillas
├── assets/
│   ├── ecoms-base.css   → componentes compartidos (todas las plantillas)
│   ├── ecoms-flex.css   → piel Flex sobre Dawn (pronto: ecoms-brand.css, ecoms-direct.css)
│   └── ecoms.js         → packs, totales, cuenta regresiva, sticky, comprar ahora, upsell
└── templates/product.ecoms-{flex,brand,direct}.json
```

**Principios**

- **Plantilla ≠ marca.** La plantilla (Flex/Brand/Direct) define estructura, tipografía y forma. La marca (colores, logo, textos e imágenes) vive en los ajustes del theme y en el contenido de cada tienda.
  - La plantilla global de la tienda (header, footer y páginas) se elige en *Ajustes del tema → ECOMS · Plantilla y marca*.
  - Cada producto puede usar otra plantilla eligiendo `product.ecoms-flex|brand|direct` en el admin.
  - Se pueden duplicar plantillas (`product.ecoms-flex-landing2`): el sufijo sigue resolviendo la piel correcta.
- **Shopify es la fuente de verdad.** Precio, variante, stock, descuentos, reseñas (metacampos) y carrito vienen de Shopify. El theme nunca calcula un precio que el checkout no vaya a cobrar: el porcentaje de los packs solo se muestra cuando el comerciante confirma que existe el descuento automático correspondiente.
- **Dawn intacto.** El formulario de producto, el selector de variantes, el carrito lateral y el checkout son los de Dawn. ECOMS les pone su estilo y los enlaza (cantidad, `form=` y la Section Rendering API), así que actualizar Dawn sigue siendo viable.
- **Componentes compartidos.** Los mismos snippets y secciones sirven a las tres plantillas mediante ajustes como `layout: cards | list | rows` y `width: full | left | right`.
- **Sin dependencias externas.** No hay librerías ni fuentes de Google externas (se usa la biblioteca de fuentes de Shopify) y el JS es un solo archivo de ~10 KB sin minificar.

**Metacampos y metaobjetos (uso previsto)**

| Dato | Fuente |
|---|---|
| Calificación y n.º de reseñas | `reviews.rating`, `reviews.rating_count` (estándar, los escribe la app de reseñas) |
| Fecha de fin de promoción | Conectar el ajuste «Fecha de término» a un metacampo `date_time` del producto (fuente dinámica) |
| Subtítulo, beneficios, FAQ por producto | Fuentes dinámicas en los ajustes de texto. Fase 3: metaobjeto `ecoms_faq` reutilizable |
| Configuración de packs por producto | Fase 3: metacampo `ecoms.pack_tiers` (JSON) para tiendas multiproducto |

## 5. Descuentos, bundles y apps: qué es nativo y qué no

| Funcionalidad | Cómo se resuelve |
|---|---|
| Packs 1/2/3 con descuento | **Nativo.** Descuentos automáticos «Monto de descuento en productos» con requisito «Cantidad mínima de artículos» (p. ej. 2 → 15 %, 3 → 25 %). Shopify aplica el mejor disponible, igual que la regla que muestra el theme. Luego se marca «Los descuentos ya existen en Shopify» en el bloque. |
| Regalo en el pack 3 (Brand) | **Nativo.** Descuento automático «Compra X y llévate Y» (el regalo debe ser un producto). |
| Kit o set (upsell) | **Nativo (app gratuita de Shopify).** Shopify Bundles crea un producto bundle con inventario de sus componentes; el theme lo vende como cualquier producto. |
| Precios por volumen más complejos (escalas por línea, mezclas) | Requieren **Shopify Functions** (app propia o de terceros). El theme no cambia. |
| Reseñas con fotos y videos verificadas | **App de reseñas** (Judge.me, Shopify Product Reviews, Loox, etc.). Se integra con los metacampos y con el bloque `@app` de la sección Reseñas. |
| Envío gratis | **Nativo.** Tarifa gratuita condicionada al precio en *Configuración → Envíos*. El umbral del theme debe ser el mismo. |
| Meta Pixel, GA4, Google Ads | **Canales oficiales** (Facebook e Instagram; Google y YouTube) o *Configuración → Eventos de clientes*. Los eventos estándar (`product_viewed`, `product_added_to_cart`, `checkout_*`) los emite Shopify. El theme publica además `ecoms_pack_selected`, `ecoms_buy_now` y `ecoms_upsell_added` con `Shopify.analytics.publish`, que un píxel personalizado puede reenviar. |

## 6. Plan de implementación priorizado

| # | Fase | Contenido | Estado |
|---|---|---|---|
| 1 | Base | Repo, línea base, theme-check, arquitectura, tokens de marca, ajustes globales | ✅ |
| 2 | **ECOMS FLEX v1** | Hero completo, packs reales, cuenta regresiva, sticky, comprar ahora, 10 secciones, carrito lateral, template | ✅ esta entrega |
| 3 | QA en tienda | Subir a un theme sin publicar de `va2nzt-wh`, crear producto de prueba con variantes y descuentos automáticos, probar compra completa (mobile 360–430 y escritorio), Lighthouse | ⏭ siguiente |
| 4 | ECOMS DIRECT | `ecoms-direct.css`, caja de compra en 3.ª columna, temporizador en la barra de anuncios, barra de stock real (inventario), packs en filas, problema/solución, cifras (solo reales), rail de cross-sell | pendiente |
| 5 | ECOMS BRAND | `ecoms-brand.css`, Playfair + Jost, galería 4:5, packs en lista + regalo (Compra X lleva Y), historia, tecnología, banner, rutina, UGC con citas y video | pendiente |
| 6 | Comercial avanzado | Metacampos de packs por producto, metaobjeto de FAQ, recomendaciones nativas (`complementary`) en el carrito, envío gratis multi-moneda | pendiente |
| 7 | Rendimiento y SEO | Precarga solo de las fuentes activas, imágenes LCP con `fetchpriority`, revisión de CLS y de los datos estructurados | pendiente |
| 8 | Documentación y réplica | Guía de instalación y duplicado (ver `02-instalar-personalizar-duplicar.md`) y checklist de lanzamiento por tienda | ✅ v1 |

## 7. Limitaciones conocidas de esta entrega

- **Brand y Direct** se migraron a los nuevos bloques (siguen funcionando), pero aún no tienen su piel visual. Por ahora se ven con los estilos base.
- **Vista previa.** Se validó con theme-check (0 errores nuevos), un validador propio de templates contra los esquemas y un render local de las secciones ECOMS con datos de prueba (capturas en 390 px y 1280 px). **Todavía no se probó en una tienda Shopify real**: es la fase 3.
- **Moneda del envío gratis.** El umbral asume CLP (moneda de la tienda). Con otras monedas en Markets habría que convertirlo.
- **Packs.** Si se usan a la vez la sección «Packs» y el bloque «Packs» en la misma página, el total del botón toma la primera configuración. Lo recomendado es usar uno solo.

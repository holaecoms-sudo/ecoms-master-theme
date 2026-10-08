# ECOMS MASTER · Instalar, personalizar y duplicar

## A. Instalar en una tienda

**Opción 1: GitHub (recomendada para la tienda maestra)**

1. Shopify Admin → *Tienda online → Temas → Agregar tema → Conectar desde GitHub*.
2. Elige `holaecoms-sudo/ecoms-master-theme` y la rama que quieras revisar. Las carpetas `docs/` y `scripts/` y los archivos `README.md` y `.shopifyignore` no forman parte del theme.
3. El tema queda **sin publicar**. Revísalo con «Vista previa» antes de publicarlo. Nunca conectes una rama de trabajo al tema publicado.

**Opción 2: ZIP (para tiendas nuevas `productoN.ecoms.cl`)**

```bash
./scripts/package-theme.sh            # genera dist/ecoms-master-<versión>.zip
```

Luego, en la tienda nueva: *Temas → Agregar tema → Subir archivo zip*.

**Opción 3: Shopify CLI**

```bash
shopify theme push --store va2nzt-wh.myshopify.com --unpublished
```

## B. Configuración mínima por tienda (sin código)

1. **Ajustes del tema → ECOMS · Plantilla y marca**
   - Plantilla global: Flex (por defecto), Brand o Direct.
   - Colores de marca: principal, oscuro, secundario, fondos y urgencia.
   - Tipografía Flex (Plus Jakarta Sans por defecto).
2. **Ajustes del tema → Logo, Redes sociales y Carrito.** El tipo de carrito debe ser **Cajón**.
3. **Ajustes del tema → ECOMS · Carrito**
   - Envío gratis desde (en miles de CLP: 40 = $40.000). Debe coincidir con la tarifa real de *Configuración → Envíos*.
   - Colección de productos sugeridos en el carrito (handle de la colección).
4. **Producto**: en el admin, *Plantilla del tema → `product.ecoms-flex`*.
5. **Editor del tema → plantilla `ecoms-flex`**: completa textos, íconos, fotos lifestyle, FAQ, comparativa, cross-sell y upsell. Todo bloque o sección se puede ocultar, reordenar o duplicar.

## C. Packs con descuento real

1. *Descuentos → Crear descuento → Monto de descuento en productos → Automático*.
   - Ejemplo: «Pack 2» = 15 % en el producto, requisito *Cantidad mínima de artículos: 2*.
   - Crea otro igual para «Pack 3» = 25 %, mínimo 3.
   - Revisa las reglas de combinación si hay otros descuentos activos.
2. En el editor, en la sección *ECOMS · Packs* (o el bloque *ECOMS · Packs*), configura las mismas cantidades y porcentajes. Luego marca **«Los descuentos ya existen en Shopify»**.
3. Prueba: elige el pack 2 → «Agregar al carrito». En el carrito lateral debe aparecer el descuento automático y «Ahorras $…».

Mientras la casilla esté desmarcada, los packs muestran el precio normal. Así nunca se promete un descuento que Shopify no aplica.

## D. Datos que nunca se inventan

| Elemento | Se muestra solo si… |
|---|---|
| Estrellas y n.º de reseñas | La app de reseñas completó `reviews.rating` y `reviews.rating_count` |
| Cuenta regresiva | Hay una fecha de término futura (también puede venir de un metacampo de fecha) |
| Precio tachado y «Ahorras X %» | La variante tiene «Precio de comparación» real en Shopify |
| % de los packs | Existen los descuentos automáticos y está marcada la confirmación |
| Ahorro en el carrito | Shopify aplicó un descuento (`cart.total_discount`) |
| Cifras, testimonios y UGC | Los ingresa el comerciante. El editor recuerda que deben ser reales y autorizados |

## E. Tracking (Meta Pixel, GA4, Google Ads)

1. Instala los canales **Facebook e Instagram** y **Google y YouTube**. Ellos envían los eventos estándar de Shopify (vista de producto, agregar al carrito, checkout y compra), también los del sticky, «Comprar ahora» y el upsell, porque todos usan la API nativa del carrito.
2. Opcional: en *Configuración → Eventos de clientes* crea un píxel personalizado que escuche `ecoms_pack_selected`, `ecoms_buy_now` y `ecoms_upsell_added` con `analytics.subscribe(...)`.
3. No pegues píxeles dentro del theme: duplicarían los eventos.

## F. Duplicar el sistema en una tienda nueva (checklist)

1. Crea la tienda y su dominio `productoN.ecoms.cl`.
2. Sube el ZIP (sección A) o conecta GitHub.
3. Crea el producto con variantes, fotos y video, precio y precio de comparación reales.
4. Instala la app de reseñas y, si quieres kits, Shopify Bundles.
5. Crea los descuentos automáticos de los packs (sección C).
6. Configura envíos y el umbral de envío gratis.
7. Completa *ECOMS · Plantilla y marca* (colores y logo) y *ECOMS · Carrito*.
8. Asigna `product.ecoms-flex|brand|direct` al producto y completa el contenido en el editor.
9. Conecta los canales de Meta y Google.
10. Prueba la compra completa en móvil (360–430 px) y escritorio. Recién entonces publica.

## G. Flujo de desarrollo

- Ramas de trabajo → Pull Request → revisión → `main`.
- Cada PR debe pasar `theme-check` (0 errores) y el validador de templates (`scripts/validate-templates.py`).
- Prueba cada PR en un tema **sin publicar** conectado a la rama. Nunca se edita el tema publicado.

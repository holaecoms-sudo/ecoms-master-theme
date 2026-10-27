# Ecoms Beauty (beauty.ecoms.cl)

Rama `ecoms-beauty`: tema de la tienda Shopify de belleza. Comparte el código base con ecoms.cl
(rama `claude/gifted-maxwell-sxrubg`); aquí solo cambia la configuración de la tienda.

## Qué tiene esta rama
- Plantilla de producto por defecto (`templates/product.json`) = plantilla «belleza»: hero estilo Gold,
  compra solo con pago al recibir, videos con play, reseñas en burbuja y contenido desde metacampos.
- Portada de belleza (sin las secciones de limpieza ni «Próximamente»).
- Colores de la tienda: azul marino + dorado.
- Anuncio superior genérico: «Envío gratis desde [amount]».

## Conectar la tienda
1. Tienda online → Temas → Agregar tema → Conectar desde GitHub → `holaecoms-sudo/ecoms-master-theme`, rama `ecoms-beauty`.
2. Publicar el tema.
3. Configuración → Dominios → Conectar dominio existente → `beauty.ecoms.cl` (CNAME `beauty` → `shops.myshopify.com`, en Cloudflare «Solo DNS»).
4. Instalar Releasit, Dropi y la pasarela de pago. Subir logo y logos de pago en la configuración del tema.

## Llevar mejoras del tema base
Las mejoras de secciones, snippets y assets se traen desde la rama de ecoms.cl con un merge; las plantillas y
`config/settings_data.json` de esta rama son propias de la tienda beauty y no se sobrescriben.

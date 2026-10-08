# ECOMS MASTER · Shopify theme

Theme Shopify (Online Store 2.0, base **Dawn 16**) para lanzar tiendas de producto ganador en subdominios `productoN.ecoms.cl`. Tiene tres plantillas comerciales con un mismo motor de compra:

| Plantilla | Uso | Estado |
|---|---|---|
| **ECOMS Flex** | Predeterminada, modular, sirve para cualquier categoría | ✅ v1 funcional |
| **ECOMS Direct** | Performance: oferta, urgencia real y conversión directa | ✅ v1 |
| **ECOMS Brand** | Premium y editorial: storytelling y lifestyle | ✅ v1 |

- Mercado: Chile · Moneda: CLP · Idioma: español de Chile.
- Tienda maestra: `va2nzt-wh.myshopify.com`.

## Documentación

- **[ECOMS-DEPLOYMENT.md](ECOMS-DEPLOYMENT.md) — despliegue multitienda, ramas, pruebas**
- [Diagnóstico, arquitectura y plan](docs/01-diagnostico-y-plan.md)
- [Instalar, personalizar y duplicar](docs/02-instalar-personalizar-duplicar.md)
- Mockup de referencia: `docs/design/ecoms-master-mockup.html` (imágenes en `docs/design/mockup-images/`)

## Estructura

```
assets/     ecoms-base.css · ecoms-components.css · ecoms-skin-{flex,direct,brand}.css · ecoms.js
config/     ajustes «ECOMS · Plantilla y marca» y «ECOMS · Carrito»
sections/   ecoms-*.liquid (producto, header, anuncios, footer y 17 secciones reutilizables)
snippets/   ecoms-*.liquid (motor: plantilla, íconos, packs, cuenta regresiva, sticky, carrito)
templates/  product.ecoms-flex.json · product.ecoms-brand.json · product.ecoms-direct.json
scripts/    package-theme.sh (ZIP) · validate-templates.py
```

## Desarrollo

```bash
python3 scripts/validate-templates.py     # templates JSON contra los esquemas
npx @shopify/cli theme check              # lint Liquid/JSON
./scripts/package-theme.sh                # dist/ecoms-master-<versión>.zip
```

Flujo: rama → Pull Request → revisión → `main`. Cada PR se prueba en un tema **sin publicar**.

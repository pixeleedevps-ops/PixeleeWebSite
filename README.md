# Pixelee Website

Sitio web estático de Pixelee, construido con HTML, CSS modular y JavaScript ligero para animaciones, páginas de servicios, landing pages y recursos de marca.

## Estructura

- `index.html`: página principal.
- `servicios/`: páginas internas de servicios.
- `landing/`: landing pages de campañas.
- `beneficios/` y `nosotros/`: páginas institucionales.
- `assets/css/`: estilos base, layout, componentes y páginas específicas.
- `assets/js/`: animaciones e interacciones del sitio.
- `assets/images/`, `assets/videos/`, `assets/audio/`: recursos visuales y multimedia.
- `tools/`: utilidades de mantenimiento.

## Requisitos

- Node.js para ejecutar scripts de mantenimiento.
- Python 3 para levantar un servidor estático local con el script `serve`.

## Comandos

```bash
npm install
npm run serve
npm run check:links
npm run optimize:benefits-video
```

## Desarrollo local

Ejecuta `npm run serve` y abre `http://localhost:8000`.

Después de cambiar rutas, imágenes, scripts o enlaces internos, ejecuta `npm run check:links` para detectar referencias locales rotas antes de publicar.

## Despliegue

El proyecto está preparado para Vercel mediante `vercel.json`, con URLs limpias, trailing slash y redirects para rutas antiguas.

Para Hostinger, sube el contenido del proyecto a `public_html` y conserva el archivo `.htaccess`; ahí están los redirects equivalentes, protección básica de archivos internos y reglas de cache para assets.

## Mantenimiento recomendado

- No versionar `node_modules`, archivos `.DS_Store` ni archivos de entorno.
- Mantener los assets pesados optimizados antes de subirlos.
- Actualizar `sitemap.xml` cuando se agreguen, eliminen o renombren páginas públicas.
- Revisar redirects cuando cambie la estructura de URLs.

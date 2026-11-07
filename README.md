# ANTES DE OLVIDARTE

Juego narrativo 3D creado con Three.js, GSAP y Vite.

## Ejecutar localmente

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

## Compilar para publicar

```bash
npm ci
npm run build
npm run preview
```

La carpeta `dist/` se genera al compilar y contiene el sitio estático listo para hosting.

## Publicar en GitHub Pages

1. Sube el contenido de este proyecto a la rama `main` de un repositorio GitHub.
2. Abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **GitHub Actions**.
4. Haz push a `main`. El workflow `.github/workflows/deploy.yml` compila y publica `dist/` automáticamente.

## Rendimiento móvil

El juego detecta móviles y aplica automáticamente un perfil de calidad:
- móviles modestos: resolución 1x, sin sombras, sin Bloom y objetivo de 30 FPS;
- móviles más capaces: resolución limitada a 1.25x, sin postprocesado pesado;
- escritorio: conserva el perfil visual de mayor calidad.

Los controles táctiles aparecen en pantallas táctiles. En escritorio se mantienen WASD, E y Espacio.

Nota: la publicación web evita ejecutar un servidor local en el teléfono, pero el renderizado 3D sigue usando la GPU y batería del dispositivo. Si el teléfono se calienta mucho, cierra el juego y deja que se enfríe.

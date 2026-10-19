import { isTouch } from '../ui/format'

// Niveau de détail selon l'appareil : les téléphones et tablettes ont des processeurs graphiques
// plus modestes, et un écran plus petit où les détails fins se voient moins.
export const QUALITY = isTouch
  ? { maxDpr: 1.5, shadowMapSize: 1024, screenSamples: 2, extraLights: false }
  : { maxDpr: 2, shadowMapSize: 2048, screenSamples: 4, extraLights: true }

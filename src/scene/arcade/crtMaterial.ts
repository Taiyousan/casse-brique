import { ShaderMaterial, type Texture } from 'three'

// Bombé de l'écran cathodique. Plus la valeur est grande, plus l'écran est plat.
// La même formule sert au shader et au calcul de la position du pointeur dans le jeu.
const CURVATURE = { x: 5.5, y: 4.5 }

// Point de la texture affiché à la position (u, v) de l'écran
export function crtCurve(u: number, v: number): [number, number] {
  const x = u * 2 - 1
  const y = v * 2 - 1
  const ox = Math.abs(y) / CURVATURE.x
  const oy = Math.abs(x) / CURVATURE.y
  return [(x + x * ox * ox) * 0.5 + 0.5, (y + y * oy * oy) * 0.5 + 0.5]
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float time;
  uniform float lines;
  uniform float brightness;
  varying vec2 vUv;

  vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(${CURVATURE.x.toFixed(2)}, ${CURVATURE.y.toFixed(2)});
    uv = uv + uv * offset * offset;
    return uv * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = curve(vUv);
    // Hors de la zone bombée : coins noirs arrondis
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Légère aberration chromatique
    float ab = 0.0012;
    vec3 color = vec3(
      texture2D(map, uv + vec2(ab, 0.0)).r,
      texture2D(map, uv).g,
      texture2D(map, uv - vec2(ab, 0.0)).b
    );

    // Halo lumineux : moyenne de quelques échantillons autour du point
    vec3 glow = vec3(0.0);
    glow += texture2D(map, uv + vec2(0.006, 0.0)).rgb;
    glow += texture2D(map, uv - vec2(0.006, 0.0)).rgb;
    glow += texture2D(map, uv + vec2(0.0, 0.0045)).rgb;
    glow += texture2D(map, uv - vec2(0.0, 0.0045)).rgb;
    glow += texture2D(map, uv + vec2(0.004, 0.003)).rgb;
    glow += texture2D(map, uv - vec2(0.004, 0.003)).rgb;
    glow += texture2D(map, uv + vec2(0.004, -0.003)).rgb;
    glow += texture2D(map, uv - vec2(0.004, -0.003)).rgb;
    color += glow / 8.0 * 0.35;

    // Lignes de balayage, atténuées quand l'écran est petit à l'image (sinon effet de moiré)
    float scanStrength = clamp(1.0 - fwidth(uv.y) * lines * 1.2, 0.0, 1.0) * 0.25;
    color *= 1.0 - scanStrength * (0.5 + 0.5 * cos(uv.y * lines * 6.28318));

    // Vignettage vers les bords et léger scintillement
    vec2 v = uv * (1.0 - uv.yx);
    color *= pow(v.x * v.y * 15.0, 0.2);
    color *= 1.0 + 0.012 * sin(time * 50.0);

    gl_FragColor = vec4(color * brightness, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function createCrtMaterial(map: Texture) {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map },
      time: { value: 0 },
      lines: { value: 320 },
      brightness: { value: 1.15 },
    },
    vertexShader,
    fragmentShader,
  })
}

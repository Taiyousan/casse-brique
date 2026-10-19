import { ShaderMaterial, type Texture } from 'three'

// Vitre de la fenêtre sous la pluie : la vue sur la ville est déformée par des gouttes
// posées sur le verre, d'autres glissent en laissant une traînée, et des filets de pluie
// tombent dehors.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D sky;
  uniform float time;
  uniform float aspect; // largeur / hauteur de la vitre
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Gouttes immobiles : une par case d'une grille, qui apparaît puis s'évapore.
  // Renvoie le décalage de lecture de l'image (réfraction) ; mask vaut 1 dans la goutte.
  vec2 staticDrops(vec2 q, float size, out float mask) {
    vec2 p = q / size;
    vec2 cell = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash(cell);
    vec2 center = (vec2(hash(cell + 1.3), hash(cell + 7.1)) - 0.5) * 0.6;
    float life = fract(time * 0.04 + h);
    float radius = 0.2 * (0.4 + h) * smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.85, 1.0, life));
    vec2 d = f - center;
    mask = smoothstep(radius, radius * 0.5, length(d)) * step(0.35, h);
    return d * mask;
  }

  // Gouttes qui glissent, une par colonne, avec une légère oscillation et une traînée humide
  vec2 slidingDrops(vec2 q, out float mask) {
    float width = 0.11;
    float column = floor(q.x / width);
    float h = hash(vec2(column, 3.0));
    float x = fract(q.x / width) - 0.5 + sin(q.y * 18.0 + h * 6.28) * 0.12;
    float head = 1.15 - fract(time * (0.06 + h * 0.08) + h) * 1.3;
    float dy = (q.y - head) / width;
    float drop = smoothstep(0.24, 0.12, length(vec2(x, dy * 0.75)));
    float trail = step(0.0, dy) * smoothstep(3.0, 0.0, dy) * smoothstep(0.07, 0.02, abs(x)) * 0.6;
    mask = max(drop, trail) * step(0.45, h);
    return vec2(x, dy * 0.3) * mask;
  }

  void main() {
    vec2 q = vec2(vUv.x * aspect, vUv.y);

    float staticMask;
    float slideMask;
    vec2 offset = staticDrops(q, 0.045, staticMask) + slidingDrops(q, slideMask);
    float wet = max(staticMask, slideMask);

    // Dans une goutte, l'image est agrandie et décalée, comme à travers une petite lentille
    vec3 color = texture2D(sky, vUv - offset * 0.06).rgb;

    // Filets de pluie dehors, légèrement inclinés
    float lane = floor((q.x + q.y * 0.08) * 70.0);
    float s = hash(vec2(lane, 9.0));
    float streak = step(0.93, fract(q.y * 2.2 + time * (1.8 + s * 1.5) + s * 17.0)) * step(0.55, s);
    color += streak * 0.12;

    // Reflet clair sur le bord haut des gouttes, et vitre un peu embuée hors des gouttes
    color += wet * (0.07 + smoothstep(0.0, -0.15, offset.y) * 0.25);
    color = mix(color * 0.85 + 0.03, color, wet);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

export function createRainyWindowMaterial(sky: Texture, aspect: number) {
  return new ShaderMaterial({
    uniforms: {
      sky: { value: sky },
      time: { value: 0 },
      aspect: { value: aspect },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
  })
}

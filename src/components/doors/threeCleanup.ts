import * as THREE from 'three';

/**
 * Traverses a Three.js scene and disposes all geometries, materials,
 * material texture maps, CanvasTextures, and environment textures.
 */
export function disposeThreeScene(scene: THREE.Scene): void {
  const disposedGeos = new Set<THREE.BufferGeometry>();
  const disposedMats = new Set<THREE.Material>();
  const disposedTexs = new Set<THREE.Texture>();

  const disposeTexture = (tex: unknown) => {
    if (tex && tex instanceof THREE.Texture && !disposedTexs.has(tex)) {
      disposedTexs.add(tex);
      tex.dispose();
    }
  };

  const disposeMaterial = (mat: THREE.Material) => {
    if (disposedMats.has(mat)) return;
    disposedMats.add(mat);

    const record = mat as unknown as Record<string, unknown>;
    const mapKeys = [
      'map',
      'alphaMap',
      'aoMap',
      'bumpMap',
      'displacementMap',
      'emissiveMap',
      'envMap',
      'lightMap',
      'metalnessMap',
      'normalMap',
      'roughnessMap',
      'specularMap',
      'clearcoatMap',
      'clearcoatNormalMap',
      'clearcoatRoughnessMap',
      'sheenColorMap',
      'sheenRoughnessMap',
      'transmissionMap',
      'thicknessMap',
    ];
    for (const key of mapKeys) {
      disposeTexture(record[key]);
    }
    mat.dispose();
  };

  scene.traverse((obj) => {
    const anyObj = obj as unknown as {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (anyObj.geometry && !disposedGeos.has(anyObj.geometry)) {
      disposedGeos.add(anyObj.geometry);
      anyObj.geometry.dispose();
    }
    if (anyObj.material) {
      if (Array.isArray(anyObj.material)) {
        anyObj.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(anyObj.material);
      }
    }
  });

  if (scene.environment) {
    disposeTexture(scene.environment);
    scene.environment = null;
  }
  if (scene.background && scene.background instanceof THREE.Texture) {
    disposeTexture(scene.background);
    scene.background = null;
  }
}

/**
 * Attaches WebGL context loss / restore handlers to a canvas element.
 */
export function bindWebGLContextHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void
): () => void {
  const handleLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  const handleRestored = () => {
    onRestored();
  };
  canvas.addEventListener('webglcontextlost', handleLost, false);
  canvas.addEventListener('webglcontextrestored', handleRestored, false);
  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost, false);
    canvas.removeEventListener('webglcontextrestored', handleRestored, false);
  };
}

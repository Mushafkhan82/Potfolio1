/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export class DoorTextureManager {
  private loader: THREE.TextureLoader;
  public woodAlbedo: THREE.Texture;
  public woodBump: THREE.Texture;
  public wallTexture: THREE.Texture;
  public indoorFloorTexture: THREE.Texture;
  public indoorWallTexture: THREE.Texture;
  public metalScratch: THREE.Texture;
  public ironBump: THREE.Texture;
  public plaqueTextures: Map<string, THREE.CanvasTexture> = new Map();

  public init(_maxAnisotropy = 4) {
    // Already initialized synchronously
  }

  constructor() {
    this.loader = new THREE.TextureLoader();

    // 1. Procedural fallbacks as base textures (instant synchronous availability)
    this.woodAlbedo = this.createProceduralWood(1024);
    this.woodBump = this.createProceduralBump(512);
    this.wallTexture = this.createProceduralPlaster(512);
    this.indoorFloorTexture = this.createProceduralTile(512);
    this.indoorWallTexture = this.createProceduralWallpaper(512);
    this.metalScratch = this.createProceduralScratch(512);
    this.ironBump = this.createProceduralBump(512);

    // 2. Pre-generate door number plaques (01 to 08)
    for (let i = 1; i <= 8; i++) {
      const numStr = String(i).padStart(2, '0');
      this.plaqueTextures.set(numStr, this.createPlaqueTexture(numStr));
    }

    // 3. Load actual compressed WebP texture files from /assets/aistudio/ with graceful fallback
    this.loadAssetTexture('/assets/aistudio/BMAG_7272bcb9.webp', true, (tex) => {
      tex.repeat.set(1, 2);
      this.woodAlbedo = tex;
    });

    this.loadAssetTexture('/assets/aistudio/BMAG-m_5aa79426.webp', false, (tex) => {
      tex.repeat.set(1, 2);
      this.woodBump = tex;
    });

    this.loadAssetTexture('/assets/aistudio/wall_032_f2e1ccb3.webp', false, (tex) => {
      tex.repeat.set(4, 3);
      this.wallTexture = tex;
      this.indoorWallTexture = tex;
    });

    this.loadAssetTexture('/assets/aistudio/tile_gloss_4a00ffa0.webp', false, (tex) => {
      tex.repeat.set(2, 2);
      this.indoorFloorTexture = tex;
    });

    this.loadAssetTexture('/assets/aistudio/Metall-scratch_381b5444.webp', false, (tex) => {
      tex.repeat.set(1, 1);
      this.metalScratch = tex;
    });

    this.loadAssetTexture('/assets/aistudio/iron_bump_9ed36c09.webp', false, (tex) => {
      tex.repeat.set(2, 2);
      this.ironBump = tex;
    });
  }

  private loadAssetTexture(url: string, isColor: boolean, onLoaded: (tex: THREE.Texture) => void) {
    try {
      this.loader.load(
        url,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          if (isColor) {
            tex.colorSpace = THREE.SRGBColorSpace;
          }
          tex.anisotropy = 4;
          tex.needsUpdate = true;
          onLoaded(tex);
        },
        undefined,
        () => {
          // Silent fallback to procedural
        }
      );
    } catch {
      // Safe fallback
    }
  }

  public getPlaqueTexture(index: string): THREE.CanvasTexture {
    if (!this.plaqueTextures.has(index)) {
      this.plaqueTextures.set(index, this.createPlaqueTexture(index));
    }
    return this.plaqueTextures.get(index)!;
  }

  // Create crisp engraved metal number plaque in JetBrains Mono
  private createPlaqueTexture(numStr: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Brushed metal plate base
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#c7ab70');
    grad.addColorStop(0.5, '#e4d29e');
    grad.addColorStop(1, '#a88d55');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle brushed noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < 256; y += 3) {
      ctx.fillRect(0, y, 512, 1);
    }

    // Outer beveled border
    ctx.strokeStyle = '#6e582d';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.strokeStyle = '#fff1ca';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, 476, 220);

    // Engraved screw rivets in corners
    const screws = [
      [36, 36],
      [476, 36],
      [36, 220],
      [476, 220],
    ];
    screws.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#54421f';
      ctx.fill();
      ctx.strokeStyle = '#2d2310';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Engraved door number in JetBrains Mono
    ctx.font = 'bold 118px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#3a2e16';
    ctx.fillText(numStr, 256, 131);

    ctx.fillStyle = '#1c1508';
    ctx.fillText(numStr, 256, 127);

    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#524122';
    ctx.fillText('MUSHAF STUDIO', 256, 195);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  // Fallback high-fidelity procedural wood canvas texture
  public createProceduralWood(size = 1024): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2b211a';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(18, 12, 8, 0.45)';
    ctx.lineWidth = 2;
    for (let x = 0; x < size; x += 4) {
      const wave = Math.sin(x * 0.05) * 12 + Math.cos(x * 0.01) * 20;
      ctx.beginPath();
      ctx.moveTo(x + wave, 0);
      ctx.bezierCurveTo(
        x + wave + 10,
        size * 0.33,
        x - wave - 10,
        size * 0.66,
        x + wave,
        size
      );
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(1, 2);
    return texture;
  }

  // Fallback procedural bump map
  public createProceduralBump(size = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = 120 + Math.floor(Math.random() * 25);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  public createProceduralPlaster(size = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      imgData.data[i] += noise;
      imgData.data[i + 1] += noise;
      imgData.data[i + 2] += noise;
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  public createProceduralTile(size = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#222325';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#111214';
    ctx.lineWidth = 6;
    const tileSize = size / 4;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  public createProceduralWallpaper(size = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1c1e22';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#292c33';
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath();
      ctx.arc(i, i, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  public createProceduralScratch(size = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 20 + Math.random() * 50;
      const angle = Math.random() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  public dispose() {
    this.woodAlbedo.dispose();
    this.woodBump.dispose();
    this.wallTexture.dispose();
    this.indoorFloorTexture.dispose();
    this.indoorWallTexture.dispose();
    this.metalScratch.dispose();
    this.ironBump.dispose();
    this.plaqueTextures.forEach((t) => t.dispose());
    this.plaqueTextures.clear();
  }
}

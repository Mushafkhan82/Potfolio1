/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DoorTextureManager } from './DoorTextureManager.ts';
import { DoorGeometryBuilder } from './DoorGeometryBuilder.ts';
import { TIMELINE, ServiceDoorItem } from './doorsConfig.ts';
import { bindWebGLContextHandlers, disposeThreeScene } from './threeCleanup.ts';

export interface DoorwayBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  progress: number;
}

export class DoorScene {
  public canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: DoorTextureManager;
  private doorBuilder: DoorGeometryBuilder;

  // Scene elements
  private wallMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private doorwayLight: THREE.PointLight;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private dustParticles!: THREE.Points;
  private dustPositions!: Float32Array;
  private glowPlane!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;

  // Animation & Motion State
  private targetDoorAngle = 0;
  private currentDoorAngle = 0;
  private targetHandleAngle = 0;
  private currentHandleAngle = 0;
  private targetCameraZ = 3.6;
  private currentCameraZ = 3.6;
  private targetLightIntensity = 0;
  private currentLightIntensity = 0;

  // Mouse Parallax
  private pointerX = 0;
  private pointerY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  // Walk-through transition state
  public isTransitioning = false;
  private transitionProgress = 0;

  // Callbacks
  public onDoorwayBoundsUpdate?: (bounds: DoorwayBounds) => void;

  private isVisible = true;
  private isContextLost = false;
  private isDestroyed = false;
  private animFrameId = 0;
  private lastTime = performance.now();
  private unbindContext?: () => void;

  constructor(canvas: HTMLCanvasElement, isDarkMode: boolean) {
    this.canvas = canvas;

    // Detect software rendering
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize WebGL Renderer
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !isSoftwareGl && !isMobileViewport,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isMobileViewport ? 1.5 : 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 30);
    this.camera.position.set(0, 0.05, 3.6);

    // PMREMGenerator RoomEnvironment for realistic PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Textures & Door Builder
    this.textures = new DoorTextureManager();
    this.textures.init(this.renderer.capabilities.getMaxAnisotropy());
    this.doorBuilder = new DoorGeometryBuilder(this.textures);
    this.scene.add(this.doorBuilder.rootGroup);

    // Wall Material
    const wallColor = isDarkMode ? 0x111114 : 0xeae6df;
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.88,
      metalness: 0.02,
      bumpMap: this.textures.wallTexture || undefined,
      bumpScale: 0.006,
    });

    // Floor Material
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x0a0a0c : 0xd8d4cb,
      roughness: 0.82,
      metalness: 0.04,
    });

    // Build Surroundings (Wall with doorway aperture, floor, contact shadows, dust)
    this.buildSurroundings(isDarkMode);

    // Lighting Rig
    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.keyLight.position.set(2.4, 3.2, 2.6);
    this.keyLight.castShadow = !isSoftwareGl;
    this.keyLight.shadow.mapSize.width = isMobileViewport ? 512 : 1024;
    this.keyLight.shadow.mapSize.height = isMobileViewport ? 512 : 1024;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 10;
    this.keyLight.shadow.camera.left = -2;
    this.keyLight.shadow.camera.right = 2;
    this.keyLight.shadow.camera.top = 2.5;
    this.keyLight.shadow.camera.bottom = -2;
    this.scene.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(
      isDarkMode ? 0x8ba3c7 : 0xf4f1ea,
      isDarkMode ? 0x1c1a18 : 0x736c64,
      0.65
    );
    this.scene.add(this.hemiLight);

    // Doorway interior warm spill light (starts dark, grows as door opens)
    this.doorwayLight = new THREE.PointLight(0xffecd1, 0, 5, 1.5);
    this.doorwayLight.position.set(0.1, 0.2, -0.6);
    this.scene.add(this.doorwayLight);

    // Handle Resize, Visibility & WebGL Context
    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.unbindContext = bindWebGLContextHandlers(
      this.canvas,
      () => {
        this.isContextLost = true;
      },
      () => {
        this.isContextLost = false;
        this.lastTime = performance.now();
        this.resize();
      }
    );

    // Start loop
    this.tick();
  }

  private buildSurroundings(isDarkMode: boolean) {
    const DOOR_W = 1.0;
    const DOOR_H = 2.2;
    const WALL_W = 14;
    const WALL_H = 8;
    const WALL_THICK = 0.12;

    // 1. Plaster Wall surrounding doorway aperture
    // Left wall segment
    const leftW = (WALL_W - DOOR_W) * 0.5;
    const leftWallGeo = new THREE.BoxGeometry(leftW, WALL_H, WALL_THICK);
    const leftWall = new THREE.Mesh(leftWallGeo, this.wallMaterial);
    leftWall.position.set(-DOOR_W * 0.5 - leftW * 0.5, 0, -WALL_THICK * 0.5);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right wall segment
    const rightWall = leftWall.clone();
    rightWall.position.x = DOOR_W * 0.5 + leftW * 0.5;
    this.scene.add(rightWall);

    // Top wall segment
    const topH = (WALL_H - DOOR_H) * 0.5;
    const topWallGeo = new THREE.BoxGeometry(DOOR_W, topH, WALL_THICK);
    const topWall = new THREE.Mesh(topWallGeo, this.wallMaterial);
    topWall.position.set(0, DOOR_H * 0.5 + topH * 0.5, -WALL_THICK * 0.5);
    topWall.receiveShadow = true;
    this.scene.add(topWall);

    // 2. Floor Plane
    const floorGeo = new THREE.PlaneGeometry(16, 12);
    floorGeo.rotateX(-Math.PI * 0.5);
    const floor = new THREE.Mesh(floorGeo, this.floorMaterial);
    floor.position.set(0, -DOOR_H * 0.5 - 0.002, 3);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 3. Soft Radial Contact Shadow beneath door
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 64, 10, 128, 64, 115);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    this.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), shadowMat);
    this.contactShadow.rotation.x = -Math.PI * 0.5;
    this.contactShadow.position.set(0, -DOOR_H * 0.5 + 0.002, 0.12);
    this.scene.add(this.contactShadow);

    // 4. Volumetric Light Glow Plane inside doorway
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfff3db,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W * 1.1, DOOR_H * 1.05), glowMat);
    this.glowPlane.position.set(0, 0, -0.05);
    this.scene.add(this.glowPlane);

    // 5. Floating Dust Motes (45 ambient particles drifting in the doorway light beam)
    const particleCount = 45;
    this.dustPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 1.2;
      this.dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      this.dustPositions[i * 3 + 2] = Math.random() * 1.4 - 0.2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    // Particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
    pGrad.addColorStop(0, 'rgba(255, 240, 200, 1)');
    pGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 32, 32);

    const dustTex = new THREE.CanvasTexture(pCanvas);
    const dustMat = new THREE.PointsMaterial({
      map: dustTex,
      size: 0.035,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);
  }

  // Update theme colors when user toggles dark/light mode
  public setTheme(isDarkMode: boolean) {
    const wallColor = isDarkMode ? 0x111114 : 0xeae6df;
    const floorColor = isDarkMode ? 0x0a0a0c : 0xd8d4cb;
    this.wallMaterial.color.set(wallColor);
    this.floorMaterial.color.set(floorColor);
    this.hemiLight.color.set(isDarkMode ? 0x8ba3c7 : 0xf4f1ea);
    this.hemiLight.groundColor.set(isDarkMode ? 0x1c1a18 : 0x736c64);
  }

  // Update current service preset and door number
  public setServiceDoor(service: ServiceDoorItem) {
    this.doorBuilder.applyPreset(service.preset, service.index);
  }

  // Scrub the timeline based on normalized door progress (p: 0 -> 1)
  public setProgress(p: number, isHovered = false) {
    if (this.isTransitioning) return;

    const clamped = Math.max(0, Math.min(1, p));

    // 1. Handle Latch Timing: 0.10 -> 0.20 turns handle down ~25°
    if (clamped < TIMELINE.HANDLE_LATCH_START) {
      this.targetHandleAngle = 0;
    } else if (clamped <= TIMELINE.HANDLE_LATCH_END) {
      const hp = (clamped - TIMELINE.HANDLE_LATCH_START) / (TIMELINE.HANDLE_LATCH_END - TIMELINE.HANDLE_LATCH_START);
      this.targetHandleAngle = hp * TIMELINE.HANDLE_LATCH_ANGLE;
    } else if (clamped < TIMELINE.CLOSE_START) {
      this.targetHandleAngle = TIMELINE.HANDLE_LATCH_ANGLE;
    } else if (clamped <= TIMELINE.CLOSE_END) {
      const cp = (clamped - TIMELINE.CLOSE_START) / (TIMELINE.CLOSE_END - TIMELINE.CLOSE_START);
      this.targetHandleAngle = (1 - cp) * TIMELINE.HANDLE_LATCH_ANGLE;
    } else {
      this.targetHandleAngle = 0;
    }

    // 2. Door Swing Timing: 0.20 -> 0.60 opens to ~104°
    if (clamped < TIMELINE.DOOR_SWING_START) {
      this.targetDoorAngle = isHovered ? TIMELINE.AJAR_HOVER_ANGLE : 0;
      this.targetLightIntensity = 0;
      this.targetCameraZ = 3.6;
    } else if (clamped <= TIMELINE.DOOR_SWING_END) {
      const sp = (clamped - TIMELINE.DOOR_SWING_START) / (TIMELINE.DOOR_SWING_END - TIMELINE.DOOR_SWING_START);
      // Smooth cubic ease-in-out
      const ease = sp < 0.5 ? 4 * sp * sp * sp : 1 - Math.pow(-2 * sp + 2, 3) / 2;
      this.targetDoorAngle = ease * TIMELINE.MAX_DOOR_ANGLE;
      this.targetLightIntensity = ease * 3.4;
      this.targetCameraZ = 3.6 - ease * 0.18; // 5% dolly push-in
    } else if (clamped <= TIMELINE.HOLD_END) {
      // Hold phase: door fully open, page fully readable
      this.targetDoorAngle = TIMELINE.MAX_DOOR_ANGLE;
      this.targetLightIntensity = 3.4;
      this.targetCameraZ = 3.42;
    } else if (clamped <= TIMELINE.CLOSE_END) {
      // Close phase: 0.80 -> 0.95
      const cp = (clamped - TIMELINE.CLOSE_START) / (TIMELINE.CLOSE_END - TIMELINE.CLOSE_START);
      const ease = cp < 0.5 ? 4 * cp * cp * cp : 1 - Math.pow(-2 * cp + 2, 3) / 2;
      this.targetDoorAngle = (1 - ease) * TIMELINE.MAX_DOOR_ANGLE;
      this.targetLightIntensity = (1 - ease) * 3.4;
      this.targetCameraZ = 3.42 + ease * 0.18;
    } else {
      this.targetDoorAngle = 0;
      this.targetLightIntensity = 0;
      this.targetCameraZ = 3.6;
    }
  }

  // Trigger walk-through transition when user clicks door or "Open service"
  public startWalkthroughTransition(onComplete: () => void) {
    this.isTransitioning = true;
    this.transitionProgress = 0;

    const startTime = performance.now();
    const duration = 950; // ms

    const animateTransition = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      this.transitionProgress = t;

      // Door swings wide open to ~115°
      const easeT = t * t * (3 - 2 * t);
      this.targetDoorAngle = -2.0;
      this.targetLightIntensity = 3.5 + t * 4.0;
      // Camera dollies straight through doorway
      this.targetCameraZ = 3.6 - easeT * 3.8;

      if (t < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animateTransition);
  }

  private onPointerMove = (e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.pointerX = nx * 0.15;
    this.pointerY = -ny * 0.08;
  };

  private onResize = () => {
    this.resize();
  };

  public resize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.parentElement?.clientHeight || window.innerHeight;

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;

    // Mobile framing adjustment: widen FOV slightly in portrait so door fills ~80%
    if (this.camera.aspect < 1.0) {
      this.camera.fov = 48;
    } else {
      this.camera.fov = 38;
    }
    this.camera.updateProjectionMatrix();
  }

  public setVisibility(visible: boolean) {
    this.isVisible = visible;
  }

  private onVisibilityChange = () => {
    if (!document.hidden) {
      this.lastTime = performance.now();
    }
  };

  // Main damped render loop
  private tick = () => {
    if (this.isDestroyed) return;

    this.animFrameId = requestAnimationFrame(this.tick);

    if (!this.isVisible || this.isContextLost || document.hidden) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) * 0.001);
    this.lastTime = now;

    // Smooth exponential damping: 1 - Math.exp(-k * dt)
    const dampRate = this.isTransitioning ? 14 : 9;
    const factor = 1 - Math.exp(-dampRate * dt);

    this.currentDoorAngle += (this.targetDoorAngle - this.currentDoorAngle) * factor;
    this.currentHandleAngle += (this.targetHandleAngle - this.currentHandleAngle) * factor;
    this.currentCameraZ += (this.targetCameraZ - this.currentCameraZ) * factor;
    this.currentLightIntensity += (this.targetLightIntensity - this.currentLightIntensity) * factor;

    // Smooth pointer parallax
    this.smoothPointerX += (this.pointerX - this.smoothPointerX) * (1 - Math.exp(-6 * dt));
    this.smoothPointerY += (this.pointerY - this.smoothPointerY) * (1 - Math.exp(-6 * dt));

    // Apply rotations
    this.doorBuilder.hingePivotGroup.rotation.y = this.currentDoorAngle;
    this.doorBuilder.handlePivotFront.rotation.z = this.currentHandleAngle;
    this.doorBuilder.handlePivotBack.rotation.z = -this.currentHandleAngle;

    // Apply lighting & glow
    this.doorwayLight.intensity = this.currentLightIntensity;
    (this.glowPlane.material as THREE.MeshBasicMaterial).opacity = Math.min(
      0.65,
      (this.currentLightIntensity / 3.4) * 0.55
    );

    // Apply camera dolly and parallax
    this.camera.position.z = this.currentCameraZ;
    this.camera.position.x = this.smoothPointerX;
    this.camera.position.y = 0.05 + this.smoothPointerY;
    this.camera.lookAt(0, 0.05, 0);

    // Animate dust motes drift
    if (this.dustParticles && this.currentLightIntensity > 0.2) {
      const pos = this.dustParticles.geometry.attributes.position.array as Float32Array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(now * 0.001 + i) * 0.001;
        pos[i * 3 + 0] += Math.cos(now * 0.0008 + i) * 0.0008;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
      (this.dustParticles.material as THREE.PointsMaterial).opacity = Math.min(
        0.75,
        this.currentLightIntensity * 0.25
      );
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // Project doorway aperture bounds to 2D screen coordinates for DOM preview clipping
    this.computeDoorwayScreenBounds();
  };

  // Computes pixel-perfect screen clip rectangle matching the open doorway opening
  private computeDoorwayScreenBounds() {
    if (!this.onDoorwayBoundsUpdate || !this.camera || !this.canvas) return;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 4 corners of the inner door opening in 3D world space
    // Door opening is roughly 1.0m wide (-0.5 to 0.5), 2.2m high (-1.1 to 1.1)
    const corners = [
      new THREE.Vector3(-0.5, -1.1, -0.02),
      new THREE.Vector3(0.5, -1.1, -0.02),
      new THREE.Vector3(0.5, 1.1, -0.02),
      new THREE.Vector3(-0.5, 1.1, -0.02),
    ];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    corners.forEach((pt) => {
      pt.project(this.camera);
      const sx = ((pt.x + 1) * 0.5) * w;
      const sy = ((-pt.y + 1) * 0.5) * h;
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
    });

    const openFraction = Math.abs(this.currentDoorAngle / TIMELINE.MAX_DOOR_ANGLE);

    this.onDoorwayBoundsUpdate({
      left: minX,
      top: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
      progress: openFraction,
    });
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.unbindContext?.();

    disposeThreeScene(this.scene);
    this.doorBuilder.dispose();
    this.textures.dispose();
    this.wallMaterial.dispose();
    this.floorMaterial.dispose();
    (this.glowPlane.material as THREE.Material).dispose();
    (this.dustParticles.material as THREE.Material).dispose();
    this.dustParticles.geometry.dispose();
    this.renderer.dispose();
  }
}

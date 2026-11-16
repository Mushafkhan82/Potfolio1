/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SERVICES_DOORS_DATA, ServiceDoorItem, DoorMaterialPreset } from './doorsConfig.ts';
import { DoorTextureManager } from './DoorTextureManager.ts';
import { bindWebGLContextHandlers, disposeThreeScene } from './threeCleanup.ts';

export interface DoorwayBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
}

interface SingleDoorAssembly {
  index: number;
  service: ServiceDoorItem;
  xPos: number;
  rootGroup: THREE.Group;
  hingePivot: THREE.Group;
  handlePivot: THREE.Group;
  doorLeafMesh: THREE.Mesh;
  doorFrameMesh: THREE.Mesh;
  indoorLight: THREE.PointLight;
  indoorLightBeam: THREE.Mesh;
  indoorDust: THREE.Points;
  indoorPortalMesh: THREE.Mesh;
  indoorRoomGroup: THREE.Group;
  currentDoorAngle: number;
  targetDoorAngle: number;
  currentHandleAngle: number;
  targetHandleAngle: number;
  currentLightIntensity: number;
  targetLightIntensity: number;
}

export class HorizontalDoorsScene {
  public canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: DoorTextureManager;

  // Assembly of 8 doors side-by-side
  private doors: SingleDoorAssembly[] = [];
  private readonly DOOR_SPACING = 2.4; // 2.4m spacing between doors side-by-side

  // Global Lighting
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Gallery Architecture
  private galleryWall: THREE.Mesh;
  private galleryFloor: THREE.Mesh;

  // Camera & Tracking State
  private targetCameraX = 0;
  private currentCameraX = 0;
  private targetCameraZ = 3.65;
  private currentCameraZ = 3.65;
  private activeIndex = 0;

  // Pointer Parallax & Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  // Transitions & Animation Loop
  public isTransitioning = false;
  private transitionProgress = 0;
  private isVisible = true;
  private isContextLost = false;
  private isDestroyed = false;
  private animFrameId = 0;
  private lastTime = performance.now();
  private unbindContext?: () => void;

  // Callbacks
  public onActiveIndexChange?: (index: number) => void;
  public onDoorClick?: (service: ServiceDoorItem) => void;

  constructor(canvas: HTMLCanvasElement, isDarkMode: boolean) {
    this.canvas = canvas;
    this.textures = new DoorTextureManager();

    // 1. WebGL Renderer Initialization
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !isMobileViewport,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileViewport ? 1.5 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 40);
    this.camera.position.set(0, 0.05, 3.65);

    // 3. PMREM Room Environment for realistic PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    this.keyLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
    this.keyLight.position.set(4, 5, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = isMobileViewport ? 512 : 1024;
    this.keyLight.shadow.mapSize.height = isMobileViewport ? 512 : 1024;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xdde5ed, 0.6);
    this.fillLight.position.set(-6, 3, 3);
    this.scene.add(this.fillLight);

    this.hemiLight = new THREE.HemisphereLight(
      isDarkMode ? 0x99aab8 : 0xf4f1ea,
      isDarkMode ? 0x16181b : 0x736c64,
      0.65
    );
    this.scene.add(this.hemiLight);

    // 5. Gallery Architecture (Floor & Long Wall)
    const wallGeo = new THREE.PlaneGeometry(35, 8);
    const wallMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x121316 : 0xe7e3db,
      roughness: 0.9,
      metalness: 0.02,
      bumpMap: this.textures.wallTexture,
      bumpScale: 0.005,
    });
    this.galleryWall = new THREE.Mesh(wallGeo, wallMat);
    this.galleryWall.position.set(0, 0.7, -0.16);
    this.galleryWall.receiveShadow = true;
    this.scene.add(this.galleryWall);

    const floorGeo = new THREE.PlaneGeometry(35, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x090a0c : 0xd3cec4,
      roughness: 0.75,
      metalness: 0.06,
      bumpMap: this.textures.indoorFloorTexture,
      bumpScale: 0.004,
    });
    this.galleryFloor = new THREE.Mesh(floorGeo, floorMat);
    this.galleryFloor.rotation.x = -Math.PI / 2;
    this.galleryFloor.position.set(0, -1.06, 2);
    this.galleryFloor.receiveShadow = true;
    this.scene.add(this.galleryFloor);

    // 6. Build the 8 Doors Horizontally Side by Side
    this.buildHorizontalDoors(isDarkMode);

    // 7. Event Listeners
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('click', this.onClick);
    this.unbindContext = bindWebGLContextHandlers(
      this.canvas,
      () => {
        this.isContextLost = true;
      },
      () => {
        this.isContextLost = false;
        this.lastTime = performance.now();
        this.onResize();
      }
    );
    this.onResize();

    // 8. Start Animation Loop
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  // Build 8 realistic doors positioned horizontally along X
  private buildHorizontalDoors(isDarkMode: boolean) {
    const total = SERVICES_DOORS_DATA.length;

    // Shared Geometries for ultra-high performance & low draw overhead
    const doorLeafGeo = new THREE.BoxGeometry(0.96, 2.06, 0.05);
    const panelBevelGeo = new THREE.BoxGeometry(0.74, 0.78, 0.024);
    const panelInnerGeo = new THREE.BoxGeometry(0.66, 0.70, 0.028);

    // Stepped Architrave Frame
    const frameOuterGeo = new THREE.BoxGeometry(1.18, 2.22, 0.12);
    const frameHoleGeo = new THREE.BoxGeometry(0.98, 2.08, 0.14);

    // Door Handle & Spindle Geometries
    const backplateGeo = new THREE.BoxGeometry(0.06, 0.28, 0.015);
    const leverGeo = new THREE.CylinderGeometry(0.014, 0.011, 0.14, 16);
    const hingeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 12);

    SERVICES_DOORS_DATA.forEach((service, i) => {
      // Center the 8 doors around 0: indices 0..7 => x from -8.4m to +8.4m
      const xPos = (i - (total - 1) / 2) * this.DOOR_SPACING;
      const rootGroup = new THREE.Group();
      rootGroup.position.set(xPos, 0, 0);

      // --- 1. Architectural Door Frame ---
      const frameColor = isDarkMode ? 0x1d1e22 : 0xded9cf;
      const frameMat = new THREE.MeshStandardMaterial({
        color: frameColor,
        roughness: 0.65,
        metalness: 0.08,
      });

      // Frame Left, Right, Top Pieces
      const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.22, 0.14), frameMat);
      frameLeft.position.set(-0.54, 0.05, 0);
      frameLeft.castShadow = true;
      frameLeft.receiveShadow = true;

      const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.22, 0.14), frameMat);
      frameRight.position.set(0.54, 0.05, 0);
      frameRight.castShadow = true;
      frameRight.receiveShadow = true;

      const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.1, 0.14), frameMat);
      frameTop.position.set(0, 1.11, 0);
      frameTop.castShadow = true;
      frameTop.receiveShadow = true;

      const frameGroup = new THREE.Group();
      frameGroup.add(frameLeft, frameRight, frameTop);
      rootGroup.add(frameGroup);

      // --- 2. Door Leaf with PBR Preset Materials ---
      const preset: DoorMaterialPreset = service.preset;
      const doorColor = new THREE.Color(preset.doorColor);
      const isWood = preset.isWood;

      const doorMat = new THREE.MeshPhysicalMaterial({
        color: doorColor,
        roughness: preset.roughness,
        metalness: preset.metalness,
        clearcoat: preset.clearcoat,
        clearcoatRoughness: 0.18,
        map: isWood ? this.textures.woodAlbedo : null,
        bumpMap: isWood ? this.textures.woodBump : this.textures.wallTexture,
        bumpScale: isWood ? 0.007 : 0.003,
      });

      const doorLeafMesh = new THREE.Mesh(doorLeafGeo, doorMat);
      doorLeafMesh.castShadow = true;
      doorLeafMesh.receiveShadow = true;

      // Beveled Raised Panels (Top and Bottom)
      const topPanelBevel = new THREE.Mesh(panelBevelGeo, doorMat);
      topPanelBevel.position.set(0, 0.44, 0.016);
      const topPanelInner = new THREE.Mesh(panelInnerGeo, doorMat);
      topPanelInner.position.set(0, 0.44, 0.024);

      const bottomPanelBevel = new THREE.Mesh(panelBevelGeo, doorMat);
      bottomPanelBevel.position.set(0, -0.44, 0.016);
      const bottomPanelInner = new THREE.Mesh(panelInnerGeo, doorMat);
      bottomPanelInner.position.set(0, -0.44, 0.024);

      // --- 3. Hardware: Brass/Chrome Engraved Number Plaque ---
      const plaqueGeo = new THREE.PlaneGeometry(0.18, 0.09);
      const plaqueMat = new THREE.MeshStandardMaterial({
        map: this.textures.getPlaqueTexture(service.index),
        roughness: 0.35,
        metalness: 0.88,
      });
      const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
      plaqueMesh.position.set(0, 0.68, 0.038);

      // --- 4. Hardware: Lever Handle & Escutcheon ---
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0x222224,
        roughness: 0.28,
        metalness: 0.95,
        bumpMap: this.textures.metalScratch,
        bumpScale: 0.002,
      });

      const handlePivot = new THREE.Group();
      handlePivot.position.set(0.38, -0.05, 0.035);

      const escutcheon = new THREE.Mesh(backplateGeo, handleMat);
      const leverMesh = new THREE.Mesh(leverGeo, handleMat);
      leverMesh.rotation.z = Math.PI / 2;
      leverMesh.position.set(-0.06, 0.05, 0.04);

      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12), handleMat);
      spindle.rotation.x = Math.PI / 2;
      spindle.position.set(0, 0.05, 0.02);

      handlePivot.add(escutcheon, leverMesh, spindle);

      // Hinges on the Left Hinge Edge (x = -0.48)
      const hingeMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.92,
      });
      const topHinge = new THREE.Mesh(hingeGeo, hingeMat);
      topHinge.position.set(-0.485, 0.72, 0.025);
      const bottomHinge = new THREE.Mesh(hingeGeo, hingeMat);
      bottomHinge.position.set(-0.485, -0.72, 0.025);

      // --- 5. Door Leaf Group with Hinge Origin at x = -0.48 ---
      // Wrapping in a hinge pivot group whose origin is the left frame edge
      const hingePivot = new THREE.Group();
      hingePivot.position.set(-0.48, 0, 0);

      const leafInner = new THREE.Group();
      leafInner.position.set(0.48, 0, 0); // Offset door geometry by half-width so hinge is at 0
      leafInner.add(
        doorLeafMesh,
        topPanelBevel,
        topPanelInner,
        bottomPanelBevel,
        bottomPanelInner,
        plaqueMesh,
        handlePivot,
        topHinge,
        bottomHinge
      );
      hingePivot.add(leafInner);
      rootGroup.add(hingePivot);

      // --- 6. "INDOORS" Room Environment & Textures (add texture indoors) ---
      const indoorRoomGroup = new THREE.Group();
      indoorRoomGroup.position.set(0, 0, -0.7);

      // Textured Indoor Floor (glossy interior tiles)
      const indoorFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.8),
        new THREE.MeshStandardMaterial({
          map: this.textures.indoorFloorTexture,
          roughness: 0.35,
          metalness: 0.2,
        })
      );
      indoorFloor.rotation.x = -Math.PI / 2;
      indoorFloor.position.set(0, -1.04, 0.4);
      indoorFloor.receiveShadow = true;

      // Textured Indoor Back Wall (wallpaper / plaster)
      const indoorBackWall = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 2.2),
        new THREE.MeshStandardMaterial({
          map: this.textures.indoorWallTexture,
          roughness: 0.85,
          color: isDarkMode ? 0x1f232b : 0xece6dc,
        })
      );
      indoorBackWall.position.set(0, 0.06, -0.6);

      // Warm Indoor Room Light (streams through open doorway)
      const indoorLight = new THREE.PointLight(0xffecd2, 0, 4.5, 1.8);
      indoorLight.position.set(0.1, 0.5, -0.3);

      // Indoor Light Flare / Volumetric Beam
      const beamGeo = new THREE.ConeGeometry(0.7, 1.6, 16, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffefdb,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const indoorLightBeam = new THREE.Mesh(beamGeo, beamMat);
      indoorLightBeam.position.set(0.1, 0.1, -0.1);

      // Indoor Dust Particles floating in the light shaft
      const dustCount = 28;
      const dustPos = new Float32Array(dustCount * 3);
      for (let d = 0; d < dustCount; d++) {
        dustPos[d * 3] = (Math.random() - 0.5) * 0.9;
        dustPos[d * 3 + 1] = (Math.random() - 0.5) * 1.8;
        dustPos[d * 3 + 2] = -0.5 + Math.random() * 0.8;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0xfff6e8,
        size: 0.024,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const indoorDust = new THREE.Points(dustGeo, dustMat);

      // Indoor Deliverables Canvas Portal (Rich card rendered inside the room)
      const indoorPortalTex = this.createIndoorPortalTexture(service);
      const indoorPortalMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.88, 1.76),
        new THREE.MeshBasicMaterial({
          map: indoorPortalTex,
          transparent: true,
          opacity: 0,
        })
      );
      indoorPortalMesh.position.set(0, 0.05, -0.42);

      indoorRoomGroup.add(
        indoorFloor,
        indoorBackWall,
        indoorLight,
        indoorLightBeam,
        indoorDust,
        indoorPortalMesh
      );
      rootGroup.add(indoorRoomGroup);

      // Soft contact shadow under the closed door
      const shadowGeo = new THREE.PlaneGeometry(1.2, 0.35);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: isDarkMode ? 0.6 : 0.25,
      });
      const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.set(0, -1.04, 0.08);
      rootGroup.add(contactShadow);

      this.scene.add(rootGroup);

      this.doors.push({
        index: i,
        service,
        xPos,
        rootGroup,
        hingePivot,
        handlePivot,
        doorLeafMesh,
        doorFrameMesh: frameLeft,
        indoorLight,
        indoorLightBeam,
        indoorDust,
        indoorPortalMesh,
        indoorRoomGroup,
        currentDoorAngle: 0,
        targetDoorAngle: 0,
        currentHandleAngle: 0,
        targetHandleAngle: 0,
        currentLightIntensity: 0,
        targetLightIntensity: 0,
      });
    });
  }

  // Generate high-resolution indoor room service portal graphics
  private createIndoorPortalTexture(service: ServiceDoorItem): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Background Room Card with dark glass finish
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 1024);
    bgGrad.addColorStop(0, '#0c0e12');
    bgGrad.addColorStop(0.5, '#14181f');
    bgGrad.addColorStop(1, '#090a0d');
    ctx.fillStyle = bgGrad;
    ctx.roundRect(16, 16, 480, 992, 32);
    ctx.fill();

    // Subtle border glow
    ctx.strokeStyle = '#c6f432';
    ctx.lineWidth = 4;
    ctx.roundRect(16, 16, 480, 992, 32);
    ctx.stroke();

    // Header Badge: DOOR 01
    ctx.fillStyle = 'rgba(198, 244, 50, 0.18)';
    ctx.roundRect(48, 48, 180, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#c6f432';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(`DOOR ${service.index} // 08`, 68, 76);

    // Service Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Instrument Serif", serif';
    const words = service.name.split(' ');
    let line1 = words[0];
    let line2 = words.slice(1).join(' ');
    ctx.fillText(line1, 48, 150);
    if (line2) {
      ctx.fillText(line2, 48, 200);
    }

    // Benefit Description
    ctx.fillStyle = '#a0aab8';
    ctx.font = '22px "Inter", sans-serif';
    ctx.fillText(service.benefit.substring(0, 36), 48, 255);
    ctx.fillText(service.benefit.substring(36, 75), 48, 285);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 320);
    ctx.lineTo(464, 320);
    ctx.stroke();

    // Deliverables Section Heading
    ctx.fillStyle = '#c6f432';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText('DELIVERABLES & SCOPE', 48, 360);

    // 3 Deliverables with Lime Checkmarks
    const items = service.deliverables.slice(0, 3);
    items.forEach((item, idx) => {
      const y = 410 + idx * 80;

      // Check circle
      ctx.fillStyle = '#c6f432';
      ctx.beginPath();
      ctx.arc(68, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#050505';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('✓', 62, y + 5);

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillText(item, 96, y + 8);
    });

    // Stat Metric Callout
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.roundRect(48, 680, 416, 120, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();

    ctx.fillStyle = '#c6f432';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(service.stat, 72, 735);
    ctx.fillStyle = '#8b94a0';
    ctx.font = '18px "Inter", sans-serif';
    ctx.fillText('Guaranteed studio production metric', 72, 770);

    // CTA Button: ENTER SERVICE
    ctx.fillStyle = '#c6f432';
    ctx.roundRect(48, 840, 416, 76, 38);
    ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENTER SERVICE →', 256, 888);
    ctx.textAlign = 'left';

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  // Track overall scroll progress S (0 to 1) and open doors one by one
  public setScrollProgress(progress: number) {
    if (this.isTransitioning) return;

    const total = this.doors.length;
    // Map progress to float index 0 to 7.99
    const scaled = Math.max(0, Math.min(total - 0.001, progress * total));
    const activeIdx = Math.floor(scaled);
    const subProgress = scaled - activeIdx; // 0 to 1 inside current door turn

    if (activeIdx !== this.activeIndex) {
      this.activeIndex = activeIdx;
      this.onActiveIndexChange?.(activeIdx);
    }

    // Set camera target X directly in front of the active door
    const activeDoor = this.doors[activeIdx];
    if (activeDoor) {
      // Sub-progress smoothly glides the camera slightly toward the next door as scroll progresses
      const nextDoor = this.doors[Math.min(total - 1, activeIdx + 1)];
      const nextX = nextDoor ? nextDoor.xPos : activeDoor.xPos;
      const tCam = Math.pow(subProgress, 2.5); // Ease transition to next door
      this.targetCameraX = THREE.MathUtils.lerp(activeDoor.xPos, nextX, tCam * 0.4);
    }

    // Animate each door leaf & indoor light depending on its proximity to the active index
    this.doors.forEach((door, i) => {
      if (i === activeIdx) {
        // Active Door Timeline:
        // 0.00 - 0.15: Closed, handle starts turning
        // 0.15 - 0.55: Door swings open to 104 degrees, light blooms
        // 0.55 - 0.85: Rest open with full indoor room visibility
        // 0.85 - 1.00: Door gently swings closed
        if (subProgress < 0.15) {
          const tHandle = subProgress / 0.15;
          door.targetHandleAngle = tHandle * 0.44; // ~25 deg
          door.targetDoorAngle = 0;
          door.targetLightIntensity = 0;
        } else if (subProgress < 0.55) {
          const tOpen = (subProgress - 0.15) / 0.4;
          const eased = Math.sin((tOpen * Math.PI) / 2); // ease out
          door.targetHandleAngle = 0.44;
          door.targetDoorAngle = eased * 1.82; // ~104 degrees
          door.targetLightIntensity = eased * 3.2;
        } else if (subProgress < 0.85) {
          door.targetHandleAngle = 0.1;
          door.targetDoorAngle = 1.82;
          door.targetLightIntensity = 3.2;
        } else {
          // Closing
          const tClose = (subProgress - 0.85) / 0.15;
          const eased = Math.cos((tClose * Math.PI) / 2);
          door.targetHandleAngle = 0;
          door.targetDoorAngle = eased * 1.82;
          door.targetLightIntensity = eased * 3.2;
        }
      } else {
        // Non-active doors remain closed
        door.targetDoorAngle = 0;
        door.targetHandleAngle = 0;
        door.targetLightIntensity = 0;
      }
    });
  }

  // Directly select a door by index (via quick-bar or click)
  public selectDoor(index: number) {
    if (index < 0 || index >= this.doors.length) return;
    this.activeIndex = index;
    const door = this.doors[index];
    this.targetCameraX = door.xPos;
    this.onActiveIndexChange?.(index);

    this.doors.forEach((d, i) => {
      if (i === index) {
        d.targetHandleAngle = 0.35;
        d.targetDoorAngle = 1.82; // Open wide to 104 deg
        d.targetLightIntensity = 3.2;
      } else {
        d.targetDoorAngle = 0;
        d.targetHandleAngle = 0;
        d.targetLightIntensity = 0;
      }
    });
  }

  // Trigger cinematic zoom-in walkthrough transition when door is clicked
  public startWalkthroughTransition(onComplete: () => void) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionProgress = 0;

    const activeDoor = this.doors[this.activeIndex];
    if (activeDoor) {
      activeDoor.targetDoorAngle = 2.05; // Swing door wide open
      activeDoor.targetLightIntensity = 6.0; // Flood with light
    }

    const duration = 850; // ms
    const startTime = performance.now();

    const step = (time: number) => {
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      this.transitionProgress = p;

      // Dolly camera forward right through the doorway aperture
      if (activeDoor) {
        this.targetCameraX = activeDoor.xPos;
        this.currentCameraZ = THREE.MathUtils.lerp(3.65, 0.4, Math.pow(p, 2.5));
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  // Mouse move pointer parallax & raycast hover
  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Gentle parallax
    this.pointerParallaxX = this.mouse.x * 0.18;
    this.pointerParallaxY = this.mouse.y * 0.08;
  };

  // Click on any door in 3D scene to focus and open it
  private onClick = () => {
    if (this.isTransitioning) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr.parent) {
        // Find which door was clicked
        const matched = this.doors.find((d) => d.rootGroup === curr);
        if (matched) {
          if (matched.index === this.activeIndex) {
            // Already active: open service walkthrough
            this.onDoorClick?.(matched.service);
          } else {
            // Focus on this door
            this.selectDoor(matched.index);
          }
          return;
        }
        curr = curr.parent;
      }
    }
  };

  public setTheme(isDarkMode: boolean) {
    const wallColor = isDarkMode ? 0x121316 : 0xe7e3db;
    const floorColor = isDarkMode ? 0x090a0c : 0xd3cec4;
    (this.galleryWall.material as THREE.MeshStandardMaterial).color.setHex(wallColor);
    (this.galleryFloor.material as THREE.MeshStandardMaterial).color.setHex(floorColor);

    this.hemiLight.color.setHex(isDarkMode ? 0x99aab8 : 0xf4f1ea);
    this.hemiLight.groundColor.setHex(isDarkMode ? 0x16181b : 0x736c64);
  }

  public setVisibility(visible: boolean) {
    this.isVisible = visible;
  }

  private onResize = () => {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    // Adapt FOV on mobile so doors look imposing
    this.camera.fov = width < 768 ? 44 : 36;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 1.75));
    this.renderer.setSize(width, height, false);
  };

  private onVisibilityChange = () => {
    if (!document.hidden) {
      this.lastTime = performance.now();
    }
  };

  // Main Render Loop (Smooth Damping & 60fps Culling)
  private renderLoop = (time: number) => {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    if (!this.isVisible || this.isContextLost || document.hidden) return;

    const delta = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // Smooth Camera Gliding along X (Corridor Tracking)
    this.currentCameraX = THREE.MathUtils.damp(this.currentCameraX, this.targetCameraX, 5.5, delta);
    this.currentCameraZ = THREE.MathUtils.damp(this.currentCameraZ, this.targetCameraZ, 5.0, delta);

    // Mouse Parallax damping
    this.smoothPointerX = THREE.MathUtils.damp(this.smoothPointerX, this.pointerParallaxX, 4.0, delta);
    this.smoothPointerY = THREE.MathUtils.damp(this.smoothPointerY, this.pointerParallaxY, 4.0, delta);

    this.camera.position.x = this.currentCameraX + this.smoothPointerX;
    this.camera.position.y = 0.05 + this.smoothPointerY;
    this.camera.position.z = this.currentCameraZ;
    this.camera.lookAt(this.currentCameraX, 0.05, 0);

    // Update Light follows camera
    this.keyLight.position.x = this.currentCameraX + 3.5;

    // Update Doors State
    this.doors.forEach((door) => {
      // Hinge Rotation (Smooth Damped)
      door.currentDoorAngle = THREE.MathUtils.damp(
        door.currentDoorAngle,
        door.targetDoorAngle,
        6.5,
        delta
      );
      door.hingePivot.rotation.y = door.currentDoorAngle;

      // Handle Tilt (Latch action)
      door.currentHandleAngle = THREE.MathUtils.damp(
        door.currentHandleAngle,
        door.targetHandleAngle,
        10.0,
        delta
      );
      door.handlePivot.rotation.z = -door.currentHandleAngle;

      // Indoor Light & Beam Intensity
      door.currentLightIntensity = THREE.MathUtils.damp(
        door.currentLightIntensity,
        door.targetLightIntensity,
        6.0,
        delta
      );
      door.indoorLight.intensity = door.currentLightIntensity;

      // Indoor Light Beam & Dust Alpha
      const beamMat = door.indoorLightBeam.material as THREE.MeshBasicMaterial;
      beamMat.opacity = (door.currentLightIntensity / 3.2) * 0.18;

      const dustMat = door.indoorDust.material as THREE.PointsMaterial;
      dustMat.opacity = (door.currentLightIntensity / 3.2) * 0.65;

      // Indoor Deliverables Portal Alpha & Scale
      const portalMat = door.indoorPortalMesh.material as THREE.MeshBasicMaterial;
      const portalAlpha = Math.max(0, Math.min(1, (door.currentDoorAngle - 0.3) / 1.0));
      portalMat.opacity = portalAlpha;
    });

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('click', this.onClick);
    this.unbindContext?.();

    disposeThreeScene(this.scene);
    this.textures.dispose();
    this.renderer.dispose();
  }
}

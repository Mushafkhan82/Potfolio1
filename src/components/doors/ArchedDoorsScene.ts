/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SERVICES_DOORS_DATA, ServiceDoorItem } from './doorsConfig.ts';
import { DoorTextureManager } from './DoorTextureManager.ts';
import { doorAudio } from './DoorAudio.ts';
import { bindWebGLContextHandlers, disposeThreeScene } from './threeCleanup.ts';

export interface ArchedDoorAssembly {
  index: number;
  service: ServiceDoorItem;
  xPos: number;
  rootGroup: THREE.Group;
  hingePivot: THREE.Group;
  handlePivot: THREE.Group;
  doorLeafMesh: THREE.Mesh;
  indoorLight: THREE.PointLight;
  indoorLightBeam: THREE.Mesh;
  currentDoorAngle: number;
  targetDoorAngle: number;
  currentHandleAngle: number;
  targetHandleAngle: number;
  currentLightIntensity: number;
  targetLightIntensity: number;
  wasOpen: boolean;
}

export class ArchedDoorsScene {
  public canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: DoorTextureManager;

  // 8 Arched Doors
  public doors: ArchedDoorAssembly[] = [];
  private readonly DOOR_SPACING = 2.6; // Spacing between doors side-by-side

  // Gallery Architecture
  private backWall: THREE.Mesh;
  private floorMesh: THREE.Mesh;
  private hangingLampGroup: THREE.Group;

  // Camera & Tracking
  public isOverview = true;
  private targetCameraX = 0;
  private currentCameraX = 0;
  private targetCameraY = 1.05;
  private currentCameraY = 1.05;
  private targetCameraZ = 5.2; // Overview distance
  private currentCameraZ = 5.2;
  public activeIndex = 0;

  // Pointer & Parallax
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  // Transition & State
  public isTransitioning = false;
  private isVisible = true;
  private isContextLost = false;
  private isDestroyed = false;
  private animFrameId = 0;
  private lastTime = performance.now();
  private unbindContext?: () => void;

  // Callbacks
  public onActiveIndexChange?: (index: number) => void;
  public onDoorClick?: (service: ServiceDoorItem) => void;

  constructor(canvas: HTMLCanvasElement, isDarkMode: boolean, startWithZoomOut = false) {
    this.canvas = canvas;
    this.textures = new DoorTextureManager();

    // 1. WebGL Renderer
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !isMobileViewport,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileViewport ? 1.5 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 40);

    if (startWithZoomOut) {
      // Cinematic exit from service page: starts zoomed in doorway, zooms out to overview
      this.currentCameraZ = 0.8;
      this.currentCameraX = 0;
      this.targetCameraZ = 5.2;
    } else {
      this.camera.position.set(0, 1.05, 5.2);
    }

    // 3. Environment & Lighting
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = isMobileViewport ? 512 : 1024;
    keyLight.shadow.mapSize.height = isMobileViewport ? 512 : 1024;
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
    fillLight.position.set(-6, 4, 3);
    this.scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x18181b, 0.7);
    this.scene.add(hemiLight);

    // 4. Background Room Wall
    const wallGeo = new THREE.PlaneGeometry(40, 10);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x18181c, // Sleek dark room wall as in video
      roughness: 0.85,
      metalness: 0.04,
      bumpMap: this.textures.wallTexture,
      bumpScale: 0.004,
    });
    this.backWall = new THREE.Mesh(wallGeo, wallMat);
    this.backWall.position.set(0, 1.8, -0.15);
    this.backWall.receiveShadow = true;
    this.scene.add(this.backWall);

    // 5. Floor with Subtle Reflection (as in video)
    const floorGeo = new THREE.PlaneGeometry(40, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1013,
      roughness: 0.35, // Smooth reflective sheen
      metalness: 0.18,
      bumpMap: this.textures.indoorFloorTexture,
      bumpScale: 0.002,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 2);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // 6. Hanging Vintage Ceiling Lightbulb Group (matching video at 00:05)
    this.hangingLampGroup = new THREE.Group();
    const cordGeo = new THREE.CylinderGeometry(0.004, 0.004, 1.4, 8);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.set(0, 0.7, 0);

    const bulbSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xc4a052, metalness: 0.9, roughness: 0.3 })
    );
    bulbSocket.position.set(0, 0.02, 0);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffe89e,
        emissive: 0xffd269,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      })
    );
    bulb.position.set(0, -0.04, 0);

    const bulbLight = new THREE.PointLight(0xffdf88, 1.5, 3.2, 1.5);
    bulbLight.position.set(0, -0.05, 0);

    this.hangingLampGroup.add(cord, bulbSocket, bulb, bulbLight);
    this.hangingLampGroup.position.set(1.4, 2.5, 0.6);
    this.scene.add(this.hangingLampGroup);

    // 7. Build All 8 Arched Doors Side by Side
    this.buildArchedDoors();

    // 8. Event Listeners
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

    // 9. Start Animation Loop
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  // Create Roman Arched Door Leaf Geometry (rounded arch top)
  private createArchedDoorShape(w: number, straightH: number): THREE.Shape {
    const shape = new THREE.Shape();
    const r = w / 2;
    shape.moveTo(-r, 0);
    shape.lineTo(-r, straightH);
    shape.absarc(0, straightH, r, Math.PI, 0, true);
    shape.lineTo(r, 0);
    shape.closePath();
    return shape;
  }

  // Build All 8 Arched Doors in an Arc / Row (exact to video)
  private buildArchedDoors() {
    const total = SERVICES_DOORS_DATA.length;
    const doorW = 0.92;
    const straightH = 1.62;
    const thickness = 0.048;

    // Door Leaf Shape & Extrusion
    const doorShape = this.createArchedDoorShape(doorW, straightH);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    };
    const archedDoorGeo = new THREE.ExtrudeGeometry(doorShape, extrudeSettings);
    archedDoorGeo.center(); // Center geometry

    // Arched Molding Outer Frame Shape
    const frameOuterShape = this.createArchedDoorShape(doorW + 0.18, straightH + 0.09);
    const frameHole = this.createArchedDoorShape(doorW + 0.02, straightH + 0.01);
    frameOuterShape.holes.push(frameHole);
    const archedFrameGeo = new THREE.ExtrudeGeometry(frameOuterShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    archedFrameGeo.center();

    // Vibrant Door Colors from Video:
    // 01: Blue, 02: Dark Slate, 03: Green, 04: Orange, 05: Crimson, 06: Walnut, 07: Violet, 08: Teal
    const videoDoorColors = [
      '#1d4ed8', // 01 Web Dev: Vivid Cobalt Blue
      '#1e293b', // 02 Search Optimization: Dark Slate Charcoal
      '#15803d', // 03 Social Media / UI: Emerald Forest Green
      '#ea580c', // 04 UI/UX & Branding: Warm Amber Orange
      '#991b1b', // 05 Video Editing: Deep Wine Red
      '#78350f', // 06 Motion Graphics / 3D: Warm Smoked Walnut
      '#4338ca', // 07 3D & Blender: Vibrant Royal Indigo
      '#0d9488', // 08 AI Automation: Modern Jade Teal
    ];

    SERVICES_DOORS_DATA.forEach((service, i) => {
      // Position doors side-by-side with slight arc depth
      const xPos = (i - (total - 1) / 2) * this.DOOR_SPACING;
      const arcZ = -Math.abs(xPos) * 0.08; // Gentle room curvature
      const rootGroup = new THREE.Group();
      rootGroup.position.set(xPos, 1.05, arcZ);

      // --- 1. Arched Door Frame ---
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x222329,
        roughness: 0.7,
        metalness: 0.1,
      });
      const frameMesh = new THREE.Mesh(archedFrameGeo, frameMat);
      frameMesh.position.set(0, 0, 0);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      rootGroup.add(frameMesh);

      // --- 2. Vibrant Arched Door Leaf ---
      const hexColor = videoDoorColors[i] || service.preset.doorColor;
      const doorMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hexColor),
        roughness: 0.38,
        metalness: 0.08,
        clearcoat: 0.32,
        clearcoatRoughness: 0.22,
        map: this.textures.woodAlbedo,
        bumpMap: this.textures.woodBump,
        bumpScale: 0.005,
      });

      const doorLeafMesh = new THREE.Mesh(archedDoorGeo, doorMat);
      doorLeafMesh.castShadow = true;
      doorLeafMesh.receiveShadow = true;

      // --- 3. Golden Brass Nameplate on Center of Door (matching video) ---
      const plaqueCanvas = document.createElement('canvas');
      plaqueCanvas.width = 512;
      plaqueCanvas.height = 160;
      const pctx = plaqueCanvas.getContext('2d')!;

      // Shiny Gold gradient
      const goldGrad = pctx.createLinearGradient(0, 0, 512, 160);
      goldGrad.addColorStop(0, '#fef08a');
      goldGrad.addColorStop(0.3, '#eab308');
      goldGrad.addColorStop(0.7, '#ca8a04');
      goldGrad.addColorStop(1, '#a16207');
      pctx.fillStyle = goldGrad;
      pctx.roundRect(8, 8, 496, 144, 24);
      pctx.fill();

      pctx.strokeStyle = '#fef9c3';
      pctx.lineWidth = 6;
      pctx.roundRect(14, 14, 484, 132, 20);
      pctx.stroke();

      // Title in clean typography
      pctx.fillStyle = '#0f172a';
      pctx.font = 'bold 46px "Inter", system-ui, sans-serif';
      pctx.textAlign = 'center';
      pctx.textBaseline = 'middle';
      pctx.fillText(service.name, 256, 82);

      const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
      plaqueTex.colorSpace = THREE.SRGBColorSpace;
      const plaqueMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.15),
        new THREE.MeshStandardMaterial({
          map: plaqueTex,
          metalness: 0.95,
          roughness: 0.25,
        })
      );
      plaqueMesh.position.set(0, 0.18, thickness / 2 + 0.015);

      // --- 4. Golden Lever Handle ---
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.95,
        roughness: 0.22,
      });
      const handlePivot = new THREE.Group();
      handlePivot.position.set(doorW / 2 - 0.12, -0.12, thickness / 2 + 0.015);

      const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.012), handleMat);
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.13, 16), handleMat);
      lever.rotation.z = Math.PI / 2;
      lever.position.set(-0.05, 0.04, 0.035);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.035, 12), handleMat);
      stem.rotation.x = Math.PI / 2;
      stem.position.set(0, 0.04, 0.015);
      handlePivot.add(backplate, lever, stem);

      // --- 5. Left Hinge Pivot (Door Leaf Swings on Left Hinge Edge) ---
      const hingePivot = new THREE.Group();
      hingePivot.position.set(-doorW / 2, 0, 0); // Origin on hinge

      const leafInner = new THREE.Group();
      leafInner.position.set(doorW / 2, 0, 0);
      leafInner.add(doorLeafMesh, plaqueMesh, handlePivot);
      hingePivot.add(leafInner);
      rootGroup.add(hingePivot);

      // --- 6. Indoor Warm Light & Volumetric Floor Spill ---
      const indoorLight = new THREE.PointLight(0xffe89e, 0, 4.2, 1.8);
      indoorLight.position.set(0, 0.2, -0.4);

      // Volumetric light beam through doorway
      const beamGeo = new THREE.ConeGeometry(0.65, 1.5, 16, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffedd5,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const indoorLightBeam = new THREE.Mesh(beamGeo, beamMat);
      indoorLightBeam.position.set(0, -0.2, -0.1);

      rootGroup.add(indoorLight, indoorLightBeam);

      // Floor Shadow / Contact Reflection
      const shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.35),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
      );
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -1.04, 0.1);
      rootGroup.add(shadowMesh);

      this.scene.add(rootGroup);

      this.doors.push({
        index: i,
        service,
        xPos,
        rootGroup,
        hingePivot,
        handlePivot,
        doorLeafMesh,
        indoorLight,
        indoorLightBeam,
        currentDoorAngle: 0,
        targetDoorAngle: 0,
        currentHandleAngle: 0,
        targetHandleAngle: 0,
        currentLightIntensity: 0,
        targetLightIntensity: 0,
        wasOpen: false,
      });
    });
  }

  // Switch between Overview Mode (all doors) and Focused Door Mode (exact like video)
  public setOverviewMode(overview: boolean) {
    this.isOverview = overview;
    if (overview) {
      doorAudio.playDoorClose();
      this.targetCameraX = 0;
      this.targetCameraY = 1.05;
      this.targetCameraZ = 5.2; // Full overview showing all colorful arched doors
      // Close all doors in overview
      this.doors.forEach((d) => {
        d.targetDoorAngle = 0;
        d.targetHandleAngle = 0;
        d.targetLightIntensity = 0;
        d.wasOpen = false;
      });
    } else {
      this.focusDoor(this.activeIndex);
    }
  }

  // Focus on a specific door (matching video at 00:05)
  public focusDoor(index: number) {
    if (index < 0 || index >= this.doors.length) return;
    this.activeIndex = index;
    this.isOverview = false;
    const door = this.doors[index];

    doorAudio.playDoorOpen();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Door is positioned on the left side of the frame on desktop, centered on mobile
    const camOffset = isMobile ? 0 : 0.65;
    this.targetCameraX = door.xPos + camOffset;
    this.targetCameraY = 1.05;
    this.targetCameraZ = isMobile ? 3.4 : 2.85;

    // Move hanging lamp near the active door on the right
    this.hangingLampGroup.position.x = door.xPos + 1.25;

    this.doors.forEach((d, i) => {
      if (i === index) {
        d.targetHandleAngle = 0.42; // Latch down ~25 deg
        d.targetDoorAngle = 1.68; // Swing open ~96-100 deg
        d.targetLightIntensity = 3.6; // Warm light spill
        d.wasOpen = true;
      } else {
        d.targetDoorAngle = 0;
        d.targetHandleAngle = 0;
        d.targetLightIntensity = 0;
        d.wasOpen = false;
      }
    });

    this.onActiveIndexChange?.(index);
  }

  // Track scroll timeline S in [0, 1]
  public setScrollProgress(progress: number) {
    if (this.isTransitioning) return;

    const total = this.doors.length;
    // Scaled progress
    const scaled = Math.max(0, Math.min(total - 0.001, progress * total));
    const activeIdx = Math.floor(scaled);
    const subProgress = scaled - activeIdx; // 0 to 1 within this door

    if (activeIdx !== this.activeIndex) {
      this.activeIndex = activeIdx;
      this.onActiveIndexChange?.(activeIdx);
    }

    const activeDoor = this.doors[activeIdx];
    if (activeDoor) {
      // Smoothly frame active door with right wall text area
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const camOffset = isMobile ? 0 : 0.65;
      const nextDoor = this.doors[Math.min(total - 1, activeIdx + 1)];
      const nextX = nextDoor ? nextDoor.xPos : activeDoor.xPos;
      this.targetCameraX = THREE.MathUtils.lerp(
        activeDoor.xPos + camOffset,
        nextX + camOffset,
        Math.pow(subProgress, 2.5) * 0.35
      );
      this.targetCameraZ = isMobile ? 3.4 : 2.85;
      this.targetCameraY = 1.05;
      this.hangingLampGroup.position.x = activeDoor.xPos + 1.25;
    }

    // Door open/close audio and swing timeline
    this.doors.forEach((door, i) => {
      if (i === activeIdx) {
        if (subProgress < 0.12) {
          door.targetHandleAngle = (subProgress / 0.12) * 0.42;
          door.targetDoorAngle = 0;
          door.targetLightIntensity = 0;
        } else if (subProgress < 0.58) {
          const tOpen = (subProgress - 0.12) / 0.46;
          const eased = Math.sin((tOpen * Math.PI) / 2);
          door.targetHandleAngle = 0.42;
          door.targetDoorAngle = eased * 1.68;
          door.targetLightIntensity = eased * 3.6;

          // Trigger door open audio once
          if (!door.wasOpen && tOpen > 0.1) {
            door.wasOpen = true;
            doorAudio.playDoorOpen();
          }
        } else if (subProgress < 0.86) {
          door.targetHandleAngle = 0.08;
          door.targetDoorAngle = 1.68;
          door.targetLightIntensity = 3.6;
        } else {
          // Closing
          const tClose = (subProgress - 0.86) / 0.14;
          const eased = Math.cos((tClose * Math.PI) / 2);
          door.targetHandleAngle = 0;
          door.targetDoorAngle = eased * 1.68;
          door.targetLightIntensity = eased * 3.6;

          // Trigger door close audio once
          if (door.wasOpen && tClose > 0.4) {
            door.wasOpen = false;
            doorAudio.playDoorClose();
          }
        }
      } else {
        if (door.wasOpen) {
          door.wasOpen = false;
          doorAudio.playDoorClose();
        }
        door.targetDoorAngle = 0;
        door.targetHandleAngle = 0;
        door.targetLightIntensity = 0;
      }
    });
  }

  // Walkthrough zoom-in transition into service page
  public startWalkthroughTransition(onComplete: () => void) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    doorAudio.playDoorOpen();
    const activeDoor = this.doors[this.activeIndex];
    if (activeDoor) {
      activeDoor.targetDoorAngle = 1.95; // Swing wide open
      activeDoor.targetLightIntensity = 6.0;
    }

    const duration = 850;
    const startTime = performance.now();

    const step = (time: number) => {
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);

      if (activeDoor) {
        this.targetCameraX = activeDoor.xPos;
        this.currentCameraZ = THREE.MathUtils.lerp(2.85, 0.4, Math.pow(p, 2.2));
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  // Pointer move for subtle parallax
  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.pointerParallaxX = this.mouse.x * 0.16;
    this.pointerParallaxY = this.mouse.y * 0.08;
  };

  // Click on door
  private onClick = () => {
    if (this.isTransitioning) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr.parent) {
        const matched = this.doors.find((d) => d.rootGroup === curr);
        if (matched) {
          if (!this.isOverview && matched.index === this.activeIndex) {
            // Already focused: open service
            this.onDoorClick?.(matched.service);
          } else {
            // Focus on clicked door
            this.focusDoor(matched.index);
          }
          return;
        }
        curr = curr.parent;
      }
    }
  };

  public setTheme(isDarkMode: boolean) {
    const wallColor = isDarkMode ? 0x141518 : 0xe7e3db;
    const floorColor = isDarkMode ? 0x0c0d10 : 0xd3cec4;
    (this.backWall.material as THREE.MeshStandardMaterial).color.setHex(wallColor);
    (this.floorMesh.material as THREE.MeshStandardMaterial).color.setHex(floorColor);
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

  // Render Loop
  private renderLoop = (time: number) => {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    if (!this.isVisible || this.isContextLost || document.hidden) return;

    const delta = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // Camera Gliding & Damping
    this.currentCameraX = THREE.MathUtils.damp(this.currentCameraX, this.targetCameraX, 5.0, delta);
    this.currentCameraY = THREE.MathUtils.damp(this.currentCameraY, this.targetCameraY, 5.0, delta);
    this.currentCameraZ = THREE.MathUtils.damp(this.currentCameraZ, this.targetCameraZ, 4.5, delta);

    this.smoothPointerX = THREE.MathUtils.damp(this.smoothPointerX, this.pointerParallaxX, 4.0, delta);
    this.smoothPointerY = THREE.MathUtils.damp(this.smoothPointerY, this.pointerParallaxY, 4.0, delta);

    this.camera.position.x = this.currentCameraX + this.smoothPointerX;
    this.camera.position.y = this.currentCameraY + this.smoothPointerY;
    this.camera.position.z = this.currentCameraZ;
    this.camera.lookAt(this.currentCameraX, this.currentCameraY, 0);

    // Subtle gentle swinging of hanging lightbulb
    const lampSway = Math.sin(time * 0.0018) * 0.035;
    this.hangingLampGroup.rotation.z = lampSway;

    // Animate Doors
    this.doors.forEach((door) => {
      door.currentDoorAngle = THREE.MathUtils.damp(door.currentDoorAngle, door.targetDoorAngle, 6.0, delta);
      door.hingePivot.rotation.y = door.currentDoorAngle;

      door.currentHandleAngle = THREE.MathUtils.damp(door.currentHandleAngle, door.targetHandleAngle, 10.0, delta);
      door.handlePivot.rotation.z = -door.currentHandleAngle;

      door.currentLightIntensity = THREE.MathUtils.damp(door.currentLightIntensity, door.targetLightIntensity, 6.0, delta);
      door.indoorLight.intensity = door.currentLightIntensity;

      const beamMat = door.indoorLightBeam.material as THREE.MeshBasicMaterial;
      beamMat.opacity = (door.currentLightIntensity / 3.6) * 0.22;
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

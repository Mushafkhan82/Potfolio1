import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Eye, Layers, Palette, RotateCw, Minimize2, Maximize2 } from 'lucide-react';
import { bindWebGLContextHandlers, disposeThreeScene } from './doors/threeCleanup.ts';

// Scratch objects outside tick loop to prevent GC
const _vec3 = new THREE.Vector3();

interface Studio3DSceneProps {
  onClose?: () => void;
}

export const Studio3DScene: React.FC<Studio3DSceneProps> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedVal, setExplodedVal] = useState<number>(0);
  const [finish, setFinish] = useState<'titanium' | 'obsidian' | 'gold' | 'silver'>('obsidian');
  const [cameraView, setCameraView] = useState<'hero' | 'close' | 'top' | 'sensor'>('hero');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);

  // References for live updates inside loop
  const stateRef = useRef({
    exploded: 0,
    finish: 'obsidian',
    targetCameraPos: new THREE.Vector3(3.6, 2.4, 4.2),
    targetLookAt: new THREE.Vector3(0, 0.4, 0),
    autoRotate: true,
  });

  useEffect(() => {
    stateRef.current.exploded = explodedVal;
  }, [explodedVal]);

  useEffect(() => {
    stateRef.current.finish = finish;
  }, [finish]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (cameraView === 'hero') {
      stateRef.current.targetCameraPos.set(3.8, 2.4, 4.4);
      stateRef.current.targetLookAt.set(0, 0.4, 0);
    } else if (cameraView === 'close') {
      stateRef.current.targetCameraPos.set(1.4, 0.7, 1.8);
      stateRef.current.targetLookAt.set(0, 0.4, 0.3);
    } else if (cameraView === 'top') {
      stateRef.current.targetCameraPos.set(0.1, 5.0, 0.2);
      stateRef.current.targetLookAt.set(0, 0, 0);
    } else if (cameraView === 'sensor') {
      stateRef.current.targetCameraPos.set(0, 0.6, 2.4);
      stateRef.current.targetLookAt.set(0, 0.6, 0);
    }
  }, [cameraView]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f1ea);
    scene.fog = new THREE.FogExp2(0xf4f1ea, 0.032);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(3.8, 2.4, 4.4);

    // 2. WebGL Renderer with PBR pipeline
    const isMobileViewport = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isMobileViewport ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff7eb, 3.0);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      const shadowSize = isMobileViewport ? 512 : 1024;
      keyLight.shadow.mapSize.width = shadowSize;
      keyLight.shadow.mapSize.height = shadowSize;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xffffff, 0xd8d2c7, 1.35);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x9bd628, 1.4);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    controls.minDistance = 1.0;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0.4, 0);

    // 6. Contact Shadow & Ground Grid
    const contactShadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(17,17,17,0.42)');
      grad.addColorStop(0.5, 'rgba(17,17,17,0.14)');
      grad.addColorStop(1, 'rgba(17,17,17,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    scene.add(shadowMesh);

    // Floor Pedestal Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x6baa00, 0xdcd6cb);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // 7. Composite Procedural Model (3–12 parts grouped in THREE.Group)
    // Represents a modular 8K Studio Cine Rig & Gimbal
    const rigGroup = new THREE.Group();
    scene.add(rigGroup);

    // Dynamic material finishes
    const materialLibrary: Record<string, THREE.MeshStandardMaterial> = {
      obsidian: new THREE.MeshStandardMaterial({
        color: 0x171918,
        metalness: 0.88,
        roughness: 0.22,
      }),
      titanium: new THREE.MeshStandardMaterial({
        color: 0x7a8077,
        metalness: 0.92,
        roughness: 0.18,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xdfb448,
        metalness: 0.95,
        roughness: 0.15,
      }),
      silver: new THREE.MeshStandardMaterial({
        color: 0xd8ded6,
        metalness: 0.95,
        roughness: 0.12,
      }),
    };

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xc6f432,
      emissive: 0xc6f432,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.5,
    });

    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x112211,
      metalness: 0.1,
      roughness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 1,
      ior: 1.65,
    });

    // Part 1: Main Camera Body (Chassis)
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.55, 0.8);
    const bodyMesh = new THREE.Mesh(bodyGeo, materialLibrary.obsidian);
    bodyMesh.position.set(0, 0.55, 0);
    bodyMesh.castShadow = !isSoftwareGl;
    bodyMesh.receiveShadow = !isSoftwareGl;
    rigGroup.add(bodyMesh);

    // Part 2: Lens Barrel with Aperture Knurl
    const lensGroup = new THREE.Group();
    lensGroup.position.set(0, 0.55, 0.55);

    const barrelGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.5, 32);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, materialLibrary.obsidian);
    barrelMesh.castShadow = !isSoftwareGl;
    lensGroup.add(barrelMesh);

    // Aperture Ring Accent
    const ringGeo = new THREE.TorusGeometry(0.25, 0.02, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, accentMat);
    ringMesh.position.set(0, 0, 0.15);
    lensGroup.add(ringMesh);

    // Front Glass Element
    const glassGeo = new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
    glassGeo.rotateX(Math.PI / 2);
    const glassMesh = new THREE.Mesh(glassGeo, lensGlassMat);
    glassMesh.position.set(0, 0, 0.25);
    lensGroup.add(glassMesh);

    rigGroup.add(lensGroup);

    // Part 3: Top Modular Carbon Handle
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0, 0.95, 0);

    const handleStemGeo = new THREE.BoxGeometry(0.12, 0.25, 0.15);
    const stemFront = new THREE.Mesh(handleStemGeo, materialLibrary.obsidian);
    stemFront.position.set(0, -0.05, 0.25);
    handleGroup.add(stemFront);

    const stemBack = new THREE.Mesh(handleStemGeo, materialLibrary.obsidian);
    stemBack.position.set(0, -0.05, -0.25);
    handleGroup.add(stemBack);

    const topBarGeo = new THREE.BoxGeometry(0.12, 0.08, 0.7);
    const topBar = new THREE.Mesh(topBarGeo, materialLibrary.obsidian);
    topBar.position.set(0, 0.08, 0);
    handleGroup.add(topBar);

    rigGroup.add(handleGroup);

    // Part 4: Director Monitor Display (Tilting)
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(-0.48, 0.7, 0);
    monitorGroup.rotation.y = -Math.PI / 4;

    const monitorHousingGeo = new THREE.BoxGeometry(0.04, 0.35, 0.55);
    const monitorHousing = new THREE.Mesh(monitorHousingGeo, materialLibrary.obsidian);
    monitorGroup.add(monitorHousing);

    // Monitor screen with procedural glowing studio readout
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 160;
    const sCtx = screenCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#080c08';
      sCtx.fillRect(0, 0, 256, 160);
      sCtx.fillStyle = '#c6f432';
      sCtx.font = 'bold 16px monospace';
      sCtx.fillText('REC ● 8K 60FPS RAW', 16, 32);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = '12px monospace';
      sCtx.fillText('ISO 800  f/1.8  1/120', 16, 60);
      sCtx.fillText('STUDIO RIG: ACTIVE', 16, 84);
      sCtx.strokeStyle = 'rgba(198,244,50,0.5)';
      sCtx.lineWidth = 2;
      sCtx.strokeRect(16, 100, 224, 40);
      sCtx.fillText('FOCUS: PEAKING 99%', 24, 126);
    }
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), screenMat);
    screenMesh.rotation.y = -Math.PI / 2;
    screenMesh.position.x = -0.025;
    monitorGroup.add(screenMesh);

    rigGroup.add(monitorGroup);

    // Part 5: Side V-Mount Battery Pack
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(0, 0.55, -0.52);
    const batteryGeo = new THREE.BoxGeometry(0.55, 0.42, 0.2);
    const batteryMesh = new THREE.Mesh(batteryGeo, materialLibrary.obsidian);
    batteryGroup.add(batteryMesh);
    rigGroup.add(batteryGroup);

    // Part 6: Motorized Gimbal Outer Yaw Arm & Base Plate
    const gimbalBase = new THREE.Group();
    gimbalBase.position.set(0, 0.15, 0);

    const basePlateGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.1, 32);
    const basePlate = new THREE.Mesh(basePlateGeo, materialLibrary.obsidian);
    basePlate.castShadow = !isSoftwareGl;
    gimbalBase.add(basePlate);

    const rollRingGeo = new THREE.TorusGeometry(0.65, 0.035, 16, 48, Math.PI);
    rollRingGeo.rotateZ(-Math.PI / 2);
    const rollRing = new THREE.Mesh(rollRingGeo, accentMat);
    rollRing.position.set(0, 0.4, 0);
    gimbalBase.add(rollRing);

    rigGroup.add(gimbalBase);

    // 8. Animation Loop
    let animationFrameId = 0;
    let isContextLost = false;
    const clock = new THREE.Clock();

    const unbindContext = bindWebGLContextHandlers(
      renderer.domElement,
      () => {
        isContextLost = true;
      },
      () => {
        isContextLost = false;
        clock.getDelta();
        handleResize();
      }
    );

    const onVisibilityChange = () => {
      if (!document.hidden) {
        clock.getDelta();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (isContextLost || document.hidden) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const state = stateRef.current;

      // Update material finish across meshes
      const activeMat = materialLibrary[state.finish] || materialLibrary.obsidian;
      bodyMesh.material = activeMat;
      barrelMesh.material = activeMat;
      topBar.material = activeMat;
      monitorHousing.material = activeMat;
      batteryMesh.material = activeMat;
      basePlate.material = activeMat;

      // Smooth Exploded View animation with exponential damping
      const t = state.exploded;
      lensGroup.position.z = THREE.MathUtils.damp(lensGroup.position.z, 0.55 + t * 0.7, 8, delta);
      handleGroup.position.y = THREE.MathUtils.damp(handleGroup.position.y, 0.95 + t * 0.5, 8, delta);
      monitorGroup.position.x = THREE.MathUtils.damp(monitorGroup.position.x, -0.48 - t * 0.6, 8, delta);
      batteryGroup.position.z = THREE.MathUtils.damp(batteryGroup.position.z, -0.52 - t * 0.6, 8, delta);
      gimbalBase.position.y = THREE.MathUtils.damp(gimbalBase.position.y, 0.15 - t * 0.25, 8, delta);

      // Auto-rotation when not manual view lock
      if (state.autoRotate) {
        rigGroup.rotation.y += delta * 0.35;
      }

      // Smooth camera gliding
      camera.position.x = THREE.MathUtils.damp(camera.position.x, state.targetCameraPos.x, 5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, state.targetCameraPos.y, 5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, state.targetCameraPos.z, 5, delta);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, state.targetLookAt.x, 5, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, state.targetLookAt.y, 5, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, state.targetLookAt.z, 5, delta);

      controls.update();
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard shortcut 'H' to toggle HUD
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setControlsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unbindContext();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] sm:h-[620px] rounded-3xl overflow-hidden border border-[#E7E3DA] bg-[#F4F1EA] shadow-[0_12px_40px_-15px_rgba(17,17,17,0.12)]">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Bar Spec Badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#E7E3DA] text-[#111111] font-mono text-[10px] sm:text-xs pointer-events-none max-w-[calc(100%-6rem)] truncate shadow-xs">
        <span className="w-2 h-2 rounded-full bg-[#6BAA00] shrink-0" />
        <span className="font-semibold tracking-wider uppercase truncate">Interactive 3D Rig</span>
        <span className="hidden sm:inline text-[#E7E3DA]">|</span>
        <span className="hidden sm:inline text-[#6BAA00] font-semibold">Three.js Studio PBR</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 min-h-[44px] px-3.5 py-2 rounded-full bg-white/95 border border-[#E7E3DA] text-[#111111] hover:border-[#6BAA00] font-mono text-xs transition-colors cursor-pointer shadow-xs"
        >
          ✕ Close
        </button>
      )}

      {/* Collapsible Zen/Cinema Mode Button */}
      <div className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all ${controlsCollapsed ? 'bottom-4' : 'bottom-[136px] sm:bottom-[84px]'}`}>
        <button
          type="button"
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-white/95 border border-[#E7E3DA] text-[#5B5B56] hover:text-[#111111] font-mono text-[11px] flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          {controlsCollapsed ? (
            <>
              <Maximize2 size={12} /> <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <Minimize2 size={12} /> <span>Hide Controls (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Unified Bottom Control Dock (Consolidated, Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[760px] transition-transform duration-300 ease-out ${
          controlsCollapsed ? 'translate-y-40 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="bg-white/95 border border-[#E7E3DA] rounded-2xl p-2.5 sm:p-3 shadow-lg text-[#111111] flex flex-wrap items-center justify-between gap-2 sm:gap-3 font-mono text-xs">
          {/* Exploded View Slider */}
          <div className="flex items-center gap-2 min-h-[44px]">
            <Layers size={14} className="text-[#6BAA00]" />
            <span className="text-[11px] text-[#5B5B56] uppercase">Explode</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedVal}
              onChange={(e) => setExplodedVal(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-6 accent-[#6BAA00] cursor-pointer"
            />
          </div>

          {/* Finishes Swatch */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            <Palette size={14} className="text-[#6BAA00] shrink-0" />
            {(['obsidian', 'titanium', 'gold', 'silver'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFinish(f)}
                className={`min-h-[38px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer shrink-0 ${
                  finish === f
                    ? 'bg-[#B6F500] text-[#111111]'
                    : 'bg-[#FAF8F4] hover:bg-[#E7E3DA]/50 text-[#5B5B56] border border-[#E7E3DA]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Camera View Angle Pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            <Eye size={14} className="text-[#6BAA00] shrink-0" />
            {(['hero', 'close', 'top', 'sensor'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCameraView(view)}
                className={`min-h-[38px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg text-[10px] uppercase transition-all cursor-pointer shrink-0 ${
                  cameraView === view
                    ? 'bg-[#111111] text-white font-bold'
                    : 'bg-[#FAF8F4] hover:bg-[#E7E3DA]/50 text-[#5B5B56] border border-[#E7E3DA]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Auto-Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            aria-label="Toggle Continuous Rotation"
            className={`w-11 h-11 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
              autoRotate ? 'border-[#6BAA00] text-[#6BAA00] bg-[#B6F500]/20' : 'border-[#E7E3DA] text-[#5B5B56]'
            }`}
            title="Toggle Continuous Rotation"
          >
            <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

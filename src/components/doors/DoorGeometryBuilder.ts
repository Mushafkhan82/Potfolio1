/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DoorMaterialPreset } from './doorsConfig.ts';
import { DoorTextureManager } from './DoorTextureManager.ts';

export class DoorGeometryBuilder {
  public rootGroup: THREE.Group;
  public hingePivotGroup: THREE.Group;
  public handlePivotFront: THREE.Group;
  public handlePivotBack: THREE.Group;
  public doorMeshGroup: THREE.Group;
  public frameMeshGroup: THREE.Group;
  public plaqueMesh: THREE.Mesh | null = null;

  // Material instances for dynamic uniform/color updating
  public doorMaterial: THREE.MeshPhysicalMaterial;
  public frameMaterial: THREE.MeshPhysicalMaterial;
  public handleMaterial: THREE.MeshPhysicalMaterial;
  public plaqueMaterial: THREE.MeshPhysicalMaterial;

  constructor(private textures: DoorTextureManager) {
    this.rootGroup = new THREE.Group();
    this.hingePivotGroup = new THREE.Group();
    this.handlePivotFront = new THREE.Group();
    this.handlePivotBack = new THREE.Group();
    this.doorMeshGroup = new THREE.Group();
    this.frameMeshGroup = new THREE.Group();

    // Default starting materials
    this.doorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e2024,
      roughness: 0.38,
      metalness: 0.04,
      clearcoat: 0.28,
      clearcoatRoughness: 0.25,
      map: this.textures.woodAlbedo || undefined,
      bumpMap: this.textures.woodBump || undefined,
      bumpScale: 0.015,
    });

    this.frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x17181a,
      roughness: 0.45,
      metalness: 0.04,
      bumpMap: this.textures.woodBump || undefined,
      bumpScale: 0.008,
    });

    this.handleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcfb57a,
      roughness: 0.22,
      metalness: 0.96,
      roughnessMap: this.textures.metalScratch || undefined,
    });

    this.plaqueMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.25,
      metalness: 0.92,
      map: this.textures.getPlaqueTexture('01'),
    });

    this.build();
  }

  private build() {
    const DOOR_W = 1.0;
    const DOOR_H = 2.2;
    const DOOR_D = 0.046;

    // 1. Build the Architrave Door Frame
    this.buildFrame(DOOR_W, DOOR_H, DOOR_D);

    // 2. Build the Door Leaf with Beveled Raised Panels
    this.buildDoorLeaf(DOOR_W, DOOR_H, DOOR_D);

    // 3. Build Hardware (Lever handle, backplates, screws, hinges, plaque)
    this.buildHardware(DOOR_W, DOOR_H, DOOR_D);

    // The hinge pivot is located at x = -DOOR_W / 2 = -0.5m
    const HINGE_X = -DOOR_W * 0.5;
    this.hingePivotGroup.position.set(HINGE_X, 0, 0);

    // Offset door leaf so its left edge sits exactly at the pivot
    this.doorMeshGroup.position.set(DOOR_W * 0.5, 0, 0);
    this.hingePivotGroup.add(this.doorMeshGroup);

    this.rootGroup.add(this.frameMeshGroup);
    this.rootGroup.add(this.hingePivotGroup);
  }

  private buildFrame(doorW: number, doorH: number, doorD: number) {
    const CASING_W = 0.095;
    const CASING_D = 0.14;
    const GAP = 0.008;

    const innerW = doorW + GAP * 2;
    const innerH = doorH + GAP;

    // Left Jamb
    const leftJambGeo = new THREE.BoxGeometry(CASING_W, innerH, CASING_D);
    const leftJamb = new THREE.Mesh(leftJambGeo, this.frameMaterial);
    leftJamb.position.set(-innerW * 0.5 - CASING_W * 0.5, 0, 0);
    leftJamb.castShadow = true;
    leftJamb.receiveShadow = true;
    this.frameMeshGroup.add(leftJamb);

    // Right Jamb
    const rightJambGeo = new THREE.BoxGeometry(CASING_W, innerH, CASING_D);
    const rightJamb = new THREE.Mesh(rightJambGeo, this.frameMaterial);
    rightJamb.position.set(innerW * 0.5 + CASING_W * 0.5, 0, 0);
    rightJamb.castShadow = true;
    rightJamb.receiveShadow = true;
    this.frameMeshGroup.add(rightJamb);

    // Top Header Lintel
    const topLintelGeo = new THREE.BoxGeometry(innerW + CASING_W * 2, CASING_W, CASING_D);
    const topLintel = new THREE.Mesh(topLintelGeo, this.frameMaterial);
    topLintel.position.set(0, innerH * 0.5 + CASING_W * 0.5, 0);
    topLintel.castShadow = true;
    topLintel.receiveShadow = true;
    this.frameMeshGroup.add(topLintel);

    // Stepped decorative architrave moulding (front face bevels)
    const mouldingShape = new THREE.Shape();
    mouldingShape.moveTo(-CASING_W * 0.5, 0);
    mouldingShape.lineTo(CASING_W * 0.5, 0);
    mouldingShape.lineTo(CASING_W * 0.35, 0.02);
    mouldingShape.lineTo(-CASING_W * 0.35, 0.02);
    mouldingShape.closePath();

    const mouldExtrudeSettings = {
      depth: innerH + CASING_W,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    };

    // Sub-rebate frame stops
    const stopGeo = new THREE.BoxGeometry(0.02, innerH, 0.025);
    const leftStop = new THREE.Mesh(stopGeo, this.frameMaterial);
    leftStop.position.set(-innerW * 0.5 + 0.01, 0, -doorD * 0.5 - 0.01);
    this.frameMeshGroup.add(leftStop);

    const rightStop = new THREE.Mesh(stopGeo, this.frameMaterial);
    rightStop.position.set(innerW * 0.5 - 0.01, 0, -doorD * 0.5 - 0.01);
    this.frameMeshGroup.add(rightStop);
  }

  private buildDoorLeaf(doorW: number, doorH: number, doorD: number) {
    // 1. Main slab body
    const slabGeo = new THREE.BoxGeometry(doorW, doorH, doorD);
    const slabMesh = new THREE.Mesh(slabGeo, this.doorMaterial);
    slabMesh.castShadow = true;
    slabMesh.receiveShadow = true;
    this.doorMeshGroup.add(slabMesh);

    // 2. Beveled Raised Panels (Classic 2-panel configuration from Preview01/03)
    const PANEL_W = 0.70;
    const UPPER_H = 1.08;
    const LOWER_H = 0.64;
    const PANEL_PROTRUSION = 0.007;

    // Upper Raised Panel (Front & Back)
    this.addRaisedPanel(PANEL_W, UPPER_H, doorD * 0.5 + PANEL_PROTRUSION * 0.5, 0.38, PANEL_PROTRUSION, true);
    this.addRaisedPanel(PANEL_W, UPPER_H, -doorD * 0.5 - PANEL_PROTRUSION * 0.5, 0.38, PANEL_PROTRUSION, false);

    // Lower Raised Panel (Front & Back)
    this.addRaisedPanel(PANEL_W, LOWER_H, doorD * 0.5 + PANEL_PROTRUSION * 0.5, -0.62, PANEL_PROTRUSION, true);
    this.addRaisedPanel(PANEL_W, LOWER_H, -doorD * 0.5 - PANEL_PROTRUSION * 0.5, -0.62, PANEL_PROTRUSION, false);

    // Stiles and Rails perimeter moulding frames around the panels
    this.addPanelMoulding(PANEL_W + 0.04, UPPER_H + 0.04, 0.38, doorD);
    this.addPanelMoulding(PANEL_W + 0.04, LOWER_H + 0.04, -0.62, doorD);
  }

  private addRaisedPanel(
    w: number,
    h: number,
    z: number,
    y: number,
    thickness: number,
    front: boolean
  ) {
    // Trapezoidal chamfered panel geometry
    const shape = new THREE.Shape();
    const bevel = 0.04;
    const hw = w * 0.5;
    const hh = h * 0.5;

    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel * 0.4,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();

    const mesh = new THREE.Mesh(geom, this.doorMaterial);
    mesh.position.set(0, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.doorMeshGroup.add(mesh);
  }

  private addPanelMoulding(w: number, h: number, y: number, doorD: number) {
    const frameThickness = 0.024;
    const frameDepth = 0.008;

    // Top moulding rail
    const topGeo = new THREE.BoxGeometry(w, frameThickness, frameDepth);
    const topMesh = new THREE.Mesh(topGeo, this.doorMaterial);
    topMesh.position.set(0, y + h * 0.5, doorD * 0.5 + frameDepth * 0.5);
    this.doorMeshGroup.add(topMesh);

    // Bottom moulding rail
    const btmMesh = topMesh.clone();
    btmMesh.position.y = y - h * 0.5;
    this.doorMeshGroup.add(btmMesh);

    // Left stile
    const sideGeo = new THREE.BoxGeometry(frameThickness, h, frameDepth);
    const leftMesh = new THREE.Mesh(sideGeo, this.doorMaterial);
    leftMesh.position.set(-w * 0.5, y, doorD * 0.5 + frameDepth * 0.5);
    this.doorMeshGroup.add(leftMesh);

    // Right stile
    const rightMesh = leftMesh.clone();
    rightMesh.position.x = w * 0.5;
    this.doorMeshGroup.add(rightMesh);
  }

  private buildHardware(doorW: number, doorH: number, doorD: number) {
    const HANDLE_X = doorW * 0.38; // 0.38m from door center (near latch edge)
    const HANDLE_Y = 0.02; // Ergonomic height ~1.0m from floor
    const FRONT_Z = doorD * 0.5;
    const BACK_Z = -doorD * 0.5;

    // 1. Classical Lever Handle Assembly (Front Face)
    this.handlePivotFront.position.set(HANDLE_X, HANDLE_Y, FRONT_Z);
    this.buildHandleAssembly(this.handlePivotFront, false);
    this.doorMeshGroup.add(this.handlePivotFront);

    // Back Face Handle (mirrored Z)
    this.handlePivotBack.position.set(HANDLE_X, HANDLE_Y, BACK_Z);
    this.buildHandleAssembly(this.handlePivotBack, true);
    this.doorMeshGroup.add(this.handlePivotBack);

    // 2. Brass/Steel Hinges along the hinge edge (x = -doorW * 0.5)
    this.buildHinges(-doorW * 0.5, doorH, doorD);

    // 3. Engraved Number Plaque (Centered horizontally on upper panel at eye level)
    const plaqueGeo = new THREE.BoxGeometry(0.12, 0.06, 0.006);
    this.plaqueMesh = new THREE.Mesh(plaqueGeo, this.plaqueMaterial);
    this.plaqueMesh.position.set(0, 0.44, FRONT_Z + 0.005);
    this.plaqueMesh.castShadow = true;
    this.doorMeshGroup.add(this.plaqueMesh);
  }

  private buildHandleAssembly(parentGroup: THREE.Group, isBack: boolean) {
    const zDir = isBack ? -1 : 1;

    // Arched Backplate
    const plateShape = new THREE.Shape();
    const pw = 0.056;
    const ph = 0.26;
    const archR = pw * 0.5;

    plateShape.moveTo(-pw * 0.5, -ph * 0.5 + archR);
    plateShape.lineTo(-pw * 0.5, ph * 0.5 - archR);
    plateShape.arc(archR, 0, archR, Math.PI, 0, false);
    plateShape.lineTo(pw * 0.5, -ph * 0.5 + archR);
    plateShape.arc(-archR, 0, archR, 0, Math.PI, false);

    const plateExtrude = {
      depth: 0.006,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.002,
      bevelThickness: 0.002,
    };
    const plateGeom = new THREE.ExtrudeGeometry(plateShape, plateExtrude);
    plateGeom.center();
    const plateMesh = new THREE.Mesh(plateGeom, this.handleMaterial);
    plateMesh.position.set(0, 0, zDir * 0.004);
    plateMesh.rotation.y = isBack ? Math.PI : 0;
    plateMesh.castShadow = true;
    parentGroup.add(plateMesh);

    // Rosette Collar
    const collarGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16);
    collarGeo.rotateX(Math.PI * 0.5);
    const collar = new THREE.Mesh(collarGeo, this.handleMaterial);
    collar.position.set(0, 0.04, zDir * 0.01);
    parentGroup.add(collar);

    // Turned Lever Shank & Spindle (Rotates when latch clicks!)
    const leverGroup = new THREE.Group();
    leverGroup.position.set(0, 0.04, zDir * 0.016);

    const stemGeo = new THREE.CylinderGeometry(0.01, 0.012, 0.045, 12);
    stemGeo.rotateX(Math.PI * 0.5);
    const stem = new THREE.Mesh(stemGeo, this.handleMaterial);
    stem.position.set(0, 0, zDir * 0.022);
    leverGroup.add(stem);

    // Turned Horizontal Handle Bar (extends toward door center)
    const handleLen = 0.125;
    const handleGeo = new THREE.CylinderGeometry(0.009, 0.012, handleLen, 16);
    handleGeo.rotateZ(Math.PI * 0.5);
    const handleBar = new THREE.Mesh(handleGeo, this.handleMaterial);
    // Point inward toward door center
    const xDir = isBack ? 1 : -1;
    handleBar.position.set(xDir * (handleLen * 0.5 - 0.01), 0, zDir * 0.042);
    handleBar.castShadow = true;
    leverGroup.add(handleBar);

    // Spherical finial end
    const finialGeo = new THREE.SphereGeometry(0.013, 12, 12);
    const finial = new THREE.Mesh(finialGeo, this.handleMaterial);
    finial.position.set(xDir * (handleLen - 0.01), 0, zDir * 0.042);
    leverGroup.add(finial);

    // Keyhole escutcheon below
    const keyholeGeo = new THREE.BoxGeometry(0.012, 0.035, 0.003);
    const keyhole = new THREE.Mesh(keyholeGeo, this.handleMaterial);
    keyhole.position.set(0, -0.05, zDir * 0.008);
    parentGroup.add(keyhole);

    // Fastener screws
    const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 8);
    screwGeo.rotateX(Math.PI * 0.5);
    const topScrew = new THREE.Mesh(screwGeo, this.handleMaterial);
    topScrew.position.set(0, 0.10, zDir * 0.008);
    parentGroup.add(topScrew);

    const btmScrew = topScrew.clone();
    btmScrew.position.y = -0.10;
    parentGroup.add(btmScrew);

    parentGroup.add(leverGroup);
  }

  private buildHinges(hingeX: number, doorH: number, doorD: number) {
    const hingePositions = [
      doorH * 0.38,
      0,
      -doorH * 0.38,
    ];

    hingePositions.forEach((y) => {
      const hingeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 16);
      const hinge = new THREE.Mesh(hingeGeo, this.handleMaterial);
      hinge.position.set(hingeX - 0.004, y, 0);
      hinge.castShadow = true;
      this.frameMeshGroup.add(hinge);

      // Top and bottom decorative hinge caps
      const capGeo = new THREE.SphereGeometry(0.012, 12, 12);
      const topCap = new THREE.Mesh(capGeo, this.handleMaterial);
      topCap.position.set(hingeX - 0.004, y + 0.045, 0);
      this.frameMeshGroup.add(topCap);

      const btmCap = topCap.clone();
      btmCap.position.y = y - 0.045;
      this.frameMeshGroup.add(btmCap);
    });
  }

  // Update materials when switching between service doors
  public applyPreset(preset: DoorMaterialPreset, doorIndex: string) {
    // 1. Door Leaf Material
    this.doorMaterial.color.set(preset.doorColor);
    this.doorMaterial.roughness = preset.roughness;
    this.doorMaterial.metalness = preset.metalness;
    this.doorMaterial.clearcoat = preset.clearcoat;
    this.doorMaterial.clearcoatRoughness = preset.clearcoatRoughness;

    if (preset.isWood && this.textures.woodAlbedo) {
      this.doorMaterial.map = this.textures.woodAlbedo;
      this.doorMaterial.bumpMap = this.textures.woodBump;
      this.doorMaterial.bumpScale = preset.grainIntensity;
    } else {
      this.doorMaterial.map = null;
      this.doorMaterial.bumpMap = this.textures.ironBump;
      this.doorMaterial.bumpScale = preset.grainIntensity;
    }
    this.doorMaterial.needsUpdate = true;

    // 2. Frame Material
    this.frameMaterial.color.set(preset.frameColor);
    this.frameMaterial.roughness = preset.roughness + 0.08;
    this.frameMaterial.needsUpdate = true;

    // 3. Hardware Material (Handle & Hinges)
    this.handleMaterial.color.set(preset.handleColor);
    if (preset.handleFinish === 'brass') {
      this.handleMaterial.metalness = 0.95;
      this.handleMaterial.roughness = 0.22;
    } else if (preset.handleFinish === 'black-steel') {
      this.handleMaterial.metalness = 0.85;
      this.handleMaterial.roughness = 0.42;
    } else {
      // satin nickel
      this.handleMaterial.metalness = 0.92;
      this.handleMaterial.roughness = 0.28;
    }
    this.handleMaterial.needsUpdate = true;

    // 4. Plaque Texture
    if (this.plaqueMesh) {
      this.plaqueMaterial.map = this.textures.getPlaqueTexture(doorIndex);
      this.plaqueMaterial.needsUpdate = true;
    }
  }

  public dispose() {
    this.doorMaterial.dispose();
    this.frameMaterial.dispose();
    this.handleMaterial.dispose();
    this.plaqueMaterial.dispose();
  }
}

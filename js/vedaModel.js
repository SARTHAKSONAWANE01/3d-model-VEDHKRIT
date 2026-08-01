import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class VedaModel {
  constructor(onProgress, onLoad) {
    this.group = new THREE.Group();
    this.group.name = 'VedaCharacter';

    this.modelMesh = null;
    this.currentPose = 'hero';
    this.currentExpression = 'happy';
    this.currentOutfit = 'student';

    // Rotation & Physics State
    this.targetRotationY = 0;
    this.targetTilt = { x: 0, z: 0 };
    
    // Jump & Spin Physics State
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.spinAngle = 0;

    // Mouse Tracking State
    this.mouseNormalized = { x: 0, y: 0 };

    // Customization Outfit Materials
    this.materials = [];

    // Load the GLB 3D Character Model
    this.loadGLBModel(onProgress, onLoad);
  }

  loadGLBModel(onProgress, onLoad) {
    const loader = new GLTFLoader();
    
    loader.load(
      './3d cartoon character.glb',
      (gltf) => {
        this.modelMesh = gltf.scene;

        // Scale character height to ~1.8 meters in world space
        const box = new THREE.Box3().setFromObject(this.modelMesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 1.8;
        const scaleFactor = targetHeight / (size.y || 1);
        this.modelMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center on X and Z, set feet at Y = 0 on floor
        const scaledBox = new THREE.Box3().setFromObject(this.modelMesh);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);

        this.modelMesh.position.x = -center.x;
        this.modelMesh.position.z = -center.z;
        this.modelMesh.position.y = -scaledBox.min.y;

        // Preserve & Optimize GLB Textures
        this.modelMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              if (child.material.color) {
                child.material.color.setHex(0xFFFFFF);
              }
              if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.map.needsUpdate = true;
              }
              child.material.roughness = 0.45;
              child.material.metalness = 0.1;
              child.material.needsUpdate = true;
              this.materials.push(child.material);
            }
          }
        });

        this.group.add(this.modelMesh);

        if (onLoad) onLoad(this);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(percent);
        }
      },
      (error) => {
        console.error('Error loading 3D cartoon character GLB model:', error);
        if (onLoad) onLoad(this);
      }
    );
  }

  // --- Real-Time Mouse Head Tracking ---
  updateMouseCursor(mouseX, mouseY) {
    this.mouseNormalized.x = mouseX;
    this.mouseNormalized.y = mouseY;
  }

  celebrateVictory() {
    this.isJumping = true;
    this.jumpVelocity = 0.15;
    this.spinAngle = 0;
    this.setPose('celebrating');
  }

  // Set Poses from Character Reference Sheet
  setPose(poseName) {
    this.currentPose = poseName;
    if (!this.group) return;

    switch (poseName) {
      case 'hero':
        this.targetTilt = { x: 0, z: 0 };
        break;
      case 'wave':
        this.targetTilt = { x: -0.04, z: 0.04 };
        break;
      case 'thumbsup':
        this.targetTilt = { x: 0.04, z: -0.04 };
        break;
      case 'pointing':
        this.targetTilt = { x: 0, z: 0.08 };
        break;
      case 'presenting':
        this.targetTilt = { x: -0.05, z: 0 };
        break;
      case 'tablet':
        this.targetTilt = { x: 0.08, z: 0 };
        break;
      case 'typing':
        this.targetTilt = { x: 0.1, z: 0 };
        break;
      case 'explaining':
        this.targetTilt = { x: -0.04, z: 0.05 };
        break;
      case 'idea':
        this.targetTilt = { x: -0.06, z: 0.06 };
        break;
      case 'walking':
        this.targetTilt = { x: 0.05, z: -0.05 };
        break;
      case 'running':
        this.targetTilt = { x: 0.1, z: -0.08 };
        break;
      case 'jumping':
        this.targetTilt = { x: -0.12, z: 0 };
        break;
      case 'celebrating':
        this.targetTilt = { x: -0.1, z: 0 };
        break;
      default:
        this.targetTilt = { x: 0, z: 0 };
    }
  }

  setExpression(exprName) {
    this.currentExpression = exprName;
  }

  // Set Outfits from Reference Sheet
  setOutfit(outfitName) {
    this.currentOutfit = outfitName;
    if (!this.materials.length) return;

    if (outfitName === 'scientist') {
      this.materials.forEach(mat => {
        if (mat.color) mat.color.setHex(0xE2E8F0);
      });
    } else if (outfitName === 'mentor' || outfitName === 'career') {
      this.materials.forEach(mat => {
        if (mat.color) mat.color.setHex(0x785CFF);
      });
    } else if (outfitName === 'exam') {
      this.materials.forEach(mat => {
        if (mat.color) mat.color.setHex(0xFF6B35);
      });
    } else {
      // Student / Default
      this.materials.forEach(mat => {
        if (mat.color) mat.color.setHex(0xFFFFFF);
      });
    }
  }

  update(time, deltaTime) {
    if (!this.group) return;

    // Idle Breathing
    const breath = Math.sin(time * 2.5) * 0.012;

    // Jump Physics & Celebration Spin
    if (this.isJumping) {
      this.jumpY += this.jumpVelocity;
      this.jumpVelocity -= deltaTime * 0.4;
      this.spinAngle += deltaTime * 12;

      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.spinAngle = 0;
      }
    }

    // Set Final Group Position
    this.group.position.y = breath + this.jumpY;

    // Mouse Head Tracking
    const mouseLookY = this.mouseNormalized.x * 0.35;
    const mouseLookX = -this.mouseNormalized.y * 0.2;

    // Smooth Rotation Lerp
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotationY + mouseLookY + this.spinAngle, deltaTime * 5);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.targetTilt.x + mouseLookX, deltaTime * 4);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, this.targetTilt.z, deltaTime * 4);
  }
}

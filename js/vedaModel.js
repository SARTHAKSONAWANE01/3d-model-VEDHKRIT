import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class VedaModel {
  constructor(onProgress, onLoad) {
    this.group = new THREE.Group();
    this.group.name = 'VedaCharacter';

    this.modelMesh = null;
    this.mixer = null;
    
    // Animation Actions Map
    this.actions = {};
    this.currentAction = null;
    this.activeActionName = 'standstill'; // Initial state: stands straight and still
    this.isAnimationPlaying = false;
    this.animationSpeed = 1.0;

    // Available Action Files in 'model and actions'
    this.actionFiles = {
      greeting: './model and actions/Standing Greeting.fbx',
      clapping: './model and actions/Clapping.fbx',
      excited: './model and actions/Excited.fbx',
      rallying: './model and actions/Rallying.fbx',
      thumbsup: './model and actions/Standing Thumbs Up.fbx'
    };

    this.currentPose = 'hero';
    this.currentExpression = 'happy';
    this.currentOutfit = 'student';
    this.currentPlacement = 'center';
    this.currentSkinTone = 'default';

    // Navigation & Rotation State
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.isNavigating = false;
    this.targetRotationY = 0;
    this.targetTilt = { x: 0, z: 0 };

    // Materials Map
    this.materials = [];
    this.originalColors = new Map();

    this.fbxLoader = new FBXLoader();

    // 1. Load the Base Model Mesh
    this.loadBaseModel(onProgress, onLoad);
  }

  loadBaseModel(onProgress, onLoad) {
    // Load Standing Greeting FBX as base mesh
    this.fbxLoader.load(
      './model and actions/Standing Greeting.fbx',
      (fbx) => {
        this.modelMesh = fbx;

        // Scale character height to ~1.8 meters in world space
        const box = new THREE.Box3().setFromObject(this.modelMesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 1.8;
        const scaleFactor = targetHeight / (size.y || 166.4);
        this.modelMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center on X and Z, set feet at Y = 0 on ground platform
        const scaledBox = new THREE.Box3().setFromObject(this.modelMesh);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);

        this.modelMesh.position.x = -center.x;
        this.modelMesh.position.z = -center.z;
        this.modelMesh.position.y = -scaledBox.min.y;

        // Setup shadows and material tuning
        this.modelMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData = { isVedaCharacter: true };

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat) {
                if (mat.map) {
                  mat.map.colorSpace = THREE.SRGBColorSpace;
                  mat.map.needsUpdate = true;
                }
                if (mat.color) {
                  this.originalColors.set(mat, mat.color.clone());
                }
                if (mat.shininess !== undefined) mat.shininess = 25;
                if (mat.roughness !== undefined) mat.roughness = 0.45;
                mat.needsUpdate = true;
                this.materials.push(mat);
              }
            });
          }
        });

        // Initialize AnimationMixer
        this.mixer = new THREE.AnimationMixer(this.modelMesh);

        // Register action finish listener: automatically return to stand straight and still
        this.mixer.addEventListener('finished', (e) => {
          this.playAction('standstill');
        });

        // Register initial greeting clip
        if (fbx.animations && fbx.animations.length > 0) {
          const clip = fbx.animations.find((a) => a.duration > 0) || fbx.animations[0];
          if (clip) {
            clip.name = 'greeting';
            const action = this.mixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            this.actions['greeting'] = action;
          }
        }

        this.group.add(this.modelMesh);

        // Preload other action clips from 'model and actions/'
        this.preloadActionClips();

        // Initial state: stand straight and still
        this.playAction('standstill');

        if (onLoad) onLoad(this);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(percent);
        }
      },
      (err) => {
        console.error('Error loading base model:', err);
        if (onLoad) onLoad(this);
      }
    );
  }

  // Preload additional action animations
  preloadActionClips() {
    const actionsToLoad = ['clapping', 'excited', 'rallying', 'thumbsup'];

    actionsToLoad.forEach((key) => {
      const path = this.actionFiles[key];
      if (!path) return;

      this.fbxLoader.load(
        path,
        (fbx) => {
          if (fbx.animations && fbx.animations.length > 0) {
            const clip = fbx.animations.find((a) => a.duration > 0) || fbx.animations[0];
            if (clip && this.mixer) {
              clip.name = key;
              const action = this.mixer.clipAction(clip);
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
              this.actions[key] = action;
            }
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not preload action ${key}:`, err);
        }
      );
    });
  }

  // Switch between 'Standing Greeting.fbx' and 'character.fbx'
  switchModel(modelType, onProgress, onLoad) {
    this.currentModel = modelType;
    if (modelType === 'character') {
      this.fbxLoader.load(
        './model and actions/character.fbx',
        (fbx) => {
          if (this.modelMesh) this.group.remove(this.modelMesh);
          this.modelMesh = fbx;
          const box = new THREE.Box3().setFromObject(this.modelMesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const scaleFactor = 1.8 / (size.y || 166.4);
          this.modelMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
          const scaledBox = new THREE.Box3().setFromObject(this.modelMesh);
          const center = new THREE.Vector3();
          scaledBox.getCenter(center);
          this.modelMesh.position.x = -center.x;
          this.modelMesh.position.z = -center.z;
          this.modelMesh.position.y = -scaledBox.min.y;

          this.modelMesh.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { isVedaCharacter: true };
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((mat) => {
                if (mat && mat.map) {
                  mat.map.colorSpace = THREE.SRGBColorSpace;
                  mat.needsUpdate = true;
                }
              });
            }
          });

          this.group.add(this.modelMesh);
          this.isAnimationPlaying = false;
          if (onLoad) onLoad(this);
        },
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            onProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (err) => {
          console.error('Error switching to character.fbx:', err);
          if (onLoad) onLoad(this);
        }
      );
    } else {
      this.loadBaseModel(onProgress, onLoad);
    }
  }

  // Play an action: plays once, then automatically returns to stand straight and still
  playAction(actionName) {
    this.activeActionName = actionName;

    // Stand Still: fade out all actions, stand motionless and straight
    if (actionName === 'standstill' || actionName === 'stand') {
      if (this.currentAction) {
        this.currentAction.fadeOut(0.35);
        this.currentAction = null;
      }
      this.isAnimationPlaying = false;
      this.targetTilt = { x: 0, z: 0 };
      return;
    }

    const action = this.actions[actionName];
    if (action) {
      if (this.currentAction && this.currentAction !== action) {
        this.currentAction.fadeOut(0.25);
      }
      action.reset().fadeIn(0.25).play();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.timeScale = this.animationSpeed;
      this.currentAction = action;
      this.isAnimationPlaying = true;
    } else {
      // Load action on demand if not preloaded
      const path = this.actionFiles[actionName];
      if (path) {
        this.fbxLoader.load(path, (fbx) => {
          const clip = fbx.animations.find((a) => a.duration > 0) || fbx.animations[0];
          if (clip && this.mixer) {
            clip.name = actionName;
            const newAction = this.mixer.clipAction(clip);
            newAction.setLoop(THREE.LoopOnce);
            newAction.clampWhenFinished = true;
            this.actions[actionName] = newAction;
            if (this.currentAction) this.currentAction.fadeOut(0.25);
            newAction.reset().fadeIn(0.25).play();
            newAction.timeScale = this.animationSpeed;
            this.currentAction = newAction;
            this.isAnimationPlaying = true;
          }
        });
      }
    }
  }

  // Toggle animation playback
  toggleAnimation() {
    if (!this.currentAction) {
      this.playAction('greeting');
      return true;
    }

    this.isAnimationPlaying = !this.isAnimationPlaying;
    if (this.isAnimationPlaying) {
      this.currentAction.paused = false;
      this.currentAction.play();
    } else {
      this.currentAction.paused = true;
    }
    return this.isAnimationPlaying;
  }

  // Set animation playback speed
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }
  }

  // Character stage alignment: 'center', 'left', 'right', 'podium'
  alignTo(placementKey) {
    this.currentPlacement = placementKey;
    this.isNavigating = true;

    switch (placementKey) {
      case 'left':
      case 'present-left':
        this.targetPosition.set(-1.3, 0, 0.4);
        this.targetRotationY = 0.35;
        break;
      case 'right':
      case 'present-right':
        this.targetPosition.set(1.3, 0, 0.4);
        this.targetRotationY = -0.35;
        break;
      case 'podium':
        this.targetPosition.set(0, 0, -0.6);
        this.targetRotationY = 0;
        break;
      case 'center':
      default:
        this.targetPosition.set(0, 0, 0);
        this.targetRotationY = 0;
        break;
    }
  }

  // Navigate to subject station
  navigateToStation(targetX, targetZ, actionName = 'greeting', outfit = null) {
    this.targetPosition.set(targetX, 0, targetZ);
    this.isNavigating = true;

    if (outfit) this.setOutfit(outfit);
    if (actionName) this.playAction(actionName);
  }

  // Celebration without jumping: triggers clapping action firmly on ground
  celebrateVictory() {
    this.playAction('clapping');
  }

  triggerGreeting() {
    this.playAction('greeting');
  }

  // Set Pose / Action Triggers
  setPose(poseName) {
    this.currentPose = poseName;
    if (!this.group) return;

    switch (poseName) {
      case 'wave':
        this.playAction('greeting');
        break;
      case 'clapping':
      case 'celebrating':
        this.playAction('clapping');
        break;
      case 'excited':
        this.playAction('excited');
        break;
      case 'rallying':
        this.playAction('rallying');
        break;
      case 'thumbsup':
        this.playAction('thumbsup');
        break;
      case 'standstill':
      case 'stand':
        this.playAction('standstill');
        break;
      case 'pointing':
        this.playAction('greeting');
        break;
      case 'explaining':
        this.playAction('rallying');
        break;
      case 'idea':
        this.playAction('excited');
        break;
      default:
        this.playAction('standstill');
    }
  }

  setExpression(exprName) {
    this.currentExpression = exprName;
  }

  // Skin Tone & Appearance Customization
  setSkinTone(toneKey) {
    this.currentSkinTone = toneKey;
    const tonePalettes = {
      default: 0xFFFFFF,    // Original textured tone
      warm: 0xF5C79A,       // Natural Warm Indian wheatish tone
      amber: 0xE2A572,      // Rich Golden Amber tone
      bronze: 0xBA7B50,     // Deep Dusky Bronze tone
      fair: 0xFFDFC4,       // Fair Honey tone
      glow: 0xFFE082        // Radiant Golden Glow
    };

    const hex = tonePalettes[toneKey] || 0xFFFFFF;

    this.materials.forEach((mat) => {
      const orig = this.originalColors.get(mat);
      if (toneKey === 'default') {
        if (mat.color && orig) {
          mat.color.copy(orig);
        } else if (mat.color) {
          mat.color.setHex(0xFFFFFF);
        }
      } else {
        if (mat.color) mat.color.setHex(hex);
      }
      mat.needsUpdate = true;
    });
  }

  // Custom Skin Color by Hex String (e.g. from color picker)
  setCustomColor(hexColor) {
    const col = new THREE.Color(hexColor);
    this.materials.forEach((mat) => {
      if (mat.color) mat.color.copy(col);
      mat.needsUpdate = true;
    });
  }

  // Set Outfit and Visual Colors
  setOutfit(outfitName) {
    this.currentOutfit = outfitName;
    if (!this.materials.length) return;

    this.materials.forEach((mat) => {
      const orig = this.originalColors.get(mat);

      if (outfitName === 'scientist') {
        if (mat.color) mat.color.setHex(0x80D8FF);
        if (mat.shininess !== undefined) mat.shininess = 50;
      } else if (outfitName === 'mentor' || outfitName === 'career') {
        if (mat.color) mat.color.setHex(0xBA68C8);
        if (mat.shininess !== undefined) mat.shininess = 30;
      } else if (outfitName === 'exam') {
        if (mat.color) mat.color.setHex(0xFFB74D);
        if (mat.shininess !== undefined) mat.shininess = 35;
      } else if (outfitName === 'casual') {
        if (mat.color) mat.color.setHex(0x80CBC4);
        if (mat.shininess !== undefined) mat.shininess = 20;
      } else {
        if (mat.color && orig) {
          mat.color.copy(orig);
        } else if (mat.color) {
          mat.color.setHex(0xFFFFFF);
        }
        if (mat.shininess !== undefined) mat.shininess = 25;
      }
      mat.needsUpdate = true;
    });
  }

  update(time, deltaTime) {
    if (!this.group) return;

    // Update AnimationMixer
    if (this.mixer && this.isAnimationPlaying) {
      this.mixer.update(deltaTime);
    }

    // Smooth Navigation Movement Lerp
    if (this.isNavigating) {
      const dist = this.group.position.distanceTo(this.targetPosition);

      if (dist > 0.05) {
        this.group.position.lerp(this.targetPosition, deltaTime * 3.8);

        if (dist > 0.25) {
          const dx = this.targetPosition.x - this.group.position.x;
          const dz = this.targetPosition.z - this.group.position.z;
          this.targetRotationY = Math.atan2(dx, dz);
        }
      } else {
        this.group.position.copy(this.targetPosition);
        this.isNavigating = false;
        
        if (this.currentPlacement === 'left') {
          this.targetRotationY = 0.35;
        } else if (this.currentPlacement === 'right') {
          this.targetRotationY = -0.35;
        } else {
          this.targetRotationY = 0;
        }
      }
    }

    // Feet firmly on ground (NO jumping, NO vertical bounce)
    this.group.position.y = 0;

    // Smooth Rotation Lerp (NO cursor tracking, stands straight)
    this.group.rotation.y = THREE.MathUtils.lerp(
      this.group.rotation.y,
      this.targetRotationY,
      deltaTime * 5
    );
    this.group.rotation.x = THREE.MathUtils.lerp(
      this.group.rotation.x,
      this.targetTilt.x,
      deltaTime * 4
    );
    this.group.rotation.z = THREE.MathUtils.lerp(
      this.group.rotation.z,
      this.targetTilt.z,
      deltaTime * 4
    );
  }
}

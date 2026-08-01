import * as THREE from 'three';

export class HologramUI {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'StudentWorldEnvironment';
    this.scene.add(this.group);

    this.buildFloor();
  }

  buildFloor() {
    // Soft floor disc so the character has visual grounding
    const discGeo = new THREE.CircleGeometry(2.6, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.6
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0;
    disc.receiveShadow = true;
    this.group.add(disc);

    // Single subtle contact-shadow ring for depth
    const ringGeo = new THREE.RingGeometry(1.15, 1.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x785CFF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    this.group.add(ring);
  }

  update() {
    // Static, minimal environment — nothing to animate.
  }
}

import * as THREE from 'three';

export class HologramUI {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LiveLearningWorldEnvironment';
    this.scene.add(this.group);

    this.interactiveObjects = [];
    this.animatedElements = [];
    this.activeSubject = 'math';

    // Build Environment Components
    this.buildCyberArenaStage();
    this.buildParticles();
    this.buildSubjectConsoles();
  }

  buildCyberArenaStage() {
    // 1. Master High-Tech Floor Disc
    const floorGeo = new THREE.CircleGeometry(5.2, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080D1A,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.95
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Outer Concentric Cyber Rings
    const outerRingGeo = new THREE.RingGeometry(4.8, 4.95, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.003;
    this.group.add(outerRing);

    // 3. Middle Accent Energy Ring
    const midRingGeo = new THREE.RingGeometry(3.2, 3.28, 64);
    const midRingMat = new THREE.MeshBasicMaterial({
      color: 0x785CFF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const midRing = new THREE.Mesh(midRingGeo, midRingMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.y = 0.004;
    this.group.add(midRing);

    // 4. Center Stage Hologram Dais (Where character stands)
    const daisGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.06, 48);
    const daisMat = new THREE.MeshStandardMaterial({
      color: 0x111C35,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = 0.03;
    dais.receiveShadow = true;
    this.group.add(dais);

    // Dais Glowing Perimeter Ring
    const daisRimGeo = new THREE.RingGeometry(1.15, 1.25, 48);
    const daisRimMat = new THREE.MeshBasicMaterial({
      color: 0x785CFF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.daisRim = new THREE.Mesh(daisRimGeo, daisRimMat);
    this.daisRim.rotation.x = Math.PI / 2;
    this.daisRim.position.y = 0.065;
    this.group.add(this.daisRim);

    // Dynamic rotating inner rune ring
    const runeRingGeo = new THREE.RingGeometry(0.85, 0.92, 32);
    const runeRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    this.runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
    this.runeRing.rotation.x = Math.PI / 2;
    this.runeRing.position.y = 0.066;
    this.group.add(this.runeRing);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(10, 24, 0x785CFF, 0x1E293B);
    gridHelper.position.y = 0.001;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    this.group.add(gridHelper);
  }

  buildParticles() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 4.5 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x38BDF8,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  buildSubjectConsoles() {
    this.stations = {
      math: { pos: new THREE.Vector3(-2.6, 0, 0.2), color: 0xFF6B35, key: 'math', label: 'Mathematics' },
      science: { pos: new THREE.Vector3(-1.6, 0, -2.2), color: 0x00E5FF, key: 'science', label: 'Science' },
      coding: { pos: new THREE.Vector3(0, 0, -2.8), color: 0x785CFF, key: 'coding', label: 'Coding' },
      social: { pos: new THREE.Vector3(1.6, 0, -2.2), color: 0x10B981, key: 'social', label: 'Social' },
      english: { pos: new THREE.Vector3(2.6, 0, 0.2), color: 0xEC4899, key: 'english', label: 'English' }
    };

    this.stationMeshes = {};

    // 1. Math Station - Holographic Delta Polyhedron
    this.createStationNode(
      'math',
      this.stations.math.pos,
      this.stations.math.color,
      new THREE.IcosahedronGeometry(0.24, 0),
      0.9
    );

    // 2. Science Station - Glowing Atomic Core with Electron Rings
    const sciGroup = this.createStationNode(
      'science',
      this.stations.science.pos,
      this.stations.science.color,
      new THREE.SphereGeometry(0.14, 16, 16),
      0.9
    );
    // Orbit rings for science
    const orbits = [];
    [0, Math.PI / 3, -Math.PI / 3].forEach((angle) => {
      const ringGeo = new THREE.TorusGeometry(0.28, 0.012, 6, 28);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.9;
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = angle;
      sciGroup.add(ring);
      orbits.push(ring);
    });
    this.animatedElements.push({ orbits, rotSpeed: 0.02 });

    // 3. Coding Station - Cyber Core Matrix
    this.createStationNode(
      'coding',
      this.stations.coding.pos,
      this.stations.coding.color,
      new THREE.OctahedronGeometry(0.22, 0),
      0.9
    );

    // 4. Social Station - Planetary Sphere with Ring
    const socialGroup = this.createStationNode(
      'social',
      this.stations.social.pos,
      this.stations.social.color,
      new THREE.SphereGeometry(0.16, 16, 16),
      0.9
    );
    const planetRingGeo = new THREE.RingGeometry(0.22, 0.32, 24);
    const planetRingMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const pRing = new THREE.Mesh(planetRingGeo, planetRingMat);
    pRing.position.y = 0.9;
    pRing.rotation.x = Math.PI / 3;
    socialGroup.add(pRing);

    // 5. English Station - Harmonic Diamond Prism
    this.createStationNode(
      'english',
      this.stations.english.pos,
      this.stations.english.color,
      new THREE.ConeGeometry(0.2, 0.4, 6),
      0.9
    );
  }

  createStationNode(key, pos, hexColor, glyphGeo, heightY) {
    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(pos);
    this.group.add(nodeGroup);

    // Sleek Ground Energy Base
    const baseGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.04, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x131D33,
      metalness: 0.8,
      roughness: 0.3
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.02;
    baseMesh.receiveShadow = true;
    nodeGroup.add(baseMesh);

    // Glowing Station Perimeter Ring
    const ringGeo = new THREE.RingGeometry(0.42, 0.48, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.045;
    nodeGroup.add(ring);

    // Hologram Light Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.36, 0.36, heightY, 24, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = heightY / 2;
    nodeGroup.add(pillar);

    // Floating Luminous Symbol / Glyph
    const glyphMat = new THREE.MeshStandardMaterial({
      color: hexColor,
      emissive: hexColor,
      emissiveIntensity: 0.45,
      metalness: 0.6,
      roughness: 0.2
    });
    const glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
    glyphMesh.position.y = heightY;
    nodeGroup.add(glyphMesh);

    // Interactive properties for raycasting
    this.makeInteractive(glyphMesh, key);
    this.makeInteractive(baseMesh, key);

    this.stationMeshes[key] = {
      group: nodeGroup,
      ring,
      pillar,
      glyph: glyphMesh,
      hexColor
    };

    this.animatedElements.push({
      obj: glyphMesh,
      rotSpeedY: 0.018,
      bobFreq: 1.8,
      baseY: heightY
    });

    return nodeGroup;
  }

  makeInteractive(mesh, subjectKey) {
    mesh.userData = {
      isSubjectPortal: true,
      subjectKey: subjectKey
    };
    this.interactiveObjects.push(mesh);
  }

  getStationPosition(key) {
    if (this.stations[key]) {
      return this.stations[key].pos.clone();
    }
    return new THREE.Vector3(0, 0, 0);
  }

  setActiveSubject(key) {
    this.activeSubject = key;
    Object.keys(this.stationMeshes).forEach((k) => {
      const station = this.stationMeshes[k];
      if (k === key) {
        station.ring.scale.set(1.18, 1.18, 1.18);
        station.pillar.material.opacity = 0.22;
        station.glyph.material.emissiveIntensity = 0.8;
      } else {
        station.ring.scale.set(1, 1, 1);
        station.pillar.material.opacity = 0.06;
        station.glyph.material.emissiveIntensity = 0.35;
      }
    });

    if (this.stations[key] && this.daisRim) {
      this.daisRim.material.color.setHex(this.stations[key].color);
    }
  }

  update(time) {
    // 1. Rotate stage hologram rune ring
    if (this.runeRing) {
      this.runeRing.rotation.z = time * 0.4;
    }

    // 2. Animate station glyphs
    this.animatedElements.forEach((el, index) => {
      if (el.obj) {
        el.obj.rotation.y += el.rotSpeedY || 0.015;
        el.obj.rotation.x = Math.sin(time * 1.5 + index) * 0.08;
        if (el.bobFreq && el.baseY) {
          el.obj.position.y = el.baseY + Math.sin(time * el.bobFreq + index) * 0.04;
        }
      }
      if (el.orbits) {
        el.orbits.forEach((orbit, i) => {
          orbit.rotation.z += (el.rotSpeed || 0.015) * (i % 2 === 0 ? 1 : -1);
        });
      }
    });

    // 4. Drift cyber particles
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += 0.003;
        if (pos[i] > 4.5) pos[i] = 0.2;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.y = time * 0.03;
    }
  }
}

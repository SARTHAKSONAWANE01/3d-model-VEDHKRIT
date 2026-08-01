import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VedaModel } from './vedaModel.js';
import { HologramUI } from './hologramUI.js';

class VedaApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Student Progress State
    this.xp = 1450;
    this.currentSubject = 'math';

    // Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF8FAFC); // Light Clean Background
    this.scene.fog = new THREE.FogExp2(0xF8FAFC, 0.05);

    // Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.2, 4.2);

    // Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 8.0;
    this.controls.target.set(0, 0.9, 0);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;

    // Lighting
    this.setupLighting();

    // 3D Subject Stations & Props Environment
    this.holograms = new HologramUI(this.scene);

    // Load 3D Mascot GLB Character Model
    const loaderText = document.querySelector('.loader-subtitle');
    this.veda = new VedaModel(
      (percent) => {
        if (loaderText) {
          loaderText.textContent = `Loading 3D VEDA AI Mentor (${percent}%)...`;
        }
      },
      () => {
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.classList.add('hidden');
      }
    );
    this.scene.add(this.veda.group);

    // Curriculum & Subject Questions Data for 8th-10th Standard
    this.initSubjectData();

    // Event Listeners
    this.bindMouseTracking();
    this.bindSubjectNavEvents();
    this.bindQuizEvents();
    this.bindUIEvents();

    // Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start Render Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Soft White Fill
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
    this.scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.0);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    // Cyan Rim Light (subtle accent, not a dominant tint)
    const cyanRim = new THREE.DirectionalLight(0x00E5FF, 0.5);
    cyanRim.position.set(-4, 3, -2);
    this.scene.add(cyanRim);

    // Purple Rim Light (subtle accent, not a dominant tint)
    const purpleRim = new THREE.DirectionalLight(0x785CFF, 0.45);
    purpleRim.position.set(4, 2, -3);
    this.scene.add(purpleRim);
  }

  initSubjectData() {
    this.subjects = {
      math: {
        speaker: "VEDA • MATHEMATICS MENTOR",
        msg: "Welcome to 8th-10th Math! We cover Algebra, Trigonometry, Geometry, and Statistics! Let's solve equations together!",
        q: "What is the slope of a line with equation y = 3x + 5?",
        opts: [
          { txt: "A) 5", correct: false },
          { txt: "B) 3", correct: true },
          { txt: "C) 1/3", correct: false },
          { txt: "D) -3", correct: false }
        ],
        explain: "Great job! In slope-intercept form y = mx + c, the coefficient of x is slope 'm', which is 3!"
      },
      science: {
        speaker: "VEDA • SCIENCE & PHYSICS MENTOR",
        msg: "Welcome to Physics & Chemistry! Explore Laws of Motion, Electricity, Chemical Reactions, and Light Optics!",
        q: "Which fundamental law of physics states that 'For every action, there is an equal and opposite reaction'?",
        opts: [
          { txt: "A) Newton's 1st Law", correct: false },
          { txt: "B) Newton's 2nd Law", correct: false },
          { txt: "C) Newton's 3rd Law", correct: true },
          { txt: "D) Law of Universal Gravitation", correct: false }
        ],
        explain: "Awesome! Newton's 3rd Law states that action and reaction forces are equal in magnitude and opposite in direction!"
      },
      coding: {
        speaker: "VEDA • COMPUTER SCIENCE & AI MENTOR",
        msg: "Welcome to Computer Science & AI! Learn Python loops, Web Development, and Artificial Intelligence basics!",
        q: "In Python, which keyword is used to define a reusable function?",
        opts: [
          { txt: "A) function", correct: false },
          { txt: "B) def", correct: true },
          { txt: "C) func", correct: false },
          { txt: "D) define", correct: false }
        ],
        explain: "Spot on! The 'def' keyword is used in Python to define functions, e.g., def my_function():"
      },
      social: {
        speaker: "VEDA • SOCIAL STUDIES MENTOR",
        msg: "Explore World History, Physical Geography, Earth's Climate, and Democratic Civics!",
        q: "Which imaginary line divides the Earth into the Northern and Southern Hemispheres at 0° latitude?",
        opts: [
          { txt: "A) Prime Meridian", correct: false },
          { txt: "B) Tropic of Cancer", correct: false },
          { txt: "C) Equator", correct: true },
          { txt: "D) Tropic of Capricorn", correct: false }
        ],
        explain: "Correct! The Equator is the 0° latitude line dividing the Northern and Southern Hemispheres!"
      },
      english: {
        speaker: "VEDA • ENGLISH & COMM. MENTOR",
        msg: "Master English Grammar, Vocabulary, Essay Writing, and Public Speaking skills!",
        q: "Which figure of speech directly compares two things using 'like' or 'as'?",
        opts: [
          { txt: "A) Metaphor", correct: false },
          { txt: "B) Simile", correct: true },
          { txt: "C) Personification", correct: false },
          { txt: "D) Hyperbole", correct: false }
        ],
        explain: "Excellent! A Simile compares two different things using 'like' or 'as' (e.g. As brave as a lion)!"
      }
    };
  }

  bindMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      if (this.veda) {
        this.veda.updateMouseCursor(mouseX, mouseY);
      }
    });
  }

  bindSubjectNavEvents() {
    const navBtns = document.querySelectorAll('.subject-nav-btn');

    navBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        navBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const subjectKey = btn.getAttribute('data-subject');
        this.selectSubject(subjectKey);
      });
    });
  }

  selectSubject(key) {
    if (!this.subjects[key]) return;
    this.currentSubject = key;
    const data = this.subjects[key];

    // 1. Update Dialogue Box
    const speakerEl = document.querySelector('.dialogue-speaker');
    const msgEl = document.getElementById('dialogue-message');
    if (speakerEl) speakerEl.textContent = data.speaker;
    if (msgEl) msgEl.textContent = `"${data.msg}"`;

    // 2. Update Quiz Card Questions
    const qTextEl = document.getElementById('quiz-question-text');
    if (qTextEl) qTextEl.textContent = data.q;

    const optsContainer = document.querySelector('.quiz-options-grid');
    if (optsContainer) {
      optsContainer.innerHTML = '';
      data.opts.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.setAttribute('data-correct', opt.correct ? 'true' : 'false');
        btn.textContent = opt.txt;
        optsContainer.appendChild(btn);
      });
      this.bindQuizEvents();
    }

    // 3. VEDA Mascot 3D Reaction
    if (this.veda) {
      if (key === 'science') {
        this.veda.setOutfit('scientist');
        this.veda.setPose('explaining');
      } else if (key === 'coding') {
        this.veda.setOutfit('student');
        this.veda.setPose('typing');
      } else if (key === 'math') {
        this.veda.setOutfit('exam');
        this.veda.setPose('pointing');
      } else {
        this.veda.setOutfit('mentor');
        this.veda.setPose('presenting');
      }
    }
  }

  bindQuizEvents() {
    const quizOpts = document.querySelectorAll('.quiz-opt-btn');
    const feedbackMsg = document.getElementById('quiz-feedback-msg');
    const xpEl = document.getElementById('xp-counter');

    quizOpts.forEach((opt) => {
      opt.addEventListener('click', () => {
        const isCorrect = opt.getAttribute('data-correct') === 'true';
        const data = this.subjects[this.currentSubject];

        quizOpts.forEach((o) => o.classList.remove('correct', 'wrong'));

        if (isCorrect) {
          opt.classList.add('correct');
          if (feedbackMsg) {
            feedbackMsg.textContent = '🎉 Correct Answer! +100 XP Earned!';
            feedbackMsg.style.color = '#047857';
          }

          this.xp += 100;
          if (xpEl) xpEl.textContent = `${this.xp.toLocaleString()} XP`;

          // Trigger VEDA 3D Victory Celebration Jump!
          if (this.veda) {
            this.veda.celebrateVictory();
            this.veda.setExpression('excited');
          }

          const msgEl = document.getElementById('dialogue-message');
          if (msgEl && data) msgEl.textContent = `"${data.explain}"`;
        } else {
          opt.classList.add('wrong');
          if (feedbackMsg) {
            feedbackMsg.textContent = '❌ Not quite! Give it another try.';
            feedbackMsg.style.color = '#B91C1C';
          }
          if (this.veda) {
            this.veda.setPose('idea');
            this.veda.setExpression('thinking');
          }
        }
      });
    });
  }

  bindUIEvents() {
    // Dock Tab Switching
    const tabs = document.querySelectorAll('.dock-tab-btn');
    const panels = document.querySelectorAll('.dock-content-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanelId = tab.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Outfit Selector Buttons (From Reference Sheet)
    const outfitBtns = document.querySelectorAll('[data-outfit]');
    outfitBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        outfitBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const outfitName = btn.getAttribute('data-outfit');
        if (this.veda) this.veda.setOutfit(outfitName);
      });
    });

    // Pose / Action Buttons (From Reference Sheet)
    const poseBtns = document.querySelectorAll('[data-pose]');
    poseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        poseBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const poseName = btn.getAttribute('data-pose');
        if (this.veda) this.veda.setPose(poseName);
      });
    });

    // Expression Buttons (From Reference Sheet)
    const exprBtns = document.querySelectorAll('[data-expression]');
    exprBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        exprBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const exprName = btn.getAttribute('data-expression');
        if (this.veda) this.veda.setExpression(exprName);
      });
    });

    // 360° Turnaround Camera Views
    document.getElementById('btn-camera-front')?.addEventListener('click', () => {
      this.animateCameraTo(0, 1.2, 4.2);
    });
    document.getElementById('btn-camera-34')?.addEventListener('click', () => {
      this.animateCameraTo(2.4, 1.4, 3.4);
    });
    document.getElementById('btn-camera-side')?.addEventListener('click', () => {
      this.animateCameraTo(4.0, 1.2, 0);
    });
    document.getElementById('btn-camera-back')?.addEventListener('click', () => {
      this.animateCameraTo(0, 1.2, -4.2);
    });

    document.getElementById('btn-toggle-orbit')?.addEventListener('click', (e) => {
      this.controls.autoRotate = !this.controls.autoRotate;
      e.currentTarget.classList.toggle('active', this.controls.autoRotate);
    });

    document.getElementById('talk-btn')?.addEventListener('click', () => {
      if (this.veda) this.veda.celebrateVictory();
      const msgEl = document.getElementById('dialogue-message');
      if (msgEl) msgEl.textContent = `"Keep up the awesome effort! Practicing daily boosts your exam scores and unlocks new achievements!"`;
    });
  }

  animateCameraTo(x, y, z) {
    const targetPos = new THREE.Vector3(x, y, z);
    const startPos = this.camera.position.clone();
    let progress = 0;

    const animateCam = () => {
      progress += 0.04;
      this.camera.position.lerpVectors(startPos, targetPos, THREE.MathUtils.smoothstep(progress, 0, 1));
      if (progress < 1) requestAnimationFrame(animateCam);
    };
    animateCam();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Clamp delta so a tab-switch or GC pause can't spike the lerp factor past 1
    // and fling the character's rotation/jump physics past their target.
    const delta = Math.min(this.clock.getDelta(), 1 / 30);
    const elapsedTime = this.clock.getElapsedTime();

    this.controls.update();
    if (this.veda) this.veda.update(elapsedTime, delta);
    if (this.holograms) this.holograms.update(elapsedTime);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new VedaApp();
});

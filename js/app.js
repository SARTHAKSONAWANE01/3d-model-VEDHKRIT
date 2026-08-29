import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VedaModel } from './vedaModel.js';
import { HologramUI } from './hologramUI.js';
import { VoiceEngine } from './voiceEngine.js';

class VedaApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Student Progress State
    this.xp = 1450;
    this.currentSubject = 'math';
    this.currentPlacement = 'center';

    // Voice Engine Setup (Indian English Voice + ElevenLabs)
    this.voice = new VoiceEngine();
    this.setupVoiceVisualizer();

    // Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);
    this.scene.fog = new THREE.FogExp2(0x070B14, 0.035);

    // Camera Setup - Perfectly framed for character in center stage
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.35, 4.3);

    // Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 8.5;
    this.controls.target.set(0, 0.9, 0);
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 1.2;

    // Raycasting for 3D Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2();

    // Lighting
    this.setupLighting();

    // 3D Subject Stations & Holographic Arena Environment
    this.holograms = new HologramUI(this.scene);

    // Load 3D Mascot Character Model
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
        
        // Initial setup pose & active station
        this.selectSubject('math', false); // don't auto-speak on initial page load before user interaction
      }
    );
    this.scene.add(this.veda.group);

    // Curriculum & Subject Questions Data for 8th-10th Standard
    this.initSubjectData();

    // Event Listeners
    this.bind3DRaycasting();
    this.bindSubjectNavEvents();
    this.bindQuizEvents();
    this.bindCameraControls();
    this.bindStudioControls();
    this.bindVoiceControls();
    this.bindModelAndAnimationControls();

    // Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start Render Loop
    this.animate();
  }

  setupVoiceVisualizer() {
    const soundwave = document.getElementById('voice-soundwave');
    if (!soundwave) return;

    this.voice.onStartSpeaking = () => {
      soundwave.classList.add('active');
    };
    this.voice.onEndSpeaking = () => {
      soundwave.classList.remove('active');
    };
  }

  setupLighting() {
    // Ambient Soft Fill Light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
    this.scene.add(ambientLight);

    // Key Directional Light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.4);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Cyan Cyber Accent Rim Light
    const cyanRim = new THREE.DirectionalLight(0x00E5FF, 1.2);
    cyanRim.position.set(-4, 3, -3);
    this.scene.add(cyanRim);

    // Violet Cyber Accent Rim Light
    const purpleRim = new THREE.DirectionalLight(0x785CFF, 1.0);
    purpleRim.position.set(4, 3, -3);
    this.scene.add(purpleRim);
  }

  initSubjectData() {
    this.subjects = {
      math: {
        name: "Mathematics",
        badge: "CLASS 9TH & 10TH MATH",
        title: "Mathematics & Coordinate Geometry",
        desc: "Master linear equations, slopes, quadratic functions, coordinate graphing, and statistical analysis.",
        speaker: "VEDA • MATHEMATICS MENTOR",
        msg: "Welcome to Mathematics! Let's master Coordinate Geometry and solve equations together!",
        tip: "Remember: Parallel lines have the exact same slope, while perpendicular lines have negative reciprocal slopes!",
        q: "What is the slope of a line with equation y = 3x + 5?",
        opts: [
          { txt: "A) 5", correct: false },
          { txt: "B) 3", correct: true },
          { txt: "C) 1/3", correct: false },
          { txt: "D) -3", correct: false }
        ],
        explain: "Great job! In slope-intercept form y = mx + c, the coefficient of x is slope 'm', which is 3!",
        pose: 'pointing',
        outfit: 'exam'
      },
      science: {
        name: "Science & Physics",
        badge: "CLASS 9TH & 10TH SCIENCE",
        title: "Physics: Laws of Motion & Electricity",
        desc: "Explore Newton's laws of motion, gravitation, electric current, Ohm's law, and light optics.",
        speaker: "VEDA • SCIENCE & PHYSICS MENTOR",
        msg: "Welcome to Physics! Let's explore Laws of Motion, Chemical Reactions, and Light Optics!",
        tip: "Newton's 3rd law pairs always act on two different bodies, never on the same body!",
        q: "Which fundamental law of physics states that 'For every action, there is an equal and opposite reaction'?",
        opts: [
          { txt: "A) Newton's 1st Law", correct: false },
          { txt: "B) Newton's 2nd Law", correct: false },
          { txt: "C) Newton's 3rd Law", correct: true },
          { txt: "D) Law of Universal Gravitation", correct: false }
        ],
        explain: "Awesome! Newton's 3rd Law states that action and reaction forces are equal in magnitude and opposite in direction!",
        pose: 'explaining',
        outfit: 'scientist'
      },
      coding: {
        name: "Coding & AI",
        badge: "CLASS 8TH-10TH COMPUTER SCIENCE",
        title: "Python, Web Development & AI",
        desc: "Build algorithmic logic, Python functions, object-oriented concepts, and AI neural net foundations.",
        speaker: "VEDA • COMPUTER SCIENCE & AI MENTOR",
        msg: "Welcome to Computer Science! Learn Python loops, Web Development, and Artificial Intelligence basics!",
        tip: "Writing clean, modular functions makes your code ten times easier to debug and test!",
        q: "In Python, which keyword is used to define a reusable function?",
        opts: [
          { txt: "A) function", correct: false },
          { txt: "B) def", correct: true },
          { txt: "C) func", correct: false },
          { txt: "D) define", correct: false }
        ],
        explain: "Spot on! The 'def' keyword is used in Python to define functions, like def calculate_xp():",
        pose: 'typing',
        outfit: 'student'
      },
      social: {
        name: "Social Studies",
        badge: "CLASS 8TH-10TH SOCIAL STUDIES",
        title: "World Geography & Civic Democracy",
        desc: "Analyze physical earth zones, climate patterns, Indian constitution, and democratic institutions.",
        speaker: "VEDA • SOCIAL STUDIES MENTOR",
        msg: "Explore World History, Physical Geography, Earth's Climate, and Democratic Civics!",
        tip: "Lines of latitude run horizontally, while lines of longitude run vertically!",
        q: "Which imaginary line divides the Earth into the Northern and Southern Hemispheres at 0° latitude?",
        opts: [
          { txt: "A) Prime Meridian", correct: false },
          { txt: "B) Tropic of Cancer", correct: false },
          { txt: "C) Equator", correct: true },
          { txt: "D) Tropic of Capricorn", correct: false }
        ],
        explain: "Correct! The Equator is the 0° latitude line dividing the Northern and Southern Hemispheres!",
        pose: 'presenting',
        outfit: 'mentor'
      },
      english: {
        name: "English & Comm.",
        badge: "CLASS 8TH-10TH ENGLISH",
        title: "Literary Devices, Grammar & Rhetoric",
        desc: "Master poetic devices, active/passive voice, vocabulary nuances, and public presentation confidence.",
        speaker: "VEDA • ENGLISH & COMM. MENTOR",
        msg: "Master English Grammar, Vocabulary, Essay Writing, and Public Speaking skills!",
        tip: "A simile uses comparison words 'like' or 'as', whereas a metaphor states one thing is another directly!",
        q: "Which figure of speech directly compares two things using 'like' or 'as'?",
        opts: [
          { txt: "A) Metaphor", correct: false },
          { txt: "B) Simile", correct: true },
          { txt: "C) Personification", correct: false },
          { txt: "D) Hyperbole", correct: false }
        ],
        explain: "Excellent! A Simile compares two different things using 'like' or 'as'!",
        pose: 'wave',
        outfit: 'casual'
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

  bind3DRaycasting() {
    this.renderer.domElement.addEventListener('click', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseVector, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        let hitSubjectPortal = null;
        let hitVedaCharacter = false;

        for (const hit of intersects) {
          if (hit.object.userData) {
            if (hit.object.userData.isSubjectPortal) {
              hitSubjectPortal = hit.object.userData.subjectKey;
              break;
            }
            if (hit.object.userData.isVedaCharacter) {
              hitVedaCharacter = true;
              break;
            }
          }
        }

        if (hitSubjectPortal) {
          this.selectSubject(hitSubjectPortal, true);
        } else if (hitVedaCharacter) {
          if (this.veda) {
            this.veda.triggerGreeting();
          }
          const msg = "Hey there! Ready to practice? Pick any module from the curriculum panel or try the challenge!";
          const msgEl = document.getElementById('dialogue-message');
          if (msgEl) msgEl.textContent = `"${msg}"`;
          this.voice.speak(msg);
        }
      }
    });
  }

  bindSubjectNavEvents() {
    const navBtns = document.querySelectorAll('.subj-tab');
    navBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const subjectKey = btn.getAttribute('data-subject');
        this.selectSubject(subjectKey, true);
      });
    });
  }

  selectSubject(key, speakAloud = false) {
    if (!this.subjects[key]) return;
    this.currentSubject = key;
    const data = this.subjects[key];

    // 1. Update Header Tabs
    const navBtns = document.querySelectorAll('.subj-tab');
    navBtns.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-subject') === key);
    });

    // 2. Update Curriculum Module Card
    const badgeEl = document.getElementById('module-badge');
    const titleEl = document.getElementById('module-title');
    const descEl = document.getElementById('module-desc');
    if (badgeEl) badgeEl.textContent = data.badge;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;

    // 3. Update Dialogue Box
    const speakerEl = document.getElementById('dialogue-speaker');
    const msgEl = document.getElementById('dialogue-message');
    if (speakerEl) speakerEl.textContent = data.speaker;
    if (msgEl) msgEl.textContent = `"${data.msg}"`;

    if (speakAloud) {
      this.voice.speak(data.msg);
    }

    // 4. Update Quiz Card Questions
    const qTextEl = document.getElementById('quiz-question-text');
    if (qTextEl) qTextEl.textContent = data.q;

    const optsContainer = document.getElementById('quiz-options-grid');
    const feedbackMsg = document.getElementById('quiz-feedback-msg');
    if (feedbackMsg) feedbackMsg.textContent = '';

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

    // 5. Update Hologram Environment Highlight
    if (this.holograms && typeof this.holograms.setActiveSubject === 'function') {
      this.holograms.setActiveSubject(key);
    }

    // 6. Update Stage Top Info Pill
    const stageSubjectEl = document.getElementById('stage-current-subject');
    if (stageSubjectEl) {
      stageSubjectEl.textContent = `Station: ${data.name}`;
    }

    // 7. Update Model Outfit & Pose
    if (this.veda) {
      this.veda.setOutfit(data.outfit);
      this.veda.setPose(data.pose);

      const outfitBtns = document.querySelectorAll('[data-outfit]');
      outfitBtns.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-outfit') === data.outfit);
      });
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
            feedbackMsg.style.color = '#10B981';
          }

          this.xp += 100;
          if (xpEl) xpEl.textContent = `${this.xp.toLocaleString()} XP`;

          // Trigger VEDA 3D Victory Clapping Celebration Jump!
          if (this.veda) {
            this.veda.celebrateVictory();
            this.veda.setExpression('excited');
          }

          const msgEl = document.getElementById('dialogue-message');
          if (msgEl && data) msgEl.textContent = `"${data.explain}"`;

          // Speak explanation aloud with Indian Voice
          if (data) {
            this.voice.speak(data.explain);
          }
        } else {
          opt.classList.add('wrong');
          if (feedbackMsg) {
            feedbackMsg.textContent = '❌ Not quite! Give it another try.';
            feedbackMsg.style.color = '#EF4444';
          }
          if (this.veda) {
            this.veda.setPose('idea');
            this.veda.setExpression('thinking');
          }
          this.voice.speak("Not quite! Let's think carefully and give it another try!");
        }
      });
    });
  }

  bindCameraControls() {
    const btnFull = document.getElementById('btn-cam-full');
    const btnHead = document.getElementById('btn-cam-head');
    const btn34 = document.getElementById('btn-cam-34');
    const btnOrbit = document.getElementById('btn-cam-orbit');
    const btnReset = document.getElementById('btn-cam-reset');

    const clearActive = () => {
      [btnFull, btnHead, btn34].forEach((b) => b?.classList.remove('active'));
    };

    btnFull?.addEventListener('click', () => {
      clearActive();
      btnFull.classList.add('active');
      this.animateCameraTo(0, 1.35, 4.3);
      this.animateCameraTarget(0, 0.9, 0);
    });

    btnHead?.addEventListener('click', () => {
      clearActive();
      btnHead.classList.add('active');
      // Portrait / head-level zoom
      this.animateCameraTo(0, 1.6, 2.2);
      this.animateCameraTarget(0, 1.5, 0);
    });

    btn34?.addEventListener('click', () => {
      clearActive();
      btn34.classList.add('active');
      this.animateCameraTo(2.4, 1.35, 3.4);
      this.animateCameraTarget(0, 0.9, 0);
    });

    btnOrbit?.addEventListener('click', () => {
      this.controls.autoRotate = !this.controls.autoRotate;
      btnOrbit.classList.toggle('active', this.controls.autoRotate);
    });

    btnReset?.addEventListener('click', () => {
      clearActive();
      btnFull?.classList.add('active');
      this.controls.autoRotate = false;
      btnOrbit?.classList.remove('active');
      this.animateCameraTo(0, 1.35, 4.3);
      this.animateCameraTarget(0, 0.9, 0);
    });
  }

  bindStudioControls() {
    // 1. Dialogue Buttons
    document.getElementById('talk-btn')?.addEventListener('click', () => {
      const data = this.subjects[this.currentSubject];
      const msgEl = document.getElementById('dialogue-message');
      if (msgEl && data) {
        msgEl.textContent = `"${data.tip}"`;
        this.voice.speak(data.tip);
      }
      if (this.veda) this.veda.setPose('idea');
    });

    document.getElementById('speak-btn')?.addEventListener('click', () => {
      const msgEl = document.getElementById('dialogue-message');
      if (msgEl) {
        this.voice.speak(msgEl.textContent);
      }
    });

    // 2. Character Stage Alignment Buttons
    const placementBtns = document.querySelectorAll('[data-align]');
    const stagePlacementEl = document.getElementById('stage-current-placement');

    placementBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        placementBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const alignKey = btn.getAttribute('data-align');
        this.currentPlacement = alignKey;

        if (this.veda) {
          this.veda.alignTo(alignKey);
        }

        const labels = {
          center: 'Stage Center',
          left: 'Present Left',
          right: 'Present Right',
          podium: 'Podium Desk'
        };
        if (stagePlacementEl) {
          stagePlacementEl.textContent = labels[alignKey] || 'Stage Center';
        }
      });
    });

    // 3. User Added Actions & Expressions
    const actionBtns = document.querySelectorAll('[data-pose]');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        actionBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const pose = btn.getAttribute('data-pose');
        if (this.veda) {
          this.veda.setPose(pose);
        }
      });
    });

    // 4. Animation Playback Speed Buttons
    const speedBtns = document.querySelectorAll('[data-speed]');
    speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const speed = parseFloat(btn.getAttribute('data-speed')) || 1.0;
        if (this.veda) {
          this.veda.setAnimationSpeed(speed);
        }
      });
    });

    // 5. Outfit Customizer Buttons
    const outfitBtns = document.querySelectorAll('[data-outfit]');
    outfitBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        outfitBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const outfit = btn.getAttribute('data-outfit');
        if (this.veda) {
          this.veda.setOutfit(outfit);
        }
      });
    });

    // 6. Skin Tone Customizer Buttons
    const toneBtns = document.querySelectorAll('[data-tone]');
    toneBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toneBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tone = btn.getAttribute('data-tone');
        if (this.veda) {
          this.veda.setSkinTone(tone);
        }
      });
    });

    const customTonePicker = document.getElementById('custom-tone-picker');
    customTonePicker?.addEventListener('input', (e) => {
      toneBtns.forEach((b) => b.classList.remove('active'));
      if (this.veda) {
        this.veda.setCustomColor(e.target.value);
      }
    });
  }

  bindVoiceControls() {
    const voiceToggleBtn = document.getElementById('btn-toggle-voice');
    const voiceIcon = document.getElementById('voice-icon');
    const voiceLabel = document.getElementById('voice-label');

    if (voiceToggleBtn) {
      voiceToggleBtn.addEventListener('click', () => {
        const isMuted = this.voice.toggleMute();
        voiceToggleBtn.classList.toggle('muted', isMuted);
        if (voiceIcon) voiceIcon.textContent = isMuted ? '🔇' : '🔊';
        if (voiceLabel) voiceLabel.textContent = isMuted ? 'Muted' : 'Indian Voice';
      });
    }

    // ElevenLabs Modal Controls
    const modal = document.getElementById('eleven-modal');
    const openModalBtn = document.getElementById('eleven-settings-btn');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const saveBtn = document.getElementById('save-eleven-btn');
    const useBrowserBtn = document.getElementById('use-browser-voice-btn');
    const apiKeyInput = document.getElementById('eleven-api-key');
    const voiceIdInput = document.getElementById('eleven-voice-id');

    if (apiKeyInput && this.voice.elevenLabsApiKey) {
      apiKeyInput.value = this.voice.elevenLabsApiKey;
    }

    openModalBtn?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
    });

    closeModalBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    saveBtn?.addEventListener('click', () => {
      const key = apiKeyInput?.value.trim();
      const voiceId = voiceIdInput?.value.trim();
      if (key) {
        this.voice.setApiKey(key);
        if (voiceId) this.voice.elevenLabsVoiceId = voiceId;
        this.voice.provider = 'elevenlabs';
        modal?.classList.add('hidden');
        this.voice.speak("ElevenLabs Indian AI voice activated successfully!");
      }
    });

    useBrowserBtn?.addEventListener('click', () => {
      this.voice.provider = 'indian-tts';
      modal?.classList.add('hidden');
      this.voice.speak("Built-in Indian AI voice activated!");
    });
  }

  bindModelAndAnimationControls() {
    // Model Switcher: Standing Greeting.fbx <-> character.fbx
    const modelToggleBtn = document.getElementById('btn-toggle-model');
    const modelIconEl = document.getElementById('model-icon');
    const modelLabelEl = document.getElementById('model-name-label');

    if (modelToggleBtn) {
      modelToggleBtn.addEventListener('click', () => {
        if (!this.veda) return;
        const nextModel = this.veda.currentModel === 'greeting' ? 'character' : 'greeting';
        const nextFileName = nextModel === 'greeting' ? 'Standing Greeting.fbx' : 'character.fbx';
        const nextIcon = nextModel === 'greeting' ? '🎬' : '👤';

        if (modelLabelEl) modelLabelEl.textContent = `Loading ${nextFileName}...`;

        this.veda.switchModel(
          nextModel,
          (percent) => {
            if (modelLabelEl) modelLabelEl.textContent = `Loading ${percent}%...`;
          },
          () => {
            if (modelLabelEl) modelLabelEl.textContent = nextFileName;
            if (modelIconEl) modelIconEl.textContent = nextIcon;

            this.veda.alignTo(this.currentPlacement);

            const msg = nextModel === 'greeting'
              ? "Switched to animated Standing Greeting model!"
              : "Switched to base character model!";
            const msgEl = document.getElementById('dialogue-message');
            if (msgEl) msgEl.textContent = `"${msg}"`;
            this.voice.speak(msg);
          }
        );
      });
    }

    // Animation Play / Pause Toggle
    const animToggleBtn = document.getElementById('btn-toggle-anim');
    const animIconEl = document.getElementById('anim-icon');
    const animLabelEl = document.getElementById('anim-label');

    if (animToggleBtn) {
      animToggleBtn.addEventListener('click', () => {
        if (!this.veda) return;
        const isPlaying = this.veda.toggleAnimation();
        if (animIconEl) animIconEl.textContent = isPlaying ? '⏸️' : '▶️';
        if (animLabelEl) animLabelEl.textContent = isPlaying ? 'Live' : 'Paused';
        animToggleBtn.classList.toggle('paused', !isPlaying);
      });
    }
  }

  animateCameraTarget(targetX, targetY, targetZ) {
    const startTarget = this.controls.target.clone();
    const destTarget = new THREE.Vector3(targetX, targetY, targetZ);
    let progress = 0;

    const anim = () => {
      progress += 0.08;
      this.controls.target.lerpVectors(startTarget, destTarget, THREE.MathUtils.smoothstep(progress, 0, 1));
      this.controls.update();
      if (progress < 1) requestAnimationFrame(anim);
    };
    anim();
  }

  animateCameraTo(x, y, z) {
    const targetPos = new THREE.Vector3(x, y, z);
    const startPos = this.camera.position.clone();
    let progress = 0;

    const animateCam = () => {
      progress += 0.08;
      this.camera.position.lerpVectors(startPos, targetPos, THREE.MathUtils.smoothstep(progress, 0, 1));
      this.controls.update();
      if (progress < 1) requestAnimationFrame(animateCam);
    };
    animateCam();
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

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

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

class AmazingApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.monster = null;
        this.bunny = null;
        
        // Light circles for characters
        this.monsterLightCircle = null;
        this.bunnyLightCircle = null;
        
        // Sound system
        this.sounds = {};
        this.audioContext = null;
        this.audioInitialized = false;
        
        // Enhanced game features
        this.particles = [];
        this.powerUps = [];
        this.screenShake = { intensity: 0, duration: 0 };
        this.cameraOriginalPosition = new THREE.Vector3();
        
        // NEW: Player input system
        this.keys = {
            w: false, a: false, s: false, d: false,
            space: false, shift: false, r: false
        };
        
        // NEW: Enhanced game state with player control
        this.gameState = {
            // Game flow states
            isPlaying: false,
            gameOver: false,
            
            // Player stats
            score: 0,
            survivalTime: 0,
            lives: 3,
            maxLives: 3,
            
            // Movement and abilities
            bunnySpeed: 5,
            monsterSpeed: 3,
            stamina: 100,
            maxStamina: 100,
            
            // Legacy properties (keeping for compatibility)
            isChasing: false,
            lastDodge: 0,
            combo: 0,
            powerUpActive: false,
            excitement: 0
        };
        
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }

    async init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createPostProcessing();
        this.createLighting();
        this.createEnvironment();
        this.createControls();
        this.createUI();
        await this.loadModels();
        this.createLightCircles();
        this.initSoundSystem();
        this.setupEventListeners();
        this.setupInputHandling(); // NEW: Add input handling
        this.startGameLoop();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
        
        // Set natural sky color as fallback
        this.scene.background = new THREE.Color(0x87ceeb);
        
        // Add atmospheric fog for depth and realism
        this.scene.fog = new THREE.Fog(0xa0c4e8, 20, 80);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraOriginalPosition.copy(this.camera.position);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        document.getElementById('viewer-container').appendChild(this.renderer.domElement);
    }

    createPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom effect for magical glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4, // strength
            0.2, // radius
            0.95 // threshold
        );
        this.composer.addPass(bloomPass);
        
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    createLighting() {
        // Enhanced ambient light for natural outdoor illumination
        this.ambientLight = new THREE.AmbientLight(0xb8e8ff, 0.6);
        this.scene.add(this.ambientLight);

        // Sun-like directional light for primary illumination
        this.sunLight = new THREE.DirectionalLight(0xffe8d4, 2.5);
        this.sunLight.position.set(8, 15, 5);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 50;
        this.sunLight.shadow.camera.left = -25;
        this.sunLight.shadow.camera.right = 25;
        this.sunLight.shadow.camera.top = 25;
        this.sunLight.shadow.camera.bottom = -25;
        this.sunLight.shadow.bias = -0.0001;
        this.scene.add(this.sunLight);

        // Hemisphere light for sky/ground illumination balance
        this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c2a, 0.8);
        this.hemiLight.position.set(0, 20, 0);
        this.scene.add(this.hemiLight);

        // Character highlighting lights that follow the characters
        this.monsterHighlight = new THREE.PointLight(0xff4080, 1.5, 8);
        this.monsterHighlight.position.set(4, 3, 0);
        this.scene.add(this.monsterHighlight);

        this.bunnyHighlight = new THREE.PointLight(0x80ff40, 1.0, 6);
        this.bunnyHighlight.position.set(0, 2, 2);
        this.scene.add(this.bunnyHighlight);

        // Soft fill light to reduce harsh shadows
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        this.fillLight.position.set(-8, 10, -5);
        this.scene.add(this.fillLight);
    }

    createEnvironment() {
        // Create procedural grass field
        this.createProceduralGrass();
        
        // Create beautiful sky background
        this.createSkyBackground();
        
        // Add environmental elements
        this.createBackgroundElements();
    }

    createProceduralGrass() {
        // Create grass field with instanced geometry for performance
        const grassBladeGeometry = new THREE.PlaneGeometry(0.1, 0.3);
        const grassMaterial = new THREE.MeshLambertMaterial({
            color: 0x4a7c2a,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        // Create grass instances
        const grassCount = 2000;
        const grassField = new THREE.InstancedMesh(grassBladeGeometry, grassMaterial, grassCount);
        
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const scale = new THREE.Vector3();

        for (let i = 0; i < grassCount; i++) {
            // Random position across the field
            position.set(
                (Math.random() - 0.5) * 30,
                0,
                (Math.random() - 0.5) * 30
            );

            // Random rotation
            rotation.set(0, Math.random() * Math.PI * 2, 0);

            // Random scale for variety
            const scaleMultiplier = 0.5 + Math.random() * 1.5;
            scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

            matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
            grassField.setMatrixAt(i, matrix);
        }

        grassField.instanceMatrix.needsUpdate = true;
        grassField.castShadow = false;
        grassField.receiveShadow = true;
        this.scene.add(grassField);

        // Store reference for animation
        this.grassField = grassField;

        // Create ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x2d4a1c,
            transparent: true,
            opacity: 0.8
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createSkyBackground() {
        // Create gradient sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 direction = normalize(vWorldPosition);
                    float elevation = direction.y;
                    
                    // Create gradient from horizon to zenith
                    vec3 horizonColor = vec3(0.9, 0.6, 0.3);
                    vec3 zenithColor = vec3(0.1, 0.3, 0.8);
                    
                    // Add time-based color variation
                    float timeOffset = sin(time * 0.1) * 0.1;
                    horizonColor += timeOffset;
                    zenithColor += timeOffset * 0.5;
                    
                    vec3 skyColor = mix(horizonColor, zenithColor, smoothstep(-0.2, 0.8, elevation));
                    
                    // Add some cloud-like noise
                    float noise = sin(direction.x * 10.0 + time * 0.2) * sin(direction.z * 10.0 + time * 0.15) * 0.1;
                    skyColor += noise * vec3(1.0, 1.0, 1.0);
                    
                    gl_FragColor = vec4(skyColor, 1.0);
                }
            `,
            uniforms: {
                time: { value: 0 }
            },
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        this.skyMaterial = skyMaterial;
    }

    createBackgroundElements() {
        // Create floating orbs in the background
        const orbCount = 20;
        const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        
        for (let i = 0; i < orbCount; i++) {
            const orbMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
                emissive: new THREE.Color().setHSL(Math.random(), 0.5, 0.1),
                transparent: true,
                opacity: 0.6
            });

            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            orb.position.set(
                (Math.random() - 0.5) * 40,
                2 + Math.random() * 8,
                (Math.random() - 0.5) * 40
            );

            orb.userData = {
                originalPosition: orb.position.clone(),
                floatSpeed: 0.5 + Math.random() * 1.5,
                floatOffset: Math.random() * Math.PI * 2
            };

            this.scene.add(orb);
            
            // Store reference for animation
            if (!this.backgroundOrbs) this.backgroundOrbs = [];
            this.backgroundOrbs.push(orb);
        }

        // Create distant mountains/hills using geometry
        this.createDistantHills();
    }

    createDistantHills() {
        const hillCount = 8;
        const hillGeometry = new THREE.ConeGeometry(5, 4, 8);
        
        for (let i = 0; i < hillCount; i++) {
            const hillMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(0.3 + Math.random() * 0.2, 0.4, 0.3 + Math.random() * 0.2),
                transparent: true,
                opacity: 0.7
            });

            const hill = new THREE.Mesh(hillGeometry, hillMaterial);
            hill.position.set(
                (Math.random() - 0.5) * 60,
                1,
                -15 - Math.random() * 10
            );
            
            hill.scale.set(
                1 + Math.random() * 2,
                0.5 + Math.random() * 1.5,
                1 + Math.random() * 2
            );

            hill.receiveShadow = true;
            this.scene.add(hill);
        }
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 25;
        this.controls.maxPolarAngle = Math.PI * 0.8;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    createUI() {
        // Create enhanced interactive game UI
        const ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.innerHTML = `
            <div class="ui-panel">
                <div class="game-stats">
                    <div class="score">Score: <span id="score">0</span></div>
                    <div class="survival-time">Time: <span id="survival-time">0.0</span>s</div>
                    <div class="lives">Lives: <span id="lives">❤️❤️❤️</span></div>
                    <div class="combo">Combo: <span id="combo">0</span></div>
                </div>
                
                <div class="stamina-container">
                    <div class="stamina-label">Stamina</div>
                    <div class="stamina-bar">
                        <div class="stamina-fill" id="stamina-fill"></div>
                    </div>
                </div>
                
                <div class="power-up-status" id="power-up-status" style="display: none;">
                    ⚡ SPEED BOOST ACTIVE!
                </div>
                
                <div class="controls">
                    <button id="start-game">� START GAME</button>
                    <button id="mute-sound">🔊 Mute</button>
                </div>
                
                <div class="instructions">
                    <strong>� CONTROLS:</strong><br>
                    WASD/Arrows: Move bunny<br>
                    SPACE: Bunny hop (uses stamina)<br>
                    SHIFT: Sprint (drains stamina)<br>
                    CLICK: Dash toward mouse<br>
                    R: Restart when game over<br><br>
                    🎯 <strong>OBJECTIVE:</strong> Survive as long as possible!<br>
                    ⭐ Collect golden power-ups for speed boost!<br>
                    🎵 Audio will start after first interaction
                </div>
            </div>
            
            <div class="game-over-screen" id="game-over-screen" style="display: none;">
                <div class="game-over-content">
                    <h2>🎮 MONSTER CHASE GAME</h2>
                    <div id="game-over-message">
                        <h3>Ready to Play?</h3>
                        <p>Control the bunny to escape the monster!</p>
                        <p><em>Use WASD to move, SPACE to hop, and survive as long as possible!</em></p>
                    </div>
                    <button class="start-button" id="game-over-start">🏃 START GAME</button>
                </div>
            </div>
        `;
        document.body.appendChild(ui);
        
        // Show initial game over screen
        document.getElementById('game-over-screen').style.display = 'flex';
    }

    async loadModels() {
        // Load monster with enhancements
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync('3D_Purple_Monster.glb');
            this.monster = gltf.scene;

            this.monster.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        node.material.envMapIntensity = 1.5;
                        node.material.needsUpdate = true;
                    }
                }
            });

            // Center and scale monster
            const box = new THREE.Box3().setFromObject(this.monster);
            const center = box.getCenter(new THREE.Vector3());
            this.monster.position.sub(center);

            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            this.monster.scale.multiplyScalar(scale);

            this.monster.position.set(4, 0, 0);
            this.monster.userData = {
                originalPosition: this.monster.position.clone(),
                velocity: new THREE.Vector3(),
                targetPosition: new THREE.Vector3(4, 0, 0),
                isChasing: false,
                frustration: 0
            };
            
            this.scene.add(this.monster);
        } catch (error) {
            console.error('Error loading monster model:', error);
        }

        // Load bunny model
        try {
            const bunnyGltf = await loader.loadAsync('Woven_Bunny_Doll.glb'); 
            this.bunny = bunnyGltf.scene;

            this.bunny.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        if (node.material.clone && typeof node.material.envMapIntensity !== 'undefined') {
                            node.material = node.material.clone();
                            node.material.envMapIntensity = 1.5;
                        } else if (typeof node.material.envMapIntensity !== 'undefined') {
                            node.material.envMapIntensity = 1.5;
                        }
                        node.material.needsUpdate = true;
                    }
                }
            });

            // Center and scale bunny
            const bunnyBox = new THREE.Box3().setFromObject(this.bunny);
            const bunnyCenter = bunnyBox.getCenter(new THREE.Vector3());
            this.bunny.position.sub(bunnyCenter);

            const bunnySize = bunnyBox.getSize(new THREE.Vector3());
            const desiredHeight = 1.5;
            let bunnyScale = 1;
            if (bunnySize.y > 0) {
                bunnyScale = desiredHeight / bunnySize.y;
            }
            this.bunny.scale.set(bunnyScale, bunnyScale, bunnyScale);

            this.bunny.position.set(0, 0, 2);

            this.bunny.userData = {
                originalPosition: this.bunny.position.clone(),
                velocity: new THREE.Vector3(),
                targetPosition: new THREE.Vector3(0, 0, 2)
            };

            this.scene.add(this.bunny);
            console.log('Bunny model loaded and added to scene successfully.');
        } catch (error) {
            console.error('Error loading bunny model:', error);
        }
    }

    createLightCircles() {
        // Monster light circle (red/purple)
        const monsterCircleGeometry = new THREE.RingGeometry(1.5, 2.2, 32);
        const monsterCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0080,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.monsterLightCircle = new THREE.Mesh(monsterCircleGeometry, monsterCircleMaterial);
        this.monsterLightCircle.rotation.x = -Math.PI / 2;
        this.scene.add(this.monsterLightCircle);

        // Bunny light circle (green/yellow)
        const bunnyCircleGeometry = new THREE.RingGeometry(0.8, 1.3, 32);
        const bunnyCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF80,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        this.bunnyLightCircle = new THREE.Mesh(bunnyCircleGeometry, bunnyCircleMaterial);
        this.bunnyLightCircle.rotation.x = -Math.PI / 2;
        this.scene.add(this.bunnyLightCircle);
    }

    async initSoundSystem() {
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sound effects using Web Audio API
            this.sounds = {
                chaseStart: this.createSound([440, 880, 1320], 0.5, 'sawtooth'),
                dodge: this.createSound([880, 1760, 2640], 0.3, 'sine'),
                combo: this.createSound([1320, 1760, 2200], 0.4, 'triangle'),
                powerUp: this.createSound([660, 880, 1100, 1320], 0.6, 'square'),
                background: this.createAmbientSound(),
                monster: this.createSound([220, 110, 165], 0.2, 'sawtooth'),
                sparkle: this.createSound([2640, 3520, 4400], 0.1, 'sine')
            };
            
            this.audioInitialized = true;
            console.log('Sound system initialized!');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    createSound(frequencies, volume = 0.3, waveType = 'sine') {
        return {
            play: (duration = 0.3) => {
                if (!this.audioInitialized) return;
                
                try {
                    const gainNode = this.audioContext.createGain();
                    gainNode.connect(this.audioContext.destination);
                    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

                    frequencies.forEach((freq, index) => {
                        const oscillator = this.audioContext.createOscillator();
                        oscillator.connect(gainNode);
                        oscillator.type = waveType;
                        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        oscillator.start(this.audioContext.currentTime + index * 0.1);
                        oscillator.stop(this.audioContext.currentTime + duration);
                    });
                } catch (error) {
                    console.warn('Sound playback failed:', error);
                }
            }
        };
    }

    createAmbientSound() {
        return {
            start: () => {
                if (!this.audioInitialized) return;
                
                try {
                    const gainNode = this.audioContext.createGain();
                    gainNode.connect(this.audioContext.destination);
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

                    // Create multiple oscillators for ambient texture
                    [80, 120, 160, 200].forEach((freq, index) => {
                        const oscillator = this.audioContext.createOscillator();
                        oscillator.connect(gainNode);
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(freq + Math.sin(Date.now() * 0.001) * 5, this.audioContext.currentTime);
                        oscillator.start();
                        
                        setTimeout(() => {
                            try {
                                oscillator.stop();
                            } catch (e) {}
                        }, 30000); // 30 seconds
                    });
                } catch (error) {
                    console.warn('Ambient sound failed:', error);
                }
            }
        };
    }

    createPowerUp() {
        const powerUpGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const powerUpMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.8
        });
        
        const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        powerUp.position.set(
            (Math.random() - 0.5) * 12,
            1,
            (Math.random() - 0.5) * 12
        );
        
        powerUp.userData = {
            type: 'speed',
            collected: false,
            rotationSpeed: 0.1,
            bobSpeed: 0.05,
            originalY: powerUp.position.y
        };
        
        this.powerUps.push(powerUp);
        this.scene.add(powerUp);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (!powerUp.userData.collected) {
                this.scene.remove(powerUp);
                this.powerUps = this.powerUps.filter(p => p !== powerUp);
            }
        }, 10000);
    }

    createScreenShake(intensity = 0.1, duration = 0.3) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.cameraOriginalPosition.copy(this.camera.position);
    }

    createMagicalParticles(position, count = 15, color = 0x00FFFF) {
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            ));
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    Math.random() * 0.3 + 0.1,
                    (Math.random() - 0.5) * 0.3
                ),
                life: 1.0,
                gravity: -0.01
            };
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        // Game controls - Updated for new interactive system
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('game-over-start').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('mute-sound').addEventListener('click', (e) => {
            if (this.audioContext) {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                    e.target.textContent = '🔊 Mute';
                } else {
                    this.audioContext.suspend();
                    e.target.textContent = '🔇 Unmute';
                }
            }
        });

        // Mouse tracking for interactions and dash ability
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Mouse click for dash ability
        window.addEventListener('click', (event) => {
            if (this.gameState.isPlaying && !this.gameState.gameOver) {
                this.performMouseDash(event);
            }
        });
    }
    
    // NEW: Input handling system for player control
    setupInputHandling() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW': case 'ArrowUp': this.keys.w = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.a = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.s = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.d = true; break;
                case 'Space': 
                    this.keys.space = true; 
                    event.preventDefault(); // Prevent page scroll
                    break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.shift = true; break;
                case 'KeyR': 
                    this.keys.r = true;
                    if (this.gameState.gameOver) this.startGame();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': case 'ArrowUp': this.keys.w = false; break;
                case 'KeyA': case 'ArrowLeft': this.keys.a = false; break;
                case 'KeyS': case 'ArrowDown': this.keys.s = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.d = false; break;
                case 'Space': this.keys.space = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.shift = false; break;
                case 'KeyR': this.keys.r = false; break;
            }
        });
    }

    // NEW: Enhanced game start method
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.gameOver = false;
        this.gameState.score = 0;
        this.gameState.survivalTime = 0;
        this.gameState.lives = this.gameState.maxLives;
        this.gameState.stamina = this.gameState.maxStamina;
        this.gameState.combo = 0;
        this.gameState.excitement = 0;
        this.gameState.isChasing = true; // Keep legacy compatibility
        
        // Reset character positions
        if (this.bunny) this.bunny.position.set(0, 0, 0);
        if (this.monster) {
            this.monster.position.set(8, 0, 8);
            this.monster.userData.isChasing = true;
        }
        
        // Hide game over screen
        document.getElementById('game-over-screen').style.display = 'none';
        
        // Play chase start sound
        if (this.sounds.chaseStart) {
            this.sounds.chaseStart.play(1.0);
        }
        
        // Start ambient background sound
        if (this.sounds.background) {
            this.sounds.background.start();
        }
        
        // Create initial power-up
        this.createPowerUp();
        
        // Screen shake for drama
        this.createScreenShake(0.05, 0.5);
        
        // Disable auto-rotate during play
        this.controls.autoRotate = false;
        
        // Restart clock
        this.clock.start();
        
        this.updateUI();
    }

    // LEGACY: Keep original method for compatibility
    startChase() {
        this.startGame();
    }
    
    // NEW: Player-controlled bunny movement
    updatePlayerMovement(deltaTime) {
        if (!this.bunny || this.gameState.gameOver || !this.gameState.isPlaying) return;
        
        const baseSpeed = this.gameState.bunnySpeed;
        let currentSpeed = baseSpeed;
        
        // Sprint mechanic
        if (this.keys.shift && this.gameState.stamina > 0) {
            currentSpeed *= 1.8;
            this.gameState.stamina -= 60 * deltaTime; // Drain stamina
        } else {
            // Regenerate stamina when not sprinting
            this.gameState.stamina = Math.min(this.gameState.maxStamina, 
                this.gameState.stamina + 30 * deltaTime);
        }
        
        // Movement input
        const movement = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.w) movement.z -= 1;
        if (this.keys.s) movement.z += 1;
        if (this.keys.a) movement.x -= 1;
        if (this.keys.d) movement.x += 1;
        
        // Normalize diagonal movement
        if (movement.length() > 0) {
            movement.normalize();
            movement.multiplyScalar(currentSpeed * deltaTime);
            this.bunny.position.add(movement);
        }
        
        // Bunny hop ability
        if (this.keys.space && this.gameState.stamina >= 20) {
            this.performBunnyHop();
            this.keys.space = false; // Prevent continuous hopping
        }
        
        // Keep bunny in bounds
        this.bunny.position.x = Math.max(-12, Math.min(12, this.bunny.position.x));
        this.bunny.position.z = Math.max(-12, Math.min(12, this.bunny.position.z));
        
        // Clamp stamina
        this.gameState.stamina = Math.max(0, Math.min(this.gameState.maxStamina, this.gameState.stamina));
    }
    
    // NEW: Special abilities
    performBunnyHop() {
        if (this.gameState.stamina >= 20) {
            this.gameState.stamina -= 20;
            
            // Quick directional boost
            const forward = new THREE.Vector3(0, 0, -2);
            if (this.keys.w || this.keys.s || this.keys.a || this.keys.d) {
                // Hop in movement direction
                if (this.keys.w) forward.set(0, 0, -2);
                if (this.keys.s) forward.set(0, 0, 2);
                if (this.keys.a) forward.set(-2, 0, 0);
                if (this.keys.d) forward.set(2, 0, 0);
                // Diagonal combinations
                if (this.keys.w && this.keys.a) forward.set(-1.4, 0, -1.4);
                if (this.keys.w && this.keys.d) forward.set(1.4, 0, -1.4);
                if (this.keys.s && this.keys.a) forward.set(-1.4, 0, 1.4);
                if (this.keys.s && this.keys.d) forward.set(1.4, 0, 1.4);
            }
            
            this.bunny.position.add(forward);
            
            // Visual and audio feedback
            this.createHopEffect();
            if (this.sounds.dodge) {
                this.sounds.dodge.play(0.6);
            }
        }
    }
    
    performMouseDash(event) {
        if (this.gameState.stamina >= 30) {
            this.gameState.stamina -= 30;
            
            // Convert mouse position to world coordinates
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            
            // Cast ray to ground plane
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const targetPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, targetPoint);
            
            // Dash toward target (limited distance)
            const dashDirection = targetPoint.sub(this.bunny.position);
            const dashDistance = Math.min(4, dashDirection.length());
            
            if (dashDistance > 0.5) { // Minimum dash distance
                dashDirection.normalize().multiplyScalar(dashDistance);
                this.bunny.position.add(dashDirection);
                
                this.createDashEffect(this.bunny.position);
                this.createScreenShake(0.08, 0.2);
                
                if (this.sounds.sparkle) {
                    this.sounds.sparkle.play(0.4);
                }
            }
        }
    }
    
    // NEW: Smart monster AI that chases the player
    updateMonsterAI(deltaTime) {
        if (!this.monster || !this.bunny || this.gameState.gameOver || !this.gameState.isPlaying) return;
        
        // Calculate direction to bunny
        const direction = new THREE.Vector3()
            .subVectors(this.bunny.position, this.monster.position)
            .normalize();
        
        // Progressive difficulty - monster gets faster over time
        const timeMultiplier = 1 + (this.gameState.survivalTime / 30) * 0.5;
        const currentSpeed = this.gameState.monsterSpeed * timeMultiplier;
        
        // Move monster toward bunny
        const movement = direction.multiplyScalar(currentSpeed * deltaTime);
        this.monster.position.add(movement);
        
        // Monster looks at bunny
        this.monster.lookAt(this.bunny.position);
        
        // Keep monster in bounds
        this.monster.position.x = Math.max(-15, Math.min(15, this.monster.position.x));
        this.monster.position.z = Math.max(-15, Math.min(15, this.monster.position.z));
        
        // Monster makes sounds when getting close
        const distance = this.monster.position.distanceTo(this.bunny.position);
        if (distance < 3 && Math.random() < 0.02) {
            if (this.sounds.monster) {
                this.sounds.monster.play(0.3);
            }
        }
    }
    
    // NEW: Collision detection and game over
    checkCollisions() {
        if (!this.monster || !this.bunny || this.gameState.gameOver || !this.gameState.isPlaying) return;
        
        const distance = this.monster.position.distanceTo(this.bunny.position);
        
        // Monster caught the bunny!
        if (distance < 1.5) {
            this.bunnyHit();
        }
        
        // Warning when monster gets close
        if (distance < 3 && distance > 1.5) {
            this.createDangerWarning();
        }
    }
    
    bunnyHit() {
        this.gameState.lives--;
        
        // Create hit effects
        this.createHitEffect();
        this.createScreenShake(0.15, 0.6);
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions for next life
            this.bunny.position.set(0, 0, 0);
            this.monster.position.set(8, 0, 8);
            
            // Temporary invincibility period
            setTimeout(() => {
                // Could add visual indicator for invincibility here
            }, 1500);
        }
    }
    
    gameOver() {
        this.gameState.gameOver = true;
        this.gameState.isPlaying = false;
        
        // Stop background sound
        if (this.sounds.background) {
            this.sounds.background.stop();
        }
        
        // Re-enable auto-rotate
        this.controls.autoRotate = true;
        
        // Show game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        const message = document.getElementById('game-over-message');
        
        message.innerHTML = `
            <h3>🏆 Game Over!</h3>
            <p><strong>Final Score:</strong> ${this.gameState.score}</p>
            <p><strong>Survival Time:</strong> ${this.gameState.survivalTime.toFixed(1)}s</p>
            <p>The monster caught you!</p>
            <p><em>Press R or click START to play again</em></p>
        `;
        
        gameOverScreen.style.display = 'flex';
        
        // Create final score effect
        this.createSuccessFlash();
    }
    
    // NEW: Visual effects for interactions
    createHopEffect() {
        this.createMagicalParticles(this.bunny.position, 8, 0x00FF80);
    }
    
    createDashEffect(position) {
        this.createMagicalParticles(position, 12, 0x80FFFF);
        this.createSparkleEffect(position);
    }
    
    createHitEffect() {
        this.createMagicalParticles(this.bunny.position, 20, 0xFF4444);
        if (this.sounds.monster) {
            this.sounds.monster.play(0.8);
        }
    }
    
    createDangerWarning() {
        // Visual warning when monster is close - could add red screen tint
        if (Math.random() < 0.01) { // Occasional warning effect
            this.createScreenShake(0.02, 0.1);
        }
    }



    createSparkleEffect(position) {
        const sparkleCount = 10; // Changed from 20
        const sparkles = [];
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 1, 0.8),
                    transparent: true,
                    opacity: 1
                })
            );
            
            sparkle.position.copy(position);
            sparkle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            
            sparkle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.2
                ),
                life: 1.0
            };
            
            sparkles.push(sparkle);
            this.scene.add(sparkle);
        }
        
        // Animate sparkles
        const animateSparkles = () => {
            sparkles.forEach((sparkle, index) => {
                sparkle.position.add(sparkle.userData.velocity);
                sparkle.userData.life -= 0.04; // Changed from 0.02
                sparkle.material.opacity = sparkle.userData.life;
                
                if (sparkle.userData.life <= 0) {
                    this.scene.remove(sparkle);
                    sparkles.splice(index, 1);
                }
            });
            
            if (sparkles.length > 0) {
                requestAnimationFrame(animateSparkles);
            }
        };
        
        animateSparkles();
    }

    createSuccessFlash() {
        const flash = document.createElement('div');
        flash.className = 'success-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 300);
    }

    createFloatingScore(points) {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'floating-score';
        scoreElement.textContent = `+${points}`;
        scoreElement.style.left = Math.random() * (window.innerWidth - 100) + 'px';
        scoreElement.style.top = Math.random() * (window.innerHeight - 100) + 100 + 'px';
        
        document.body.appendChild(scoreElement);
        
        setTimeout(() => {
            if (document.body.contains(scoreElement)) {
                document.body.removeChild(scoreElement);
            }
        }, 2000);
    }

    createComboEffect() {
        const comboElement = document.createElement('div');
        comboElement.className = 'combo-multiplier';
        comboElement.textContent = `${this.gameState.combo}x COMBO!`;
        
        document.body.appendChild(comboElement);
        
        setTimeout(() => {
            if (document.body.contains(comboElement)) {
                document.body.removeChild(comboElement);
            }
        }, 1000);
    }

    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('combo').textContent = this.gameState.combo;
        document.getElementById('survival-time').textContent = this.gameState.survivalTime.toFixed(1);
        document.getElementById('lives').textContent = '❤️'.repeat(this.gameState.lives);
        
        // Update stamina bar
        const staminaPercent = (this.gameState.stamina / this.gameState.maxStamina) * 100;
        const staminaFill = document.getElementById('stamina-fill');
        if (staminaFill) {
            staminaFill.style.width = staminaPercent + '%';
        }
        
        // Show/hide power-up status
        const powerUpStatus = document.getElementById('power-up-status');
        if (this.gameState.powerUpActive) {
            powerUpStatus.style.display = 'block';
            powerUpStatus.style.animation = 'pulse 0.5s ease-in-out infinite alternate';
        } else {
            powerUpStatus.style.display = 'none';
        }
    }

    startGameLoop() {
        setInterval(() => {
            this.updateGameLogic();
        }, 16); // ~60 FPS
    }

    updateGameLogic() {
        const time = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();

        // Update game time and score during play
        if (this.gameState.isPlaying && !this.gameState.gameOver) {
            this.gameState.survivalTime += deltaTime;
            this.gameState.score = Math.floor(this.gameState.survivalTime * 10);
        }

        // Update light circles to follow characters
        if (this.monster && this.monsterLightCircle) {
            this.monsterLightCircle.position.copy(this.monster.position);
            this.monsterLightCircle.position.y = -0.1;
            // Monster circle pulses more aggressively during chase
            this.monsterLightCircle.rotation.z -= 0.03;
            const chaseIntensity = this.gameState.isPlaying ? 0.2 : 0.1;
            this.monsterLightCircle.material.opacity = 0.4 + Math.sin(time * 5) * chaseIntensity;
            
            // Change color based on distance to bunny
            if (this.bunny) {
                const distance = this.monster.position.distanceTo(this.bunny.position);
                if (distance < 3) {
                    this.monsterLightCircle.material.color.setHex(0xFF0000); // Red when close
                } else {
                    this.monsterLightCircle.material.color.setHex(0xFF0080); // Purple when far
                }
            }
        }

        if (this.bunny && this.bunnyLightCircle) {
            this.bunnyLightCircle.position.copy(this.bunny.position);
            this.bunnyLightCircle.position.y = -0.1;
            this.bunnyLightCircle.rotation.z += 0.01;
            this.bunnyLightCircle.material.opacity = 0.25 + Math.sin(time * 2) * 0.05;
        }

        // Update particles
        this.particles.forEach((particle, index) => {
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y += particle.userData.gravity;
            particle.userData.life -= 0.02;
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(index, 1);
            }
        });

        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.rotation.y += powerUp.userData.rotationSpeed;
            powerUp.position.y = powerUp.userData.originalY + Math.sin(time * 3 + index) * 0.3;
            
            // Check for collection by bunny
            if (this.bunny && !powerUp.userData.collected) {
                const distance = powerUp.position.distanceTo(this.bunny.position);
                if (distance < 1) {
                    powerUp.userData.collected = true;
                    this.collectPowerUp(powerUp);
                    this.scene.remove(powerUp);
                    this.powerUps.splice(index, 1);
                }
            }
        });

        // NEW: Player-controlled gameplay logic
        if (this.gameState.isPlaying && !this.gameState.gameOver) {
            // Update player movement
            this.updatePlayerMovement(deltaTime);
            
            // Update monster AI
            this.updateMonsterAI(deltaTime);
            
            // Check collisions
            this.checkCollisions();
            
            // Spawn power-ups occasionally
            if (Math.random() < 0.003) { // Reduced frequency
                this.createPowerUp();
            }
        } else {
            // LEGACY: When not playing, keep some automated behavior for visual appeal
            if (this.bunny && this.bunny.userData) {
                // Gentle bobbing animation for Y position when not playing
                this.bunny.position.y = this.bunny.userData.originalPosition.y + (Math.sin(time * 2.5) * 0.15);
            }
        }

        // Update UI
        this.updateUI();
    }

    collectPowerUp(powerUp) {
        // Play power-up sound
        if (this.sounds.powerUp) {
            this.sounds.powerUp.play(0.8);
        }
        
        // Activate power-up effect
        this.gameState.powerUpActive = true;
        this.gameState.score += 50;
        
        // Create explosion effect
        this.createMagicalParticles(powerUp.position, 30, 0xFFD700);
        this.createScreenShake(0.1, 0.4);
        
        // Show power-up message
        this.createFloatingScore("POWER UP!");
        
        // Power-up lasts 5 seconds
        setTimeout(() => {
            this.gameState.powerUpActive = false;
        }, 5000);
        
        this.updateUI();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Handle screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= 0.016; // Assuming 60fps
            
            if (this.screenShake.duration > 0) {
                // Apply random shake offset
                const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
                const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
                const shakeZ = (Math.random() - 0.5) * this.screenShake.intensity;
                
                this.camera.position.copy(this.cameraOriginalPosition);
                this.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
            } else {
                // Restore original position
                this.camera.position.copy(this.cameraOriginalPosition);
            }
        }

        // ENHANCED DYNAMIC LIGHTING SYSTEM
        if (this.ambientLight && this.monsterHighlight && this.bunnyHighlight) {
            const excitementFactor = this.gameState.excitement / 100;
            
            // Animate ambient light subtly
            this.ambientLight.intensity = 0.6 + Math.sin(time * 0.5) * 0.1;
            
            // Update character highlight positions and intensities
            if (this.monster) {
                this.monsterHighlight.position.copy(this.monster.position);
                this.monsterHighlight.position.y += 2;
                this.monsterHighlight.intensity = 1.5 + Math.sin(time * 2.5) * (0.3 + excitementFactor * 0.7);
                // Pulse more intensely during chase
                if (this.gameState.isChasing) {
                    this.monsterHighlight.intensity *= 1.5;
                }
            }
            
            if (this.bunny) {
                this.bunnyHighlight.position.copy(this.bunny.position);
                this.bunnyHighlight.position.y += 1.5;
                this.bunnyHighlight.intensity = 1.0 + Math.sin(time * 1.8) * 0.2;
            }
            
            // Animate sun light for day/night cycle effect
            if (this.sunLight) {
                this.sunLight.intensity = 2.5 + Math.sin(time * 0.1) * 0.3;
            }
        }

        // Animate sky background
        if (this.skyMaterial) {
            this.skyMaterial.uniforms.time.value = time;
        }

        // Animate grass swaying
        if (this.grassField) {
            // Simple wind effect on grass
            const windStrength = 0.1 + Math.sin(time * 0.3) * 0.05;
            this.grassField.rotation.x = Math.sin(time * 0.5) * windStrength;
        }

        // Animate background orbs
        if (this.backgroundOrbs) {
            this.backgroundOrbs.forEach((orb, index) => {
                orb.position.y = orb.userData.originalPosition.y + 
                    Math.sin(time * orb.userData.floatSpeed + orb.userData.floatOffset) * 0.5;
                orb.rotation.y += 0.01;
                orb.material.opacity = 0.6 + Math.sin(time * 2 + index) * 0.2;
            });
        }
        
        // Dynamic camera movement during chase
        if (this.gameState.isChasing && this.bunny && this.monster) {
            const distance = this.bunny.position.distanceTo(this.monster.position);
            if (distance < 4) {
                // Camera follows the action more closely
                const midPoint = new THREE.Vector3()
                    .addVectors(this.bunny.position, this.monster.position)
                    .multiplyScalar(0.5);
                
                this.controls.target.lerp(midPoint, 0.02);
            }
        }
        
        // Update controls and render
        this.controls.update();
        this.composer.render();
    }
}

// Initialize the amazing app
window.addEventListener('load', () => {
    new AmazingApp();
});

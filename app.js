import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { spoonModelData } from './spoon-model.js';

class AmazingApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.spoon = null;
        this.monster = null;
        this.bunny = null;
        
        // Light circles for characters
        this.spoonLightCircle = null;
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
        
        this.gameState = {
            score: 0,
            isChasing: false,
            spoonSpeed: 0.02,
            monsterSpeed: 0.015,
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
        this.spoonHighlight = new THREE.PointLight(0x00ffff, 1.5, 8);
        this.spoonHighlight.position.set(-4, 3, 0);
        this.scene.add(this.spoonHighlight);

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
        // Create game UI
        const ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.innerHTML = `
            <div class="ui-panel">
                <div class="score">Score: <span id="score">0</span></div>
                <div class="combo">Combo: <span id="combo">0</span></div>
                <div class="excitement">Excitement: <span id="excitement">0</span>%</div>
                <div class="power-up-status" id="power-up-status" style="display: none;">
                    ⚡ SPEED BOOST ACTIVE!
                </div>
                <div class="controls">
                    <button id="start-chase">🏃 Start Chase!</button>
                    <button id="help-spoon">✨ Help Spoon!</button>
                    <button id="mute-sound">🔊 Mute</button>
                </div>
                <div class="instructions">
                    🎯 Click "Help Spoon!" when monster gets close!<br>
                    ⭐ Collect golden power-ups for speed boost!<br>
                    🎵 Audio will start after first interaction
                </div>
            </div>
        `;
        document.body.appendChild(ui);
    }

    async loadModels() {
        // Create enhanced spoon
        const spoonGeometry = new THREE.BufferGeometry();
        spoonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spoonModelData.positions, 3));
        spoonGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(spoonModelData.normals, 3));
        spoonGeometry.setIndex(spoonModelData.indices);

        const spoonMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.5
        });

        this.spoon = new THREE.Mesh(spoonGeometry, spoonMaterial);
        this.spoon.castShadow = true;
        this.spoon.receiveShadow = true;
        this.spoon.position.set(-4, 0, 0);
        this.spoon.userData = {
            originalPosition: this.spoon.position.clone(),
            velocity: new THREE.Vector3(),
            targetPosition: new THREE.Vector3(-4, 0, 0),
            isEvading: false
        };
        this.scene.add(this.spoon);

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
        // Spoon light circle (silver/blue)
        const spoonCircleGeometry = new THREE.RingGeometry(1.2, 1.8, 32);
        const spoonCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.spoonLightCircle = new THREE.Mesh(spoonCircleGeometry, spoonCircleMaterial);
        this.spoonLightCircle.rotation.x = -Math.PI / 2;
        this.scene.add(this.spoonLightCircle);

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

        // Game controls
        document.getElementById('start-chase').addEventListener('click', () => {
            this.startChase();
        });

        document.getElementById('help-spoon').addEventListener('click', () => {
            this.helpSpoon();
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

        // Mouse tracking for interactions
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    startChase() {
        this.gameState.isChasing = true;
        this.gameState.score = 0;
        this.gameState.combo = 0;
        this.gameState.excitement = 0;
        this.updateUI();
        
        if (this.monster) {
            this.monster.userData.isChasing = true;
        }
        
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
        
        // Add excitement particles
        this.createMagicalParticles(this.spoon.position, 20, 0x00FFFF);
        
        // Screen shake for drama
        this.createScreenShake(0.05, 0.5);
        
        // Disable auto-rotate during chase
        this.controls.autoRotate = false;
    }

    helpSpoon() {
        if (!this.gameState.isChasing || !this.spoon || !this.monster) return;
        
        const distance = this.spoon.position.distanceTo(this.monster.position);
        
        if (distance < 3) {
            // Successful dodge!
            const points = 10 + (this.gameState.combo * 5);
            this.gameState.score += points;
            this.gameState.combo++;
            this.gameState.lastDodge = Date.now();
            this.gameState.excitement = Math.min(100, this.gameState.excitement + 20);
            
            // Play dodge sound
            if (this.sounds.dodge) {
                this.sounds.dodge.play(0.4);
            }
            
            // Play sparkle sound
            if (this.sounds.sparkle) {
                this.sounds.sparkle.play(0.2);
            }
            
            // Make spoon dodge dramatically
            this.spoon.userData.isEvading = true;
            const dodgeDirection = new THREE.Vector3()
                .subVectors(this.spoon.position, this.monster.position)
                .normalize()
                .multiplyScalar(3);
            
            this.spoon.userData.targetPosition.copy(this.spoon.position).add(dodgeDirection);
            
            // Enhanced sparkle effect
            this.createSparkleEffect(this.spoon.position);
            this.createMagicalParticles(this.spoon.position, 25, 0x00FFFF);
            
            // Visual feedback effects
            this.createSuccessFlash();
            this.createFloatingScore(points);
            
            if (this.gameState.combo > 1) {
                this.createComboEffect();
                if (this.sounds.combo) {
                    this.sounds.combo.play(0.5);
                }
            }
            
            // Screen shake for impact
            this.createScreenShake(0.08, 0.2);
            
            // Spawn power-up occasionally
            if (Math.random() < 0.3) {
                this.createPowerUp();
            }
            
            this.updateUI();
        } else {
            // Too far away, reset combo
            this.gameState.combo = 0;
            this.gameState.excitement = Math.max(0, this.gameState.excitement - 5);
            this.updateUI();
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
        document.getElementById('excitement').textContent = Math.round(this.gameState.excitement);
        
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
        const time = this.clock.getElapsedTime(); // Get time at the beginning

        // Update light circles to follow characters
        if (this.spoon && this.spoonLightCircle) {
            this.spoonLightCircle.position.copy(this.spoon.position);
            this.spoonLightCircle.position.y = -0.1;
            // Animate light circle
            this.spoonLightCircle.rotation.z += 0.02;
            this.spoonLightCircle.material.opacity = 0.3 + Math.sin(time * 3) * 0.1;
        }

        if (this.monster && this.monsterLightCircle) {
            this.monsterLightCircle.position.copy(this.monster.position);
            this.monsterLightCircle.position.y = -0.1;
            // Monster circle pulses more aggressively during chase
            this.monsterLightCircle.rotation.z -= 0.03;
            const chaseIntensity = this.gameState.isChasing ? 0.2 : 0.1;
            this.monsterLightCircle.material.opacity = 0.4 + Math.sin(time * 5) * chaseIntensity;
            
            // Change color based on distance to spoon
            if (this.spoon) {
                const distance = this.monster.position.distanceTo(this.spoon.position);
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
            
            // Check for collection by spoon
            if (this.spoon && !powerUp.userData.collected) {
                const distance = powerUp.position.distanceTo(this.spoon.position);
                if (distance < 1) {
                    powerUp.userData.collected = true;
                    this.collectPowerUp(powerUp);
                    this.scene.remove(powerUp);
                    this.powerUps.splice(index, 1);
                }
            }
        });

        if (this.bunny && this.bunny.userData) { // Check bunny and its userData exists
            // Bunny random movement logic
            if (Math.random() < 0.015) { // Adjust probability for target change frequency
                this.bunny.userData.targetPosition.set(
                    (Math.random() - 0.5) * 16,  // x range (-8 to +8)
                    this.bunny.userData.originalPosition.y, // Base Y for bobbing
                    (Math.random() - 0.5) * 16   // z range (-8 to +8)
                );
            }

            // Smoothly move bunny towards its target position for X and Z
            this.bunny.position.x = THREE.MathUtils.lerp(this.bunny.position.x, this.bunny.userData.targetPosition.x, 0.02);
            this.bunny.position.z = THREE.MathUtils.lerp(this.bunny.position.z, this.bunny.userData.targetPosition.z, 0.02);

            // Bobbing animation for Y position
            // Ensure originalPosition.y is sensible (e.g., 0 if ground is -2 and bunny is 1.5 tall centered)
            this.bunny.position.y = this.bunny.userData.originalPosition.y + (Math.sin(time * 2.5) * 0.15); // Adjust speed and amplitude

            // Keep bunny in bounds (can be different from spoon/monster if desired)
            this.bunny.position.x = Math.max(-10, Math.min(10, this.bunny.position.x));
            this.bunny.position.z = Math.max(-10, Math.min(10, this.bunny.position.z));
        }

        // Existing game logic for spoon and monster
        if (!this.gameState.isChasing || !this.spoon || !this.monster) {
            // If not chasing, or main characters not loaded, maybe hide or disable UI elements?
            // For now, just return as original code did.
            return;
        }
        
        // Update monster AI with more intelligence
        if (this.monster.userData.isChasing) {
            const direction = new THREE.Vector3()
                .subVectors(this.spoon.position, this.monster.position)
                .normalize();
            
            // Monster gets faster as excitement builds
            const speedMultiplier = 1 + (this.gameState.excitement / 200);
            this.monster.userData.targetPosition.copy(this.monster.position)
                .add(direction.multiplyScalar(this.gameState.monsterSpeed * speedMultiplier));
            
            // Add some randomness to make it more interesting
            this.monster.userData.targetPosition.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0,
                (Math.random() - 0.5) * 0.1
            ));
            
            // Monster makes sounds when getting close
            const distance = this.monster.position.distanceTo(this.spoon.position);
            if (distance < 2 && Math.random() < 0.05) {
                if (this.sounds.monster) {
                    this.sounds.monster.play(0.3);
                }
            }
        }
        
        // Update spoon behavior with power-up effects
        if (!this.spoon.userData.isEvading) {
            // Random movement when not evading
            if (Math.random() < 0.02) {
                this.spoon.userData.targetPosition.set(
                    (Math.random() - 0.5) * 8,
                    0,
                    (Math.random() - 0.5) * 8
                );
            }
        }
        
        // Smooth movement for both characters
        const spoonSpeed = this.gameState.powerUpActive ? 0.08 : 0.05;
        this.spoon.position.lerp(this.spoon.userData.targetPosition, spoonSpeed);
        this.monster.position.lerp(this.monster.userData.targetPosition, 0.03);
        
        // Reset evasion state
        if (this.spoon.userData.isEvading && 
            this.spoon.position.distanceTo(this.spoon.userData.targetPosition) < 0.1) {
            this.spoon.userData.isEvading = false;
        }
        
        // Keep characters in bounds
        this.spoon.position.x = Math.max(-10, Math.min(10, this.spoon.position.x));
        this.spoon.position.z = Math.max(-10, Math.min(10, this.spoon.position.z));
        this.monster.position.x = Math.max(-10, Math.min(10, this.monster.position.x));
        this.monster.position.z = Math.max(-10, Math.min(10, this.monster.position.z));
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
        if (this.ambientLight && this.spoonHighlight && this.monsterHighlight && this.bunnyHighlight) {
            const excitementFactor = this.gameState.excitement / 100;
            
            // Animate ambient light subtly
            this.ambientLight.intensity = 0.6 + Math.sin(time * 0.5) * 0.1;
            
            // Update character highlight positions and intensities
            if (this.spoon) {
                this.spoonHighlight.position.copy(this.spoon.position);
                this.spoonHighlight.position.y += 2;
                this.spoonHighlight.intensity = 1.5 + Math.sin(time * 2) * (0.3 + excitementFactor * 0.5);
            }
            
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
        if (this.gameState.isChasing && this.spoon && this.monster) {
            const distance = this.spoon.position.distanceTo(this.monster.position);
            if (distance < 4) {
                // Camera follows the action more closely
                const midPoint = new THREE.Vector3()
                    .addVectors(this.spoon.position, this.monster.position)
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

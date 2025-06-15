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
        this.particles = null;
        this.gameState = {
            score: 0,
            isChasing: false,
            spoonSpeed: 0.02,
            monsterSpeed: 0.015,
            lastDodge: 0,
            combo: 0
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
        this.createParticleSystem();
        this.setupEventListeners();
        this.startGameLoop();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
        
        // Create stunning gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
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
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(bloomPass);
        
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    createLighting() {
        // Ultra-dynamic ambient light with rainbow cycling
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        // EPIC main spotlight with ultra-high quality shadows
        this.mainLight = new THREE.SpotLight(0xff6b6b, 8.0, 30, Math.PI * 0.3, 0.2, 2);
        this.mainLight.position.set(0, 15, 0);
        this.mainLight.target.position.set(0, 0, 0);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 4096;
        this.mainLight.shadow.mapSize.height = 4096;
        this.mainLight.shadow.camera.near = 0.1;
        this.mainLight.shadow.camera.far = 50;
        this.mainLight.shadow.bias = -0.0001;
        this.scene.add(this.mainLight);
        this.scene.add(this.mainLight.target);

        // Cinematic rim lighting system
        this.rimLights = [];
        const rimColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8a80, 0x26c6da];
        for (let i = 0; i < 6; i++) {
            const rimLight = new THREE.DirectionalLight(rimColors[i], 2.5);
            const angle = (i / 6) * Math.PI * 2;
            rimLight.position.set(
                Math.cos(angle) * 12,
                8 + Math.sin(i) * 3,
                Math.sin(angle) * 12
            );
            rimLight.target.position.set(0, 0, 0);
            this.rimLights.push(rimLight);
            this.scene.add(rimLight);
            this.scene.add(rimLight.target);
        }

        // Magical floating light orbs
        this.lightOrbs = [];
        for (let i = 0; i < 8; i++) {
            const orb = new THREE.PointLight(
                new THREE.Color().setHSL(i / 8, 1.0, 0.7),
                4.0,
                15,
                2
            );
            orb.position.set(
                (Math.random() - 0.5) * 20,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 20
            );
            
            // Add glowing sphere visual
            const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const orbMaterial = new THREE.MeshBasicMaterial({
                color: orb.color,
                transparent: true,
                opacity: 0.8
            });
            const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
            orb.add(orbMesh);
            
            this.lightOrbs.push({
                light: orb,
                originalPosition: orb.position.clone(),
                phase: Math.random() * Math.PI * 2
            });
            this.scene.add(orb);
        }

        // Epic volumetric fog lights
        this.fogLights = [];
        for (let i = 0; i < 4; i++) {
            const fogLight = new THREE.SpotLight(
                new THREE.Color().setHSL(i / 4, 0.8, 0.6),
                6.0,
                25,
                Math.PI * 0.4,
                0.3,
                1.5
            );
            fogLight.position.set(
                (i % 2 === 0 ? -1 : 1) * 15,
                12,
                (i < 2 ? -1 : 1) * 15
            );
            fogLight.target.position.set(0, 0, 0);
            this.fogLights.push(fogLight);
            this.scene.add(fogLight);
            this.scene.add(fogLight.target);
        }
    }

    createEnvironment() {
        // Create reflective ground plane
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.1,
            envMapIntensity: 1.0
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Add floating geometric shapes for visual interest
        this.createFloatingShapes();
    }

    createFloatingShapes() {
        const shapes = [];
        const geometries = [
            new THREE.OctahedronGeometry(0.3),
            new THREE.TetrahedronGeometry(0.4),
            new THREE.IcosahedronGeometry(0.25)
        ];

        for (let i = 0; i < 15; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7
            });

            const shape = new THREE.Mesh(geometry, material);
            shape.position.set(
                (Math.random() - 0.5) * 25,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 25
            );
            shape.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            shape.castShadow = true;
            
            shapes.push({
                mesh: shape,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                floatSpeed: (Math.random() - 0.5) * 0.01
            });
            
            this.scene.add(shape);
        }
        
        this.floatingShapes = shapes;
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
                <div class="controls">
                    <button id="start-chase">Start Chase!</button>
                    <button id="help-spoon">Help Spoon!</button>
                </div>
                <div class="instructions">
                    Click "Help Spoon!" when monster gets close!
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
    }

    createParticleSystem() {
        // ULTRA-MAGICAL PARTICLE SYSTEMS
        
        // Main swirling particle galaxy
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const phases = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Create spiral galaxy formation
            const radius = Math.random() * 15 + 5;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 12;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            const color = new THREE.Color().setHSL((i / particleCount + Math.random() * 0.1) % 1, 0.9, 0.8);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 0.3 + 0.1;
            phases[i] = Math.random() * Math.PI * 2;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
        
        // Energy streams connecting light orbs
        this.createEnergyStreams();
        
        // Floating magical dust
        this.createMagicalDust();
    }
    
    createEnergyStreams() {
        this.energyStreams = [];
        
        for (let i = 0; i < 12; i++) {
            const streamGeometry = new THREE.BufferGeometry();
            const streamPositions = new Float32Array(100 * 3);
            const streamColors = new Float32Array(100 * 3);
            
            for (let j = 0; j < 100; j++) {
                const t = j / 99;
                const radius = 8 + Math.sin(t * Math.PI * 4) * 2;
                const angle = t * Math.PI * 8 + i * Math.PI / 6;
                const height = Math.sin(t * Math.PI * 2) * 4;
                
                streamPositions[j * 3] = Math.cos(angle) * radius;
                streamPositions[j * 3 + 1] = height;
                streamPositions[j * 3 + 2] = Math.sin(angle) * radius;
                
                const color = new THREE.Color().setHSL((i / 12 + t * 0.5) % 1, 1.0, 0.6);
                streamColors[j * 3] = color.r;
                streamColors[j * 3 + 1] = color.g;
                streamColors[j * 3 + 2] = color.b;
            }
            
            streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
            streamGeometry.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));
            
            const streamMaterial = new THREE.PointsMaterial({
                size: 0.15,
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const stream = new THREE.Points(streamGeometry, streamMaterial);
            this.energyStreams.push({
                mesh: stream,
                phase: i * Math.PI / 6
            });
            this.scene.add(stream);
        }
    }
    
    createMagicalDust() {
        const dustCount = 300;
        const dustPositions = new Float32Array(dustCount * 3);
        const dustColors = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 40;
            dustPositions[i * 3 + 1] = Math.random() * 15;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            
            const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.9);
            dustColors[i * 3] = color.r;
            dustColors[i * 3 + 1] = color.g;
            dustColors[i * 3 + 2] = color.b;
        }
        
        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
        
        const dustMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.magicalDust = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(this.magicalDust);
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
        this.updateUI();
        
        if (this.monster) {
            this.monster.userData.isChasing = true;
        }
        
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
            
            // Make spoon dodge dramatically
            this.spoon.userData.isEvading = true;
            const dodgeDirection = new THREE.Vector3()
                .subVectors(this.spoon.position, this.monster.position)
                .normalize()
                .multiplyScalar(3);
            
            this.spoon.userData.targetPosition.copy(this.spoon.position).add(dodgeDirection);
            
            // Create sparkle effect
            this.createSparkleEffect(this.spoon.position);
            
            // Visual feedback effects
            this.createSuccessFlash();
            this.createFloatingScore(points);
            if (this.gameState.combo > 1) {
                this.createComboEffect();
            }
            
            this.updateUI();
        } else {
            // Too far away, reset combo
            this.gameState.combo = 0;
            this.updateUI();
        }
    }

    createSparkleEffect(position) {
        const sparkleCount = 20;
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
                sparkle.userData.life -= 0.02;
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
    }

    startGameLoop() {
        setInterval(() => {
            this.updateGameLogic();
        }, 16); // ~60 FPS
    }

    updateGameLogic() {
        if (!this.gameState.isChasing || !this.spoon || !this.monster) return;
        
        const time = this.clock.getElapsedTime();
        
        // Update monster AI
        if (this.monster.userData.isChasing) {
            const direction = new THREE.Vector3()
                .subVectors(this.spoon.position, this.monster.position)
                .normalize();
            
            this.monster.userData.targetPosition.copy(this.monster.position)
                .add(direction.multiplyScalar(this.gameState.monsterSpeed));
            
            // Add some randomness to make it more interesting
            this.monster.userData.targetPosition.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0,
                (Math.random() - 0.5) * 0.1
            ));
        }
        
        // Update spoon behavior
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
        this.spoon.position.lerp(this.spoon.userData.targetPosition, 0.05);
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

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Animate floating shapes
        if (this.floatingShapes) {
            this.floatingShapes.forEach(shape => {
                shape.mesh.rotation.x += shape.rotationSpeed;
                shape.mesh.rotation.y += shape.rotationSpeed * 0.7;
                shape.mesh.position.y += Math.sin(time + shape.mesh.position.x) * shape.floatSpeed;
            });
        }
        
        // ULTRA-AMAZING PARTICLE ANIMATIONS
        
        // Main particle galaxy spiral
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const colors = this.particles.geometry.attributes.color.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const index = i / 3;
                const radius = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
                const angle = Math.atan2(positions[i + 2], positions[i]) + time * 0.3;
                
                // Spiral motion
                positions[i] = Math.cos(angle) * radius;
                positions[i + 2] = Math.sin(angle) * radius;
                positions[i + 1] += Math.sin(time * 2 + index * 0.1) * 0.02;
                
                // Color shifting
                const hue = (time * 0.1 + index * 0.01) % 1;
                const color = new THREE.Color().setHSL(hue, 0.9, 0.8);
                colors[i] = color.r;
                colors[i + 1] = color.g;
                colors[i + 2] = color.b;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.color.needsUpdate = true;
        }
        
        // Energy streams animation
        if (this.energyStreams) {
            this.energyStreams.forEach((streamData, streamIndex) => {
                const stream = streamData.mesh;
                const positions = stream.geometry.attributes.position.array;
                const colors = stream.geometry.attributes.color.array;
                const phase = streamData.phase + time * 2;
                
                for (let i = 0; i < positions.length; i += 3) {
                    const t = (i / 3) / 99;
                    const radius = 8 + Math.sin(t * Math.PI * 4 + phase) * 2;
                    const angle = t * Math.PI * 8 + streamIndex * Math.PI / 6 + time * 0.5;
                    const height = Math.sin(t * Math.PI * 2 + phase) * 4;
                    
                    positions[i] = Math.cos(angle) * radius;
                    positions[i + 1] = height;
                    positions[i + 2] = Math.sin(angle) * radius;
                    
                    // Dynamic color flow
                    const hue = (streamIndex / 12 + t * 0.5 + time * 0.1) % 1;
                    const color = new THREE.Color().setHSL(hue, 1.0, 0.6 + Math.sin(phase + t * Math.PI * 4) * 0.3);
                    colors[i] = color.r;
                    colors[i + 1] = color.g;
                    colors[i + 2] = color.b;
                }
                
                stream.geometry.attributes.position.needsUpdate = true;
                stream.geometry.attributes.color.needsUpdate = true;
            });
        }
        
        // Magical dust animation
        if (this.magicalDust) {
            const positions = this.magicalDust.geometry.attributes.position.array;
            const colors = this.magicalDust.geometry.attributes.color.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const index = i / 3;
                
                // Gentle floating motion
                positions[i] += Math.sin(time + index * 0.1) * 0.005;
                positions[i + 1] += Math.cos(time * 1.3 + index * 0.15) * 0.008;
                positions[i + 2] += Math.sin(time * 0.7 + index * 0.2) * 0.005;
                
                // Wrap around boundaries
                if (positions[i] > 20) positions[i] = -20;
                if (positions[i] < -20) positions[i] = 20;
                if (positions[i + 2] > 20) positions[i + 2] = -20;
                if (positions[i + 2] < -20) positions[i + 2] = 20;
                
                // Shimmering colors
                const hue = (time * 0.05 + index * 0.01) % 1;
                const color = new THREE.Color().setHSL(hue, 0.6, 0.9);
                colors[i] = color.r;
                colors[i + 1] = color.g;
                colors[i + 2] = color.b;
            }
            
            this.magicalDust.geometry.attributes.position.needsUpdate = true;
            this.magicalDust.geometry.attributes.color.needsUpdate = true;
        }
        
        // EPIC DYNAMIC LIGHTING SYSTEM
        
        // Main spotlight with dramatic intensity pulsing
        this.mainLight.intensity = 8 + Math.sin(time * 3) * 2;
        this.mainLight.color.setHSL((time * 0.15) % 1, 0.8, 0.7);
        
        // Cinematic rim lighting dance
        this.rimLights.forEach((light, i) => {
            const phase = time * 2 + (i * Math.PI / 3);
            light.intensity = 2.5 + Math.sin(phase) * 1.5;
            light.color.setHSL((time * 0.1 + i * 0.16) % 1, 0.9, 0.6);
            
            // Rotate rim lights around the scene
            const angle = (time * 0.5 + i * Math.PI / 3) % (Math.PI * 2);
            light.position.set(
                Math.cos(angle) * 12,
                8 + Math.sin(time + i) * 3,
                Math.sin(angle) * 12
            );
        });
        
        // Magical floating light orbs animation
        this.lightOrbs.forEach((orbData, i) => {
            const orb = orbData.light;
            const phase = orbData.phase + time * 0.8;
            
            // Floating motion
            orb.position.copy(orbData.originalPosition);
            orb.position.x += Math.sin(phase) * 3;
            orb.position.y += Math.cos(phase * 1.3) * 2;
            orb.position.z += Math.sin(phase * 0.7) * 3;
            
            // Pulsing intensity
            orb.intensity = 4 + Math.sin(phase * 2) * 2;
            
            // Color shifting
            orb.color.setHSL((time * 0.2 + i * 0.125) % 1, 1.0, 0.7);
            orb.children[0].material.color.copy(orb.color);
        });
        
        // Epic volumetric fog lights
        this.fogLights.forEach((light, i) => {
            const phase = time * 1.5 + i * Math.PI * 0.5;
            light.intensity = 6 + Math.sin(phase) * 3;
            light.color.setHSL((time * 0.08 + i * 0.25) % 1, 0.8, 0.6);
            
            // Subtle movement for atmospheric effect
            light.position.y = 12 + Math.sin(phase * 0.5) * 2;
        });
        
        // Rainbow ambient light cycling
        this.ambientLight.color.setHSL((time * 0.05) % 1, 0.3, 0.8);
        
        // Update controls and render
        this.controls.update();
        this.composer.render();
    }
}

// Initialize the amazing app
window.addEventListener('load', () => {
    new AmazingApp();
});

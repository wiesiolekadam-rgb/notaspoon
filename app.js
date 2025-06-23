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
        this.particles = null;
        // this.rimLights = []; // Removed
        // this.lightOrbs = []; // Removed
        // this.fogLights = []; // Removed
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
        this.renderer.toneMappingExposure = 1.0;
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
        // Ultra-dynamic ambient light with rainbow cycling
        this.ambientLight = new THREE.AmbientLight(0x88aaff, 0.5);
        this.scene.add(this.ambientLight);

        // EPIC main spotlight with ultra-high quality shadows
        this.mainLight = new THREE.SpotLight(0xffeedd, 3.0, 30, Math.PI * 0.3, 0.2, 2);
        this.mainLight.position.set(0, 15, 0);
        this.mainLight.target.position.set(0, 0, 0);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.1;
        this.mainLight.shadow.camera.far = 50;
        this.mainLight.shadow.bias = -0.0001;
        this.scene.add(this.mainLight);
        this.scene.add(this.mainLight.target);
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

    createParticleSystem() {
        // ULTRA-MAGICAL PARTICLE SYSTEMS
        
        // Main swirling particle galaxy
        const particleCount = 200;
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
            
            sizes[i] = Math.random() * 0.2 + 0.05;
            phases[i] = Math.random() * Math.PI * 2;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.NormalBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
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
    }

    startGameLoop() {
        setInterval(() => {
            this.updateGameLogic();
        }, 16); // ~60 FPS
    }

    updateGameLogic() {
        const time = this.clock.getElapsedTime(); // Get time at the beginning

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
        
        // DYNAMIC LIGHTING SYSTEM
        
        // Update controls and render
        this.controls.update();
        this.composer.render();
    }
}

// Initialize the amazing app
window.addEventListener('load', () => {
    new AmazingApp();
});

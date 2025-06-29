// INTERACTIVE PROTOTYPE - Transform notaspoon into an engaging game
// This shows how to add direct player control to make it actually fun!

class InteractiveGamePrototype {
    constructor() {
        // Keep existing visual setup...
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.monster = null;
        this.bunny = null;
        
        // NEW: Player interaction system
        this.keys = {
            w: false, a: false, s: false, d: false,
            space: false, shift: false
        };
        
        // NEW: Game mechanics
        this.gameState = {
            isPlaying: false,
            gameOver: false,
            score: 0,
            survivalTime: 0,
            bunnySpeed: 5,
            monsterSpeed: 3,
            stamina: 100,
            maxStamina: 100,
            lives: 3
        };
        
        // NEW: Game timing
        this.clock = new THREE.Clock();
        this.lastUpdate = 0;
        
        this.init();
    }
    
    async init() {
        // Use existing setup methods...
        this.createScene();
        this.createCamera();
        this.createRenderer();
        await this.loadModels();
        
        // NEW: Setup interactive systems
        this.setupInputHandling();
        this.createGameUI();
        this.startGameLoop();
    }
    
    // NEW: Input handling system
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
                    if (this.gameState.gameOver) this.restartGame();
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
            }
        });
        
        // Mouse controls for dash ability
        document.addEventListener('click', (event) => {
            if (this.gameState.isPlaying && !this.gameState.gameOver) {
                this.performMouseDash(event);
            }
        });
    }
    
    // NEW: Interactive game UI
    createGameUI() {
        const ui = document.createElement('div');
        ui.id = 'interactive-game-ui';
        ui.innerHTML = `
            <style>
                #interactive-game-ui {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    font-family: Arial, sans-serif;
                    z-index: 1000;
                }
                .game-hud {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    pointer-events: auto;
                }
                .stamina-bar {
                    width: 200px;
                    height: 20px;
                    background: rgba(0,0,0,0.5);
                    border: 2px solid white;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                .stamina-fill {
                    height: 100%;
                    background: linear-gradient(to right, #ff4444, #ffff44, #44ff44);
                    transition: width 0.1s ease;
                }
                .controls-help {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    background: rgba(0,0,0,0.3);
                    padding: 15px;
                    border-radius: 10px;
                    pointer-events: auto;
                }
                .game-over-screen {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    pointer-events: auto;
                    display: none;
                }
                .start-button {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 18px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                    pointer-events: auto;
                }
                .start-button:hover {
                    background: #45a049;
                }
            </style>
            
            <div class="game-hud">
                <div>Score: <span id="score">0</span></div>
                <div>Time: <span id="survival-time">0.0</span>s</div>
                <div>Lives: <span id="lives">❤️❤️❤️</span></div>
                <div class="stamina-bar">
                    <div class="stamina-fill" id="stamina-fill"></div>
                </div>
                <div>Stamina</div>
            </div>
            
            <div class="controls-help">
                <strong>🎮 CONTROLS:</strong><br>
                WASD/Arrows: Move bunny<br>
                SPACE: Bunny hop (uses stamina)<br>
                SHIFT: Sprint (drains stamina)<br>
                CLICK: Dash toward mouse<br>
                R: Restart when game over
            </div>
            
            <div class="game-over-screen" id="game-over-screen">
                <h2>🎮 MONSTER CHASE GAME</h2>
                <div id="game-over-message">
                    <h3>Ready to Play?</h3>
                    <p>Control the bunny to escape the monster!</p>
                </div>
                <button class="start-button" onclick="gameInstance.startGame()">🏃 START GAME</button>
                <p><em>Survive as long as possible!</em></p>
            </div>
        `;
        document.body.appendChild(ui);
        
        // Show initial screen
        document.getElementById('game-over-screen').style.display = 'block';
    }
    
    // NEW: Player-controlled bunny movement
    updatePlayerMovement(deltaTime) {
        if (!this.bunny || this.gameState.gameOver) return;
        
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
            
            // Quick forward boost
            const forward = new THREE.Vector3(0, 0, -2);
            if (this.keys.w || this.keys.s || this.keys.a || this.keys.d) {
                // Hop in movement direction
                if (this.keys.w) forward.set(0, 0, -2);
                if (this.keys.s) forward.set(0, 0, 2);
                if (this.keys.a) forward.set(-2, 0, 0);
                if (this.keys.d) forward.set(2, 0, 0);
            }
            
            this.bunny.position.add(forward);
            
            // Visual feedback - bunny hop animation would go here
            this.createHopEffect();
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
            const dashDirection = targetPoint.sub(this.bunny.position).normalize();
            const dashDistance = Math.min(4, dashDirection.length());
            
            this.bunny.position.add(dashDirection.multiplyScalar(dashDistance));
            
            this.createDashEffect(this.bunny.position);
        }
    }
    
    // NEW: Smart monster AI that actually chases player
    updateMonsterAI(deltaTime) {
        if (!this.monster || !this.bunny || this.gameState.gameOver) return;
        
        // Calculate direction to bunny
        const direction = new THREE.Vector3()
            .subVectors(this.bunny.position, this.monster.position)
            .normalize();
        
        // Monster gets faster over time (progressive difficulty)
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
    }
    
    // NEW: Collision detection and game over
    checkCollisions() {
        if (!this.monster || !this.bunny || this.gameState.gameOver) return;
        
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
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions for next life
            this.bunny.position.set(0, 0, 0);
            this.monster.position.set(8, 0, 8);
            this.createHitEffect();
        }
    }
    
    // NEW: Game state management
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.gameOver = false;
        this.gameState.score = 0;
        this.gameState.survivalTime = 0;
        this.gameState.lives = 3;
        this.gameState.stamina = this.gameState.maxStamina;
        
        // Reset positions
        if (this.bunny) this.bunny.position.set(0, 0, 0);
        if (this.monster) this.monster.position.set(8, 0, 8);
        
        // Hide game over screen
        document.getElementById('game-over-screen').style.display = 'none';
        
        this.clock.start();
    }
    
    gameOver() {
        this.gameState.gameOver = true;
        this.gameState.isPlaying = false;
        
        // Show game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        const message = document.getElementById('game-over-message');
        
        message.innerHTML = `
            <h3>🏆 Game Over!</h3>
            <p><strong>Final Score:</strong> ${this.gameState.score}</p>
            <p><strong>Survival Time:</strong> ${this.gameState.survivalTime.toFixed(1)}s</p>
            <p>The monster caught you!</p>
        `;
        
        gameOverScreen.style.display = 'block';
    }
    
    restartGame() {
        this.startGame();
    }
    
    // NEW: Main game loop with player interaction
    update() {
        if (!this.gameState.isPlaying || this.gameState.gameOver) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update survival time and score
        this.gameState.survivalTime += deltaTime;
        this.gameState.score = Math.floor(this.gameState.survivalTime * 10);
        
        // Update game systems
        this.updatePlayerMovement(deltaTime);
        this.updateMonsterAI(deltaTime);
        this.checkCollisions();
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('survival-time').textContent = this.gameState.survivalTime.toFixed(1);
        document.getElementById('lives').textContent = '❤️'.repeat(this.gameState.lives);
        
        // Update stamina bar
        const staminaPercent = (this.gameState.stamina / this.gameState.maxStamina) * 100;
        document.getElementById('stamina-fill').style.width = staminaPercent + '%';
    }
    
    // Visual effects (simplified for prototype)
    createHopEffect() {
        console.log('🦘 Bunny hop!');
        // Add particle effect here
    }
    
    createDashEffect(position) {
        console.log('💨 Dash effect at', position);
        // Add dash particle trail here
    }
    
    createHitEffect() {
        console.log('💥 Bunny hit! Lives remaining:', this.gameState.lives);
        // Add screen shake and particles here
    }
    
    createDangerWarning() {
        // Visual warning when monster is close
        // Could add red screen tint, warning sound, etc.
    }
    
    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        
        // Render the scene (using existing render setup)
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global instance for button callbacks
let gameInstance;

// Initialize when page loads
window.addEventListener('load', () => {
    gameInstance = new InteractiveGamePrototype();
    gameInstance.animate();
});
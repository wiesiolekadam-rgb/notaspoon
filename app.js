import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { spoonModelData } from './spoon-model.js';

async function init() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('viewer-container').appendChild(renderer.domElement);

    // Enhanced lighting setup
    // Ambient light for overall scene brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Main directional light (front)
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    scene.add(mainLight);

    // Fill light (back)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Rim light (side)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Additional top light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI;

    // Create spoon geometry
    const spoonGeometry = new THREE.BufferGeometry();
    spoonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spoonModelData.positions, 3));
    spoonGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(spoonModelData.normals, 3));
    spoonGeometry.setIndex(spoonModelData.indices);

    // Create spoon material
    const spoonMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.0
    });

    // Create spoon mesh
    const spoon = new THREE.Mesh(spoonGeometry, spoonMaterial);
    spoon.castShadow = true;
    spoon.receiveShadow = true;
    spoon.position.set(-3, 0, 0); // Position spoon to the left
    scene.add(spoon);

    // Load the monster model
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync('3D_Purple_Monster.glb');
        const model = gltf.scene;

        // Enable shadows and enhance material properties
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    node.material.envMapIntensity = 1.0;
                    node.material.needsUpdate = true;
                }
            }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Scale the model
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);

        // Position monster to the right
        model.position.set(3, 0, 0);
        scene.add(model);
    } catch (error) {
        console.error('Error loading model:', error);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// Initialize when the page loads
window.addEventListener('load', init);

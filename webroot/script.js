// import * as THREE from 'three';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lights
const light = new THREE.PointLight(0xffffff, 1.5, 100);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Position camera
camera.position.z = 15;

// Load .obj asteroid model
const loader = new THREE.OBJLoader();
let asteroid;

loader.load(
    'Asteroid_Exploration_0311071243_texture.obj',
    (object) => {
        asteroid = object;
        asteroid.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.8,
                    metalness: 0.2
                });
            }
        });
        asteroid.scale.set(7, 7, 7);
        asteroid.position.set(0, 0, 0);
        scene.add(asteroid);
    },
    (xhr) => {  
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('Error loading model', error);
    }
);

// Add stars background
const starsGeometry = new THREE.BufferGeometry();
const starsVertices = [];
for (let i = 0; i < 1000; i++) {
    starsVertices.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
    );
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7, transparent: true });
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Rotation variables
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let rotationSpeedX = 0, rotationSpeedY = 0;
let inertia = 0.98;

// Mouse events for rotation
document.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (event) => {
    if (isDragging && asteroid) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        rotationSpeedY = deltaX * 0.005;
        rotationSpeedX = deltaY * 0.005;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (asteroid) {
        if (!isDragging) {
            // Apply inertia for smooth slowing down
            rotationSpeedX *= inertia;
            rotationSpeedY *= inertia;
        }
        asteroid.rotation.x += rotationSpeedX;
        asteroid.rotation.y += rotationSpeedY;

        // // Automatic slow rotation when idle
        // if (!isDragging && Math.abs(rotationSpeedX) < 0.001 && Math.abs(rotationSpeedY) < 0.001) {
        //     asteroid.rotation.y += 0.002; // Constant slow rotation
        // }
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

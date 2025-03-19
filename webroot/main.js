import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

// DOM elements
const loadingContainer = document.getElementById('loadingContainer');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 2, 5);

// Initialize clock
const clock = new THREE.Clock();
let deltaTime = 0;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Post-processing
let composer;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI; // Allow full rotation

// Auto-rotation settings
let autoRotate = true;
let autoRotateSpeed = 0.3;
let modelGroup = new THREE.Group(); // Container for the model to control rotation
scene.add(modelGroup);

// Tool selection
let currentTool = 'shovel'; // Default tool
const TOOL_SETTINGS = {
    'shovel': {
        sparkDuration: 3.0,
        explosionDuration: 3.0,
        explosionSize: 0.6,
        cursor: 'crosshair'
    },
    'dynamite': {
        sparkDuration: 8.0,
        explosionDuration: 4.0,
        explosionSize: 0.8,
        cursor: 'crosshair'
    }
};

// Add toggle button for auto-rotation
const autoRotateButton = document.createElement('button');
autoRotateButton.id = 'autoRotateButton';
autoRotateButton.className = 'ui-button';
autoRotateButton.textContent = 'Toggle Auto-Rotate';
autoRotateButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    autoRotateButton.textContent = autoRotate ? 'Stop Rotation' : 'Start Rotation';
});
document.body.appendChild(autoRotateButton);

// Add tool selector
const toolSelector = document.createElement('div');
toolSelector.id = 'toolSelector';
toolSelector.style.position = 'fixed';
toolSelector.style.top = '20px';
toolSelector.style.right = '160px';
toolSelector.style.zIndex = '100';
toolSelector.style.display = 'flex';
toolSelector.style.gap = '10px';
document.body.appendChild(toolSelector);

// Create tool buttons with icons
function createToolButton(tool, icon, label) {
    const button = document.createElement('button');
    button.className = 'tool-button';
    button.dataset.tool = tool;
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '8px';
    button.style.background = tool === currentTool ? '#4466ff' : '#333';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.flexDirection = 'column';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.fontSize = '10px';
    button.style.padding = '5px';
    button.style.transition = 'all 0.2s ease';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    // Icon
    const iconElement = document.createElement('div');
    iconElement.innerHTML = icon;
    iconElement.style.marginBottom = '5px';
    iconElement.style.width = '24px';
    iconElement.style.height = '24px';
    
    // Label
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    
    button.appendChild(iconElement);
    button.appendChild(labelElement);
    
    // Event handler
    button.addEventListener('click', () => {
        // Update current tool
        currentTool = tool;
        
        // Update all button styles
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.style.background = btn.dataset.tool === currentTool ? '#4466ff' : '#333';
        });
    });
    
    return button;
}

// Shovel icon (SVG)
const shovelIcon = `<div style="font-size: 24px; line-height: 1;">⛏</div>`;

// Dynamite icon (SVG)
const dynamiteIcon = `<div style="font-size: 24px; line-height: 1;">💣</div>`;

// Add tool buttons to selector
toolSelector.appendChild(createToolButton('shovel', shovelIcon, 'Shovel'));
toolSelector.appendChild(createToolButton('dynamite', dynamiteIcon, 'Dynamite'));

// Add quality settings control
const qualitySelector = document.createElement('select');
qualitySelector.id = 'qualitySelector';
qualitySelector.className = 'ui-dropdown';
qualitySelector.style.position = 'fixed';
qualitySelector.style.top = '20px';
qualitySelector.style.right = '20px';

const qualities = [
    { name: 'Low', bloom: false, ssao: false, shadows: false },
    { name: 'Medium', bloom: true, ssao: false, shadows: true },
    { name: 'High', bloom: true, ssao: true, shadows: true }
];

qualities.forEach((quality, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = quality.name + ' Quality';
    qualitySelector.appendChild(option);
});

qualitySelector.value = 2; // Default to high quality
qualitySelector.addEventListener('change', () => {
    const quality = qualities[qualitySelector.value];
    updateQuality(quality);
});
document.body.appendChild(qualitySelector);

// Function to update quality settings
function updateQuality(quality) {
    // Update shadows
    renderer.shadowMap.enabled = quality.shadows;
    
    // Rebuild the post-processing pipeline
    createPostProcessingEffects(quality);
}

// Lighting
function setupLighting() {
    // Add ambient light - increased intensity for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Add key light (sun-like) - increased brightness for better visibility
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    
    // Add a rim light to highlight asteroid edge - increased brightness
    const rimLight = new THREE.DirectionalLight(0xfff0e0, 0.8);
    rimLight.position.set(-5, 1, -5);
    scene.add(rimLight);
    
    // Add a stronger fill light from below
    const fillLight = new THREE.PointLight(0xffe0c0, 0.5);
    fillLight.position.set(0, -5, -5);
    scene.add(fillLight);
    
    // Add additional fill light from front for better visibility
    const frontFill = new THREE.PointLight(0xfffff0, 0.4);
    frontFill.position.set(0, 0, 8);
    scene.add(frontFill);
}

// Space HDR Environment
function loadEnvironmentMap() {
    return new Promise((resolve, reject) => {
        // Set a timeout to reject if it takes too long
        const timeout = setTimeout(() => {
            reject(new Error("Environment map loading timed out"));
        }, 5000);
        
        try {
            // Instead of loading the remote HDR, use the fallback environment
            console.log("Using fallback environment instead of remote HDR");
            clearTimeout(timeout);
            setupFallbackEnvironment();
            resolve();
        } catch (error) {
            clearTimeout(timeout);
            console.error("Error in environment setup:", error);
            setupFallbackEnvironment();
            reject(error);
        }
    });
}

// Fallback environment if HDR fails to load
function setupFallbackEnvironment() {
    // Dark space background
    scene.background = new THREE.Color(0x000005);
    
    // Create a simple starfield background
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05
    });
    
    const starPositions = [];
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Create a simple environment map programmatically
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    
    // Generate a simple space-like environment 
    const tempScene = new THREE.Scene();
    tempScene.background = new THREE.Color(0x000005);
    
    // Add some stars to the environment
    const envStarCount = 1000;
    const envStarGeometry = new THREE.BufferGeometry();
    const envStarPositions = [];
    
    for (let i = 0; i < envStarCount; i++) {
        const r = 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        envStarPositions.push(x, y, z);
    }
    
    envStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(envStarPositions, 3));
    const envStars = new THREE.Points(
        envStarGeometry,
        new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5
        })
    );
    
    tempScene.add(envStars);
    
    // Render the cube map
    cubeCamera.position.set(0, 0, 0);
    cubeCamera.update(renderer, tempScene);
    
    // Use the generated environment map
    scene.environment = cubeRenderTarget.texture;
}

// Create a realistic rock texture
function createRockTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; // Higher resolution texture
    canvas.height = 2048;
    const context = canvas.getContext('2d');
    
    // Fill with lighter base color for better visibility
    context.fillStyle = '#5a5a4e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a noisy background pattern
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = canvas.width;
    noiseCanvas.height = canvas.height;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    // Generate noise pattern
    const imgData = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
    const data = imgData.data;
    
    // Perlin-like noise - multi-layered for more realistic texture
    for (let y = 0; y < noiseCanvas.height; y++) {
        for (let x = 0; x < noiseCanvas.width; x++) {
            const idx = (y * noiseCanvas.width + x) * 4;
            
            // Sample at different frequencies for more natural look
            const highFreq = Math.random() * 0.15;
            const midFreq = Math.sin(x/20) * Math.cos(y/20) * 0.15;
            const lowFreq = Math.sin(x/200 + y/100) * 0.2;
            
            // Combine frequencies for natural detail
            let noiseVal = highFreq + midFreq + lowFreq;
            noiseVal = (noiseVal + 1) * 0.5; // Normalize to 0-1
            
            // Apply to create grayscale noise - brightened
            const colorVal = Math.floor(noiseVal * 90) + 60;
            data[idx] = colorVal;
            data[idx+1] = colorVal;
            data[idx+2] = colorVal;
            data[idx+3] = 255; // Alpha
        }
    }
    
    noiseCtx.putImageData(imgData, 0, 0);
    
    // Apply the noise to the main canvas with a blend mode
    context.globalCompositeOperation = 'overlay';
    context.drawImage(noiseCanvas, 0, 0);
    context.globalCompositeOperation = 'source-over';
    
    // Add different types of surface features
    
    // Medium-sized rocky outcrops and depressions (100-300)
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 60 + 40;
        
        // More variation in colors for different rock types
        const rockType = Math.random();
        let r, g, b;
        
        if (rockType < 0.4) {
            // Dark gray rocks - brightened
            r = Math.floor(70 + Math.random() * 30);
            g = Math.floor(r - 5 + Math.random() * 10);
            b = Math.floor(r - 10 + Math.random() * 8);
        } else if (rockType < 0.7) {
            // Brownish rocks - brightened
            r = Math.floor(90 + Math.random() * 30);
            g = Math.floor(r - 20 + Math.random() * 15);
            b = Math.floor(g - 30 + Math.random() * 10);
        } else {
            // Light gray rocks - brightened
            r = Math.floor(110 + Math.random() * 40);
            g = r - Math.floor(Math.random() * 10);
            b = g - Math.floor(Math.random() * 15);
        }
        
        // Create rock formations with uneven edges
        const points = [];
        const numPoints = 12 + Math.floor(Math.random() * 8);
        for (let j = 0; j < numPoints; j++) {
            const angle = (j / numPoints) * Math.PI * 2;
            const radiusVar = radius * (0.7 + Math.random() * 0.6);
            const px = x + Math.cos(angle) * radiusVar;
            const py = y + Math.sin(angle) * radiusVar;
            points.push({x: px, y: py});
        }
        
        // Draw the rock formation with irregular shape
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
            context.lineTo(points[j].x, points[j].y);
        }
        context.closePath();
        
        // Fill with rock color
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fill();
        
        // Add highlights and shadows for depth
        const highlight = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
        const shadow = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
        
        context.save();
        context.clip();
        
        // Random shadow direction for each rock
        const shadowAngle = Math.random() * Math.PI * 2;
        const shadowX = Math.cos(shadowAngle) * radius * 0.5;
        const shadowY = Math.sin(shadowAngle) * radius * 0.5;
        
        context.fillStyle = shadow;
        context.fillRect(x + shadowX - radius, y + shadowY - radius, radius * 2, radius * 2);
        
        // Highlight on opposite side
        context.fillStyle = highlight;
        context.fillRect(x - shadowX - radius * 0.5, y - shadowY - radius * 0.5, radius, radius);
        
        context.restore();
    }
    
    // Craters (60-120)
    for (let i = 0; i < 90; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50 + 20;
        
        // Randomize the color for crater
        const shade = Math.floor(60 + Math.random() * 30);
        
        // Create the crater pit
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgb(${shade}, ${shade-5}, ${shade-10})`;
        context.fill();
        
        // Inner shadow (made less dark for better visibility)
        const gradient = context.createRadialGradient(
            x, y, radius * 0.2,
            x, y, radius
        );
        gradient.addColorStop(0, `rgba(0, 0, 0, 0.4)`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
        
        // Add crater rim with brighter highlight
        context.beginPath();
        context.arc(x, y, radius * 1.1, 0, Math.PI * 2);
        context.strokeStyle = `rgb(${shade+40}, ${shade+35}, ${shade+25})`;
        context.lineWidth = 2 + Math.random() * 3;
        context.stroke();
        
        // Add ejecta rays for some craters (debris thrown outward)
        if (Math.random() < 0.4) {
            const rayCount = 5 + Math.floor(Math.random() * 7);
            const rayLength = radius * (2 + Math.random() * 2);
            
            for (let j = 0; j < rayCount; j++) {
                const angle = Math.random() * Math.PI * 2;
                const rayWidth = 5 + Math.random() * 15;
                
                context.beginPath();
                context.moveTo(
                    x + Math.cos(angle) * radius * 1.1,
                    y + Math.sin(angle) * radius * 1.1
                );
                context.lineTo(
                    x + Math.cos(angle) * rayLength,
                    y + Math.sin(angle) * rayLength
                );
                context.lineWidth = rayWidth;
                context.strokeStyle = `rgba(${shade+20}, ${shade+15}, ${shade+10}, 0.3)`;
                context.stroke();
            }
        }
    }
    
    // Small detailed rocks and pebbles (thousands)
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 4 + 1;
        
        // Random gray-brown shades
        const r = Math.floor(70 + Math.random() * 60);
        const g = Math.floor(r - 15 + Math.random() * 20);
        const b = Math.floor(g - 25 + Math.random() * 15);
        
        context.beginPath();
        
        // Vary between circles and small irregular shapes
        if (Math.random() < 0.7) {
            context.arc(x, y, radius, 0, Math.PI * 2);
        } else {
            // Small irregular polygon
            const points = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < points; j++) {
                const angle = (j / points) * Math.PI * 2;
                const ptRadius = radius * (0.8 + Math.random() * 0.4);
                const px = x + Math.cos(angle) * ptRadius;
                const py = y + Math.sin(angle) * ptRadius;
                
                if (j === 0) context.moveTo(px, py);
                else context.lineTo(px, py);
            }
            context.closePath();
        }
        
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fill();
    }
    
    // Fine dust/gravel texture across the whole surface
    context.globalCompositeOperation = 'overlay';
    for (let i = 0; i < canvas.width; i += 4) {
        for (let j = 0; j < canvas.height; j += 4) {
            if (Math.random() < 0.2) {
                const size = 1 + Math.random() * 2;
                const val = Math.floor(Math.random() * 100) + 50;
                context.fillStyle = `rgba(${val}, ${val-10}, ${val-20}, 0.1)`;
                context.fillRect(i, j, size, size);
            }
        }
    }
    context.globalCompositeOperation = 'source-over';
    
    // Finally, add some color variations to simulate mineral deposits
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 200 + 100;
        
        // Subtle color tints - yellowish/reddish/bluish mineral deposits
        const tintType = Math.floor(Math.random() * 3);
        let tint;
        
        if (tintType === 0) {
            // Subtle reddish (iron oxide)
            tint = `rgba(130, 60, 40, 0.1)`;
        } else if (tintType === 1) {
            // Subtle yellowish (sulfur)
            tint = `rgba(140, 130, 40, 0.08)`;
        } else {
            // Subtle bluish-gray (nickel)
            tint = `rgba(70, 80, 100, 0.12)`;
        }
        
        const gradient = context.createRadialGradient(
            x, y, 0,
            x, y, radius
        );
        gradient.addColorStop(0, tint);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

// Create normal map from height map with enhanced detail
function createNormalMap(heightMap) {
    const canvas = document.createElement('canvas');
    canvas.width = heightMap.image.width;
    canvas.height = heightMap.image.height;
    const ctx = canvas.getContext('2d');
    
    // Draw the height map
    ctx.drawImage(heightMap.image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Enhanced normal map generation with stronger detail
    const normalData = new Uint8ClampedArray(data.length);
    const strength = 3.0; // Increased normal strength for more rugged appearance
    
    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            
            // Get height values from surrounding pixels with wider sampling
            const l = data[(y * canvas.width + (x - 1)) * 4] / 255;
            const r = data[(y * canvas.width + (x + 1)) * 4] / 255;
            const t = data[((y - 1) * canvas.width + x) * 4] / 255;
            const b = data[((y + 1) * canvas.width + x) * 4] / 255;
            
            // Add diagonal samples for more detail
            const tl = data[((y - 1) * canvas.width + (x - 1)) * 4] / 255;
            const tr = data[((y - 1) * canvas.width + (x + 1)) * 4] / 255;
            const bl = data[((y + 1) * canvas.width + (x - 1)) * 4] / 255;
            const br = data[((y + 1) * canvas.width + (x + 1)) * 4] / 255;
            
            // Calculate normal vector with enhanced detail
            const nx = (l - r + (tl - tr) * 0.5 + (bl - br) * 0.5) * strength;
            const ny = (t - b + (tl - bl) * 0.5 + (tr - br) * 0.5) * strength;
            const nz = 1.0;
            
            // Normalize and pack into RGB
            const l2 = Math.sqrt(nx * nx + ny * ny + nz * nz);
            
            normalData[idx] = Math.floor(((nx / l2) * 0.5 + 0.5) * 255);     // R
            normalData[idx + 1] = Math.floor(((ny / l2) * 0.5 + 0.5) * 255); // G
            normalData[idx + 2] = Math.floor(((nz / l2) * 0.5 + 0.5) * 255); // B
            normalData[idx + 3] = 255; // Alpha
        }
    }
    
    // Put the normal map data back into the canvas
    const normalImgData = new ImageData(normalData, canvas.width, canvas.height);
    ctx.putImageData(normalImgData, 0, 0);
    
    // Create texture from canvas
    const normalMap = new THREE.CanvasTexture(canvas);
    return normalMap;
}

// Create a roughness map for varying surface properties
function createRoughnessMap(diffuseMap) {
    const canvas = document.createElement('canvas');
    canvas.width = diffuseMap.image.width;
    canvas.height = diffuseMap.image.height;
    const ctx = canvas.getContext('2d');
    
    // Draw the base texture
    ctx.drawImage(diffuseMap.image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Generate roughness data based on texture brightness
    // Darker areas = smoother, lighter areas = rougher
    const roughnessData = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
        // Calculate brightness
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Assign roughness value 
        // Add some variation to avoid uniform look
        let roughness = 0.6 + (brightness / 255) * 0.35 + (Math.random() * 0.05);
        roughness = Math.min(1, Math.max(0.5, roughness)); // Clamp between 0.5-1.0
        
        // Create grayscale roughness map
        const val = Math.floor(roughness * 255);
        roughnessData[i] = val;
        roughnessData[i + 1] = val;
        roughnessData[i + 2] = val;
        roughnessData[i + 3] = 255; // Alpha
    }
    
    // Put the roughness map data back into the canvas
    const roughnessImgData = new ImageData(roughnessData, canvas.width, canvas.height);
    ctx.putImageData(roughnessImgData, 0, 0);
    
    // Create texture from canvas
    const roughnessMap = new THREE.CanvasTexture(canvas);
    return roughnessMap;
}

// Create asteroid procedurally with enhanced detail
function createProceduralAsteroid() {
    // Create asteroid geometry with higher resolution for more detail
    const asteroidGeometry = new THREE.SphereGeometry(2, 192, 192);
    
    // Create a more complex deformation for the asteroid surface
    const positions = asteroidGeometry.attributes.position;
    const normals = asteroidGeometry.attributes.normal;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    
    const simplex = new SimplexNoise();
    
    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        normal.fromBufferAttribute(normals, i);
        
        // Normalized position for noise
        const nx = vertex.x / 2;
        const ny = vertex.y / 2;
        const nz = vertex.z / 2;
        
        // Use multiple octaves of simplex noise for natural terrain
        const noise1 = simplex.noise3D(nx * 1, ny * 1, nz * 1) * 0.5;       // Large features
        const noise2 = simplex.noise3D(nx * 2, ny * 2, nz * 2) * 0.25;      // Medium features
        const noise3 = simplex.noise3D(nx * 4, ny * 4, nz * 4) * 0.125;     // Small features
        const noise4 = simplex.noise3D(nx * 8, ny * 8, nz * 8) * 0.0625;    // Tiny details
        const noise5 = simplex.noise3D(nx * 16, ny * 16, nz * 16) * 0.03125; // Micro details
        
        // Combine multiple frequency noises for natural-looking terrain
        let noise = noise1 + noise2 + noise3 + noise4 + noise5;
        
        // Add some local deformation "hotspots" for major features
        const distortionPoints = 5; // Number of major features
        for (let j = 0; j < distortionPoints; j++) {
            // Random point on sphere
            const angle1 = j * Math.PI * (3 - Math.sqrt(5)); // Fibonacci spiral
            const angle2 = j * 2 * Math.PI / distortionPoints;
            
            const px = Math.sin(angle1) * Math.cos(angle2);
            const py = Math.sin(angle1) * Math.sin(angle2);
            const pz = Math.cos(angle1);
            
            // Vector from vertex to hotspot
            const dx = nx - px;
            const dy = ny - py;
            const dz = nz - pz;
            
            // Distance from hotspot (squared for faster calculation)
            const distSq = dx*dx + dy*dy + dz*dz;
            
            // Add stronger deformation near hotspots (inverse square falloff)
            const deform = 0.5 / (1 + distSq * 10);
            
            // Change sign randomly for some hotspots to create both mountains and craters
            const sign = (j % 2 === 0) ? 1 : -1;
            noise += sign * deform;
        }
        
        // Apply noise to vertex with varying strength based on position
        // This simulates asteroid having different surface types
        const distance = vertex.length();
        
        // Use noise itself to determine deformation strength for more varied terrain
        const deformationStrength = 0.3 + Math.abs(noise) * 0.3;
        const deformation = 1 + noise * deformationStrength;
        
        // Apply deformation along normal for more natural shape
        vertex.normalize().multiplyScalar(distance * deformation);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Compute normals for proper lighting
    asteroidGeometry.computeVertexNormals();
    
    // Create a diffuse texture (rock-like with more detail)
    const rockTexture = createRockTexture();
    
    // Create normal and roughness maps
    const normalMap = createNormalMap(rockTexture);
    const roughnessMap = createRoughnessMap(rockTexture);
    
    // Displacement map for surface detail
    const displacementMap = rockTexture.clone();
    
    // Create a more realistic rocky material
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        map: rockTexture,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        displacementMap: displacementMap,
        displacementScale: 0.15,
        displacementBias: -0.05,
        roughness: 0.8,
        metalness: 0.15,
        color: 0x706a60,
        envMapIntensity: 0.5,
        flatShading: false,
    });
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    modelGroup.add(asteroid);
    
    console.log("Created enhanced natural-looking asteroid");
    return asteroid;
}

// Create more realistic asteroid geometry
class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],
            [1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.p = [];
        
        // Populate with values 0..255
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        
        // To remove the need for index wrapping, double the permutation table length
        this.perm = new Array(512);
        this.gradP = new Array(512);
        
        // Extend the permutation table
        for(let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.gradP[i] = this.grad3[this.perm[i] % 12];
        }
    }
    
    // Simple 3D noise function
    noise3D(x, y, z) {
        // Find unit grid cell containing point
        let X = Math.floor(x);
        let Y = Math.floor(y);
        let Z = Math.floor(z);
        
        // Get relative xyz coordinates of point within cell
        x = x - X;
        y = y - Y;
        z = z - Z;
        
        // Wrap to avoid truncation effects
        X = X & 255;
        Y = Y & 255;
        Z = Z & 255;
        
        // Calculate noise contributions from each corner
        const n000 = this.dotProduct(this.gradP[(X+this.perm[Y+this.perm[Z]]) % 512], x, y, z);
        const n001 = this.dotProduct(this.gradP[(X+this.perm[Y+this.perm[Z+1]]) % 512], x, y, z-1);
        const n010 = this.dotProduct(this.gradP[(X+this.perm[Y+1+this.perm[Z]]) % 512], x, y-1, z);
        const n011 = this.dotProduct(this.gradP[(X+this.perm[Y+1+this.perm[Z+1]]) % 512], x, y-1, z-1);
        const n100 = this.dotProduct(this.gradP[(X+1+this.perm[Y+this.perm[Z]]) % 512], x-1, y, z);
        const n101 = this.dotProduct(this.gradP[(X+1+this.perm[Y+this.perm[Z+1]]) % 512], x-1, y, z-1);
        const n110 = this.dotProduct(this.gradP[(X+1+this.perm[Y+1+this.perm[Z]]) % 512], x-1, y-1, z);
        const n111 = this.dotProduct(this.gradP[(X+1+this.perm[Y+1+this.perm[Z+1]]) % 512], x-1, y-1, z-1);
        
        // Compute the fade curve value
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        // Interpolate
        const nx00 = this.mix(n000, n100, u);
        const nx01 = this.mix(n001, n101, u);
        const nx10 = this.mix(n010, n110, u);
        const nx11 = this.mix(n011, n111, u);
        
        const nxy0 = this.mix(nx00, nx10, v);
        const nxy1 = this.mix(nx01, nx11, v);
        
        return this.mix(nxy0, nxy1, w);
    }
    
    dotProduct(g, x, y, z) {
        return g[0]*x + g[1]*y + g[2]*z;
    }
    
    fade(t) {
        return t*t*t*(t*(t*6-15)+10);
    }
    
    mix(a, b, t) {
        return (1-t)*a + t*b;
    }
}

// Load Asteroid Model
function loadModel() {
    return new Promise((resolve) => {
        // For this project, we'll use our procedural model directly for better control
        console.log("Creating a more realistic asteroid procedurally");
        const asteroid = createProceduralAsteroid();
        resolve(asteroid);
    });
}

// Add post-processing effects 
function createPostProcessingEffects(quality = qualities[2]) { // Default to high quality
    // If composer already exists, dispose it
    if (composer) {
        composer.dispose();
    }
    
    composer = new EffectComposer(renderer);
    
    // Basic render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // SSAO (Screen Space Ambient Occlusion) for enhanced depth perception
    if (quality.ssao) {
        const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.001;
        ssaoPass.maxDistance = 0.1;
        ssaoPass.aoClamp = 0.25;
        composer.addPass(ssaoPass);
    }
    
    // Bloom effect - slightly stronger for better highlights
    if (quality.bloom) {
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,   // Increased strength from 0.3
            0.5,   // radius
            0.85   // Slightly reduced threshold from 0.9 to catch more highlights
        );
        composer.addPass(bloomPass);
    }
    
    // Gamma correction
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionPass);
}

// Raycaster for detecting clicks on the asteroid
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Store all active dust explosions
let dustExplosions = [];

// Class to handle dust explosion effect
class DustExplosion {
    constructor(position, scene, toolType = 'shovel', count = 250) {
        this.position = position;
        this.scene = scene;
        this.toolSettings = TOOL_SETTINGS[toolType];
        this.count = count * this.toolSettings.explosionSize;
        this.sparkDuration = this.toolSettings.sparkDuration;
        this.explosionDuration = this.toolSettings.explosionDuration;
        this.explosionSize = this.toolSettings.explosionSize;
        this.elapsed = 0;
        this.active = true;
        this.explosionStarted = false;
        this.toolType = toolType;
        
        // Store the auto-rotation state to restore it later
        this.wasAutoRotating = autoRotate;
        
        // Stop the rotation when tool is active
        if (autoRotate) {
            autoRotate = false;
            autoRotateButton.textContent = 'Start Rotation';
        }
        
        // Create spark particles first
        this.createSparkParticles();
    }
    
    // Create initial spark particles for drilling effect
    createSparkParticles() {
        const smokeTexture = this.createFallbackTexture();
        
        // Create particle group
        this.particles = [];
        this.group = new THREE.Group();
        
        // Create drilling sparks
        const sparkCount = Math.floor(this.count / 3);
        
        // Dynamite fuse effect is different from shovel drilling
        if (this.toolType === 'dynamite') {
            // Create fuse particle effect for dynamite
            for (let i = 0; i < sparkCount / 2; i++) {
                const sparkMaterial = new THREE.SpriteMaterial({
                    map: smokeTexture,
                    transparent: true,
                    opacity: 0.9,
                    color: 0xff3300, // Bright orange for fuse sparks
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                
                const spark = new THREE.Sprite(sparkMaterial);
                
                // Small scale for spark effect
                const scale = 0.01 + Math.random() * 0.02;
                spark.scale.set(scale, scale, scale);
                
                // Position at impact point with very tight grouping
                spark.position.set(
                    this.position.x + (Math.random() - 0.5) * 0.01,
                    this.position.y + (Math.random() - 0.5) * 0.01,
                    this.position.z + (Math.random() - 0.5) * 0.01
                );
                
                // Different velocity for fuse effect - mostly upward
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    0.5 + Math.random() * 0.3, 
                    (Math.random() - 0.5) * 0.2
                );
                
                // Store spark data
                this.particles.push({
                    sprite: spark,
                    velocity: velocity,
                    initialScale: scale,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 10, // Fast rotation
                    color: new THREE.Color().setHSL(
                        0.05 + Math.random() * 0.03, // Red-orange range
                        0.8 + Math.random() * 0.2,
                        0.7 + Math.random() * 0.3
                    ),
                    lifespan: 0.1 + Math.random() * 0.2, // Short individual spark lifespan
                    age: 0,
                    isDrillingSpark: true,
                    isFuseSpark: true
                });
                
                // Add to group
                this.group.add(spark);
            }
            
            // Add dynamite stick visual
            const dynamiteMaterial = new THREE.SpriteMaterial({
                map: smokeTexture,
                transparent: true,
                opacity: 0.9,
                color: 0xff0000, // Red for dynamite
                depthWrite: false
            });
            
            const dynamite = new THREE.Sprite(dynamiteMaterial);
            const scale = 0.1;
            dynamite.scale.set(scale * 0.5, scale, scale * 0.5);
            dynamite.position.copy(this.position);
            
            this.particles.push({
                sprite: dynamite,
                initialScale: scale,
                isDynamite: true,
                position: this.position.clone()
            });
            
            this.group.add(dynamite);
        } else {
            // Regular drilling sparks for shovel
            for (let i = 0; i < sparkCount; i++) {
                const sparkMaterial = new THREE.SpriteMaterial({
                    map: smokeTexture,
                    transparent: true,
                    opacity: 0.9,
                    color: 0xffcc44, // Bright yellow-orange for sparks
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                
                const spark = new THREE.Sprite(sparkMaterial);
                
                // Small scale for spark effect
                const scale = 0.01 + Math.random() * 0.03;
                spark.scale.set(scale, scale, scale);
                
                // Position at impact point with very tight grouping
                spark.position.set(
                    this.position.x + (Math.random() - 0.5) * 0.02,
                    this.position.y + (Math.random() - 0.5) * 0.02,
                    this.position.z + (Math.random() - 0.5) * 0.02
                );
                
                // Fast random velocity for sparks - more focused
                const angle = Math.random() * Math.PI * 2;
                const spread = 0.3; // Narrow spread
                const velocity = new THREE.Vector3(
                    Math.cos(angle) * spread * (Math.random() + 0.5),
                    Math.sin(angle) * spread * (Math.random() + 0.5), 
                    (Math.random() - 0.5) * spread
                );
                
                // Add small bias away from impact point
                velocity.add(new THREE.Vector3().subVectors(spark.position, this.position).normalize().multiplyScalar(0.5));
                
                // Store spark data
                this.particles.push({
                    sprite: spark,
                    velocity: velocity,
                    initialScale: scale,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 8, // Fast rotation
                    color: new THREE.Color().setHSL(
                        0.08 + Math.random() * 0.06, // Orange-yellow range
                        0.7 + Math.random() * 0.3,
                        0.6 + Math.random() * 0.4
                    ),
                    lifespan: 0.1 + Math.random() * 0.3, // Short individual spark lifespan
                    age: 0,
                    isDrillingSpark: true
                });
                
                // Add to group
                this.group.add(spark);
            }
        }
        
        // Add to scene
        this.scene.add(this.group);
        
        // Store the impact point for the explosion later
        this.impactPoint = this.position.clone();
    }
    
    // Create explosion particles after drilling is complete
    createExplosionParticles() {
        const smokeTexture = this.createFallbackTexture();
        
        // Create dust-like material
        const particleMaterial = new THREE.SpriteMaterial({
            map: smokeTexture,
            transparent: true,
            opacity: 0.7,
            color: 0xddcc99, // Brightened dust color
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Add dust/smoke particles - scale count by explosion size but keep visibly dense
        const particleCount = this.toolType === 'dynamite' ? 
            this.count * 1.2 : this.count;
            
        for (let i = 0; i < particleCount; i++) {
            // Create sprite for each particle
            const particle = new THREE.Sprite(particleMaterial.clone());
            
            // Random initial scale - varied sizes for realism but smaller radius
            const scale = (0.04 + Math.random() * 0.15) * this.explosionSize;
            particle.scale.set(scale, scale, scale);
            
            // Set initial position with variation around impact point - reduced radius
            const spreadFactor = this.toolType === 'dynamite' ? 0.15 : 0.08;
            particle.position.set(
                this.impactPoint.x + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.y + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.z + (Math.random() - 0.5) * spreadFactor
            );
            
            // Random velocity in all directions from the center - more exaggerated for cartoony effect
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2
            );
            
            // More exaggerated initial velocity for cartoony movement
            const speedFactor = this.toolType === 'dynamite' ? 
                (0.8 + Math.random() * 1.6) : 
                (0.6 + Math.random() * 1.0);
                
            velocity.normalize().multiplyScalar(speedFactor);
            
            // Add more pronounced upward bias for cartoony explosion
            velocity.y += this.toolType === 'dynamite' ? 0.8 : 0.5;
            
            // Store particle data
            this.particles.push({
                sprite: particle,
                velocity: velocity,
                initialScale: scale,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 3, // Exaggerated rotation
                // Brighter, more saturated colors for cartoony look
                color: this.toolType === 'dynamite' ? 
                    new THREE.Color().setHSL(
                        0.05 + Math.random() * 0.05,
                        0.7 + Math.random() * 0.3,  // More saturated
                        0.6 + Math.random() * 0.3   // Brighter
                    ) : 
                    new THREE.Color().setHSL(
                        0.08 + Math.random() * 0.04,
                        0.6 + Math.random() * 0.3,  // More saturated
                        0.5 + Math.random() * 0.3   // Brighter
                    ),
                isExplosionParticle: true,
                delay: Math.random() * 0.2 // Shorter delay for snappier start
            });
            
            // Add to group
            this.group.add(particle);
        }
        
        // Add cartoon-style explosion "POW" stars
        const starCount = this.toolType === 'dynamite' ? 15 : 8;
        for (let i = 0; i < starCount; i++) {
            const starMaterial = new THREE.SpriteMaterial({
                map: this.createStarTexture(),
                transparent: true,
                opacity: 1.0,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const star = new THREE.Sprite(starMaterial);
            
            // Larger scale for cartoon stars
            const scale = (0.1 + Math.random() * 0.15) * this.explosionSize;
            star.scale.set(scale, scale, scale);
            
            // Position at impact point with small spread
            const spreadFactor = 0.1;
            star.position.set(
                this.impactPoint.x + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.y + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.z + (Math.random() - 0.5) * spreadFactor
            );
            
            // Random outward velocity
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI - Math.PI/2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation),
                Math.sin(elevation), 
                Math.sin(angle) * Math.cos(elevation)
            );
            
            // Star movement is quite fast and bouncy
            const speedFactor = 0.8 + Math.random() * 0.6;
            velocity.multiplyScalar(speedFactor);
            
            // Random color for stars - bright, saturated colors
            const hue = Math.random(); // All colors of the rainbow
            const star_color = new THREE.Color().setHSL(hue, 0.9, 0.7);
            star.material.color.copy(star_color);
            
            // Store star data
            this.particles.push({
                sprite: star,
                velocity: velocity,
                initialScale: scale,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 8, // Fast rotation
                color: star_color,
                isCartoonStar: true,
                delay: Math.random() * 0.2,
                bounceFactor: 0.7 + Math.random() * 0.2 // For bouncy movement
            });
            
            // Add to group
            this.group.add(star);
        }
        
        // Add traditional explosion sparks - fewer, but brighter
        const sparkCount = this.toolType === 'dynamite' ? 
            this.count / 3 : this.count / 5;
            
        for (let i = 0; i < sparkCount; i++) {
            const sparkMaterial = new THREE.SpriteMaterial({
                map: smokeTexture,
                transparent: true,
                opacity: 1.0,
                color: this.toolType === 'dynamite' ? 
                    0xff3300 : 0xff6600, // Brighter colors
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const spark = new THREE.Sprite(sparkMaterial);
            
            // Small scale for spark effect
            const scale = (0.03 + Math.random() * 0.05) * this.explosionSize;
            spark.scale.set(scale, scale, scale);
            
            // Position at impact point with very small spread
            const spreadFactor = 0.05;
            spark.position.set(
                this.impactPoint.x + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.y + (Math.random() - 0.5) * spreadFactor,
                this.impactPoint.z + (Math.random() - 0.5) * spreadFactor
            );
            
            // Fast random velocity for sparks - more exaggerated
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2
            );
            
            // Exaggerated velocity for cartoon-like movement
            const speedFactor = this.toolType === 'dynamite' ? 
                (1.8 + Math.random() * 2.2) : 
                (1.5 + Math.random() * 1.8);
                
            velocity.normalize().multiplyScalar(speedFactor);
            
            // Store spark data
            this.particles.push({
                sprite: spark,
                velocity: velocity,
                initialScale: scale,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10, // Faster rotation
                color: new THREE.Color().setHSL(
                    0.05 + Math.random() * 0.08, 
                    0.9,  // Very saturated
                    0.7   // Brighter
                ),
                isExplosionSpark: true,
                delay: Math.random() * 0.1,
                // Add trail effect
                hasTrail: Math.random() < 0.7
            });
            
            // Add to group
            this.group.add(spark);
        }
    }
    
    // Create a star-shaped texture for cartoon explosions
    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, 64, 64);
        
        // Draw a cartoon star
        const centerX = 32;
        const centerY = 32;
        const spikes = 5 + Math.floor(Math.random() * 4); // 5-8 spikes
        const outerRadius = 30;
        const innerRadius = 15;
        
        ctx.beginPath();
        ctx.moveTo(centerX + outerRadius, centerY);
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? innerRadius : outerRadius;
            const angle = (Math.PI * i) / spikes;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        
        // Fill with bright white
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    // Create a smoke-like texture procedurally
    createFallbackTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient for a smoke-like appearance
        const gradient = ctx.createRadialGradient(
            32, 32, 0,
            32, 32, 32
        );
        
        // Smoke-like gradient (white in center, transparent at edges)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.elapsed += deltaTime;
        
        // Phase 1: Drilling sparks
        if (!this.explosionStarted && this.elapsed >= this.sparkDuration) {
            // Transition to explosion phase
            this.explosionStarted = true;
            this.createExplosionParticles();
        }
        
        // Phase 2: Explosion and aftermath
        if (this.explosionStarted && this.elapsed >= this.sparkDuration + this.explosionDuration) {
            // Cleanup when animation is complete
            this.scene.remove(this.group);
            this.particles.forEach(p => {
                if (p.sprite && p.sprite.material) {
                    p.sprite.material.dispose();
                }
            });
            this.active = false;
            
            // When explosion is complete, restore auto-rotation if it was on before
            if (this.wasAutoRotating && !autoRotate) {
                autoRotate = true;
                autoRotateButton.textContent = 'Stop Rotation';
            }
            
            return;
        }
        
        // Create constant stream of drilling sparks when in drilling phase
        if (!this.explosionStarted && this.elapsed % 0.05 < deltaTime) {
            this.addNewDrillingSparks(3);
        }
        
        // Update each particle
        this.particles = this.particles.filter(p => {
            // Handle drilling sparks differently
            if (p.isDrillingSpark) {
                p.age += deltaTime;
                
                // Remove short-lived drilling sparks
                if (p.age > p.lifespan) {
                    this.group.remove(p.sprite);
                    p.sprite.material.dispose();
                    return false;
                }
                
                // Update drilling spark
                const lifePercent = p.age / p.lifespan;
                
                // Fast fadeout at end of life
                p.sprite.material.opacity = Math.max(0, 1 - lifePercent * 1.5);
                
                // Update position with more exaggerated movement
                p.sprite.position.x += p.velocity.x * deltaTime;
                p.sprite.position.y += p.velocity.y * deltaTime;
                p.sprite.position.z += p.velocity.z * deltaTime;
                
                // Apply rotation
                p.rotation += p.rotationSpeed * deltaTime;
                p.sprite.material.rotation = p.rotation;
                
                return true;
            }
            
            // Skip particles that are not active yet
            if (!this.explosionStarted) return true;
            
            // Handle custom cartoon stars
            if (p.isCartoonStar) {
                // Process delay for staggered effect
                if (p.delay > 0) {
                    p.delay -= deltaTime;
                    return true;
                }
                
                // Get elapsed time in explosion phase
                const particleElapsed = this.elapsed - this.sparkDuration - (p.delay < 0 ? p.delay : 0);
                const lifePercent = particleElapsed / this.explosionDuration;
                
                // Stars have bouncy, cartoony movement
                p.sprite.position.x += p.velocity.x * deltaTime;
                p.sprite.position.y += p.velocity.y * deltaTime;
                p.sprite.position.z += p.velocity.z * deltaTime;
                
                // Cartoon gravity - more pronounced
                p.velocity.y -= 2.0 * deltaTime;
                
                // Bounce if star is moving downward fast enough
                if (p.velocity.y < -1.0 && Math.random() < 0.05) {
                    p.velocity.y = -p.velocity.y * p.bounceFactor;
                    // Reduce horizontal velocity on bounce
                    p.velocity.x *= 0.8;
                    p.velocity.z *= 0.8;
                }
                
                // Pulsate size for cartoony effect
                const scaleWave = Math.sin(particleElapsed * 10) * 0.2 + 1.0;
                const scale = p.initialScale * scaleWave * (1 - lifePercent * 0.5);
                p.sprite.scale.set(scale, scale, scale);
                
                // Fast rotation
                p.rotation += p.rotationSpeed * deltaTime;
                p.sprite.material.rotation = p.rotation;
                
                // Fade out near the end
                p.sprite.material.opacity = lifePercent > 0.7 ? 
                    1 - ((lifePercent - 0.7) / 0.3) : 
                    1.0;
                    
                if (lifePercent >= 1.0) {
                    this.group.remove(p.sprite);
                    p.sprite.material.dispose();
                    return false;
                }
                
                return true;
            }
            
            // Handle explosion phase particles
            if (p.isExplosionParticle || p.isExplosionSpark) {
                // Process delay for staggered effect
                if (p.delay > 0) {
                    p.delay -= deltaTime;
                    return true;
                }
                
                // Get elapsed time in explosion phase
                const particleElapsed = this.elapsed - this.sparkDuration - (p.delay < 0 ? p.delay : 0);
                const lifePercent = particleElapsed / this.explosionDuration;
                
                // Animation curve for opacity and scale - more exaggerated
                let opacityFactor, scaleFactor;
                
                if (p.isExplosionSpark) {
                    // Sparks fade out quickly
                    opacityFactor = 1 - (lifePercent * 2.5);
                    if (opacityFactor < 0) opacityFactor = 0;
                    
                    // Sparks shrink slightly
                    scaleFactor = 1 - (lifePercent * 0.5);
                    
                    // If this spark has a trail, add trail effect
                    if (p.hasTrail && particleElapsed % 0.1 < deltaTime) {
                        // Create trail particle
                        const trailMaterial = new THREE.SpriteMaterial({
                            map: this.createFallbackTexture(),
                            transparent: true,
                            opacity: 0.5,
                            color: p.sprite.material.color.clone(),
                            depthWrite: false,
                            blending: THREE.AdditiveBlending
                        });
                        
                        const trail = new THREE.Sprite(trailMaterial);
                        
                        // Smaller than the spark
                        const trailScale = p.initialScale * 0.7;
                        trail.scale.set(trailScale, trailScale, trailScale);
                        
                        // Position at current spark position
                        trail.position.copy(p.sprite.position);
                        
                        // Add to scene
                        this.group.add(trail);
                        
                        // Add to particles list with very short lifespan
                        this.particles.push({
                            sprite: trail,
                            velocity: new THREE.Vector3(0, 0, 0), // Static
                            initialScale: trailScale,
                            isTrail: true,
                            age: 0,
                            lifespan: 0.3 // Short lifespan
                        });
                    }
                } else {
                    // Dust particles fade more gradually but with a cartoony curve
                    opacityFactor = 1 - (lifePercent * lifePercent * 1.2);
                    
                    // Dust particles grow with cartoony effect
                    scaleFactor = 1 + (lifePercent * 3 * (1 - lifePercent)); // Parabolic growth/shrink
                }
                
                // Update position based on velocity - more exaggerated
                p.sprite.position.x += p.velocity.x * deltaTime;
                p.sprite.position.y += p.velocity.y * deltaTime;
                p.sprite.position.z += p.velocity.z * deltaTime;
                
                // Slow down velocity over time - different for cartoony feel
                p.velocity.multiplyScalar(0.95);
                
                // Different physics for particles vs. sparks - more exaggerated
                if (p.isExplosionParticle) {
                    // For dust, apply slight gravity and add random drift
                    p.velocity.y -= 0.05 * deltaTime;
                    
                    // Add random drift for smoke-like behavior - more pronounced
                    p.velocity.x += (Math.random() - 0.5) * 0.03;
                    p.velocity.z += (Math.random() - 0.5) * 0.03;
                } else {
                    // For sparks, apply stronger gravity
                    p.velocity.y -= 1.5 * deltaTime;
                }
                
                // Apply rotation
                p.rotation += p.rotationSpeed * deltaTime;
                p.sprite.material.rotation = p.rotation;
                
                // Update scale
                const newScale = p.initialScale * scaleFactor;
                p.sprite.scale.set(newScale, newScale, newScale);
                
                // Update opacity
                p.sprite.material.opacity = Math.max(0, opacityFactor);
                
                // Set color with slight variation over time
                if (p.isExplosionParticle) {
                    // Dust gets more brown/dark over time
                    const h = p.color.getHSL({}).h;
                    const s = p.color.getHSL({}).s - (lifePercent * 0.1);
                    const l = p.color.getHSL({}).l - (lifePercent * 0.2);
                    p.sprite.material.color.setHSL(h, Math.max(0, s), Math.max(0.2, l));
                }
                
                // If opacity reached zero, remove the particle
                if (p.sprite.material.opacity <= 0.01) {
                    this.group.remove(p.sprite);
                    p.sprite.material.dispose();
                    return false;
                }
                
                return true;
            }
            
            // Handle trail particles
            if (p.isTrail) {
                p.age += deltaTime;
                
                if (p.age > p.lifespan) {
                    this.group.remove(p.sprite);
                    p.sprite.material.dispose();
                    return false;
                }
                
                // Fade out quickly
                p.sprite.material.opacity = 1 - (p.age / p.lifespan);
                
                return true;
            }
            
            return true;
        });
    }
    
    // Add new drilling sparks as old ones fade out
    addNewDrillingSparks(count) {
        const smokeTexture = this.createFallbackTexture();
        
        for (let i = 0; i < count; i++) {
            const sparkMaterial = new THREE.SpriteMaterial({
                map: smokeTexture,
                transparent: true,
                opacity: 0.9,
                color: 0xffcc44, // Bright yellow-orange for sparks
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const spark = new THREE.Sprite(sparkMaterial);
            
            // Small scale for spark effect
            const scale = 0.01 + Math.random() * 0.03;
            spark.scale.set(scale, scale, scale);
            
            // Position at impact point with very tight grouping
            spark.position.set(
                this.position.x + (Math.random() - 0.5) * 0.02,
                this.position.y + (Math.random() - 0.5) * 0.02,
                this.position.z + (Math.random() - 0.5) * 0.02
            );
            
            // Fast random velocity for sparks - more focused
            const angle = Math.random() * Math.PI * 2;
            const spread = 0.3; // Narrow spread
            const velocity = new THREE.Vector3(
                Math.cos(angle) * spread * (Math.random() + 0.5),
                Math.sin(angle) * spread * (Math.random() + 0.5), 
                (Math.random() - 0.5) * spread
            );
            
            // Add small bias away from impact point
            velocity.add(new THREE.Vector3().subVectors(spark.position, this.position).normalize().multiplyScalar(0.5));
            
            // Store spark data
            this.particles.push({
                sprite: spark,
                velocity: velocity,
                initialScale: scale,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 8, // Fast rotation
                color: new THREE.Color().setHSL(
                    0.08 + Math.random() * 0.06, // Orange-yellow range
                    0.7 + Math.random() * 0.3,
                    0.6 + Math.random() * 0.4
                ),
                lifespan: 0.1 + Math.random() * 0.3, // Short individual spark lifespan
                age: 0,
                isDrillingSpark: true
            });
            
            // Add to group
            this.group.add(spark);
        }
    }
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Get delta time
        deltaTime = clock.getDelta();
        
        // Auto-rotate the model if enabled
        if (autoRotate) {
            modelGroup.rotation.y += autoRotateSpeed * 0.01;
            // Add slight wobble for more natural asteroid movement
            modelGroup.rotation.x = Math.sin(Date.now() * 0.0003) * 0.03;
            modelGroup.rotation.z = Math.cos(Date.now() * 0.0005) * 0.03;
        }
        
        // Update all active dust explosions
        dustExplosions = dustExplosions.filter(explosion => {
            if (explosion.active) {
                explosion.update(deltaTime);
                return true;
            }
            return false;
        });
        
        controls.update();
        
        // Use composer for rendering if available, otherwise fallback to renderer
        if (composer) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error("Error in animation loop:", error);
        // Continue the animation loop even if there's an error
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update composer size if it exists
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }
}
window.addEventListener('resize', onWindowResize, false);

// Handle mouse interaction with the model
function setupInteraction() {
    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Add custom cursor styles to head
    const style = document.createElement('style');
    style.textContent = `
        .shovel-cursor {
            cursor: crosshair;
        }
    `;
    document.head.appendChild(style);
    
    // Track if we're hovering over the asteroid
    let isHovering = false;
    
    // Mouse move event for hover detection
    window.addEventListener('mousemove', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        
        if (intersects.length > 0 && !isHovering) {
            // Mouse is over the asteroid - change to tool cursor
            document.body.classList.add('shovel-cursor');
            isHovering = true;
        } else if (intersects.length === 0 && isHovering) {
            // Mouse is no longer over the asteroid - change back to default cursor
            document.body.classList.remove('shovel-cursor');
            isHovering = false;
        }
    });
    
    // Click event for dust explosion
    window.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        
        if (intersects.length > 0) {
            // Create a dust explosion at the clicked point
            const intersectionPoint = intersects[0].point;
            
            // Create and add dust explosion with the current tool
            const explosion = new DustExplosion(intersectionPoint, scene, currentTool);
            dustExplosions.push(explosion);
        }
    });
    
    // Make sure cursor resets when leaving the window
    window.addEventListener('mouseleave', () => {
        if (isHovering) {
            document.body.classList.remove('shovel-cursor');
            isHovering = false;
        }
    });
}

// Initialize the scene
async function init() {
    setupLighting();
    setupInteraction();
    
    // Immediately start showing the loading progress
    loadingProgress.style.width = '10%';
    loadingText.textContent = 'Creating asteroid...';
    
    try {
        // Create procedural asteroid directly without waiting for environment map
        console.log("Creating a procedural asteroid");
        const asteroid = createProceduralAsteroid();
        loadingProgress.style.width = '70%';
        loadingText.textContent = 'Setting up environment...';
        
        // Set a simple background color as fallback
        scene.background = new THREE.Color(0x000005);
        
        // Try to load environment map but don't wait for it
        loadEnvironmentMap().catch(err => {
            console.error("Failed to load environment map:", err);
            setupFallbackEnvironment();
        });
        
        // Setup post-processing based on the default quality
        const quality = qualities[qualitySelector.value];
        createPostProcessingEffects(quality);
        
        // Update button text to match initial state
        autoRotateButton.textContent = autoRotate ? 'Stop Rotation' : 'Start Rotation';
        
        // Start animation loop
        animate();
        
        // Hide loading screen with a fade effect
        loadingProgress.style.width = '100%';
        loadingText.textContent = 'Complete!';
        
        setTimeout(() => {
            loadingContainer.style.opacity = 0;
            setTimeout(() => {
                loadingContainer.style.display = 'none';
            }, 1000);
        }, 500);
    } catch (error) {
        console.error("Error during initialization:", error);
        
        // Emergency recovery - create a simple asteroid and show the scene
        modelGroup.clear();
        const simpleAsteroid = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshStandardMaterial({ 
                color: 0x808070,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        modelGroup.add(simpleAsteroid);
        
        // Set a simple background
        scene.background = new THREE.Color(0x000005);
        
        // Start animation
        animate();
        
        // Hide loading screen
        loadingContainer.style.display = 'none';
    }
}

// Start the application
window.initAsteroid = init;

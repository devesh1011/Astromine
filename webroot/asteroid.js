import * as THREE from "./libs/three.module.js";
import { SimplexNoise } from "./simplexNoise.js";
import { currentAsteroidConfig } from "./gameState.js";

function createRoughnessMap(diffuseMap) {
  const canvas = document.createElement("canvas");
  canvas.width = diffuseMap.image.width;
  canvas.height = diffuseMap.image.height;
  const ctx = canvas.getContext("2d");

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
    let roughness = 0.6 + (brightness / 255) * 0.35 + Math.random() * 0.05;
    roughness = Math.min(1, Math.max(0.5, roughness)); // Clamp between 0.5-1.0

    // Create grayscale roughness map
    const val = Math.floor(roughness * 255);
    roughnessData[i] = val;
    roughnessData[i + 1] = val;
    roughnessData[i + 2] = val;
    roughnessData[i + 3] = 255; // Alpha
  }

  // Put the roughness map data back into the canvas
  const roughnessImgData = new ImageData(
    roughnessData,
    canvas.width,
    canvas.height
  );
  ctx.putImageData(roughnessImgData, 0, 0);

  // Create texture from canvas
  const roughnessMap = new THREE.CanvasTexture(canvas);
  return roughnessMap;
}

function createNormalMap(heightMap) {
  const canvas = document.createElement("canvas");
  canvas.width = heightMap.image.width;
  canvas.height = heightMap.image.height;
  const ctx = canvas.getContext("2d");

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

      normalData[idx] = Math.floor(((nx / l2) * 0.5 + 0.5) * 255); // R
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

function createRockTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048; // Higher resolution texture
  canvas.height = 2048;
  const context = canvas.getContext("2d");

  // Get current configuration
  const config = currentAsteroidConfig;

  // Generate base color from config
  const baseColorHSL = config.baseColor.getHSL({});
  const baseColorRGB = {
    r: Math.floor(config.baseColor.r * 255),
    g: Math.floor(config.baseColor.g * 255),
    b: Math.floor(config.baseColor.b * 255),
  };

  // Fill with base color adjusted by brightness
  context.fillStyle = `rgb(${Math.floor(
    baseColorRGB.r * config.texture.brightness
  )}, 
                           ${Math.floor(
                             baseColorRGB.g * config.texture.brightness
                           )}, 
                           ${Math.floor(
                             baseColorRGB.b * config.texture.brightness
                           )})`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Add texture details (e.g., noise, craters, etc.)
  // (Include the rest of the texture generation logic here...)

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

export function createProceduralAsteroid(modelGroup) {
  const config = currentAsteroidConfig;

  // Create asteroid geometry with higher resolution for more detail
  const asteroidGeometry = new THREE.SphereGeometry(2, 192, 192);

  // Create a more complex deformation for the asteroid surface
  const positions = asteroidGeometry.attributes.position;
  const normals = asteroidGeometry.attributes.normal;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  // Create a new simplex with the configured seed
  const simplex = new SimplexNoise();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    normal.fromBufferAttribute(normals, i);

    // Normalized position for noise
    const nx = vertex.x / 2;
    const ny = vertex.y / 2;
    const nz = vertex.z / 2;

    // Use multiple octaves of simplex noise for natural terrain
    // Scale each frequency by the configuration values
    const noise1 =
      simplex.noise3D(nx * 1, ny * 1, nz * 1) * config.noise.largeFeatures;
    const noise2 =
      simplex.noise3D(nx * 2, ny * 2, nz * 2) * config.noise.mediumFeatures;
    const noise3 =
      simplex.noise3D(nx * 4, ny * 4, nz * 4) * config.noise.smallFeatures;
    const noise4 =
      simplex.noise3D(nx * 8, ny * 8, nz * 8) * config.noise.tinyFeatures;
    const noise5 =
      simplex.noise3D(nx * 16, ny * 16, nz * 16) * config.noise.microFeatures;

    // Combine multiple frequency noises for natural-looking terrain
    let noise = noise1 + noise2 + noise3 + noise4 + noise5;

    // Add some local deformation "hotspots" for major features
    const distortionPoints = config.shape.featureCount; // Number of major features
    for (let j = 0; j < distortionPoints; j++) {
      // Random point on sphere based on config seed
      const angle1 =
        j * Math.PI * (3 - Math.sqrt(5)) + config.shape.seed * 0.01;
      const angle2 =
        (j * 2 * Math.PI) / distortionPoints + config.shape.seed * 0.02;

      const px = Math.sin(angle1) * Math.cos(angle2);
      const py = Math.sin(angle1) * Math.sin(angle2);
      const pz = Math.cos(angle1);

      // Vector from vertex to hotspot
      const dx = nx - px;
      const dy = ny - py;
      const dz = nz - pz;

      // Distance from hotspot (squared for faster calculation)
      const distSq = dx * dx + dy * dy + dz * dz;

      // Add stronger deformation near hotspots (inverse square falloff)
      // Adjusted by smoothness from configuration
      const deform = 0.5 / (1 + distSq * (10 * config.shape.smoothness));

      // Change sign randomly for some hotspots to create both mountains and craters
      const sign = j % 2 === 0 ? 1 : -1;
      noise += sign * deform;
    }

    // Apply noise to vertex with varying strength based on position
    // This simulates asteroid having different surface types
    const distance = vertex.length();

    // Use noise itself to determine deformation strength for more varied terrain
    // Adjusted by configuration deformStrength
    const deformationStrength =
      0.3 + Math.abs(noise) * 0.3 * config.shape.deformStrength;
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
    roughness: config.texture.roughness,
    metalness: config.texture.metalness,
    color: config.baseColor,
    envMapIntensity: 0.5,
    flatShading: false,
  });

  const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
  asteroid.castShadow = true;
  asteroid.receiveShadow = true;

  modelGroup.add(asteroid);

  console.log(
    "Created enhanced natural-looking asteroid with configuration:",
    config
  );
  return asteroid;
}

export function getRandomAsteroidConfig() {
  const seed = Math.floor(Math.random() * 1000000);

  return {
    // Base color variations from gray to brownish to reddish to bluish
    baseColor: new THREE.Color().setHSL(
      // Hue: Wide range of possible asteroid colors
      Math.random() < 0.7
        ? // 70% chance of being gray/brown/red (0.02-0.1)
          0.02 + Math.random() * 0.08
        : // 30% chance of other colors (blue/green/purple tints)
          0.3 + Math.random() * 0.6,
      // Saturation: From almost gray to more saturated
      0.1 + Math.random() * 0.4,
      // Lightness: From darker to lighter
      0.2 + Math.random() * 0.3
    ),

    // Texture variations
    texture: {
      // How bumpy the texture appears
      roughness: 0.5 + Math.random() * 0.4,
      // How metallic the asteroid appears
      metalness: 0.05 + Math.random() * 0.3,
      // Scale of the texture details
      detailScale: 0.7 + Math.random() * 0.6,
      // Number of craters
      craterDensity: 0.5 + Math.random() * 1.0,
      // Contrast of the texture
      contrast: 0.7 + Math.random() * 0.5,
      // Base texture brightness
      brightness: 0.7 + Math.random() * 0.5,
    },

    // Shape variations
    shape: {
      // Overall deformation strength
      deformStrength: 0.2 + Math.random() * 0.3,
      // Number of major features (mountains, craters)
      featureCount: 3 + Math.floor(Math.random() * 8),
      // Smoothness of the overall shape
      smoothness: 0.3 + Math.random() * 1.2,
      // Seed for shape generation
      seed: seed,
    },

    // Noise variations for surface details
    noise: {
      // Strength of different noise frequencies
      largeFeatures: 0.4 + Math.random() * 0.2,
      mediumFeatures: 0.2 + Math.random() * 0.15,
      smallFeatures: 0.1 + Math.random() * 0.15,
      tinyFeatures: 0.05 + Math.random() * 0.1,
      microFeatures: 0.02 + Math.random() * 0.05,
      // Smoothness of noise transitions
      turbulence: 0.5 + Math.random() * 1.0,
    },
  };
}

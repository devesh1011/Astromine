import * as THREE from "./libs/three.module.js";
import { SimplexNoise } from "./SimplexNoise.js"; // Assuming this is a separate file with the SimplexNoise class

export async function initAsteroid(scene, modelGroup) {
  const asteroidConfig = getRandomAsteroidConfig();
  const asteroid = createProceduralAsteroid(asteroidConfig);
  modelGroup.add(asteroid);
  setupFallbackEnvironment(scene);
}

function getRandomAsteroidConfig() {
  const seed = Math.floor(Math.random() * 1000000);
  return {
    baseColor: new THREE.Color().setHSL(
      Math.random() < 0.7
        ? 0.02 + Math.random() * 0.08
        : 0.3 + Math.random() * 0.6,
      0.1 + Math.random() * 0.4,
      0.2 + Math.random() * 0.3
    ),
    texture: {
      roughness: 0.5 + Math.random() * 0.4,
      metalness: 0.05 + Math.random() * 0.3,
      detailScale: 0.7 + Math.random() * 0.6,
      craterDensity: 0.5 + Math.random() * 1.0,
      contrast: 0.7 + Math.random() * 0.5,
      brightness: 0.7 + Math.random() * 0.5,
    },
    shape: {
      deformStrength: 0.2 + Math.random() * 0.3,
      featureCount: 3 + Math.floor(Math.random() * 8),
      smoothness: 0.3 + Math.random() * 1.2,
      seed: seed,
    },
    noise: {
      largeFeatures: 0.4 + Math.random() * 0.2,
      mediumFeatures: 0.2 + Math.random() * 0.15,
      smallFeatures: 0.1 + Math.random() * 0.15,
      tinyFeatures: 0.05 + Math.random() * 0.1,
      microFeatures: 0.02 + Math.random() * 0.05,
      turbulence: 0.5 + Math.random() * 1.0,
    },
  };
}

function createProceduralAsteroid(config) {
  const asteroidGeometry = new THREE.SphereGeometry(2, 192, 192);
  const simplex = new SimplexNoise();
  const positions = asteroidGeometry.attributes.position;
  const normals = asteroidGeometry.attributes.normal;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    normal.fromBufferAttribute(normals, i);

    const nx = vertex.x / 2;
    const ny = vertex.y / 2;
    const nz = vertex.z / 2;

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

    let noise = noise1 + noise2 + noise3 + noise4 + noise5;

    const distortionPoints = config.shape.featureCount;
    for (let j = 0; j < distortionPoints; j++) {
      const angle1 =
        j * Math.PI * (3 - Math.sqrt(5)) + config.shape.seed * 0.01;
      const angle2 =
        (j * 2 * Math.PI) / distortionPoints + config.shape.seed * 0.02;

      const px = Math.sin(angle1) * Math.cos(angle2);
      const py = Math.sin(angle1) * Math.sin(angle2);
      const pz = Math.cos(angle1);

      const dx = nx - px;
      const dy = ny - py;
      const dz = nz - pz;

      const distSq = dx * dx + dy * dy + dz * dz;
      const deform = 0.5 / (1 + distSq * (10 * config.shape.smoothness));
      const sign = j % 2 === 0 ? 1 : -1;
      noise += sign * deform;
    }

    const distance = vertex.length();
    const deformationStrength =
      0.3 + Math.abs(noise) * 0.3 * config.shape.deformStrength;
    const deformation = 1 + noise * deformationStrength;

    vertex.normalize().multiplyScalar(distance * deformation);
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  asteroidGeometry.computeVertexNormals();

  const rockTexture = createRockTexture(config);
  const normalMap = createNormalMap(rockTexture);
  const roughnessMap = createRoughnessMap(rockTexture);
  const displacementMap = rockTexture.clone();

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

  return asteroid;
}

function createRockTexture(config) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const context = canvas.getContext("2d");

  const baseColorHSL = config.baseColor.getHSL({});
  const baseColorRGB = {
    r: Math.floor(config.baseColor.r * 255),
    g: Math.floor(config.baseColor.g * 255),
    b: Math.floor(config.baseColor.b * 255),
  };

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

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = canvas.width;
  noiseCanvas.height = canvas.height;
  const noiseCtx = noiseCanvas.getContext("2d");

  const imgData = noiseCtx.createImageData(
    noiseCanvas.width,
    noiseCanvas.height
  );
  const data = imgData.data;

  for (let y = 0; y < noiseCanvas.height; y++) {
    for (let x = 0; x < noiseCanvas.width; x++) {
      const idx = (y * noiseCanvas.width + x) * 4;

      const turbFactor = config.noise.turbulence;
      const highFreq = Math.random() * 0.15 * config.noise.microFeatures;
      const midFreq =
        Math.sin(x / (20 * turbFactor)) *
        Math.cos(y / (20 * turbFactor)) *
        0.15 *
        config.noise.smallFeatures;
      const lowFreq =
        Math.sin(x / (200 * turbFactor) + y / (100 * turbFactor)) *
        0.2 *
        config.noise.mediumFeatures;

      let noiseVal = highFreq + midFreq + lowFreq;
      noiseVal = (noiseVal + 1) * 0.5;

      noiseVal = 0.5 + (noiseVal - 0.5) * config.texture.contrast;

      const colorVal =
        Math.floor(noiseVal * 90 * config.texture.brightness) + 60;
      data[idx] = colorVal;
      data[idx + 1] = colorVal;
      data[idx + 2] = colorVal;
      data[idx + 3] = 255;
    }
  }

  noiseCtx.putImageData(imgData, 0, 0);

  context.globalCompositeOperation = "overlay";
  context.drawImage(noiseCanvas, 0, 0);
  context.globalCompositeOperation = "source-over";

  const outcropsCount = Math.floor(200 * config.texture.detailScale);
  for (let i = 0; i < outcropsCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 60 + 40;

    const rockType = Math.random();
    let r, g, b;

    if (rockType < 0.4) {
      r = Math.floor((70 + Math.random() * 30) * (baseColorRGB.r / 128));
      g = Math.floor((r - 5 + Math.random() * 10) * (baseColorRGB.g / 128));
      b = Math.floor((r - 10 + Math.random() * 8) * (baseColorRGB.b / 128));
    } else if (rockType < 0.7) {
      r = Math.floor((90 + Math.random() * 30) * (baseColorRGB.r / 128));
      g = Math.floor((r - 20 + Math.random() * 15) * (baseColorRGB.g / 128));
      b = Math.floor((g - 30 + Math.random() * 10) * (baseColorRGB.b / 128));
    } else {
      r = Math.floor((110 + Math.random() * 40) * (baseColorRGB.r / 128));
      g = r - Math.floor(Math.random() * 10);
      b = g - Math.floor(Math.random() * 15);
    }

    const points = [];
    const numPoints = 12 + Math.floor(Math.random() * 8);
    for (let j = 0; j < numPoints; j++) {
      const angle = (j / numPoints) * Math.PI * 2;
      const radiusVar = radius * (0.7 + Math.random() * 0.6);
      const px = x + Math.cos(angle) * radiusVar;
      const py = y + Math.sin(angle) * radiusVar;
      points.push({ x: px, y: py });
    }

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      context.lineTo(points[j].x, points[j].y);
    }
    context.closePath();

    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    context.fill();

    const highlight = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
    const shadow = `rgba(0, 0, 0, ${Math.random() * 0.3})`;

    context.save();
    context.clip();

    const shadowAngle = Math.random() * Math.PI * 2;
    const shadowX = Math.cos(shadowAngle) * radius * 0.5;
    const shadowY = Math.sin(shadowAngle) * radius * 0.5;

    context.fillStyle = shadow;
    context.fillRect(
      x + shadowX - radius,
      y + shadowY - radius,
      radius * 2,
      radius * 2
    );

    context.fillStyle = highlight;
    context.fillRect(
      x - shadowX - radius * 0.5,
      y - shadowY - radius * 0.5,
      radius,
      radius
    );

    context.restore();
  }

  const craterCount = Math.floor(90 * config.texture.craterDensity);
  for (let i = 0; i < craterCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 50 + 20;

    const shade = Math.floor(
      (60 + Math.random() * 30) * (baseColorHSL.l * 1.5)
    );

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`;
    context.fill();

    const gradient = context.createRadialGradient(
      x,
      y,
      radius * 0.2,
      x,
      y,
      radius
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 0.4)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();

    context.beginPath();
    context.arc(x, y, radius * 1.1, 0, Math.PI * 2);
    context.strokeStyle = `rgb(${shade + 40}, ${shade + 35}, ${shade + 25})`;
    context.lineWidth = 2 + Math.random() * 3;
    context.stroke();

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
        context.strokeStyle = `rgba(${shade + 20}, ${shade + 15}, ${
          shade + 10
        }, 0.3)`;
        context.stroke();
      }
    }
  }

  const pebblesCount = Math.floor(8000 * config.texture.detailScale);
  for (let i = 0; i < pebblesCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 4 + 1;

    const r = Math.floor((70 + Math.random() * 60) * (baseColorRGB.r / 128));
    const g = Math.floor(
      (r - 15 + Math.random() * 20) * (baseColorRGB.g / 128)
    );
    const b = Math.floor(
      (g - 25 + Math.random() * 15) * (baseColorRGB.b / 128)
    );

    context.beginPath();

    if (Math.random() < 0.7) {
      context.arc(x, y, radius, 0, Math.PI * 2);
    } else {
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

  context.globalCompositeOperation = "overlay";
  for (let i = 0; i < canvas.width; i += 4) {
    for (let j = 0; j < canvas.height; j += 4) {
      if (Math.random() < 0.2) {
        const size = 1 + Math.random() * 2;
        const val = Math.floor(Math.random() * 100) + 50;
        context.fillStyle = `rgba(${val}, ${val - 10}, ${val - 20}, 0.1)`;
        context.fillRect(i, j, size, size);
      }
    }
  }
  context.globalCompositeOperation = "source-over";

  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 200 + 100;

    const tintType = Math.floor(Math.random() * 3);
    let tint;

    if (tintType === 0) {
      tint = `rgba(${Math.floor((130 * baseColorRGB.r) / 128)}, ${Math.floor(
        (60 * baseColorRGB.g) / 128
      )}, ${Math.floor((40 * baseColorRGB.b) / 128)}, 0.1)`;
    } else if (tintType === 1) {
      tint = `rgba(${Math.floor((140 * baseColorRGB.r) / 128)}, ${Math.floor(
        (130 * baseColorRGB.g) / 128
      )}, ${Math.floor((40 * baseColorRGB.b) / 128)}, 0.08)`;
    } else {
      tint = `rgba(${Math.floor((70 * baseColorRGB.r) / 128)}, ${Math.floor(
        (80 * baseColorRGB.g) / 128
      )}, ${Math.floor((100 * baseColorRGB.b) / 128)}, 0.12)`;
    }

    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, tint);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

function createNormalMap(heightMap) {
  const canvas = document.createElement("canvas");
  canvas.width = heightMap.image.width;
  canvas.height = heightMap.image.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(heightMap.image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const normalData = new Uint8ClampedArray(data.length);
  const strength = 3.0;

  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4;

      const l = data[(y * canvas.width + (x - 1)) * 4] / 255;
      const r = data[(y * canvas.width + (x + 1)) * 4] / 255;
      const t = data[((y - 1) * canvas.width + x) * 4] / 255;
      const b = data[((y + 1) * canvas.width + x) * 4] / 255;

      const tl = data[((y - 1) * canvas.width + (x - 1)) * 4] / 255;
      const tr = data[((y - 1) * canvas.width + (x + 1)) * 4] / 255;
      const bl = data[((y + 1) * canvas.width + (x - 1)) * 4] / 255;
      const br = data[((y + 1) * canvas.width + (x + 1)) * 4] / 255;

      const nx = (l - r + (tl - tr) * 0.5 + (bl - br) * 0.5) * strength;
      const ny = (t - b + (tl - bl) * 0.5 + (tr - br) * 0.5) * strength;
      const nz = 1.0;

      const l2 = Math.sqrt(nx * nx + ny * ny + nz * nz);

      normalData[idx] = Math.floor(((nx / l2) * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.floor(((ny / l2) * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.floor(((nz / l2) * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;
    }
  }

  const normalImgData = new ImageData(normalData, canvas.width, canvas.height);
  ctx.putImageData(normalImgData, 0, 0);

  const normalMap = new THREE.CanvasTexture(canvas);
  return normalMap;
}

function createRoughnessMap(diffuseMap) {
  const canvas = document.createElement("canvas");
  canvas.width = diffuseMap.image.width;
  canvas.height = diffuseMap.image.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(diffuseMap.image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const roughnessData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;

    let roughness = 0.6 + (brightness / 255) * 0.35 + Math.random() * 0.05;
    roughness = Math.min(1, Math.max(0.5, roughness));

    const val = Math.floor(roughness * 255);
    roughnessData[i] = val;
    roughnessData[i + 1] = val;
    roughnessData[i + 2] = val;
    roughnessData[i + 3] = 255;
  }

  const roughnessImgData = new ImageData(
    roughnessData,
    canvas.width,
    canvas.height
  );
  ctx.putImageData(roughnessImgData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(canvas);
  return roughnessMap;
}

function setupFallbackEnvironment(scene) {
  scene.background = new THREE.Color(0x000005);

  const starCount = 2000;
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
  });

  const starPositions = [];
  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starPositions.push(x, y, z);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

  const tempScene = new THREE.Scene();
  tempScene.background = new THREE.Color(0x000005);

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

  envStarGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(envStarPositions, 3)
  );
  const envStars = new THREE.Points(
    envStarGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
    })
  );

  tempScene.add(envStars);

  cubeCamera.position.set(0, 0, 0);
  cubeCamera.update(renderer, tempScene); // Note: renderer needs to be passed or globally accessible

  scene.environment = cubeRenderTarget.texture;
}

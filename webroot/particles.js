import * as THREE from "./libs/three.module.js";
import { TOOL_SETTINGS } from "./constants.js";
import { resources } from "./gameState.js";
import { audioContext, soundEnabled } from "./sound.js";
import { resourceRatios } from "./constants.js"; // Correct import

export class DustExplosion {
  constructor(position, scene, toolType = "shovel", count = 250) {
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
    }

    // Create spark particles first
    this.createSparkParticles();

    // Add sound handling
    this.shovelSound = null;
    this.shovelSoundSource = null;
    this.fuseSoundSource = null;
    this.explosionSoundSource = null;

    if (this.toolType === "shovel" && soundEnabled && shovelSoundBuffer) {
      this.playShovelSound();
    } else if (this.toolType === "dynamite") {
      if (soundEnabled && fuseSoundBuffer) {
        this.playFuseSound();
      }
    }
  }

  playShovelSound() {
    if (!soundEnabled) return; // Only play if sound is enabled
    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const source = audioContext.createBufferSource();
      source.buffer = shovelSoundBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      source.stop(audioContext.currentTime + 3);
    } catch (error) {
      console.error("Error playing shovel sound:", error);
    }
  }

  playFuseSound() {
    if (!soundEnabled) return; // Only play if sound is enabled
    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      this.fuseSoundSource = audioContext.createBufferSource();
      this.fuseSoundSource.buffer = fuseSoundBuffer;
      this.fuseSoundSource.connect(audioContext.destination);
      this.fuseSoundSource.start(0);
      this.fuseSoundSource.stop(audioContext.currentTime + 8);
    } catch (error) {
      console.error("Error playing fuse sound:", error);
    }
  }

  playExplosionSound() {
    if (!soundEnabled) return; // Only play if sound is enabled
    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      this.explosionSoundSource = audioContext.createBufferSource();
      this.explosionSoundSource.buffer = explosionSoundBuffer;
      this.explosionSoundSource.connect(audioContext.destination);
      this.explosionSoundSource.start(0);
    } catch (error) {
      console.error("Error playing explosion sound:", error);
    }
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
    if (this.toolType === "dynamite") {
      // Create fuse particle effect for dynamite
      for (let i = 0; i < sparkCount / 2; i++) {
        const sparkMaterial = new THREE.SpriteMaterial({
          map: smokeTexture,
          transparent: true,
          opacity: 0.9,
          color: 0xff3300, // Bright orange for fuse sparks
          depthWrite: false,
          blending: THREE.AdditiveBlending,
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
          isFuseSpark: true,
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
        depthWrite: false,
      });

      const dynamite = new THREE.Sprite(dynamiteMaterial);
      const scale = 0.1;
      dynamite.scale.set(scale * 0.5, scale, scale * 0.5);
      dynamite.position.copy(this.position);

      this.particles.push({
        sprite: dynamite,
        initialScale: scale,
        isDynamite: true,
        position: this.position.clone(),
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
          blending: THREE.AdditiveBlending,
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
        velocity.add(
          new THREE.Vector3()
            .subVectors(spark.position, this.position)
            .normalize()
            .multiplyScalar(0.5)
        );

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
          isDrillingSpark: true,
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
      blending: THREE.AdditiveBlending,
    });

    // Add dust/smoke particles - scale count by explosion size but keep visibly dense
    const particleCount =
      this.toolType === "dynamite" ? this.count * 1.2 : this.count;

    for (let i = 0; i < particleCount; i++) {
      // Create sprite for each particle
      const particle = new THREE.Sprite(particleMaterial.clone());

      // Random initial scale - varied sizes for realism but smaller radius
      const scale = (0.04 + Math.random() * 0.15) * this.explosionSize;
      particle.scale.set(scale, scale, scale);

      // Set initial position with variation around impact point - reduced radius
      const spreadFactor = this.toolType === "dynamite" ? 0.15 : 0.08;
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
      const speedFactor =
        this.toolType === "dynamite"
          ? 0.8 + Math.random() * 1.6
          : 0.6 + Math.random() * 1.0;

      velocity.normalize().multiplyScalar(speedFactor);

      // Add more pronounced upward bias for cartoony explosion
      velocity.y += this.toolType === "dynamite" ? 0.8 : 0.5;

      // Store particle data
      this.particles.push({
        sprite: particle,
        velocity: velocity,
        initialScale: scale,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3, // Exaggerated rotation
        // Brighter, more saturated colors for cartoony look
        color:
          this.toolType === "dynamite"
            ? new THREE.Color().setHSL(
                0.05 + Math.random() * 0.05,
                0.7 + Math.random() * 0.3, // More saturated
                0.6 + Math.random() * 0.3 // Brighter
              )
            : new THREE.Color().setHSL(
                0.08 + Math.random() * 0.04,
                0.6 + Math.random() * 0.3, // More saturated
                0.5 + Math.random() * 0.3 // Brighter
              ),
        isExplosionParticle: true,
        delay: Math.random() * 0.2, // Shorter delay for snappier start
      });

      // Add to group
      this.group.add(particle);
    }

    // Add cartoon-style explosion "POW" stars
    const starCount = this.toolType === "dynamite" ? 15 : 8;
    for (let i = 0; i < starCount; i++) {
      const starMaterial = new THREE.SpriteMaterial({
        map: this.createStarTexture(),
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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
      const elevation = Math.random() * Math.PI - Math.PI / 2;
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
        bounceFactor: 0.7 + Math.random() * 0.2, // For bouncy movement
      });

      // Add to group
      this.group.add(star);
    }

    // Add traditional explosion sparks - fewer, but brighter
    const sparkCount =
      this.toolType === "dynamite" ? this.count / 3 : this.count / 5;

    for (let i = 0; i < sparkCount; i++) {
      const sparkMaterial = new THREE.SpriteMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 1.0,
        color: this.toolType === "dynamite" ? 0xff3300 : 0xff6600, // Brighter colors
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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
      const speedFactor =
        this.toolType === "dynamite"
          ? 1.8 + Math.random() * 2.2
          : 1.5 + Math.random() * 1.8;

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
          0.9, // Very saturated
          0.7 // Brighter
        ),
        isExplosionSpark: true,
        delay: Math.random() * 0.1,
        // Add trail effect
        hasTrail: Math.random() < 0.7,
      });

      // Add to group
      this.group.add(spark);
    }
  }

  // Create a star-shaped texture for cartoon explosions
  createStarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

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
    ctx.fillStyle = "white";
    ctx.fill();

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  // Create a smoke-like texture procedurally
  createFallbackTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Create a radial gradient for a smoke-like appearance
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

    // Smoke-like gradient (white in center, transparent at edges)
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

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

      // Add resources when mining finishes
      this.addResources();

      // Stop the shovel sound if it's still playing
      if (this.toolType === "shovel" && this.shovelSoundSource) {
        this.shovelSoundSource.stop();
      }

      // Stop the fuse sound and play explosion sound for dynamite
      if (this.toolType === "dynamite") {
        if (this.fuseSoundSource) {
          this.fuseSoundSource.stop();
        }
        if (soundEnabled && explosionSoundBuffer) {
          this.playExplosionSound();
        }
      }
    }

    // Phase 2: Explosion and aftermath
    if (
      this.explosionStarted &&
      this.elapsed >= this.sparkDuration + this.explosionDuration
    ) {
      // Cleanup when animation is complete
      this.scene.remove(this.group);
      this.particles.forEach((p) => {
        if (p.sprite && p.sprite.material) {
          p.sprite.material.dispose();
        }
      });
      this.active = false;

      // When explosion is complete, restore auto-rotation if it was on before
      if (this.wasAutoRotating && !autoRotate) {
        autoRotate = true;
      }

      return;
    }

    // Create constant stream of drilling sparks when in drilling phase
    if (!this.explosionStarted && this.elapsed % 0.05 < deltaTime) {
      this.addNewDrillingSparks(3);
    }

    // Update each particle
    this.particles = this.particles.filter((p) => {
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
        const particleElapsed =
          this.elapsed - this.sparkDuration - (p.delay < 0 ? p.delay : 0);
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
        p.sprite.material.opacity =
          lifePercent > 0.7 ? 1 - (lifePercent - 0.7) / 0.3 : 1.0;

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
        const particleElapsed =
          this.elapsed - this.sparkDuration - (p.delay < 0 ? p.delay : 0);
        const lifePercent = particleElapsed / this.explosionDuration;

        // Animation curve for opacity and scale - more exaggerated
        let opacityFactor, scaleFactor;

        if (p.isExplosionSpark) {
          // Sparks fade out quickly
          opacityFactor = 1 - lifePercent * 2.5;
          if (opacityFactor < 0) opacityFactor = 0;

          // Sparks shrink slightly
          scaleFactor = 1 - lifePercent * 0.5;

          // If this spark has a trail, add trail effect
          if (p.hasTrail && particleElapsed % 0.1 < deltaTime) {
            // Create trail particle
            const trailMaterial = new THREE.SpriteMaterial({
              map: this.createFallbackTexture(),
              transparent: true,
              opacity: 0.5,
              color: p.sprite.material.color.clone(),
              depthWrite: false,
              blending: THREE.AdditiveBlending,
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
              lifespan: 0.3, // Short lifespan
            });
          }
        } else {
          // Dust particles fade more gradually but with a cartoony curve
          opacityFactor = 1 - lifePercent * lifePercent * 1.2;

          // Dust particles grow with cartoony effect
          scaleFactor = 1 + lifePercent * 3 * (1 - lifePercent); // Parabolic growth/shrink
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
          const s = p.color.getHSL({}).s - lifePercent * 0.1;
          const l = p.color.getHSL({}).l - lifePercent * 0.2;
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
        p.sprite.material.opacity = 1 - p.age / p.lifespan;

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
        blending: THREE.AdditiveBlending,
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
      velocity.add(
        new THREE.Vector3()
          .subVectors(spark.position, this.position)
          .normalize()
          .multiplyScalar(0.5)
      );

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
        isDrillingSpark: true,
      });

      // Add to group
      this.group.add(spark);
    }
  }

  addResources() {
    const resourceTypes = ["CARBON", "NICKEL", "IRON", "GOLD", "PLATINUM"];
    const randomResource =
      resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

    // Calculate the amount based on the ratio
    const baseAmount = Math.floor(Math.random() * 5) + 1;
    let amount = Math.round(baseAmount * resourceRatios[randomResource]);

    // Double the amount for dynamite
    if (this.toolType === "dynamite") {
      amount *= 2;
    }

    resources[randomResource] += amount;

    // Update the score card
    updateScoreCard();
  }
}

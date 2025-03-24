import * as THREE from './libs/three.module.js';
import { EffectComposer } from './libs/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './libs/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './libs/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from './libs/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from './libs/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from './libs/jsm/shaders/GammaCorrectionShader.js';

export function createPostProcessingEffects(scene, camera, renderer) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 16;
    composer.addPass(ssaoPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.4, 0.5, 0.85
    );
    composer.addPass(bloomPass);

    composer.addPass(new ShaderPass(GammaCorrectionShader));
    return composer;
}
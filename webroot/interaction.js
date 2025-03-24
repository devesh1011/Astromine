import * as THREE from './libs/three.module.js';
import { DustExplosion } from './dustExplosion.js';

export function setupInteraction(scene, camera, modelGroup) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let dustExplosions = [];

    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        if (intersects.length > 0) {
            const explosion = new DustExplosion(intersects[0].point, scene);
            dustExplosions.push(explosion);
        }
    });

    return dustExplosions; // For updating in main.js
}
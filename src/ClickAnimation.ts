import * as THREE from "three";
import { hsvToRgb } from "./utils";
import { random } from "./utils";

class ClickAnimation {
    groundPulse: THREE.Mesh;
    particles: THREE.Mesh[] = [];
    deleteItem = false;     // Tells main thread to dispose of object when no longer needed.

    private ringGrowthRate = 15;    
    private particleGrowthRate = 20;
    private fallRate = 100;
    private numberOfParticles = 25;
    private static sceneReference: THREE.Scene;

    constructor(mouseX: number, mouseZ: number, scene: THREE.Scene, hue: number) {
        // Get color and create material used in all click animations.
        let rgb = hsvToRgb(hue, 1, 1);
        let threeColor = new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

        let material = new THREE.MeshStandardMaterial({ color: threeColor });

        // Create ring on ground
        const torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
        this.groundPulse = new THREE.Mesh(torusGeometry, material);

        // Rotate and set position correctly
        this.groundPulse.position.set(mouseX, 5, mouseZ);
        this.groundPulse.rotateX(Math.PI / 2);

        // Particle effect in air
        const particleGeometry = new THREE.OctahedronGeometry();

        // Create particles and add them to the scene.
        for (let i = 0; i < this.numberOfParticles; i++) {
            const octahedron = new THREE.Mesh(particleGeometry, material);
            octahedron.position.set(
                mouseX + random(-60, 60),
                random(10, 110),
                mouseZ + random(-60, 60)
            );
            this.particles.push(octahedron);
            scene.add(octahedron);
        }

        scene.add(this.groundPulse);

        // Make a static reference to the existing scene.
        if (!ClickAnimation.sceneReference) {
            ClickAnimation.sceneReference = scene;
        }
    }

    private disposeObjects() {
        ClickAnimation.sceneReference.remove(this.groundPulse);
        this.groundPulse.geometry.dispose();
        (this.groundPulse.material as THREE.Material).dispose();

        this.particles.forEach((particle) => {
            ClickAnimation.sceneReference.remove(particle);
            particle.geometry.dispose();
            (particle.material as THREE.Material).dispose();
        });
    }

    // Deltatime needed to keep animation stable across different frame rates.
    animate(deltaTime: number) {
        // Once ground pule goes below ground, trigger disposal.
        if (this.groundPulse.position.y < -5) {
            this.disposeObjects();
            this.deleteItem = true;
            return;
        } else if (this.groundPulse.scale.x > 5) {
            this.groundPulse.position.y -= this.fallRate * deltaTime;
        } else {
            this.groundPulse.scale.addScalar(this.ringGrowthRate * deltaTime);
            this.particles.forEach((particle) => {
                particle.scale.addScalar(this.particleGrowthRate * deltaTime);
            });
        }
    }
}

export default ClickAnimation;

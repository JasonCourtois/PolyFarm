import * as THREE from "three";
import { hsvToRgb } from "./utils";

export default class HoverAnimation {
    private particles: THREE.Mesh[];
    private angle: number = 0;
    private orbitRadius: number = 20;
    private hues: number[] = [];
    private numberOfParticles = 4;

    constructor(scene: THREE.Scene) {
        const particleGeometry = new THREE.OctahedronGeometry();

        this.particles = [];

        // Create three particles with different colors
        for (let i = 0; i < this.numberOfParticles; i++) {
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
            });
            const particle = new THREE.Mesh(particleGeometry, material);

            particle.position.y = 20;
            particle.scale.addScalar(10);

            scene.add(particle);
            this.particles.push(particle);

            this.hues.push(0 + 90 * i);
        }
    }

    animate(mouseX: number | undefined, mouseZ: number | undefined, deltaTime: number) {
        if (mouseX === undefined || mouseZ === undefined) {
            // If mouse is off screen, hide particle effects.
            this.particles.forEach((particle) => {
                particle.visible = false;
            });
        } else {
            // Update orbit angle
            this.angle += 2.0 * deltaTime;

            // Update hue for rainbow effect
            for (let i = 0; i < this.numberOfParticles; i++) {
                this.hues[i] = (this.hues[i] + 1) % 360;
            }

            // Position each particle in orbit
            this.particles.forEach((particle, index) => {
                const angleOffset = (index * Math.PI * 2) / this.numberOfParticles; // Evenly space particles
                const currentAngle = this.angle + angleOffset;

                particle.position.x = mouseX + Math.cos(currentAngle) * this.orbitRadius;
                particle.position.z = mouseZ + Math.sin(currentAngle) * this.orbitRadius;
                particle.visible = true;

                // Add slight rotation to particles
                particle.rotation.y += 4.0 * deltaTime;

                // Apply rainbow color
                const rgb = hsvToRgb(this.hues[index], 1.0, 1.0);
                (particle.material as THREE.MeshStandardMaterial).color.setRGB(
                    rgb[0] / 255,
                    rgb[1] / 255,
                    rgb[2] / 255
                );
            });
        }
    }
}

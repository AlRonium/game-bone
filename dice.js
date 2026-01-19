import * as THREE from 'three';

export class DiceManager {
    constructor(scene, color = '#ff4757') {
        this.scene = scene;
        this.color = color;
        this.diceList = [];
        this.loader = new THREE.TextureLoader();
        this.textures = this.createDiceTextures();
    }

    createDiceTextures() {
        const textures = [];
        const SIZE = 1024; // Increased resolution for crisp detail

        const points = [
            [], // zero
            [[512, 512]], // 1
            [[256, 256], [768, 768]], // 2
            [[256, 256], [512, 512], [768, 768]], // 3
            [[256, 256], [768, 256], [256, 768], [768, 768]], // 4
            [[256, 256], [768, 256], [512, 512], [256, 768], [768, 768]], // 5
            [[256, 256], [768, 256], [256, 512], [768, 512], [256, 768], [768, 768]], // 6
        ];

        for (let i = 1; i <= 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext('2d');

            // Background - Use the selected theme color
            // If color is white, use off-white for classic look
            const isWhite = this.color.toLowerCase() === '#ffffff' || this.color.toLowerCase() === 'white';
            ctx.fillStyle = isWhite ? '#fefefe' : this.color;
            ctx.fillRect(0, 0, SIZE, SIZE);

            // Subtle edge shading for 3D look
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = SIZE * 0.05;
            ctx.strokeRect(0, 0, SIZE, SIZE);

            // Draw pips (Black for all dice for high contrast and classic feel)
            // Or white pips if the dice body is very dark
            ctx.fillStyle = isWhite ? '#111111' : '#ffffff';

            points[i].forEach(p => {
                ctx.beginPath();
                ctx.arc(p[0], p[1], SIZE * 0.08, 0, Math.PI * 2);
                ctx.fill();

                // Bevel effect inside the pip
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.arc(p[0] + 5, p[1] + 5, SIZE * 0.04, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = isWhite ? '#111111' : '#ffffff';
            });

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 16; // Max sharpness
            textures.push(texture);
        }
        return textures;
    }

    createDiceMesh() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const faceOrderMapping = [2, 5, 3, 4, 1, 6];

        const materials = faceOrderMapping.map(val => {
            return new THREE.MeshStandardMaterial({
                map: this.textures[val - 1],
                roughness: 0.1,
                metalness: 0.1,
            });
        });

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        this.scene.add(mesh);

        return mesh;
    }

    updateDiceColor(color) {
        this.color = color;
        // Regenerate textures so new dice will have the new color
        this.textures = this.createDiceTextures();
    }
}

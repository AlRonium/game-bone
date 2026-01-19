import * as THREE from 'three';
import { PhysicsWorld } from './physics.js';
import { DiceManager } from './dice.js';

class Game {
    constructor() {
        this.initThree();
        this.initPhysics();
        this.initManagers();
        this.initUI();

        this.diceCount = 1;
        this.diceColor = '#ff4757';
        this.diceElements = [];
        this.isRolling = false;
        this.history = [];

        this.animate();
        window.addEventListener('resize', () => this.onResize());
    }

    initThree() {
        this.canvas = document.querySelector('#canvas-3d');
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 10, 12);
        this.camera.lookAt(0, 0, 0);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        this.scene.add(hemisphereLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        const spotLight = new THREE.SpotLight(0xffffff, 500);
        spotLight.position.set(0, 15, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        // Ground Mesh
        const groundGeo = new THREE.PlaneGeometry(50, 50);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.1,
            metalness: 0.5
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add a grid
        const grid = new THREE.GridHelper(50, 50, 0xff4757, 0x333333);
        grid.position.y = 0.01;
        this.scene.add(grid);
    }

    initPhysics() {
        this.physics = new PhysicsWorld();
    }

    initManagers() {
        this.diceManager = new DiceManager(this.scene);
    }

    initUI() {
        this.rollBtn = document.querySelector('#roll-button');
        this.rollBtn.addEventListener('click', () => this.rollDice());

        this.resetBtn = document.querySelector('#reset-btn');
        this.resetBtn.addEventListener('click', () => this.resetDice());

        this.settingsBtn = document.querySelector('#settings-btn');
        const modal = document.querySelector('#settings-modal');
        this.settingsBtn.addEventListener('click', () => modal.classList.add('active'));

        document.querySelector('#close-settings').addEventListener('click', () => modal.classList.remove('active'));

        // Dice count controls
        document.querySelector('#inc-dice').addEventListener('click', () => {
            if (this.diceCount < 5) {
                this.diceCount++;
                document.querySelector('#dice-count').innerText = this.diceCount;
            }
        });
        document.querySelector('#dec-dice').addEventListener('click', () => {
            if (this.diceCount > 1) {
                this.diceCount--;
                document.querySelector('#dice-count').innerText = this.diceCount;
            }
        });

        // Color picking
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.diceColor = opt.dataset.color;

                // Update Dice
                this.diceManager.updateDiceColor(this.diceColor);

                // Update UI Colors
                document.documentElement.style.setProperty('--primary', this.diceColor);
                document.documentElement.style.setProperty('--accent-glow', this.diceColor + '4d');

                // Calculate contrast color for buttons
                const isLight = this.isColorLight(this.diceColor);
                const btnTextColor = isLight ? '#111111' : '#ffffff';
                document.documentElement.style.setProperty('--btn-text', btnTextColor);
            });
        });
    }

    isColorLight(color) {
        // Simple hex/rgb brightness check
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (color === 'white') {
            r = 255; g = 255; b = 255;
        } else {
            return false;
        }
        // Perceptive brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 180;
    }

    rollDice() {
        if (this.isRolling) return;

        this.resetDice();
        this.isRolling = true;
        this.rollBtn.disabled = true;

        for (let i = 0; i < this.diceCount; i++) {
            const mesh = this.diceManager.createDiceMesh();
            const body = this.physics.addDiceBody();

            // Random start position and rotation
            body.position.set((Math.random() - 0.5) * 4, 5 + i * 2, (Math.random() - 0.5) * 4);
            body.quaternion.setFromEuler(Math.random() * 10, Math.random() * 10, Math.random() * 10);

            // Apply impulse
            const force = 10 + Math.random() * 5;
            body.applyImpulse(
                new THREE.Vector3((Math.random() - 0.5) * force, force, (Math.random() - 0.5) * force),
                new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)
            );

            this.diceElements.push({ mesh, body });
        }

        // Wait for dice to stop
        setTimeout(() => this.checkResult(), 3000);
    }

    resetDice() {
        this.diceElements.forEach(d => {
            this.scene.remove(d.mesh);
            this.physics.removeDiceBody(d.body);
        });
        this.diceElements = [];
        this.isRolling = false;
        this.rollBtn.disabled = false;
        document.querySelector('#total-score .value').innerText = '0';
    }

    checkResult() {
        let total = 0;
        this.diceElements.forEach(d => {
            total += this.getDiceValue(d.mesh);
        });

        document.querySelector('#total-score .value').innerText = total;
        this.addHistory(total);
        this.isRolling = false;
        this.rollBtn.disabled = false;
    }

    getDiceValue(mesh) {
        // Find which face is pointing up
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1)
        ];

        const faceValues = [2, 5, 3, 4, 1, 6]; // Match the mapping in dice.js

        let maxDot = -1;
        let result = 1;

        directions.forEach((dir, index) => {
            const worldDir = dir.clone().applyQuaternion(mesh.quaternion);
            const dot = worldDir.dot(new THREE.Vector3(0, 1, 0));
            if (dot > maxDot) {
                maxDot = dot;
                result = faceValues[index];
            }
        });

        return result;
    }

    addHistory(value) {
        this.history.unshift(value);
        if (this.history.length > 10) this.history.pop();

        const list = document.querySelector('#history-list');
        list.innerHTML = this.history.map((val, i) => `
            <div class="history-item">
                <span class="roll-num">#${this.history.length - i}</span>
                <span class="roll-val">${val}</span>
            </div>
        `).join('');
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.physics.update();

        this.diceElements.forEach(d => {
            d.mesh.position.copy(d.body.position);
            d.mesh.quaternion.copy(d.body.quaternion);
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();

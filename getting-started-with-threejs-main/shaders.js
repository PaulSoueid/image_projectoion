import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

// Async texture loader using Promise
function loadTextureAsync(url) {
    return new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(url, resolve, undefined, reject);
    });
}

async function init() {
    // Setup scene, camera, and renderer
    const scene = new THREE.Scene();

    const screenAspect = window.innerWidth / window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, screenAspect, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2();

    // Load textures asynchronously
    const texture = await loadTextureAsync('resources/20230521_164044.jpg');
    const imageWidth = texture.image.width;
    const imageHeight = texture.image.height;
    const grid = await loadTextureAsync('resources/grid.jpeg');
    const gridWidth = grid.image.width;
    const gridHeight = grid.image.height;
    console.log("dimensions = (%d, %d)", imageWidth, imageHeight);

    const imageAspect = imageWidth / imageHeight;
    console.log("image aspect : %f", imageAspect);

    let vertexWidth = 2.0;
    let vertexHeight = 2.0;

    if (screenAspect > imageAspect) {
        vertexWidth = 2.0 * imageAspect / screenAspect;
        console.log("vertexWidth : %f", vertexWidth);
    } else {
        vertexHeight = 2.0 * screenAspect / imageAspect;
        console.log("vertexHeight : %f", vertexHeight);
    }

    const uniforms = {
        uTexture: { value: texture },
        uTexAsp: { value: imageAspect },
        uGrid: { value: grid },
        uGridScale: { value: 0.1 },
        uGridAsp: { value: 1.0 },
        u_mouse: { value: new THREE.Vector2(0, 0) },
    };

    // Mouse move
    renderer.domElement.addEventListener('mousemove', (event) => {
        let u = ((event.offsetX / window.innerWidth) - (1.0 - (0.5 * vertexWidth)) / 2.0) / (0.5 * vertexWidth);
        let v = ((1 - (event.offsetY / window.innerHeight)) / (0.5 * vertexHeight) - (1.0 - 0.5 * vertexHeight) / 2.0) / (0.5 * vertexHeight);
        uniforms.u_mouse.value.x = u;
        uniforms.u_mouse.value.y = v;
    });

    // Shaders
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D uTexture;
        uniform float uTexAsp;
        uniform sampler2D uGrid;
        uniform float uGridAsp;
        uniform float uGridScale;
        uniform vec2 u_mouse;
        varying vec2 vUv;
        void main() {
            vec2 grid_uv = 10.0 * (vUv - (u_mouse));
            vec4 textureColor = texture2D(uTexture, vUv);
            vec4 gridColor = texture2D(uGrid, grid_uv);
            vec4 myColor = textureColor;
            if(grid_uv.x >= 0.0 && grid_uv.y >=0.0 && grid_uv.x < 1.0 && grid_uv.y < 1.0){
                myColor = gridColor;
            }
            gl_FragColor = myColor;
        }
    `;

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    const geometry = new THREE.PlaneGeometry(vertexWidth, vertexHeight);
    const mesh = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(mesh);

    camera.position.z = 3;

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
}

init();
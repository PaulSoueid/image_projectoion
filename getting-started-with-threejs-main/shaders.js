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
    const depth = await loadTextureAsync('resources/depth.png');
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
        uDepth: { value: depth },
        uGrid: { value: grid },
        uGridScale: { value: 1.0 },
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
        uniform sampler2D uDepth;
        uniform float uGridAsp;
        uniform float uGridScale;
        uniform vec2 u_mouse;
        varying vec2 vUv;
        void main() {
            vec4 textureColor = texture2D(uTexture, vUv);
            vec4 depth = texture2D(uDepth, vUv);
            depth.xy = vec2(0.5)/(depth.xy + vec2(0.0001)) + vec2(1.0);
            vec2 xy_mouse = u_mouse * depth.xy;
            vec2 xy_grid = uGridScale * vec2(uTexAsp, 1.0) * (vUv - u_mouse) * depth.xy + vec2(0.5, 0.5);
            vec4 gridColor = texture2D(uGrid, xy_grid);
            if(xy_grid.x >= 0.0 && xy_grid.y >=0.0 && xy_grid.x < 1.0 && xy_grid.y < 1.0){
                textureColor = gridColor;
            }
            gl_FragColor = textureColor;
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
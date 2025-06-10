import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js"

// Setup scene, camera, and renderer
const scene = new THREE.Scene();

const screenAspect = window.innerWidth / window.innerHeight;

const camera = new THREE.PerspectiveCamera(60, screenAspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const mouse = new THREE.Vector2();

// get the right aspect ratio on screen
//const imageWidth = 3468;
//const imageheight = 4624;
let imageWidth = 3000;
let imageHeight = 500;
console.log("dimentions = (%d, %d)", imageWidth, imageHeight);
const imageAspect = imageWidth / imageHeight;
console.log("image aspect : %f", imageAspect)

let vertexWidth = 2.0;
let vertexHeight = 2.0;

if (screenAspect > imageAspect) { //full h, scaled w
    vertexWidth = 2.0*imageAspect/screenAspect;
    console.log("vertexWidth : %f", vertexWidth);
}
else {
    vertexHeight = 2.0*screenAspect/imageAspect;
    console.log("vertexHeight : %f", vertexHeight);
}

//load image
const texture = new THREE.TextureLoader().load('resources/20230521_164044.jpg',
    function (texture) {
        imageWidth = texture.image.width;
        imageHeight = texture.image.height;
        console.log("dimentions = (%d, %d)", texWidth, texHeight);
    }
);

const grid = new THREE.TextureLoader().load('resources/grid.jpeg');
const uniforms = {
  uTexture: { value: texture },
  uTexAsp: { value: imageAspect },
  uGrid: { value: grid },
  uGridScale: { value: 0.1 },
  uGridAsp: { value: 1.0 },
  u_mouse: { value: new THREE.Vector2(0, 0) },
};

//mouse
renderer.domElement.addEventListener('mousemove', (event) => {
    let u = ( (event.offsetX / window.innerWidth) - (1.0 - (0.5*vertexWidth))/2.0 ) / (0.5*vertexWidth);
    let v = ( (1 - (event.offsetY / window.innerHeight)) / (0.5*vertexHeight) - (1.0 - 0.5*vertexHeight)/2.0 ) / (0.5*vertexHeight);
    //console.log("(u, v) = (%f, %f)", u, v);
    uniforms.u_mouse.value.x = u;
    uniforms.u_mouse.value.y = v;
});

// Define shaders
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
        vec2 grid_uv = 10.0*(vUv - (u_mouse + vec2(0.5, 0.5)));
        vec4 textureColor = texture2D(uTexture, vUv);
        vec4 gridColor = texture2D(uGrid, grid_uv);
        vec4 myColor = textureColor;
        gl_FragColor = vec4(u_mouse, 0.0, 1.0);
    }
`;

// Create shader material
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});

// Create a geometry (e.g., a box) and apply the shader material
const geometry = new THREE.PlaneGeometry(vertexWidth, vertexHeight);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

// Position the camera
camera.position.z = 3;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
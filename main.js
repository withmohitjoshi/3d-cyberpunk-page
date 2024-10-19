import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import gsap from "gsap";
import LocomotiveScroll from "locomotive-scroll";

new LocomotiveScroll();

// Initialize constants
const canvas = document.querySelector("#canvas");
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Initialize loaders
const loader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

// camera for my world
const scene = new THREE.Scene();
// creating a scene (world)
const camera = new THREE.PerspectiveCamera(
  40,
  windowWidth / windowHeight,
  0.1,
  100
);
camera.position.z = 3.5;

// Initialize renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(windowWidth, windowHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// Initialize EffectComposer
const composer = new EffectComposer(renderer);

// Add RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add RGBShiftShader
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.003;
composer.addPass(rgbShiftPass);

// loading the hdr which will be our world surrounding lights (360 deg light)
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr",
  (texture) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  }
);

// loading the modal that we want to show on the canvas
let model;
loader.load(
  "./modal/DamagedHelmet.gltf",
  (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.position.set(0, 0, 0);
    updateModelSize(); // Initial size update
  },
  () => console.log("Modal is getting loaded..."),
  (error) => console.error("An error happened", error)
);

// Function to update model size based on window dimensions
function updateModelSize() {
  if (model) {
    const minSize = 0.5; // Minimum size for mobile screens
    const maxSize = 1.0; // Maximum size (original size)
    const aspectRatio = window.innerWidth / window.innerHeight;
    const size = Math.max(minSize, Math.min(maxSize, aspectRatio * 0.5));
    model.scale.set(size, size, size);
  }
}

// add event listener for modal rotation on mousemove
window.addEventListener("mousemove", onMouseMove);
function onMouseMove(e) {
  if (model) {
    const rotationX = (e.clientX / windowWidth - 0.5) * (Math.PI * 0.1);
    const rotationY = (e.clientY / windowHeight - 0.5) * (Math.PI * 0.1);
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.9,
      ease: "power2.out",
    });
  }
}

// add event listener for window resize to rerender the world
window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer and composer size
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  // Update model size
  updateModelSize();
}

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

animate();

import "./style.css";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
// import { mod } from "three/webgpu";
import gsap from "gsap";
import LocomotiveScroll from "locomotive-scroll";

const locomotiveScroll = new LocomotiveScroll();

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
camera.position.z = 3.5;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// PMREM Generator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model;

// Load HDR environment map
new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    // scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      "./DamagedHelmet.gltf",
      (gltf) => {
        model = gltf.scene;
        scene.add(model);
        console.log("Model loaded successfully:", gltf);
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the model:", error);
      }
    );
  },
  undefined,
  (error) => {
    console.error("An error occurred while loading the HDR texture:", error);
  }
);

window.addEventListener("mousemove", (e) => {
  if (model) {
    // Calculate rotation values based on mouse position
    const rotationX = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.12;
    const rotationY = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.12;

    // Animate the model's rotation using GSAP
    gsap.to(model.rotation, {
      x: rotationX,
      y: rotationY,
      duration: 0.9,
      ease: "power2.out",
    });
  }
});
// Orbit Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

// Postprocessing Setup
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);

// RenderPass for rendering the scene
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// RGBShiftShader for RGB shift effect
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.003; // Adjust intensity of the RGB shift
composer.addPass(rgbShiftPass);

// Handle Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  // controls.update();
  composer.render(); // Use composer for rendering with postprocessing
}

animate();

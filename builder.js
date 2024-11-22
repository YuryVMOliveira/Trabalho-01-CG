import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    setDefaultMaterial,
    InfoBox,
    onWindowResize,
    createGroundPlaneXZ
} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 10, 10)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);


//define cores e cria vetor dos voxels
let voxels = [];
let currentColor = "LimeGreen"; // Cor inicial (verde)
let colors = ["LimeGreen", "SandyBrown", "BurlyWood", "ForestGreen", "SpringGreen"];
let colorIndex = 0;

showInformation();
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
// var axesHelper = new THREE.AxesHelper(12);
// scene.add(axesHelper);

// create the ground plane
let plane = createGroundPlaneXZ(10, 10)
scene.add(plane);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: "red", wireframe: true });
var cube = new THREE.Mesh(cubeGeometry, wireframeMaterial);
// position the cube
cube.position.set(0.5, 0.5, 0.5);
// add the cube to the scene
scene.add(cube);
function createGrid(size) {
    const gridHelper = new THREE.GridHelper(size, size, 0x0000ff, 0x808080);
    scene.add(gridHelper);
}

createGrid(10);
render();

//criar um voxel
function addVoxel(x, y, z) {

    //verifica se ja esta ocupada
    let occupied = false;
    for (let i = voxels.length - 1; i >= 0; i--) {
        const t = voxels[i];
        if (t.position.x === x && t.position.y === y && t.position.z === z) {
            occupied=true;
        }
    }

    if (occupied == false) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
    const voxelMaterial = new THREE.MeshStandardMaterial({
        color: currentColor,
        transparent: true,
        opacity: 0.98, 
        roughness: 0.5, 
        metalness: 0.1 
    });
    const voxel = new THREE.Mesh(geometry, voxelMaterial);

    voxel.position.set(x, y, z);
    scene.add(voxel);
    voxels.push(voxel);
    }
    
}
//remover um voxel
function removeVoxel(x, y, z) {
    for (let i = voxels.length - 1; i >= 0; i--) {
        const voxel = voxels[i];

        // Verifica se a posição eh valida
        if (voxel.position.x === x && voxel.position.y === y && voxel.position.z === z) {
            scene.remove(voxel); 
            voxels.splice(i, 1); 
            break; 
        }
    }
}
function keyboardUpdate() {

    keyboard.update();
    if (keyboard.down("left") && cube.position.x > -4) cube.translateX(-1);
    if (keyboard.down("right") && cube.position.x < 4) cube.translateX(1);
    if (keyboard.down("down") && cube.position.z < 4) cube.translateZ(1);
    if (keyboard.down("up") && cube.position.z > -4) cube.translateZ(-1);
    if (keyboard.down("W") && cube.position.y < 10) cube.translateY(1);
    if (keyboard.down("S") && cube.position.y > 1) cube.translateY(-1);
    if (keyboard.down("Q")) addVoxel(cube.position.x, cube.position.y, cube.position.z);
    if (keyboard.down("E")) removeVoxel(cube.position.x, cube.position.y, cube.position.z); 

    if (keyboard.down(".")) {
        colorIndex = (colorIndex + 1) % colors.length; // Próxima cor
        currentColor = colors[colorIndex];
        cube.material.color.set(currentColor);
    }
    if (keyboard.down(",")) {
        colorIndex = (colorIndex - 1 + colors.length) % colors.length; // Cor anterior
        currentColor = colors[colorIndex];
        cube.material.color.set(currentColor); 
    }
}
//Apresentar informacoes
function showInformation() {
    var controls = new InfoBox();
    controls.add("Builder");
    controls.addParagraph();
    controls.add("Press arrow keys to move the frame in X and Z axis");
    controls.add("Press WS to move on the Y axis");
    controls.add("Press Q to Add a voxel")
    controls.add("Press E to Remove a voxel")
    controls.add("Press . to next color")
    controls.add("Press . to previous color")
    controls.show();
}

function render() {
    requestAnimationFrame(render); // Show events
    keyboardUpdate();
    renderer.render(scene, camera) // Render scene
}

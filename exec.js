import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {PointerLockControls} from '../build/jsm/controls/PointerLockControls.js';
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
import GUI from '../libs/util/dat.gui.module.js';

let isTyping = false;
let scene, renderer, cameraOrbit, material, light, orbit; // Initial variables 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer

cameraOrbit = initCamera(new THREE.Vector3(0, 20, 35)); // Init camera in this position
const cameraFirstPerson = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
cameraFirstPerson.position.set(0, 2, 0); // Inicialmente posicionada em cima do cubo
cameraFirstPerson.lookAt(new THREE.Vector3(0, 2, 0));
scene.add(cameraFirstPerson);

let activeCamera = cameraOrbit;

const controls = new PointerLockControls(cameraFirstPerson, renderer.domElement);

// Travar o cursor ao clicar na tela (nativo no PointerLockControls)
renderer.domElement.addEventListener('click', () => {
    controls.lock();
});

// Adicionar a câmera controlada à cena
scene.add(controls.getObject());

function updateFirstPersonCamera() {
    cameraFirstPerson.position.set(
        cube.position.x,
        cube.position.y + 0.5, // Altura da câmera acima do cubo
        cube.position.z
    );
    cameraFirstPerson.lookAt(
        cube.position.x + Math.sin(cube.rotation.y),
        cube.position.y + 0.5,
        cube.position.z + Math.cos(cube.rotation.y)
    );
}

material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(cameraOrbit, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(cameraOrbit, renderer) }, false);


//define cores e cria vetor dos voxels
let voxels = [];
let currentColor = "LimeGreen"; // Cor inicial (verde)
let colors = ["LimeGreen", "SandyBrown", "BurlyWood", "ForestGreen", "SaddleBrown"];
let colorIndex = 0;

// Criar elementos de interface

criampapa3d();

function buildInterface() {
    var controls = new function () {
        this.fileName = 'voxels.txt';

        this.saveVoxels = function () {
            saveVoxels(this.fileName);
        };

        this.loadVoxels = function () {
            loadVoxelsCord(this.fileName,cube.position.x,cube.position.y,cube.position.z);
        };
    };

    // GUI interface
    var gui = new GUI();
    const fileNameController = gui.add(controls, 'fileName').name("Nome do Arquivo");

    // Adiciona eventos de foco/desfoco para rastrear interação com o campo
    const inputElement = fileNameController.domElement.querySelector('input');
    if (inputElement) {
        inputElement.addEventListener('focus', () => { isTyping = true; });
        inputElement.addEventListener('blur', () => { isTyping = false; });
    }

    gui.add(controls, 'saveVoxels').name("Salvar");
    gui.add(controls, 'loadVoxels').name("Carregar");
}

// Função para salvar o estado dos voxels
function saveVoxels(fileName) {
    let voxelData = '';

    voxels.forEach(voxel => {
        const { x, y, z } = voxel.position;
        const color = voxel.material.color.getHexString(); // Salva a cor como string hexadecimal
        voxelData += `${x},${y},${z},#${color}\n`; // Adiciona o prefixo '#' para a cor
    });

    const blob = new Blob([voxelData], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName || 'voxels.txt';
    link.click();
}

// Função para carregar o estado dos voxels
function loadVoxels(fileName) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const lines = event.target.result.split('\n');
            lines.forEach(line => {
                if (line.trim() !== '') {
                    const [x, y, z, color] = line.split(',');
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const voxelMaterial = new THREE.MeshStandardMaterial({
                        color: color.trim(), // Aplica a cor diretamente como string hexadecimal
                        transparent: true,
                        opacity: 0.98,
                        roughness: 0.5,
                        metalness: 0.1
                    });
                    const voxel = new THREE.Mesh(geometry, voxelMaterial);
                    voxel.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                    scene.add(voxel);
                    voxels.push(voxel);
                }
            });
        };
        reader.readAsText(file);
    };
    input.click();
}


function loadVoxelsCord(fileName, centerX = 0, centerY = 0, centerZ = 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const lines = event.target.result.split('\n');
            lines.forEach(line => {
                if (line.trim() !== '') {
                    const [x, y, z, color] = line.split(',');
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const voxelMaterial = new THREE.MeshStandardMaterial({
                        color: color.trim(), // Aplica a cor diretamente como string hexadecimal
                        transparent: true,
                        opacity: 0.98,
                        roughness: 0.5,
                        metalness: 0.1
                    });
                    const voxel = new THREE.Mesh(geometry, voxelMaterial);
                    voxel.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                    scene.add(voxel);
                    voxels.push(voxel);
                }
            });
        };
        reader.readAsText(file);
    };
    input.click();
}


showInformation();
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
// var axesHelper = new THREE.AxesHelper(12);
// scene.add(axesHelper);

// create the ground plane
let plane = createGroundPlaneXZ(35, 35);
scene.add(plane);




// create a cube
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
//const wireframeMaterial = new THREE.MeshBasicMaterial({ color: "LimeGreen", wireframe: true });
let cubeMaterial = setDefaultMaterial("Brown")
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// position the cube
cube.position.set(0, 1.5, 0);
// add the cube to the scene
scene.add(cube);
function createGrid(size) {
    const gridHelper = new THREE.GridHelper(size, size, 0x0000ff, 0x808080);
    scene.add(gridHelper);
}

createGrid(35);
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
function addVoxelColor(x, y, z, color) {

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
        color: color,
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

    if (isTyping) return;

    keyboard.update();
    if (keyboard.down("left") && cube.position.x > -18) cube.translateX(-1);
    if (keyboard.down("right") && cube.position.x < 18) cube.translateX(1);
    if (keyboard.down("down") && cube.position.z < 18) cube.translateZ(1);
    if (keyboard.down("up") && cube.position.z > -18) cube.translateZ(-1);
    if (keyboard.down("pageup") && cube.position.y < 18) cube.translateY(1);
    if (keyboard.down("pagedown") && cube.position.y > 1) cube.translateY(-1);
  
    if (keyboard.down("C")) {
        activeCamera = activeCamera === cameraOrbit ? cameraFirstPerson : cameraOrbit;
    }

    
}
//Apresentar informacoes
function showInformation() {
    var controls = new InfoBox();
    controls.add("Execução");
    controls.addParagraph();
    controls.add("Press arrow keys to move the frame in X and Z axis");
    controls.add("Press PageUp/PageDown to move on the Y axis");
    controls.add("Press C to change camera")
    controls.addParagraph();
    controls.show();
}

function render() {
    requestAnimationFrame(render); // Show events

    if (activeCamera === cameraFirstPerson) {
        updateFirstPersonCamera();
    }

    keyboardUpdate();
    renderer.render(scene, activeCamera) // Render scene
}

function botaCubo(x, y, z, corDoCubo) {
    const geometria = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: corDoCubo });
    const cubo = new THREE.Mesh(geometria, material);
    cubo.position.set(x, y, z);
    scene.add(cubo); // Adiciona o cubo na cena
}
function criampapa3d() {
    fetch('mapa_final.txt')
        .then(response => {
            return response.text();
        })
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                if (line.trim() !== '') {
                    const [x, y, z, color] = line.split(',');
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const voxelMaterial = new THREE.MeshStandardMaterial({
                        color: color.trim(), // Aplica a cor diretamente como string hexadecimal
                        transparent: true,
                        opacity: 0.98,
                        roughness: 0.5,
                        metalness: 0.1
                    });
                    const voxel = new THREE.Mesh(geometry, voxelMaterial);
                    voxel.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                    scene.add(voxel);
                    voxels.push(voxel);
                }
            });
        })
    
}

buildInterface();


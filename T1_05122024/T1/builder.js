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
import GUI from '../libs/util/dat.gui.module.js';


let scene, renderer, camera, material, light, orbit; // Initial variables 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 10, 10)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
let spheres = []; // Array para armazenar as esferas
// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);


//define cores e cria vetor dos voxels
let voxels = [];
let currentColor = "LimeGreen"; // Cor inicial (verde)
let colors = ["LimeGreen", "SandyBrown", "BurlyWood", "ForestGreen", "SaddleBrown"];
let colorIndex = 0;

// Criar elementos de interface
function buildInterface() {
    var controls = new function () {
        this.fileName = 'voxels.txt';

        this.saveVoxels = function () {
            saveVoxels(this.fileName);
        };

        this.loadVoxels = function () {
            loadVoxels(this.fileName);
        };
    };

    // GUI interface
    var gui = new GUI();
    gui.add(controls, 'fileName').name("Nome do Arquivo");
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

showInformation();
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
// var axesHelper = new THREE.AxesHelper(12);
// scene.add(axesHelper);

// create the ground plane
let plane = createGroundPlaneXZ(11, 11);
scene.add(plane);

// Adicionar linhas azuis no centro do plano
const materialLine = new THREE.LineBasicMaterial({ color: 0x0000ff });
const points = [];

// Linha horizontal
points.push(new THREE.Vector3(-5.5, 0.01, 0));
points.push(new THREE.Vector3(5.5, 0.01, 0));

// Linha vertical
points.push(new THREE.Vector3(0, 0.01, -5.5));
points.push(new THREE.Vector3(0, 0.01, 5.5));

const geometryLine = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.LineSegments(geometryLine, materialLine);
scene.add(line);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: "LimeGreen", wireframe: true });
var cube = new THREE.Mesh(cubeGeometry, wireframeMaterial);
// position the cube
cube.position.set(0, 0.5, 0);
// add the cube to the scene
scene.add(cube);
function createGrid(size) {
    const gridHelper = new THREE.GridHelper(size, size, 0x0000ff, 0x808080);
    scene.add(gridHelper);
}

createGrid(11);
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
    if (keyboard.down("left") && cube.position.x > -5) cube.translateX(-1);
    if (keyboard.down("right") && cube.position.x < 5) cube.translateX(1);
    if (keyboard.down("down") && cube.position.z < 5) cube.translateZ(1);
    if (keyboard.down("up") && cube.position.z > -5) cube.translateZ(-1);
    if (keyboard.down("pageup") && cube.position.y < 11) cube.translateY(1);
    if (keyboard.down("pagedown") && cube.position.y > 1) cube.translateY(-1);
    if (keyboard.down("Q")) addVoxel(cube.position.x, cube.position.y, cube.position.z);
    if (keyboard.down("E")) removeVoxel(cube.position.x, cube.position.y, cube.position.z); 

    if (keyboard.down(".")) {
        colorIndex = (colorIndex + 1) % colors.length; // Próxima cor
        currentColor = colors[colorIndex];
        cube.material.color.set(currentColor);
        // Atualiza a cor das esferas
        spheres.forEach(sphere => {
            sphere.material.color.set(currentColor);
        });
    }
    if (keyboard.down(",")) {
        colorIndex = (colorIndex - 1 + colors.length) % colors.length; // Cor anterior
        currentColor = colors[colorIndex];
        cube.material.color.set(currentColor);
        // Atualiza a cor das esferas 
        spheres.forEach(sphere => {
            sphere.material.color.set(currentColor);
        });
    }

    // Limpa as esferas existentes
    clearSpheres();

    // Verifica se o cubo está acima da posição y = 0
    if (cube.position.y > 0) {
        for (let y = cube.position.y - 1; y >= 0; y--) {
            addSphere(cube.position.x, y, cube.position.z);
        }
    }
}

// Função para adicionar uma esfera com a cor atual do cubo
function addSphere(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32); // Esfera com diâmetro 0.2
    const material = new THREE.MeshBasicMaterial({ color: currentColor }); // Usa a cor atual do cubo
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);
    spheres.push(sphere); // Armazena a esfera no array
}

// Função para limpar as esferas
function clearSpheres() {
    spheres.forEach(sphere => {
        scene.remove(sphere); // Remove a esfera da cena
    });
    spheres = []; // Limpa o array de esferas
}

//Apresentar informacoes
function showInformation() {
    var controls = new InfoBox();
    controls.add("Builder");
    controls.addParagraph();
    controls.add("Press arrow keys to move the frame in X and Z axis");
    controls.add("Press PageUp/PageDown to move on the Y axis");
    controls.add("Press Q to Add a voxel");
    controls.add("Press E to Remove a voxel");
    controls.add("Press . to next color");
    controls.add("Press , to previous color");
    controls.addParagraph();
    controls.add("Nome do arquivo:");
    controls.show();
}

function render() {
    requestAnimationFrame(render); // Show events
    keyboardUpdate();
    renderer.render(scene, camera) // Render scene
}

buildInterface();

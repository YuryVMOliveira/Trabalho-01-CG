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
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';

let isTyping = false;
let voxels = [];
var keyboard = new KeyboardState();
let scene, renderer, cameraOrbit, material, light, orbit; // Initial variables 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer



cameraOrbit = initCamera(new THREE.Vector3(0, 20, 35)); // Init camera in this position
const cameraFirstPerson = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
cameraFirstPerson.position.set(0, 2, 0); // Ajusta a posição inicial da câmera
scene.add(cameraFirstPerson);

let activeCamera = cameraFirstPerson; // Define a câmera em primeira pessoa como padrão

// Adiciona controles de bloqueio de ponteiro para a câmera em primeira pessoa
const controls = new PointerLockControls(cameraFirstPerson, document.body);

document.addEventListener('click', () => {
    if (activeCamera === cameraFirstPerson) { // Verifica se a câmera ativa é a de primeira pessoa
        controls.lock();
    }
}, false);

controls.addEventListener('lock', () => {
    if (activeCamera === cameraFirstPerson) { // Apenas executa ações se for a câmera ativa
        console.log('Pointer locked');
    }
});

controls.addEventListener('unlock', () => {
    if (activeCamera === cameraFirstPerson) { // Apenas executa ações se for a câmera ativa
        console.log('Pointer unlocked');
    }
});


material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(cameraOrbit, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(cameraOrbit, renderer) }, false);

// create the ground plane
let plane = createGroundPlaneXZ(35, 35);
scene.add(plane);

function createGrid(size) {
    const gridHelper = new THREE.GridHelper(size, size, 0x0000ff, 0x808080);
    scene.add(gridHelper);
}

function keyboardUpdate() {
    if (isTyping) return;

    keyboard.update();
    const moveSpeed = 0.02;
    const direction = new THREE.Vector3();

    if (activeCamera === cameraFirstPerson) {
        if (keyboard.pressed("up")) {
            direction.z = -moveSpeed;
            //activeCamera.translateZ(-1);
        }
        if (keyboard.pressed("down")) {
            direction.z = moveSpeed;
            //activeCamera.translateZ(1);
        }
        if (keyboard.pressed("left")) {
            direction.x = -moveSpeed;
            //activeCamera.translateX(-1);
        }
        if (keyboard.pressed("right")) {
            direction.x = moveSpeed;
            //activeCamera.translateX(1);
        }

        direction.applyQuaternion(cameraFirstPerson.quaternion);
        direction.y = 0; // Ignora o movimento no eixo Y
        //direction.normalize(); // Normaliza o vetor para manter a velocidade constante
        activeCamera.position.add(direction);
    }

    if (keyboard.down("C")) {
        activeCamera = activeCamera === cameraOrbit ? cameraFirstPerson : cameraOrbit;
    }
}
//Apresentar informacoes
function showInformation() {
    var controls = new InfoBox();
    controls.add("Execução");
    controls.addParagraph();
    controls.add("Press arrow keys to move the camera in X and Z axis");
    controls.add("Press PageUp/PageDown to move on the Y axis");
    controls.add("Press C to change camera")
    controls.addParagraph();
    controls.show();
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

function render() {
    requestAnimationFrame(render); // Show events

    keyboardUpdate();
    renderer.render(scene, activeCamera); // Render scene
}

criampapa3d();
showInformation();
createGrid(35);
render();

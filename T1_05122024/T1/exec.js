import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    InfoBox,
    onWindowResize,
} from "../libs/util/util.js";
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import { ProceduralGenerator } from './proceduralGenerator.js';
import { GUI } from '../build/jsm/libs/lil-gui.module.min.js';
import Stats from '../build/jsm/libs/stats.module.js';

let isTyping = false;
let keyboard = new KeyboardState();
let scene, renderer, cameraOrbit, light, orbit;
let stats;
let activeCamera;

function initStats() {
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';
    document.body.appendChild(stats.domElement);
    return stats;
}

scene = new THREE.Scene();
renderer = initRenderer();
scene.fog = new THREE.Fog(0x777777, 1, 100);

cameraOrbit = initCamera(new THREE.Vector3(0, 400, 400));
cameraOrbit.lookAt(new THREE.Vector3(0, 0, 0));
cameraOrbit.far = 2000;
cameraOrbit.updateProjectionMatrix();

const cameraTop = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
cameraTop.position.set(0, 800, 0);
cameraTop.lookAt(new THREE.Vector3(0, 0, 0));
cameraTop.up.set(0, 0, -1);
scene.add(cameraTop);

const cameraFirstPerson = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cameraFirstPerson.position.set(0, 30, 0);
cameraFirstPerson.lookAt(new THREE.Vector3(50, 30, 50));
cameraFirstPerson.far = 2000;
cameraFirstPerson.updateProjectionMatrix();
scene.add(cameraFirstPerson);

let cameraIndex = 0;
const cameras = [cameraFirstPerson, cameraOrbit, cameraTop];
activeCamera = cameraFirstPerson;

const controls = new PointerLockControls(cameraFirstPerson, document.body);

document.addEventListener('click', () => {
    if (activeCamera === cameraFirstPerson) {
        controls.lock();
    }
}, false);

light = initDefaultBasicLight(scene);
orbit = new OrbitControls(cameraOrbit, renderer.domElement);

window.addEventListener('resize', function () { onWindowResize(cameraOrbit, renderer) }, false);

function createGrid(size) {
    const gridHelper = new THREE.GridHelper(size, Math.floor(size/10), 0x0000ff, 0x808080);
    scene.add(gridHelper);
}

function keyboardUpdate() {
    if (isTyping) return;

    keyboard.update();
    const moveSpeed = 0.5;
    const direction = new THREE.Vector3();

    if (keyboard.down("C")) {
        cameraIndex = (cameraIndex + 1) % cameras.length;
        activeCamera = cameras[cameraIndex];
    }

    if (activeCamera === cameraFirstPerson) {
        if (keyboard.pressed("up")) direction.z = -moveSpeed;
        if (keyboard.pressed("down")) direction.z = moveSpeed;
        if (keyboard.pressed("left")) direction.x = -moveSpeed;
        if (keyboard.pressed("right")) direction.x = moveSpeed;
        if (keyboard.pressed("space")) activeCamera.position.y += moveSpeed;
        if (keyboard.pressed("shift")) activeCamera.position.y -= moveSpeed;

        direction.applyQuaternion(cameraFirstPerson.quaternion);
        direction.y = 0;
        activeCamera.position.add(direction);
    }
}

async function criampapa3d() {
    const generator = new ProceduralGenerator();
    await generator.initialize();
    
    const generatedVoxels = await generator.generateMap();
    if (!generatedVoxels || !Array.isArray(generatedVoxels)) {
        console.error('Erro: Voxels não foram gerados corretamente');
        return;
    }
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const voxelsByTypeAndColor = {};
    
    generatedVoxels.forEach(voxel => {
        const key = `${voxel.type}_${voxel.color}`;
        if (!voxelsByTypeAndColor[key]) {
            voxelsByTypeAndColor[key] = [];
        }
        voxelsByTypeAndColor[key].push(voxel);
    });

    for (const [key, typeVoxels] of Object.entries(voxelsByTypeAndColor)) {
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(typeVoxels[0].color),
            transparent: typeVoxels[0].transparent,
            opacity: typeVoxels[0].transparent ? 0.6 : 1
        });

        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            material,
            typeVoxels.length
        );

        typeVoxels.forEach((voxel, index) => {
            const matrix = new THREE.Matrix4();
            matrix.setPosition(voxel.x, voxel.y, voxel.z);
            instancedMesh.setMatrixAt(index, matrix);
        });

        scene.add(instancedMesh);
    }
}

function render() {
    stats.begin();
    requestAnimationFrame(render);
    keyboardUpdate();
    renderer.render(scene, activeCamera);
    stats.end();
}

function createGUI() {
    const gui = new GUI();
    const params = { visibilidade: 100 };
    gui.add(params, 'visibilidade', 10, 1000)
        .name('Visibilidade')
        .onChange(function(value) {
            scene.fog.far = value;
            scene.fog.near = value * 0.05;
        });
}

function showInformation() {
    var controls = new InfoBox();
    controls.add("Controles");
    controls.addParagraph();
    controls.add("Use as setas para mover a câmera");
    controls.add("Pressione C para alternar entre câmeras (Primeira Pessoa / Orbital / Aérea)");
    controls.add("Use ESPAÇO para subir");
    controls.add("Use SHIFT para descer");
    controls.add("Use o slider de Visibilidade para ajustar o fog");
    controls.addParagraph();
    controls.show();
}

async function init() {
    initStats();
    await criampapa3d();
    showInformation();
    createGrid(500);
    createGUI();
    render();
}

init();

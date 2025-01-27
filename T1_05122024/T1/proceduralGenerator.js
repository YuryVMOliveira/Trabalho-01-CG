import * as THREE from 'three';

export class ProceduralGenerator {
    constructor() {
        this.blocks = null;
        this.chunkSize = 200;
        this.chunkHeight = 20;
        this.waterLevel = 3;
        this.minHeight = 0.5;
        this.maxHeight = 19.5;
        this.gradients = this.generateGradients();
        this.heightmap = null;
        this.size = 200;  // Tamanho fixo do mapa
        this.treeTemplates = ['arvore.txt', 'arvore_1.txt', 'arvore_2.txt', 'arvore_3.txt'];
        this.trees = [];  // Armazenar os dados das árvores
        this.treeData = new Map();  // Cache para os templates de árvores
    }

    async initialize() {
        try {
            const response = await fetch('./blocks.json');
            this.blocks = await response.json();
            return true;
        } catch (error) {
            console.error('Erro ao carregar blocks.json:', error);
            return false;
        }
    }

    // Gera gradientes aleatórios para o ruído de Perlin
    generateGradients() {
        const gradients = [];
        for (let i = 0; i < 256; i++) {
            const angle = Math.random() * Math.PI * 2;
            gradients.push([Math.cos(angle), Math.sin(angle)]);
        }
        return gradients;
    }

    // Função de suavização para Perlin
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // Interpolação linear
    lerp(a, b, t) {
        return a + t * (b - a);
    }

    // Produto escalar para Perlin
    dot(gradient, x, y) {
        return gradient[0] * x + gradient[1] * y;
    }

    // Implementação de Perlin Noise
    perlin(x, y) {
        // Encontrar coordenadas da célula
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        
        // Coordenadas relativas dentro da célula
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // Gradientes nos vértices da célula
        const g00 = this.gradients[((xi) + (yi)) % 256];
        const g10 = this.gradients[((xi + 1) + (yi)) % 256];
        const g01 = this.gradients[((xi) + (yi + 1)) % 256];
        const g11 = this.gradients[((xi + 1) + (yi + 1)) % 256];
        
        // Calcular produtos escalares
        const n00 = this.dot(g00, xf, yf);
        const n10 = this.dot(g10, xf - 1, yf);
        const n01 = this.dot(g01, xf, yf - 1);
        const n11 = this.dot(g11, xf - 1, yf - 1);
        
        // Suavização
        const u = this.fade(xf);
        const v = this.fade(yf);
        
        // Interpolação final
        return this.lerp(
            this.lerp(n00, n10, u),
            this.lerp(n01, n11, u),
            v
        );
    }

    // Função de ruído em octavas para mais detalhes
    octavePerlin(x, y, octaves, persistence) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for(let i = 0; i < octaves; i++) {
            total += this.perlin(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }

    // Novo método Diamond-Square
    diamondSquare(size) {
        // Garantir que size seja uma potência de 2 + 1
        const n = Math.pow(2, Math.ceil(Math.log2(size - 1)));
        const actualSize = n + 1;
        
        // Criar array 2D
        const heightmap = [];
        for (let i = 0; i < actualSize; i++) {
            heightmap[i] = new Array(actualSize).fill(0);
        }
        
        const roughness = 0.7;
        
        // Inicializar cantos
        heightmap[0][0] = this.minHeight + Math.random() * (this.maxHeight - this.minHeight);
        heightmap[0][actualSize-1] = this.minHeight + Math.random() * (this.maxHeight - this.minHeight);
        heightmap[actualSize-1][0] = this.minHeight + Math.random() * (this.maxHeight - this.minHeight);
        heightmap[actualSize-1][actualSize-1] = this.minHeight + Math.random() * (this.maxHeight - this.minHeight);

        let step = actualSize - 1;
        let r = roughness;

        while (step > 1) {
            const half = Math.floor(step / 2);

            // Diamond step
            for (let y = half; y < actualSize - 1; y += step) {
                for (let x = half; x < actualSize - 1; x += step) {
                    if (!heightmap[y] || !heightmap[y-half] || !heightmap[y+half]) continue;
                    
                    const avg = (
                        heightmap[y - half][x - half] + 
                        heightmap[y - half][x + half] +
                        heightmap[y + half][x - half] +
                        heightmap[y + half][x + half]
                    ) / 4;
                    
                    heightmap[y][x] = avg + (Math.random() * 2 - 1) * r * (this.maxHeight - this.minHeight);
                }
            }

            // Square step
            for (let y = 0; y < actualSize; y += half) {
                for (let x = (y + half) % step; x < actualSize; x += step) {
                    if (!heightmap[y]) continue;
                    
                    let count = 0;
                    let sum = 0;

                    if (y - half >= 0 && heightmap[y - half] && heightmap[y - half][x] !== undefined) {
                        sum += heightmap[y - half][x];
                        count++;
                    }
                    if (y + half < actualSize && heightmap[y + half] && heightmap[y + half][x] !== undefined) {
                        sum += heightmap[y + half][x];
                        count++;
                    }
                    if (x - half >= 0 && heightmap[y][x - half] !== undefined) {
                        sum += heightmap[y][x - half];
                        count++;
                    }
                    if (x + half < actualSize && heightmap[y][x + half] !== undefined) {
                        sum += heightmap[y][x + half];
                        count++;
                    }

                    if (count > 0) {
                        heightmap[y][x] = (sum / count) + (Math.random() * 2 - 1) * r * (this.maxHeight - this.minHeight);
                    }
                }
            }

            step = half;
            r *= 0.5;
        }

        // Normalizar alturas e recortar para o tamanho desejado
        const result = [];
        for (let y = 0; y < size; y++) {
            result[y] = new Array(size);
            for (let x = 0; x < size; x++) {
                result[y][x] = Math.max(this.minHeight, 
                                      Math.min(this.maxHeight, 
                                             heightmap[y][x] || this.minHeight));
            }
        }

        return result;
    }

    // Inicializar o heightmap uma única vez
    initializeHeightmap() {
        if (this.heightmap === null) {
            this.heightmap = this.diamondSquare(this.size);
        }
        return this.heightmap;
    }

    getHeight(x, z) {
        if (!this.heightmap) {
            this.initializeHeightmap();
        }
        
        const mapX = Math.floor(x + this.size/2);
        const mapZ = Math.floor(z + this.size/2);
        
        if (mapX < 0 || mapX >= this.size || mapZ < 0 || mapZ >= this.size) {
            return this.minHeight;
        }
        
        const perlinScale = 0.03;
        const perlinValue = this.perlin(x * perlinScale, z * perlinScale) * 4;
        
        let height = this.heightmap[mapX][mapZ] + perlinValue;

        height = Math.floor(height) + 0.5;

        return Math.max(this.minHeight, Math.min(this.maxHeight, height));
    }

    // Novo método para carregar os templates das árvores
    async loadTreeTemplate(templateName) {
        if (this.treeData.has(templateName)) {
            return this.treeData.get(templateName);
        }

        try {
            const response = await fetch(`./${templateName}`);
            const text = await response.text();
            const blocks = text.trim().split('\n').map(line => {
                const [x, y, z, color] = line.split(',');
                return {
                    x: parseFloat(x),
                    y: parseFloat(y),
                    z: parseFloat(z),
                    color: color.trim(), // Mantém a cor original do arquivo
                    type: 'tree'  // Tipo único para blocos de árvore
                };
            });
            this.treeData.set(templateName, blocks);
            return blocks;
        } catch (error) {
            console.error('Erro ao carregar template de árvore:', error);
            return null;
        }
    }

    // Método para gerar árvores
    async generateTrees() {
        const treePositions = [];
        const minTrees = 20;
        const maxTrees = 100;
        const grassPositions = [];

        // Primeiro, coletar todas as posições válidas para árvores
        for (let x = -this.size/2; x < this.size/2; x++) {
            for (let z = -this.size/2; z < this.size/2; z++) {
                const height = this.getHeight(x, z);
                if (height <= 15) { // Se for bloco de grama
                    grassPositions.push({
                        x: Math.floor(x),
                        z: Math.floor(z),
                        height: Math.floor(height) + 1.5 // Altura do bloco + 1 (começando em .5)
                    });
                }
            }
        }

        // Embaralhar as posições de grama
        for (let i = grassPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [grassPositions[i], grassPositions[j]] = [grassPositions[j], grassPositions[i]];
        }

        // Gerar número aleatório de árvores entre minTrees e maxTrees
        const numTrees = Math.floor(Math.random() * (maxTrees - minTrees + 1)) + minTrees;

        // Gerar árvores nas primeiras n posições embaralhadas
        for (let i = 0; i < numTrees && i < grassPositions.length; i++) {
            const pos = grassPositions[i];
            const templateName = this.treeTemplates[Math.floor(Math.random() * this.treeTemplates.length)];
            const template = await this.loadTreeTemplate(templateName);
            
            if (template) {
                treePositions.push({
                    x: pos.x,
                    y: pos.height, // Agora a altura está correta (bloco + 1)
                    z: pos.z,
                    template: templateName
                });
            }
        }

        console.log(`Gerando ${treePositions.length} árvores`);
        return treePositions;
    }

    async generateMap() {
        if (!this.blocks) {
            console.error('Blocks não foram carregados ainda!');
            return [];
        }

        this.initializeHeightmap();
        const voxels = [];
        let maxHeightUsed = 0;
        
        // Gerar terreno
        for (let x = -this.size/2; x < this.size/2; x++) {
            for (let z = -this.size/2; z < this.size/2; z++) {
                const height = this.getHeight(x, z);
                maxHeightUsed = Math.max(maxHeightUsed, height);

                for (let y = 0.5; y <= height; y += 1.0) {
                    let blockType;
                    if (y === height) {
                        blockType = height > 15 ? 'stone' : 'grass';
                    } else if (y > height - 3) {
                        blockType = 'dirt';
                    } else {
                        blockType = 'stone';
                    }

                    voxels.push({
                        x: Math.floor(x),
                        y: y,
                        z: Math.floor(z),
                        type: blockType,
                        color: this.blocks[blockType].color,
                        transparent: this.blocks[blockType].transparent
                    });
                }
            }
        }

        try {
            // Gerar e adicionar árvores
            const trees = await this.generateTrees();
            for (const tree of trees) {
                const template = await this.loadTreeTemplate(tree.template);
                if (template) {
                    for (const block of template) {
                        // A altura da árvore agora é relativa à posição base correta
                        voxels.push({
                            x: Math.floor(tree.x + block.x),
                            y: tree.y + block.y - 0.5, // Ajuste para alinhar com o sistema de altura .5
                            z: Math.floor(tree.z + block.z),
                            type: block.type,
                            color: block.color,
                            transparent: false
                        });
                    }
                }
            }

            console.log('Altura máxima gerada:', maxHeightUsed);
            console.log('Número de árvores geradas:', trees.length);
            return voxels;
        } catch (error) {
            console.error('Erro ao gerar árvores:', error);
            return voxels;
        }
    }
}

class Cube {
    constructor(webgl_context, size, translation) {
        this.gl = webgl_context;

        this.positions = ([
            // Front face
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0,  1.0,  1.0,
            1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ]).map((point, i) => point * size + translation[i % translation.length]);

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        this.faceColors = [
            [1.0,  1.0,  1.0,  1.0],    // Front face: white
            [1.0,  0.0,  0.0,  1.0],    // Back face: red
            [0.0,  1.0,  0.0,  1.0],    // Top face: green
            [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
            [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
            [1.0,  0.0,  1.0,  1.0],    // Left face: purple
        ];

        this.colors = [].concat.apply([], this.faceColors.map(color => [...color, ...color, ...color, ...color]));

        this.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);


        this.triangles = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];

        this.triangleBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.triangles), this.gl.STATIC_DRAW);
    }

    getBuffers() {
        return {
            position: this.positionBuffer,
            color: this.colorBuffer,
            indices: this.triangleBuffer,

            raw_position: this.positions,
            raw_color: this.faceColors,
            raw_indices: this.triangles,
        };
    }

    getTriangleVertexCount() {
        return this.triangles.length;
    }

    setVertexPositions(programInfo) {
        const numComponents = 3;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents, type, normalize, stride, offset);
        this.gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    setVertexColors(programInfo) {
        const numComponents = 4;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents, type, normalize, stride, offset);
        this.gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }
}


class Scene {
    constructor(webgl_context, vertex_shader, fragment_shader) {
        this.gl = webgl_context;
        this.vertexShader = vertex_shader;
        this.fragmentShader = fragment_shader;

        const shaderProgram = this.initShaderProgram();

        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            }
        };

        this.cube = new Cube(this.gl, 1, [0, 0, 0]);

        this.then = 0;

        this.fieldOfView = 45 * Math.PI / 180;   // in radians
        this.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;

        this.cubeRotation = 0.0;
    }

    getBuffers() {
        return this.cube.getBuffers();
    }

    start() {
        const render = now => {
            now *= 0.001;  // convert to seconds
            const deltaTime = now - this.then;
            this.then = now;

            this.drawScene(deltaTime);
            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }

    drawScene(deltaTime) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -10.0]);
        // mat4.rotate(modelViewMatrix,
        //     modelViewMatrix,
        //     cubeRotation,
        //     [0, 0, 1]);
        // mat4.translate(modelViewMatrix,
        //     modelViewMatrix,
        //     [-2, 0, 0.0]);

        this.cube.setVertexPositions(this.programInfo);
        this.cube.setVertexColors(this.programInfo);

        const buffers = this.getBuffers();

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        this.gl.useProgram(this.programInfo.program);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix,false, modelViewMatrix);

        this.gl.drawElements(this.gl.TRIANGLES, buffers.raw_indices.length, this.gl.UNSIGNED_SHORT, 0);

        this.cubeRotation += deltaTime;
    }

    initShaderProgram() {
        const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertexShader);
        const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentShader);

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }
}


// var cubeRotation = 0.0;
// var pos = { x: 0.1, y: 0.1 };
// var step = 0.2;


// window.addEventListener('keydown', function (event)
// {
//     if (event.keyCode === 87 || event.keyCode === 38) // W, Up
//         pos.y += step;
//     else if (event.keyCode === 65 || event.keyCode === 37) // A, Left
//         pos.x -= step;
//     else if (event.keyCode === 83 || event.keyCode === 40) // S, Down
//         pos.y -= step;
//     else if (event.keyCode === 68 || event.keyCode === 39) // D, Right
//         pos.x += step;
// });


function main() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
    `;

    const fsSource = `
    varying lowp vec4 vColor;
    
    void main(void) {
      gl_FragColor = vColor;
    }
    `;

    const scene = new Scene(gl, vsSource, fsSource);
    scene.start();
}


main();
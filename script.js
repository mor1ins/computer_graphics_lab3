let process = (obj, modelViewMatrix, rad, axis) => obj.rotate(modelViewMatrix, rad, axis);


window.addEventListener('keydown', function (event)
{
    if (event.key === '1') {
        process = (obj, modelViewMatrix, rad, axis, point) => obj.rotate(modelViewMatrix, rad, axis);
    }
    else if (event.key === '2') {
        process = (obj, modelViewMatrix, rad, axis) => {
            const translation = [-2, 0, -10];
            obj.rotateAround(modelViewMatrix, rad, axis, translation);
        };
    }
    else if (event.key === '3') {
        process = (obj, modelViewMatrix, rad, axis) => {
            const translation = [0, 0, -15];
            const point = obj.position.map(
                (p, i) => p - translation[i]
            );

            obj.translate(modelViewMatrix, [-point[0], -point[1], -point[2]]);
            obj.rotate(modelViewMatrix, rad, axis);
            obj.translate(modelViewMatrix, point);
        };
    }
});


class Cube {
    constructor(webgl_context, size, color, default_position=[0.0, 0.0, 0.0]) {
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
        ]).map((point, i) => point * size);

        this.position = default_position;

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        this.faceColors = [
            [...color,  1.0],    // Front face: white
            [...color,  1.0],    // Back face: red
            [...color,  1.0],    // Top face: green
            [...color,  1.0],    // Bottom face: blue
            [...color,  1.0],    // Right face: yellow
            [...color,  1.0],    // Left face: purple
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


        this.normals = [
            [0, 0, 1],
            [0, 0, -1],
            [0, 1, 0],
            [0, -1, 0],
            [1, 0, 0],
            [-1, 0, 0],
        ];


        // this.normals = [].concat.apply([], this.normals.map(n => [...n, ...n, ...n, ...n, ...n, ...n]));
        this.normals = [].concat.apply([], this.normals.map(n => [...n, ...n, ...n, ...n]));

        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
    }

    getBuffers() {
        return {
            position: this.positionBuffer,
            color: this.colorBuffer,
            indices: this.triangleBuffer,
            normal: this.normalBuffer,

            raw_position: this.positions,
            raw_color: this.faceColors,
            raw_indices: this.triangles,
            raw_normals: this.normals,
        };
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
        this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
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
        this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    setNormals(programInfo) {
        const numComponents = 3;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.vertexAttribPointer(
            programInfo.attribLocations.normal,
            numComponents, type, normalize, stride, offset);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.normal);
    }

    to_position(modelViewMatrix) {
        this.translate(modelViewMatrix, this.position);
    }

    translate(modelViewMatrix, translation) {
        // return mat4.translate(modelViewMatrix, modelViewMatrix, this.position.map(
        //     (p, i) => p + translation[i])
        // );
        return mat4.translate(modelViewMatrix, modelViewMatrix, translation);
    }

    rotate(modelViewMatrix, rad, axis) {
        return mat4.rotate(modelViewMatrix, modelViewMatrix, rad, axis);
    }

    rotateAround(modelViewMatrix, rad, axis, point) {
        const translation = this.position.map(
            (p, i) => p - point[i]
        );

        this.translate(modelViewMatrix, translation.map(p => -p));
        this.rotate(modelViewMatrix, rad, axis);
        this.translate(modelViewMatrix, translation);
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
                normal: this.gl.getAttribLocation(shaderProgram, 'aNormal'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            }
        };

        this.objects = [
            new Cube(this.gl, 1, [1, 0.84, 0], [-2, -2, -10]), //gold
            new Cube(this.gl, 1, [1, 0.84, 0], [-2, 0, -10]), // gold
            new Cube(this.gl, 1, [0.75, 0.75, 0.75], [-5, -2, -10]), //silver
            new Cube(this.gl, 1, [0.8, 0.5, 0.2], [1, -2, -10]), // bronze
        ];

        this.then = 0;

        this.fieldOfView = 45 * Math.PI / 180;   // in radians
        this.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;

        this.cubeRotation = 0.0;
    }

    getBuffers() {
        return this.objects.map(obj => obj.getBuffers());
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
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);


        this.objects.forEach(obj => {
            const modelViewMatrix = mat4.create();
            obj.to_position(modelViewMatrix);

            process(obj, modelViewMatrix, this.cubeRotation, [0, 1, 0]);

            obj.setVertexPositions(this.programInfo);
            obj.setVertexColors(this.programInfo);
            obj.setNormals(this.programInfo);

            const buffers = obj.getBuffers();

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            this.gl.useProgram(this.programInfo.program);

            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

            this.gl.drawElements(this.gl.TRIANGLES, buffers.raw_indices.length, this.gl.UNSIGNED_SHORT, 0);
        });
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
    attribute vec3 aNormal;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec4 vColor;
    varying vec3 vNormal;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      vNormal = aNormal;
    }
    `;

    const fsSource = `
    precision mediump float;
    
    varying vec4 vColor;
    varying vec3 vNormal;
        
    void main(void) {
        // vec3  light   = normalize(vec3( 1.5,  -1.2,  -2.0));
        // float amount  = max(dot(vNormal, light),  0.0);
        // vec4 finalColor = vColor; 
        // finalColor.rgb *= amount;
        //        
        vec3 light = normalize(vec3(10.0, 5.0, 7.0));
        float amount = max(dot(vNormal, light), 0.0);        
        
        gl_FragColor = vColor;
        gl_FragColor.rgb *= amount;        
    }
    `;

    const scene = new Scene(gl, vsSource, fsSource);
    scene.start();
}


main();
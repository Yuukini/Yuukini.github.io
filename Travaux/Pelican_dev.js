//  This program was developped by Daniel Audet as an example 
//  to illustrate how to use a left-child right-sibling structure 
//  to organize a graphic program.
//
//  The program includes a skybox and a teapot on which environmental
//  mapping is applied. The other objects (beach balls and cubes) are
//  shaded using the modified Phong model.
//
//  It uses the "MV.js" library developped for the book 
//  "Interactive Computer Graphics" written by Edward Angel and Dave Shreiner.
//

"use strict";

var gl; // The webgl context.

var a_coordsmapLoc; // Location of the attribute variables in the environment mapping shader program.
var a_normalmapLoc;

var u_projectionmapLoc; // Location of the uniform variables in the environment mapping shader program.
var u_modelviewmapLoc;
var u_normalmatrixmapLoc;
var u_minvmapLoc;
var u_skyboxmapLoc;

var a_coordsLoc; // Location of the coords attribute variable in the standard texture mappping shader program.
var a_normalLoc;
var a_texcoordLoc;

var u_projectionLoc; // Location of the uniform variables in the standard texture mappping shader program.
var u_modelviewLoc;
var u_normalmatrixLoc;
var u_textureLoc;
var u_ambientProductLoc;
var u_diffuseProductLoc;
var u_specularProductLoc;
var u_shininessLoc;
var u_lightPositionLoc;

var a_coordsboxLoc; // Location of the coords attribute variable in the shader program used for texturing the environment box.
var a_normalboxLoc;
var a_texcoordboxLoc;

var u_modelviewboxLoc;
var u_projectionboxLoc;
var u_skyboxLoc;

var projection; //--- projection matrix
var modelview; // modelview matrix
var localmodelview; // local modelview matrix used by the render methods
var flattenedmodelview; //--- flattened modelview matrix

var minv = mat3(); // matrix inverse of modelview

var normalmatrix = mat3(); //--- create a 3X3 matrix that will affect normals

var rotator; // A SimpleRotator object to enable rotation by mouse dragging.

var texIDmap0; // environmental texture identifier
var texID1, texID2, texID3, texID4, texEarthID, texMoonID, texJupiterID, texSignatureID; // standard texture identifiers

var skybox, base, cockpitSpace, queueVaisseau, LeftWing, RightWing; // model identifiers


var a_coordsLocSpace, a_normalLocSpace, a_texcoordLocSpace,
    u_modelviewLocSpace, u_projectionLocSpace, u_normalmatrixLocSpace,
    u_textureLocSpace, u_ambientProductLocSpace, u_diffuseProductLocSpace, u_specularProductLocSpace, u_shininessLocSpace, u_lightPositionLocSpace, u_renderOptionLocSpace;



var numNodes = 14; // number of model identifiers
var figure = []; // array containing the structure

var texturelist = [];
var texcounter = 0;

var baseId = 0;
var cockpitSpaceId = 1;
var queueVaisseauId = 2;
var LeftWingId = 3;
var RightWingId = 4;
var skyboxId = 5;
var tetra1ID = 7;
var tetra2ID = 8;
var earthID = 9;
var moonID = 10;
var planetID = 11;
var spaceShipID = 12;
var cubeID = 13;

var skyboxHeight = 1000.0;

var prog, progmap, progbox, progSpace, progtranslucent; // shader program identifiers

var lightPosition = vec4(50.0, 40.0, 10.0, 1.0);
var viewPosition;


var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.35, 0.35, 0.35, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialShininess = 100.0;


var ambientProduct, diffuseProduct, specularProduct;

var rotX = 0,
    rotY = 0; // Additional rotations applied as modeling transform to the teapot.

var textureCounter = 0;
var img = new Array(6);

var stack = [];

var theta = [];

var ntextures_tobeloaded = 0,
    ntextures_loaded = 0;

var object; //spaceShip
var sphere, cylinder, box, disk, torus, cone, tetra, wing, corpVaisseau, coockpitVaisseau, queue; // model identifiers
var hemisphereinside, hemisphereoutside, thindisk;
var quartersphereinside, quartersphereoutside;
var texture, alpha;

window.onload = function init() {
    try {
        var canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            throw "Could not create WebGL context.";
        }

        for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

        for (var i = 0; i < numNodes; i++) {
            theta[i] = 0.0;
            initNodes(i);
        }



        // LOAD FIRST SHADER  (environmental mapping)
        var vertexShaderSourcemap = getTextContent("vshadermap");
        var fragmentShaderSourcemap = getTextContent("fshadermap");
        progmap = createProgram(gl, vertexShaderSourcemap, fragmentShaderSourcemap);

        gl.useProgram(progmap);

        // locate variables for further use
        a_coordsmapLoc = gl.getAttribLocation(progmap, "vcoords");
        a_normalmapLoc = gl.getAttribLocation(progmap, "vnormal");

        u_modelviewmapLoc = gl.getUniformLocation(progmap, "modelview");
        u_projectionmapLoc = gl.getUniformLocation(progmap, "projection");
        u_normalmatrixmapLoc = gl.getUniformLocation(progmap, "normalMatrix");
        u_minvmapLoc = gl.getUniformLocation(progmap, "minv");

        u_skyboxmapLoc = gl.getUniformLocation(progmap, "skybox");



        // LOAD SECOND SHADER (standard texture mapping)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(prog);

        // locate variables for further use
        a_coordsLoc = gl.getAttribLocation(prog, "vcoords");
        a_normalLoc = gl.getAttribLocation(prog, "vnormal");
        a_texcoordLoc = gl.getAttribLocation(prog, "vtexcoord");

        u_modelviewLoc = gl.getUniformLocation(prog, "modelview");
        u_projectionLoc = gl.getUniformLocation(prog, "projection");
        u_normalmatrixLoc = gl.getUniformLocation(prog, "normalMatrix");

        u_textureLoc = gl.getUniformLocation(prog, "texture");

        u_ambientProductLoc = gl.getUniformLocation(prog, "ambientProduct");
        u_diffuseProductLoc = gl.getUniformLocation(prog, "diffuseProduct");
        u_specularProductLoc = gl.getUniformLocation(prog, "specularProduct");
        u_shininessLoc = gl.getUniformLocation(prog, "shininess");
        u_lightPositionLoc = gl.getUniformLocation(prog, "lightPosition");



        // LOAD THIRD SHADER (for the skybox)
        var vertexShaderSource = getTextContent("vshaderbox");
        var fragmentShaderSource = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(progbox);

        a_coordsboxLoc = gl.getAttribLocation(progbox, "vcoords");
        a_normalboxLoc = gl.getAttribLocation(progbox, "vnormal");
        a_texcoordboxLoc = gl.getAttribLocation(progbox, "vtexcoord");

        u_modelviewboxLoc = gl.getUniformLocation(progbox, "modelview");
        u_projectionboxLoc = gl.getUniformLocation(progbox, "projection");

        u_skyboxLoc = gl.getUniformLocation(progbox, "skybox");


        // LOAD FOURTH SHADER (for the spaceShip)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshaderSpaceShip");
        progSpace = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(progSpace);

        // locate variables for further use
        a_coordsLocSpace = gl.getAttribLocation(progSpace, "vcoords");
        a_normalLocSpace = gl.getAttribLocation(progSpace, "vnormal");
        a_texcoordLocSpace = gl.getAttribLocation(progSpace, "vtexcoord");

        u_modelviewLocSpace = gl.getUniformLocation(progSpace, "modelview");
        u_projectionLocSpace = gl.getUniformLocation(progSpace, "projection");
        u_normalmatrixLocSpace = gl.getUniformLocation(progSpace, "normalMatrix");

        u_textureLocSpace = gl.getUniformLocation(progSpace, "texture");

        u_ambientProductLocSpace = gl.getUniformLocation(progSpace, "ambientProduct");
        u_diffuseProductLocSpace = gl.getUniformLocation(progSpace, "diffuseProduct");
        u_specularProductLocSpace = gl.getUniformLocation(progSpace, "specularProduct");
        u_shininessLocSpace = gl.getUniformLocation(progSpace, "shininess");
        u_lightPositionLocSpace = gl.getUniformLocation(progSpace, "lightPosition");
        u_renderOptionLocSpace = gl.getUniformLocation(progSpace, "renderingoption");

        // LOAD FIFTH SHADER (for the translucent box)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshaderBox");
        this.progtranslucent = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(progtranslucent);

        texture = gl.getUniformLocation(progtranslucent,"texture");
        alpha = gl.getUniformLocation(progtranslucent, "alpha");


        gl.enable(gl.DEPTH_TEST);

        // start texture loading
        initTexture();

        //  create a "rotator" monitoring mouse mouvement
        // rotator = new SimpleRotator(canvas, render);  // this calls render() when the mouse moves
        rotator = new SimpleRotator(canvas, null); // this does not call render() when the mouse moves

        //  set initial camera position at z=40, with an "up" vector aligne with y axis
        //   (this defines the initial value of the modelview matrix )
        rotator.setView([0, 0, 1], [0, 1, 0], 40);


        // You can create basic models using the following lines


        //        model = createModel(ring(5.0, 10.0, 25.0));
        /*cockpitSpace = createModel(uvSphere(cockpitSpaceHeight/2., 25.0, 25.0));
		queueVaisseau = createModel(uvSphere(queueVaisseauHeight/2., 25.0, 25.0));
        LeftWing = createModel(uvSphere(LeftWingHeight/2., 25.0, 25.0));*/

        sphere = this.createModel(this.uvSphere(4, 25, 25));
        tetra = this.createModel(this.tetraedre(10.0));
        wing = this.createModel(this.wings());
        corpVaisseau = this.createModel(this.corp());
        coockpitVaisseau = this.createModel(this.cockpit());
        queue = this.createModel(this.back());

        //        model = uvHemisphereOutside(radius, slices, stacks); 
        //        model = uvHemisphereInside(radius, slices, stacks); 
        //        model = uvQuartersphereOutside(radius, slices, stacks); 
        //        model = uvQuartersphereInside(radius, slices, stacks); 
        //        model = createModel(uvTorus(outerRadius, innerRadius, slices, stacks));
        //        model = createModel(uvCylinder(radius, height, slices, noTop, noBottom));
        //        model = createModel(uvCone(radius, height, slices, noBottom));
        /*base = createModel(cube(baseHeight));
		RightWing = createModel(cube(RightWingHeight));*/
        skybox = createModelbox(cube(skyboxHeight));
        object = createModelFromObjFile(ExtractDataFromOBJ("space-shuttle-orbiter.obj")); // Extract vertices and normals from OBJ file
        box = this.createModel(cube(1));

        viewPosition = unflatten(rotator.getViewMatrix());


    } catch (e) {
        document.getElementById("message").innerHTML =
            "Could not initialize WebGL: " + e;
        return;
    }

    document.addEventListener("keydown", doKey, false); // add a callback function (when a key is pressed)
    /*document.onkeydown = function (e) {
        switch (e.key) {
            case 'ArrowUp':
                modelview = mult(translate(0,0,1), modelview);
                render();
                break;
            case 'ArrowDown':
                // down arrow
                yoffset--;
                render();
                break;
            case 'ArrowLeft':
                // left arrow
                xoffset--;
                render();
                break;
            case 'ArrowRight':
                // right arrow
                xoffset++;
                render();
                break;
            case 'PageUp':
                // page up
                zoffset--;
                render();
                break;
            case 'PageDown':
                // page down
                zoffset++;
                render();
                break;
            case 'Home':
                // change to fullscreen
                resize();
                // canvas.width  = 200; // in pixels
                // canvas.height = 100; // in pixels
                // alert(window.screen.availWidth);
                // alert(window.screen.availHeight);
                break;
        }
    };*/

    setInterval(render, 50); // call render function every 50 milliseconds 

}


function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    projection = perspective(60.0, 1.0, 1.0, 2000.0);

    //--- Get the rotation matrix obtained by the displacement of the mouse
    //---  (note: the matrix obtained is already "flattened" by the function getViewMatrix)
    /*flattenedmodelview = rotator.getViewMatrix();
    modelview = unflatten(flattenedmodelview);
    modelview = mult(modelview, translate(0.0, 0.0, -10.0));*/


    //if (viewPosition)
    modelview = viewPosition;

    if (ntextures_loaded == ntextures_tobeloaded) { // if texture images have been loaded

        //#region animation

        //#region earth

        theta[earthID] += 1.0;
        var m = translate(50, 50, 100);
        m = mult(m, rotate(theta[earthID], 0, 1, 0));
        //m = mult(m, scale(5, 5, 5));
        m = mult(m, rotate(-90, 1, 0, 0));
        m = mult(m, scale(4, 4, 4));

        figure[earthID].transform = m;

        //#endregion earth

        //#region  moon

        theta[moonID] += 2.0;
        m = translate(-25, -40, -0);
        m = mult(m, rotate(theta[moonID], 0, 1, 0));
        m = mult(m, rotate(-90, 1, 0, 0));
        m = mult(m, scale(0.25, 0.25, 0.25));

        figure[moonID].transform = m;

        //#endregion moon

        //#region  jupiter

        theta[planetID] += 0.5;
        m = translate(100, 100, -500);
        m = mult(m, rotate(theta[planetID], 0, 1, 0));
        m = mult(m, rotate(-90, 1, 0, 0));
        m = mult(m, scale(20, 20, 20));

        figure[planetID].transform = m;

        //#endregion jupiter

        //#region translucentBox

        theta[cubeID] += 5;
        m = translate(0, 0, 20);
        m = mult(m, rotate(theta[cubeID], 0, 1, 0));
        figure[cubeID].transform = m;

        //#endregion translucentBox

        //#endregion animation



        traverse(baseId);



        //object.render();
    }

}


function traverse(Id) {

    if (Id == null) return;
    stack.push(modelview);
    modelview = mult(modelview, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) traverse(figure[Id].child);
    modelview = stack.pop();
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch (Id) {

        case baseId:
            // positions the object in the scene
            m = mult(m, rotate(-90.0, 1, 0, 0));

            // create a node
            figure[baseId] = createNode(m, base, skyboxId, cockpitSpaceId);
            break;

        case cockpitSpaceId:
            // positions the object relative to the base part
            m = rotate(0.0, 1, 0, 0);

            // create a node
            figure[cockpitSpaceId] = createNode(m, cockpitSpace, queueVaisseauId, null);
            break;

        case queueVaisseauId:
            // positions the object relative to the cockpitSpace part		
            m = rotate(0.0, 1, 0, 0);
            m = mult(m, translate(0, 19, 4));

            // create a node
            figure[queueVaisseauId] = createNode(m, queueVaisseau, LeftWingId, null);
            break;

        case LeftWingId:
            // positions the object relative to the queueVaisseau part
            m = rotate(90.0, 0, 0, 1);
            m = mult(m, translate(0, 0, 0));

            // create a node
            figure[LeftWingId] = createNode(m, LeftWing, RightWingId, null);
            break;

        case RightWingId:
            // positions the object relative to the LeftWing part
            m = rotate(180.0, 1, 0, 0);
            m = mult(m, rotate(90.0, 0, 0, 1));
            m = mult(m, translate(0, -5, 0));

            // create a node
            figure[RightWingId] = createNode(m, RightWing, tetra1ID, null);
            break;

        case skyboxId:
            // positions the object in the scene
            m = rotate(0.0, 0, 1, 0);
            // create a node
            figure[skyboxId] = createNode(m, skybox, earthID, null);
            break;

        case tetra1ID:
            // positions the object in the scene
            m = rotate(90, 1, 0, 0);
            m = mult(m, translate(2.5, 1., 0.));

            // create a node
            figure[tetra1ID] = createNode(m, tetra1, tetra2ID, null);
            break;

        case tetra2ID:
            // positions the object in the scene
            m = rotate(90, 1, 0, 0);
            m = mult(m, translate(0, 1., 0.));
            // create a node
            figure[tetra2ID] = createNode(m, tetra1, null, null);
            break;

        case earthID:

            m = translate(50, 50, 50);
            m = mult(m, scale(5, 5, 5));
            m = mult(m, rotate(-90, 1, 0, 0));

            figure[earthID] = createNode(m, Earth, planetID, moonID);

            break;

        case moonID:
            m = rotate(0, 1, 0, 0);
            m = mult(m, translate(-25, -40, -20));
            m = mult(m, scale(0.25, 0.25, 0.25));

            figure[moonID] = createNode(m, Moon, null, null);
            break;

        case planetID:

            m = translate(100, 100, -500);
            m = mult(m, scale(10, 10, 10));
            m = mult(m, rotate(-90, 1, 0, 0));
            m = mult(m, rotate(180, 0, 0, 1));


            figure[planetID] = createNode(m, Jupiter, spaceShipID, null);
            break;

        case spaceShipID:

            m = translate(-500, 200, 1000);
            //m = mult(m, scale(0.05, 0.05, 0.05));
            //La texture n'est pas scale, le vaisseua devient totalement blance, et je n'arrive pas a afficher le vaisseau avec les shaders donnés avec
            figure[spaceShipID] = createNode(m, SpaceShip, cubeID, null);
            break;

        case cubeID:
            m = translate(0, 0, 0);

            figure[cubeID] = createNode(m, SpaceCube, null, null);
            break;
    }
}

//#region  NodeFunction

function base() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 2
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texID2);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 2);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.5, 0.5, 0.5)); // create a local modelview matrix to be used by base.render()

    corpVaisseau.render();
}

function cockpitSpace() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID1);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 1);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.5, 0.25, 0.5));

    coockpitVaisseau.render();

}

function queueVaisseau() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID1);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 1);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.5, 0.5, 0.5));

    queue.render();
}

function LeftWing() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID1);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 1);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.5, 0.5, 0.5)); // create a local modelview matrix to be used by LeftWing.render()

    wing.render();
}

function RightWing() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID1);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 1);


    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(-0.5, -0.5, -0.5)); // create a local modelview matrix to be used by RightWing.render()

    wing.render();
}

function skybox() {

    // select shaders
    gl.useProgram(progbox); // Select the shader program that is used for the environment box.

    gl.uniformMatrix4fv(u_projectionboxLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsboxLoc);
    gl.disableVertexAttribArray(a_normalboxLoc);
    gl.disableVertexAttribArray(a_texcoordboxLoc);

    // associate texture image to "texture unit" 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);

    // Send texture number to sampler
    gl.uniform1i(u_skyboxLoc, 0);
    localmodelview = modelview; // create a local modelview matrix to be used by skybox.render()

    skybox.render();
}


function tetra1() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 3
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texID3);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 3);


    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.5, 0.5, 0.5)); // create a local modelview matrix to be used by RightWing.render()

    tetra.render();
}


//#region planet

function Planet(Id) {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    console.log(Id);
    switch (Id) {
        case earthID:
            // associate texture image to "texture unit" 1
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, texEarthID);

            // Send texture number to sampler
            gl.uniform1i(u_textureLoc, 4);
            break;
        case moonID:
            // associate texture image to "texture unit" 1
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, texMoonID);

            // Send texture number to sampler
            gl.uniform1i(u_textureLoc, 4);
            break;
        case planetID:
            // associate texture image to "texture unit" 1
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, texJupiterID);

            // Send texture number to sampler
            gl.uniform1i(u_textureLoc, 4);
            break;
        default:
            // associate texture image to "texture unit" 1
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, texEarthID);

            // Send texture number to sampler
            gl.uniform1i(u_textureLoc, 4);
            break;
    }



    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(2, 2, 2));

    sphere.render();
}

function Earth() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texEarthID);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 4);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(2, 2, 2)); // create a local modelview matrix to be used by RightWing.render()

    sphere.render();
}

function Moon() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texMoonID);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 4);

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(2, 2, 2));

    sphere.render();
}

function Jupiter() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

    // associate texture image to "texture unit" 1
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texJupiterID);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 4);



    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(2, 2, 2));

    sphere.render();
}

//#endregion planet

function SpaceShip() {

    // select shaders
    gl.useProgram(prog);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);

    gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);

   /* gl.activeTexture(gl.TEXTURE8);
    //gl.bindTexture(gl.TEXTURE_2D, texJupiterID);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 8);*/

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(0.04, 0.04, 0.04));
    object.render();
}

function SpaceCube() {

    // select shaders
    gl.useProgram(progtranslucent);

    /* gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
     gl.enable(gl.BLEND);
     gl.depthMask(false);
     gl.uniform1f(alphaloc, 0.5);*/

    /*ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
    gl.uniform1f(u_shininessLoc, materialShininess);*/

    //gl.uniform4fv(u_lightPositionLoc, flatten(lightPosition));

    /*gl.uniformMatrix4fv(u_projectionLoc, false, flatten(projection)); // send projection matrix to the new shader program

    gl.enableVertexAttribArray(a_coordsLoc);
    gl.enableVertexAttribArray(a_normalLoc);
    gl.enableVertexAttribArray(a_texcoordLoc);*/

    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, texSignatureID);

    // Send texture number to sampler
    gl.uniform1i(u_textureLoc, 7);
    texture = texSignatureID;
    gl.uniform1f = 0.5;

    normalmatrix = extractnormalmatrix(modelview); // always extract normalmatrix before scaling
    localmodelview = mult(modelview, scale(1, 1, 1));
    box.render();
    /*  gl.disable(gl.BLEND);
      gl.depthMask(true);*/
}


//#endregion NodeFunction

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}

function extractnormalmatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0]; // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0]; // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0];
    result[1][0] = matrix[1];
    result[2][0] = matrix[2];
    result[3][0] = matrix[3];
    result[0][1] = matrix[4];
    result[1][1] = matrix[5];
    result[2][1] = matrix[6];
    result[3][1] = matrix[7];
    result[0][2] = matrix[8];
    result[1][2] = matrix[9];
    result[2][2] = matrix[10];
    result[3][2] = matrix[11];
    result[0][3] = matrix[12];
    result[1][3] = matrix[13];
    result[2][3] = matrix[14];
    result[3][3] = matrix[15];

    return result;
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    ntextures_loaded++;

    render(); // Call render function when the image has been loaded (to make sure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleLoadedTextureMap(texture) {

    textureCounter++;
    ntextures_loaded++;
    if (textureCounter == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        render(); // Call render function when the image has been loaded (to make sure the model is displayed)

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}


function initTexture() {


    var urls = [
        "space/posx.png", "space/negx.jpg",
        "space/posy.png", "space/negy.png",
        "space/posz.jpg", "space/negz.jpg"
    ];

    texIDmap0 = gl.createTexture();

    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function () { // this function is called when the image download is complete

            handleLoadedTextureMap(texIDmap0);
        }
        img[i].src = urls[i]; // this line starts the image downloading thread
        ntextures_tobeloaded++;

    }


    texID1 = gl.createTexture();
    texID1.image = new Image();
    texID1.image.onload = function () {
        handleLoadedTexture(texID1)
    }
    texID1.image.src = "10469.jpg";
    ntextures_tobeloaded++;

    texID2 = gl.createTexture();
    texID2.image = new Image();
    texID2.image.onload = function () {
        handleLoadedTexture(texID2)
    }
    texID2.image.src = "8657.jpg";
    ntextures_tobeloaded++;

    texID3 = gl.createTexture();
    texID3.image = new Image();
    texID3.image.onload = function () {
        handleLoadedTexture(texID3)
    }
    texID3.image.src = "circuit.jpg";
    ntextures_tobeloaded++;

    texEarthID = gl.createTexture();
    texEarthID.image = new Image();
    texEarthID.image.onload = function () {
        handleLoadedTexture(texEarthID)
    }
    texEarthID.image.src = "earthmap.jpg";
    ntextures_tobeloaded++;

    texMoonID = gl.createTexture();
    texMoonID.image = new Image();
    texMoonID.image.onload = function () {
        handleLoadedTexture(texMoonID)
    }
    texMoonID.image.src = "moonmap.jpg";
    ntextures_tobeloaded++;

    texJupiterID = gl.createTexture();
    texJupiterID.image = new Image();
    texJupiterID.image.onload = function () {
        handleLoadedTexture(texJupiterID)
    }
    texJupiterID.image.src = "jupiter.jpg";
    ntextures_tobeloaded++;

    texSignatureID = gl.createTexture();
    texSignatureID.image = new Image();
    texSignatureID.image.onload = function () {
        handleLoadedTexture(texSignatureID)
    }
    texSignatureID.image.src = "Signature.png";
    ntextures_tobeloaded++;

}



function createModel(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);

    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(a_coordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(a_texcoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(u_modelviewLoc, false, flatten(localmodelview)); //--- load flattened modelview matrix
        gl.uniformMatrix3fv(u_normalmatrixLoc, false, flatten(normalmatrix)); //--- load flattened normal matrix

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}

function createModelmap(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);

    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(a_coordsmapLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_normalmapLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(u_modelviewmapLoc, false, flatten(localmodelview)); //--- load flattened modelview matrix
        gl.uniformMatrix3fv(u_normalmatrixmapLoc, false, flatten(normalmatrix)); //--- load flattened normal matrix

        gl.uniformMatrix3fv(u_minvmapLoc, false, flatten(minv)); // send matrix inverse of modelview in order to rotate the skybox

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}


function createModelbox(modelData) { // For creating the environment box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(a_coordsboxLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(u_modelviewboxLoc, false, flatten(localmodelview));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}


/**
 *  An event listener for the keydown event.  It is installed by the init() function.
 */
function doKey(evt) {
    var rotationChanged = true;
    console.log("event : " + evt);
    switch (evt.keyCode) {
        case 37: //left arrow
            viewPosition = mult(rotate(-5.0, 0, 1, 0), modelview);
            break; // left arrow
        case 39: //right arrow
            viewPosition = mult(rotate(5.0, 0, 1, 0), modelview);
            break; // right arrow
        case 38: //up arrow
            viewPosition = mult(translate(0, 0, 1), modelview);
            break; // up arrow
        case 40: //down arrow
            viewPosition = mult(translate(0, 0, -1), modelview);
            break; // down arrow
        case 13:
            rotX = rotY = 0;
            break; // return
        case 36:
            rotX = rotY = 0;
            break; // home
        default:
            rotationChanged = false;
    }
    if (rotationChanged) {
        evt.preventDefault();
        //        render();  // render() is not call when the arrows are pressed
    }
}


function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}

//#region loadFromObj

function handleLoadedTextureFromObjFile(texturelist, Id) {
    gl.bindTexture(gl.TEXTURE_2D, texturelist[Id]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturelist[Id].image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    ntextures_loaded++;
    render(); // Call render function when the image has been loaded (to insure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function createModelFromObjFile(ptr) {

    var i;
    var model = {};

    model.numberofelements = ptr.numberofelements;
    model.coordsBuffer = [];
    model.normalBuffer = [];
    model.textureBuffer = [];
    model.indexBuffer = [];
    model.count = [];
    model.Ka = [];
    model.Kd = [];
    model.Ks = [];
    model.Ns = [];
    model.textureFile = [];
    model.texId = [];


    for (i = 0; i < ptr.numberofelements; i++) {

        model.coordsBuffer.push(gl.createBuffer());
        model.normalBuffer.push(gl.createBuffer());
        model.textureBuffer.push(gl.createBuffer());
        model.indexBuffer.push(gl.createBuffer());
        model.count.push(ptr.list[i].indices.length);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexPositions, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexNormals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexTextureCoords, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ptr.list[i].indices, gl.STATIC_DRAW);

        model.Ka.push(ptr.list[i].material.Ka);
        model.Kd.push(ptr.list[i].material.Kd);
        model.Ks.push(ptr.list[i].material.Ks);
        model.Ns.push(ptr.list[i].material.Ns); // shininess

        // if a texture file has been defined for this element
        if (ptr.list[i].material.map != "") {

            // Check if the filename is present in the texture list
            var texindex = model.textureFile.indexOf(ptr.list[i].material.map);
            if (texindex > -1) { // texture file previously loaded
                // store the texId of the previously loaded file
                model.texId.push(model.texId[texindex]);
            } else { // new texture file to load
                // store current texture counter (will be used when rendering the scene)
                model.texId.push(texcounter);

                // add a new image buffer to the texture list
                texturelist.push(gl.createTexture());
                if (texcounter < 70) {
                    texturelist[texcounter].image = new Image();

                    if (texcounter == 0) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 0)
                        }
                    } else if (texcounter == 1) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 1)
                        }
                    } else if (texcounter == 2) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 2)
                        }
                    } else if (texcounter == 3) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 3)
                        }
                    } else if (texcounter == 4) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 4)
                        }
                    } else if (texcounter == 5) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 5)
                        }
                    } else if (texcounter == 6) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 6)
                        }
                    } else if (texcounter == 7) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 7)
                        }
                    } else if (texcounter == 8) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 8)
                        }
                    } else if (texcounter == 9) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 9)
                        }
                    } else if (texcounter == 10) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 10)
                        }
                    } else if (texcounter == 11) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 11)
                        }
                    } else if (texcounter == 12) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 12)
                        }
                    } else if (texcounter == 13) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 13)
                        }
                    } else if (texcounter == 14) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 14)
                        }
                    } else if (texcounter == 15) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 15)
                        }
                    } else if (texcounter == 16) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 16)
                        }
                    } else if (texcounter == 17) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 17)
                        }
                    } else if (texcounter == 18) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 18)
                        }
                    } else if (texcounter == 19) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 19)
                        }
                    } else if (texcounter == 20) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 20)
                        }
                    } else if (texcounter == 21) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 21)
                        }
                    } else if (texcounter == 22) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 22)
                        }
                    } else if (texcounter == 23) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 23)
                        }
                    } else if (texcounter == 24) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 24)
                        }
                    } else if (texcounter == 25) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 25)
                        }
                    } else if (texcounter == 26) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 26)
                        }
                    } else if (texcounter == 27) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 27)
                        }
                    } else if (texcounter == 28) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 28)
                        }
                    } else if (texcounter == 29) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 29)
                        }
                    } else if (texcounter == 30) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 30)
                        }
                    } else if (texcounter == 31) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 31)
                        }
                    } else if (texcounter == 32) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 32)
                        }
                    } else if (texcounter == 33) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 33)
                        }
                    } else if (texcounter == 34) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 34)
                        }
                    } else if (texcounter == 35) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 35)
                        }
                    } else if (texcounter == 36) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 36)
                        }
                    } else if (texcounter == 37) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 37)
                        }
                    } else if (texcounter == 38) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 38)
                        }
                    } else if (texcounter == 39) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 39)
                        }
                    } else if (texcounter == 40) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 40)
                        }
                    } else if (texcounter == 41) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 41)
                        }
                    } else if (texcounter == 42) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 42)
                        }
                    } else if (texcounter == 43) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 43)
                        }
                    } else if (texcounter == 44) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 44)
                        }
                    } else if (texcounter == 45) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 45)
                        }
                    } else if (texcounter == 46) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 46)
                        }
                    } else if (texcounter == 47) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 47)
                        }
                    } else if (texcounter == 48) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 48)
                        }
                    } else if (texcounter == 49) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 49)
                        }
                    } else if (texcounter == 50) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 50)
                        }
                    } else if (texcounter == 51) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 51)
                        }
                    } else if (texcounter == 52) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 52)
                        }
                    } else if (texcounter == 53) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 53)
                        }
                    } else if (texcounter == 54) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 54)
                        }
                    } else if (texcounter == 55) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 55)
                        }
                    } else if (texcounter == 56) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 56)
                        }
                    } else if (texcounter == 57) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 57)
                        }
                    } else if (texcounter == 58) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 58)
                        }
                    } else if (texcounter == 59) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 59)
                        }
                    } else if (texcounter == 60) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 60)
                        }
                    } else if (texcounter == 61) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 61)
                        }
                    } else if (texcounter == 62) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 62)
                        }
                    } else if (texcounter == 63) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 63)
                        }
                    } else if (texcounter == 64) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 64)
                        }
                    } else if (texcounter == 65) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 65)
                        }
                    } else if (texcounter == 66) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 66)
                        }
                    } else if (texcounter == 67) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 67)
                        }
                    } else if (texcounter == 68) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 68)
                        }
                    } else if (texcounter == 69) { // associate a FIXED callback function to each texture Id
                        texturelist[texcounter].image.onload = function () {
                            handleLoadedTextureFromObjFile(texturelist, 69)
                        }
                    }

                    if (texcounter < 70) {
                        texturelist[texcounter].image.src = ptr.list[i].material.map;
                        ntextures_tobeloaded++;
                    }

                    // increment counter
                    texcounter++;
                } // if(texcounter<70)
            } // else				
        } // if(ptr.list[i].material.map != ""){
        else { // if there is no texture file associated to this element
            // store a null value (it will NOT be used when rendering the scene)
            model.texId.push(null);
        }

        // store the filename for every element even if it is empty ("")
        model.textureFile.push(ptr.list[i].material.map);

    } // for(i=0; i < ptr.numberofelements; i++){

    model.render = function () {
        for (i = 0; i < this.numberofelements; i++) {

            gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer[i]);
            gl.vertexAttribPointer(a_coordsLoc, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer[i]);
            gl.vertexAttribPointer(a_normalLoc, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer[i]);
            gl.vertexAttribPointer(a_texcoordLoc, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);

            gl.uniformMatrix4fv(u_modelviewLoc, false, flatten(modelview)); //--- load flattened modelview matrix
            gl.uniformMatrix3fv(u_normalmatrixLoc, false, flatten(normalmatrix)); //--- load flattened normal matrix

            ambientProduct = mult(lightAmbient, vec4(this.Ka[i], 1.0));
            diffuseProduct = mult(lightDiffuse, vec4(this.Kd[i], 1.0));
            specularProduct = mult(lightSpecular, vec4(this.Ks[i], 1.0));
            materialShininess = this.Ns[i];

            gl.uniform4fv(u_ambientProductLoc, flatten(ambientProduct));
            gl.uniform4fv(u_diffuseProductLoc, flatten(diffuseProduct));
            gl.uniform4fv(u_specularProductLoc, flatten(specularProduct));
            gl.uniform1f(u_shininessLoc, materialShininess);

            if (this.textureFile[i] != "") {
                gl.enableVertexAttribArray(a_texcoordLoc);
                gl.activeTexture(gl.TEXTURE8);
                gl.bindTexture(gl.TEXTURE_2D, texturelist[model.texId[i]]);

                // Send texture number to sampler
                gl.uniform1i(u_textureLoc, 8);

                // assign "2" to renderingoption in fragment shader
                //gl.uniform1i(renderingoptionLoc, 2);
            } else {
                gl.disableVertexAttribArray(a_texcoordLoc);
                // assign "0" to renderingoption in fragment shader
                //gl.uniform1i(renderingoptionLoc, 0);				
            }

            gl.drawElements(gl.TRIANGLES, this.count[i], gl.UNSIGNED_SHORT, 0);
        }
    }

    return model;
}

//#endregion loadFromObj
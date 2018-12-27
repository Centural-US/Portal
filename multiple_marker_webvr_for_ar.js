//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////


//
var webgl_renderer_parameters = {
    antialias	: true,
    alpha: true
};

// init webgl_renderer
var webgl_renderer	= new THREE.WebGLRenderer( webgl_renderer_parameters );

webgl_renderer.setClearColor(new THREE.Color('lightgrey'), 0);
webgl_renderer.setSize(window.innerWidth, window.innerHeight);
webgl_renderer.domElement.style.position = 'absolute';
webgl_renderer.domElement.style.top = '0px';
webgl_renderer.domElement.style.left = '0px';
document.body.appendChild(webgl_renderer.domElement);

// array of functions for the rendering loop
var onRenderFcts= [];

// init scene and camera
var scene	= new THREE.Scene();

// init scene and camera
var scene = new THREE.Scene();

var ambient = new THREE.AmbientLight(0x666666);
scene.add(ambient);

var directionalLight = new THREE.DirectionalLight(0x887766);
directionalLight.position.set(-1, 1, 1).normalize();
scene.add(directionalLight);

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
// var camera = new THREE.Camera();
// scene.add(camera);

// Create a three.js camera.
var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
scene.add(camera);

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

// Apply VR stereo rendering to webgl_renderer.
var vrEffect = null;
if (true) { //if what is true?
    vrEffect = new THREE.VREffect(webgl_renderer);
    vrEffect.setSize(window.innerWidth, window.innerHeight);
}

// Get the VRDisplay and save it for later.
var vrDisplay = null;
navigator.getVRDisplays().then(function (displays) {
    if (displays.length > 0) {
        vrDisplay = displays[0];
    }
});
window.addEventListener('vrdisplaypresentchange', function onVRDisplayPresentChange() {
    onResize();
});

function togglePresent() {
    if (vrDisplay.capabilities.canPresent === false) {
        alert('You vr display can not present!')
        return
    }
    if (vrDisplay.isPresenting) {
        vrDisplay.exitPresent()
    } else {
        vrDisplay.requestPresent([{source: webgl_renderer.domElement}]);
    }
}

document.body.addEventListener('keypress', function (event) {
    if (event.key === 'p') togglePresent()
});
document.body.addEventListener('click', function (event) {
    togglePresent()
});

// Resize the WebGL canvas when we resize and also when we change modes.
window.addEventListener('resize', onResize);


////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////




function onResize() {
    // handle arToolkitSource resize
    arToolkitSource.onResize(webgl_renderer.domElement)

    // get width/height from arToolkitSource.domElement
    var elementWidth = parseFloat(arToolkitSource.domElement.style.width.replace(/px$/, ''), 10)
    var elementHeight = parseFloat(arToolkitSource.domElement.style.height.replace(/px$/, ''), 10)

    if (vrEffect !== null) {
        vrEffect.setSize(elementWidth, elementHeight);
    }

    if (camera instanceof THREE.PerspectiveCamera === true) {
        camera.aspect = elementWidth / elementHeight;
        camera.updateProjectionMatrix();
    }
}

////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////
var arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam'
});

arToolkitSource.init(function onReady() {
    onResize();
});

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono',
    maxDetectionRate: 30,
    canvasWidth: 80 * 3,
    canvasHeight: 60 * 3
});
// initialize it
arToolkitContext.init(function onCompleted(){
    if (camera instanceof THREE.PerspectiveCamera === false) {
        // copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    }
});

// update artoolkit on every frame
onRenderFcts.push(function(){
    if( arToolkitSource.ready === false )	return

    arToolkitContext.update( arToolkitSource.domElement )
});(function(){

    //////////////////////////////////////////////////////////////////////////////
    //		markerRoot1
    //////////////////////////////////////////////////////////////////////////////

    // build markerControls
    var markerRoot1 = new THREE.Group
    markerRoot1.name = 'marker1'
    scene.add(markerRoot1)
    var markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
        type : 'pattern',
        patternUrl : 'data/patterns/patt.hiro',
        // patternUrl : THREEx.ArToolkitContext.baseURL + 'data/patterns/patt.kanji',
    })

    // add a gizmo in the center of the marker
    var geometry	= new THREE.OctahedronGeometry( 0.1, 0 )
    var material	= new THREE.MeshNormalMaterial({
        wireframe: true
    });
    var mesh	= new THREE.Mesh( geometry, material );
    markerRoot1.add( mesh );

    //////////////////////////////////////////////////////////////////////////////
    //		markerRoot2
    //////////////////////////////////////////////////////////////////////////////

    // build markerControls
    var markerRoot2 = new THREE.Group
    markerRoot2.name = 'marker2'
    scene.add(markerRoot2)
    var markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot2, {
        type : 'pattern',
         patternUrl : 'data/patterns/patt.kanji',
    })

    // add a gizmo in the center of the marker
    var geometry	= new THREE.OctahedronGeometry( 0.1, 0 )
    var material	= new THREE.MeshNormalMaterial({
        wireframe: true
    });
    var mesh	= new THREE.Mesh( geometry, material );
    markerRoot2.add( mesh );
})()


;(function(){
    var markerRoot1 = scene.getObjectByName('marker1')
    var markerRoot2 = scene.getObjectByName('marker2')

    var container = new THREE.Group
    scene.add(container)

    // update container.visible and scanningSpinner visibility
    onRenderFcts.push(function(){
        if( markerRoot1.visible === true && markerRoot2.visible === true ){
            container.visible = true
            document.querySelector('.scanningSpinner').style.display = 'none'
        }else{
            container.visible = false
            document.querySelector('.scanningSpinner').style.display = ''
        }
    })

    //////////////////////////////////////////////////////////////////////////////
    //		build lineMesh
    //////////////////////////////////////////////////////////////////////////////
    var material = new THREE.LineDashedMaterial( {
        dashSize: 1,
        gapSize: 1,
    } );
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(1, 0, -3));
    geometry.vertices.push(new THREE.Vector3(-1, 0, -3));
    var lineMesh = new THREE.Line(geometry, material);
    container.add(lineMesh)

    // update lineMesh
    onRenderFcts.push(function(){
        var geometry = lineMesh.geometry
        geometry.vertices[0].copy(markerRoot1.position)
        geometry.vertices[1].copy(markerRoot2.position)
        geometry.verticesNeedUpdate = true

        geometry.computeBoundingSphere();
        geometry.computeLineDistances();

        var length = markerRoot1.position.distanceTo(markerRoot2.position)
        lineMesh.material.scale = length * 10
        lineMesh.material.needsUpdate = true
    })


    //////////////////////////////////////////////////////////////////////////////
    //		display the distance between the 2 markers
    //////////////////////////////////////////////////////////////////////////////

    // build texture
    var canvas = document.createElement( 'canvas' );
    canvas.width = 128;
    canvas.height = 64;
    var context = canvas.getContext( '2d' );
    var texture = new THREE.CanvasTexture( canvas );

    // build sprite
    var material = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffffff,
    });
    var sprite = new THREE.Sprite( material );
    sprite.scale.multiplyScalar(0.5)
    container.add(sprite)

    // upload measure
    onRenderFcts.push(function(){
        // update sprite position
        sprite.position.addVectors(markerRoot1.position, markerRoot2.position).multiplyScalar(1/2)

        // get the text to display
        var length = markerRoot1.position.distanceTo(markerRoot2.position)
        var text = length.toFixed(2)

        // put the text in the sprite
        context.font = '40px monospace';
        context.clearRect( 0, 0, canvas.width, canvas.height );
        context.fillStyle = '#fff';
        context.fillText(text, canvas.width/4, 3*canvas.height/4 )
        sprite.material.map.needsUpdate = true
    })

})()
//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function(){
    // Render the scene.
    if (vrEffect !== null) {
        vrEffect.render(scene, camera);
    } else {
        webgl_renderer.render(scene, camera);
    }
})

// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame( animate );
    // measure time
    lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
    var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec	= nowMsec
    // call each update function
    onRenderFcts.forEach(function(onRenderFct){
        onRenderFct(deltaMsec/1000, nowMsec/1000)
    })
})
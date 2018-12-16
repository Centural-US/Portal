//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
var renderer	= new THREE.WebGLRenderer({
    // antialias	: true,
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
// renderer.setPixelRatio( 2 );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );

// array of functions for the rendering loop
var onRenderFcts= [];

// init scene and camera
var scene	= new THREE.Scene();

var ambient = new THREE.AmbientLight( 0x666666 );
scene.add( ambient );

var directionalLight = new THREE.DirectionalLight( 0x887766 );
directionalLight.position.set( -1, 1, 1 ).normalize();
scene.add( directionalLight );

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

// Apply VR stereo rendering to renderer.
var vrEffect = null;
if( true ){ //if what is true?
    vrEffect = new THREE.VREffect(renderer);
    vrEffect.setSize(window.innerWidth, window.innerHeight);
}

// Get the VRDisplay and save it for later.
var vrDisplay = null;
navigator.getVRDisplays().then(function(displays){
    if (displays.length > 0) {
        vrDisplay = displays[0];
    }
});
window.addEventListener('vrdisplaypresentchange', function onVRDisplayPresentChange() {
    onResize();
});

function togglePresent(){
    if( vrDisplay.capabilities.canPresent === false ){
        alert('You vr display can not present!')
        return
    }
    if( vrDisplay.isPresenting ){
        vrDisplay.exitPresent()
    }else{
        vrDisplay.requestPresent([{source: renderer.domElement}]);
    }
}
document.body.addEventListener('keypress', function(event){
    if( event.key === 'p' )	togglePresent()
})
document.body.addEventListener('click', function(event){
    togglePresent()
})

// Resize the WebGL canvas when we resize and also when we change modes.
window.addEventListener('resize', onResize);

function onResize() {
    // handle arToolkitSource resize
    arToolkitSource.onResize(renderer.domElement)

    // get width/height from arToolkitSource.domElement
    var elementWidth = parseFloat( arToolkitSource.domElement.style.width.replace(/px$/,''), 10 )
    var elementHeight = parseFloat( arToolkitSource.domElement.style.height.replace(/px$/,''), 10 )

    if( vrEffect !== null ){
        vrEffect.setSize(elementWidth, elementHeight);
    }

    if( camera instanceof THREE.PerspectiveCamera === true ){
        camera.aspect = elementWidth / elementHeight;
        camera.updateProjectionMatrix();
    }
}
////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new THREEx.ArToolkitSource({
    // to read from the webcam
    sourceType : 'webcam',

    // // to read from an image
    // sourceType : 'image',
    // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

    // // to read from a video
    // sourceType : 'video',
    // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
})

arToolkitSource.init(function onReady(){
    onResize()
})

////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono',
    maxDetectionRate: 30,
    canvasWidth: 80*3,
    canvasHeight: 60*3,
})
// initialize it
arToolkitContext.init(function onCompleted(){
    if( camera instanceof THREE.PerspectiveCamera === false ){
        // copy projection matrix to camera
        camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
    }
})

// update artoolkit on every frame
onRenderFcts.push(function(){
    if( arToolkitSource.ready === false )	return

    arToolkitContext.update( arToolkitSource.domElement )
})


////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

var markerRoot = new THREE.Group
scene.add(markerRoot)
var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type : 'pattern',
    patternUrl : 'data/patterns/patt.hiro',
    // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
})

//////////////////////////////////////////////////////////////////////////////////
//		build videoTexture
//////////////////////////////////////////////////////////////////////////////////

// get videoTexture
if( arToolkitSource.domElement.nodeName === 'VIDEO' ){
    var videoTexture = new THREE.VideoTexture(arToolkitSource.domElement)
    // arToolkitSource.domElement.pause()
}else if( arToolkitSource.domElement.nodeName === 'IMG' ){
    var videoTexture = new THREE.Texture(arToolkitSource.domElement)
    videoTexture.needsUpdate = true
}else console.assert(false)
// TODO to remove if webgl2 - better visual ?
videoTexture.minFilter =  THREE.NearestFilter


//////////////////////////////////////////////////////////////////////////////
//	plane always in front of the camera, exactly as big as the viewport
//////////////////////////////////////////////////////////////////////////////
var videoInWebgl = new THREEx.ArVideoInWebgl(videoTexture)
scene.add(videoInWebgl.object3d);
arToolkitSource.domElement.style.visibility = 'hidden'

// TODO extract the fov from the projectionMatrix
// camera.fov = 43.1
// camera.fov = 42
onRenderFcts.push(function(){
    videoInWebgl.update(camera)
})

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
// var video = arToolkitSource.domElement;
//
// window.addEventListener('resize', function(){
// 	updateSeeThruAspectUv(seethruPlane)
// })
// video.addEventListener('canplaythrough', function(){
// 	updateSeeThruAspectUv(seethruPlane)
// })
// function updateSeeThruAspectUv(plane){
//
// 	// if video isnt yet ready to play
// 	if( video.videoWidth === 0 || video.videoHeight === 0 )	return
//
// 	var faceVertexUvs = plane.geometry.faceVertexUvs[0]
// 	var screenAspect = window.innerWidth / window.innerHeight
// 	var videoAspect = video.videoWidth / video.videoHeight
//
// 	plane.geometry.uvsNeedUpdate = true
// 	if( screenAspect >= videoAspect ){
// 		var actualHeight = videoAspect / screenAspect;
// 		// faceVertexUvs y 0
// 		faceVertexUvs[0][1].y = 0.5 - actualHeight/2
// 		faceVertexUvs[1][0].y = 0.5 - actualHeight/2
// 		faceVertexUvs[1][1].y = 0.5 - actualHeight/2
// 		// faceVertexUvs y 1
// 		faceVertexUvs[0][0].y = 0.5 + actualHeight/2
// 		faceVertexUvs[0][2].y = 0.5 + actualHeight/2
// 		faceVertexUvs[1][2].y = 0.5 + actualHeight/2
// 	}else{
// 		var actualWidth = screenAspect / videoAspect;
// 		// faceVertexUvs x 0
// 		faceVertexUvs[0][0].x = 0.5 - actualWidth/2
// 		faceVertexUvs[0][1].x = 0.5 - actualWidth/2
// 		faceVertexUvs[1][0].x = 0.5 - actualWidth/2
//
// 		// faceVertexUvs x 1
// 		faceVertexUvs[0][2].x = 0.5 + actualWidth/2
// 		faceVertexUvs[1][1].x = 0.5 + actualWidth/2
// 		faceVertexUvs[1][2].x = 0.5 + actualWidth/2
// 	}
// }


//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a torus knot
var geometry	= new THREE.CubeGeometry(1,1,1);
var material	= new THREE.MeshNormalMaterial({
    transparent : true,
    opacity: 0.5,
    side: THREE.DoubleSide
});
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= geometry.parameters.height/2
markerRoot.add( mesh );

var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
var material	= new THREE.MeshNormalMaterial();
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= 0.5
markerRoot.add( mesh );

onRenderFcts.push(function(){
    mesh.rotation.x += 0.1
})

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////
var stats = new Stats();
document.body.appendChild( stats.dom );
// render the scene
onRenderFcts.push(function(){
    // Render the scene.
    if( vrEffect !== null ){
        vrEffect.render(scene, camera);
    }else{
        renderer.render( scene, camera );
    }
    stats.update();
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
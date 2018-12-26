//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init webgl_renderer
var webgl_renderer_parameters = {
    antialias: false,
    alpha: true
};

var webgl_renderer = new THREE.WebGLRenderer(webgl_renderer_parameters);
var common; //AI/Thought of machine learning

//Used to setup a default value for now
function common_set_webgl_renderer_paramters( common ) {
    return common["webgl_renderer_parameters"] = {
        antialias: false,
        alpha: true
    };
}

//Should be flat before you use this function
function common_get_webgl_renderer_parameters( common ) {
    return common["webgl_renderer_paramters"]
}

function common_webgl_renderer_set_clear_color ( common ) {
    return common["webgl_renderer"].setClearColor(new THREE.Color('lightgrey'), 0);
}

function init_webgl_renderer( common ) {
    return common_get_webgl_renderer_paramters(
        common_set_webgl_renderer_parameters ( common  ) );
}

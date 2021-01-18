'use strict';

/*
 * Good fundamental resource: https://webglfundamentals.org/
 * Shaders are defined as strings in the `shaders.js` script.
 *
 * Ultimately WebGL is a 2d rasterization (fills pixels from vector graphic)
 * library, but the Graphics Library Shader Language (GLSL) has features
 * that make writing 3d engines easier. This includes things like matrix
 * operations, dot products, and options like CULL_FACE and DEPTH (Z) BUFFER.
 */

// ensure this matches the vertex shader #define
const MAX_CHARGES = 50;

let canvas = document.getElementById('canvas');
let gl = canvas.getContext('webgl');
if (!gl) canvas.innerHTML = 'Oh no! WebGL is not supported.';

function fit_canvas_to_screen(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
fit_canvas_to_screen();
window.addEventListener('resize', fit_canvas_to_screen);

let program = misc.create_gl_program(vertex_shader_src, fragment_shader_src);
gl.useProgram(program);

//set the color we want to clear to
gl.clearColor(0, 0, 0, 1);

let a_position_loc = gl.getAttribLocation(program, 'a_position');
let a_normal_loc = gl.getAttribLocation(program, 'a_normal');
let a_color_loc = gl.getAttribLocation(program, 'a_color');
let u_world_matrix_loc = gl.getUniformLocation(program, 'u_world_matrix');
let u_view_matrix_loc = gl.getUniformLocation(program, 'u_view_matrix');
let u_light_loc = gl.getUniformLocation(program, 'u_light');

gl.enableVertexAttribArray(a_position_loc);
gl.enableVertexAttribArray(a_normal_loc);
gl.enableVertexAttribArray(a_color_loc);

const DETAIL = 3;

function gen_sphere(x,y,z,r,color){
    let steps = DETAIL/(r**(2/3));
    let step = Math.PI/steps;

    let polar_to_cart = (phi, theta, r) => [r*Math.sin(theta)*Math.sin(phi),r*Math.sin(theta)*Math.cos(phi),r*Math.cos(theta)];
    //let polar_to_cart = (phi, theta, r) => [
    //    r*Math.sin(phi*4)*Math.sin(theta)*Math.sin(phi),
    //    r*Math.sin(theta*4)*Math.sin(theta)*Math.cos(phi),
    //    r*Math.sin(theta*4)*Math.cos(theta)
    //];
    let points = [];
    let normals = [];
    let colors = [];
    for (let a = 0; a < 2*steps; a++) {
        for (let b = 0; b < steps; b++) {
            let phi = a / (2*steps) * 2 * Math.PI;
            let theta = b / (steps) * Math.PI;
            for (let p of [
                [phi, theta, r],
                [phi+step, theta, r],
                [phi+step, theta+step, r],
                [phi, theta, r],
                [phi, theta+step, r],
                [phi+step, theta+step, r]
            ]) {
                let cart = polar_to_cart(...p);
                points.push(cart[0]+x, cart[1]+y, cart[2]+z);
                normals.push(...cart);
            }
            for (let i = 0; i < 6; i++) {
                colors.push(...color);
            }
        }
    }
    return [
        points,
        normals,
        colors
    ];
}

let positions_buffer = gl.createBuffer();
let normals_buffer = gl.createBuffer();
let colors_buffer = gl.createBuffer();

var positions_len = 0;

document.getElementsByTagName('a')[0].click(); // pretend click on first element

function buffer_data(spheres) {
    let positions = [];
    let normals = [];
    let colors = [];
    for (let sphere of spheres) {
        let data = gen_sphere(...sphere);
        positions.push(...data[0]);
        normals.push(...data[1]);
        colors.push(...data[2]);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positions_buffer);
    gl.vertexAttribPointer(a_position_loc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normals_buffer);
    gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colors_buffer);
    gl.vertexAttribPointer(a_color_loc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    positions_len = positions.length;
}

//clockwise triangles are back-facing, counter-clockwise are front-facing
//switch two verticies to easily flip direction a triangle is facing
//"cull face" feature means kill (don't render) back-facing triangles
//gl.enable(gl.CULL_FACE);

//enable the z-buffer (only drawn if z component LESS than that already there)
gl.enable(gl.DEPTH_TEST);

function perspective_mat(fov, aspect, near, far){
    return [
        [ 1/(aspect*Math.tan(fov/2)),                 0,                     0,                     0],
        [                          0, 1/Math.tan(fov/2),                     0,                     0],
        [                          0,                 0, (far+near)/(far-near), 2*near*far/(near-far)],
        [                          0,                 0,                     1,                     0]
    ];
}

let fov = misc.deg_to_rad(30);
let near = 0.1; //closest z-coordinate to be rendered
let far = 50; //furthest z-coordianted to be rendered
let m_perspective;

function calculate_perspective_matrix() {
    // put in function so can call again on canvas re-size when aspect changes
    let aspect = canvas.width/canvas.height;
    m_perspective = perspective_mat(fov, aspect, near, far);
}
calculate_perspective_matrix();
window.addEventListener('resize', calculate_perspective_matrix);

let cam = [0, 0, -8]; // issues when cam is up x-axis with panning of space_pitch !!

// space is the grid
let space_yaw = 0;
let space_pitch = 0;

let light = [-1, -1, 1]; // normalised in vertex shader

function set_u_matrix(){
    // matrices in right-to-left order (i.e. in order of application)

    // rotates space according to space_yaw and space_pitch
    let m_rot = m4.multiply(m4.rotation_x(space_pitch), m4.rotation_y(space_yaw));
    //transforms in front of cam's view
    let m_view = m4.multiply(m4.inverse(m4.orient(cam, [0,0,0])), m_rot);
    //maps 3d to 2d
    let m_world = m4.multiply(m_perspective, m_view);
    gl.uniformMatrix4fv(u_world_matrix_loc, false, m4.gl_format(m_world));
    gl.uniformMatrix4fv(u_view_matrix_loc, false, m4.gl_format(m_rot));
}

function update() {
    set_u_matrix();
    gl.uniform3fv(u_light_loc, new Float32Array(light));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, positions_len / 2);
    requestAnimationFrame(update);
}

update();

function toclipspace(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1),
    ];
}

canvas.addEventListener('mousemove', function(e) {
    let sensitivity = 400;
    // if right click held down, so panning
    if (e.buttons & 1) {
        space_yaw -= e.movementX / sensitivity;
        space_pitch -= e.movementY / sensitivity;
        if (space_pitch > Math.PI/2) space_pitch = Math.PI / 2;
        if (space_pitch < -Math.PI/2) space_pitch = -Math.PI / 2;
    } else {
    }
});

canvas.addEventListener('wheel', e => {
    cam = cam.map(x => x*(1+e.deltaY*0.01));
});

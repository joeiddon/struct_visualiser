'use strict';

/*
 * Language is called OpenGL ES Shader Language or GLSL
 * for short.
 * See: https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf
 * and: https://www.khronos.org/files/opengles_shading_language.pdf
 *
 * http://learnwebgl.brown37.net/12_shader_language/glsl_control_structures.html
 */

let vertex_shader_src = `
//identifier prefixes like a_ and u_ signify types

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;

uniform mat4 u_world_matrix;
uniform mat4 u_view_matrix;

uniform vec3 u_light;

varying vec4 color;

void main(){
    gl_Position = u_world_matrix * vec4(a_position, 1);

    vec3 reflected_ray = -normalize(u_light);
    vec3 n = normalize(a_normal);
    n = (u_view_matrix * vec4(n, 1)).xyz;
    float intensity = dot(reflected_ray, n);
    if (intensity < 0.0) intensity = 0.0;
    color = vec4(a_color, 1);
    color.xyz *= (0.2 + 0.8 * intensity);
}
`;

let fragment_shader_src = `
precision mediump float;

varying vec4 color;

void main(){
    gl_FragColor = color;
}
`;

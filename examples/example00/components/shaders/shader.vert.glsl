attribute vec4 a_position;
attribute vec2 uv;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
    gl_Position = projectionMatrix * viewMatrix * a_position;
    vUv = uv;
}
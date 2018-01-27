#define PI 3.141592
#define TWO_PI 6.283184

attribute vec4 a_position;
attribute vec2 uv;
attribute vec2 customUv;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgressRate;
uniform vec2 uTrans;

varying vec2 vUv;
varying vec2 vCustomUv;
varying float vTransRate;

mat4 rotationMatrix(vec3 axis, float angle){
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {
    vec3 axis = vec3(1., 0., 0.);
    mat4 modelMatrix = rotationMatrix(axis, TWO_PI * (uProgressRate  ));
    
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * a_position;
    vUv =   uv;
    vCustomUv = customUv;
    vTransRate = 1.0;
}
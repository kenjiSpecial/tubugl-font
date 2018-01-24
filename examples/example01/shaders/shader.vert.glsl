attribute vec4 a_position;
attribute vec2 uv;
attribute vec2 customUv;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgressRate;
uniform float uTransX;

varying vec2 vUv;

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                uTransX,                                0.0,                                0.0,                                1.0);
}

void main() {
    vec3 axis = vec3(0., 1., 0.);
    mat4 modelMat = rotationMatrix(axis, 3.1415 * (uProgressRate + customUv.y/2. + customUv.x/10.));
    gl_Position = projectionMatrix * viewMatrix * modelMat * a_position;

    vUv =   uv;
}
precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;
varying float vTransRate;
varying vec2 vCustomUv;

uniform float uSmoothing;
uniform float uSdfTexel;
uniform float uHintAmount;
uniform float uSubpixelAmount;
uniform vec3 uBgColor;
uniform vec3 uFontColor;
uniform float uProgressRate;

const float curNum0 = 0.0;
const float curNum1 = 1.0;

vec2 getUv(vec2 customUv){
    float sizeX = 0.1;
    return vec2( sizeX, 1.0) *customUv + vec2( (uProgressRate - 0.5) * sizeX, 0.0); 
}


void main() {
    vec4 texColor;

    float scale = mix(0.5, 0.1, (cos(uProgressRate * 6.28 + vUv.x * 3.14/10.) + 1.)/2.) ;
    // scale = 0.1;
    vec2 uv = getUv(vec2(vUv.x, clamp( (vUv.y - 0.5 )/scale + 0.5, 0.0, 1.0)) );
    texColor = texture2D( uTexture, uv);

    if(texColor.a < 0.01)  discard;
    gl_FragColor = texColor;
    if(!gl_FrontFacing) gl_FragColor.a = gl_FragColor.a * 0.1;
}   
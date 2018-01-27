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

vec3 subpixel( float v, float a ) {
    float vt      = 0.6 * v; // 1.0 will make your eyes bleed
    vec3  rgb_max = vec3( -vt, 0.0, vt );
    float top     = abs( vt );
    float bottom  = -top - 1.0;
    float cfloor  = mix( top, bottom, a );
    vec3  res     = clamp( rgb_max - vec3( cfloor ), 0.0, 1.0 );
    return res;
}

void main() {
    // gl_FragColor = vec4(vUv, 0.0, 1.0);
    // gl_FragColor = vec4(vCustomUv, 0.0, 1.0);
    
    float sdf       = texture2D( uTexture, vUv ).a;
    float alpha       = smoothstep( 0.5 - uSmoothing, 0.5 + uSmoothing, sdf );
    if ( alpha < 20.0 / 256.0 ) discard;
    alpha = alpha * mix(0.3, 1.0, vTransRate);
    vec3 res = mix( uBgColor, uFontColor, alpha  );
    gl_FragColor = vec4(res, alpha);       
}   
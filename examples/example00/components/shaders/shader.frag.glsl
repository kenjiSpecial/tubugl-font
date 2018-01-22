precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec2 uv = vec2(vUv.x, vUv.y);
    gl_FragColor = texture2D(uTexture, uv);
    // gl_FragColor = vec4(uv, 1.0, 1.0);
    // gl_FragColor.a = 0.1;
}  
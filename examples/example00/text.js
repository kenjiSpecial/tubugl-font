import { Object3D } from 'tubugl-3d-shape/src/object3D';
import { Program, ArrayBuffer, IndexArrayBuffer, Texture } from 'tubugl-core';
import { scale } from 'gl-matrix/src/gl-matrix/mat2';

export default class Texts extends Object3D {
	constructor(gl, params = {}, text, fontData, fontTexture, fontSize = 32, textWidth = 200) {
		if (!fontData) console.warn('fontData is missing');
		if (!fontTexture) console.warn('fontTexture is missing');

		super(gl, params);

		this._text = text;

		this._fontData = fontData;
		this._fontTexture = fontTexture;
		this._fontSize = fontSize;
		this._textWidth = textWidth;

		this._makeProgram(params.vertexShaderSrc, params.fragmentShaderSrc);
		this._makeBuffer();
	}

	update(camera) {
		this._program.bind();

		this._indexBuffer.bind();
		this.positionBuffer.bind().attribPointer(this._program);
		this.uvBuffer.bind().attribPointer(this._program);

		this._; // TODO: update later for texture

		return this;
	}

	draw() {}

	render(camera) {
		this.update(camera).draw();
		return this;
	}

	_makeProgram(vertexShaderSrc, fragmentShaderSrc) {
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeBuffer() {
		let imageWidth = this._fontData.common.scaleW;
		let imageHeight = this._fontData.common.scaleH;
		let fontScale = this._fontSize / this._fontData.info.size;

		let curPosition = {
			x: 0,
			y: 0
		};
		let vertices = [];
		let uvs = [];
		let indices = [];
		for (let ii = 0; ii < this._text.length; ii++) {
			let charCode = this._text.charCodeAt(ii);
			let textFontData = this._fontData[charCode];
			let startX = curPosition.x;
			let endX = startX + textFontData.width * scale;
			let startY = 0;
			let endY = startY + textFontData.height * scale;

			let startUVX = textFontData.x / imageWidth;
			let endUVX = startUVX + textFontData.width / imageWidth;
			let startUVY = textFontData.y / imageHeight;
			let endUVY = startUVY + textFontData.height / imageHeight;

			// ------------------------

			vertices.push(startX, startY, endX, endY, endX, endY, startX, endY);
			uvs.push(startUVX, endUVX, startUVY, endUVY);
			let lastIndex = 4 * ii;
			indices.push(
				0 + lastIndex,
				2 + lastIndex,
				1 + lastIndex,
				0 + lastIndex,
				3 + lastIndex,
				2 + lastIndex
			);
		}

		this._arrayBuffer = new ArrayBuffer(this.gl, new Float32Array(vertices));
		this._arrayBuffer.setAttribs('a_position', 2, this.gl.FLOAT, false, 0, 0);

		this._uvBuffer = new ArrayBuffer(this.gl, new Float32Array(uvs));
		this._uvBuffer.setAttribs('uv', 2);

		this._indexBuffer = new IndexArrayBuffer(this.gl, new Uint16Array(indices));

		this._cnt = indices.length;
	}
}

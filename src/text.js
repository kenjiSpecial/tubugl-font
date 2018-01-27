import { Object3D } from 'tubugl-3d-shape/src/object3D';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';
import { SRC_ALPHA, ONE_MINUS_SRC_ALPHA, CULL_FACE, BACK, FRONT } from 'tubugl-constants';

const baseVertexShaderSrc = require('./shaders/shader.vert.glsl');
const baseFragmentShaderSrc = require('./shaders/shader.frag.glsl');

export class Text extends Object3D {
	constructor(gl, params = {}, text, fontData, fontTexture, fontSize = 32, textWidth) {
		super(gl, params);

		this._text = text;

		this._fontData = fontData;
		this._fontTexture = fontTexture;
		this._fontSize = fontSize;
		this._textWidth = textWidth;
		this._textAlign = params.textAlign ? params.textAlign : 'center';
		this._verticalAlign = params.verticalAlign ? params.verticalAlign : 'middle';
		this._side = params.side ? params.side : 'double';

		this.smoothing = params.smoothing ? params.smoothing : 1 / 8;
		this.hintAmount = params.hintAmount ? params.hintAmount : 1.0;
		this.subpixelAmount = params.subpixelAmount ? params.subpixelAmount : 1.0;
		this.bgColor = params.bgColor ? params.bgColor : [0, 0, 0];
		this.fontColor = params.fontColor ? params.fontColor : [1, 1, 1];

		if (this._fontData) {
			this._textureSize = this._fontData.common.scaleW;
			this.sdfTexel = 1 / this._textureSize;
		}

		this._makeProgram(
			params.vertexShaderSrc ? params.vertexShaderSrc : baseVertexShaderSrc,
			params.fragmentShaderSrc ? params.fragmentShaderSrc : baseFragmentShaderSrc
		);
		if (this._fontData && this._text) this._makeBuffer();
	}

	updateFontData(fontData) {
		this._fontData = fontData;
		this._textureSize = this._fontData.common.scaleW;
		this.sdfTexel = 1 / this._textureSize;

		if (this._fontData) this._makeBuffer();
	}

	updateFontTexture(fontTexture) {
		this._fontTexture = fontTexture;
	}

	render(camera) {
		if (this._fontTexture) this.update(camera).draw();

		return this;
	}

	update(camera) {
		this._program.bind();

		this._updateAttributes();
		this._updateModelMatrix();

		this._program.setUniformTexture(this._fontTexture, 'uTexture');
		this._fontTexture.activeTexture().bind();
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		if (this._program.getUniforms('modelMatrix'))
			this._gl.uniformMatrix4fv(
				this._program.getUniforms('modelMatrix').location,
				false,
				this.modelMatrix
			);

		let smoothingUniform = this._program.getUniforms('uSmoothing');
		let sdfTexelUniform = this._program.getUniforms('uSdfTexel');
		let hintUniform = this._program.getUniforms('uHintAmount');
		let subpixelUniform = this._program.getUniforms('uSubpixelAmount');
		let uFontColor = this._program.getUniforms('uFontColor');
		let bgColor = this._program.getUniforms('uBgColor');

		if (smoothingUniform) this._gl.uniform1f(smoothingUniform.location, this.smoothing);
		if (sdfTexelUniform) this._gl.uniform1f(sdfTexelUniform.location, this.sdfTexel);
		if (hintUniform) this._gl.uniform1f(hintUniform.location, this.hintAmount);
		if (subpixelUniform) this._gl.uniform1f(subpixelUniform.location, this.subpixelAmount);

		if (bgColor)
			this._gl.uniform3f(bgColor.location, this.bgColor[0], this.bgColor[1], this.bgColor[2]);
		if (uFontColor)
			this._gl.uniform3f(
				uFontColor.location,
				this.fontColor[0],
				this.fontColor[1],
				this.fontColor[2]
			);

		return this;
	}

	draw() {
		if (this._side === 'double') {
			this._gl.disable(CULL_FACE);
		} else if (this._side === 'front') {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(BACK);
		} else {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(FRONT);
		}

		this._gl.enable(this._gl.BLEND);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);

		this._gl.drawElements(this._gl.TRIANGLES, this._cnt, this._gl.UNSIGNED_SHORT, 0);

		return this;
	}

	_updateAttributes() {
		this._indexBuffer.bind();
		this._positionBuffer.bind().attribPointer(this._program);
		this._uvBuffer.bind().attribPointer(this._program);
	}

	_makeProgram(vertexShaderSrc, fragmentShaderSrc) {
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeBuffer() {
		console.log('makeBuffer');
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
		let textTotalWidth = this._textWidth ? this._textWidth : 0;
		let textPrevWidth = 0;
		for (let ii = 0; ii < this._text.length; ii++) {
			let charCode = this._text.charCodeAt(ii);
			let textFontData = this._fontData.chars[charCode];
			let textWidth = textFontData.width * fontScale;
			let textHeight = textFontData.height * fontScale;
			let startX = curPosition.x + textFontData.xoffset * fontScale;
			let endX = startX + textWidth;
			let startY = curPosition.y - textFontData.yoffset * fontScale;
			let endY = startY - textHeight;

			let startUVX = textFontData.x / imageWidth;
			let endUVX = startUVX + textFontData.width / imageWidth;
			let startUVY = textFontData.y / imageHeight;
			let endUVY = startUVY + textFontData.height / imageHeight;

			// ------------------------

			vertices.push(startX, startY, endX, startY, endX, endY, startX, endY);
			uvs.push(startUVX, startUVY, endUVX, startUVY, endUVX, endUVY, startUVX, endUVY);
			let lastIndex = 4 * ii;
			indices.push(
				0 + lastIndex,
				2 + lastIndex,
				1 + lastIndex,
				0 + lastIndex,
				3 + lastIndex,
				2 + lastIndex
			);

			curPosition.x += textFontData.xadvance * fontScale;

			if (!this._textWidth) {
				if (ii != this._text.length - 1)
					textTotalWidth += textFontData.xadvance * fontScale;
				else textTotalWidth += textWidth;
			}
		}
		let textTotalHeight = curPosition.y + this._fontSize;

		for (let ii = 0; ii < vertices.length; ii += 2) {
			if (this._textAlign === 'center') vertices[ii] -= textTotalWidth / 2;
			if (this._verticalAlign === 'middle') vertices[ii + 1] += textTotalHeight / 2;
		}

		if (!this._positionBuffer) {
			this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(vertices));
			this._positionBuffer.setAttribs('a_position', 2);
		} else
			this._positionBuffer
				.bind()
				.update(new Float32Array(vertices))
				.unbind();

		if (!this._uvBuffer) {
			this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(uvs));
			this._uvBuffer.setAttribs('uv', 2);
		} else
			this._uvBuffer
				.bind()
				.update(new Float32Array(uvs))
				.unbind();

		if (!this._indexBuffer)
			this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));
		else this._indexBuffer.setData(new Uint16Array(indices)).unbind();

		this._cnt = indices.length;
	}

	getIndexNumber() {
		return this._indexBuffer.dataArray.length;
	}

	addGUI(gui) {
		let textFolder = gui.addFolder('text');
		textFolder.add(this, 'smoothing', 0, 1).step(0.01);
		textFolder.add(this, 'hintAmount', 0, 1).step(0.01);
		textFolder.add(this, 'subpixelAmount', 0, 1).step(0.01);
	}
}

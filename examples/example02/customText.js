import { Text } from '../../src/text';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';

const baseVertexShaderSrc = require('./shaders/shader.vert.glsl');
const baseFragmentShaderSrc = require('./shaders/shader.frag.glsl');

const alphabets = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z'
];

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export class CustomText {
	constructor(gl, params = {}, fontData, fontTexture, fontSize = 32) {
		this._direction = params.direction;
		this._front = new SpecialText(
			gl,
			{
				side: 'front',
				type: 'a',
				transX: params.transX,
				transY: params.transY,
				direction: this._direction
			},
			this._direction === 1 ? 'a' : '0',
			fontData,
			null,
			fontSize
		);
		this._back = new SpecialText(
			gl,
			{
				side: 'front',
				type: 'b',
				transX: params.transX,
				transY: params.transY,
				direction: this._direction
			},
			this._direction === 1 ? 'b' : '1',
			fontData,
			null,
			fontSize
		);

		this._cnt = 1;
		this._rot = 0;
		this._rotSpeed = params.rotSpeed;
	}
	updateFontTexture(texture) {
		this._front.updateFontTexture(texture);
		this._back.updateFontTexture(texture);
	}
	render(camera) {
		// this._rate += 1 / 60;
		this.updateText();
		this._front.rate += this._rotSpeed;
		this._back.rate += this._rotSpeed;
		this._front.render(camera);
		this._back.render(camera);
	}
	updateText() {
		if (this._direction == 1) {
			let frontNumRate = parseInt(this._front.rate - 0.5);
			if (
				frontNumRate != 0 &&
				frontNumRate % 2 == 0 &&
				frontNumRate != parseInt(this._front.prevRate - 0.5)
			) {
				this._cnt = (this._cnt + 1) % alphabets.length;
				this._front.updateText(alphabets[this._cnt]);
			}

			if (frontNumRate % 2 == 1 && frontNumRate != parseInt(this._front.prevRate - 0.5)) {
				this._cnt = (this._cnt + 1) % alphabets.length;
				this._back.updateText(alphabets[this._cnt]);
			}
		} else {
			let frontNumRate = parseInt(this._front.rate - 0.5);
			if (frontNumRate % 2 == 1 && frontNumRate != parseInt(this._front.prevRate - 0.5)) {
				this._cnt = (this._cnt + 1) % numbers.length;
				this._front.updateText(numbers[this._cnt]);
			}

			if (
				frontNumRate > 0 &&
				frontNumRate % 2 == 0 &&
				frontNumRate != parseInt(this._front.prevRate - 0.5)
			) {
				this._cnt = (this._cnt + 1) % numbers.length;
				this._back.updateText(numbers[this._cnt]);
			}
		}
	}
}

class SpecialText extends Text {
	constructor(gl, params, textes, fontData, fontTexture, fontSize) {
		super(gl, params, textes, fontData, fontTexture, fontSize);

		if (this._direction < 0) {
			this.prevRate = 0;
			this.rate = 0;
		} else {
			this.prevRate = 0;
			this.rate = 0;
		}
		this._transX = params.transX;
		this._transY = params.transY;
		this._direction = params.direction;

		this.smoothing = 1 / 16;
		this._type = params.type;
	}

	set rate(value) {
		this.prevRate = this._rate;
		this._rate = value;
		this.progressRate = this._type == 'a' ? this._rate : this._rate + 1;
	}

	get rate() {
		return this._rate;
	}
	_updateAttributes() {
		this._indexBuffer.bind();
		this._positionBuffer.bind().attribPointer(this._program);
		this._uvBuffer.bind().attribPointer(this._program);
		this._customUvBuffer.bind().attribPointer(this._program);
	}
	_makeProgram() {
		this._program = new Program(this._gl, baseVertexShaderSrc, baseFragmentShaderSrc);
	}

	_updateModelMatrix() {}

	_makeBuffer() {
		let imageWidth = this._fontData.common.scaleW;
		let imageHeight = this._fontData.common.scaleH;
		let imageWidthSegment = 2;
		let imageHeightSegment = 20;
		let fontScale = this._fontSize / this._fontData.info.size;

		this._text = this._text.toUpperCase();
		let charCode = this._text.charCodeAt(0);
		let textFontData = this._fontData.chars[charCode];
		let textWidth = textFontData.width * fontScale;
		let textHeight = textFontData.height * fontScale;
		let startUVX = textFontData.x / imageWidth;
		let endUVX = startUVX + textFontData.width / imageWidth;
		let startUVY = textFontData.y / imageHeight;
		let endUVY = startUVY + textFontData.height / imageHeight;

		// ------------------------

		// vertices.push(startX, startY, endX, startY, endX, endY, startX, endY);
		let vertices = SpecialText.getVertices(
			textWidth,
			textHeight,
			imageWidthSegment,
			imageHeightSegment
		);
		//uvs.push(startUVX, startUVY, endUVX, startUVY, endUVX, endUVY, startUVX, endUVY);
		let { uvs, customUvs } = SpecialText.getUvs(
			imageWidthSegment,
			imageHeightSegment,
			startUVX,
			startUVY,
			endUVX,
			endUVY
		);

		let indices = SpecialText.getIndices(imageWidthSegment, imageHeightSegment);

		if (!this._positionBuffer) {
			this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(vertices));
			this._positionBuffer.setAttribs('a_position', 2);
		} else
			this._positionBuffer
				.bind()
				.setData(new Float32Array(vertices))
				.unbind();

		if (!this._uvBuffer) {
			this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(uvs));
			this._uvBuffer.setAttribs('uv', 2);
		} else
			this._uvBuffer
				.bind()
				.setData(new Float32Array(uvs))
				.unbind();

		if (!this._customUvBuffer) {
			this._customUvBuffer = new ArrayBuffer(this._gl, new Float32Array(customUvs));
			this._customUvBuffer.setAttribs('customUv', 2);
		} else
			this._customUvBuffer
				.bind()
				.setData(new Float32Array(customUvs))
				.unbind();

		if (!this._indexBuffer)
			this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));
		else this._indexBuffer.setData(new Uint16Array(indices)).unbind();

		this._cnt = indices.length;
	}

	update(camera) {
		super.update(camera);

		let progressRateUniform = this._program.getUniforms('uProgressRate');
		if (progressRateUniform)
			this._gl.uniform1f(progressRateUniform.location, this.progressRate * this._direction);
		this._gl.uniform2f(
			this._program.getUniforms('uTrans').location,
			this._transX,
			this._transY
		);

		return this;
	}

	updateText(value) {
		this._text = value;
		this._makeBuffer();
	}

	static getVertices(width, height, widthSegment, heightSegment) {
		let vertices = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		// set vertices and barycentric vertices
		for (let yy = 0; yy <= heightSegment; yy++) {
			let yPos = (-0.5 + yRate * yy) * height;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;
				vertices.push(xPos);
				vertices.push(yPos);
			}
		}
		vertices = new Float32Array(vertices);

		return vertices;
	}

	static getIndices(widthSegment, heightSegment) {
		let indices = [];

		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1);
				let nextRowStartNum = (yy + 1) * (widthSegment + 1);

				indices.push(rowStartNum + xx);
				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);

				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);
			}
		}

		indices = new Uint16Array(indices);

		return indices;
	}
	static getUvs(widthSegment, heightSegment, startUvX, startUvY, endUvX, endUvY) {
		let uvs = [];
		let customUvs = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		for (let yy = 0; yy <= heightSegment; yy++) {
			let uvY = startUvY + (1.0 - yRate * yy) * (endUvY - startUvY);
			let customUvY = 1.0 - yRate * yy;
			for (let xx = 0; xx <= widthSegment; xx++) {
				let uvX = startUvX + xRate * xx * (endUvX - startUvX);
				let customUvX = xRate * xx;

				uvs.push(uvX, uvY);
				customUvs.push(customUvX, customUvY);
			}
		}

		uvs = new Float32Array(uvs);
		customUvs = new Float32Array(customUvs);

		return { uvs: uvs, customUvs: customUvs };
	}
}

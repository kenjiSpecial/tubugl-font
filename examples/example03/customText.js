import { Text } from '../../src/text';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';

const baseVertexShaderSrc = require('./shaders/shader.vert.glsl');
const baseFragmentShaderSrc = require('./shaders/shader.frag.glsl');

export class TimeFontFace {
	constructor(gl, params = {}, fontData, fontTexture, fontSize = 32) {
		this._direction = params.direction;
		this.timeType = params.timeType ? params.timeType : 'second';
		this._oneShape = new TimeText(
			gl,
			{
				side: 'double',
				transX: 20
			},
			fontData,
			null,
			fontSize
		);

		this._tenShape = new TimeText(
			gl,
			{
				side: 'double',
				transX: -20
			},
			fontData,
			null,
			fontSize
		);
		this._progressRate = 0;
	}
	updateFontTexture(texture) {
		this._oneShape.updateFontTexture(texture);
		this._tenShape.updateFontTexture(texture);
	}
	render(camera, speed = 1) {
		this._progressRate += 1 / 60 * speed;
		this._progressRate = this._progressRate % 100;

		this._oneShape.render(camera, (parseInt(this._progressRate * 100) % 1000) / 100);
		this._tenShape.render(camera, parseInt(this._progressRate * 100) / 1000);
	}
	updateText() {}
}

export class TimeText extends Text {
	constructor(gl, params, fontData, fontTexture, fontSize) {
		super(gl, params, null, fontData, fontTexture, fontSize);

		this._makeBuffer();

		this.prevRate = 0;
		this.rate = 0;

		this._type = params.type;
		this._transX = params.transX;
		this._progressRate = 0;

		if (this._type === 'a') this._advance = 1;
		else this._advance = 0;
	}

	_updateAttributes() {
		this._indexBuffer.bind();
		this._positionBuffer.bind().attribPointer(this._program);
		this._uvBuffer.bind().attribPointer(this._program);
	}
	_makeProgram() {
		this._program = new Program(this._gl, baseVertexShaderSrc, baseFragmentShaderSrc);
	}

	_updateModelMatrix() {}

	_makeBuffer() {
		let imageWidth = 60; //86; //this._fontData.common.scaleW;
		let imageHeight = 60; //86; //this._fontData.common.scaleH;
		let imageWidthSegment = 2;
		let imageHeightSegment = 100;

		let verticesArray = [];
		let uvsArray = [];
		let indicesArray = [];

		this.getVertices(
			verticesArray,
			imageWidth,
			imageHeight,
			imageWidthSegment,
			imageHeightSegment
		);

		this.getUvs(uvsArray, imageWidthSegment, imageHeightSegment);

		this.getIndices(indicesArray, imageWidthSegment, imageHeightSegment);

		if (!this._positionBuffer) {
			this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(verticesArray));
			this._positionBuffer.setAttribs('a_position', 3);
		} else
			this._positionBuffer
				.bind()
				.setData(new Float32Array(verticesArray))
				.unbind();

		if (!this._uvBuffer) {
			this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(uvsArray));
			this._uvBuffer.setAttribs('uv', 2);
		} else
			this._uvBuffer
				.bind()
				.setData(new Float32Array(uvsArray))
				.unbind();

		if (!this._indexBuffer)
			this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indicesArray));
		else this._indexBuffer.setData(new Uint16Array(indicesArray)).unbind();

		this._cnt = indicesArray.length;
	}

	render(camera, progressRate) {
		this.update(camera, progressRate).draw();
		return this;
	}
	updateUniforms(progressRate) {
		let progressRateUniform = this._program.getUniforms('uProgressRate');
		if (progressRateUniform) this._gl.uniform1f(progressRateUniform.location, progressRate);

		let transXUniform = this._program.getUniforms('uTransX');
		if (transXUniform) this._gl.uniform1f(transXUniform.location, this._transX);
		else console.warn("'uTranX' is not used in your program");
	}

	update(camera, progressrate) {
		super.update(camera);

		this.updateUniforms(progressrate);

		return this;
	}

	updateText(value) {
		this._text = value;
		this._makeBuffer();
	}

	getVertices(verticeArray, width, height, widthSegment, heightSegment) {
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		for (let yy = 0; yy <= heightSegment; yy++) {
			let theta = yRate * yy * 2 * Math.PI;
			let yPos = Math.cos(theta) * 80;
			let zPos = Math.sin(theta) * 60;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;

				verticeArray.push(xPos);
				verticeArray.push(yPos);
				verticeArray.push(zPos);
			}
		}
	}

	getIndices(indices, widthSegment, heightSegment, num = 0) {
		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1);
				+num;
				let nextRowStartNum = (yy + 1) * (widthSegment + 1) + num;

				indices.push(rowStartNum + xx);
				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);

				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);
			}
		}
	}
	getUvs(uvs, widthSegment, heightSegment) {
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		for (let yy = 0; yy <= heightSegment; yy++) {
			let uvy = 1.0 - yRate * yy;
			for (let xx = 0; xx <= widthSegment; xx++) {
				let uvx = xRate * xx;

				uvs.push(uvx, uvy);
			}
		}
	}
}

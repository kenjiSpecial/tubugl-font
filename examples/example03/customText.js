import { Text } from '../../src/text';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';

const baseVertexShaderSrc = require('./shaders/shader.vert.glsl');
const baseFragmentShaderSrc = require('./shaders/shader.frag.glsl');

const alphabets = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	':',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9'
];

export class TimeFontFace {
	constructor(gl, params = {}, fontData, fontTexture, fontSize = 32) {
		this._direction = params.direction;
		this.timeType = params.timeType ? params.timeType : 'second';
		this._front = new TimeText(
			gl,
			{
				side: 'double',
				type: 'a'
			},
			fontData,
			null,
			fontSize
		);

		this._back = new TimeText(
			gl,
			{
				side: 'front',
				type: 'b'
			},
			fontData,
			null,
			fontSize
		);
	}
	updateFontTexture(texture) {
		this._front.updateFontTexture(texture);
		this._back.updateFontTexture(texture);
	}
	render(camera, speed) {
		this._front.rate += this._rotSpeed * speed;
		this._back.rate += this._rotSpeed * speed;
		this._front.render(camera);
		// this._back.render(camera);
	}
	updateText() {
		// if (this._direction == 1) {
		// 	let frontNumRate = parseInt(this._front.rate - 0.5);
		// 	if (
		// 		frontNumRate != 0 &&
		// 		frontNumRate % 2 == 0 &&
		// 		frontNumRate != parseInt(this._front.prevRate - 0.5)
		// 	) {
		// 		this._cnt = (this._cnt + 1) % alphabets.length;
		// 		this._front.updateText(alphabets[this._cnt]);
		// 	}
		// 	if (frontNumRate % 2 == 1 && frontNumRate != parseInt(this._front.prevRate - 0.5)) {
		// 		this._cnt = (this._cnt + 1) % alphabets.length;
		// 		this._back.updateText(alphabets[this._cnt]);
		// 	}
		// } else {
		// 	let frontNumRate = parseInt(this._front.rate - 0.5);
		// 	if (frontNumRate % 2 == 1 && frontNumRate != parseInt(this._front.prevRate - 0.5)) {
		// 		this._cnt = (this._cnt + 1) % numbers.length;
		// 		this._front.updateText(numbers[this._cnt]);
		// 	}
		// 	if (
		// 		frontNumRate > 0 &&
		// 		frontNumRate % 2 == 0 &&
		// 		frontNumRate != parseInt(this._front.prevRate - 0.5)
		// 	) {
		// 		this._cnt = (this._cnt + 1) % numbers.length;
		// 		this._back.updateText(numbers[this._cnt]);
		// 	}
		// }
	}
}

export class TimeText extends Text {
	constructor(gl, params, fontData, fontTexture, fontSize) {
		super(gl, params, null, fontData, fontTexture, fontSize);

		this._makeBuffer();

		this.prevRate = 0;
		this.rate = 0;

		this.smoothing = 1 / 16;
		this._type = params.type;

		if (this._type === 'a') this._advance = 1;
		else this._advance = 0;
	}
	_getTime() {
		let date = new Date();
		let sec = date.getSeconds() % 10;
		return sec.toString(); //sec < 10 ? ('0' + sec).toString() : sec.toString();
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
		let imageHeightSegment = 40;
		let fontScale = this._fontSize / this._fontData.info.size;

		this._text = this._getTime();

		let textTotalWidth = 0;
		let num = 0;
		let startPosX = 0;
		let startPosY = 0;
		let verticesArray = [];
		let uvsArray = [];
		let customUvsArray = [];
		let indicesArray = [];

		for (var ii = 0; ii < this._text.length; ii++) {
			let charCode = this._text.charCodeAt(ii);
			let textFontData = this._fontData.chars[charCode];
			let textWidth = textFontData.width * fontScale;
			let textHeight = textFontData.height * fontScale;
			let startUVX = textFontData.x / imageWidth;
			let endUVX = startUVX + textFontData.width / imageWidth;
			let startUVY = textFontData.y / imageHeight;
			let endUVY = startUVY + textFontData.height / imageHeight;

			// ------------------------

			this.getVertices(
				verticesArray,
				textWidth,
				textHeight,
				imageWidthSegment,
				imageHeightSegment,
				startPosX,
				startPosY
			);

			this.getUvs(
				uvsArray,
				customUvsArray,
				imageWidthSegment,
				imageHeightSegment,
				startUVX,
				startUVY,
				endUVX,
				endUVY
			);

			this.getIndices(indicesArray, imageWidthSegment, imageHeightSegment, num);

			num += (imageWidthSegment + 1) * (imageHeightSegment + 1);

			textTotalWidth += textFontData.xadvance * fontScale;
			startPosX = textTotalWidth;
		}

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

		if (!this._customUvBuffer) {
			this._customUvBuffer = new ArrayBuffer(this._gl, new Float32Array(customUvsArray));
			this._customUvBuffer.setAttribs('customUv', 2);
		} else
			this._customUvBuffer
				.bind()
				.setData(new Float32Array(customUvsArray))
				.unbind();

		if (!this._indexBuffer)
			this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indicesArray));
		else this._indexBuffer.setData(new Uint16Array(indicesArray)).unbind();

		this._cnt = indicesArray.length;
	}
	_getProgress() {
		let d = new Date();

		let sec = d.getSeconds() % 10;
		let progress = d.getMilliseconds() / 1000;

		return { value: sec + progress, rate: progress };
	}

	update(camera) {
		// console.log(this._getProgress());
		super.update(camera);

		let progress = this._getProgress();

		let progressRateUniform = this._program.getUniforms('uProgressRate');
		if (progressRateUniform) this._gl.uniform1f(progressRateUniform.location, progress.rate);

		return this;
	}

	updateText(value) {
		this._text = value;
		this._makeBuffer();
	}

	getVertices(verticeArray, width, height, widthSegment, heightSegment, startPosX, startPosY) {
		// let vertices = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		// set vertices and barycentric vertices
		for (let yy = 0; yy <= heightSegment; yy++) {
			// let yPos = (-0.5 + yRate * yy) * height + startPosY;
			let theta = yRate * yy * 2 * Math.PI;
			let yPos = Math.cos(theta) * 30;
			let zPos = Math.sin(theta) * 30;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width + startPosX;

				verticeArray.push(xPos);
				verticeArray.push(yPos);
				verticeArray.push(zPos);
			}
		}
	}

	getIndices(indices, widthSegment, heightSegment, num) {
		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1) + num;
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
	getUvs(uvs, customUvs, widthSegment, heightSegment, startUvX, startUvY, endUvX, endUvY) {
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
	}
}

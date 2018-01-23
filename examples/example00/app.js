const dat = require('../vendors/dat.gui.min');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');

import { Program, ArrayBuffer, IndexArrayBuffer, Texture } from 'tubugl-core';
import { Text } from './text';

import vertexShader from './components/shaders/shader.vert.glsl';
import fragmentShader from './components/shaders/shader.frag.glsl';
// import { appCall } from '../../src/index'

import json from '../assets/roboto.json';
import imgURL from '../assets/roboto.png';

import { OrthographicCamera } from 'tubugl-camera';

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		} else {
			let descId = document.getElementById('tubugl-desc');
			descId.style.display = 'none';
		}

		this._makeProgram();
		this._makeCamera();
		this.resize(this._width, this._height);
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
	}

	_makeText() {
		// this._text = new Text(this.gl, {}, 'a');
	}

	_makeProgram() {
		this._program = new Program(this.gl, vertexShader, fragmentShader);
		let imageWidth = json.common.scaleW;
		let imageHeight = json.common.scaleH;
		console.log(json);
		let charCode = 'A'.charCodeAt(0);
		let scale = 16 / json.info.size;
		let fontData = json.chars[charCode];
		let startX = -fontData.width / 2 * scale;
		let endX = startX + fontData.width * scale;
		let startY = fontData.height / 2 * scale;
		let endY = startY - fontData.height * scale;

		let vertices = new Float32Array([startX, startY, endX, startY, endX, endY, startX, endY]);

		// console.log(imageWidth, imageHeight);
		let startUVX = fontData.x / imageWidth;
		let endUVX = startUVX + fontData.width / imageWidth;
		let startUVY = fontData.y / imageHeight;
		let endUVY = startUVY + fontData.height / imageHeight;

		let uv = new Float32Array([
			startUVX,
			startUVY,
			endUVX,
			startUVY,
			endUVX,
			endUVY,
			startUVX,
			endUVY
		]);

		let indices = new Uint16Array([0, 2, 1, 0, 3, 2]);

		this._arrayBuffer = new ArrayBuffer(this.gl, vertices);
		this._arrayBuffer.setAttribs('a_position', 2, this.gl.FLOAT, false, 0, 0);

		this._uvBuffer = new ArrayBuffer(this.gl, uv);
		this._uvBuffer.setAttribs('uv', 2);

		this._indexBuffer = new IndexArrayBuffer(this.gl, indices);

		this._obj = {
			program: this._program,
			positionBuffer: this._arrayBuffer,
			uvBuffer: this._uvBuffer,
			indexBuffer: this._indexBuffer,
			count: 6
		};
	}

	_makeCamera() {
		this._orthographicCamera = new OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			1,
			2000
		);

		this._orthographicCamera.position.z = 100;
		this._orthographicCamera.lookAt([0, 0, 0]);
	}

	_makeTexture() {
		this._fontTexture = new Texture(this.gl, this.gl.RGBA, this.gl.RGBA);
		this._fontTexture
			.bind()
			.setFilter()
			.wrap()
			.fromImage(this._fontImg, this._fontImg.width, this._fontImg.height);
	}

	_startLoad() {
		this._loadedCnt = 0;
		this._fontImg = new Image();
		this._fontImg.onload = () => {
			this._makeTexture();
			this.start();
		};
		this._fontImg.src = imgURL;
	}

	animateIn() {
		this._startLoad();
	}

	start() {
		this.isLoop = true;
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._obj.program.bind();
		this._obj.indexBuffer.bind();
		this._obj.positionBuffer.bind().attribPointer(this._obj.program);
		this._obj.uvBuffer.bind().attribPointer(this._obj.program);
		this._obj.program.setUniformTexture(this._fontTexture, 'uTexture');
		this._fontTexture.activeTexture().bind();
		this.gl.uniformMatrix4fv(
			this._obj.program.getUniforms('viewMatrix').location,
			false,
			this._orthographicCamera.viewMatrix
		);
		this.gl.uniformMatrix4fv(
			this._obj.program.getUniforms('projectionMatrix').location,
			false,
			this._orthographicCamera.projectionMatrix
		);

		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);

		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.BLEND);

		this.gl.drawElements(this.gl.TRIANGLES, this._obj.count, this.gl.UNSIGNED_SHORT, 0);
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	mouseMoveHandler(mouse) {
		if (!this._isMouseDown) return;

		this._prevMouse = mouse;
	}

	mouseDownHandler(mouse) {
		this._isMouseDown = true;
		this._prevMouse = mouse;
	}

	mouseupHandler() {
		this._isMouseDown = false;
	}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenLite.ticker.addEventListener('tick', this.loop, this);
			this.playAndStopGui.name('pause');
		} else {
			TweenLite.ticker.removeEventListener('tick', this.loop, this);
			this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		this.canvas.width = this._width;
		this.canvas.height = this._height;
		this.gl.viewport(0, 0, this._width, this._height);
		this._orthographicCamera.updateSize(
			-this._width / 2,
			this._width / 2,
			this._height / 2,
			-this._height / 2
		);
	}

	destroy() {}
}

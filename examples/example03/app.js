const dat = require('../vendors/dat.gui.min');
const TweenLite = require('gsap/src/uncompressed/TweenLite');
const Stats = require('stats.js');

import { Texture } from 'tubugl-core';
import { TimeFontFace, TimeText } from './customText';

// import json from '../assets/robotoBold.json';
import imgURL from '../assets/robotoCustom.png';

import { OrthographicCamera } from 'tubugl-camera';

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');

		this._isAnimateIn = false;
		this._isLoaded = false;

		this._speed = 1;

		this.resize(this._width, this._height);
		this._makeCamera();
		this._makeClock();

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		} else {
			let descId = document.getElementById('tubugl-desc');
			descId.style.display = 'none';
		}
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		this.gui
			.add(this, '_speed', 0.1, 2.0)
			.step(0.01)
			.name('rotationSpeed');
	}

	_makeClock() {
		let fontSize = 30;
		this._textes = [];

		this._textes.push(new TimeFontFace(this.gl, {}, null, null, fontSize));
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

		this._textes.forEach(text => {
			text.updateFontTexture(this._fontTexture);
		});
	}

	_startLoad() {
		this._loadedCnt = 0;
		this._fontImg = new Image();
		this._fontImg.onload = () => {
			this._isLoaded = true;
			this._makeTexture();
			if (this._isAnimateIn) this.start();
		};
		this._fontImg.src = imgURL;
	}

	animateIn() {
		this._isAnimateIn = true;
		this._startLoad();
		// if (this._isLoaded) this.start();
	}

	start() {
		this.isLoop = true;
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this._textes.forEach(text => {
			text.render(this._orthographicCamera, this._speed);
		});
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	mouseMoveHandler(mouse) {
		// this._prevMouse = mouse;
	}

	mouseDownHandler(mouse) {}

	mouseupHandler() {}

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
		if (this._orthographicCamera)
			this._orthographicCamera.updateSize(
				-this._width / 2,
				this._width / 2,
				this._height / 2,
				-this._height / 2
			);
		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	destroy() {}
}

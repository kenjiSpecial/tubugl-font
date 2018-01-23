import { Text } from '../../src/text';

export class CustomText extends Text {
	constructor(gl, params = {}, text, fontData, fontTexture, fontSize = 32, textWidth) {
		super(gl, params, text, fontData, fontTexture, fontSize, textWidth);
	}
}

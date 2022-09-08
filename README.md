# ![icon](https://github.com/kokseen1/Mashiro/blob/main/images/mashiro.png?raw=true) Mashiro

Mashiro is a Chrome extension to sort illustrations and manga by popularity on Pixiv. 

It works by looking for the tag with the suffix `users入り` that is automatically applied on posts that surpass a certain amount of likes. This extension does not enable the official `Sort by popularity` mode, and thus will not have 100% accurate results.

## Demo

![demo](https://github.com/kokseen1/Mashiro/blob/main/images/demo.gif?raw=true)

## Installation
1. Clone this repository
2. Visit `chrome://extensions` in Chrome
3. Turn on Developer mode
4. Click `Load unpacked`
5. Select the `Mashiro` folder

## Guide
- Button turns **orange** if results from normal search are available
- Otherwise, button turns **blue** if only alternative results are available
- **Grey** button means no results are available

## Usage Notes
 - Works best with official Pixiv series tags used by artists. (orange + blue mode)
	 - Examples:
	 	- `エヴァ` instead of `エヴァンゲリオン`
	 	- `SAO` instead of `ソードアート・オンライン`
 - Most character tags are supported! (blue mode)
	 - Examples:
 		- `歳納京子`
 		- `御坂美琴`
 - Works well with popular generic tags.
	 - Examples:
		 - `オリジナル`
		 - `風景`
 - Only Illustrations and Manga are currently supported.

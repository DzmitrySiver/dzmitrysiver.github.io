/**
 * Created by Dzmitry_Siver on 9/22/2015.
 */

(function () {

	var ROWS = 4,
		COLS = 4;

	function initArray(numbersArray) {
		
		var gameField;

		shuffle(numbersArray);

		gameField = new Array(ROWS);

		for (var i = 0; i < 4; i++) {
			gameField[i] = new Array(COLS);
			for (var j = 0; j < 4; j++) {
				gameField[i][j] = numbersArray.pop() || 0;
			}
		}

		console.log(arr);
	}

	function shuffle(array) {
		var currentIndex = array.length,
			temporaryValue,
			randomIndex;

		while (currentIndex !== 0) {

			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

	function createNumbersArray() {
		var numbersArray = [];

		for (var i = 1; i < (ROWS * COLS); i++) {
			numbersArray.push(i);
		}

		debugger;

		initArray(numbersArray);

		//var tile = document.createElement('div');
		//		tile.innerHTML = i + 1;
		//		tile.className = "tile tile_" + i;
		//		coords = getCoords(getRandomId());
		//		setPosition(tile, coords);
		//		game.appendChild(tile);
	}

	createNumbersArray();


})();
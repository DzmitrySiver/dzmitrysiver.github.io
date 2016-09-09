/**
 * Created by dzmitry_siver on 9/30/2015.
 */

(function(){

	var gameField = [
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 1, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 0]
		];
	var ROWS = gameField.length;
	var COLS = gameField[0].length;
	var gameWrapper = document.getElementById("gameWrapper");

	for (var i = 0; i < ROWS; i++) {
		for (var j = 0; j < COLS; j++ ) {
			if (gameField[i][j] === 1) {
				console.log(i + ", " + j);
			}
		}
	}

})();
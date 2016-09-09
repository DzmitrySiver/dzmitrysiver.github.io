/**
 * Created by Dzmitry_Siver on 9/22/2015.
 */

(function () {

	function getCoords(id) { //returns column and row according to id
		var coords = {};
		coords.x = id % TILES_COUNT;
		coords.y = parseInt(id / TILES_COUNT);
		return coords;
	}

	function setPosition(element, coords) { //set the tile position (pixels offsets) according to column and row
		element.style.left = coords.x * TILE_SIZE + "px";
		element.style.top = coords.y * TILE_SIZE + "px";
	}

	function getPosition(element) { //gets tile position (pixels offsets)
		var position = {};
		position.x = parseInt(element.style.left);
		position.y = parseInt(element.style.top);
		return position;
	}

	function getEmptyPosition() { //gets Empty tile position (pixels offsets)
		var position = {};
		position.x = parseInt(empty.style.left);
		position.y = parseInt(empty.style.top);
		return position;
	}

	function isMovable(position, emptyPosition) { // returns true if the neighbor if Empty.
		if (( Math.abs(position.x - emptyPosition.x) == TILE_SIZE && Math.abs(position.y - emptyPosition.y) == 0 ) ||
			( Math.abs(position.x - emptyPosition.x) == 0 && Math.abs(position.y - emptyPosition.y) == TILE_SIZE )) {
			return true;
		}
	}

	function moveTile(element) { // Swaps places with Empty tile
		var position = getPosition(element);
		var emptyPosition = getEmptyPosition();
		var temp;
		if (isMovable(position, emptyPosition)) {
			temp = position;
			element.style.top = emptyPosition.y + "px";
			element.style.left = emptyPosition.x + "px";
			empty.style.top = temp.y + "px";
			empty.style.left = temp.x + "px";
		}
	}

	function getRandomId() { // getting random id from array for shuffling
		var rand = Math.floor(Math.random() * availableIds.length);
		return availableIds.splice(rand, 1);
	}

	function revealTiles() { // starts revealing tiles from id = 0
		revealTile(0); // function "revealTiles" created to prevent naming confusion
	}

	function revealTile(id) { // sets timeout to wait for css transition finish
		var tile;
		setTimeout(function () {
			if (id < TILES_TOTAL - 1) {
				tile = document.getElementById(id);
				tile.className = tile.className + " lazy-loaded";
				id++;
				revealTile(id);
			}
		}, 50);
	}

	function init() {

		game.style.width = TILE_SIZE * TILES_COUNT + "px";
		game.style.height = TILE_SIZE * TILES_COUNT + "px";

		var tile, coords;
		for (var i = 0; i < TILES_TOTAL - 1; i++) { // fills the id's array
			availableIds.push(i);
		}
		for (i = 0; i < TILES_TOTAL - 1; i++) { // creates tiles
			tile = document.createElement('div');
			tile.innerHTML = i + 1;
			tile.id = i;
			tile.className = "tile tile_" + i;

			tile.style.width = TILE_SIZE + "px";
			tile.style.height = TILE_SIZE + "px";
			tile.style.lineHeight = TILE_SIZE - 10 + "px";

			coords = getCoords(getRandomId()); // random id is used for position shuffling
			setPosition(tile, coords);
			game.appendChild(tile);
		}

		tile = document.createElement('div'); // empty tile generation
		tile.className = "empty";
		tile.id = "empty";
		coords = getCoords(TILES_TOTAL - 1);
		setPosition(tile, coords);
		game.appendChild(tile);

		empty = document.getElementById("empty");

		revealTiles(); // Could just run revealTile(0), but this one looks much better

		game.addEventListener("click", function () { // click listener with event delegation
			var target = event.target;
			if (target.className.indexOf('tile') > -1) {
				moveTile(target);
			}
		})
	}


// ================== EXECUTABLE CODE GOES BELOW ===========================

	var game = document.getElementById("gameWrapper"),
		availableIds = [],
		empty,

		// ============= GAME SETTINGS =============
		TILES_COUNT = 4, // Number of tiles in a row
		TILES_TOTAL = TILES_COUNT * TILES_COUNT,
		TILE_SIZE = 100;
		// ============= GAME SETTINGS =============

	init();

})();
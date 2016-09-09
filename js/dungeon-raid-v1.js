/**
 * Created by Dzmitry_Siver on 9/5/2016.
 */

function DungeonRaidGame(options) {

	this.options = {
		colsNumber: options.colsNumber || 4,
		rowsNumber: options.rowsNumber || 4,
		tileSize: options.tileSize || 100,
		dragActive: false,
		activeType: '',
		activeTiles: [],
		lastActiveTile: {
			row: null,
			col: null
		},
		activeColumns: {},
		tilesClassList: [
			'sword',
			'shield',
			'skull'
		]
	};

	this.virtualGameField = [];

	this.events = function () {

		var self = this,
			opts = self.options;

		gameField.addEventListener('mousedown', function (e) {
			var target = e.target,
				targetRow,
				targetCol;

			if (Array.prototype.indexOf.call(target.classList, 'tile') !== -1) {
				targetRow = target.getAttribute('row');
				targetCol = target.getAttribute('col');

				self.addActiveTile(targetRow, targetCol);
				target.classList.add('active');
			}
		}, false);

		gameField.addEventListener('mouseup', function (e) {
			opts.dragActive = false;

			if (opts.activeTiles.length > 2) {
				self.deleteActiveTiles();
			}

			self.resetActiveTiles();
		}, false);

		gameField.addEventListener('mouseover', function (e) {
			var target = e.target,
				targetRow,
				targetCol;

			if (opts.dragActive) {
				if (Array.prototype.indexOf.call(target.classList, 'tile') !== -1) {

					if (Array.prototype.indexOf.call(target.classList, 'active') === -1) {

						targetRow = target.getAttribute('row');
						targetCol = target.getAttribute('col');

						if (self.isNeigbour(targetRow, targetCol) && self.isCompatible(targetRow, targetCol)) {
							self.addActiveTile(targetRow, targetCol);
							target.classList.add('active');
						}
					}
				}
			}
		}, false);
	};

	this.isCompatible = function (row, col) {
		var opts = this.options,
			targetType;

		targetType = this.virtualGameField[row][col].type;

		return (opts.activeType === targetType);
	};

	this.isNeigbour = function (row, col) {
		var opts = this.options;

		return ((Math.abs(row - opts.lastActiveTile.row) < 2)
		&&
		((Math.abs(col - opts.lastActiveTile.col) < 2)));
	};

	this.addActiveTile = function (row, col) {
		var opts = this.options,
			virtualTile;

		virtualTile = this.virtualGameField[row][col];
		virtualTile.active = true;
		opts.lastActiveTile.row = row;
		opts.lastActiveTile.col = col;
		opts.activeType = virtualTile.type;
		opts.activeTiles.push({
			col: col,
			row: row
		});
		opts.activeColumns[col]++;
		opts.dragActive = true;
	};

	this.deleteActiveTiles = function () {
		var opts = this.options,
			i,
			iLen = opts.activeTiles.length,
			row,
			col;

		if (iLen > 2) {

			for (i = 0; i < iLen; i++) {
				row = opts.activeTiles[i].row;
				col = opts.activeTiles[i].col;
				document.getElementById('' + row + col).remove();
				this.virtualGameField[row][col] = null;
			}

			this.shiftTiles();
			opts.activeTiles = [];
			opts.lastActiveTile = {};
		}
	};

	this.shiftTiles = function () {
		var opts = this.options,
			columnChanged,
			shiftNumber = 0,
			row,
			newRow,
			col,
			virtualTile,
			tile;

		for (col = 0; col < opts.colsNumber; col++) {

			columnChanged = opts.activeColumns[col];

			// TODO: set columnChanged to Boolean;  
			if (columnChanged > 0) {
				for (row = opts.rowsNumber - 1; row >= 0; row--) {
					virtualTile = this.virtualGameField[row][col];

					if (!virtualTile) {
						shiftNumber++
					} else {
						if (shiftNumber > 0) {
							newRow = row + shiftNumber;
							this.virtualGameField[newRow][col] = this.virtualGameField[row][col];
							this.virtualGameField[row][col] = null;

							tile = document.getElementById('' + row + col);
							tile.id = '' + newRow + col;
							tile.setAttribute('row', newRow);

							//TODO: Function to calculate coords;
							tile.style.top = newRow * opts.tileSize + 10 + 'px';
						}
					}

				}

				for (row = 0; row < shiftNumber; row++) {
					this.createTile(row, col, shiftNumber);
				}
				this.revealTiles();

				shiftNumber = 0;
			}
		}
	};
	
	this.revealTiles = function () {
		var hiddenTiles;

		hiddenTiles = document.querySelectorAll('.hidden');
		for (var i = 0; i < hiddenTiles.length; i++) {
			hiddenTiles[i].classList.remove('hidden');
		}
	};

	this.createTile = function (row, col, shiftNumber) {
		var opts = this.options,
			tile,
			tileType;

		tileType = opts.tilesClassList[Math.floor(Math.random() * opts.tilesClassList.length)];

		this.virtualGameField[row][col] = {
			type: tileType,
			active: false
		};

		tile = document.createElement('div');
		tile.id = '' + row + col;
		tile.className = 'hidden tile ' + tileType;
		tile.setAttribute('type', tileType);
		tile.setAttribute('row', row);
		tile.setAttribute('col', col);
		tile.style.width = opts.tileSize - 20 + 'px';
		tile.style.height = opts.tileSize - 20 + 'px';
		tile.style.lineHeight = opts.tileSize - 30 + 'px';
		// tile.innerHTML = tileType;

		if (shiftNumber) {
			var self = this;

			this.setTilePosition(tile, row - shiftNumber, col);

			gameField.appendChild(tile);

			setTimeout(function () {
				self.setTilePosition(tile, row, col);
			},200);

		} else {
			this.setTilePosition(tile, row, col);
			gameField.appendChild(tile);
		}
	};

	this.resetActiveTiles = function () {
		var opts = this.options,
			activeDOMTiles,
			i,
			iLen;

		opts.activeTiles = [];
		activeDOMTiles = gameField.querySelectorAll('.active');
		iLen = activeDOMTiles.length;

		for (i = 0; i < iLen; i++) {
			activeDOMTiles[i].classList.remove('active')
		}
	};

	/**
	 * Fill gameField with tiles
	 */
	this.createTiles = function () {
		var row,
			col,
			opts = this.options;

		for (row = 0; row < opts.rowsNumber; row++) {
			this.virtualGameField[row] = new Array(opts.colsNumber);
			for (col = 0; col < opts.colsNumber; col++) {

				if (!opts.activeColumns[col]) {
					opts.activeColumns[col] = 0;
				}

				this.createTile(row, col);
			}
		}
		this.revealTiles();
	};

	this.setTilePosition = function (element, row, col) {
		var opts = this.options;

		element.style.top = row * opts.tileSize + 10 + 'px';
		element.style.left = col * opts.tileSize + 10 + 'px';
	};

	this.init = function () {
		var opts = this.options;

		gameField.style.width = opts.tileSize * opts.colsNumber + 'px';
		gameField.style.height = opts.tileSize * opts.rowsNumber + 'px';

		this.createTiles();
		this.events();
	};

	var gameField = document.getElementById('gameWrapper');

	this.init();

}
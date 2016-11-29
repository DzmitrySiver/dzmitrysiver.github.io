/**
 * Created by Dzmitry_Siver on 9/5/2016.
 */

;function DungeonRaidGame(options) {

	var game = {
		objects: {
			gameField: document.getElementById('gameWrapper')
		},
		options: {
			colsNumber: options.colsNumber || 4,
			rowsNumber: options.rowsNumber || 4,
			tileSize: options.tileSize || 100,
			tileMargin: 20,
			isMobile: false,
			dragActive: false,
			activeType: '',
			activeTiles: [],
			lastActiveTile: {
				row: null,
				col: null
			},
			penultActiveTile: {
				row: null,
				col: null
			},
			columnsChanged: {},
			tilesClassList: [
				'weapon',
				'armor',
				'enemy',
				'money',
				'health'
			],
			health: 100,
			score: 0,
			money: 0
		},
		virtualGameField: [],

		/**
		 * Mouse events
		 */
		events: function () {
			var self = this,
				objs = self.objects;

			// Mouse down
			objs.gameField.addEventListener('mousedown', self.mouseDownHandler.bind(self));
			objs.gameField.addEventListener('touchstart', self.mouseDownHandler.bind(self));

			// Mouse over
			objs.gameField.addEventListener('mouseover', self.mouseOverHandler.bind(self));
			objs.gameField.addEventListener('touchmove', self.mouseOverHandler.bind(self));

			//Mouse up
			document.addEventListener('touchend', self.mouseUpHandler.bind(self));
			document.addEventListener('mouseup', self.mouseUpHandler.bind(self));

			// Mouse leave
			objs.gameField.addEventListener('mouseleave', self.mouseLeaveHandler.bind(self));
		},


		// ==========================================
		// ========== Mouse event handlers ==========
		// ==========================================

		/**
		 * Mouse down event handler
		 */
		mouseDownHandler: function (e) {
			var opts = this.options,
				target = e.target,
				targetRow,
				targetCol,
				virtualTile;

			if (e.button === 2) {
				e.stopPropagation();
				e.preventDefault();
				return;
			}

			if (target.classList.contains('tile')) {

				opts.activeTiles = [];

				targetRow = target.getAttribute('row');
				targetCol = target.getAttribute('col');
				virtualTile = this.virtualGameField[targetRow][targetCol];

				opts.activeType = virtualTile.type;
				this.addActiveTile(targetRow, targetCol);
				target.classList.add('active');
			}
		},

		/**
		 * Mouse over event handler
		 */
		mouseOverHandler: function (e) {
			var opts = this.options,
				target = e.target,
				targetRow,
				targetCol;

			if (opts.dragActive) {
				e.preventDefault();
				e.stopPropagation();

				// get element from coordinates (for touchmove event only)
				if (e.touches) {
					target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
				}

				if (target && target.classList.contains('tile')) {

					targetRow = target.getAttribute('row');
					targetCol = target.getAttribute('col');

					if (target.classList.contains('active')) {
						if(targetRow === opts.penultActiveTile.row && targetCol === opts.penultActiveTile.col) {
							this.revertMove();
							return;
						} else {
							return;
						}
					}
					targetRow = target.getAttribute('row');
					targetCol = target.getAttribute('col');

					if (this.virtualGameField[targetRow][targetCol].active === false) {
						if (this.isNeighbour(targetRow, targetCol) && this.isCompatible(targetRow, targetCol)) {
							this.addActiveTile(targetRow, targetCol);
							target.classList.add('active');
						}
					}
				}
			}
		},

		/**
		 * Mouse up event handler
		 */
		mouseUpHandler: function () {
			var opts = this.options;

			if (opts.dragActive) {
				opts.dragActive = false;

				if (opts.activeTiles.length > 2) {
					this.deleteActiveTiles();
				}

				this.resetActiveTiles();
			}
		},

		/**
		 * Mouse leave event handler
		 */
		mouseLeaveHandler: function () {
			var opts = this.options;

			opts.dragActive = false;

			if (opts.activeTiles.length > 2) {
				this.deleteActiveTiles();
			}

			this.resetActiveTiles();
		},


		// ==========================================
		// ============= Tiles checking =============
		// ==========================================

		/**
		 * Check if given tile is neighbour for last active tile
		 * @param row {Number} Row number
		 * @param col {Number} Col Number
		 * @returns {boolean}
		 */
		isNeighbour: function (row, col) {
			var opts = this.options;

			return (
				(Math.abs(row - opts.lastActiveTile.row) < 2)
				&&
				(Math.abs(col - opts.lastActiveTile.col) < 2)
			);
		},

		/**
		 * Check if given tile is compatible with active type
		 * @param row {Number} Row number
		 * @param col {Number} Col Number
		 * @returns {boolean}
		 */
		isCompatible: function (row, col) {
			var opts = this.options,
				targetType;

			targetType = this.virtualGameField[row][col].type;

			// TODO: uncomment to enable Enemy-Weapon compatibility
			if ((opts.activeType === 'weapon' || opts.activeType === 'enemy') && (targetType === 'weapon' || targetType === 'enemy')) {
				return true;
			}
			return (opts.activeType === targetType);
		},


		// ==========================================
		// ============== Active tiles ==============
		// ==========================================

		/**
		 * Add given tile to set of active tiles
		 * @param row {Number}
		 * @param col {Number}
		 */
		addActiveTile: function (row, col) {
			var opts = this.options;

			this.addActiveArrow(row, col);

			if (opts.lastActiveTile.row && opts.lastActiveTile.col) {
				opts.penultActiveTile.row = opts.lastActiveTile.row;
				opts.penultActiveTile.col = opts.lastActiveTile.col;
			}
			opts.lastActiveTile.row = row;
			opts.lastActiveTile.col = col;
			opts.activeTiles.push({
				col: col,
				row: row
			});
			opts.columnsChanged[col] = true;
			opts.dragActive = true;
		},

		/**
		 * Add an arrow to show the way of tile selecting
		 * @param row {Number}
		 * @param col {Number}
		 */
		addActiveArrow: function (row, col) {
			var opts = this.options,
				lastActiveCol,
				lastActiveRow,
				directionX = '',
				directionY = '',
				lastActiveTile;

			lastActiveCol = opts.lastActiveTile.col;
			lastActiveRow = opts.lastActiveTile.row;

			if (!lastActiveCol || !lastActiveRow) {
				return;
			}

			lastActiveTile = document.getElementById('' + lastActiveRow + lastActiveCol);

			if (row > lastActiveRow) {
				directionY = 'Bottom';
			} else if (row < lastActiveRow) {
				directionY = 'Top';
			}

			if (col > lastActiveCol) {
				directionX = 'Right';
			} else if (col < lastActiveCol) {
				directionX = 'Left';
			}

			lastActiveTile.classList.add('line' + directionY + directionX);
		},

		revertMove: function () {
			var opts = this.options,
				activeTilesCount,
				lastActiveRow,
				lastActiveCol,
				lastActiveEl,
				penultActiveRow,
				penultActiveCol,
				penultActiveEl;

			activeTilesCount = opts.activeTiles.length;
			if (activeTilesCount >= 2) {
				lastActiveRow = opts.lastActiveTile.row;
				lastActiveCol = opts.lastActiveTile.col;
				lastActiveEl = document.getElementById('' + lastActiveRow + lastActiveCol);
				lastActiveEl.classList.remove('active');

				penultActiveRow = opts.penultActiveTile.row;
				penultActiveCol = opts.penultActiveTile.col;
				penultActiveEl = document.getElementById('' + penultActiveRow + penultActiveCol);
				penultActiveEl.classList.remove('lineTop', 'lineTopRight', 'lineRight', 'lineBottomRight', 'lineBottom', 'lineBottomLeft', 'lineLeft', 'lineTopLeft');

				opts.lastActiveTile.row = penultActiveRow;
				opts.lastActiveTile.col = penultActiveCol;
				if (activeTilesCount === 2) {
					opts.penultActiveTile.row = null;
					opts.penultActiveTile.col = null;
				} else {
					opts.penultActiveTile.row = opts.activeTiles[activeTilesCount - 3].row; // -1 for zero index, -1 for penult tile, -1 for previous tile
					opts.penultActiveTile.col = opts.activeTiles[activeTilesCount - 3].col;
				}
				opts.activeTiles.pop();

			}
		},

		/**
		 * Delete active tiles
		 */
		deleteActiveTiles: function () {
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
				if (opts.activeType === 'money') {
					this.addMoney(iLen);
				}
				if (opts.activeType === 'health') {
					this.addHealth(iLen);
				}
				this.addScore(iLen);
				this.shiftTiles();
				opts.activeTiles = [];
				opts.lastActiveTile = {};

				this.enemyMove();
			}
		},

		/**
		 * Add user score
		 * @param addedScore {Number}
		 */
		addScore: function (addedScore) {
			var opts = this.options,
				scoreBlock = document.getElementById('score');

			addedScore *= addedScore;
			opts.score += addedScore;
			scoreBlock.innerHTML = opts.score;
		},

		/**
		 * Add user money
		 * @param addedMoney {Number}
		 */
		addMoney: function (addedMoney) {
			var opts = this.options,
				moneyBlock = document.getElementById('money');

			opts.money += addedMoney;
			moneyBlock.innerHTML = opts.money;
		},

		/**
		 * Add user health
		 * @param addedHealth {Number}
		 */
		addHealth: function (addedHealth) {
			var opts = this.options;

			opts.health += addedHealth * 5;
			this.updateHealth();
		},

		updateHealth: function () {
			var opts = this.options,
				healthBlock = document.getElementById('health');

			healthBlock.innerHTML = opts.health;

			if (opts.health === 0) {
				document.getElementById('gameOver').classList.add('visible');
			}
		},

		enemyMove: function () {
			var opts = this.options,
				col,
				row,
				virtualTile,
				totalAttack = 0;

			for (col = 0; col < opts.colsNumber; col++) {
				for (row = opts.rowsNumber - 1; row >= 0; row--) {
					virtualTile = this.virtualGameField[row][col];

					if (virtualTile.type === 'enemy') {
						totalAttack += virtualTile.attack;
					}
				}
			}

			opts.health > totalAttack ? opts.health -= totalAttack : opts.health = 0;

			this.updateHealth();
		},

		/**
		 * Shift tiles down to fill the gaps
		 */
		shiftTiles: function () {
			var opts = this.options,
				columnChanged,
				shiftNumber = 0,
				row,
				newRow,
				col,
				virtualTile,
				tile;

			for (col = 0; col < opts.colsNumber; col++) {

				columnChanged = opts.columnsChanged[col];

				if (columnChanged) {
					// goes from bottom to top in each changed column.
					// free spots increases shiftNumber
					// tiles moved down for shiftNumber
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
								tile.style.transform = 'translateY(' + (newRow * opts.tileSize + 10) + 'px)';
							}
						}
					}

					for (row = 0; row < shiftNumber; row++) {
						this.createTile(row, col, shiftNumber);
					}

					shiftNumber = 0;
					opts.columnsChanged[col] = false;
				}
			}
		},

		/**
		 * Create new tile with given coords
		 * @param row {Number}
		 * @param col {Number}
		 * @param shiftNumber {Number} Number of rows for tile to fall through
		 */
		createTile: function (row, col, shiftNumber) {
			var self = this,
				objs = self.objects,
				opts = self.options,
				tile,
				tileType,
				tileLabel,
				attackLabel,
				attack;

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
			tile.style.width = opts.tileSize - opts.tileMargin + 'px';
			tile.style.height = opts.tileSize - opts.tileMargin + 'px';
			tile.style.lineHeight = opts.tileSize - 30 + 'px';

			if (tileType === 'enemy') {
				tileLabel = document.createElement('div');
				tileLabel.id = 'label' + row + col;
				tileLabel.className = 'tileLabel';

				attackLabel = document.createElement('div');
				attackLabel.className = 'attackLabel';

				tile.appendChild(tileLabel);
				tileLabel.appendChild(attackLabel);

				attack = Math.floor(Math.random() * 3) + 1;
				attackLabel.innerHTML = attack;

				this.virtualGameField[row][col].attack = attack;
			}

			if (shiftNumber) {
				this.setTilePosition(tile, row - shiftNumber, col);

				objs.gameField.appendChild(tile);

				setTimeout(function () {
					self.setTilePosition(tile, row, col);
				}, 200);

			} else {
				this.setTilePosition(tile, row, col);
				objs.gameField.appendChild(tile);
			}
		},

		/**
		 * Remove active class and clear selection
		 */
		resetActiveTiles: function () {
			var opts = this.options,
				objs = this.objects,
				activeDOMTiles,
				i,
				iLen,
				virtualTile,
				row,
				col;

			iLen = opts.activeTiles.length;
			for (i = 0; i < iLen; i++) {
				row = opts.activeTiles[i].row;
				col = opts.activeTiles[i].col;
				virtualTile = this.virtualGameField[row][col];
				virtualTile.active = false;
			}

			opts.activeTiles = [];
			activeDOMTiles = objs.gameField.querySelectorAll('.active');
			iLen = activeDOMTiles.length;

			for (i = 0; i < iLen; i++) {
				activeDOMTiles[i].classList.remove('active', 'lineTop', 'lineTopRight', 'lineRight', 'lineBottomRight', 'lineBottom', 'lineBottomLeft', 'lineLeft', 'lineTopLeft');
			}

			delete opts.lastActiveTile.row;
			delete opts.lastActiveTile.col;
			opts.columnsChanged = {};
		},

		/**
		 * Fill gameField with tiles
		 */
		createTiles: function () {
			var row,
				col,
				opts = this.options;

			for (row = 0; row < opts.rowsNumber; row++) {
				this.virtualGameField[row] = new Array(opts.colsNumber);
				for (col = 0; col < opts.colsNumber; col++) {

					if (opts.columnsChanged[col] === undefined) {
						opts.columnsChanged[col] = false;
					}

					this.createTile(row, col, opts.rowsNumber);
				}
			}
		},

		/**
		 * Set the tile to its position according to row and col number.
		 * @param element
		 * @param row
		 * @param col
		 */
		setTilePosition: function (element, row, col) {
			var opts = this.options;

			element.style.transform = 'translateY(' + (row * opts.tileSize + 10) + 'px)';
			element.style.left = col * opts.tileSize + opts.tileMargin / 2 + 'px';
		},


		/**
		 * Calculate tile size to fit in small screen
		 */
		calculateTileSize: function () {
			var opts = this.options,
				defaultWidth,
				defaultHeight,
				windowWidth,
				windowHeight;

			defaultWidth = opts.tileSize * opts.colsNumber;
			defaultHeight = opts.tileSize * opts.rowsNumber;
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;

			if (windowWidth < defaultWidth || windowHeight < defaultHeight) {
				opts.isMobile = true;
				opts.tileMargin = 10;
				if (Math.abs(defaultWidth - windowWidth) > Math.abs(defaultHeight - windowHeight)) {
					opts.tileSize = windowWidth / opts.colsNumber;
				} else {
					opts.tileSize = windowHeight / opts.rowsNumber;
				}
			}
		},

		/**
		 * Game initialization
		 */
		init: function () {
			var self = this,
				opts = self.options,
				objs = self.objects;

			this.calculateTileSize();

			objs.gameField.style.width = opts.tileSize * opts.colsNumber + 'px';
			objs.gameField.style.height = opts.tileSize * opts.rowsNumber + 'px';

			// TODO: WTF?
			setTimeout(function () {
				self.createTiles();
				self.events();
			}, 200);

		}
	};

	game.init();

}
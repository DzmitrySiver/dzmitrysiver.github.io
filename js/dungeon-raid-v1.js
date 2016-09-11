/**
 * Created by Dzmitry_Siver on 9/5/2016.
 */

;function DungeonRaidGame(options) {

    this.objects = {
        gameField: document.getElementById('gameWrapper')
    };

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
        columnsChanged: {},
        tilesClassList: [
            'weapon',
            'armor',
            'enemy',
            'money',
            'health'
        ]
    };

    this.virtualGameField = [];

    this.events = function () {

        var self = this,
            opts = self.options,
            objs = self.objects;

        objs.gameField.addEventListener('mousedown', function (e) {
            var target = e.target,
                targetRow,
                targetCol,
                virtualTile;

            if (e.button === 2) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            if (Array.prototype.indexOf.call(target.classList, 'tile') !== -1) {
                targetRow = target.getAttribute('row');
                targetCol = target.getAttribute('col');
                virtualTile = self.virtualGameField[targetRow][targetCol];

                opts.activeType = virtualTile.type;
                self.addActiveTile(targetRow, targetCol);
                target.classList.add('active');
            }
        }, false);

        document.addEventListener('mouseup', function (e) {
            opts.dragActive = false;

            if (opts.activeTiles.length > 2) {
                self.deleteActiveTiles();
            }

            self.resetActiveTiles();
        }, false);

        objs.gameField.addEventListener('mouseover', function (e) {
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
                    } else {
                        // TODO: remember user selection path for undo
                    }
                }
            }
        }, false);
    };

    this.isCompatible = function (row, col) {
        var opts = this.options,
            targetType;

        targetType = this.virtualGameField[row][col].type;

        if ((opts.activeType === 'weapon' || opts.activeType === 'enemy') && (targetType === 'weapon' || targetType === 'enemy')) {
            return true;
        }
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
        // opts.activeType = virtualTile.type;
        opts.activeTiles.push({
            col: col,
            row: row
        });
        opts.columnsChanged[col] = true;
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
                            tile.style.top = newRow * opts.tileSize + 10 + 'px';
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
    };

    /**
     * Creates new tile with (row, col) coords.
     * @param row {Number} Row
     * @param col {Number} Col
     * @param shiftNumber {Number} Number of rows for tile to fall through
     */
    this.createTile = function (row, col, shiftNumber) {
        var self = this,
            objs = self.objects,
            opts = self.options,
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
    };

    /**
     * Remove tiles selection and active classes
     */
    this.resetActiveTiles = function () {
        var opts = this.options,
            objs = this.objects,
            activeDOMTiles,
            i,
            iLen;

        opts.activeTiles = [];
        activeDOMTiles = objs.gameField.querySelectorAll('.active');
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

                if (opts.columnsChanged[col] === undefined) {
                    opts.columnsChanged[col] = false;
                }

                this.createTile(row, col, opts.rowsNumber);
            }
        }
    };

    /**
     * Set the tile to its position according to row and col number.
     * @param element
     * @param row
     * @param col
     */
    this.setTilePosition = function (element, row, col) {
        var opts = this.options;

        element.style.top = row * opts.tileSize + 10 + 'px';
        element.style.left = col * opts.tileSize + 10 + 'px';
    };

    this.init = function () {
        var self = this,
            opts = self.options,
            objs = self.objects;

        objs.gameField.style.width = opts.tileSize * opts.colsNumber + 'px';
        objs.gameField.style.height = opts.tileSize * opts.rowsNumber + 'px';

        setTimeout(function () {
            self.createTiles();
            self.events();
        }, 200);

    };

    this.init();

}
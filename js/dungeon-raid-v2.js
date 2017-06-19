/**
 * Created by Dzmitry_Siver on 9/5/2016.
 */

;function DungeonRaidGame(options) {

    var game = {
        objects: {
            gameField: document.getElementById('gameWrapper'),
            gameOverlay: document.getElementById('gameWrapperOverlay'),
            bottomBlock: document.getElementById('bottomBlock'),
            gameOverOverlay: document.getElementById('gameOver'),
            scoreBlock: document.getElementById('score'),
            moneyBlock: document.getElementById('money'),
            healthBlock: document.getElementById('health'),
            defenceBlock: document.getElementById('defence'),
            collectedBlock: document.getElementById('totalCollected'),
            collectedValue: document.getElementById('totalCollectedValue'),

            healSound: null,
            hitSound: null,
            weaponSound: null,
            armorSound: null,
            coinsSound: null
        },
        options: {
            overlayAnimationTime: 600,
            enemyAttackAnimationTime: 300,
            colsNumber: options.colsNumber || 4,
            rowsNumber: options.rowsNumber || 4,
            tileSize: options.tileSize || 100,
            tileMargin: 20,
            isMobile: false,
            dragActive: false,
            cursorOffset: 15,
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
            weaponCount: 0,
            health: 100,
            maxHealth: 100,
            bottleHealthRestore: 5,
            baseDamage: 3,
            weaponDamage: 3,
            defence: 3,
            maxDefence: 20,
            score: 0,
            money: 0,
            damage: 0
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

            // Mouse move
            objs.gameField.addEventListener('mousemove', self.mouseMoveHandler.bind(self));
            objs.gameField.addEventListener('touchmove', self.mouseMoveHandler.bind(self));

            //Mouse up
            document.addEventListener('touchend', self.mouseUpHandler.bind(self));
            document.addEventListener('mouseup', self.mouseUpHandler.bind(self));

            window.addEventListener('contextmenu', function (e) {
                e.preventDefault(e);
                e.stopPropagation(e);
                return false;
            });

            // Mouse leave
            // objs.gameField.addEventListener('mouseleave', self.mouseLeaveHandler.bind(self));
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
                objs = this.objects,
                targetRow,
                targetCol,
                virtualTile;

            if (e.button === 2 || e.buttons === 2) {
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
                objs.collectedBlock.classList.add('visible');
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
                        if (targetRow === opts.penultActiveTile.row && targetCol === opts.penultActiveTile.col) {
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
            var opts = this.options,
                objs = this.objects;

            if (opts.dragActive) {
                opts.dragActive = false;
                if (opts.activeTiles.length > 2) {
                    this.deleteActiveTiles();
                }
                this.resetActiveTiles();

                objs.collectedBlock.classList.remove('visible');
            }
        },

        /**
         * Mouse move event handler
         */
        mouseMoveHandler: function (e) {
            var opts = this.options,
                objs = this.objects;

            if (opts.dragActive) {
                e.preventDefault();
                e.stopPropagation();

                if (e.changedTouches && e.changedTouches[0]) {
                    objs.collectedBlock.style.transform = 'translate(' + (opts.cursorOffset + e.changedTouches[0].pageX) + 'px, ' + (opts.cursorOffset + e.changedTouches[0].pageY) + 'px)';
                } else {
                    objs.collectedBlock.style.transform = 'translate(' + (opts.cursorOffset + e.pageX) + 'px, ' + (opts.cursorOffset + e.pageY) + 'px)';
                }
            }
        },

        // /**
        //  * Mouse leave event handler
        //  */
        // mouseLeaveHandler: function () {
        // 	var opts = this.options;
        //
        // 	opts.dragActive = false;
        //
        // 	if (opts.activeTiles.length > 2) {
        // 		this.deleteActiveTiles();
        // 	}
        //
        // 	this.resetActiveTiles();
        // },


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
            var opts = this.options,
                tileType;

            this.addActiveArrow(row, col);

            if (opts.lastActiveTile.row && opts.lastActiveTile.col) {
                opts.penultActiveTile.row = opts.lastActiveTile.row;
                opts.penultActiveTile.col = opts.lastActiveTile.col;
            }
            tileType = this.virtualGameField[row][col].type;
            opts.lastActiveTile.row = row;
            opts.lastActiveTile.col = col;
            opts.activeTiles.push({
                col: col,
                row: row,
                type: tileType
            });

            if (tileType === 'enemy') {
                this.calculateDamage();
            }
            if (tileType === 'weapon') {
                opts.weaponCount++;
                this.calculateDamage();
            }

            this.collectValues();

            opts.columnsChanged[col] = true;
            opts.dragActive = true;

            // console.log(opts.weaponCount * opts.weaponDamage + opts.baseDamage);
        },

        collectValues: function () {
            var objs = this.objects,
                opts = this.options;

            if (opts.activeType === 'enemy') {
                objs.collectedValue.innerHTML = opts.damage;
            }
            if (opts.activeType === 'weapon') {
                objs.collectedValue.innerHTML = opts.damage;
            }
            if (opts.activeType === 'health') {
                objs.collectedValue.innerHTML = opts.activeTiles.length * 5;
            }
            if (opts.activeType === 'armor') {
                objs.collectedValue.innerHTML = opts.activeTiles.length;
            }
            if (opts.activeType === 'money') {
                objs.collectedValue.innerHTML = opts.activeTiles.length;
            }
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
                lastActiveEl.classList.remove('active', 'killed');
                if (this.virtualGameField[lastActiveRow][lastActiveCol].type === 'weapon') {
                    opts.weaponCount--;
                }
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
                this.calculateDamage();
            }
            this.collectValues();
        },

        /**
         * Delete active tiles
         */
        deleteActiveTiles: function () {
            var opts = this.options,
                objs = this.objects,
                i,
                iLen = opts.activeTiles.length,
                row,
                col;

            if (iLen > 2) {
                objs.gameOverlay.classList.add('visible');
                for (i = 0; i < iLen; i++) {
                    row = opts.activeTiles[i].row;
                    col = opts.activeTiles[i].col;
                    if (this.virtualGameField[row][col].type === 'enemy') {
                        this.damageEnemy(row, col);
                    } else {
                        this.deleteTile(row, col);
                    }
                }

                if (opts.activeType === 'money') {
                    this.addMoney(iLen);
                }
                if (opts.activeType === 'health') {
                    this.addHealth(iLen);
                }
                if (opts.activeType === 'armor') {
                    this.addArmor(iLen);
                }

                this.addScore(iLen);
                this.shiftTiles();
                opts.weaponCount = 0;
                opts.activeTiles = [];
                opts.lastActiveTile = {};

                this.enemyTurn();
            }
        },

        damageEnemy: function (row, col) {
            var opts = this.options,
                objs = this.objects;

            if (opts.weaponCount) {
                objs.weaponSound.play();
            } else {
                objs.hitSound.play();
            }

            this.virtualGameField[row][col].health -= opts.damage;
            if (this.virtualGameField[row][col].health < 1) {
                this.deleteTile(row, col);

                // TODO: Add experience;

            } else {
                this.updateEnemyHealth(row, col);
            }
        },

        calculateDamage: function () {
            var opts = this.options,
                virtualTile,
                tile,
                row,
                col,
                type,
                i,
                iLen;

            opts.damage = opts.baseDamage + opts.weaponCount * opts.weaponDamage;
            iLen = opts.activeTiles.length;

            for (i = 0; i < iLen; i++) {
                type = opts.activeTiles[i].type;

                if (type === 'enemy') {
                    row = opts.activeTiles[i].row;
                    col = opts.activeTiles[i].col;
                    virtualTile = this.virtualGameField[row][col];

                    tile = document.getElementById('' + row + col);
                    if (opts.damage >= virtualTile.health) {
                        tile.classList.add('killed');
                    } else {
                        tile.classList.remove('killed');
                    }
                }
            }
        },

        updateEnemyHealth: function (row, col) {
            var enemyHealth;

            enemyHealth = this.virtualGameField[row][col].health;
            document.getElementById('health' + row + col).innerHTML = enemyHealth;
        },

        deleteTile: function (row, col) {
            document.getElementById('' + row + col).remove();
            this.virtualGameField[row][col] = null;
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
                tile,
                enemyHealthLabel,
                enemyAttackLabel;

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
                                enemyHealthLabel = document.getElementById('health' + row + col);
                                enemyAttackLabel = document.getElementById('attack' + row + col);
                                tile.id = '' + newRow + col;
                                if (enemyHealthLabel) {
                                    enemyHealthLabel.id = 'health' + newRow + col;
                                }
                                if (enemyAttackLabel) {
                                    enemyAttackLabel.id = 'attack' + newRow + col;
                                }
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

            opts.weaponCount = 0;
            this.calculateDamage();
            opts.activeTiles = [];
            activeDOMTiles = objs.gameField.querySelectorAll('.active');
            iLen = activeDOMTiles.length;

            for (i = 0; i < iLen; i++) {
                activeDOMTiles[i].classList.remove('killed', 'active', 'lineTop', 'lineTopRight', 'lineRight', 'lineBottomRight', 'lineBottom', 'lineBottomLeft', 'lineLeft', 'lineTopLeft');
            }

            delete opts.lastActiveTile.row;
            delete opts.lastActiveTile.col;
            opts.columnsChanged = {};
        },


        // ==========================================
        // ============= Miscellaneous ==============
        // ==========================================

        /**
         * Add user score
         * @param addedScore {Number}
         */
        addScore: function (addedScore) {
            var opts = this.options,
                objs = this.objects;

            addedScore *= addedScore;
            opts.score += addedScore;
            if (objs.scoreBlock) {
                objs.scoreBlock.innerHTML = opts.score;
            }
        },

        /**
         * Add user money
         * @param addedMoney {Number}
         */
        addMoney: function (addedMoney) {
            var opts = this.options,
                objs = this.objects;

            objs.coinsSound.play();
            if (objs.moneyBlock) {
                opts.money += addedMoney;
                objs.moneyBlock.innerHTML = opts.money;
            }
        },

        /**
         * Add user health
         * @param addedHealth {Number}
         */
        addHealth: function (addedHealth) {
            var opts = this.options,
                objs = this.objects;

            objs.healSound.play();
            opts.health += addedHealth * opts.bottleHealthRestore;
            if (opts.health > opts.maxHealth) {
                opts.health = opts.maxHealth;
            }
            this.updateHealth();
        },

        addArmor: function (addedArmor) {
            var opts = this.options,
                objs = this.objects;

            objs.armorSound.play();
            opts.defence += addedArmor;
            if (opts.defence > opts.maxDefence) {
                opts.defence = opts.maxDefence;
            }
            this.updateDefence();
        },

        updateHealth: function () {
            var opts = this.options,
                objs = this.objects;

            if (objs.healthBlock) {
                objs.healthBlock.innerHTML = opts.health;
            }

            if (opts.health === 0) {
                objs.gameOverOverlay.classList.add('visible');
            }
        },

        updateDefence: function () {
            var opts = this.options,
                objs = this.objects;

            if (objs.defenceBlock) {
                objs.defenceBlock.innerHTML = opts.defence;
            }

        },

        enemyTurn: function () {
            var self = this,
                opts = self.options,
                objs = self.objects,
                col,
                row,
                virtualTile,
                defenceDamage,
                activeEnemy,
                activeEnemies = [],
                totalAttack = 0,
                i,
                iLen;

            for (col = 0; col < opts.colsNumber; col++) {
                for (row = opts.rowsNumber - 1; row >= 0; row--) {
                    virtualTile = self.virtualGameField[row][col];

                    if (virtualTile.type === 'enemy') {
                        if (virtualTile.isActive) {
                            activeEnemy = document.getElementById('' + row + col);
                            activeEnemy.classList.add('visible');
                            activeEnemies.push(activeEnemy);
                            totalAttack += virtualTile.attack;
                        } else {
                            virtualTile.isActive = true;
                        }
                    }
                }
            }

            setTimeout(function () {

                defenceDamage = Math.floor(totalAttack / 3);

                if (totalAttack > opts.defence) {
                    totalAttack -= opts.defence;
                } else {
                    totalAttack = 0;
                }

                if (opts.defence > defenceDamage) {
                    opts.defence -= defenceDamage;
                } else {
                    opts.defence = 0;
                }

                if (opts.health > totalAttack) {
                    opts.health -= totalAttack;
                } else {
                    opts.health = 0;
                }

                if (activeEnemies.length) {
                    objs.hitSound.play();
                }

                self.updateDefence();
                self.updateHealth();

                setTimeout(function () {
                    iLen = activeEnemies.length;
                    if (iLen) {
                        for (i = 0; i < iLen; i++) {
                            activeEnemies[i].classList.remove('visible');
                        }
                    }

                    objs.gameOverlay.classList.remove('visible');
                }, opts.enemyAttackAnimationTime);

            }, opts.overlayAnimationTime);

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
                enemyAttackLabel,
                enemyHealthLabel,
                enemyAttack,
                enemyHealth;

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

                enemyAttackLabel = document.createElement('div');
                enemyAttackLabel.className = 'enemyAttackLabel';
                enemyAttackLabel.id = 'attack' + row + col;

                enemyHealthLabel = document.createElement('div');
                enemyHealthLabel.className = 'enemyHealthLabel';
                enemyHealthLabel.id = 'health' + row + col;

                tile.appendChild(tileLabel);
                tileLabel.appendChild(enemyAttackLabel);
                tileLabel.appendChild(enemyHealthLabel);

                enemyAttack = Math.floor(Math.random() * 3) + 1;
                enemyHealth = Math.floor(Math.random() * 15) + 1;
                enemyAttackLabel.innerHTML = enemyAttack;
                enemyHealthLabel.innerHTML = enemyHealth;

                this.virtualGameField[row][col].attack = enemyAttack;
                this.virtualGameField[row][col].health = enemyHealth;
                this.virtualGameField[row][col].isActive = false;
            }

            if (shiftNumber) {
                this.setTilePosition(tile, row - shiftNumber, col);

                objs.gameField.appendChild(tile);

                // WTF?
                setTimeout(function () {
                    self.setTilePosition(tile, row, col);
                }, 200);

            } else {
                this.setTilePosition(tile, row, col);
                objs.gameField.appendChild(tile);
            }
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

        initSounds: function () {
            var objs = this.objects;

            objs.healSound = document.createElement('audio');
            objs.healSound.src = 'sounds/heal.mp3';

            objs.hitSound = document.createElement('audio');
            objs.hitSound.src = 'sounds/hit.mp3';

            objs.weaponSound = document.createElement('audio');
            objs.weaponSound.src = 'sounds/sword.mp3';

            objs.armorSound = document.createElement('audio');
            objs.armorSound.src = 'sounds/armor.mp3';

            objs.coinsSound = document.createElement('audio');
            objs.coinsSound.src = 'sounds/coins.mp3';
        },

        /**
         * Game initialization
         */
        init: function () {
            var self = this,
                opts = self.options,
                objs = self.objects,
                gameWidth,
                gameHeight;

            this.initSounds();
            this.calculateTileSize();

            gameHeight = opts.tileSize * opts.rowsNumber + 'px';
            gameWidth = opts.tileSize * opts.colsNumber + 'px';
            objs.gameField.style.width = gameWidth;
            objs.gameField.style.height = gameHeight;
            objs.bottomBlock.style.width = gameWidth;

            // TODO: WTF?
            setTimeout(function () {
                self.createTiles();
                self.events();
            }, 200);

        }
    };

    game.init();

}

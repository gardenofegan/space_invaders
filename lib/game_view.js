const Game = require('./game');

const GameView = function(ctx, canvasSize) {
  this.ctx = ctx;
  this.canvasSize = canvasSize;
  this.game = new Game({
    canvasSize: this.canvasSize,
    ctx: this.ctx,
    gameView: this
  });
  this.defender = this.game.defender;
  this.isPaused = false;

  this.rightPressed = false;
  this.leftPressed = false;
  this.spacePressed = false;
  this.startButtonPressed = false;
  this.startButtonCooldown = false;
  this.startButtonCooldownTime = 500; // milliseconds
  this.lastTime = 0;
  this.fps = 60;
  this.isMuted = false;

  this.addKeyListeners();
  this.startGamepadInput();
};

GameView.prototype.toggleAudio = function() {
  this.isMuted = this.isMuted ? false : true;
};

GameView.prototype.start = function() {
  this.interval = setInterval(() => {
    if (!this.isPaused) {
      this.game.draw(this.ctx);
      this.addLivesText(this.ctx);
      this.addScoreText(this.ctx);
      this.addLevelText(this.ctx);
      this.moveDefender();
      this.game.moveInvaders();
      this.game.addUfo();
      this.game.step();
    }
  }, 10);

  // Animate enemy sprites
  this.toggle = setInterval(() => {
    if (!this.isPaused) this.game.toggleInvaders();
  }, 500);
};

GameView.prototype.stop = function() {
  clearInterval(this.interval);
  clearInterval(this.toggle);

  this.interval     = null;
  this.toggle       = null;
  this.rightPressed = false;
  this.leftPressed  = false;
  this.spacePressed = false;
  this.isPaused     = false;
  this.startButtonPressed = false;
  

  this.game = new Game({
    canvasSize: this.canvasSize,
    gameView:   this,
    ctx:        this.ctx
  });

  this.defender     = this.game.defender;
};

GameView.prototype.restart = function() {
  this.stop();
  this.start();
};

GameView.prototype.welcome = function() {
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.game.DIM_X, this.game.DIM_Y);
};

GameView.prototype.pause = function() {
  this.isPaused = true;
};

GameView.prototype.resume = function() {
  this.isPaused = false;
};

GameView.prototype.gameOver = function() {
  this.stop();

  document.getElementById('menu-container').className='hide';

  setTimeout(() => {
    this.ctx.clearRect(0, 0, this.DIM_X, this.DIM_Y);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.game.DIM_X, this.game.DIM_Y);
    let gameOverImage  = document.getElementById('game-over'),
        playGameButton = document.getElementById('play-game');
    playGameButton.className = '';
    gameOverImage.className = '';
  }, 600);

};

GameView.KEY_BINDS = {
  'left': [-2, 0],
  'right': [2, 0]
};

GameView.prototype.addLivesText = function(ctx) {
  let x = this.game.DIM_X * .87, y = this.game.DIM_Y * .05;

  ctx.font = "23px Bungee Inline";
  ctx.fillText(`LIVES: ${this.game.defenderLives}`, x, y);
};

GameView.prototype.addMenu = function(ctx) {
  let x = this.game.DIM_X * .5, y = this.game.DIM_Y * .1;
};

GameView.prototype.addScoreText = function(ctx) {
  let x = this.game.DIM_X * .01, y = this.game.DIM_Y * .05;
  // ctx.find = "20px Georgia";
  ctx.fillText(`SCORE: ${this.game.score}`, x, y);
};

GameView.prototype.addLevelText = function(ctx) {
  let x = this.game.DIM_X * .01, y = this.game.DIM_Y * .95;
  ctx.fillText(`LEVEL: ${this.game.level}`, x, y);
}

GameView.prototype.bindKeyHandlers = function() {
  const defender = this.defender;

  Object.keys(GameView.KEY_BINDS).forEach(k => {
    let offset = GameView.KEY_BINDS[k];
    key(k, function() { defender.power(offset); });
  });

  key('space', function() { defender.fireBullet(); });
};

GameView.prototype.addKeyListeners = function() {
  document.addEventListener('keydown', this.handleKeyDown.bind(this));
  document.addEventListener('keyup', this.handleKeyUp.bind(this));
};

GameView.prototype.handleKeyDown = function(e) {
  if (e.keyCode === 37) { // left arrow
    this.leftPressed = true;
  } else if (e.keyCode === 39) { // right arrow
    this.rightPressed = true;
  } else if (e.keyCode === 32) { // spacebar
    if (!this.game || !this.game.isStarted || this.game.isGameOver) {
      this.startButtonPressed = true;
    }
    this.spacePressed = true;
  }
  e.preventDefault();
};

GameView.prototype.handleKeyUp = function(e) {
  if (e.keyCode === 37) { // left arrow
    this.leftPressed = false;
  } else if (e.keyCode === 39) { // right arrow
    this.rightPressed = false;
  } else if (e.keyCode === 32) { // spacebar
    this.spacePressed = false;
  }
};

GameView.prototype.startGamepadInput = function() {
  this.gamepadState = {
    leftPressed: false,
    rightPressed: false,
    firePressed: false,
    startPressed: false
  };

  const gamepadHandler = () => {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      // Handle joystick
      const newLeftPressed = gamepad.axes[0] < -0.5;
      const newRightPressed = gamepad.axes[0] > 0.5;
      
      // Handle fire button (assuming it's the first button, index 0)
      const newFirePressed = gamepad.buttons[0].pressed;

      // Handle start button (assuming it's button 11)
      const newStartPressed = gamepad.buttons[11].pressed;

      // Check for changes in button states
      if (newLeftPressed !== this.gamepadState.leftPressed) {
        this.gamepadState.leftPressed = newLeftPressed;
        this.leftPressed = newLeftPressed;
      }

      if (newRightPressed !== this.gamepadState.rightPressed) {
        this.gamepadState.rightPressed = newRightPressed;
        this.rightPressed = newRightPressed;
      }

      if (newFirePressed !== this.gamepadState.firePressed) {
        this.gamepadState.firePressed = newFirePressed;
        this.spacePressed = newFirePressed;
      }

      // Handle start button with cooldown
      if (newStartPressed && !this.startButtonCooldown && (!this.game || !this.game.isStarted || this.game.isGameOver)) {
        this.startButtonPressed = true;
        this.startButtonCooldown = true;
        setTimeout(() => {
          this.startButtonCooldown = false;
        }, this.startButtonCooldownTime);
      }
    }
    requestAnimationFrame(gamepadHandler);
  };
  gamepadHandler();
};

GameView.prototype.resetStartButton = function() {
  this.startButtonPressed = false;
};

GameView.prototype.moveDefender = function() {

  if (this.leftPressed) {
    this.defender.power([-3,0]);
  } else if (this.rightPressed) {
    this.defender.power([3,0]);
  }

  if (this.spacePressed) {
    this.defender.fireBullet();
  }
};

module.exports = GameView;

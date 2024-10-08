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
  this.fps = 240; // Increase from 120 to 240

  this.startGamepadInput();
};

GameView.prototype.toggleAudio = function() {
  this.isMuted = this.isMuted ? false : true;
};

GameView.prototype.start = function() {
  this.lastTime = 0;
  this.animate = (time) => {
    if (!this.isPaused) {
      const deltaTime = time - this.lastTime;
      if (deltaTime > 1000 / this.fps) {
        this.game.draw(this.ctx);
        this.addLivesText(this.ctx);
        this.addScoreText(this.ctx);
        this.addLevelText(this.ctx);
        this.moveDefender();
        this.game.moveInvaders();
        this.game.addUfo();
        this.game.step();
        this.lastTime = time;
      }
    }
    requestAnimationFrame(this.animate);
  };
  requestAnimationFrame(this.animate);

  // Animate enemy sprites
  this.toggle = setInterval(() => {
    if (!this.isPaused) this.game.toggleInvaders();
  }, 167); // Adjust from 125 to 167 (75% of previous speed)
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



GameView.prototype.startGamepadInput = function() {
  if (!navigator.getGamepads) {
    console.warn('Gamepad API not supported');
    return;
  }
  this.gamepadState = {
    leftPressed: false,
    rightPressed: false,
    firePressed: false,
    startPressed: false
  };

  const gamepadLoop = () => {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      const leftPressed = gamepad.axes[0] < -0.5;
      const rightPressed = gamepad.axes[0] > 0.5;
      const firePressed = gamepad.buttons[0].pressed;
      const startPressed = gamepad.buttons[11].pressed;

      // Handle left/right movement
      if (leftPressed !== this.gamepadState.leftPressed) {
        this.gamepadState.leftPressed = leftPressed;
        this.leftPressed = leftPressed;
      }
      if (rightPressed !== this.gamepadState.rightPressed) {
        this.gamepadState.rightPressed = rightPressed;
        this.rightPressed = rightPressed;
      }

      // Handle fire button
      if (firePressed && !this.gamepadState.firePressed) {
        this.spacePressed = true;
        setTimeout(() => { this.spacePressed = false; }, 50); // Reset after 50ms
      }
      this.gamepadState.firePressed = firePressed;

      // Handle start button
      if (startPressed && !this.gamepadState.startPressed && !this.startButtonCooldown) {
        this.startButtonPressed = true;
        this.startButtonCooldown = true;
        setTimeout(() => { this.startButtonCooldown = false; }, this.startButtonCooldownTime);
      }
      this.gamepadState.startPressed = startPressed;
    }
    requestAnimationFrame(gamepadLoop);
  };

  gamepadLoop();
};

GameView.prototype.resetStartButton = function() {
  this.startButtonPressed = false;
};

GameView.prototype.moveDefender = function() {
  console.log('Move Defender:', this.leftPressed, this.rightPressed, this.spacePressed);
  if (this.leftPressed) {
    this.defender.power([-9,0]); // Increase from -4.5 to -9
  } else if (this.rightPressed) {
    this.defender.power([9,0]); // Increase from 4.5 to 9
  }

  if (this.spacePressed) {
    this.defender.fireBullet();
  }
};


module.exports = GameView;

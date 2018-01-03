var app={

  cambiarOrientacion: function() {
    // Forzar la horientación horizontal
    window.screen.orientation.lock('landscape');

	app.inicio();
  },

  inicio: function(){
	
	// Marcadores
    scoreString = 'Score : ';
    hiscoreString = 'Highscore : ';
    livesString = 'Lives : ';
    puntuacion = 0;
	hiscore = 0;
	lives = 3

	// Variables del juego
    velocidadY = 0;
    tiempo = 0;

	// Multiplicadores
	speedMult = 1;
	frecMult = 10;
	livesMult = 1;

    // Detectar las dimensiones del dispositivo
    alto  = document.documentElement.clientHeight;
    ancho = document.documentElement.clientWidth;
	
    app.vigilaSensores();
    app.iniciaJuego();
  },

  iniciaJuego: function(){

    var estados = { preload: preload, create: create, update: update };
    var game = new Phaser.Game(ancho, alto, Phaser.CANVAS, 'phaser', estados);
    var meteors;
	
    function preload() {
	  // Carga de los sprites y los sonidos del juego
	  game.load.image('starfield', 'assets/starfield.png');
      game.load.image('falcon', 'assets/falcon.png');
      game.load.image('meteor', 'assets/meteor.png');
	  game.load.spritesheet('explosion', 'assets/explode.png', 128, 128);
	  game.load.audio('music', 'assets/music.mp3');
	  game.load.audio('chewbacca', 'assets/chewbacca.mp3');
	  game.load.audio('r2', 'assets/r2.mp3');
    }

    function create() {
      // Definir la fisica del juego
	  game.physics.startSystem(Phaser.Physics.ARCADE);
	  
	  // Cargar el fondo
	  starfield = game.add.tileSprite(0, 0, ancho, alto, 'starfield');
	
	  // El Halcon Milenario!!!
      falcon = game.add.sprite(ancho / 2, alto, 'falcon');
      game.physics.arcade.enable(falcon);
      falcon.body.collideWorldBounds = true;
	
	  // El conjunto de meteoritos
	  meteors = game.add.group();
	  meteors.enableBody = true;
	  meteors.physicsBodyType = Phaser.Physics.ARCADE;

	  // Los marcadores
      scoreText = game.add.text(10, 10, scoreString + puntuacion, { font: '20px Arial', fill: '#fff' });
      hiscoreText = game.add.text(200, 10, hiscoreString + hiscore, { font: '20px Arial', fill: '#ff0000' });
      livesText = game.add.text(400, 10, livesString + lives, { font: '20px Arial', fill: '#00ff00' });
      stateText = game.add.text(game.world.centerX-140, game.world.centerY-60,' ', { font: '40px Arial', fill: '#fff' });
      stateText.visible = false;
	  
	  // Sonidos
	  choque = game.add.audio('chewbacca');
	  extraLive = game.add.audio('r2');
	  music = game.add.audio('music');
	  music.play();
	}

    function update(){
    	
  	  // Hacer scroll en el fondo
      starfield.tilePosition.y += 2;

      // Incrementar puntuacion
      incrementaPuntuacion();

	  // Incrementar tiempo
	  incrementaTiempo();

      // Mover el halcon con los valores leidos del giroscopio
	  falcon.body.velocity.x = (velocidadY * 300);

	  // Detectar la colision entre el halcon y los meteoritos
	  game.physics.arcade.collide(falcon, meteors, collisionHandler);
	}

    function incrementaPuntuacion(){
      
	  if (lives > 0) {
	  
	    // Aumentar la puntuacion
	    puntuacion = puntuacion + 1;
        scoreText.text = scoreString + puntuacion;
	  
	    // Aumentar el hiscore
	    if (puntuacion > hiscore) {
	      hiscore = puntuacion;
	      hiscoreText.text = hiscoreString + hiscore;
	    }
	
	    // Otorgar vida extra
	    if (puntuacion % (livesMult * 1000) == 0) {
		  extraLive.play();
	      lives = lives + 1;
	      livesText.text = livesString + lives;
	      livesMult = livesMult + livesMult;
	    }

  	    // Aumentar la velocidad y disminuir la frecuencia
	    if (puntuacion % 500 == 0) {
		  speedMult = speedMult + 1;
		  if (frecMult > 1) {
			frecMult = frecMult - 1;
		  }
	    }
      }
	}

	function incrementaTiempo() {
	  tiempo = tiempo + 1;
      
	  // Crear los meteoritos
	  if (tiempo % (3 * frecMult) == 0) {
	    var meteor = meteors.create(game.world.randomX, 0, 'meteor');
        game.physics.enable(meteor, Phaser.Physics.ARCADE);
        game.physics.arcade.moveToXY(meteor, meteor.x, 1000, 100 * speedMult);
	  }
    }

	function decrementaPuntuacion(){

  	  if (lives > 1) { // Quitar una vida y volver a la velocidad y frecuencias iniciales
		
		lives = lives - 1;
		livesText.text = livesString + lives;
		speedMult = 1;
		frecMult = 10;

	  } else { // Game Over

		lives = lives - 1;
		livesText.text = livesString + lives;
		speedMult = 1;
		frecMult = 10;
	  
		falcon.kill();

        stateText.text = " GAME OVER \n Click to restart";
        stateText.visible = true;
		music.stop();

        game.input.onTap.addOnce(restart,this);
	  }
	}

	function collisionHandler(obj1, obj2) {

      // Reproducir sonido
 	  choque.play();
	  navigator.vibrate(500);

	  var explosion = game.add.sprite(falcon.body.x-40, falcon.body.y-40, 'explosion');
 	  var anim = explosion.animations.add('explosion');
	  explosion.animations.play('explosion', 50, false, true);

      // Resetear los meteoritos
	  meteors.destroy();
	  meteors = game.add.group();
	  meteors.enableBody = true;
	  meteors.physicsBodyType = Phaser.Physics.ARCADE;
	 
      // Decrementar la puntuacion
	  decrementaPuntuacion();
    }

    function restart () {

      // Reiniciar la partida
      puntuacion = 0;
      scoreText.text = scoreString + puntuacion;
	  lives = 3;
	  livesText.text = livesString + lives;
	  tiempo = 0;
	  livesMult = 1;
	  
	  // Ocultar el texto de Game Over
      stateText.visible = false;

	  // Resetear el halcon y los meteoritos
	  falcon.revive();
	  meteors.destroy();
	  meteors = game.add.group();
	  meteors.enableBody = true;
	  meteors.physicsBodyType = Phaser.Physics.ARCADE;
	  
	  music.play();
    }

  },
	
  vigilaSensores: function(){
    
    function onError() {
        console.log('onError!');
    }

    function onSuccess(datosAceleracion){
		app.registraDireccion(datosAceleracion);
    }

    navigator.accelerometer.watchAcceleration(onSuccess, onError,{ frequency: 10 });
  },

  registraDireccion: function(datosAceleracion){
    velocidadY = datosAceleracion.y;
  }
};

if ('addEventListener' in document) {
    document.addEventListener('deviceready', function() {
        //app.inicio();
		app.cambiarOrientacion();
    }, false);
}
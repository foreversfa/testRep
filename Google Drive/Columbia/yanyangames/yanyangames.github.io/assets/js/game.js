var player, cursors, ground, max_speed, stars, scoreText, sky, dropEvent, timeCheck, animation;
var allRecords = []
var score = 0;
var dropCount = 0;
var minimumCatch = 0;
var currentCloth = 0.1;
var specialExisted = false;

Parse.initialize("QPzLZksBFJtWTmTJR6bGvKS3IGikmWaIcYlaLLYt", "8Z7sxI6h1i174BpgYV6LbZTdXejw7Iad7XuwgWob");

//get parse score data

var recordQuery = new Parse.Query('Records');
recordQuery.find().then(function(results){
	for(i=0;i<results.length;i++){
		allRecords.push(results[i].get('score'));
	}

})

var Game = {

	preload : function(){

		game.load.image('sky','assets/img/sky.png');
		game.load.image('ground','assets/img/platform.jpg');
		game.load.spritesheet('figure1','assets/img/dude.png',45,48);
		game.load.spritesheet('figure2','assets/img/dude2.png',45,48);
		game.load.spritesheet('figure3','assets/img/dude3.png',45,48);
		game.load.spritesheet('figure4','assets/img/dude4.png',45,48);
		game.load.spritesheet('figure5','assets/img/dude5.png',45,48);
		//trasition png
		game.load.spritesheet('transition','assets/img/transition.png',53,48)
		game.load.image('star','assets/img/star.png');
		game.load.image('starspecial','assets/img/star2.png');
		game.load.audio('eat','assets/sound/ding.wav');
		game.load.audio('transformation','assets/sound/transformation.wav');
		game.load.audio('gameover','assets/sound/gameover.wav');
		// game.load.audio('drop','assets/sound/drop.wav')

	},

	create : function(){
		//add sky
		sky = game.add.sprite(0,0,'sky');
		//player moving speed
		max_speed = 290;
		//add platform group
		platforms = game.add.group();
		platforms.enableBody = true;
		//create ground
		ground  = platforms.create(0,game.world.height - 64,'ground');
		ground.scale.setTo(2,2);
		ground.body.immovable = true;
		ground.body.allowGravity = false;

		//add player figure
		player = game.add.sprite(game.world.width/2-21,game.world.height/2-88, 'figure1');
		//add other figure
		staticPlayer1 = game.add.sprite(game.world.width/2-85,game.world.height/2-88,'figure3');
		staticPlayer2 = game.add.sprite(game.world.width/2-150,game.world.height/2-88,'figure4');
		staticPlayer3 = game.add.sprite(game.world.width/2+42,game.world.height/2-88,'figure2');
		staticPlayer4 = game.add.sprite(game.world.width/2+110,game.world.height/2-88,'figure5');

		//enable physics on player
		game.physics.enable(player, Phaser.Physics.ARCADE);
		player.body.bounce.y = 0.2;
    	player.body.gravity.y = 300;
		player.animations.add('left', [0, 1, 2, 3], 4, true);
    	player.animations.add('right', [5, 6, 7, 8], 4, true);
    	//static figures animation
    	staticPlayer1.frame = 4;

    	staticPlayer2.frame = 4;
    	staticPlayer3.frame = 4;
    	staticPlayer4.frame = 4;
    	//~~~~
    	player.body.collideWorldBounds = true;
    	//enable key input
    	cursors = game.input.keyboard.createCursorKeys();
    	//add stars as group
    	stars = game.add.group();
    	stars.enableBody = true;
    	//fade static player
    	game.add.tween(staticPlayer1).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
    	game.add.tween(staticPlayer2).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
    	game.add.tween(staticPlayer3).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
    	game.add.tween(staticPlayer4).to( { alpha: 0 }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
    	//create repeatly spawn star events
    	dropEvent = game.time.create(false);
    	dropEvent.loop(1000,generateStar,this);
    	dropEvent.start();
    	// game.time.events.repeat(1000,1000,generateStar,this)
    	//add score text
    	scoreText = game.add.text(16, 26, '得分: 0', { fontSize: '26px', fill: '#000' });
    	//add ranking text
    	rankingText = game.add.text(500, 26, '排名: 0', {fontSize: '26px', fill: '#000'} )
    	//add sound effect
    	catchSound = game.add.audio('eat');
    	transformSound = game.add.audio('transformation');
    	gameoverSound = game.add.audio('gameover');
    	// dropSound = game.add.audio('drop');
    	//create animation 
    	

	},

	update : function(){
		//player stand on the ground
		game.physics.arcade.collide(player,ground);
		//when player catch star
		game.physics.arcade.overlap(player,stars,onTouch,null,this);
		//when item drop on the ground
		game.physics.arcade.overlap(ground,stars,touchDown,null,this);

		if(cursors.left.isDown){
			player.body.velocity.x = -max_speed;
			player.animations.play('left');
		}
		else if(cursors.right.isDown){
			player.body.velocity.x = max_speed;
			player.animations.play('right');
		}
		else{
			player.body.velocity.x = 0;
			player.animations.stop();
			player.frame = 4;
		}

		this.checkFail();
		// this.checkChangeCloth();

	},

	checkFail : function(){
		if(dropCount>20){
			// dropEvent.pause();
			// for(i=0;i<stars._hash.length;i++){
			// 	stars._hash[i].body.enable = false;
			// }
			var Records = Parse.Object.extend('Records')
			var newRecord = new Records();
			newRecord.save({score:score})
			gameoverSound.play();
			alert('你漏掉太多榛子酥，游戏结束！\n 最终得分'+score+'，排名第'+computeRanking()+'!');
			dropCount = 0;
			game.state.start('Menu');

		}
	},

};

function generateStar(){
	var star
	var specialKey = game.rnd.frac();

	if(minimumCatch<5){
		star = stars.create(game.world.randomX, 0 , 'star')
		star.special = false;
	}
	
	else if(specialKey<0.1 && specialExisted==false){
		
		star = stars.create(game.world.randomX, 0 , 'starspecial')
		star.special = true;
		specialExisted = true
	}
	else{
		
		star = stars.create(game.world.randomX, 0 , 'star')
		star.special = false;
	}
		
	star.body.gravity.y = 20 + game.rnd.frac()*30;
	
	// console.log(star.body.gravity.y);
}

function onTouch(player,star){
	// console.log('game.time.now:'+game.time.now)
	minimumCatch++;
	star.kill();
	
	score += 1;
	scoreText.text = '得分: ' + score;
	rankingText.text = '排名: '+computeRanking();
	
	
	if(star.special==true){
		//when star is special
		score++;
		pause();
		animation = game.add.sprite(player.x-3,player.y+5,'transition');
		animation.animations.add('change',null,8,false,true);
		animation.play('change');
		transformSound.play();
		game.time.events.add(400,changeCloth,this);
		minimumCatch = 0;
		specialExisted = false;
		return;
		// animation.destroy();
		
		
	}
	catchSound.play();
}

function touchDown(ground,star){
	if(star.special==true){
		specialExisted = false;
	}
	star.kill();
	// dropSound.play();
	dropCount++;

}

function changeCloth(){
	
	var rndKey
	// var figureArr = ['figure1','figure2','figure3','figure4','figure5']
	// while(rndKey!=currentCloth){
	// 	player.loadTexture(figureArr[rndKey],0)
	// 	break;
	// }
	// console.log('inside changeCloth')
	while(true){
		
		rndKey = game.rnd.frac();
		if(rndKey<0.23 && currentCloth>=0.23){
			player.loadTexture('figure1',0)
			break;

		}
		else if((rndKey>=0.23 && rndKey<0.46) && (currentCloth<0.23 || currentCloth>=0.46)){
			
			player.loadTexture('figure2',0)
			break;
		}
		else if((rndKey>=0.46 && rndKey<0.69) && (currentCloth<0.46 || currentCloth>0.69)){
			
			player.loadTexture('figure3',0)	
			break;
		}
		else if((rndKey>=0.69 && rndKey<0.92) && (currentCloth<0.69 || currentCloth>0.92)){
			player.loadTexture('figure4',0)	
			break;
		}
		else if(rndKey>=0.92 && currentCloth<0.92){
			player.loadTexture('figure5',0)
			break;
		}
		else{
			continue;
		}
	}
	
	currentCloth = rndKey;

	if(animation){
		animation.destroy();
	}
	unpause();
	
}

function pause(){
	// cursors = game.input.keyboard.disable = false;
	player.body.enable = false;
	player.frame = 4;
	cursors.left._enabled = false;
	cursors.right._enabled = false;
	dropEvent.pause();
	for(i=0;i<stars._hash.length;i++){
		stars._hash[i].body.enable = false;
	}
	
}

function unpause(){
	// cursors = game.input.keyboard.disable = true;
	player.body.enable = true;
	cursors.left._enabled = true;
	cursors.right._enabled = true;
	dropEvent.resume();
	for(i=0;i<stars._hash.length;i++){
		stars._hash[i].body.enable = true;
	}
}

function computeRanking(){
	var recordsCopy = allRecords;
	recordsCopy.push(score);
	//sort records in descending order
	recordsCopy.sort(function(a,b){return b-a})
	return recordsCopy.indexOf(score)+1;
}

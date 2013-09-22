var canvas;
var ctx;
var MILLI_DRAW = 16.7;
var drawInterval;
var keysDown=[];
var mousePos={'x':0,'y':0};
//level grid pathing + spawning + stuff
var grid = [];
var valid = [];
var CELL_SIZE = 30;
var MINE_MAX = 5;
var MINE_RAD_MIN = 3;
var MINE_RAD_MAX = 12;
var obstacles=[];
var updateCounter=0;
var Obstacle = function(x,y,width,height){
  this.x=x;
  this.y=y;
  this.width=width;
  this.height=height;
  this.color="black";
  this.lineWidth=3;
}
var haveISetupYet=false;
var port = chrome.runtime.connect({name: "leopardstrike"});
port.onMessage.addListener(function(msg) {
	if(!haveISetupYet && msg.init){
		setup();
		run();
		haveISetupYet=true;
	}
	if(haveISetupYet && msg.quit){
		reallyStop();
	}
	if(msg && msg.type==PacketTypes.CREATEPLAYER){
		players[msg.pid] = new Player(msg.x,msg.y);
		players[msg.pid].pid=msg.pid;
		players[msg.pid].color=msg.rgb;
		players[msg.pid].crosshair.color=msg.rgb;
	}
	if(msg && msg.type==PacketTypes.SETPLAYERID){
		player = players[msg.pid];
	}
	if(msg && msg.type==PacketTypes.UPDATEPLAYER){
		for(var key in msg.players){
			var p = msg.players[key];
			var ours = players[key];
			if(player && key==player.pid)continue;
			if(ours){
				ours.x=p.x;
				ours.y=p.y;
				ours.health=p.hp;
				ours.crosshair.angle=p.deg*Math.PI/180;
			}else{
				var newPlayer = new Player(p.x,p.y);
				newPlayer.pid =key;
				newPlayer.x=p.x;
				newPlayer.y=p.y;
				newPlayer.health=p.hp;
				newPlayer.crosshair.angle=p.deg*Math.PI/180;
				newPlayer.color=p.color;
				players[key]=newPlayer;
			}
		}
		for(var key in players){
			if(!msg.players[key])
				delete players[key];
		}
		if(msg.bullets){
			for(var i=0;i<msg.bullets.length;i++)
			{
				var b = msg.bullets[i];
				var nb = new Bullet(0,0);
				nb.x=b.x;
				nb.y=b.y;
				nb.speed=b.v;
				nb.angle=b.deg;
				bullets.push(nb);
			}
		}
	}
  if(msg && msg.type==PacketTypes.REQUESTLEVEL){
    createObstacles();
    port.postMessage({type:PacketTypes.SERVELEVEL, obstacles: grid, noObstacles: valid});
  }
  if(msg && msg.type==PacketTypes.SERVELEVEL){
    grid = msg.obstacles;
    valid = msg.noObstacles;
  }
});

var player;
var players={};
var Player = function(x,y){
  this.x=x;
  this.y=y;
  this.radius=8;
  this.color="red";
  this.lineWidth=3;
  this.speed=5;
  this.maxHealth=50;
  this.health=this.maxHealth;
  this.crosshair = {
    x:0,
    y:0,
    angle:0,
    radius: 3,
    lineWidth: .5,
    color: 'red',
    update: function(parentX,parentY,x,y){
      this.angle=Math.atan2((y-parentY),(x-parentX));
      this.x=parentX+8*Math.cos(this.angle);
      this.y=parentY+8*Math.sin(this.angle);
    }
  };
  this.isDead=function(){ return health<=0; }
}

var playerMines = [];
var playerMineCount = 0;
var Mine = function(x,y){
  this.x = x;
  this.y = y;
  this.radius = 5;
  this.color = player.color;
  this.lineWidth=4;
  //other rendering variables
  this.pulsateFreq = 5;
  this.pulsateCount = 0;
  this.pulsateReverse = false;
}

function incrementPulsate(mine){
  mine.pulsateCount++;
  if(!mine.pulsateReverse && mine.pulsateCount >= mine.pulsateFreq){
    mine.pulsateCount = 0;
    mine.radius++;
    if(mine.radius >= MINE_RAD_MAX){
      mine.pulsateReverse = true;
    }
  }
  else if(mine.pulsateReverse && mine.pulsateCount >= mine.pulsateFreq){
    mine.pulsateCount = 0;
    mine.radius--;
    if(mine.radius <= MINE_RAD_MIN){
      mine.pulsateReverse = false;
    }
  }
}

var bullets=[], newBullets=[];
var Bullet = function(x,y){
  this.angle=player.crosshair.angle;
  this.spawnDistance=15;
  this.x=player.x+this.spawnDistance*Math.cos(this.angle);
  this.y=player.y+this.spawnDistance*Math.sin(this.angle);
  this.radius=3;
  this.lineWidth=.5;
  this.color=player.color;
  this.speed=5;
  this.move=function(){
    this.x+=this.speed*Math.cos(this.angle);
    this.y+=this.speed*Math.sin(this.angle);
  }
  this.isDead=function(){
    if (this.x+this.radius>canvas.width) return true;
    if (this.x-this.radius<0) return true;
    if (this.y+this.radius>canvas.height) return true;
    if (this.y-this.radius<0) return true;
  }
}

function fixBullet(b){
	b.move=function(){
    b.x+=b.speed*Math.cos(b.angle);
    b.y+=b.speed*Math.sin(b.angle);
  }
  b.isDead=function(){
    if (b.x+b.radius>canvas.width) return true;
    if (b.x-b.radius<0) return true;
    if (b.y+b.radius>canvas.height) return true;
    if (b.y-b.radius<0) return true;
  }
}

//initialize canvas and ctx
function setup(){
  c_width=$(document.body).width();
  c_height=$(document.body).height()+10;
  canvasString="<canvas id='canvas' width='"+c_width+"' height='"+c_height+"'>Canvas Not Supported!</canvas>"
  $(document.body).append(canvasString);
  $("#canvas").css({'position':'absolute','top':0,'left':0,'z-index':99999999,'tabindex':1});
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  //createObstacles();
  //player=createPlayer(1,'red');
//	players[player.pid]=player;
  initListeners();
}

//generate obstacles based on document
function createObstacles(){
  //select 50% of deepest elements
  $("*:not(:has(*)):not('canvas')").each(function(){
    if (Math.random()<.5) {
      if(($(this).width() > 10 && $(this).height() > 10) && ($(this).width() < canvas.width * .80)){
        obstacles.push(new Obstacle($(this).offset().left,$(this).offset().top,$(this).width(),$(this).height()));
      }
    }
  });
  //delete -999 elements
  for (var i=obstacles.length-1;i>=0;i--){
    if (obstacles[i].x<=0||obstacles[i].y<=0) {
      obstacles.splice(i,1);
    }
  }
  //create a grid of CELL_SIZE pixel blocks
  grid = new Array(Math.ceil(canvas.width/CELL_SIZE));
  var g_height = Math.ceil(canvas.height/CELL_SIZE);
  for (var i=0;i<grid.length;i++) {
    grid[i]=new Array(g_height);
    for (var j=0;j<grid[i].length;j++){
      grid[i][j]=[];
    }
  }
  //iterate through all obstacles, see what grids they intersect, and make those false
  for (var i=0;i<obstacles.length;i++){
    var startx=Math.floor(obstacles[i].x/CELL_SIZE);
    var starty=Math.floor(obstacles[i].y/CELL_SIZE);
    var endx=Math.ceil((obstacles[i].x+obstacles[i].width)/CELL_SIZE);
    var endy=Math.ceil((obstacles[i].y+obstacles[i].height)/CELL_SIZE);
    if (endx>=grid.length || endy>=grid[0].length) { continue; }
    for (var j=startx;j<endx;j++){
      for (var k=starty;k<endy;k++){
        grid[j][k].push(i);
      }
    }
  }
  for (var i=0;i<grid.length;i++){
    for (var j=0;j<grid[i].length;j++){
      if(grid[i][j].length <= 0) { valid.push({'i':i,'j':j}); }
    }
  }
}

//generate player and place him somewhere unobstructed
function createPlayer(id,color){
  //pick a random true grid and spawn the player there
  var spawnPoint = valid[Math.floor(Math.random()*valid.length)];
  var playerX = Math.floor(spawnPoint.i*CELL_SIZE)+15;
  var playerY = Math.floor(spawnPoint.j*CELL_SIZE)+15;
  var nplayer = new Player(playerX,playerY);
  nplayer.pid=id;
  nplayer.color=color;
  return nplayer;
}

function initListeners(){
  document.addEventListener('mousedown',function(e) {
    e.preventDefault();
    keysDown['mouse'] = true;
  },false);
  document.addEventListener('mouseup',function(e) {
    delete keysDown['mouse'];
  },false);
  document.addEventListener('mousemove',function(e) {
    mousePos = getMouseCoords(e);
  },false);
  document.addEventListener("keydown", function(e) {
    keysDown[e.keyCode] = true;
    if (e.keyCode === KEY_ESC) {
		stop();
		
    }
    if(e.keyCode === 40 || e.keyCode === 38){
      e.preventDefault();
    }

    if(e.keyCode === 69){
      if(player && playerMineCount != MINE_MAX){
        playerMines.push(new Mine(player.x,player.y));
        playerMineCount++;
      }
    }

  },false);
  document.addEventListener("keyup", function(e) {
    delete keysDown[e.keyCode];
  },false);

  //Remember to unbind the listeners
  $(document).bind('mousewheel DOMMouseScroll', function(e){
    e.preventDefault();
  });
  
}

//start interval
function run(){
  drawInterval=setInterval(function(){
    update();
    render();
  	if(player){
  		if(updateCounter--<0){
  			port.postMessage({pid:player.pid,x:player.x,y:player.y,deg:player.crosshair.angle*180/Math.PI,hp:player.health,bullets:newBullets});
  			newBullets=[];
  			updateCounter=8;
  		}
  	}
  },16.7);
}

function stop(){
  window.clearInterval(drawInterval);
  drawInterval = setInterval(function(middle){
    ctx.fillStyle="white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font="18px arial";
    ctx.fillStyle="black";
    ctx.fillText("Game Over!",$(window).innerWidth()/3,player.y-($(window).innerHeight()/4));
    ctx.fillText("Press ESC to go back to browsing",$(window).innerWidth()/3,player.y-($(window).innerHeight()/4)+30);
    if(keysDown[KEY_ESC]){
		reallyStop();
		port.postMessage({quit:"now"});
	}
  },16.7);
}
function reallyStop(){
  $(document).unbind();
  window.clearInterval(drawInterval);
  $("#canvas").remove();
}

//update game logic
var KEY_UP = 87;
var KEY_DOWN = 83;
var KEY_LEFT = 65;
var KEY_RIGHT = 68;
var KEY_ESC = 27;

function update(){

  if(player && 'mouse' in keysDown){
  	var b = new Bullet(mousePos.x,mousePos.y);
      bullets.push(b);
  	var xoff = updateCounter*b.speed*Math.cos(b.angle),
  		yoff = updateCounter*b.speed*Math.sin(b.angle);
  	newBullets.push({x:b.x+xoff,y:b.y+yoff,v:b.speed,deg:b.angle});
  }

  for(var i =0;i<playerMines.length;i++){
    incrementPulsate(playerMines[i]);
  }

  var bulletGrid = {};
  var deadBullets = [];
  for(var i=bullets.length-1;i>=0;i--){
    bullets[i].move();
    bulX = Math.floor(bullets[i].x/CELL_SIZE);
    bulY = Math.floor(bullets[i].y/CELL_SIZE);
    key=bulX+':'+bulY;

    if(Math.sqrt(Math.pow(player.x - bullets[i].x,2) + Math.pow(player.y - bullets[i].y,2)) < (player.radius + bullets[i].radius))
    {
      player.health -= 1;
      deadBullets.push(i);
    }
    else{
      if (key in bulletGrid) {
        bulletGrid[key].push(i);
      } else {
        bulletGrid[key]=[];
        bulletGrid[key].push(i);
      }
    }
  }
  Object.keys(bulletGrid).forEach(function(key) {
    var vals = key.split(":");
    if (vals[0]<0 || vals[1] <0 || vals[0]>=grid.length || vals[1]>=grid[0].length) {
      delete bulletGrid[key];
    }
    else if (grid[vals[0]][vals[1]].length == 0) {
      delete bulletGrid[key];
    }
    else{
      var potentialCells = grid[vals[0]][vals[1]];
      for(var i=0;i<bulletGrid[key].length;i++){
        for(var j=0;j<potentialCells.length;j++){
          var obstacleIndex = potentialCells[j];
          var bulletIndex = bulletGrid[key][i];
          var obMinX = obstacles[obstacleIndex].x;
          var obMaxX = obMinX+obstacles[obstacleIndex].width;
          var obMinY = obstacles[obstacleIndex].y;
          var obMaxY = obMinY+obstacles[obstacleIndex].height;
          if (bullets[bulletIndex].x < obMaxX && bullets[bulletIndex].x > obMinX
            && bullets[bulletIndex].y < obMaxY && bullets[bulletIndex].y > obMinY)
            deadBullets.push(bulletGrid[key][i]);
        }
      }
    }
  });

  for (var i=0;i<deadBullets.length;i++) {
    bullets.splice(deadBullets[i],1);
  };
  for (var i=bullets.length-1;i>=0;i--) {
    if(bullets[i].isDead()) { bullets.splice(i,1); }
  }
  if(!player)
  return;
  //move player
  if (KEY_UP in keysDown) { 
    if (player.y-player.radius>=0) {
      player.y -= player.speed;
    }
  }
  if (KEY_DOWN in keysDown) { 
    if (player.y+player.radius<=canvas.height) {
      player.y += player.speed;
    }
  }
  if (KEY_LEFT in keysDown) { 
    if (player.x-player.radius >= 0) {
      player.x -= player.speed;
    }
  }
  if (KEY_RIGHT in keysDown) { 
    if (player.x+player.radius <= canvas.width) {
      player.x += player.speed;
    }
  }//player collision with static objects
  collided=[];
  for (i=0;i<obstacles.length;i++) {
    if (  player.x+player.radius>obstacles[i].x &&
          player.x-player.radius<obstacles[i].x+obstacles[i].width &&
          player.y+player.radius>obstacles[i].y &&
          player.y-player.radius<obstacles[i].y+obstacles[i].height)
    {
      collided.push(obstacles[i]);
    }
  }
  for (i=0;i<collided.length;i++){
    if ((KEY_RIGHT in keysDown) && player.x<collided[i].x) {
      player.x=collided[i].x-player.radius;
    }
    //colliding from right
    if ((KEY_LEFT in keysDown) && player.x>collided[i].x+collided[i].width) {
      player.x=collided[i].x+collided[i].width+player.radius;
    }
    //colliding from below
    if ((KEY_UP in keysDown) && player.y>collided[i].y) {
      player.y=collided[i].y+collided[i].height+player.radius;
    }
    //colliding from above
    if ((KEY_DOWN in keysDown) && player.y<collided[i].y+collided[i].height) {
      player.y=collided[i].y-player.radius;
    }
  }

  player.crosshair.update(player.x,player.y,mousePos.x,mousePos.y);

  var winHeight = $(window).innerHeight();
  $(document).scrollTop(player.y - (winHeight * 0.5));
  
}
//rendering functions
var drawGrid=false;
function render(){
  renderBG();
  renderObstacles();
  renderPlayers();
  renderBullets();
  renderMines();
  ctx.fillStyle='black';
  /* draw grid */
  if (drawGrid) {
    ctx.strokeStyle='red';
    for (var i=0;i<grid.length;i++){
      for (var j=0;j<grid[i].length;j++) {
        if (grid[i][j].length > 0) {
          ctx.strokeRect(i*CELL_SIZE,j*CELL_SIZE,CELL_SIZE,CELL_SIZE);
        }
      }
    }
  }
}

function renderBG(){
  canvas.width=canvas.width;
  canvas.height=canvas.height;
  ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function renderObstacles(){
  for (var i=0;i<obstacles.length;i++){
    ctx.strokeStyle=obstacles[i].color;
    ctx.lineWidth=obstacles[i].lineWidth;
    ctx.strokeRect(obstacles[i].x,obstacles[i].y,obstacles[i].width,obstacles[i].height);
  }
}

function renderPlayers(){
	for(var key in players){
		var entity = players[key];
			//entity
		  ctx.beginPath();
		  ctx.arc(entity.x, entity.y, entity.radius, 0, 2*Math.PI, false);
		  ctx.lineWidth = entity.lineWidth;
		  ctx.strokeStyle = entity.color;
		  ctx.stroke();
		  ctx.fillStyle = entity.color;
		  ctx.fill();
		  ctx.closePath();
		  //crosshair
		  ctx.beginPath();
		  ctx.arc(entity.crosshair.x, entity.crosshair.y, entity.crosshair.radius, 0, 2*Math.PI, false);
		  ctx.lineWidth = entity.crosshair.lineWidth;
		  ctx.strokeStyle = entity.crosshair.color;
		  ctx.stroke();
		  ctx.fillStyle = entity.color;
		  ctx.fill();
		  ctx.closePath();
      //health
      ctx.fillStyle="red";
      ctx.fillRect(entity.x-entity.radius,entity.y-(entity.radius+5),entity.radius*2*(entity.health/entity.maxHealth),3);
	}
}

function renderMines(){
  for(var i = 0; i < playerMines.length; i++){
    ctx.beginPath();
    ctx.arc(playerMines[i].x, playerMines[i].y, playerMines[i].radius, 0, 2*Math.PI, false);
    ctx.lineWidth = playerMines[i].lineWidth;
    ctx.strokeStyle = playerMines[i].color;
    ctx.stroke();
    ctx.closePath();
  }
}

function renderBullets(){
  for (var i=0;i<bullets.length;i++){
    ctx.beginPath();
    ctx.arc(bullets[i].x, bullets[i].y, bullets[i].radius, 0, 2*Math.PI, false);
    ctx.lineWidth = bullets[i].lineWidth;
    ctx.strokeStyle = bullets[i].color;
    ctx.stroke();
    ctx.closePath();
  }
}

//update mouse position
function getMouseCoords(event) {
  var x,y;
  x=(event.pageX);
  y=(event.pageY);
  return {"x": x, "y": y};
}
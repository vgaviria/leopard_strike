var canvas;
var ctx;
var drawInterval;
var keysDown=[];
var mousePos={'x':0,'y':0};
//level grid pathing + spawning + stuff
var grid;
var CELL_SIZE = 30;

var obstacles=[];
var Obstacle = function(x,y,width,height){
  this.x=x;
  this.y=y;
  this.width=width;
  this.height=height;
  this.color="black";
  this.lineWidth=3;
}
var player;
var enemies=[];
var Player = function(x,y){
  this.x=x;
  this.y=y;
  this.radius=8;
  this.color="red";
  this.lineWidth=3;
  this.speed=10;
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
}
var bullets=[];
var Bullet = function(x,y){
  this.angle=player.crosshair.angle;
  this.spawnDistance=15;
  this.x=player.x+this.spawnDistance*Math.cos(this.angle);
  this.y=player.y+this.spawnDistance*Math.sin(this.angle);
  this.radius=3;
  this.lineWidth=.5;
  this.color='red';
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
setup();
run();
//initialize canvas and ctx
function setup(){
  c_width=$(document.body).width();
  c_height=$(document.body).height()+10;
  canvasString="<canvas id='canvas' width='"+c_width+"' height='"+c_height+"'>Canvas Not Supported!</canvas>"
  $(document.body).append(canvasString);
  $("#canvas").css({'position':'absolute','top':0,'left':0,'z-index':99999999});
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  createObstacles();
  createPlayer();

  initListeners();
}
//generate obstacles based on document
function createObstacles(){
  //select 50% of deepest elements
  $("*:not(:has(*)):not('canvas')").each(function(){
    if (Math.random()<.5) {
      obstacles.push(new Obstacle($(this).offset().left,$(this).offset().top,$(this).width(),$(this).height()));
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
      grid[i][j]=true;
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
        grid[j][k]=false;
      }
    }
  }
}
//generate player and place him somewhere unobstructed
function createPlayer(){
  //pick a random true grid and spawn the player there
  var valid=[];
  for (var i=0;i<grid.length;i++){
    for (var j=0;j<grid[i].length;j++){
      if(grid[i][j]) { valid.push({'i':i,'j':j}); }
    }
  }
  var spawnPoint = valid[Math.floor(Math.random()*valid.length)];
  var playerX = Math.floor(spawnPoint.i*CELL_SIZE)+15;
  var playerY = Math.floor(spawnPoint.j*CELL_SIZE)+15;
  player = new Player(playerX,playerY);
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
  },false);
  document.addEventListener("keyup", function(e) {
    delete keysDown[e.keyCode];
  },false)
}
//start interval
function run(){
  drawInterval=setInterval(function(){
    update();
    render();
  },16.7);
}
//update game logic
var KEY_UP = 87;
var KEY_DOWN = 83;
var KEY_LEFT = 65;
var KEY_RIGHT = 68;
function update(){
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
  }
  player.crosshair.update(player.x,player.y,mousePos.x,mousePos.y);
  
  if('mouse' in keysDown){
    bullets.push(new Bullet(mousePos.x,mousePos.y));
  }
  for(var i=bullets.length-1;i>=0;i--){
    bullets[i].move();
  }
}
//rendering functions
var drawGrid=false;
function render(){
  renderBG();
  renderObstacles();
  renderPlayer();
  renderBullets();
  ctx.fillStyle='black';
  if (drawGrid) {
    ctx.strokeStyle='red';
    for (var i=0;i<grid.length;i++){
      for (var j=0;j<grid[i].length;j++) {
        if (!grid[i][j]) {
          ctx.strokeRect(i*CELL_SIZE,j*CELL_SIZE,CELL_SIZE,CELL_SIZE);
        }
      };
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
function renderPlayer(){
  //player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, 2*Math.PI, false);
  ctx.lineWidth = player.lineWidth;
  ctx.strokeStyle = player.color;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,0,0,.5)';
  ctx.fill();
  ctx.closePath();
  //crosshair
  ctx.beginPath();
  ctx.arc(player.crosshair.x, player.crosshair.y, player.crosshair.radius, 0, 2*Math.PI, false);
  ctx.lineWidth = player.crosshair.lineWidth;
  ctx.strokeStyle = player.crosshair.color;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,0,0,.5)';
  ctx.fill();
  ctx.closePath();
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
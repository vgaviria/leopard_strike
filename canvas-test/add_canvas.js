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
var Player = function(x,y){
  this.x=x;
  this.y=y;
  this.radius=8;
  this.color="red";
  this.lineWidth=3;
  this.crosshair = {};
}
$(document).ready(function(){
  setup();
  run();
});
//initialize canvas and ctx
function setup(){
  c_width=$(document.body).width();
  c_height=$(document.body).height()+10;
  canvasString="<canvas id='canvas' width='"+c_width+"' height='"+c_height+"'>Canvas Not Supported!</canvas>"
  $(document.body).append(canvasString);
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
    if ((obstacles[i].x===-999||obstacles[i].y===-999)){
      obstacles.splice(i,1);
    }
  }
  //create a grid of CELL_SIZE pixel blocks
  grid = new Array(Math.floor(canvas.width/CELL_SIZE));
  var g_height = Math.floor(canvas.height/CELL_SIZE);
  for (var i=0;i<grid.length;i++) {
    grid[i]=new Array(g_height);
    for (var j=0;j<grid[i].length;j++){
      grid[i][j]=true;
    }
  }
  //iterate through all obstacles, see what grids they intersect, and make those false
  for (var i=0;i<obstacles.length;i++){
    //console.log(obstacles[i]);
    var startx=Math.floor(obstacles[i].x/CELL_SIZE);
    var starty=Math.floor(obstacles[i].y/CELL_SIZE);
    var endx=Math.ceil((obstacles[i].x+obstacles[i].width)/CELL_SIZE);
    var endy=Math.ceil((obstacles[i].y+obstacles[i].height)/CELL_SIZE);
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
    render();
  },1000);
}
//rendering functions
function render(){
  renderBG();
  renderObstacles();
  renderPlayer();
  ctx.fillStyle='black';
  /*
  * VIEW GRID
  **/
  /*
  ctx.strokeStyle='red';
  for (var i=0;i<grid.length;i++){
    for (var j=0;j<grid[i].length;j++) {
      if (!grid[i][j]) {
        ctx.strokeRect(i*CELL_SIZE,j*CELL_SIZE,CELL_SIZE,CELL_SIZE);
      }
    };
  }
  */
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
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, 2*Math.PI, false);
  ctx.lineWidth = player.lineWidth;
  ctx.strokeStyle = player.color;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,0,0,.5)';
  ctx.fill();
  ctx.closePath();
}
//update mouse position
function getMouseCoords(event) {
  var x,y;
  x=(event.pageX);
  y=(event.pageY);
  return {"x": x, "y": y};
}
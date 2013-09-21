var canvas;
var ctx;
var drawInterval;
var obstacles=[];
var Obstacle = function(x,y,width,height){
  this.x=x;
  this.y=y;
  this.width=width;
  this.height=height;
  this.outline="black";
  this.lineWidth=3;
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
}
function createObstacles(){
  $("div").each(function(){
    obstacles.push(new Obstacle($(this).offset().left,$(this).offset().top,$(this).width(),$(this).height()));
  });
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
}
function renderBG(){
  canvas.width=canvas.width;
  canvas.height=canvas.height;
  ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
}
function renderObstacles(){
  for (var i=0;i<obstacles.length;i++){
    ctx.strokeStyle=obstacles[i].outline;
    ctx.lineWidth=obstacles[i].lineWidth;
    ctx.strokeRect(obstacles[i].x,obstacles[i].y,obstacles[i].width,obstacles[i].height);
  }
}
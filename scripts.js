const cnv = document.getElementById('canvas');
const boxType = {
	NORMAL : 0,
	START : 1,
	END : 2,
	OBSTACLE : 3
};
const boxPerRow = 10; 
const rowsCount = 10;

///////////////////////////////////////////////
var net = [];
var squareSize = 0;
var drawingByMoveActivated = false;
var lastRenderSquare = null;
var squareTypeToSet = boxType.START;
var lastRenderPoint = {};
function Init(canvas){
	ClearCanvas(canvas);
	ResetLastRenderSquare();
}

function GenerateNet(canvas){
	squareSize = Math.floor(Math.min((canvas.width/boxPerRow), (canvas.height/rowsCount)));

	net = [];
	for (var r=0; r<rowsCount; r++){

		for (var c=0; c<boxPerRow; c++){
			net.push({
				x: c*squareSize,
				y: r*squareSize,
				type: boxType.NORMAL
			})
		}
	}
}

function ResetLastRenderSquare(){
	lastRenderSquare = null;
}

function SetLastRenderSquare(square){
	lastRenderSquare = square;
}

function ClearCanvas(canvas){
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function DrawNet(canvas){
	ClearCanvas(canvas);

	for (var i=0; i<net.length; i++) {
		DrawSquare(net[i], canvas);
  	}
}

function DrawSquare(squareObj, canvas){
	var ctx = canvas.getContext('2d');

	switch (squareObj.type){
		case boxType.NORMAL:
			ctx.fillStyle = "black";
			ctx.strokeRect(squareObj.x, squareObj.y, squareSize, squareSize);
			return;
		case boxType.START:
			ctx.fillStyle = "green";
			break;
		case boxType.END:
			ctx.fillStyle = "red";
			break;
		case boxType.OBSTACLE:
			ctx.fillStyle = "gray"
			break;
	}

	ctx.fillRect(squareObj.x, squareObj.y, squareSize, squareSize);
}

function GetSquareByCord(x, y){
	var posInRow = Math.floor(x / squareSize);
	var rowIndex = Math.floor(y / squareSize);

	var posInList = rowIndex * boxPerRow + posInRow;
	return net[posInList];
}

function ChangeSquareType(square) {
	square.type = squareTypeToSet;
	if (squareTypeToSet <= 2)
		squareTypeToSet++;
}



// ======== interakcje ===========
$("canvas").on('click mousemove', function(e){
	if (e.type == "mousemove" && !drawingByMoveActivated)
		return; 

	var x = e.offsetX;
	var y = e.offsetY;
	var square = GetSquareByCord(x, y);
	if (lastRenderSquare != square) {
		ChangeSquareType(square);
		DrawNet(cnv);

		lastRenderSquare = square;
	}
});

$("canvas").on('mousedown', function(e){
	drawingByMoveActivated = true;
	ResetLastRenderSquare();
})

$(window).on('mouseup', function(e){
	drawingByMoveActivated = false;
})


$(function(){
	Init(cnv);
	GenerateNet(cnv);
	DrawNet(cnv);	
})

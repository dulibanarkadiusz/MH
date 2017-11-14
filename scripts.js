const cnv = document.getElementById('canvas');
const boxType = {
	NORMAL : 0,
	START : 1,
	END : 2,
	OBSTACLE : 3,
	PATH : 9
};
const mousemoveType = {
	ERASING : 0,
	DRAWING : 1
}
const boxPerRow = 10; 
const rowsCount = 10;

///////////////////////////////////////////////
var net = [];
var squareSize = 0;
var drawingByMoveActivated = false;
var lastRenderSquare = null;
var squareTypeToSet = boxType.START;
var lastRenderPoint = {};
var mousemoveMode = mousemoveType.DRAWING;
function Init(canvas){
	ClearCanvas(canvas);
	ResetLastRenderSquare();
}


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! do poprawy
var node = class{
	constructor(id){this.id=id}
}

//	Used to determine if starting point and end point was placed
//	in order to place regular blocks
var startPlaced 	= false;
var endPlaced		= false;

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

function IsMouseMoveAcceptable(mouseAction){
	return (mouseAction != "mousemove" || (drawingByMoveActivated && startPlaced && endPlaced));
}

function DrawSquare(squareObj, canvas){
	var ctx = canvas.getContext('2d');

	switch (squareObj.type){
		case boxType.NORMAL:
			ctx.fillStyle = "DimGrey";
			ctx.strokeRect(squareObj.x, squareObj.y, squareSize, squareSize);
			return;
		case boxType.START:
			ctx.fillStyle = "DarkSeaGreen";
			break;
		case boxType.END:
			ctx.fillStyle = "LightCoral";
			break;
		case boxType.OBSTACLE:
			ctx.fillStyle = "SlateGrey";
			break;
		case boxType.PATH:
			ctx.fillStyle = "Linen";
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

function SetPenOrRubber(square){
	if (square.type > boxType.NORMAL){
		mousemoveMode = mousemoveType.ERASING;
	}
	else{
		mousemoveMode = mousemoveType.DRAWING;
	}
}

function ClearPath(){
	net.forEach(function(sq){
		if (sq.type == boxType.PATH){
			sq.type == boxType.NORMAL;
		}
	});
}

function SetPath(indexesList){
	indexesList.forEach(
		function(index){
			try{
				net[index].type = boxType.PATH;
			}
			catch(ex){
				console.log("SetPath() exception: " + ex.message);
			}
		});
}

function ChangeSquareType(square) {
	// square.type = squareTypeToSet;
	// if (squareTypeToSet <= 2)
	// 	squareTypeToSet++;


	//	Set of rules that allow to put box of each type
	//	depending on what boxes have already been put

	//	If box is normal then set:
	//		start if hasn't been placed already
	//		end if hasn't been placed already
	//		obstacle

	if(square.type==boxType.NORMAL && (mousemoveMode == mousemoveType.DRAWING))
	{
		if(!startPlaced)
		{
			square.type = boxType.START;
			startPlaced=true;
		}
		else if(!endPlaced)
		{
			square.type = boxType.END;
			endPlaced=true;
		}
		else
		{
			square.type = boxType.OBSTACLE;
		}
	}
	
	//	Actions when clicking on a block	
	else if (mousemoveMode == mousemoveType.ERASING)
	{

		if(square.type == boxType.START)
		{
			startPlaced = false;
		}
		else if(square.type == boxType.END)
		{
			endPlaced = false;
		}
		square.type=boxType.NORMAL;
	}
}



// ======== interakcje ===========
$("canvas").on('click mousemove', function(e){
	if (!IsMouseMoveAcceptable(e.type)){
		return;	// drawing by mousemove is not allowed 
	}

	var x = e.offsetX;
	var y = e.offsetY;
	var square = GetSquareByCord(x, y);

	if (lastRenderSquare != square) { // dont color the same square twice
		ChangeSquareType(square);
		DrawNet(cnv);

		lastRenderSquare = square;
	}

});

$("canvas").on('mousedown', function(e){
	drawingByMoveActivated = true;

	var square = GetSquareByCord(e.offsetX, e.offsetY);
	SetPenOrRubber(square);
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


// ======== pathfinding ===========

//	Returns an array consiting of neighbors in a cross-shape
function getNeighbours(i)
{
	var array=[];

	if(i%boxPerRow!=0)
	{
		if(checkIfNotOccupied(i-1))
		array.push(new node(i-1));
	}
	if(i%boxPerRow!=boxPerRow-1)
	{
		if(checkIfNotOccupied(i+1))
		array.push(new node(i+1));
	}
	if(i-boxPerRow>0)
	{
		if(checkIfNotOccupied(i-boxPerRow))
		array.push(new node(i-boxPerRow));
	}
	if(i+boxPerRow<boxPerRow*rowsCount)
	{
		if(checkIfNotOccupied(i+boxPerRow))
		array.push(new node(i+boxPerRow));
	}
	return array;
}

//	Checks if "i" in "net" is occupied by an obstacle
function checkIfNotOccupied(i)
{
	if(net[i].type != boxType.OBSTACLE)
	{
		return true;
	}
	return false;
}


//	Checks if node with an id doesn't repeat itself inside
//	an array
function includesNode(array,node)
{
	for(var i=0;i<array.length;i++)
	{
		if(array[i].id==node.id)
		{
			return true;
		}
	}
	return false;
}


//	BFS_Search
//		frontier	- stack where all nodes that should be taken 
//					  care of in the future
//		visited		- already visited nodes
//		fin			- POPRAWIC
function BFS_search(start,end)
{
	var frontier = [new node(start)];
	var visited = [new node(start)];
	var bool = false;
	var fin;

	while(frontier.length>0 && bool==false)
	{
		var obj 	= frontier.pop();
		var list 	= getNeighbours(obj.id);
		list.forEach(function(el)
		{
			el.last=obj;
			if(el.id==end)
			{
				bool=true;
				tmp=el;
				while(tmp.last)
				{
					tmp=tmp.last;
				}
				fin = el;
				return el;
			}	
			// else if(!visited.includes(el))
			else if(!includesNode(visited,el))
			{
				visited.push(el);
				frontier.unshift(el);
			}
		})
	}
	return fin;
}
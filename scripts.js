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
var neighborsHistory = [];
var squareSize = 0;
var drawingByMoveActivated = false;
var lastRenderSquare = null;
var squareTypeToSet = boxType.START;
var lastRenderPoint = {};
var mousemoveMode = mousemoveType.DRAWING;
var displayIteration = 0;
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
				type: boxType.NORMAL,
				neihbId: 0,
				isSearched: false,
				lastSearched: false
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

	net.forEach(function(sq){
		sq.isSearched = false;
		sq.lastSearched = false;
	});

	ctx.strokeStyle = 'LightGray';
}

function DrawNet(canvas){
	ClearCanvas(canvas);
	SetNeighbours(neighborsHistory, displayIteration);

	for (var i=0; i<net.length; i++) {
		DrawSquare(net[i], canvas);
  	}
}

function SetNeighbours(neighborsList, iteration){
	var blockId = 0; 
	for (var i=0; i<iteration; i++){		
		var list = neighborsList[i];

		for (var j=0; j<list.length; j++){
			var square = net[list[j]];
			square.neihbId = blockId++;
			square.isSearched = true;

			if (i==iteration-1){
				square.lastSearched = true;
			}
		}
	}
}

function IsMouseMoveAcceptable(mouseAction){
	return (mouseAction != "mousemove" || (drawingByMoveActivated && startPlaced && endPlaced));
}

function DrawSquare(squareObj, canvas){
	var ctx = canvas.getContext('2d');

	switch (squareObj.type){
		case boxType.NORMAL:
			if (squareObj.lastSearched){
				ctx.fillStyle = "#80bbff";
			}
			else if (squareObj.isSearched){ // neighbour
				ctx.fillStyle = "#dfeeff";
			}
			else{
				ctx.fillStyle = "DimGrey";
				ctx.strokeRect(squareObj.x, squareObj.y, squareSize, squareSize);
				return;
			}
			break;
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
	
	ctx.strokeStyle = 'LightGray';
	var fillRect = false;
	ctx.rect(squareObj.x, squareObj.y, squareSize, squareSize);
	ctx.stroke();

	if (squareObj.isSearched){
		ctx.font = "16px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "Gray";
		ctx.fillText(squareObj.neihbId+1+"",squareObj.x+squareSize/2,squareObj.y+24);
	}
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

function SaveToHistory(list, neihboursHistoryList){
	neihboursHistoryList.push(list);
	UpdateView();
}

// ======== interakcje ===========
function UpdateView(){
	$(".slider").attr("max", neighborsHistory.length);
}

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
});

$(window).on('mouseup', function(e){
	drawingByMoveActivated = false;
});

$(".slider").on('change', function(e){
	displayIteration = e.target.value;
	DrawNet(cnv);
});
$(".slider").on('mousemove', function(e){
	$('#iterationNumber').html(e.target.value);
});

$(function(){
	Init(cnv);
	GenerateNet(cnv);
	DrawNet(cnv);	
});


// ======== pathfinding ===========

//	Returns an array consiting of neighbors in a cross-shape
function isOutOfRange(int)
{
	if(int<0 || int>boxPerRow*rowsCount)
		return true;
	return false;
}

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
	if(!isOutOfRange(i))
	{
		if(net[i].type != boxType.OBSTACLE)
		{
			return true;
		}
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

function nodeToList(node)
{
    var tmp = node;
    var list = [];
    while (tmp)
    {
        list.push(tmp.id);
        tmp = tmp.last;
    }
    return list;
}


//	BFS_Search
//		frontier	- stack where all nodes that should be taken 
//					  care of in the future
//		visited		- already visited nodes
//		fin			- POPRAWIC
//	Things to look into:
//	fin is a variable that's used to go around the foreach statement
//		for an easier return
//	history, ithistory and visited have bascially the same function,
//		these can be narrowed to two
function BFS_search(start,end)
{
	var frontier = [new node(start)];
	var visited = [new node(start)];
	var bool = false;
	var fin;
	var history = [];

	while(frontier.length>0 && bool==false)
	{
		var obj 	= frontier.pop();
		var list 	= getNeighbours(obj.id);	
		var itHist=[];	
		list.forEach(function(el)
		{
			if(el.id==end)
			{
				bool=true;
				fin = el;
				console.log(fin);
				return el;
			}	
			else if(!includesNode(visited,el))
			{
				//
				itHist.push(el.id);
				//
				visited.push(el);
				frontier.unshift(el);
			}
		})
		//
		//SaveToHistory(itHist,neighborsHistory)
		history.push(itHist);
		//
	}
	// return nodeToList(fin);
	return [nodeToList(fin),history];
}
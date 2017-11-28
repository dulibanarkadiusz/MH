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
var displayIteration = 0;
var maxItCount = 0;
/////////////////////
var cnvs = [];
	cnvs.push(
		{
			canvas: $("#canvas")[0],
			history: [],
			shortestPath: [],
			algorithm: DFS_search,
		});

	cnvs.push(
		{
			canvas: $("#canvas2")[0],
			history: [],
			shortestPath: [],
			algorithm: BFS_search
		});
///////////////////////

function Init(canvas){
	ClearCanvas(canvas);
	ResetLastRenderSquare();
}

// Simulation
var ongoingSimulation = false;
var simSpeed = 50;

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

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	net.forEach(function(sq){
		sq.isSearched = false;
		sq.lastSearched = false;
		sq.isPathElement = false;
	});
}

function DrawNet(canvasObj){
	ClearCanvas(canvasObj.canvas);
	SetNeighbours(canvasObj.history, displayIteration);
	SetShortestPath(canvasObj.shortestPath);

	for (var i=0; i<net.length; i++) {
		DrawSquare(net[i], canvasObj.canvas);
  	}

  	if(GetFirstIdSquareOfType(net, boxType.START) !== undefined && GetFirstIdSquareOfType(net, boxType.END) !== undefined){
  		$(".slider-box").show("slow");
  	}
  	else{
  		$(".slider-box").hide("slow");
  	}
}

function SetNeighbours(neighborsList, iteration){
	var blockId = 0; 

	if (iteration > neighborsList.length)
		iteration = neighborsList.length;

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


function SetShortestPath(pathSquareList){
	pathSquareList.forEach(function(sqIndex){
		net[sqIndex].isPathElement = true;
	});

}

function IsMouseMoveAcceptable(mouseAction){
	return (mouseAction != "mousemove" || (drawingByMoveActivated && startPlaced && endPlaced));
}

function DrawSquare(squareObj, canvas){
	var ctx = canvas.getContext('2d');

	switch (squareObj.type){
		case boxType.NORMAL:
			if (squareObj.isPathElement && displayIteration == maxItCount){
				ctx.fillStyle = "#ffff66";
			}	
			else if (squareObj.lastSearched){
				ctx.fillStyle = "#9fddfb";
			}
			else if (squareObj.isSearched){ // neighbour
				ctx.fillStyle = "#dfeeff";
			}
			else{
				ctx.fillStyle = "#e0e0e0";
				//ctx.strokeRect(squareObj.x, squareObj.y, squareSize, squareSize);
				//return;
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

	ctx.fillRect(squareObj.x, squareObj.y, squareSize-1, squareSize-1);
	
	if (squareObj.isSearched){
		ctx.font = "16px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "#656565";
		ctx.fillText(squareObj.neihbId+1+"",squareObj.x+squareSize/2,squareObj.y+24);
	}
}

function GetSquareByCord(x, y){
	var posInRow = Math.floor(x / squareSize);
	var rowIndex = Math.floor(y / squareSize);

	var posInList = rowIndex * boxPerRow + posInRow;
	return net[posInList];
}

function GetFirstIdSquareOfType(netlist, type){
	for (var i=0; i<netlist.length; i++)
	{
		var sq = netlist[i];
		if (sq.type == type){
			return i;
		}
	};
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

	OnCanvasClick();
}

function OnCanvasClick(){
	maxItCount = 0
	cnvs.forEach(function(canv){
		var result = canv.algorithm(GetFirstIdSquareOfType(net, boxType.START), GetFirstIdSquareOfType(net, boxType.END));
		canv.history = result[1];
		canv.shortestPath = result[0];

		if (canv.history.length > maxItCount){
			maxItCount = canv.history.length;
		}
	});

	UpdateView();
	SetIteration(maxItCount);
}

function playIterations() {
	var j = 0;
	ongoingSimulation = true;
    var interval = setInterval(function(){ 
		SetIteration(j);
		j++;
		if(j==maxItCount+1)
		{
			clearInterval(interval);
			ongoingSimulation=false;
		}
	 }, simSpeed);
}

function SetIteration(i){
	if (i<0 || i > maxItCount)
		return;

	displayIteration = i;
	$('#iterationNumber').html(displayIteration);
	$('.slider').val(displayIteration);

	cnvs.forEach(function(canv){
		DrawNet(canv);
	});
}
// ======== interakcje ===========
function UpdateView(){
	var max = 0;
	cnvs.forEach(function(canv){
		var len = canv.history.length;
		if (len > max)
			max = len;
		
	});

	$(".slider").attr("max", max);
}

var timer = null;
$("canvas").on('click mousemove', function(e){
	if (!IsMouseMoveAcceptable(e.type)){
		return;	// drawing by mousemove is not allowed 
	}

	var x = e.offsetX;
	var y = e.offsetY;
	var square = GetSquareByCord(x, y);

	if (lastRenderSquare != square) { // dont color the same square twice
		ChangeSquareType(square);
		DrawNet(cnvs[0]);
		DrawNet(cnvs[1]);

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
	SetIteration(e.target.value);
});

$("#nextIt").on('click',function(e){
	SetIteration(parseInt(displayIteration)+1);
});

$("#prevIt").on('click', function(e){
	SetIteration(displayIteration-1);
});

//

$("#buttonPlay").on('click',function(e){
	if(ongoingSimulation==false){
		playIterations();
	}
});

//

$(function(){
	Init(cnvs[0].canvas);
	GenerateNet(cnvs[0].canvas);
	DrawNet(cnvs[0]);

	Init(cnvs[1].canvas);
	GenerateNet(cnvs[1].canvas);
	DrawNet(cnvs[1]);	
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
			el.last = obj;
			if(el.id==end)
			{
				bool=true;
				fin = el;
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
		if(itHist.length>0)history.push(itHist);
		//
	}
	// return nodeToList(fin);

	return [nodeToList(fin),history];
}

function DFS_search(start,end)
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
			el.last = obj;
			if(el.id==end)
			{
				bool=true;
				fin = el;
				return el;
			}	
			else if(!includesNode(visited,el))
			{
				//
				itHist.push(el.id);
				//
				visited.push(el);
				frontier.push(el);
			}
		})
		//
		//SaveToHistory(itHist,neighborsHistory)
		if(itHist.length>0)history.push(itHist);
		//
	}
	// return nodeToList(fin);

	return [nodeToList(fin),history];
}

function heuristicA(a,b)
{
	var xa = a%boxPerRow;
	var xb = b%boxPerRow
	var ya = Math.floor(a/boxPerRow);
	var yb = Math.floor(b/boxPerRow);
	// console.log(" xa ",xa,"\n xb ",xb,"\n ya ",ya,"\n yb ", yb);
	//return Math.abs(xa-xb)+Math.abs(ya-yb)
	return Math.pow(xa-xb,2)+Math.pow(ya-yb,2)
}

function heuristicB(a,b)
{
	var xa = a%boxPerRow;
	var xb = b%boxPerRow
	var ya = Math.floor(a/boxPerRow);
	var yb = Math.floor(b/boxPerRow);
	// console.log(" xa ",xa,"\n xb ",xb,"\n ya ",ya,"\n yb ", yb);
	return Math.abs(xa-xb)+Math.abs(ya-yb)
	//return Math.pow(xa-xb,2)+Math.pow(ya-yb,2)
}

function sortNumber(a,b) {
    return a[0] - b[0];
}

function GBF_Search(start,end,H)
{
	var frontier = [[0,new node(start)]];
	var visited = [new node(start)];
	var bool = false;
	var fin;
	var history = [];

	while(frontier.length>0 && bool==false)
	{
		frontier.sort(sortNumber);
		frontier.reverse();
		// frontier.forEach(function(el){console.log(el)});
		var obj 	= frontier.pop()[1];
		// console.log("\n -- \n");
		// console.log(heuristic(obj.id,end));
		// console.log("\n\n ### \n\n");
		var list 	= getNeighbours(obj.id);	
		var itHist=[];	
		list.forEach(function(el)
		{
			el.last = obj;
			if(el.id==end)
			{
				bool=true;
				fin = el;
				return el;
			}	
			else if(!includesNode(visited,el))
			{
				//
				itHist.push(el.id);
				//
				visited.push(el);
				frontier.push([H(el.id,end),el]);				
			}
		})
		// frontier.forEach(function(el){console.log(el)});
		// console.log("\n\n")

		if(itHist.length>0)history.push(itHist);
		
	}
	return [nodeToList(fin),history];
}

// function Astar_Search(start,end,H)
// {
// 	var frontier = [[0,new node(start)]];
// 	var cost_so_far = {};
// 	var closed = [];
// 	var bool = false;
// 	var fin;
// 	var history = [];

// 	cost_so_far[obj]=0;

// 	while(frontier.length>0 && bool==false)
// 	{		
// 		var obj 	= frontier.pop()[1];
// 		var list 	= getNeighbours(obj.id);	
// 		var itHist=[];	
// 		list.forEach(function(el)
// 		{
// 			if(el.id==end)
// 			{
// 				bool=true;
// 				fin = el;
// 				return el;
// 			}	
// 			new_cost = cost_so_far[obj]+1;
// 			if(cost_so_far.indexOf(el.id) || new_cost < cost_so_far[el.id])
// 			{
// 				cost_so_far[el.id]=new_cost;
// 				priority = new_cost + H(el.id,end);
// 				frontier.push([1,el]);
// 				el.last=obj;
// 				itHist.push(el);
// 			}
// 			console.log(obj.id);
// 		})
// 		if(itHist.length>0)history.push(itHist);		
// 	}
// 	return fin;
// 	//return [nodeToList(fin),history];
// }
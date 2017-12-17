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
var boxPerRow = 10; 
var rowsCount = 10;

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
var algs = [];
	algs.push({
			name: "BFS",
			func: BFS_search,
			funcParam: null
		});

	algs.push({
			name: "DFS",
			func: DFS_search,
			funcParam: null
		});

	algs.push({
			name: "GBF A",
			func: GBF_Search,
			funcParam: heuristicA
		});

	algs.push({
			name: "GBF B",
			func: GBF_Search,
			funcParam: heuristicB
		});
	algs.push({
			name: "A*",
			func: Astar_Search,
			funcParam: heuristicB
		});

var cnvs = [];
	cnvs.push(
		{
			canvas: $("#canvas")[0],
			history: [],
			shortestPath: [],
			algorithm: null,
			neighborsCount: 0,
			itCount: 0,
			resultView: {
				it: $("#result-A .itCount"),
				neigh: $("#result-A .neighCount"),
				pathLen: $("#result-A .pathLength")
			}
		});

	cnvs.push(
		{
			canvas: $("#canvas2")[0],
			history: [],
			shortestPath: [],
			algorithm: null,
			neighborsCount: 0,
			itCount: 0,
			resultView: {
				it: $("#result-B .itCount"),
				neigh: $("#result-B .neighCount"),
				pathLen: $("#result-B .pathLength")
			}
		});
///////////////////////

function InitAlgList(){
	var i = 0;
	algs.forEach(function (alg){
		$(".alg-list")
			.append($("<option></option>")
			.attr("value", i++)
			.text(alg.name));
	});

	
}

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

function GetMaxIdNeighbour(){
	var max = 0;
	net.forEach(function(sq){
		if (max < sq.neihbId){
			max = sq.neihbId;
		}
	});

	return max;
}

function DrawResults(canvasObj){
	$(canvasObj.resultView.it).html(canvasObj.itCount); 
	$(canvasObj.resultView.neigh).html(canvasObj.neighborsCount); 
	$(canvasObj.resultView.pathLen).html(canvasObj.shortestPath.length); 
}

function DrawNet(canvasObj){
	ClearCanvas(canvasObj.canvas);

	var count = SetNeighbours(canvasObj.history, displayIteration);
	if (!ongoingSimulation)
		canvasObj.neighborsCount = count;
	canvasObj.itCount = canvasObj.history.length;
	SetShortestPath(canvasObj.shortestPath);

	for (var i=0; i<net.length; i++) {
		DrawSquare(net[i], canvasObj.canvas);
  	}

  	if(GetFirstIdSquareOfType(net, boxType.START) !== undefined && GetFirstIdSquareOfType(net, boxType.END) !== undefined){
  		$(".slider-box").show("slow");
  		$(".result-viewer").fadeIn();
  	}
  	else{
  		$(".slider-box").hide("slow");
  		$(".result-viewer").fadeOut();
  	}

  	DrawResults(canvasObj);
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

	return blockId;
}


function SetShortestPath(pathSquareList){
	pathSquareList.forEach(function(sqIndex){
		net[sqIndex].isPathElement = true;
	});

}

function IsMouseMoveAcceptable(mouseAction){
	return (mouseAction != "mousemove" || (drawingByMoveActivated && startPlaced && endPlaced));
}

var fontSize = 160 / rowsCount;
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
		ctx.font = fontSize+"px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "#656565";
		ctx.fillText(squareObj.neihbId+1+"",squareObj.x+squareSize/2,squareObj.y+(fontSize*1.5));
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

function EraseCanvas(clearAlsoObjects)
{
	net.forEach(function(square){
		square.isSearched = false;
		square.isPathElement = false;

		if (clearAlsoObjects){
			startPlaced = endPlaced = false;
			square.type = boxType.NORMAL;
		}
	});

	cnvs.forEach(function(canv){
		canv.shortestPath = [];
	});
}

function OnCanvasClick(){
	maxItCount = 0

	if (!startPlaced || !endPlaced){
		EraseCanvas(false);
		SetIteration(0);
		UpdateView();
		return;
	}

	cnvs.forEach(function(canv){
		var result;
		if (canv.algorithm.funcParam !== null){
			result = canv.algorithm.func(GetFirstIdSquareOfType(net, boxType.START), GetFirstIdSquareOfType(net, boxType.END), canv.algorithm.funcParam);
		}
		else{
			result = canv.algorithm.func(GetFirstIdSquareOfType(net, boxType.START), GetFirstIdSquareOfType(net, boxType.END));
		}
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
			switchScreenEnabled();
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
	if (!IsMouseMoveAcceptable(e.type) || ongoingSimulation){
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
	if (ongoingSimulation)
		return;

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

$("#erase").on('click', function(e){
	EraseCanvas(true);
	SetIteration(0);
	UpdateView();
});

$("input[type=radio]").on('change', function(e){
	var netsize = $("input[type=radio][name=netSize]:checked" ).val();
	rowsCount = parseInt(netsize); 
	boxPerRow = parseInt(rowsCount);
	fontSize = 160 / rowsCount;

	EraseCanvas(true);
	SetIteration(0);

	cnvs.forEach(function(cnv){
		Init(cnv.canvas);
		GenerateNet(cnv.canvas);
		DrawNet(cnv);
	});
	UpdateView();
});

//

$("#buttonPlay").on('click',function(e){
	if(ongoingSimulation==false){
		switchScreenEnabled();
		playIterations();
	}
});

$("#alg-A").on('change', function(e){
	cnvs[0].algorithm = algs[e.target.value];
	OnCanvasClick();
});

$("#alg-B").on('change', function(e){
	cnvs[1].algorithm = algs[e.target.value];
	OnCanvasClick();
});
//

$(function(){
	cnvs.forEach(function(cnv){
		Init(cnv.canvas);
		GenerateNet(cnv.canvas);
		DrawNet(cnv);
	});

	InitAlgList();
	$("#alg-A").val(0);
	$("#alg-B").val(1);
	$(".alg-list").change();
});

function switchScreenEnabled(){
	if ($(".disabled").length>0){
		$("body").removeClass("disabled");
		$("button").removeAttr("disabled");
		$("input").removeAttr("disabled");
		$("select").removeAttr("disabled");	
	}else{
		$("body").addClass("disabled");
		$("button").attr("disabled", "disabled");
		$("input").attr("disabled", "disabled");
		$("select").attr("disabled", "disabled");
	}
}


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
	if(i-boxPerRow>=0)
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
	var it = 0 ;

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
			it+=0.1;
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
				frontier.push([H(el.id,end)+it,el]);				
			}
		})
		it=0;
		// frontier.forEach(function(el){console.log(el)});
		// console.log("\n\n")

		if(itHist.length>0)history.push(itHist);
		
	}
	return [nodeToList(fin),history];
}

function Astar_Search(start,end,H)
{
	var frontier = [[0,new node(start)]];
	var cost_so_far = [];
	var bool = false;
	var fin;
	var history = [];
	var new_cost;
	var it=0;

	cost_so_far[start]=0;

	while(frontier.length>0 && bool==false)
	{			
		frontier.sort(sortNumber);
		frontier.reverse();	
		var obj 	= frontier.pop()[1];
		var list 	= getNeighbours(obj.id);	
		var itHist=[];	

		var odd=true;
		list.forEach(function(el)
		{
			it++
			if(el.id==end)
			{
				el.last=obj;
				bool=true;
				fin = el;
				return el;
			}	
			new_cost = cost_so_far[obj.id]+H(obj.id,el.id);
			if(!cost_so_far[el.id] || new_cost < cost_so_far[el.id])
			{
				el.last=obj;
				cost_so_far[el.id]=new_cost;
				priority = new_cost + H(el.id,end)-it*0.001;
				frontier.push([priority,el]);
				itHist.push(el.id);
			}
		})
		if(itHist.length>0)history.push(itHist);		
	}
	return [nodeToList(fin),history];
}

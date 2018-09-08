//List List application code
//Version 1.20180805

navigator.serviceWorker.register('/list-list/serviceworker.js', {scope: '/list-list/'}).then(function(reg) {
  console.log('Registration succeeded. Scope is ' + reg.scope);
	reg.update();
}).catch(function(error) {
	console.log('Registration failed with ' + error);
});

var database = new localStorageDB("database", localStorage);
initDatabase();

var nextItemID = parseInt(database.queryAll("meta", {
	query: function(row){
		if(row.name == "items-id")
			return true;;
		return false;
		}
})[0].content);

var parentItem = 0;

var list = document.getElementById('list');
var back = document.getElementById('back');
var currentItem = document.getElementById('currentItem');

document.getElementById('item-form').addEventListener("submit", newItem);

document.getElementById('cancel-item').onclick = function(){
	document.getElementById('edit-screen').classList.toggle("on");
};

document.getElementById('edit-form').onsubmit = editItem;

function initDatabase(){
if(database.isNew()){
		database.createTable("items", ["id", "parent", "text",]);
		
		database.createTable("meta", ["name", "content"]);
		database.insert("meta", {name: "items-id", content: 1});

		database.commit();
	}
}

function newItem(e){
	e.preventDefault();
	var text = document.getElementById('text').value;
	if(text != ""){
		if(text.includes('[copyall')){
			var id = text.substring(8, text.indexOf("]"));
			copyAll(parseInt(id), parentItem);
		}
		else if(text.includes('[copyinner')){
			var id = text.substring(10, text.indexOf("]"));
			copyInner(parseInt(id), parentItem);
		}
		else{
			document.getElementById('text').value = "";
			database.insert("items", {id: nextItemID, parent: parentItem, text: text});
			nextItemID++;
			database.update("meta", {name: "items-id"}, function(row){
				row.content = nextItemID;
				return row;
			});
			database.commit();
			drawList();
		}
	}
}

function editItem(e){
	e.preventDefault();
	var text = document.getElementById('currentItemText').value;
	database.update("items", {id: parentItem}, function(row){
		row.text = text;
		return row;
	});
	database.commit();
	document.getElementById('edit-screen').classList.toggle("on");
	drawList();
}

function drawList(){
	list.innerHTML = "";
	var items = database.queryAll("items", {query: {parent: parentItem}, sort: [["text", "ASC"]]});
	var backItem;
	if(parentItem == 0){
		back.innerHTML = '&nbsp;';
		back.onclick = null;

		currentItem.innerHTML = '&nbsp;';
	}
	else{
		backItem = database.queryAll("items", {query: {id: parentItem}})[0];
	
		back.innerHTML = '&nwarr;'; 
		back.onclick = function(){
			toParent(backItem.parent);
			document.getElementById('edit-screen').classList.remove('on');
		}

		currentItem.innerHTML = backItem.text;
	}
	
	for(var a = 0; a < items.length; a++){
		var text = items[a].text;
		var textClasses = "text";
		if(text.includes('[note]')){
			text = text.substring(6);
			textClasses += ' note';
		}
		list.innerHTML += '<div class="item"><div class="delete" onclick="deleteItem(' + items[a].id + ')">&nbsp;&#10005;&nbsp;</div><div class="' + textClasses + '" onclick="toParent(' + items[a].id + ')">' + '(' + items[a].id + ') ' + text + '</div></div>';
	}

	if(document.getElementById("currentItem")){
		document.getElementById("currentItem").onclick = function(){
			document.getElementById('currentItemText').value = document.getElementById("currentItem").innerText;
			document.getElementById('edit-screen').classList.toggle('on');
			document.getElementById('currentItemText').focus();
		}
	}
}

function copyAll(_id, _parent){
	var item = database.queryAll("items", {query: {id: _id}});
	if(item.length > 0){
		var tempParent = copyItemContents(item[0], _parent);
		var items = database.queryAll("items", {query: {parent: _id}});
		for(var a = 0; a < items.length; a++)
			copyAll(items[a].id, tempParent);
	}
	database.commit();
	drawList();
	document.getElementById('text').value = "";
}

function copyInner(_id, _parent){
	var items = database.queryAll("items", {query: {parent: _id}});
	for(var a = 0; a < items.length; a++){
		var tempParent = copyItemContents(items[a], _parent);
		copyInner(items[a].id, tempParent);
	}
	database.commit();
	drawList();
	document.getElementById('text').value = "";
}

function copyItemContents(item, _parent){
	database.insert("items", {id: nextItemID, parent: _parent, text: item.text});
	nextItemID++;
	database.update("meta", {name: "items-id"}, function(row){
		row.content = nextItemID;
		return row;
	});
	return nextItemID - 1;
}

function deleteItem(id){
	var items = database.queryAll("items", {query: {parent: id}});
	if(items.length == 0){
		database.deleteRows("items", {id: id});
		database.commit();
		drawList();
	}
	else
	{
		alert("ERROR: Item can not be deleted. Delete sub-items first.");
	}
}

function toParent(id){
	parentItem = id;
	drawList();
}

drawList();

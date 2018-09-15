//List List application code

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
		else if(text.includes('[copyouter')){
			var id = text.substring(10, text.indexOf("]"));
			copyOuter(parseInt(id), parentItem);
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
	
		back.innerHTML = '&#8592;'; 
		back.onclick = function(){
			toParent(backItem.parent);
			document.getElementById('edit-screen').classList.remove('on');
		}

		currentItem.innerHTML = backItem.text;
	}
	
	for(var a = 0; a < items.length; a++){
		var text = items[a].text;
		var textClasses = 'text';
		var itemId = items[a].id;
		var itemIcon = '&nbsp;';
		var numChilderen = database.queryAll("items", {query: {parent: items[a].id}}).length;
		if(text.includes('[note]')){
			text = text.substring(6);
			textClasses += ' note';
		}
		else if(text.includes('[link')){
			var id = text.substring(5, text.indexOf("]"));
			var item = getLink(parseInt(id));
			if(item){
				text = getLink(parseInt(id)).text;
				itemId = item.id;
				itemIcon = '&#128279;';
				textClasses += ' link';
			}
		}
		if(numChilderen > 0){
			itemIcon = '&#8594;';	
		}
		list.innerHTML += '<div class="item"><div class="delete" onclick="deleteItem(' + items[a].id + ')">&nbsp;&#10005;&nbsp;</div><div class="' + textClasses + '" onclick="toParent(' + itemId + ')">' + '(' + items[a].id + ') ' + text + '</div><div class="icon">' + itemIcon + '</div></div>';
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

function copyOuter(_id, _parent){
	var item = database.queryAll("items", {query: {id: _id}});
	if(item.length > 0){
		copyItemContents(item[0], _parent);
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

function getLink(_id){
	var item = database.queryAll("items", {query: {id: _id}})[0];
	return item;
}

function deleteItem(id){
	var item = getLink(id);
	if(item.text.includes('[link')){
		var linkedItem = getLink(parseInt(item.text.substring(5, item.text.indexOf(']'))));
		if(linkedItem){
			if(confirm('This is a link... Delete real item as well?')){
				 if(!deleteItem(linkedItem.id)){
					nvlog.log('item not deleted');
					return false;
				 }
			}
		}
	}
	var items = database.queryAll("items", {query: {parent: id}});
	if(items.length == 0){
		database.deleteRows("items", {id: id});
		database.commit();
		drawList();
	}
	else if(confirm("This item contains sub-items.\nAre you sure you want to remove the sub-items as well?")){
		database.deleteRows("items", {id: id});
		deleteAll(id);
		database.commit();
		drawList();
	}
	else{
		return false;
	}
	return true;
}

function deleteAll(_id){
	var items = database.queryAll("items", {query: {parent: _id}});
	for(var a = 0; a < items.length; a++){
		deleteAll(items[a].id);
		database.deleteRows("items", {id: items[a].id});
	}
}	

function toParent(id){
	parentItem = id;
	drawList();
}

drawList();

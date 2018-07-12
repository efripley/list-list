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
document.getElementById('item-form').addEventListener("submit", newItem);

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

function drawList(){
	list.innerHTML = "";
	var items = database.queryAll("items", {query: {parent: parentItem}});
	var backItem;
	if(parentItem == 0){
		list.innerHTML += '<div class="current-item"><div class="back">&nbsp;</div><div class="text"></div></div>';
	}
	else{
		backItem  = database.queryAll("items", {query: {id: parentItem}})[0];
		list.innerHTML += '<div class="current-item"><div class="back" onclick="toParent(' + backItem.parent + ')">&nwarr;</div><div class="text">' + backItem.text + '</div></div>';
	}
	for(var a = 0; a < items.length; a++){
		list.innerHTML += '<div class="item"><div class="delete" onclick="deleteItem(' + items[a].id + ')">&nbsp;&#10005;&nbsp;</div><div class="text" onclick="toParent(' + items[a].id + ')">' + items[a].text + '</div></div>';
	}
	document.getElementById('text').focus();
}

function deleteItem(id){
	database.deleteRows("items", {id: id});
	database.commit();
	drawList();
}

function toParent(id){
	parentItem = id;
	drawList();
}

drawList();

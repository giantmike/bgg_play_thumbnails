/*
 * Main entry point from the Get Plays button. Runs all of the logic for the selected week.
*/
function getPlays()
{
	document.getElementById("bgg_game_list").innerHTML="";
	document.getElementById("bgg_code").innerHTML="";	
	
	var weeksBack = document.getElementById("weeks_back").value;
	if (isNaN(weeksBack) || weeksBack=="")
		weeksBack = 0;
	
	var today = new Date();
	var dayOfWeek = today.getDay();  //Sunday = 0, Monday = 1, etc.

	var toDate = new Date();
	toDate.setDate(toDate.getDate() - dayOfWeek - (weeksBack*7));  //Most Recent Sunday
	var fromDate = new Date();
	fromDate.setDate(fromDate.getDate() - dayOfWeek - (weeksBack*7) - 6);	//The monday before that Sunday
	
	document.getElementById("date_to").innerHTML = toDate.toDateString();
	document.getElementById("date_from").innerHTML = fromDate.toDateString();
	document.getElementById("date_range").style.display = "block";
	
	//Async web service call, go to handlePlaysArrayCallback callback function
	downloadPlays("giantmike",formatDate(fromDate),formatDate(toDate), handlePlaysArrayCallback);
}

/*
 * Callback function from the API request to get the list of plays
*/
function handlePlaysArrayCallback(xmlResponse)
{
	var playsArray = xmlResponse;
	
	var gameObject = {};
	var orderedGamesArray = [];
	
	for (var i = playsArray.children.length-1; i>= 0; i--)
	{
		var obj = playsArray.children[i];
		var item = obj.children[0];
		var gameId = item.getAttribute("objectid");
		var name = item.getAttribute("name");
		
		if (!gameObject[gameId])
		{
			gameObject[gameId] = gameId;
		
			//Show game in bulleted list
			addGameToList(gameId, name);
			
			//Add game to array for getting thumbnails
			orderedGamesArray.push(gameId);
		}
	}
	
	//Async web service call, go to handleThingsListCallback callback function
	//BGG only allows 20 things to be gotten in one call, so break up calls
	if (orderedGamesArray.length < 20)
	{
		var orderedGameList = orderedGamesArray.join(',');
		getImageIds(orderedGameList, handleThingsListCallback);
	}
	else
	{
		var thingBlockTotal = Math.floor(orderedGamesArray.length / 20 + 1);
		for (var thingBlock = 1; thingBlock <= thingBlockTotal; thingBlock++)
		{
			var orderedGamesArrayBlock = orderedGamesArray.slice(20 * (thingBlock - 1), 20 * thingBlock);
			var orderedGameListBlock = orderedGamesArrayBlock.join(',');
			getImageIds(orderedGameListBlock, handleThingsListCallback);
		}
	}
	
	document.getElementById("bgg_code_container").style.display = "block";
}


/*
 * Add a single game to the list of games, with a button for copying the [thing] text
*/
function addGameToList(gameId, name)
{
	var gameListItem = "<div class='bgg_game_col1'>";
	gameListItem += "<button type='button' class='button' onclick='copyGame(this, " + gameId + ")'>" + name + "</button>";
	gameListItem += "</div>";
	
	gameListItem += "<div class='bgg_game_item bgg_game_col2' id='bgg_game_" + gameId + "'>";
	gameListItem += "[thing=" + gameId + "][/thing]";
	gameListItem += "</div>";
	
	document.getElementById("bgg_game_list").innerHTML = gameListItem + document.getElementById("bgg_game_list").innerHTML;
}

/*
 * Callback function from the API request to get the list of things from the games plays
*/
function handleThingsListCallback(xmlResponse)
{
	var bggCode = "";
	
	for (var i = 0; i<xmlResponse.children.length; i++)
	{
		var thumbailUrl = xmlResponse.children[i].children[0].textContent;
		var imageId = "";
		if (thumbailUrl.length > 0)
			imageId = parseImageIdFromUrl(thumbailUrl);
		
	
		if (imageId.length > 0)
			bggCode += "[ImageID=" + imageId + "square inline]";
	}
	
	document.getElementById("bgg_code").innerHTML += bggCode;
	document.getElementById("bgg_code_copy").classList.remove("clicked_button");
}

/*
 * Get the thumbnail ID from the url
*/
function parseImageIdFromUrl(url)
{
	return url.match("\\d+\.\\w+$")[0].split('.')[0];
}



/*
 * Button handler to copy the list of images
*/
function copyPlays(event)
{
	var playsString = document.getElementById("bgg_code").innerHTML;
	
	navigator.clipboard.writeText(playsString);
	
	event.classList.add("clicked_button");
}

/*
 * Button handler to copy the specific game [thing] text
*/
function copyGame(event, gameId)
{
	var playsString = document.getElementById("bgg_game_" + gameId).innerHTML;
	
	navigator.clipboard.writeText(playsString);
	
	event.classList.add("clicked_button");
}

/*
 * Formats the date in the way the BGG API expects it to be
*/
function formatDate(date) 
{
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}




/*
 * Call the BGG API to get the plays for the user for the daterange
*/
function downloadPlays(username, mindate, maxdate, callback)
{
	makeRequest(`https://boardgamegeek.com/xmlapi2/plays?username=${username}&mindate=${mindate}&maxdate=${maxdate}`, callback);
}

/*
 * Call the BGG API to get the image IDs from the list of games
*/
function getImageIds(gameList, callback)
{
	makeRequest(`https://boardgamegeek.com/xmlapi2/thing?id=${gameList}&type=boardgame`, callback);
}

/*
 * Helper function to do the work of calling the BGG APIs. Will then callback to the result handler on success
*/
function makeRequest(url, callback) 
{
	var req = new XMLHttpRequest();
	
	req.onreadystatechange = function()
	{
		if (req.readyState === XMLHttpRequest.DONE) 
		{
			//Request complete
			if (req.status >= 200 && req.status < 400)
			{
				//DATA! Yeah!
				var xmlDoc = new DOMParser().parseFromString(req.responseText, "text/xml");
				callback(xmlDoc.children[0]);
			} 
			else 
			{
				//fail
			}
		}
	}
	
	req.open('GET', url, true);
	req.send();
}
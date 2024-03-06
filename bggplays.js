var bggCode = "";

function getPlays()
{
	bggCode = "";
	document.getElementById("bgg_code").innerHTML=bggCode;	

	var weeksBack = document.getElementById("weeks_back").value;
	if (isNaN(weeksBack) || weeksBack=="")
		weeksBack = 0;
	
	var today = new Date();
	var dayOfWeek = today.getDay();  //Sunday = 0, Monday = 1, etc.

	var toDate = new Date();
	toDate.setDate(toDate.getDate() - dayOfWeek - (weeksBack*7));  //Most Recent Sunday
	var fromDate = new Date();
	fromDate.setDate(fromDate.getDate() - dayOfWeek - (weeksBack*7) - 6);		 //The monday before that Sunday
	
	document.getElementById("date_to").innerHTML = toDate.toDateString();
	document.getElementById("date_from").innerHTML = fromDate.toDateString();
	document.getElementById("date_range").style.display = "block";
	
	//Using XMLRequest to avoid CORS
	downloadPlays("giantmike",formatDate(fromDate),formatDate(toDate), showBGGCode);
}

function copyPlays()
{
	var playsString = document.getElementById("bgg_code").innerHTML;
	
	navigator.clipboard.writeText(playsString);
}

function showBGGCode(xmlResponse)
{
	var playsArray = xmlResponse;

	var gameObject = {};
	var orderedGamesArray = [];
	
	for (var i = playsArray.children.length-1; i>= 0; i--)
	{
		var obj = playsArray.children[i];
		var item = obj.children[0];
		var gameId = item.getAttribute("objectid")
		
		if (!gameObject[gameId])
		{
			orderedGamesArray.push(gameId);
			gameObject[gameId] = gameId;
		}
	}
	
	for (var i = 0; i<orderedGamesArray.length; i++)
	{
		getImageId(orderedGamesArray[i], addImageToString);
	}
	
	document.getElementById("bgg_code_container").style.display = "block";
}

function addImageToString(xmlResponse)
{
	var thumbailUrl = xmlResponse.children[0].children[0].textContent;
	var imageId = parseImageIdFromUrl(thumbailUrl);

	if (imageId.length > 0)
		bggCode += "[ImageID=" + imageId + "square inline]";

	document.getElementById("bgg_code").innerHTML=bggCode;
}

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



//Bastardized code from https://github.com/jbodah/bgg_tools/blob/master/dist/index.html
//Uses XMLHttpRequest to get around fetch CORS requirements
//Pulled out logging and pagnination for simplicity
function downloadPlays(username, mindate, maxdate, callback)
{
	makeRequest(`https://boardgamegeek.com/xmlapi2/plays?username=${username}&mindate=${mindate}&maxdate=${maxdate}`, callback);
}

function getImageId(gameId, callback)
{
	makeRequest(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame`, callback);
}


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

function sleep(ms) {
  return new Promise(resolveFunc => setTimeout(resolveFunc, ms));
}

function parseImageIdFromUrl(url)
{
	return url.match("\\d+\.\\w+$")[0].split('.')[0];
}
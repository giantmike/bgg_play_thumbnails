async function getPlays()
{
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
	var playsArray = await downloadPlays("giantmike",formatDate(fromDate),formatDate(toDate));

	showBGGCode(playsArray);
}

function copyPlays()
{
	var playsString = document.getElementById("bgg_code").innerHTML;
	
	navigator.clipboard.writeText(playsString);
}

async function showBGGCode(playsArray)
{
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
	
	var bggCode = "";
	
	for (var i = 0; i<orderedGamesArray.length; i++)
	{
		var imageId = await getImageId(orderedGamesArray[i]);
		if (imageId.length > 0)
			bggCode += "[ImageID=" + imageId + "square inline]"
	}
	
	document.getElementById("bgg_code").innerHTML=bggCode;
	
	document.getElementById("bgg_code_container").style.display = "block";
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
//Pulled out logging and pagniation for simplicity
async function downloadPlays(username, mindate, maxdate)
{
	const httpClient = new HttpClient();
	const data = await httpClient.get(`https://boardgamegeek.com/xmlapi2/plays?username=${username}&mindate=${mindate}&maxdate=${maxdate}`);
	var xmlDoc = new DOMParser().parseFromString(data, "text/xml");
	return xmlDoc.children[0];
	
	var resp = await makeRequest(`https://boardgamegeek.com/xmlapi2/plays?username=${username}&mindate=${mindate}&maxdate=${maxdate}`);
    var xmlDoc = new DOMParser().parseFromString(resp, "text/xml");
	return xmlDoc.children[0];
}

async function getImageId(gameId)
{
	const httpClient = new HttpClient();
	const data = await httpClient.get(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame`);
	var xmlDoc = new DOMParser().parseFromString(data, "text/xml");
	var thumbailUrl = xmlDoc.children[0].children[0].children[0].getInnerHTML();
	return parseImageIdFromUrl(thumbailUrl);

	var resp = await makeRequest(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame`);
    var xmlDoc = new DOMParser().parseFromString(resp, "text/xml");
	var thumbailUrl = xmlDoc.children[0].children[0].children[0].getInnerHTML();
	return parseImageIdFromUrl(thumbailUrl);
}


async function makeRequest(url) 
{
	var req = new XMLHttpRequest();
	
	req.open('GET', url, true);
	httpReq.setRequestHeader('Access-Control-Allow-Headers', '*');
	
	req.onreadystatechange = function()
	{
		if (req.readyState === XMLHttpRequest.DONE) 
		{
			//Request complete
			if (req.status >= 200 && req.status < 400)
			{
				//DATA! Yeah!
				return req.responseText;
			} 
			else 
			{
				//fail
				return null;
			}
		}
	}
	
	req.send();
}

function sleep(ms) {
	  var start = Date.now();
	  while(Date.now() - start < ms) 
	  {}
	  return;
}

function parseImageIdFromUrl(url)
{
	return url.match("\\d+\.\\w+$")[0].split('.')[0];
}


/*
Fetch stuff that doesn't work because of CORS
async function fetchXmlFromBggAsync (url)
{
	let response = await fetch(url, {
		method: "GET",
		mode: "cors",
		cache: "no-cache",
		credentials: "include",
		headers: {
			'Content-Type': 'text/xml',
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
	});
	let data = await response;
	return showBGGCode(data);
}

function buildUrl(fromDate, toDate)
{
	return "https://boardgamegeek.com/xmlapi2/plays?username=giantmike&mindate=2024-02-26&maxdate=2024-03-03";
}
*/

class HttpClient {
    constructor(){}
    async get(url) {
        return new Promise( (resolve, reject) => {
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = (evt) => {
                if (evt.currentTarget.readyState === 4 && evt.currentTarget.status === 200) {
                    try {
                        const response = evt.currentTarget.responseText;
                        resolve(response);
                    } catch (exception) {
                        reject(exception);
                    }
                }
            };
            xhttp.open('GET', url, true);
            xhttp.send();
        });
    }
    async post(url, data) {
        return new Promise( (resolve, reject) => {
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = (evt) => {
                if (evt.currentTarget.readyState === 4 && evt.currentTarget.status === 200) {
                    try {
                        const response = evt.currentTarget.responseText;
                        resolve(response);
                    } catch (exception) {
                        reject(exception);
                    }
                }
            };
            xhttp.open('POST', url, true);
            xhttp.send(data);
        });
    }
}
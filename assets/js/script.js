if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
var viewportmeta = document.querySelectorAll('meta[name="viewport"]')[0];
if (viewportmeta) {
viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
document.body.addEventListener('gesturestart', function() {
viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
}, false);
}
}

var festivalData = [];
var foundFestivals = [];

var trackListing = [];
var currentTrack = 0;

var playing = false;
var skipping = false;

var t = false;
var c = false;

var secondsRemaining = 0;

var userCountry = false;

var tracksSeen = [];

$(document).ready(function() {

	$.get('http://api.hostip.info/country.php?ip=' + userIP, function(content) {
		userCountry = content;
		if (userCountry == 'UK') userCountry = 'GB';
	});

	$.getJSON( 'data/festivals.json', function (data) {
		festivalData = data;
		
		$('input[name=festivalName]').keyup( function() {
			var currentString = $(this).val();
			
			foundFestivals = [];
			
			regex = new RegExp(currentString.replace(/(\w+)\s*/g, '\\b$1.*'), 'ig');
			
			if (currentString.length >= 3) {
				for (var x = 0; x < festivalData.length; x ++) {
					if ( typeof festivalData[x] == 'undefined' ) continue;
					
					if (festivalData[x]['name'].match(regex)) {
						foundFestivals.push(festivalData[x]);
					}
					
				}
			}
			
			showFestivals();
			
		});
		
		
	});
	
	$('#playNext').click( skip );
	
});


var showFestivals = function() {
	$('#festivalList li').remove();
	
	for(var y = 0 ; y < foundFestivals.length ; y ++) {
	
		$festivalItem =  $('<li>'+foundFestivals[y].name+' <span>Play</span></li>');
		$festivalItem.attr('data-id', foundFestivals[y].id);
		$festivalItem.click( selectFestival );
		$('#festivalList').append($festivalItem);
		
	}
}

var selectFestival = function() {
	var festivalId = $(this).attr('data-id');
	
	$(this).siblings().remove();
	
	$.getJSON( 'data/events/'+festivalId+'.json', loadArtists );
	
	
	$('header h1').html($(this).html() + ' Radio');
	$(this).remove();
	$('.searchBox').remove();
		
}

var loadArtists = function(data) {
	
	artists = data; 
	trackListing = [];
	
	/*for( var u = 0; u < data.length; u ++) {
		$.getJSON( 'data/tracks/'+data[u].id+'.json', setTracks(u + 1, data.length) );	
	}*/
	
	lineupTrack( true );
}

var lineupTrack = function( playNow ) {
	var randomnumber = Math.floor( Math.random() * artists.length );
	
	var selectedArtist = artists[randomnumber];
	
	console.log(selectedArtist);
	
	$.getJSON('http://ws.spotify.com/search/1/track.json?q=artist:"' + selectedArtist.name + '"', processTrack(playNow) );
	
}


var processTrack = function(playNow) {
 	return function(data) {
	
		console.log(data);
	
		if (data && data.tracks.length > 0) {	
			var nextTrack = false;
	
			for (var i = 0; i < data.tracks.length; i ++) {
				if ( $.inArray(data.tracks[i].href, tracksSeen) == -1 ) {
					if ( data.tracks[i].album.availability.territories.search(userCountry) != -1 ) {
						nextTrack = data.tracks[i];
						break;
					}
				}
			}
	
			trackListing.push(nextTrack);
			tracksSeen.push(nextTrack.href);
			
			console.log(trackListing);
		
			if ( playNow ) {
				playNext();
				lineupTrack( false );
			} else {
				setNext();
			}
		} else {
			lineupTrack( playNow );
		}
	}
}




var skip = function() {
	if (skipping == false) {
		skipping = true;
		playNext();
		lineupTrack( false );
	}
	return false;
}

var setTracks = function(currentPacket, packetCount) {
	return function(data) {
		trackListing = trackListing.concat(data);

		if (currentPacket == packetCount) {
			trackListing.sort(function() {return 0.5 - Math.random()});
			if (playing == false) playNext();
		}
	}
}


var playNext = function() {
	clearTimeout(t);
	clearInterval(c);
	playing = true;
	
	$('.hiddenAtStart').show();
	
	document.title = trackListing[currentTrack].artists[0].name + ': ' + trackListing[currentTrack].name;
	
	$('#nowPlaying').removeClass('hidden')
	$('#artist').text(trackListing[currentTrack].artists[0].name);
	$('#track').text(trackListing[currentTrack].name);
	$('#spotifyPlayer').attr('src', trackListing[currentTrack].href);
	
	var timeoutPeriod = trackListing[currentTrack].length + 3;
	
	timeRemaining = trackListing[currentTrack].length;
	
	$('#timeRemaining').html(formatTime(timeRemaining));
	
	c = setInterval('countdown()', 1000);
	
	currentTrack ++;
	
	t = setTimeout('playNext()', (timeoutPeriod + 3) * 1000);
	
	lineupTrack();
}

var setNext = function() {
	$('#upNext').show();
	$('#upNext span').html(trackListing[currentTrack].artists[0].name + ': ' + trackListing[currentTrack].name);
}

var countdown = function() {
	timeRemaining = timeRemaining - 1;
	if (timeRemaining > 0) {
		$('#timeRemaining').html(formatTime(timeRemaining));
		skipping = false;
	}
}

var stopPlaying = function() {
	playing = false;
	clearTimeout(t);
	$('#upNext').hide();
}

var formatTime = function(secs) {
	var min = Math.floor(secs/60);
	var sec = Math.floor(secs - (min * 60));
	//if (min < 10) {min = "0" + min;}
	if (sec < 10) {sec = "0" + sec;}
	return min + ':' + sec;
}
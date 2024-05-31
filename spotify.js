require('dotenv').config();
const https = require('https'); // Spotify requires https

const querystring = require('querystring'); 
const readline = require('readline'); // for user input

// API account credentials

const clientID = process.env.clientID;
const clientSecret = process.env.clientSecret;

// This function will get an access token needed to make an api call.
function getAccessToken(callback) {

    // object that stores our selected authorization options
    const authOptions = {
        hostname: 'accounts.spotify.com',
        path: '/api/token',
        method: 'POST',
        headers: {
            'Authorization':'Basic '+Buffer.from(clientID+':'+clientSecret).toString('base64'),
            'Content-Type':'application/x-www-form-urlencoded'
        }
    };

    const req = https.request(authOptions, (res) => {
        
        let data = '';

        // when a chunk of data comes through, set data equal to that chunk of data
        res.on('data', (chunk) => {
            data = data.concat(chunk);
        });
        // when all data is received, convert json object to javascript object
        
        res.on('end', () => {
            const json = JSON.parse(data);
            // call callback function with the provided access token as an argument
            callback(json.access_token);
        });
    })

    // write the request body and specify the grant_type
    req.write(querystring.stringify({ grant_type: 'client_credentials' }));
    req.end();
}

// This function searches for the song name
function searchSong(accessToken, songName, callback) {
     // Create a query string from the song's name, specifying that we are searching for a track and want only 1 result
    const query = querystring.stringify({ q:songName,type:'track',limit:1});
    const options = {
        hostname: 'api.spotify.com',
        path: `/v1/search?${query}`,
        method: 'GET',
        headers: {
            'Authorization':'Bearer '+accessToken
        }
    }

    // Create an HTTPS request with the options we defined in the object above
    const req = https.request(options, (res) => {
        let data ='';
        res.on('data', (chunk) => {
            data = data.concat(chunk);
        });
        res.on('end', () => {
            const json = JSON.parse(data);
            const track = json.tracks.items[0]; // Get the first track from the response
            if (track) { // If a track is found, call the callback function with the track details
                callback(track);
            } else {
                console.log('Song Not Found.');
            }
        })
    })

    req.end();
}

// This function retrieves and outputs the details of a song
function getSongDetails(accessToken,track) {
    const songDetails = {
        artist: track.artists.map(artist => artist.name),
        song: track.name,
        preview_url: track.preview_url,
        album: track.album.name
    };

    console.log('\nArtist Name: '+songDetails.artist.toString()+
            '\nSong Name: '+songDetails.song.toString()+
            '\nPreview URL: '+(songDetails.preview_url?songDetails.preview_url.toString():'No Preview URL Available.'));

}

// here we are creating an interface to receive user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// here we are asking the user for input and then calling our created functions.
rl.question('Enter Song Name: ', (songName) => {
    getAccessToken((accessToken) => {
        searchSong(accessToken, songName, (track) => {
            getSongDetails(accessToken, track);
            rl.close();
        })
    })
});
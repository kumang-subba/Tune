import { API_key, CLIENT_ID, CLIENT_SECRET } from "./config.js"

const dataDiv = document.getElementById("data")
const title = document.getElementById("title")
const subTitle = document.getElementById("sub-title")
const search = document.getElementById("search") 
const searchResultsContainer = document.getElementById("search-results")

const debounceSearchResults = function(){
    let timer;
    return (query)=>{
        if (timer){
            clearTimeout(timer)
        }
        return new Promise((resolve,reject)=>{
            timer = setTimeout(async ()=>{
                try {
                    const spotifyAccessToken = await getSpotifyAccessToken()
                    let data = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track,artist&limit=5&access_token=${spotifyAccessToken}`).then(res => res.json())
                    resolve(data)
                } catch (error) {
                    reject(error)
                }
            },300)
        })
    }
}()

// Set and Remove loader or error
const setLoaderError = (()=> {
    let loaderElement;
    let errorElement;
    return {
        setLoader: function(){
            if(errorElement){
                this.removeError()
            }
            if (!loaderElement){
                searchResultsContainer.innerHTML = ""
                searchResultsContainer.style.display = "block"
                search.style.borderRadius = "5px 5px 0 0"
                loaderElement = document.createElement("div")
                loaderElement.setAttribute("class","loader")
                searchResultsContainer.append(loaderElement)
            }
        },
        removeLoader: ()=>{
            if (loaderElement){
                searchResultsContainer.removeChild(loaderElement)
                searchResultsContainer.style.display = "hidden"
                loaderElement = null
            }
        },
        setError:function(){
            if (loaderElement){
                this.removeLoader()
            }
            searchResultsContainer.innerHTML = ""
            searchResultsContainer.style.display = "block"
            errorElement = document.createElement("div")
            errorElement.textContent = 'No matches found, try another query'
            searchResultsContainer.append(errorElement)
        },
        removeError:()=>{
            if (errorElement){
                searchResultsContainer.removeChild(errorElement)
                searchResultsContainer.style.display = "hidden"
                errorElement = null
            }
        }
    }
})()

// Event listener callback for search input
const handleSearch = async function(event){
    if (event.target.value == ""){
        resetSearchResultContainer()
        return
    }
    setLoaderError.setLoader()
    const fetchedSearchResults = await debounceSearchResults(event.target.value)
    console.log(fetchedSearchResults)
    if (!fetchedSearchResults){
        setLoaderError.setError()
    }

    if (fetchedSearchResults.artists){
        setLoaderError.removeLoader()
        setLoaderError.removeError()
        for (let artist of fetchedSearchResults.artists.items){
            const element = createArtistSearchResult(artist.images[0].url,artist.name) 
            searchResultsContainer.append(element)
        }
    }

    if (fetchedSearchResults.tracks){
        setLoaderError.removeLoader()
        setLoaderError.removeError()
        for (let track of fetchedSearchResults.tracks.items){
            const element = createTrackSearchResult(track.album.images[0].url,track.name,track.artists[0].name)
            searchResultsContainer.append(element)
        }

    }
}


function createTrackSearchResult(imgUrl,trackName,artistName){
    const holder = document.createElement("div")
    holder.setAttribute("class","result")
    const picture = document.createElement('picture')
    picture.setAttribute("class","result-picture")
    const image = document.createElement("img")
    image.setAttribute("src",imgUrl)
    image.setAttribute("alt",name)

    const textDiv = document.createElement("div")
    textDiv.setAttribute("class","result-text")
    const trackP = document.createElement("p")
    trackP.textContent = trackName
    const artistP = document.createElement("p")
    artistP.textContent = artistName
    textDiv.append(trackP,artistP)

    picture.append(image)
    holder.append(picture,textDiv)

    holder.addEventListener("click",()=>{
        const url = new URL(`./artist?name=${name.split(" ").join("_")}`,location.href)
        resetSearchResultContainer()
        navigate(url)
    })
    return holder 
}

function createArtistSearchResult(imgUrl,name){
    const holder = document.createElement("div")
    holder.setAttribute("class","result")
    const picture = document.createElement('picture')
    picture.setAttribute("class","result-picture")
    const image = document.createElement("img")
    image.setAttribute("src",imgUrl)
    image.setAttribute("alt",name)

    const textDiv = document.createElement('div')
    textDiv.setAttribute("class","result-text")
    const text = document.createElement("p")
    text.textContent = name

    textDiv.append(text)

    picture.append(image)
    holder.append(picture,textDiv)

    holder.addEventListener("click",()=>{
        const url = new URL(`./artist?name=${name.split(" ").join("_")}`,location.href)
        resetSearchResultContainer()
        navigate(url)
    })
    return holder 
}

function resetSearchResultContainer(){
    searchResultsContainer.innerHTML = ""
    searchResultsContainer.style.display = "hidden"
    search.value = ""
}

search.addEventListener("keyup",handleSearch)

/// Request functions 
async function getTopTracks(){
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${API_key}&format=json&limit=18`)
    const data = await response.json()
    return data
}

async function getTopArtists(){
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_key}&format=json&limit=18`)
    const data = await response.json()
    return data
}

async function getTrackDetails(artist,track){
    try {
        const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_key}&artist=${artist}&track=${track}&format=json`)
        const data = await response.json()
        return data
    } catch (error) {
        throw error    
    }
}

async function getArtistDetails(artist){
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artist}&api_key=${API_key}&format=json`)
    const data = await response.json()
    return data
}

async function getSpotifyAccessToken(){
    return await fetch("https://accounts.spotify.com/api/token",{
        method: "POST",
        headers: {
            "Content-Type":"application/x-www-form-urlencoded"
        },
        body:`grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    }).then(response => response.json()).then(data=>data.access_token)
}

// Format numbers to k or m short format
function formatNumber(num){
    return num > 1000000 ? `${(num/1000000).toFixed(0)}m` : num>1000?`${(num/1000).toFixed(0)}k` : num
}

// function to navigate between pages
const navigate = (url) => {
    history.pushState(null, null, url)
    router()
}

// Router function to navigate between pages
const router = async () => {
    // Reset the page 
    title.innerHTML = ""
    dataDiv.innerHTML = ""
    subTitle.innerHTML = ""

    const routes = [
        { path:"/", view : renderTopTracks },
        { path:"/track", view : renderTrackDetails},
        { path:"/artist", view: renderArtistDetails},
        { path:"/top-artists", view: renderTopArtists}
    ]
    const matchedRoute = routes.find(route => route.path === location.pathname)

    await matchedRoute.view()
}

window.addEventListener('DOMContentLoaded', () => {
    // Event listener for all links with data-link attribute to navigate between pages
    document.addEventListener("click", (e) => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault()
            navigate(e.target.href)
        }
    })

    // Rendering the page on initial load
    router()
})

// Event listener for back and forward buttons
window.addEventListener('popstate', router)

function pageNotFound(){
    title.textContent = "ERROR 404: PAGE NOT FOUND"

    let homeLink = document.createElement("a")
    homeLink.setAttribute("href","/")
    homeLink.setAttribute("data-link","")
    homeLink.textContent = "Go Home"

    subTitle.append(homeLink)
}

// Function to render artist details
async function renderArtistDetails(){
    const artistParam = new URLSearchParams(location.search).get("name").split("_").join(" ") 

    
    const spotifyAccessToken = await getSpotifyAccessToken()
    const [fetchedArtistDetails,responseSpotify] = await Promise.all([getArtistDetails(artistParam),fetch(`https://api.spotify.com/v1/search?type=artist&q=${artistParam}&decorate_restrictions=false&include_external=audio&limit=1&access_token=${spotifyAccessToken}`)])
    const dataSpotify = await responseSpotify.json()
    
    console.log(fetchedArtistDetails,dataSpotify)
    if (dataSpotify.artists.items[0].name !== artistParam){
        return pageNotFound()
    }
    title.textContent = artistParam

    const detailSection = document.createElement("section")
    detailSection.setAttribute("class","detailSection")

    dataDiv.append(detailSection)

    const picture = document.createElement("picture")
    picture.setAttribute("class","detailPicture")
    const image = document.createElement("img")
    image.setAttribute("src",dataSpotify.artists.items[0].images[0].url)
    picture.appendChild(image)

    const artistInfo = document.createElement("div")
    artistInfo .setAttribute("class","detailInfo")

    detailSection.append(picture,artistInfo)

    const artistTitle = document.createElement("h4")
    artistTitle.textContent = `Name: ${fetchedArtistDetails.artist.name}`

    const bio = document.createElement("p")
    bio.textContent = fetchedArtistDetails.artist.bio.summary.split("<a")[0]

    const followers= document.createElement("p")
    followers.textContent = `Followers: ${formatNumber(dataSpotify.artists.items[0].followers.total)}`

    const externalLinks = document.createElement("div")
    externalLinks.setAttribute("class","tags")

    const spotifyLink = document.createElement("a")
    const spotifyIcon = document.createElement("img")
    spotifyIcon.setAttribute("src","https://cdn3.emoji.gg/emojis/SpotifyLogo.png")
    spotifyIcon.setAttribute("alt","Spotify")
    spotifyIcon.setAttribute("class","icon")
    spotifyLink.setAttribute("href",dataSpotify.artists.items[0].external_urls.spotify)
    spotifyLink.setAttribute("target","_blank")
    spotifyLink.append(spotifyIcon)

    const lastfmLink = document.createElement("a")
    const lastfmIcon = document.createElement("img")
    lastfmIcon.setAttribute("src","https://upload.wikimedia.org/wikipedia/commons/d/d4/Lastfm_logo.svg")
    lastfmIcon.setAttribute("alt","LastFM")
    lastfmIcon.setAttribute("class","icon")
    lastfmLink.setAttribute("href",fetchedArtistDetails.artist.url)
    lastfmLink.setAttribute("target","_blank")
    lastfmLink.append(lastfmIcon)

    externalLinks.append(spotifyLink,lastfmLink)
    
    artistInfo.append(artistTitle,bio,followers,externalLinks)

    const dataTopTracksByArtist = await fetch(`https://api.spotify.com/v1/artists/${dataSpotify.artists.items[0].id}/top-tracks?access_token=${spotifyAccessToken}`).then(res=>res.json())

   const otherTracksToRender = dataTopTracksByArtist.tracks.slice(0,5)

    const tracksByAuthor = document.createElement("div")
    tracksByAuthor.setAttribute("class","others")

    const otherTracksTitle = document.createElement("h4")
    otherTracksTitle.textContent = "Top tracks by this artist"
    tracksByAuthor.appendChild(otherTracksTitle)

    const listOfTracks = document.createElement("div")
    listOfTracks.setAttribute("class","listOfOthers")

    artistInfo.append(artistTitle,bio,followers,externalLinks)

    otherTracksToRender.forEach(track => {
        const linkToTrack = document.createElement("a")
        linkToTrack.setAttribute("href",`./track?name=${track.name.split(" ").join("_")}&artist=${track.artists[0].name.split(" ").join("_")}`)
        const smallPicture = document.createElement("picture")
        smallPicture.setAttribute("class","smallPicture")
        const image = document.createElement("img")
        image.setAttribute("src",track.album.images[0].url)
        image.setAttribute("alt",track.name)
        smallPicture.appendChild(image)

        const trackName = document.createElement("p")
        trackName.textContent = track.name

        linkToTrack.append(smallPicture,trackName)
        listOfTracks.appendChild(linkToTrack)
    })

    tracksByAuthor.appendChild(listOfTracks)

    artistInfo.append(tracksByAuthor)

}

// Function to render track details
async function renderTrackDetails(){
    const trackName = new URLSearchParams(location.search).get("name").split("_").join(" ")
    const artistName = new URLSearchParams(location.search).get("artist").split("_").join(" ") 

    const spotifyAccessToken = await getSpotifyAccessToken()
    const [fetchTrackDetails,dataSpotify] = await Promise.all([getTrackDetails(artistName,trackName),fetch(`https://api.spotify.com/v1/search?type=track&q=${trackName}&artist=${artistName}&decorate_restrictions=false&best_match=true&include_external=audio&limit=1&access_token=${spotifyAccessToken}`).then(res=>res.json())])

    if (fetchTrackDetails.error){
        return pageNotFound()
    }

    title.textContent = trackName

    const bySpan = document.createElement("span")
    bySpan.textContent = "by"
    const artist = document.createElement("a")
    artist.textContent = artistName
    artist.setAttribute("href",`./artist?name=${artistName.split(" ").join("_")}`)
    artist.style.textDecoration = "underline"
    subTitle.append(bySpan,artist)


    const detailSection = document.createElement("section")
    detailSection.setAttribute("class","detailSection")

    dataDiv.appendChild(detailSection)

    const picture = document.createElement("picture")
    picture.setAttribute("class","detailPicture")
    const image = document.createElement("img")
    image.setAttribute("src",dataSpotify.best_match.items[0].album.images[0].url)
    picture.appendChild(image)

    const trackInfo = document.createElement("div")
    trackInfo.setAttribute("class","detailInfo")

    detailSection.append(picture,trackInfo)
    
    const trackTitle = document.createElement("h4")
    trackTitle.textContent = `Title: ${fetchTrackDetails.track.name}`
    const album = document.createElement("h4")
    album.textContent = `Album: ${fetchTrackDetails.track.album.title}`
    const artistInfo = document.createElement("h4")
    artistInfo.textContent = `Artist: ${fetchTrackDetails.track.artist.name}`
    const listeners = document.createElement("p")
    listeners.textContent = `Listeners: ${formatNumber(fetchTrackDetails.track.listeners)}`
    const playCount = document.createElement("p")
    playCount.textContent = `Play count: ${formatNumber(fetchTrackDetails.track.playcount)}`
    
    const popularity = document.createElement("p")
    popularity.textContent = `Popularity: ${dataSpotify.best_match.items[0].popularity}/100`
    
    const tags = document.createElement("div")
    tags.setAttribute("class","tags")
    fetchTrackDetails.track.toptags.tag.forEach(tag => {
        const tagSpan = document.createElement("span")
        tagSpan.textContent = tag.name
        tags.appendChild(tagSpan)
    })
    
    const externalLinks = document.createElement("div")
    externalLinks.setAttribute("class","tags")
    
    const spotifyLink = document.createElement("a")
    const spotifyIcon = document.createElement("img")
    spotifyIcon.setAttribute("src","https://cdn3.emoji.gg/emojis/SpotifyLogo.png")
    spotifyIcon.setAttribute("alt","Spotify")
    spotifyIcon.setAttribute("class","icon")
    spotifyLink.setAttribute("href",dataSpotify.best_match.items[0].external_urls.spotify)
    spotifyLink.setAttribute("target","_blank")
    spotifyLink.append(spotifyIcon)

    const lastfmLink = document.createElement("a")
    const lastfmIcon = document.createElement("img")
    lastfmIcon.setAttribute("src","https://upload.wikimedia.org/wikipedia/commons/d/d4/Lastfm_logo.svg")
    lastfmIcon.setAttribute("alt","LastFM")
    lastfmIcon.setAttribute("class","icon")
    lastfmLink.setAttribute("href",fetchTrackDetails.track.url)
    lastfmLink.setAttribute("target","_blank")
    lastfmLink.append(lastfmIcon)

    externalLinks.append(spotifyLink,lastfmLink)
    
    trackInfo.append(trackTitle,album,artistInfo,listeners,playCount,popularity,tags,externalLinks)

    const dataTopTracksByArtist = await fetch(`https://api.spotify.com/v1/artists/${dataSpotify.best_match.items[0].artists[0].id}/top-tracks?access_token=${spotifyAccessToken}`).then(res=>res.json())

    const otherTracksToRender = dataTopTracksByArtist.tracks.filter(track => track.name !== trackName).slice(0,5)

    const tracksByAuthor = document.createElement("div")
    tracksByAuthor.setAttribute("class","others")

    const otherTracksTitle = document.createElement("h4")
    otherTracksTitle.textContent = "Top tracks by this artist"
    tracksByAuthor.appendChild(otherTracksTitle)

    const listOfTracks = document.createElement("div")
    listOfTracks.setAttribute("class","listOfOthers")

    otherTracksToRender.forEach(track => {
        const linkToTrack = document.createElement("a")
        linkToTrack.setAttribute("href",`./track?name=${track.name.split(" ").join("_")}&artist=${track.artists[0].name.split(" ").join("_")}`)
        const smallPicture = document.createElement("picture")
        smallPicture.setAttribute("class","smallPicture")
        const image = document.createElement("img")
        image.setAttribute("src",track.album.images[0].url)
        image.setAttribute("alt",track.name)
        smallPicture.appendChild(image)

        const trackName = document.createElement("p")
        trackName.textContent = track.name

        linkToTrack.append(smallPicture,trackName)
        listOfTracks.appendChild(linkToTrack)
    })

    tracksByAuthor.appendChild(listOfTracks)


    trackInfo.append(tracksByAuthor)
}

// Function to create generator to get fetched request in iteration
const artistAndTrackGen = (arr) => async function*(){
    const spotifyAccessToken = await getSpotifyAccessToken()
    for (let i=0;i<arr.length;i++){
        const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${arr[i].trackName}&artist=${arr[i].artist}&decorate_restrictions=false&best_match=true&include_external=audio&limit=1&access_token=${spotifyAccessToken}`)
        const data = await response.json()
        // Yielding data and index(required to access topTracks array items)
        yield { data , index:i }
    }
}

// Function to render top tracks
async function renderTopTracks(){
    // Only take the tracks array
    const topTracks = await getTopTracks().then(data=>data.tracks.track)

    // Creating an array of track and artist name to fetch data from spotify
    const artistAndTrackNames = topTracks.map((track)=>{
        let artist = track.artist.name.split(" ").join("_")
        let trackName = track.name.split(" ").join("_")
        return {
            artist,
            trackName
        }
    })

    title.textContent = "Top Tracks"
    
    // Creating a generator
    const trackGen = artistAndTrackGen(artistAndTrackNames)

    const tracksDiv = document.createElement("div")
    tracksDiv.setAttribute("class","tracks")
    dataDiv.appendChild(tracksDiv)
    for await (const track of trackGen()){
        const element = createCard(track.data.best_match.items[0].album.images[0].url,topTracks[track.index].name,topTracks[track.index].artist.name,topTracks[track.index].listeners,topTracks[track.index].playcount)
        tracksDiv.appendChild(element)
    }

}

// Function to create generator to get fetched request in iteration
const artistsGen = (arr) => async function*(){
    const spotifyAccessToken = await getSpotifyAccessToken()
    for (let i=0;i<arr.length;i++){
        const response = await fetch(`https://api.spotify.com/v1/search?type=artist&q=${arr[i]}&decorate_restrictions=false&include_external=audio&limit=1&access_token=${spotifyAccessToken}`)
        const data = await response.json()

        // Yielding data and index(required to access topArtists  array items)
        yield { data , index:i }
    }
}
// Function to render top artists
async function renderTopArtists(){
    // Only take the tracks array
    const topArtists = await getTopArtists()

    title.textContent = "Top Artists"

    // Creating an array of artist names to fetch from spotify
    const artistNames = topArtists.artists.artist.map((artist)=>artist.name)

    // Creating a generator
    const artistsFetched = artistsGen(artistNames)

    const artistDiv = document.createElement("div")
    artistDiv.setAttribute("class","tracks")
    dataDiv.appendChild(artistDiv)

    for await (const artist of artistsFetched()){
        const element = createArtistCard(artist.data.artists.items[0].images[0].url,artistNames[artist.index],artist.data.artists.items[0].followers.total)
        artistDiv.append(element)
    }

}

// Card create function for artists
function createArtistCard(imgUrl,artistName,followerCount){
    // Main card div
    const div = document.createElement("div")

    // Picture div
    const picture = document.createElement("picture")
    picture.setAttribute("class","cardImage")
    const img = document.createElement("img")
    img.setAttribute("src",imgUrl)
    img.setAttribute("alt",artistName)
    picture.appendChild(img)

    // Followers count
    const followers= document.createElement("p")
    followers.textContent = `Followers: ${formatNumber(followerCount)}`

    // Artist name
    const artist = document.createElement("p")
    artist.textContent = artistName

    div.append(picture,artist,followers)

    // Click event for each card to navigate to the details page
    div.addEventListener("click",()=>{
        const url = new URL(`./artist?name=${artistName.split(" ").join("_")}`,location.href)
        navigate(url)
    })
    return div

}


// Card create function for tracks
function createCard(imgUrl,trackName,artistName,listeningCount,playCount){
    // Main card div
    const div = document.createElement("div")

    // Picture div
    const picture = document.createElement("picture")
    picture.setAttribute("class","cardImage")
    const img = document.createElement("img")
    img.setAttribute("src",imgUrl)
    img.setAttribute("alt",trackName)
    picture.appendChild(img)

    // Card info div for listening count and play count
    const cardInfo = document.createElement("p")
    cardInfo.setAttribute("class","cardInfo")
    const listeningSpan = document.createElement("span")
    listeningSpan.textContent = `🔊 ${formatNumber(listeningCount)} Listening`
    const playCountSpan = document.createElement("span")
    playCountSpan.textContent = `▶️ ${formatNumber(playCount)} Play count`
    cardInfo.append(listeningSpan,playCountSpan)

    // Track name and artist name
    const track = document.createElement("h3")
    track.textContent = trackName
    const artist = document.createElement("p")
    artist.textContent = artistName

    div.append(picture,cardInfo,track,artist)

    // Click event for each card to navigate to the details page
    div.addEventListener("click",()=>{
        const url = new URL(`./track?name=${trackName.split(" ").join("_")}&artist=${artistName.split(" ").join("_")}`,location.href)
        navigate(url)
    })
    return div

}
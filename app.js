const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc';
const STORAGE_KEY = 'yt-theme';
let player;
let videoPagePlayer = null;
let currentVideoId = null;
let currentQuery = '';
let nextPageToken = '';
let commentsPageToken = '';
let currentVideoData = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemDark ? 'dark' : 'light');
    setTheme(theme);
}

function setTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEY, theme);
}

// YouTube Player Initialization
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '200',
        width: '100%',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Player Event Handlers
function onPlayerReady(event) {
    console.log('Main player ready');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        document.getElementById('playerContainer').style.transform = 'translateY(100%)';
    }
}

// Video Loading Functions
async function loadPopularVideos() {
    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideos(data.items);
    } catch (error) {
        showError('Error loading videos');
    } finally {
        hideLoader();
    }
}

async function searchVideos(query) {
    if (!query) return loadPopularVideos();
    
    showLoader();
    currentQuery = query;
    nextPageToken = '';

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        nextPageToken = data.nextPageToken || '';
        renderVideos(data.items);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

// Video Display Functions
function renderVideos(videos) {
    const list = document.getElementById('videoList');
    list.innerHTML = videos.map(video => `
        <div class="video-item" data-id="${video.id.videoId || video.id}">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="details">
                <div class="title">${video.snippet.title}</div>
                <div class="channel">${video.snippet.channelTitle}</div>
                <div class="metadata">
                    ${new Date(video.snippet.publishedAt).toLocaleDateString('ru-RU')}
                </div>
            </div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Video Page Functions
function playVideo(videoId) {
    if (player) player.stopVideo();
    if (videoPagePlayer) videoPagePlayer.destroy();
    
    document.querySelector('.container').style.display = 'none';
    document.getElementById('videoPage').style.display = 'block';
    
    loadVideoDetails(videoId);
    loadComments(videoId);
    loadRecommendations(videoId);
}

async function loadVideoDetails(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        currentVideoData = data.items[0];
        renderVideoDetails();
    } catch (error) {
        showError('Failed to load video details');
    }
}

function renderVideoDetails() {
    const {snippet, statistics} = currentVideoData;
    
    document.querySelector('.video-title').textContent = snippet.title;
    document.querySelector('.views-count').textContent = `${Number(statistics.viewCount).toLocaleString()} views`;
    document.querySelector('.likes-count').textContent = `${Number(statistics.likeCount).toLocaleString()} likes`;
    document.querySelector('.channel-name').textContent = snippet.channelTitle;
    document.querySelector('.description').textContent = snippet.description;

    const playerContainer = document.getElementById('videoPlayer');
    playerContainer.innerHTML = '';
    
    videoPagePlayer = new YT.Player('videoPlayer', {
        videoId: currentVideoData.id,
        playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0
        }
    });
}

// Comment System
async function loadComments(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderComments(data.items);
    } catch (error) {
        showError('Comments disabled');
    }
}

function renderComments(comments) {
    const container = document.querySelector('.comments-list');
    container.innerHTML = comments.map(comment => `
        <div class="comment">
            <img src="${comment.snippet.topLevelComment.snippet.authorProfileImageUrl}">
            <div>
                <div class="comment-author">${comment.snippet.topLevelComment.snippet.authorDisplayName}</div>
                <div class="comment-text">${comment.snippet.topLevelComment.snippet.textDisplay}</div>
            </div>
        </div>
    `).join('');
}

// Recommendations System
async function loadRecommendations(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderRecommendations(data.items);
    } catch (error) {
        showError('Failed to load recommendations');
    }
}

function renderRecommendations(videos) {
    const container = document.querySelector('.recommendations-list');
    container.innerHTML = videos.map(video => `
        <div class="video-item" data-id="${video.id.videoId}">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="title">${video.snippet.title}</div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Event Handlers
document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
});

document.getElementById('backButton').addEventListener('click', () => {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('videoPage').style.display = 'none';
    if (videoPagePlayer) videoPagePlayer.destroy();
});

document.getElementById('loadMoreComments').addEventListener('click', () => {
    loadComments(currentVideoData.id);
});

// Utility Functions
function addVideoClickHandlers() {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => playVideo(item.dataset.id));
    });
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    setTimeout(() => {
        document.getElementById('errorMessage').textContent = '';
    }, 3000);
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadPopularVideos();
});

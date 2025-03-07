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

// YouTube Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '200',
        width: '100%',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        }
    });
}

// Поиск видео
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    document.getElementById('videoList').classList.add('search-animation');
    setTimeout(() => {
        document.getElementById('videoList').classList.remove('search-animation');
    }, 500);
    
    searchVideos(query);
}

// Video Loading
async function loadPopularVideos() {
    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideos(data.items);
    } catch (error) {
        showError('Ошибка загрузки');
    } finally {
        hideLoader();
    }
}

async function searchVideos(query) {
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

// Video Display
function renderVideos(videos) {
    const list = document.getElementById('videoList');
    list.innerHTML = videos.map(video => `
        <div class="video-item" data-id="${video.id.videoId || video.id}">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="details">
                <div class="title">${video.snippet.title}</div>
                <div class="channel">${video.snippet.channelTitle}</div>
                <div class="date">${formatDate(video.snippet.publishedAt)}</div>
            </div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Video Page
function playVideo(videoId) {
    if (player) player.stopVideo();
    if (videoPagePlayer) videoPagePlayer.destroy();
    
    document.querySelector('.container').style.display = 'none';
    document.getElementById('videoPage').style.display = 'block';
    window.scrollTo(0, 0);
    
    loadVideoDetails(videoId)
        .then(() => {
            loadComments(videoId);
            loadRecommendations(videoId);
        });
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
        showError('Ошибка загрузки видео');
    }
}

function renderVideoDetails() {
    const {snippet, statistics} = currentVideoData;
    const descContainer = document.querySelector('.description-container');
    
    document.querySelector('.video-title').textContent = snippet.title;
    document.querySelector('.views-count').textContent = `${Number(statistics.viewCount).toLocaleString()} просмотров`;
    document.querySelector('.channel-name').textContent = snippet.channelTitle;
    
    descContainer.innerHTML = `
        <div class="short-description">${truncateText(snippet.description, 150)}</div>
        <button class="show-more-btn">Ещё</button>
        <div class="full-description">${snippet.description}</div>
    `;

    document.querySelector('.show-more-btn').addEventListener('click', function() {
        this.previousElementSibling.style.display = 'none';
        this.nextElementSibling.style.display = 'block';
        this.remove();
    });

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

// Comments
async function loadComments(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderComments(data.items);
    } catch (error) {
        showError('Комментарии отключены');
    }
}

function renderComments(comments) {
    const container = document.querySelector('.comments-list');
    container.innerHTML = `
        <div class="comments-preview">
            ${comments.slice(0, 2).map(comment => `
                <div class="comment">
                    <img src="${comment.snippet.topLevelComment.snippet.authorProfileImageUrl}">
                    <div class="comment-text">${truncateText(comment.snippet.topLevelComment.snippet.textDisplay, 100)}</div>
                </div>
            `).join('')}
        </div>
        <button class="show-comments-btn">Показать все комментарии</button>
        <div class="all-comments" style="display:none">
            ${comments.map(comment => `
                <div class="comment">
                    <img src="${comment.snippet.topLevelComment.snippet.authorProfileImageUrl}">
                    <div>
                        <div class="comment-author">${comment.snippet.topLevelComment.snippet.authorDisplayName}</div>
                        <div class="comment-text">${comment.snippet.topLevelComment.snippet.textDisplay}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.querySelector('.show-comments-btn').addEventListener('click', function() {
        this.nextElementSibling.style.display = 'block';
        this.remove();
    });
}

// Recommendations
async function loadRecommendations(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderRecommendations(data.items);
    } catch (error) {
        // Ошибка рекомендаций не критична
    }
}

function renderRecommendations(videos) {
    const container = document.querySelector('.recommendations-list');
    container.innerHTML = videos.slice(0, 4).map(video => `
        <div class="video-item" data-id="${video.id.videoId}">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="title">${video.snippet.title}</div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Utils
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function addVideoClickHandlers() {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const videoId = this.dataset.id;
            if (videoId) playVideo(videoId);
        });
    });
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    setTimeout(() => errorElement.textContent = '', 3000);
}

// Init
document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
});

document.getElementById('backButton').addEventListener('click', () => {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('videoPage').style.display = 'none';
    if (videoPagePlayer) videoPagePlayer.destroy();
});

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadPopularVideos();
});
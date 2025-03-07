const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc';
const STORAGE_KEY = 'yt-theme';
let player;
let currentVideoId = null;
let currentQuery = '';
let nextPageToken = '';
let commentsPageToken = '';
let currentVideoData = null;

// Theme Manager
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemDark ? 'dark' : 'light');
    setTheme(theme);
}

function setTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
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
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('Плеер готов к работе');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        hidePlayer();
    }
}

// Video Functions
async function loadPopularVideos() {
    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&regionCode=RU&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideos(data.items);
    } catch (error) {
        showError('Ошибка загрузки рекомендаций');
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
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&type=video`
        );
        
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        
        const data = await response.json();
        nextPageToken = data.nextPageToken || '';
        renderVideos(data.items);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

function renderVideos(videos) {
    const list = document.getElementById('videoList');
    list.innerHTML = videos.map(video => {
        const videoId = video.id.videoId || video.id;
        return `
            <div class="video-item" data-id="${videoId}">
                <img 
                    src="${video.snippet.thumbnails.medium.url}" 
                    class="thumbnail" 
                    alt="${video.snippet.title}"
                >
                <div class="details">
                    <div class="title">${video.snippet.title}</div>
                    <div class="channel">${video.snippet.channelTitle}</div>
                    <div class="metadata">
                        ${formatDate(video.snippet.publishedAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    addVideoClickHandlers();
}

// Video Page
function playVideo(videoId) {
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
        showError('Не удалось загрузить информацию о видео');
    }
}

function renderVideoDetails() {
    const snippet = currentVideoData.snippet;
    const stats = currentVideoData.statistics;

    document.querySelector('.video-title').textContent = snippet.title;
    document.querySelector('.views-count').textContent = `${Number(stats.viewCount).toLocaleString()} просмотров`;
    document.querySelector('.likes-count').textContent = `${Number(stats.likeCount).toLocaleString()} лайков`;
    document.querySelector('.date').textContent = formatDate(snippet.publishedAt);
    document.querySelector('.channel-name').textContent = snippet.channelTitle;
    document.querySelector('.subscribers-count').textContent = 'Подписчиков: ' + (stats.subscriberCount || 'N/A');
    document.querySelector('.description').textContent = snippet.description;
    document.querySelector('.channel-thumb').src = snippet.thumbnails.default.url;

    new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
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
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${YT_API_KEY}&maxResults=20&pageToken=${commentsPageToken}`
        );
        const data = await response.json();
        commentsPageToken = data.nextPageToken || '';
        renderComments(data.items);
    } catch (error) {
        showError('Не удалось загрузить комментарии');
    }
}

function renderComments(comments) {
    const container = document.querySelector('.comments-list');
    container.innerHTML += comments.map(comment => {
        const snippet = comment.snippet.topLevelComment.snippet;
        return `
            <div class="comment">
                <img src="${snippet.authorProfileImageUrl}" class="channel-thumb" alt="Автор">
                <div>
                    <div class="comment-author">${snippet.authorDisplayName}</div>
                    <div class="comment-text">${snippet.textDisplay}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Recommendations
async function loadRecommendations(videoId) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&relatedToVideoId=${videoId}&key=${YT_API_KEY}&maxResults=5`
        );
        const data = await response.json();
        renderRecommendations(data.items);
    } catch (error) {
        showError('Не удалось загрузить рекомендации');
    }
}

function renderRecommendations(videos) {
    const container = document.querySelector('.recommendations-list');
    container.innerHTML = videos.map(video => `
        <div class="video-item" data-id="${video.id.videoId}">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="details">
                <div class="title">${video.snippet.title}</div>
            </div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Helpers
function formatDate(publishedAt) {
    const date = new Date(publishedAt);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function addVideoClickHandlers() {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.id;
            playVideo(videoId);
        });
    });
}

// UI Controls
function showPlayer() {
    document.getElementById('playerContainer').style.transform = 'translateY(0)';
}

function hidePlayer() {
    document.getElementById('playerContainer').style.transform = 'translateY(100%)';
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
}

// Event Listeners
document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    searchVideos(query);
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        searchVideos(query);
        e.target.blur();
    }
});

document.getElementById('themeToggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(isDark ? 'light' : 'dark');
});

document.getElementById('backButton').addEventListener('click', () => {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('videoPage').style.display = 'none';
    hidePlayer();
});

document.getElementById('loadMoreComments').addEventListener('click', () => {
    loadComments(currentVideoData.id);
});

let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query) searchVideos(query);
    }, 800);
});

// Пагинация при скролле
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        loadMoreVideos();
    }
});

// Инициализация приложения
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadPopularVideos();
});

// Функция пагинации
async function loadMoreVideos() {
    if (!nextPageToken || !currentQuery) return;

    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?pageToken=${nextPageToken}&part=snippet&maxResults=10&q=${encodeURIComponent(currentQuery)}&key=${YT_API_KEY}&type=video`
        );
        const data = await response.json();
        nextPageToken = data.nextPageToken || '';
        appendVideos(data.items);
    } catch (error) {
        showError('Ошибка загрузки');
    } finally {
        hideLoader();
    }
}

// Добавление новых видео
function appendVideos(videos) {
    const list = document.getElementById('videoList');
    list.innerHTML += videos.map(video => `
        <div class="video-item" data-id="${video.id.videoId}">
            <img 
                src="${video.snippet.thumbnails.medium.url}" 
                class="thumbnail" 
                alt="${video.snippet.title}"
            >
            <div class="details">
                <div class="title">${video.snippet.title}</div>
                <div class="channel">${video.snippet.channelTitle}</div>
                <div class="metadata">
                    ${formatDate(video.snippet.publishedAt)}
                </div>
            </div>
        </div>
    `).join('');
    addVideoClickHandlers();
}

// Валидация API-ответов
function validateResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Обработка ошибок YouTube API
function handleYouTubeError(error) {
    console.error('YouTube API Error:', error);
    showError(error.message.includes('quota') 
        ? 'Превышена квота API' 
        : 'Ошибка соединения с YouTube');
}

// Деструктуризация данных видео
function parseVideoData(items) {
    return items.map(item => ({
        id: item.id.videoId || item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt
    }));
}

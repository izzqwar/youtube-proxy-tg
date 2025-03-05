const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc';
let player;
let currentVideoId = null;
let currentQuery = '';
let nextPageToken = '';

// Инициализация плеера YouTube
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

// Обработчики плеера
function onPlayerReady(event) {
    console.log('Плеер готов к работе');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        hidePlayer();
    }
}

// Загрузка популярных видео
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

// Основная функция поиска
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

// Отрисовка видео
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

// Пагинация
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

// Форматирование даты
function formatDate(publishedAt) {
    const date = new Date(publishedAt);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Обработчики кликов
function addVideoClickHandlers() {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.id;
            playVideo(videoId);
        });
    });
}

// Воспроизведение видео
function playVideo(videoId) {
    if (currentVideoId === videoId) {
        player.playVideo();
        showPlayer();
        return;
    }
    
    currentVideoId = videoId;
    player.loadVideoById(videoId);
    showPlayer();
}

// Управление UI
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

// Обработчики событий
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

let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query) searchVideos(query);
    }, 800);
});

window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        loadMoreVideos();
    }
});

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
    loadPopularVideos();
});
const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc';
let player;
let currentVideoId = null;

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

async function searchVideos(query) {
    if (!query || query.trim().length < 2) {
        clearResults();
        return;
    }

    showLoader();
    hideError();
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&type=video`
        );
        
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        
        const data = await response.json();
        if (!data.items || data.items.length === 0) throw new Error('Видео не найдены');
        
        renderVideos(data.items);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

function renderVideos(videos) {
    const list = document.getElementById('videoList');
    list.innerHTML = videos.map(video => `
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

    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.id;
            playVideo(videoId);
        });
    });
}

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

function formatDate(publishedAt) {
    const date = new Date(publishedAt);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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

function hideError() {
    document.getElementById('errorMessage').textContent = '';
}

function clearResults() {
    document.getElementById('videoList').innerHTML = '';
}

// Обработчик поиска
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchVideos(e.target.value.trim()), 500);
});

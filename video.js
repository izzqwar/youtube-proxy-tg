const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc'; // Замените на ваш ключ

// Получаем ID видео из URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');

// Инициализация плеера
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        }
    });
}

// Загрузка данных видео
async function loadVideoDetails() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideoDetails(data.items[0]);
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
    }
}

// Отображение данных видео
function renderVideoDetails(video) {
    const { snippet, statistics } = video;

    document.querySelector('.video-title').textContent = snippet.title;
    document.querySelector('.views-count').textContent = `${Number(statistics.viewCount).toLocaleString()} просмотров`;
    document.querySelector('.channel-name').textContent = snippet.channelTitle;
    document.querySelector('.channel-thumb').src = snippet.thumbnails.default.url;

    const descContainer = document.querySelector('.description-container');
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
}

// Утилиты
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
    if (videoId) {
        loadVideoDetails();
    } else {
        console.error('ID видео не найден в URL');
    }
});
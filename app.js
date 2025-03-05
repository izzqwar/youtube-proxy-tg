// Конфигурация
const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc'; // Замените на ваш ключ
let player;
let currentVideoId = null;

// Инициализация YouTube API
function initYouTubeAPI() {
    // Скрипт подключается через отдельный тег в HTML
}

// Создание плеера
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
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
    console.log('Плеер готов');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        hidePlayer();
    }
}

// Поиск видео
async function searchVideos(query) {
    if (!query || query.length < 2) {
        clearResults();
        return;
    }

    showLoader();
    hideError();
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&type=video`
        );
        
        if (!response.ok) throw new Error('Ошибка сети');
        
        const data = await response.json();
        if (!data.items || data.items.length === 0) throw new Error('Видео не найдены');
        
        renderVideos(data.items);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

// Остальные функции (renderVideos, playVideo, formatDate и т.д.) 
// остаются без изменений из предыдущего ответа

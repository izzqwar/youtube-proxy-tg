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

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
    if (videoId) {
        onYouTubeIframeAPIReady();
    } else {
        console.error('ID видео не найден в URL');
    }
});
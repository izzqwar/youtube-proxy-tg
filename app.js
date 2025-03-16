const YT_API_KEY = 'AIzaSyCCOqb3-LZZSfzHESrMIBAZhmlY3MFVkmc'; // Замените на ваш ключ
const STORAGE_KEY = 'yt-theme';

// Инициализация темы
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEY, theme);
}

// Поиск видео
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideos(data.items, 'videoList'); // Показываем результаты поиска
        hideRecommendations(); // Скрываем рекомендации
    } catch (error) {
        showError('Ошибка поиска');
    } finally {
        hideLoader();
    }
}

// Отображение видео
function renderVideos(videos, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = videos.map(video => `
        <a href="video.html?id=${video.id.videoId}" class="video-item">
            <img src="${video.snippet.thumbnails.medium.url}" class="thumbnail">
            <div class="details">
                <div class="title">${video.snippet.title}</div>
                <div class="channel">${video.snippet.channelTitle}</div>
            </div>
        </a>
    `).join('');
}

// Загрузка рекомендаций
async function loadRecommendations() {
    showLoader();
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YT_API_KEY}`
        );
        const data = await response.json();
        renderVideos(data.items, 'recommendations');
    } catch (error) {
        showError('Ошибка загрузки рекомендаций');
    } finally {
        hideLoader();
    }
}

// Скрыть рекомендации
function hideRecommendations() {
    document.getElementById('recommendations').style.display = 'none';
}

// Показать рекомендации
function showRecommendations() {
    document.getElementById('recommendations').style.display = 'block';
}

// Утилиты
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

// Инициализация
document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
});

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadRecommendations(); // Загружаем рекомендации при старте
});
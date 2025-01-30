const weekDays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
let currentDate = new Date();

// Функция для обновления темы
function updateTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', isDarkMode);
}

// Слушатель изменений системной темы
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', updateTheme);

function getStartOfWeek(date) {
    const day = date.getDay();
    // Если воскресенье (0), то вычитаем 6 дней, иначе вычитаем day - 1
    const diff = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - diff);
    return startOfWeek;
}

function renderWeek() {
    // Обновляем тему перед рендерингом
    updateTheme();
    
    const startOfWeek = getStartOfWeek(currentDate);
    const weeklyTasks = document.getElementById('weekly-tasks');
    weeklyTasks.innerHTML = '';

    // Получаем текущую дату для сравнения
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);

        const taskKey = day.toISOString().split('T')[0];
        const tasks = JSON.parse(localStorage.getItem(taskKey)) || [];

        // Проверяем, является ли этот день текущим
        const isToday = taskKey === todayString;
        const dayStyle = isToday ? 'color: #0d6efd; font-weight: bold;' : '';

        const dayBlock = document.createElement('div');
        dayBlock.className = 'list-group-item';
        dayBlock.innerHTML = `
            <div>
                <strong style="${dayStyle}">${weekDays[i]}, ${day.toLocaleDateString('ru-RU')}</strong>
                <div class="input-group mt-2">
                    <input type="text" class="form-control" placeholder="Введите задачу" id="input-${taskKey}" onkeydown="checkEnter(event, '${taskKey}')">
                    <button class="btn btn-primary" onclick="addTask('${taskKey}')">✔</button>
                </div>
                <div class="task-list mt-2" ondragover="allowDrop(event)" ondrop="drop(event, '${taskKey}')">
                    <ul class="list-unstyled">
                        ${tasks.map(task => `
                            <li class="${task.important ? 'important-task' : ''}" draggable="true" ondragstart="drag(event, '${taskKey}', '${task.text}')">
                                <div style="flex-grow: 1;">
                                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${taskKey}', '${task.text}', this)">
                                    <span class="${task.completed ? 'strikethrough' : ''}" onclick="openEditModal('${taskKey}', '${encodeURIComponent(task.text)}', '${encodeURIComponent(task.description)}', ${task.important})" style="cursor: pointer;">
                                        ${task.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                                    </span>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        weeklyTasks.appendChild(dayBlock);
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event, taskKey, taskText) {
    event.dataTransfer.setData("text/plain", JSON.stringify({ taskKey, taskText }));
}

function drop(event, targetKey) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    const { taskKey, taskText } = JSON.parse(data);

    const sourceTasks = JSON.parse(localStorage.getItem(taskKey)) || [];
    const taskIndex = sourceTasks.findIndex(t => t.text === taskText);
    if (taskIndex !== -1) {
        const [task] = sourceTasks.splice(taskIndex, 1);
        localStorage.setItem(taskKey, JSON.stringify(sourceTasks));

        const targetTasks = JSON.parse(localStorage.getItem(targetKey)) || [];
        targetTasks.push(task);
        localStorage.setItem(targetKey, JSON.stringify(targetTasks));

        renderWeek();
    }
}

function checkEnter(event, date) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTask(date);
    }
}

function addTask(date) {
    const taskInput = document.getElementById(`input-${date}`);
    const taskText = taskInput.value.trim();

    if (taskText) {
        const tasks = JSON.parse(localStorage.getItem(date)) || [];
        tasks.push({ text: taskText, description: '', completed: false, important: false });
        localStorage.setItem(date, JSON.stringify(tasks));
        taskInput.value = '';
        renderWeek();
    }
}

function openEditModal(date, taskText, taskDescription, taskImportant) {
    document.getElementById('task-date').value = date;
    document.getElementById('task-old-text').value = decodeURIComponent(taskText);
    document.getElementById('task-input').value = decodeURIComponent(taskText);
    document.getElementById('task-description').value = decodeURIComponent(taskDescription);
    document.getElementById('task-important').checked = taskImportant;
    $('#taskModal').modal('show');
}

document.getElementById('save-task').onclick = function() {
    const date = document.getElementById('task-date').value;
    const oldText = document.getElementById('task-old-text').value;
    const newText = document.getElementById('task-input').value.trim();
    const newDescription = document.getElementById('task-description').value.trim();
    const isImportant = document.getElementById('task-important').checked;

    if (newText) {
        const tasks = JSON.parse(localStorage.getItem(date)) || [];
        const taskIndex = tasks.findIndex(t => t.text === oldText);
        if (taskIndex !== -1) {
            tasks[taskIndex].text = newText;
            tasks[taskIndex].description = newDescription;
            tasks[taskIndex].important = isImportant;
            localStorage.setItem(date, JSON.stringify(tasks));
            $('#taskModal').modal('hide');
            renderWeek();
        }
    }
};

document.getElementById('delete-task').onclick = function() {
    const date = document.getElementById('task-date').value;
    const taskText = document.getElementById('task-old-text').value;
    deleteTask(date, taskText);
    $('#taskModal').modal('hide');
};

document.getElementById('prev-week').onclick = function() {
    currentDate.setDate(currentDate.getDate() - 7);
    renderWeek();
};

document.getElementById('current-week').onclick = function() {
    currentDate = new Date();
    renderWeek();
};

document.getElementById('next-week').onclick = function() {
    currentDate.setDate(currentDate.getDate() + 7);
    renderWeek();
};

function toggleTask(date, taskText, checkbox) {
    const tasks = JSON.parse(localStorage.getItem(date)) || [];
    const task = tasks.find(t => t.text === taskText);
    if (task) {
        task.completed = checkbox.checked;
        localStorage.setItem(date, JSON.stringify(tasks));
        renderWeek();
    }
}

function deleteTask(date, taskText) {
    const tasks = JSON.parse(localStorage.getItem(date)) || [];
    const updatedTasks = tasks.filter(t => t.text !== taskText);
    localStorage.setItem(date, JSON.stringify(updatedTasks));
    renderWeek();
}

// HTML для модального окна
const modalHTML = `
<div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="taskModalLabel">Редактировать задачу</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="task-date">
                <input type="hidden" id="task-old-text">
                <div class="mb-3">
                    <label for="task-input" class="form-label">Текст задачи</label>
                    <input type="text" class="form-control" id="task-input">
                </div>
                <div class="mb-3">
                    <label for="task-description" class="form-label">Описание</label>
                    <textarea class="form-control" id="task-description" rows="3"></textarea>
                </div>
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="task-important">
                    <label class="form-check-label" for="task-important">Важная задача</label>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="delete-task">Удалить</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                <button type="button" class="btn btn-primary" id="save-task">Сохранить</button>
            </div>
        </div>
    </div>
</div>
`;

// Добавляем модальное окно в DOM
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Инициализация
renderWeek();

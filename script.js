const weekDays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
let currentDate = new Date();

function renderWeek() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Понедельник
    const weeklyTasks = document.getElementById('weekly-tasks');
    weeklyTasks.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);

        const taskKey = day.toISOString().split('T')[0];
        const tasks = JSON.parse(localStorage.getItem(taskKey)) || [];

        const dayBlock = document.createElement('div');
        dayBlock.className = 'list-group-item';
        dayBlock.innerHTML = `
            <div>
                <strong>${weekDays[i]}, ${day.toLocaleDateString('ru-RU')}</strong>
                <div class="input-group mt-2">
                    <input type="text" class="form-control" placeholder="Введите задачу" id="input-${taskKey}" onkeydown="checkEnter(event, '${taskKey}')">
                    <button class="btn btn-primary" onclick="addTask('${taskKey}')">Создать задачу</button>
                </div>
                <div class="task-list mt-2" ondragover="allowDrop(event)" ondrop="drop(event, '${taskKey}')">
                    <ul class="list-unstyled">
                        ${tasks.map(task => `
                            <li class="${task.important ? 'important-task' : ''}" draggable="true" ondragstart="drag(event, '${taskKey}', '${task.text}')">
                                <div style="flex-grow: 1;">
                                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${taskKey}', '${task.text}', this)">
                                    <span class="${task.completed ? 'strikethrough' : ''}" onclick="openEditModal('${taskKey}', '${task.text}', '${task.description.replace(/'/g, "\\'")}', ${task.important})" style="cursor: pointer;">
                                        ${task.text}
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

    // Удаляем задачу из исходного дня
    const sourceTasks = JSON.parse(localStorage.getItem(taskKey)) || [];
    const taskIndex = sourceTasks.findIndex(t => t.text === taskText);
    if (taskIndex !== -1) {
        const [task] = sourceTasks.splice(taskIndex, 1);
        localStorage.setItem(taskKey, JSON.stringify(sourceTasks));

        // Добавляем задачу в целевой день
        const targetTasks = JSON.parse(localStorage.getItem(targetKey)) || [];
        targetTasks.push(task);
        localStorage.setItem(targetKey, JSON.stringify(targetTasks));

        renderWeek();
    }
}

function checkEnter(event, date) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Предотвращаем стандартное поведение
        addTask(date);
    }
}

function addTask(date) {
    const taskInput = document.getElementById(`input-${date}`);
    const taskText = taskInput.value.trim();

    if (taskText) {
        const tasks = JSON.parse(localStorage.getItem(date)) || [];
        tasks.push({ text: taskText, description: '', completed: false, important: false }); // Описание и важность по умолчанию
        localStorage.setItem(date, JSON.stringify(tasks));
        taskInput.value = ''; // Очистка поля ввода
        renderWeek();
    }
}

function openEditModal(date, taskText, taskDescription, taskImportant) {
    document.getElementById('task-date').value = date;
    document.getElementById('task-old-text').value = taskText;
    document.getElementById('task-input').value = taskText;
    document.getElementById('task-description').value = taskDescription; // Установка описания
    document.getElementById('task-important').checked = taskImportant; // Установка важности
    $('#taskModal').modal('show');
}

document.getElementById('save-task').onclick = function() {
    const date = document.getElementById('task-date').value;
    const oldText = document.getElementById('task-old-text').value;
    const newText = document.getElementById('task-input').value.trim();
    const newDescription = document.getElementById('task-description').value.trim(); // Получаем новое описание
    const isImportant = document.getElementById('task-important').checked; // Получаем статус важности

    if (newText) {
        const tasks = JSON.parse(localStorage.getItem(date)) || [];
        const taskIndex = tasks.findIndex(t => t.text === oldText);
        if (taskIndex !== -1) {
            tasks[taskIndex].text = newText;
            tasks[taskIndex].description = newDescription; // Сохраняем новое описание
            tasks[taskIndex].important = isImportant; // Сохраняем статус важности
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

// Инициализация
renderWeek();

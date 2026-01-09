// Carregar dados do localStorage
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let looseTasks = JSON.parse(localStorage.getItem('looseTasks')) || [];
let draggedTask = null;
let draggedFrom = null;
let currentFolderId = null;
let currentTaskId = null;
let currentUser = null;

// Sistema de Autenticação
function checkAuth() {
    const loggedUser = localStorage.getItem('currentUser');
    if (loggedUser) {
        currentUser = loggedUser;
        loadUserData();
        showMainScreen();
        updateTodayCount();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('folderScreen').style.display = 'none';
    document.getElementById('taskViewScreen').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'block';
}

function showMainScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    document.getElementById('folderScreen').style.display = 'none';
    document.getElementById('taskViewScreen').style.display = 'none';
    document.getElementById('todayTasksScreen').style.display = 'none';
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (username === '' || password === '') {
        alert('Por favor, preencha usuário e senha!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username] && users[username] === password) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        loadUserData();
        showMainScreen();
        renderFolders();
        renderLooseTasks();
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        alert('Usuário ou senha inválidos!');
    }
}

function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value.trim();
    
    if (username === '' || password === '') {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (password.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username]) {
        alert('Este usuário já existe!');
        return;
    }
    
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Conta criada com sucesso! Faça login agora.');
    showLogin();
    
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerPasswordConfirm').value = '';
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        saveUserData();
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
    }
}

function loadUserData() {
    if (!currentUser) return;
    
    const userKey = `folders_${currentUser}`;
    const tasksKey = `tasks_${currentUser}`;
    
    folders = JSON.parse(localStorage.getItem(userKey)) || [];
    looseTasks = JSON.parse(localStorage.getItem(tasksKey)) || [];
}

function saveUserData() {
    if (!currentUser) return;
    
    const userKey = `folders_${currentUser}`;
    const tasksKey = `tasks_${currentUser}`;
    
    localStorage.setItem(userKey, JSON.stringify(folders));
    localStorage.setItem(tasksKey, JSON.stringify(looseTasks));
}

// Renderizar ao carregar a página
window.onload = function() {
    checkAuth();
};

// Navegação entre telas
function openFolder(folderId) {
    currentFolderId = folderId;
    const folder = folders.find(f => f.id === folderId);
    
    if (folder) {
        document.getElementById('mainScreen').style.display = 'none';
        document.getElementById('folderScreen').style.display = 'block';
        document.getElementById('folderScreenTitle').textContent = `📁 ${folder.name}`;
        renderFolderScreen();
    }
}

function goBackToMain() {
    currentFolderId = null;
    document.getElementById('mainScreen').style.display = 'block';
    document.getElementById('folderScreen').style.display = 'none';
    document.getElementById('taskViewScreen').style.display = 'none';
    document.getElementById('todayTasksScreen').style.display = 'none';
    renderFolders();
    renderLooseTasks();
    updateTodayCount();
}

function openTodayTasks() {
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('folderScreen').style.display = 'none';
    document.getElementById('taskViewScreen').style.display = 'none';
    document.getElementById('todayTasksScreen').style.display = 'block';
    renderTodayTasks();
}

function updateTodayCount() {
    const todayTasks = getAllTodayTasks();
    const countElement = document.getElementById('todayTaskCount');
    if (countElement) {
        const count = todayTasks.length;
        countElement.textContent = `${count} ${count === 1 ? 'tarefa' : 'tarefas'}`;
    }
}

function getAllTodayTasks() {
    const allTasks = [];
    
    // Tarefas soltas
    looseTasks.filter(t => t.isToday).forEach(task => {
        allTasks.push({ ...task, folderName: 'Tarefas Soltas', folderId: 'loose' });
    });
    
    // Tarefas de pastas
    folders.forEach(folder => {
        folder.tasks.filter(t => t.isToday).forEach(task => {
            allTasks.push({ ...task, folderName: folder.name, folderId: folder.id });
        });
    });
    
    return allTasks;
}

function getDifficultyClass(difficulty) {
    if (difficulty <= 3) return 'easy';
    if (difficulty <= 7) return 'medium';
    return 'hard';
}

function getDifficultyText(difficulty) {
    if (difficulty <= 3) return 'Fácil';
    if (difficulty <= 7) return 'Médio';
    return 'Difícil';
}

function renderTodayTasks() {
    const grid = document.getElementById('todayTasksGrid');
    const todayTasks = getAllTodayTasks();
    
    if (todayTasks.length === 0) {
        grid.innerHTML = '<div class="empty-state">Nenhuma tarefa marcada para hoje. Marque suas tarefas como "Tarefa do dia" ao criá-las! ⭐</div>';
        return;
    }
    
    grid.innerHTML = todayTasks.map(task => {
        const escapedFolderId = String(task.folderId).replace(/'/g, "\\'");
        return `
        <div class="today-simple-card ${task.completed ? 'completed-card' : ''}">
            <div class="today-card-folder">📁 ${task.folderName}</div>
            <h3 class="today-card-title">${task.title}</h3>
            <div class="today-card-buttons">
                <button class="open-task-btn" onclick="openTaskFromToday('${escapedFolderId}', ${task.id})">
                    Abrir
                </button>
                <button class="delete-btn" onclick="deleteTaskFromToday('${escapedFolderId}', ${task.id})">
                    Excluir
                </button>
            </div>
        </div>
    `;
    }).join('');
}

function toggleTaskFromToday(folderId, taskId) {
    if (folderId === 'loose') {
        const task = looseTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderTodayTasks();
        }
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                saveData();
                renderTodayTasks();
            }
        }
    }
}

function unmarkTaskFromToday(folderId, taskId) {
    if (folderId === 'loose') {
        const task = looseTasks.find(t => t.id === taskId);
        if (task) {
            task.isToday = false;
            saveData();
            updateTodayCount();
            renderTodayTasks();
        }
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === taskId);
            if (task) {
                task.isToday = false;
                saveData();
                updateTodayCount();
                renderTodayTasks();
            }
        }
    }
}

function deleteTaskFromToday(folderId, taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    if (folderId === 'loose') {
        looseTasks = looseTasks.filter(t => t.id !== taskId);
        saveData();
        updateTodayCount();
        renderTodayTasks();
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            folder.tasks = folder.tasks.filter(t => t.id !== taskId);
            saveData();
            updateTodayCount();
            renderTodayTasks();
        }
    }
}

function saveTaskObservation(folderId, taskId) {
    const textarea = document.getElementById(`obs-${folderId}-${taskId}`);
    const observations = textarea.value;
    
    if (folderId === 'loose') {
        const task = looseTasks.find(t => t.id === taskId);
        if (task) {
            task.observations = observations;
            saveData();
        }
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === taskId);
            if (task) {
                task.observations = observations;
                saveData();
            }
        }
    }
}

function openTaskFromToday(folderId, taskId) {
    let task;
    let folderName;
    
    if (folderId === 'loose') {
        task = looseTasks.find(t => t.id === taskId);
        folderName = 'Tarefas Soltas';
    } else {
        // Converter folderId para número se necessário
        const folderIdToFind = typeof folderId === 'string' ? parseInt(folderId) : folderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        task = folder?.tasks.find(t => t.id === taskId);
        folderName = folder?.name || 'Pasta';
    }
    
    if (!task) return;
    
    // Guardar informações da tarefa atual
    currentTaskId = taskId;
    currentFolderId = folderId;
    
    // Preencher modal
    document.getElementById('todayModalTitle').textContent = task.title;
    document.getElementById('todayModalFolder').textContent = `📁 ${folderName}`;
    document.getElementById('todayModalDescription').textContent = task.description || 'Sem descrição';
        
        // Badges
        const badgesHtml = `
            <span class="difficulty-badge ${getDifficultyClass(task.difficulty)}">
                🎯 ${task.difficulty}/10 - ${getDifficultyText(task.difficulty)}
            </span>
        `;
        document.getElementById('todayModalBadges').innerHTML = badgesHtml;
        
        // Campos editáveis
        document.getElementById('todayModalIsToday').checked = task.isToday || false;
        document.getElementById('todayModalDifficulty').value = task.difficulty || 5;
        document.getElementById('todayModalObservations').value = task.observations || '';
        
        // Botão de completar
        const completeBtn = document.getElementById('todayModalCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
        
        // Abrir modal
        modal.style.display = 'block';
        setTimeout(() => {
            if (modal.style.display !== 'block') {
    completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    
    // Abrir modal
    document.getElementById('todayTaskModal').style.display = 'block';urrentFolderId = null;
}

function toggleTodayTask() {
    if (!currentTaskId || !currentFolderId) return;
    toggleTaskFromToday(currentFolderId, currentTaskId);
    
    // Atualizar botão
    const task = currentFolderId === 'loose' 
        ? looseTasks.find(t => t.id === currentTaskId)
        : folders.find(f => f.id === currentFolderId)?.tasks.find(t => t.id === currentTaskId);
    
    if (task) {
        const completeBtn = document.getElementById('todayModalCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    }
}

function deleteTodayTask() {
    if (!currentTaskId || !currentFolderId) return;
    deleteTaskFromToday(currentFolderId, currentTaskId);
    closeTodayTaskModal();
}

function updateTodayTaskIsToday() {
    if (!currentTaskId || !currentFolderId) return;
    
    const isToday = document.getElementById('todayModalIsToday').checked;
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            task.isToday = isToday;
            saveData();
            updateTodayCount();
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === currentTaskId);
            if (task) {
                task.isToday = isToday;
                saveData();
                updateTodayCount();
            }
        }
    }
}

function updateTodayTaskDifficulty() {
    if (!currentTaskId || !currentFolderId) return;
    
    const difficulty = parseInt(document.getElementById('todayModalDifficulty').value);
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            task.difficulty = difficulty;
            saveData();
            
            // Atualizar badge
            const badgesHtml = `
                <span class="difficulty-badge ${getDifficultyClass(difficulty)}">
                    🎯 ${difficulty}/10 - ${getDifficultyText(difficulty)}
                </span>
            `;
            document.getElementById('todayModalBadges').innerHTML = badgesHtml;
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === currentTaskId);
            if (task) {
                task.difficulty = difficulty;
                saveData();
                
                // Atualizar badge
                const badgesHtml = `
                    <span class="difficulty-badge ${getDifficultyClass(difficulty)}">
                        🎯 ${difficulty}/10 - ${getDifficultyText(difficulty)}
                    </span>
                `;
                document.getElementById('todayModalBadges').innerHTML = badgesHtml;
            }
        }
    }
}

function saveTodayObservations() {
    if (!currentTaskId || !currentFolderId) return;
    
    const observations = document.getElementById('todayModalObservations').value;
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            task.observations = observations;
            saveData();
            alert('Observações salvas!');
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === currentTaskId);
            if (task) {
                task.observations = observations;
                saveData();
                alert('Observações salvas!');
            }
        }
    }
}

function goBackToFolder() {
    currentTaskId = null;
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('folderScreen').style.display = 'block';
    document.getElementById('taskViewScreen').style.display = 'none';
    renderFolderScreen();
}

function openTask(taskId) {
    if (!currentFolderId) return;
    
    currentTaskId = taskId;
    const folder = folders.find(f => f.id === currentFolderId);
    const task = folder?.tasks.find(t => t.id === taskId);
    
    if (task) {
        document.getElementById('mainScreen').style.display = 'none';
        document.getElementById('folderScreen').style.display = 'none';
        document.getElementById('taskViewScreen').style.display = 'block';
        
        document.getElementById('taskViewTitleText').textContent = task.title;
        document.getElementById('taskViewDescriptionText').textContent = task.description || 'Sem descrição';
        
        // Dificuldade
        const difficultyEl = document.getElementById('taskViewDifficulty');
        if (task.difficulty) {
            difficultyEl.textContent = `🎯 Dificuldade: ${task.difficulty}/10 - ${getDifficultyText(task.difficulty)}`;
            difficultyEl.className = `difficulty-badge ${getDifficultyClass(task.difficulty)}`;
            difficultyEl.style.display = 'inline-block';
        } else {
            difficultyEl.style.display = 'none';
        }
        
        // Tarefa do dia
        const todayBadge = document.getElementById('taskViewTodayBadge');
        todayBadge.style.display = task.isToday ? 'inline-flex' : 'none';
        
        // Checkbox e select editáveis
        document.getElementById('taskViewIsToday').checked = task.isToday || false;
        document.getElementById('taskViewDifficultySelect').value = task.difficulty || 5;
        
        // Observações
        document.getElementById('taskViewObservations').value = task.observations || '';
        
        const completeBtn = document.getElementById('taskViewCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    }
}

function toggleCurrentTask() {
    if (!currentTaskId) return;
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            task.completed = !task.completed;
            saveData();
            openTaskFromToday('loose', currentTaskId); // Atualiza a visualização
            updateTodayCount();
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        const task = folder?.tasks.find(t => t.id === currentTaskId);
        
        if (task) {
            task.completed = !task.completed;
            saveData();
            openTask(currentTaskId); // Atualiza a visualização
            updateTodayCount();
        }
    }
}

function deleteCurrentTask() {
    if (!currentTaskId) return;
    
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        if (currentFolderId === 'loose') {
            looseTasks = looseTasks.filter(t => t.id !== currentTaskId);
            saveData();
            updateTodayCount();
            goBackToMain();
        } else {
            const folder = folders.find(f => f.id === currentFolderId);
            if (folder) {
                folder.tasks = folder.tasks.filter(t => t.id !== currentTaskId);
                saveData();
                updateTodayCount();
                goBackToFolder();
            }
        }
    }
}

function saveObservations() {
    if (!currentTaskId) return;
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            const observations = document.getElementById('taskViewObservations').value;
            task.observations = observations;
            saveData();
            alert('✓ Observações salvas com sucesso!');
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        const task = folder?.tasks.find(t => t.id === currentTaskId);
        
        if (task) {
            const observations = document.getElementById('taskViewObservations').value;
            task.observations = observations;
            saveData();
            alert('✓ Observações salvas com sucesso!');
        }
    }
}

function updateTaskIsToday() {
    if (!currentFolderId || !currentTaskId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    const task = folder?.tasks.find(t => t.id === currentTaskId);
    
    if (task) {
        const isToday = document.getElementById('taskViewIsToday').checked;
        task.isToday = isToday;
        saveData();
        updateTodayCount();
        
        // Atualiza badge visual
        const todayBadge = document.getElementById('taskViewTodayBadge');
        todayBadge.style.display = isToday ? 'inline-flex' : 'none';
    }
}

function updateTaskDifficulty() {
    if (!currentTaskId) return;
    
    if (currentFolderId === 'loose') {
        const task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            const difficulty = parseInt(document.getElementById('taskViewDifficultySelect').value);
            task.difficulty = difficulty;
            saveData();
            
            // Atualiza badge visual
            const difficultyEl = document.getElementById('taskViewDifficulty');
            difficultyEl.textContent = `🎯 Dificuldade: ${difficulty}/10 - ${getDifficultyText(difficulty)}`;
            difficultyEl.className = `difficulty-badge ${getDifficultyClass(difficulty)}`;
            difficultyEl.style.display = 'inline-block';
        }
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        const task = folder?.tasks.find(t => t.id === currentTaskId);
        
        if (task) {
            const difficulty = parseInt(document.getElementById('taskViewDifficultySelect').value);
            task.difficulty = difficulty;
            saveData();
            
            // Atualiza badge visual
            const difficultyEl = document.getElementById('taskViewDifficulty');
            difficultyEl.textContent = `🎯 Dificuldade: ${difficulty}/10 - ${getDifficultyText(difficulty)}`;
            difficultyEl.className = `difficulty-badge ${getDifficultyClass(difficulty)}`;
            difficultyEl.style.display = 'inline-block';
        }
    }
}

function updateTaskIsToday() {
    if (!currentFolderId || !currentTaskId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    const task = folder?.tasks.find(t => t.id === currentTaskId);
    
    if (task) {
        const isToday = document.getElementById('taskViewIsToday').checked;
        task.isToday = isToday;
        saveData();
        updateTodayCount();
        
        // Atualiza badge visual
        const todayBadge = document.getElementById('taskViewTodayBadge');
        todayBadge.style.display = isToday ? 'inline-flex' : 'none';
    }
}

function updateTaskDifficulty() {
    if (!currentFolderId || !currentTaskId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    const task = folder?.tasks.find(t => t.id === currentTaskId);
    
    if (task) {
        const difficulty = parseInt(document.getElementById('taskViewDifficultySelect').value);
        task.difficulty = difficulty;
        saveData();
        
        // Atualiza badge visual
        const difficultyEl = document.getElementById('taskViewDifficulty');
        difficultyEl.textContent = `🎯 Dificuldade: ${difficulty}/10 - ${getDifficultyText(difficulty)}`;
        difficultyEl.className = `difficulty-badge ${getDifficultyClass(difficulty)}`;
        difficultyEl.style.display = 'inline-block';
    }
}

function addTaskToCurrentFolder() {
    if (!currentFolderId) return;
    
    const titleInput = document.getElementById('folderScreenTaskTitle');
    const descInput = document.getElementById('folderScreenTaskDescription');
    const isTodayInput = document.getElementById('folderScreenTaskIsToday');
    const difficultyInput = document.getElementById('folderScreenTaskDifficulty');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const isToday = isTodayInput.checked;
    const difficulty = parseInt(difficultyInput.value);
    
    if (title === '') {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (folder) {
        const task = {
            id: Date.now(),
            title: title,
            description: description,
            completed: false,
            isToday: isToday,
            difficulty: difficulty
        };
        
        folder.tasks.push(task);
        saveData();
        renderFolderScreen();
        updateTodayCount();
        
        titleInput.value = '';
        descInput.value = '';
        isTodayInput.checked = false;
        difficultyInput.value = '5';
        titleInput.focus();
    }
}

function renderFolderScreen() {
    if (!currentFolderId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    
    const list = document.getElementById('folderScreenTasksList');
    
    if (folder.tasks.length === 0) {
        list.innerHTML = '<div class="empty-state">Nenhuma tarefa nesta pasta. Adicione uma acima! ✨</div>';
        return;
    }
    
    list.innerHTML = folder.tasks.map(task => `
        <li class="task-card ${task.completed ? 'completed-card' : ''}" onclick="openTask(${task.id})">
            <div class="task-card-content">
                <div class="task-card-title">
                    ${task.title}
                    ${task.isToday ? '<span class="today-badge">⭐ Hoje</span>' : ''}
                    ${task.difficulty ? `<span class="difficulty-mini-badge ${getDifficultyClass(task.difficulty)}">🎯 ${task.difficulty}/10</span>` : ''}
                </div>
                ${task.description ? `<div class="task-card-description">${task.description}</div>` : ''}
            </div>
            <div class="task-card-status ${task.completed ? 'completed' : ''}">
                ${task.completed ? '✓ Concluída' : '📝 Pendente'}
            </div>
        </li>
    `).join('');
}

function toggleTaskInScreen(taskId) {
    if (!currentFolderId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (folder) {
        const task = folder.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderFolderScreen();
        }
    }
}

function deleteTaskInScreen(taskId) {
    if (!currentFolderId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    if (folder) {
        folder.tasks = folder.tasks.filter(t => t.id !== taskId);
        saveData();
        renderFolderScreen();
    }
}

function addLooseTask() {
    const titleInput = document.getElementById('taskTitle');
    const descInput = document.getElementById('taskDescription');
    const isTodayInput = document.getElementById('taskIsToday');
    const difficultyInput = document.getElementById('taskDifficulty');
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const isToday = isTodayInput.checked;
    const difficulty = parseInt(difficultyInput.value);
    
    if (title === '') {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }
    
    const task = {
        id: Date.now(),
        title: title,
        description: description,
        completed: false,
        isToday: isToday,
        difficulty: difficulty
    };
    
    looseTasks.push(task);
    saveData();
    renderLooseTasks();
    updateTodayCount();
    
    titleInput.value = '';
    descInput.value = '';
    isTodayInput.checked = false;
    difficultyInput.value = '5';
    titleInput.focus();
}

function addFolder() {
    const input = document.getElementById('folderInput');
    const folderName = input.value.trim();
    
    if (folderName === '') {
        alert('Por favor, digite um nome para a pasta!');
        return;
    }
    
    const folder = {
        id: Date.now(),
        name: folderName,
        tasks: []
    };
    
    folders.push(folder);
    saveData();
    renderFolders();
    
    input.value = '';
    input.focus();
}

function addTask(folderId) {
    const input = document.getElementById(`task-input-${folderId}`);
    const taskText = input.value.trim();
    
    if (taskText === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }
    
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        
        folder.tasks.push(task);
        saveData();
        renderFolders();
        
        input.value = '';
        input.focus();
    }
}

function toggleTask(folderId, taskId) {
    if (folderId === 'loose') {
        const task = looseTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderLooseTasks();
        }
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            const task = folder.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                saveData();
                renderFolders();
            }
        }
    }
}

function deleteTask(folderId, taskId) {
    if (folderId === 'loose') {
        looseTasks = looseTasks.filter(t => t.id !== taskId);
        saveData();
        renderLooseTasks();
    } else {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            folder.tasks = folder.tasks.filter(t => t.id !== taskId);
            saveData();
            renderFolders();
        }
    }
}

function deleteFolder(folderId) {
    if (confirm('Tem certeza que deseja excluir esta pasta e todas as suas tarefas?')) {
        folders = folders.filter(f => f.id !== folderId);
        saveData();
        renderFolders();
    }
}

function saveData() {
    if (!currentUser) return;
    
    const userKey = `folders_${currentUser}`;
    const tasksKey = `tasks_${currentUser}`;
    
    localStorage.setItem(userKey, JSON.stringify(folders));
    localStorage.setItem(tasksKey, JSON.stringify(looseTasks));
}

// Drag and Drop functions
function handleDragStart(e, taskId, fromLocation) {
    draggedTask = taskId;
    draggedFrom = fromLocation;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, toLocation) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedTask || draggedFrom === toLocation) return;
    
    let task;
    
    // Remove from source
    if (draggedFrom === 'loose') {
        task = looseTasks.find(t => t.id === draggedTask);
        looseTasks = looseTasks.filter(t => t.id !== draggedTask);
    } else {
        const fromFolder = folders.find(f => f.id === draggedFrom);
        if (fromFolder) {
            task = fromFolder.tasks.find(t => t.id === draggedTask);
            fromFolder.tasks = fromFolder.tasks.filter(t => t.id !== draggedTask);
        }
    }
    
    if (!task) return;
    
    // Add to destination
    if (toLocation === 'loose') {
        looseTasks.push(task);
    } else {
        const toFolder = folders.find(f => f.id === toLocation);
        if (toFolder) {
            toFolder.tasks.push(task);
        }
    }
    
    saveData();
    renderFolders();
    renderLooseTasks();
    
    draggedTask = null;
    draggedFrom = null;
}

function renderLooseTasks() {
    const list = document.getElementById('looseTasksList');
    
    if (looseTasks.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding: 20px;">Arraste tarefas aqui ou crie novas acima</div>';
        return;
    }
    
    list.innerHTML = looseTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}"
            draggable="true"
            ondragstart="handleDragStart(event, ${task.id}, 'loose')"
            ondragend="handleDragEnd(event)">
            <span class="task-text">
                <div class="task-title">
                    ${task.title}
                    ${task.isToday ? '<span class="today-badge">⭐ Hoje</span>' : ''}
                    ${task.difficulty ? `<span class="difficulty-mini-badge ${getDifficultyClass(task.difficulty)}">🎯 ${task.difficulty}/10</span>` : ''}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </span>
            <button class="complete-btn ${task.completed ? 'completed' : ''}" onclick="toggleTask('loose', ${task.id})">
                ${task.completed ? '✓ Concluída' : 'Concluir'}
            </button>
            <button class="delete-btn" onclick="deleteTask('loose', ${task.id})">Excluir</button>
        </li>
    `).join('');
}

function renderFolders() {
    const container = document.getElementById('foldersContainer');
    
    if (folders.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma pasta ainda. Crie uma acima! 📁</div>';
        return;
    }
    
    container.innerHTML = '<h2 style="margin-bottom: 20px; color: #333;">📂 Minhas Pastas</h2>' + folders.map(folder => {
        const totalTasks = folder.tasks.length;
        const completedTasks = folder.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        return `
        <div class="folder-card">
            <div class="folder-card-header">
                <div>
                    <div class="folder-card-title">📁 ${folder.name}</div>
                    <div class="folder-card-count">
                        <span class="count-badge">📝 ${totalTasks} ${totalTasks === 1 ? 'tarefa' : 'tarefas'}</span>
                        ${completedTasks > 0 ? `<span class="count-badge completed-badge">✓ ${completedTasks} concluída${completedTasks === 1 ? '' : 's'}</span>` : ''}
                    </div>
                </div>
                <div class="folder-card-actions">
                    <button class="open-folder-btn" onclick="openFolder(${folder.id})">Abrir</button>
                    <button class="delete-card-btn" onclick="deleteFolder(${folder.id})">Excluir</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

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
    renderFolders();
    renderLooseTasks();
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
        
        const completeBtn = document.getElementById('taskViewCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    }
}

function toggleCurrentTask() {
    if (!currentFolderId || !currentTaskId) return;
    
    const folder = folders.find(f => f.id === currentFolderId);
    const task = folder?.tasks.find(t => t.id === currentTaskId);
    
    if (task) {
        task.completed = !task.completed;
        saveData();
        openTask(currentTaskId); // Atualiza a visualização
    }
}

function deleteCurrentTask() {
    if (!currentFolderId || !currentTaskId) return;
    
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        const folder = folders.find(f => f.id === currentFolderId);
        if (folder) {
            folder.tasks = folder.tasks.filter(t => t.id !== currentTaskId);
            saveData();
            goBackToFolder();
        }
    }
}

function addTaskToCurrentFolder() {
    if (!currentFolderId) return;
    
    const titleInput = document.getElementById('folderScreenTaskTitle');
    const descInput = document.getElementById('folderScreenTaskDescription');
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    
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
            completed: false
        };
        
        folder.tasks.push(task);
        saveData();
        renderFolderScreen();
        
        titleInput.value = '';
        descInput.value = '';
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
                <div class="task-card-title">${task.title}</div>
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
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    
    if (title === '') {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }
    
    const task = {
        id: Date.now(),
        title: title,
        description: description,
        completed: false
    };
    
    looseTasks.push(task);
    saveData();
    renderLooseTasks();
    
    titleInput.value = '';
    descInput.value = '';
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
                <div class="task-title">${task.title}</div>
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

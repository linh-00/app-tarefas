// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA4VvSYgdAV5QMA2eXCrITvNnA5Itazld8",
    authDomain: "tasks-1a7eb.firebaseapp.com",
    projectId: "tasks-1a7eb",
    storageBucket: "tasks-1a7eb.firebasestorage.app",
    messagingSenderId: "88399420840",
    appId: "1:88399420840:web:85ba64fdeed75233cb119d"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    console.log('Firebase inicializado com sucesso!');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    var db = null;
}

// Carregar dados do localStorage
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let looseTasks = JSON.parse(localStorage.getItem('looseTasks')) || [];
let draggedTask = null;
let draggedFrom = null;
let currentFolderId = null;
let currentTaskId = null;
let currentUser = null;

// Função para exibir comentários de uma tarefa
function displayTaskComments(task, elementId) {
    const commentsContainer = document.getElementById(elementId);
    if (!commentsContainer) return;
    
    if (!task.comments || task.comments.length === 0) {
        commentsContainer.innerHTML = '<p style="color: #888; font-style: italic;">Nenhum comentário ainda</p>';
        return;
    }
    
    // Exibir comentários do mais recente para o mais antigo
    const commentsHtml = task.comments
        .slice()
        .reverse()
        .map((comment, index) => `
            <div class="comment-item" style="background: #f8f9fa; padding: 10px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid #007bff;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">
                    📅 ${comment.date}
                </div>
                <div style="color: #333;">
                    ${comment.text.replace(/\n/g, '<br>')}
                </div>
            </div>
        `)
        .join('');
    
    commentsContainer.innerHTML = commentsHtml;
}

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
        
        // Carregar dados primeiro
        loadUserData();
        
        // Aguardar um pouco para renderizar
        setTimeout(() => {
            showMainScreen();
            renderFolders();
            renderLooseTasks();
            updateTodayCount();
        }, 500);
        
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
    
    if (db) {
        // Carregar do Firebase
        db.collection('users').doc(currentUser).get()
            .then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    folders = data.folders || [];
                    looseTasks = data.looseTasks || [];
                    console.log('✅ Dados carregados do Firebase');
                } else {
                    // Fallback para localStorage
                    folders = JSON.parse(localStorage.getItem(userKey)) || [];
                    looseTasks = JSON.parse(localStorage.getItem(tasksKey)) || [];
                    console.log('📦 Dados carregados do localStorage');
                }
            })
            .catch(error => {
                console.error('❌ Erro ao carregar do Firebase:', error);
                // Fallback para localStorage
                folders = JSON.parse(localStorage.getItem(userKey)) || [];
                looseTasks = JSON.parse(localStorage.getItem(tasksKey)) || [];
                console.log('📦 Usando localStorage como fallback');
            });
    } else {
        // Usar apenas localStorage
        folders = JSON.parse(localStorage.getItem(userKey)) || [];
        looseTasks = JSON.parse(localStorage.getItem(tasksKey)) || [];
        console.log('📦 Firebase não disponível - usando localStorage');
    }
}

function saveUserData() {
    if (!currentUser) return;
    
    const userKey = `folders_${currentUser}`;
    const tasksKey = `tasks_${currentUser}`;
    
    // Sempre salvar no localStorage como backup
    localStorage.setItem(userKey, JSON.stringify(folders));
    localStorage.setItem(tasksKey, JSON.stringify(looseTasks));
    
    // Salvar no Firebase
    if (db) {
        db.collection('users').doc(currentUser).set({
            folders: folders,
            looseTasks: looseTasks,
            lastUpdate: new Date().toISOString()
        })
        .then(() => {
            console.log('Dados salvos no Firebase');
        })
        .catch(error => {
            console.error('Erro ao salvar no Firebase:', error);
        });
    }
}

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
    document.getElementById('kanbanScreen').style.display = 'none';
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
    document.getElementById('todayModalStatus').value = task.status || 'pending';
    document.getElementById('todayModalObservations').value = '';
    
    // Exibir comentários existentes
    displayTaskComments(task, 'todayModalCommentsList');
    
    // Botão de completar
    const completeBtn = document.getElementById('todayModalCompleteBtn');
    completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
    completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    
    // Abrir modal
    document.getElementById('todayTaskModal').style.display = 'block';
}

function closeTodayTaskModal() {
    document.getElementById('todayTaskModal').style.display = 'none';
    currentTaskId = null;
    currentFolderId = null;
}

function toggleTodayTask() {
    if (!currentTaskId || !currentFolderId) return;
    
    let task;
    if (currentFolderId === 'loose') {
        task = looseTasks.find(t => t.id === currentTaskId);
        if (task) {
            task.completed = !task.completed;
            saveData();
        }
    } else {
        // Converter folderId para número se necessário
        const folderIdToFind = typeof currentFolderId === 'string' ? parseInt(currentFolderId) : currentFolderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        if (folder) {
            task = folder.tasks.find(t => t.id === currentTaskId);
            if (task) {
                task.completed = !task.completed;
                saveData();
            }
        }
    }
    
    // Atualizar botão e interface
    if (task) {
        const completeBtn = document.getElementById('todayModalCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
        renderTodayTasks();
        updateTodayCount();
    }
}

function deleteTodayTask() {
    if (!currentTaskId || !currentFolderId) return;
    
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    if (currentFolderId === 'loose') {
        looseTasks = looseTasks.filter(t => t.id !== currentTaskId);
    } else {
        // Converter folderId para número se necessário
        const folderIdToFind = typeof currentFolderId === 'string' ? parseInt(currentFolderId) : currentFolderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        if (folder) {
            folder.tasks = folder.tasks.filter(t => t.id !== currentTaskId);
        }
    }
    
    saveData();
    updateTodayCount();
    renderTodayTasks();
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

function updateTodayTaskStatus() {
    if (!currentTaskId || !currentFolderId) return;
    
    const status = document.getElementById('todayModalStatus').value;
    
    let task;
    if (currentFolderId === 'loose') {
        task = looseTasks.find(t => t.id === currentTaskId);
    } else {
        const folderIdToFind = typeof currentFolderId === 'string' ? parseInt(currentFolderId) : currentFolderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        task = folder?.tasks.find(t => t.id === currentTaskId);
    }
    
    if (task) {
        task.status = status;
        
        // Se status for 'completed', marcar como concluída
        if (status === 'completed') {
            task.completed = true;
        } else {
            task.completed = false;
        }
        
        saveData();
        renderTodayTasks();
        
        // Atualizar botão de completar
        const completeBtn = document.getElementById('todayModalCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
    }
}

function saveTodayObservations() {
    if (!currentTaskId || !currentFolderId) return;
    
    const observationText = document.getElementById('todayModalObservations').value.trim();
    if (!observationText) {
        alert('❌ Digite uma observação antes de salvar!');
        return;
    }
    
    let task;
    if (currentFolderId === 'loose') {
        task = looseTasks.find(t => t.id === currentTaskId);
    } else {
        // Converter folderId para número se necessário
        const folderIdToFind = typeof currentFolderId === 'string' ? parseInt(currentFolderId) : currentFolderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        task = folder?.tasks.find(t => t.id === currentTaskId);
    }
    
    if (task) {
        // Inicializar array de comentários se não existir
        if (!task.comments) {
            task.comments = [];
        }
        
        // Adicionar novo comentário com timestamp
        const comment = {
            text: observationText,
            date: new Date().toLocaleString('pt-BR')
        };
        task.comments.push(comment);
        
        saveData();
        
        // Limpar campo e atualizar exibição
        document.getElementById('todayModalObservations').value = '';
        displayTaskComments(task, 'todayModalCommentsList');
        alert('✓ Observação salva como comentário!');
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
        document.getElementById('taskViewStatus').value = task.status || 'pending';
        
        // Limpar campo de observações e exibir comentários existentes
        document.getElementById('taskViewObservations').value = '';
        displayTaskComments(task, 'taskViewCommentsList');
        
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
    
    const observationText = document.getElementById('taskViewObservations').value.trim();
    if (!observationText) {
        alert('❌ Digite uma observação antes de salvar!');
        return;
    }
    
    let task;
    if (currentFolderId === 'loose') {
        task = looseTasks.find(t => t.id === currentTaskId);
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        task = folder?.tasks.find(t => t.id === currentTaskId);
    }
    
    if (task) {
        // Inicializar array de comentários se não existir
        if (!task.comments) {
            task.comments = [];
        }
        
        // Adicionar novo comentário com timestamp
        const comment = {
            text: observationText,
            date: new Date().toLocaleString('pt-BR')
        };
        task.comments.push(comment);
        
        saveData();
        
        // Limpar campo e atualizar exibição
        document.getElementById('taskViewObservations').value = '';
        displayTaskComments(task, 'taskViewCommentsList');
        alert('✓ Observação salva como comentário!');
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

function updateTaskViewStatus() {
    if (!currentTaskId || !currentFolderId) return;
    
    const status = document.getElementById('taskViewStatus').value;
    
    let task;
    if (currentFolderId === 'loose') {
        task = looseTasks.find(t => t.id === currentTaskId);
    } else {
        const folder = folders.find(f => f.id === currentFolderId);
        task = folder?.tasks.find(t => t.id === currentTaskId);
    }
    
    if (task) {
        task.status = status;
        
        // Se status for 'completed', marcar como concluída
        if (status === 'completed') {
            task.completed = true;
        } else {
            task.completed = false;
        }
        
        saveData();
        
        // Atualizar botão de completar
        const completeBtn = document.getElementById('taskViewCompleteBtn');
        completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
        completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
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
    saveUserData();
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

// ========== KANBAN BOARD ==========

function openKanbanBoard() {
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('kanbanScreen').style.display = 'block';
    renderKanbanBoard();
}

function renderKanbanBoard() {
    const allTasks = getAllTasksForKanban();
    
    // Limpar colunas
    document.getElementById('pendingColumn').innerHTML = '';
    document.getElementById('awaitingColumn').innerHTML = '';
    document.getElementById('approvedColumn').innerHTML = '';
    document.getElementById('completedColumn').innerHTML = '';
    
    // Contadores
    let pendingCount = 0;
    let awaitingCount = 0;
    let approvedCount = 0;
    let completedCount = 0;
    
    allTasks.forEach(taskInfo => {
        const { task, folderId, folderName } = taskInfo;
        const status = task.status || 'pending';
        
        const cardHtml = createKanbanCard(task, folderId, folderName);
        
        switch (status) {
            case 'pending':
                document.getElementById('pendingColumn').innerHTML += cardHtml;
                pendingCount++;
                break;
            case 'awaiting_approval':
                document.getElementById('awaitingColumn').innerHTML += cardHtml;
                awaitingCount++;
                break;
            case 'approved':
                document.getElementById('approvedColumn').innerHTML += cardHtml;
                approvedCount++;
                break;
            case 'completed':
                document.getElementById('completedColumn').innerHTML += cardHtml;
                completedCount++;
                break;
        }
    });
    
    // Atualizar contadores
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('awaitingCount').textContent = awaitingCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('completedCount').textContent = completedCount;
    
    // Atualizar contador do card do menu principal
    const totalInFlow = awaitingCount + approvedCount;
    document.getElementById('kanbanTaskCount').textContent = `${totalInFlow} tarefa${totalInFlow !== 1 ? 's' : ''} em fluxo`;
}

function getAllTasksForKanban() {
    const allTasks = [];
    
    // Tarefas soltas
    looseTasks.forEach(task => {
        allTasks.push({
            task: task,
            folderId: 'loose',
            folderName: 'Tarefas Soltas'
        });
    });
    
    // Tarefas das pastas
    folders.forEach(folder => {
        folder.tasks.forEach(task => {
            allTasks.push({
                task: task,
                folderId: folder.id,
                folderName: folder.name
            });
        });
    });
    
    return allTasks;
}

function createKanbanCard(task, folderId, folderName) {
    const status = task.status || 'pending';
    const difficultyClass = getDifficultyClass(task.difficulty);
    
    return `
        <div class="kanban-card" 
             draggable="true" 
             data-task-id="${task.id}" 
             data-folder-id="${folderId}"
             data-status="${status}"
             ondragstart="handleKanbanDragStart(event)"
             ondragend="handleKanbanDragEnd(event)">
            <div class="kanban-card-folder">📁 ${folderName}</div>
            <div class="kanban-card-title">${task.title}</div>
            ${task.difficulty ? `<span class="kanban-card-difficulty difficulty-badge ${difficultyClass}">🎯 ${task.difficulty}/10</span>` : ''}
            <div class="kanban-card-actions">
                <button class="kanban-card-btn view" onclick="openTaskFromKanban('${folderId}', ${task.id})">Abrir</button>
            </div>
        </div>
    `;
}

let draggedKanbanTask = null;
let draggedKanbanFolderId = null;

function handleKanbanDragStart(event) {
    const card = event.target.closest('.kanban-card');
    draggedKanbanTask = parseInt(card.dataset.taskId);
    draggedKanbanFolderId = card.dataset.folderId;
    
    card.classList.add('dragging');
}

function handleKanbanDragEnd(event) {
    const card = event.target.closest('.kanban-card');
    card.classList.remove('dragging');
}

function handleKanbanDragOver(event) {
    event.preventDefault();
    const column = event.currentTarget;
    column.classList.add('drag-over');
}

function handleKanbanDragLeave(event) {
    const column = event.currentTarget;
    column.classList.remove('drag-over');
}

function handleKanbanDrop(event, newStatus) {
    event.preventDefault();
    const column = event.currentTarget;
    column.classList.remove('drag-over');
    
    if (draggedKanbanTask === null || draggedKanbanFolderId === null) return;
    
    updateTaskStatus(draggedKanbanFolderId, draggedKanbanTask, newStatus);
    
    draggedKanbanTask = null;
    draggedKanbanFolderId = null;
}

function updateTaskStatus(folderId, taskId, newStatus) {
    let task = null;
    
    if (folderId === 'loose') {
        task = looseTasks.find(t => t.id === taskId);
    } else {
        const folderIdToFind = typeof folderId === 'string' ? parseInt(folderId) : folderId;
        const folder = folders.find(f => f.id === folderIdToFind);
        task = folder?.tasks.find(t => t.id === taskId);
    }
    
    if (task) {
        task.status = newStatus;
        
        // Se for concluída, marcar como completed também
        if (newStatus === 'completed') {
            task.completed = true;
        } else {
            task.completed = false;
        }
        
        saveData();
        renderKanbanBoard();
        updateTodayCount();
    }
}

function openTaskFromKanban(folderId, taskId) {
    if (folderId === 'loose') {
        currentFolderId = 'loose';
        currentTaskId = taskId;
        const task = looseTasks.find(t => t.id === taskId);
        
        if (task) {
            document.getElementById('kanbanScreen').style.display = 'none';
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
            
            const todayBadge = document.getElementById('taskViewTodayBadge');
            todayBadge.style.display = task.isToday ? 'inline-flex' : 'none';
            
            document.getElementById('taskViewIsToday').checked = task.isToday || false;
            document.getElementById('taskViewDifficultySelect').value = task.difficulty || 5;
            
            document.getElementById('taskViewObservations').value = '';
            displayTaskComments(task, 'taskViewCommentsList');
            
            const completeBtn = document.getElementById('taskViewCompleteBtn');
            completeBtn.textContent = task.completed ? '✓ Concluída' : 'Concluir';
            completeBtn.className = task.completed ? 'complete-btn completed' : 'complete-btn';
        }
    } else {
        const folderIdToFind = typeof folderId === 'string' ? parseInt(folderId) : folderId;
        currentFolderId = folderIdToFind;
        currentTaskId = taskId;
        
        openTask(taskId);
        document.getElementById('kanbanScreen').style.display = 'none';
    }
}

// Iniciar aplicação
checkAuth();

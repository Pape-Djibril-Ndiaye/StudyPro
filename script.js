// ========== CONFIGURATION FIREBASE ==========
// ⚠️ IMPORTANT : Remplacez ces valeurs par les vôtres depuis Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDBjSZseMLcHxtG2kGhe-X8xn3p_-GcT78",
  authDomain: "bac-excellence.firebaseapp.com",
  databaseURL: "https://bac-excellence-default-rtdb.firebaseio.com",
  projectId: "bac-excellence",
  storageBucket: "bac-excellence.firebasestorage.app",
  messagingSenderId: "1069444133619",
  appId: "1:1069444133619:web:47bcfdc6750500f411fd86"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Variables globales
let currentUser = null;
let subjects = [];
let tasks = [];
let goals = [];

// Couleurs disponibles pour les matières
const colors = ['blue', 'purple', 'green', 'red', 'yellow', 'pink', 'indigo', 'teal'];

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initAuthListeners();
    initAppListeners();
    
    // Vérifier si un utilisateur est déjà connecté
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showMainApp();
            loadUserData();
        } else {
            showAuthPage();
        }
    });
});

// ========== AUTHENTIFICATION ==========
function initAuthListeners() {
    // Changement d'onglet (Connexion / Inscription)
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const authType = this.getAttribute('data-auth');
            switchAuthTab(authType);
        });
    });
    
    // Connexion
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    // Inscription
    document.getElementById('signupBtn').addEventListener('click', signup);
    document.getElementById('signupPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') signup();
    });
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function switchAuthTab(authType) {
    // Mise à jour des onglets
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-auth="${authType}"]`).classList.add('active');
    
    // Mise à jour des formulaires
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (authType === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('signupForm').classList.add('active');
    }
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    if (!email || !password) {
        errorElement.textContent = 'Veuillez remplir tous les champs';
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            errorElement.textContent = '';
        })
        .catch(error => {
            console.error('Erreur de connexion:', error);
            if (error.code === 'auth/user-not-found') {
                errorElement.textContent = 'Aucun compte avec cet email';
            } else if (error.code === 'auth/wrong-password') {
                errorElement.textContent = 'Mot de passe incorrect';
            } else {
                errorElement.textContent = 'Erreur de connexion. Réessayez.';
            }
        });
}

function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorElement = document.getElementById('signupError');
    
    if (!name || !email || !password) {
        errorElement.textContent = 'Veuillez remplir tous les champs';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Sauvegarder le nom de l'utilisateur
            return database.ref('users/' + userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        })
        .then(() => {
            errorElement.textContent = '';
        })
        .catch(error => {
            console.error('Erreur d\'inscription:', error);
            if (error.code === 'auth/email-already-in-use') {
                errorElement.textContent = 'Cet email est déjà utilisé';
            } else if (error.code === 'auth/invalid-email') {
                errorElement.textContent = 'Email invalide';
            } else {
                errorElement.textContent = 'Erreur d\'inscription. Réessayez.';
            }
        });
}

function logout() {
    auth.signOut().then(() => {
        subjects = [];
        tasks = [];
        goals = [];
        showAuthPage();
    });
}

function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Afficher le nom de l'utilisateur
    database.ref('users/' + currentUser.uid + '/name').once('value', snapshot => {
        const name = snapshot.val() || 'Élève';
        document.getElementById('userName').textContent = name;
    });
}

// ========== CHARGEMENT DES DONNÉES ==========
function loadUserData() {
    const userId = currentUser.uid;
    
    // Charger les matières
    database.ref('userData/' + userId + '/subjects').on('value', snapshot => {
        subjects = [];
        snapshot.forEach(childSnapshot => {
            subjects.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        updateUI();
    });
    
    // Charger les tâches
    database.ref('userData/' + userId + '/tasks').on('value', snapshot => {
        tasks = [];
        snapshot.forEach(childSnapshot => {
            tasks.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        updateUI();
    });
    
    // Charger les objectifs
    database.ref('userData/' + userId + '/goals').on('value', snapshot => {
        goals = [];
        snapshot.forEach(childSnapshot => {
            goals.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        updateUI();
    });
}

// ========== GESTION DE L'APPLICATION ==========
function initAppListeners() {
    // Navigation par onglets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Matières
    document.getElementById('btnAddSubject').addEventListener('click', toggleAddSubjectForm);
    document.getElementById('confirmAddSubject').addEventListener('click', addSubject);
    document.getElementById('cancelAddSubject').addEventListener('click', toggleAddSubjectForm);
    
    // Tâches
    document.getElementById('btnAddTask').addEventListener('click', toggleAddTaskForm);
    document.getElementById('confirmAddTask').addEventListener('click', addTask);
    document.getElementById('cancelAddTask').addEventListener('click', toggleAddTaskForm);
    
    // Objectifs
    document.getElementById('btnAddGoal').addEventListener('click', toggleAddGoalForm);
    document.getElementById('confirmAddGoal').addEventListener('click', addGoal);
    document.getElementById('cancelAddGoal').addEventListener('click', toggleAddGoalForm);
}

function switchTab(tabName) {
    // Mise à jour des boutons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Mise à jour du contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    updateUI();
}

// ========== CALCULS ==========
function calculateAverage() {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, s) => sum + (s.level * s.coefficient), 0);
    const totalCoef = subjects.reduce((sum, s) => sum + s.coefficient, 0);
    return (total / totalCoef).toFixed(1);
}

function getMotivationMessage() {
    const avg = parseFloat(calculateAverage());
    if (avg >= 75) return "🔥 Excellence ! Continue comme ça, Polytechnique t'attend !";
    if (avg >= 60) return "💪 Bon travail ! Encore un effort pour viser l'excellence !";
    if (avg >= 50) return "⚡ Tu progresses ! Intensifie tes révisions !";
    return "🎯 C'est le moment de tout donner ! Tu peux y arriver !";
}

// ========== MISE À JOUR DE L'INTERFACE ==========
function updateUI() {
    if (!currentUser) return;
    
    updateAverage();
    updateDashboard();
    updateSubjectsList();
    updateTasksList();
    updateGoalsList();
    updateTaskSubjectSelect();
}

function updateAverage() {
    const avg = calculateAverage();
    document.getElementById('averageValue').textContent = `${avg}/100`;
    document.getElementById('averageProgress').style.width = `${avg}%`;
    document.getElementById('motivationMessage').textContent = getMotivationMessage();
}

function updateDashboard() {
    // Matières
    const dashboardSubjects = document.getElementById('dashboardSubjects');
    const topSubjects = subjects.slice(0, 5);
    dashboardSubjects.innerHTML = topSubjects.length > 0 ? topSubjects.map(subject => `
        <div class="subject-progress" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: white; font-weight: 500;">${subject.name}</span>
                <span style="color: rgba(255, 255, 255, 0.8);">Coef ${subject.coefficient}</span>
            </div>
            <div class="subject-progress-bar">
                <div class="subject-progress-fill color-${subject.color}" style="width: ${subject.level}%"></div>
            </div>
            <span style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">${subject.level}%</span>
        </div>
    `).join('') : '<p class="empty-message">Aucune matière</p>';
    
    // Tâches récentes
    const dashboardTasks = document.getElementById('dashboardTasks');
    const recentTasks = tasks.filter(t => !t.completed).slice(0, 5);
    dashboardTasks.innerHTML = recentTasks.length > 0 ? recentTasks.map(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        return `
            <div class="task-item" style="margin-bottom: 12px;">
                <div class="task-checkbox" onclick="toggleTask('${task.id}')"></div>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${subject ? subject.name : 'Général'}</div>
                </div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
            </div>
        `;
    }).join('') : '<p class="empty-message">Aucune tâche en cours 🎉</p>';
    
    // Objectifs
    const dashboardGoals = document.getElementById('dashboardGoals');
    dashboardGoals.innerHTML = goals.length > 0 ? `
        <div class="goals-grid">
            ${goals.map(goal => `
                <div class="goal-item">
                    <h3 class="goal-title">${goal.title}</h3>
                    <div class="goal-progress-wrapper">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${(goal.current / goal.target) * 100}%"></div>
                        </div>
                        <span class="goal-count">${goal.current}/${goal.target}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '<p class="empty-message">Définis tes objectifs !</p>';
}

// ========== GESTION DES MATIÈRES ==========
function toggleAddSubjectForm() {
    document.getElementById('addSubjectForm').classList.toggle('hidden');
}

function addSubject() {
    const name = document.getElementById('newSubjectName').value.trim();
    const coef = parseInt(document.getElementById('newSubjectCoef').value);
    
    if (!name || !coef) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const newSubject = {
        name: name,
        level: 50,
        coefficient: coef,
        color: colors[subjects.length % colors.length]
    };
    
    database.ref('userData/' + currentUser.uid + '/subjects').push(newSubject);
    
    document.getElementById('newSubjectName').value = '';
    document.getElementById('newSubjectCoef').value = '';
    toggleAddSubjectForm();
}

function updateSubjectLevel(id, delta) {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
        const newLevel = Math.max(0, Math.min(100, subject.level + delta));
        database.ref('userData/' + currentUser.uid + '/subjects/' + id + '/level').set(newLevel);
    }
}

function deleteSubject(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
        database.ref('userData/' + currentUser.uid + '/subjects/' + id).remove();
    }
}

function updateSubjectsList() {
    const list = document.getElementById('subjectsList');
    list.innerHTML = subjects.length > 0 ? subjects.map(subject => `
        <div class="subject-item">
            <div class="subject-header">
                <div class="subject-info">
                    <h3>${subject.name}</h3>
                    <p>Coefficient ${subject.coefficient}</p>
                </div>
                <button class="delete-btn" onclick="deleteSubject('${subject.id}')">🗑️</button>
            </div>
            <div class="subject-progress">
                <div class="subject-progress-bar">
                    <div class="subject-progress-fill color-${subject.color}" style="width: ${subject.level}%"></div>
                </div>
                <p class="subject-level">Niveau : ${subject.level}%</p>
            </div>
            <div class="subject-actions">
                <button class="btn btn-danger btn-small" onclick="updateSubjectLevel('${subject.id}', -5)">-5%</button>
                <button class="btn btn-success btn-small" onclick="updateSubjectLevel('${subject.id}', 5)">+5%</button>
            </div>
        </div>
    `).join('') : '<p class="empty-message">Aucune matière ajoutée</p>';
}

// ========== GESTION DES TÂCHES ==========
function toggleAddTaskForm() {
    document.getElementById('addTaskForm').classList.toggle('hidden');
}

function updateTaskSubjectSelect() {
    const select = document.getElementById('newTaskSubject');
    select.innerHTML = '<option value="">Choisir une matière</option>' + 
        subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function addTask() {
    const title = document.getElementById('newTaskTitle').value.trim();
    const subjectId = document.getElementById('newTaskSubject').value;
    const priority = document.getElementById('newTaskPriority').value;
    
    if (!title || !subjectId) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const newTask = {
        title: title,
        subjectId: subjectId,
        priority: priority,
        completed: false,
        date: new Date().toISOString()
    };
    
    database.ref('userData/' + currentUser.uid + '/tasks').push(newTask);
    
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskSubject').value = '';
    document.getElementById('newTaskPriority').value = 'moyenne';
    toggleAddTaskForm();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        database.ref('userData/' + currentUser.uid + '/tasks/' + id + '/completed').set(!task.completed);
    }
}

function deleteTask(id) {
    database.ref('userData/' + currentUser.uid + '/tasks/' + id).remove();
}

function updateTasksList() {
    const list = document.getElementById('tasksList');
    list.innerHTML = tasks.length > 0 ? tasks.map(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
                <div class="task-info">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-subject">${subject ? subject.name : 'Général'}</div>
                </div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
                <button class="delete-btn" onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        `;
    }).join('') : '<p class="empty-message">Aucune tâche créée</p>';
}

// ========== GESTION DES OBJECTIFS ==========
function toggleAddGoalForm() {
    document.getElementById('addGoalForm').classList.toggle('hidden');
}

function addGoal() {
    const title = document.getElementById('newGoalTitle').value.trim();
    const target = parseInt(document.getElementById('newGoalTarget').value);
    
    if (!title || !target) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const newGoal = {
        title: title,
        target: target,
        current: 0
    };
    
    database.ref('userData/' + currentUser.uid + '/goals').push(newGoal);
    
    document.getElementById('newGoalTitle').value = '';
    document.getElementById('newGoalTarget').value = '';
    toggleAddGoalForm();
}

function updateGoalProgress(id, delta) {
    const goal = goals.find(g => g.id === id);
    if (goal) {
        const newCurrent = Math.max(0, Math.min(goal.target, goal.current + delta));
        database.ref('userData/' + currentUser.uid + '/goals/' + id + '/current').set(newCurrent);
    }
}

function deleteGoal(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        database.ref('userData/' + currentUser.uid + '/goals/' + id).remove();
    }
}

function updateGoalsList() {
    const list = document.getElementById('goalsList');
    list.innerHTML = goals.length > 0 ? `
        <div class="goals-grid">
            ${goals.map(goal => `
                <div class="goal-item">
                    <div class="goal-header">
                        <h3 class="goal-title">${goal.title}</h3>
                        <button class="delete-btn" onclick="deleteGoal('${goal.id}')">🗑️</button>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-wrapper">
                            <div class="goal-progress-bar">
                                <div class="goal-progress-fill" style="width: ${(goal.current / goal.target) * 100}%"></div>
                            </div>
                            <span class="goal-count">${goal.current}/${goal.target}</span>
                        </div>
                        ${goal.current >= goal.target ? '<div class="goal-completed">🏆 Objectif atteint ! 🎉</div>' : ''}
                    </div>
                    <div class="goal-actions">
                        <button class="btn btn-danger btn-small" onclick="updateGoalProgress('${goal.id}', -1)">-1</button>
                        <button class="btn btn-success btn-small" onclick="updateGoalProgress('${goal.id}', 1)">+1</button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '<p class="empty-message">Aucun objectif défini</p>';
}

   

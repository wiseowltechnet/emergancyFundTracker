class AuthManager {
    constructor() {
        this.currentUser = localStorage.getItem('currentUser');
        this.users = JSON.parse(localStorage.getItem('users')) || {};
    }

    login(username, password) {
        if (!this.users[username]) {
            // Create new user
            this.users[username] = { password: password };
            localStorage.setItem('users', JSON.stringify(this.users));
        } else if (this.users[username].password !== password) {
            return false;
        }
        
        this.currentUser = username;
        localStorage.setItem('currentUser', username);
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

class EmergencyFundTracker {
    constructor() {
        this.auth = new AuthManager();
        this.currentAmount = 0;
        this.goal = 1000;
        this.entries = [];
        
        if (this.auth.isLoggedIn()) {
            this.loadUserData();
            this.showApp();
        } else {
            this.showLogin();
        }
        
        this.init();
    }

    loadUserData() {
        const user = this.auth.getCurrentUser();
        this.currentAmount = parseFloat(localStorage.getItem(`${user}_currentAmount`)) || 0;
        this.goal = parseFloat(localStorage.getItem(`${user}_goal`)) || 1000;
        this.entries = JSON.parse(localStorage.getItem(`${user}_entries`)) || [];
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    }

    init() {
        this.updateDisplay();
        this.bindEvents();
        this.renderEntries();
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('income-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('update-goal').addEventListener('click', () => {
            this.updateGoal();
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (this.auth.login(username, password)) {
            this.loadUserData();
            this.showApp();
            this.updateDisplay();
            this.renderEntries();
        } else {
            alert('Invalid password');
        }
    }

    handleLogout() {
        this.auth.logout();
        this.showLogin();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    addIncome() {
        const amount = parseFloat(document.getElementById('amount').value);
        const source = document.getElementById('source').value;

        if (!amount || !source) return;

        const entry = {
            id: Date.now(),
            amount: amount,
            source: source,
            date: new Date().toISOString()
        };

        this.entries.unshift(entry);
        this.currentAmount += amount;
        
        this.saveData();
        this.updateDisplay();
        this.renderEntries();
        this.resetForm();
        this.showSuccess(`Added $${amount.toFixed(2)} from ${this.formatSource(source)}`);
    }

    updateGoal() {
        const newGoal = parseFloat(document.getElementById('goal').value);
        if (newGoal && newGoal > 0) {
            this.goal = newGoal;
            this.saveData();
            this.updateDisplay();
            this.showSuccess(`Goal updated to $${newGoal.toFixed(2)}`);
        }
    }

    updateDisplay() {
        const percentage = Math.min((this.currentAmount / this.goal) * 100, 100);
        const remaining = Math.max(this.goal - this.currentAmount, 0);

        // Update thermometer fill
        document.getElementById('thermometer-fill').style.height = `${percentage}%`;
        
        // Update text displays
        document.querySelector('.current-amount').textContent = `$${this.currentAmount.toFixed(0)}`;
        document.getElementById('goal-amount').textContent = `$${this.goal.toFixed(0)}`;
        document.getElementById('percentage').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('remaining').textContent = remaining > 0 ? 
            `$${remaining.toFixed(0)} to go` : 'Goal Reached! 🎉';
        
        // Update goal input
        document.getElementById('goal').value = this.goal;

        // Change colors based on progress
        const fillElement = document.getElementById('thermometer-fill');
        if (percentage >= 100) {
            fillElement.style.background = '#10b981';
        }
    }

    renderEntries() {
        const container = document.getElementById('entries-list');
        
        if (this.entries.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No entries yet. Add your first gig income!</p>';
            return;
        }

        container.innerHTML = this.entries.slice(0, 10).map(entry => `
            <div class="entry">
                <div class="entry-info">
                    <div class="entry-amount">+$${entry.amount.toFixed(2)}</div>
                    <div class="entry-source">${this.formatSource(entry.source)}</div>
                </div>
                <div class="entry-date">${this.formatDate(entry.date)}</div>
            </div>
        `).join('');
    }

    formatSource(source) {
        const sources = {
            'amazon-flex': 'Amazon Flex',
            'doordash': 'DoorDash',
            'roadie': 'Roadie',
            'other': 'Other'
        };
        return sources[source] || source;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    resetForm() {
        document.getElementById('amount').value = '';
        document.getElementById('source').value = '';
    }

    saveData() {
        const user = this.auth.getCurrentUser();
        localStorage.setItem(`${user}_currentAmount`, this.currentAmount.toString());
        localStorage.setItem(`${user}_goal`, this.goal.toString());
        localStorage.setItem(`${user}_entries`, JSON.stringify(this.entries));
    }

    showSuccess(message) {
        // Simple success feedback
        const button = document.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = '✓ Added!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new EmergencyFundTracker();
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

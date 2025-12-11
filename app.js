class EmergencyFundTracker {
    constructor() {
        this.currentAmount = parseFloat(localStorage.getItem('currentAmount')) || 0;
        this.goal = parseFloat(localStorage.getItem('goal')) || 1000;
        this.entries = JSON.parse(localStorage.getItem('entries')) || [];
        
        this.init();
    }

    init() {
        this.updateDisplay();
        this.bindEvents();
        this.renderEntries();
    }

    bindEvents() {
        document.getElementById('income-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('update-goal').addEventListener('click', () => {
            this.updateGoal();
        });
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
        localStorage.setItem('currentAmount', this.currentAmount.toString());
        localStorage.setItem('goal', this.goal.toString());
        localStorage.setItem('entries', JSON.stringify(this.entries));
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

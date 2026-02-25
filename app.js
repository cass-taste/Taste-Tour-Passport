document.addEventListener('DOMContentLoaded', async () => {
    const operatorNameEl = document.getElementById('operator-name');
    const errorState = document.getElementById('error-state');
    const passportContent = document.getElementById('passport-content');
    const operatorSelect = document.getElementById('operator-select');

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let operator = urlParams.get('operator');

    try {
        // Fetch passport data
        const response = await fetch('data.json');
        const data = await response.json();
        const operators = data.operators;

        // Populate select box for fallback
        Object.keys(operators).sort().forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            operatorSelect.appendChild(option);
        });

        // Handle fallback selector
        operatorSelect.addEventListener('change', (e) => {
            window.location.search = `?operator=${encodeURIComponent(e.target.value)}`;
        });

        // Try to match the operator exactly or loosely
        if (operator) {
            let matchedOperator = Object.keys(operators).find(op => op.toLowerCase() === operator.toLowerCase());
            if (matchedOperator) {
                operator = matchedOperator;
            } else {
                // Try fuzzy match
                matchedOperator = Object.keys(operators).find(op => op.toLowerCase().includes(operator.toLowerCase()) || operator.toLowerCase().includes(op.toLowerCase()));
                if (matchedOperator) operator = matchedOperator;
                else operator = null;
            }
        }

        if (!operator || !operators[operator]) {
            errorState.classList.remove('hidden');

            // Debug info for Swapcard testing
            const debugInfo = document.createElement('div');
            debugInfo.style.marginTop = '2rem';
            debugInfo.style.padding = '1rem';
            debugInfo.style.background = '#ffebee';
            debugInfo.style.border = '1px solid #ffcdd2';
            debugInfo.style.borderRadius = '8px';
            debugInfo.style.fontSize = '0.85rem';
            debugInfo.innerHTML = `
                <strong>Debug Info:</strong><br>
                Raw URL Search: <code>${window.location.search || 'None'}</code><br>
                Parsed Operator: <code>${operator || 'null'}</code>
            `;
            errorState.appendChild(debugInfo);

            return;
        }

        // We have a valid operator!
        operatorNameEl.textContent = `Welcome, ${operator}`;
        passportContent.classList.remove('hidden');

        const passportData = operators[operator];

        // Setup state loading/saving in localStorage
        const storageKey = `passport_${operator.replace(/\s+/g, '_')}`;
        let savedState = JSON.parse(localStorage.getItem(storageKey) || '{"hitList": [], "meetingList": []}');

        const saveState = () => {
            localStorage.setItem(storageKey, JSON.stringify(savedState));
        };

        const renderList = (listId, items, savedItemsKey, progressTextId, progressBarId) => {
            const listEl = document.getElementById(listId);
            const textEl = document.getElementById(progressTextId);
            const barEl = document.getElementById(progressBarId);

            listEl.innerHTML = '';

            const updateProgress = () => {
                const checkedCount = savedState[savedItemsKey].length;
                const totalCount = items.length;
                textEl.textContent = `${checkedCount} / ${totalCount}`;
                const percentage = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100;
                barEl.style.width = `${percentage}%`;
            };

            items.forEach(item => {
                const li = document.createElement('li');
                const isChecked = savedState[savedItemsKey].includes(item);
                if (isChecked) {
                    li.classList.add('checked');
                }

                li.innerHTML = `
                    <div class="checkbox"></div>
                    <span class="supplier-name">${item}</span>
                `;

                li.addEventListener('click', () => {
                    if (li.classList.contains('checked')) {
                        li.classList.remove('checked');
                        savedState[savedItemsKey] = savedState[savedItemsKey].filter(i => i !== item);
                    } else {
                        li.classList.add('checked');
                        if (!savedState[savedItemsKey].includes(item)) {
                            savedState[savedItemsKey].push(item);

                            // Check if this group is now 100% complete
                            if (savedState[savedItemsKey].length === items.length) {
                                fireConfetti();
                            }
                        }
                    }
                    saveState();
                    updateProgress();
                });

                listEl.appendChild(li);
            });

            // Initial progress update
            // Use setTimeout to allow browser to render DOM first, ensuring transition animation plays
            setTimeout(updateProgress, 100);
        };

        renderList('hit-list', passportData.hit_list, 'hitList', 'hit-progress-text', 'hit-progress-bar');
        renderList('meeting-list', passportData.meeting_list, 'meetingList', 'meeting-progress-text', 'meeting-progress-bar');

    } catch (err) {
        console.error("Error loading passport data:", err);
        errorState.innerHTML = `<h2>Error</h2><p>Failed to load passport data. If you're opening this locally, make sure to use a local web server (e.g. Live Server).</p>`;
        errorState.classList.remove('hidden');
    }
});

function fireConfetti() {
    var count = 200;
    var defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}

// Register Service Worker for Offline Mode
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

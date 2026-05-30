    /* ------- Storage Module (Task 2) ------- */
    var Storage = (function() {
        const KEYS = {
            progress: 'quiz_progress',
            history: 'quiz_history',
            wrong: 'quiz_wrong',
            favorites: 'quiz_favorites'
        };

        function _get(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }

        function _set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                // Silently fail if localStorage is unavailable
            }
        }

        return {
            saveProgress(progress) {
                _set(KEYS.progress, progress);
            },

            loadProgress() {
                return _get(KEYS.progress);
            },

            saveHistory(record) {
                const history = _get(KEYS.history) || [];
                history.push(record);
                _set(KEYS.history, history);
            },

            loadHistory() {
                return _get(KEYS.history) || [];
            },

            saveWrong(questionId) {
                const list = _get(KEYS.wrong) || [];
                if (!list.includes(questionId)) {
                    list.push(questionId);
                    _set(KEYS.wrong, list);
                }
            },

            removeWrong(questionId) {
                const list = _get(KEYS.wrong) || [];
                const index = list.indexOf(questionId);
                if (index !== -1) {
                    list.splice(index, 1);
                    _set(KEYS.wrong, list);
                }
            },

            getWrongList() {
                return _get(KEYS.wrong) || [];
            },

            saveFavorite(questionId) {
                const list = _get(KEYS.favorites) || [];
                if (!list.includes(questionId)) {
                    list.push(questionId);
                    _set(KEYS.favorites, list);
                }
            },

            removeFavorite(questionId) {
                const list = _get(KEYS.favorites) || [];
                const index = list.indexOf(questionId);
                if (index !== -1) {
                    list.splice(index, 1);
                    _set(KEYS.favorites, list);
                }
            },

            getFavoriteList() {
                return _get(KEYS.favorites) || [];
            },

            isFavorite(questionId) {
                const list = _get(KEYS.favorites) || [];
                return list.includes(questionId);
            },

            clearAll() {
                try {
                    localStorage.removeItem(KEYS.progress);
                    localStorage.removeItem(KEYS.history);
                    localStorage.removeItem(KEYS.wrong);
                    localStorage.removeItem(KEYS.favorites);
                } catch (e) {
                    // Silently fail if localStorage is unavailable
                }
            }
        };
    })();

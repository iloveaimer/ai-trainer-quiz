     * ------- Sync Module (Firebase Realtime Database) -------
     *
     * Uses a shared "sync code" (6-char alphanumeric) instead of anonymous UID
     * so that multiple devices with the same sync code read/write to the same
     * Firebase path: /groups/{syncCode}/
     *
     * Firebase Realtime Database rules should allow authenticated users to
     * read/write under /groups/:
     * {
     *   "rules": {
     *     "groups": {
     *       "$code": {
     *         ".read": "auth != null",
     *         ".write": "auth != null"
     *       }
     *     }
     *   }
     * }
     */
    var Sync = (function() {
        var app = null;
        var auth = null;
        var db = null;
        var uid = null;
        var syncCode = null;
        var connected = false;
        var syncing = false;
        var saveTimer = null;
        var initialized = false;

        // Characters used for sync code generation (no ambiguous chars: 0/O, 1/I/L)
        var SYNC_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        var SYNC_CODE_KEY = 'quiz_sync_code';

        function generateSyncCode() {
            var code = '';
            for (var i = 0; i < 6; i++) {
                code += SYNC_CHARS.charAt(Math.floor(Math.random() * SYNC_CHARS.length));
            }
            return code;
        }

        function getSyncCode() {
            return localStorage.getItem(SYNC_CODE_KEY) || '';
        }

        function setSyncCode(code) {
            syncCode = code.toUpperCase();
            localStorage.setItem(SYNC_CODE_KEY, syncCode);
            updateStatusUI();
            // Reload data from the new group path - force cloud data when switching codes
            if (initialized && db) {
                Sync.loadFromCloud(true);
            }
        }

        function validateSyncCode(code) {
            if (!code || typeof code !== 'string') return false;
            var normalized = code.toUpperCase().trim();
            if (normalized.length !== 6) return false;
            for (var i = 0; i < normalized.length; i++) {
                if (SYNC_CHARS.indexOf(normalized[i]) === -1) return false;
            }
            return true;
        }

        function joinSyncCode(code) {
            if (!validateSyncCode(code)) {
                return { ok: false, error: '同步码格式不正确（需要6位字母数字）' };
            }
            setSyncCode(code.toUpperCase().trim());
            return { ok: true };
        }

        function getDataPath() {
            if (!syncCode) return null;
            return '/groups/' + syncCode;
        }

        function updateStatusUI() {
            var el = document.getElementById('syncStatus');
            if (!el) return;
            var dot = el.querySelector('.sync-dot');
            var text = el.querySelector('.sync-text');
            if (!dot || !text) return;

            if (!initialized) {
                dot.className = 'sync-dot offline';
                text.textContent = '离线模式';
            } else if (syncing) {
                dot.className = 'sync-dot syncing';
                text.textContent = '同步中...';
            } else if (connected) {
                dot.className = 'sync-dot online';
                text.textContent = '已同步';
            } else {
                dot.className = 'sync-dot offline';
                text.textContent = '离线模式';
            }

            // Show sync code in UI
            var displayEl = document.getElementById('syncCodeDisplay');
            var codeTextEl = document.getElementById('syncCodeText');
            if (displayEl && codeTextEl && syncCode) {
                displayEl.style.display = 'inline-flex';
                codeTextEl.textContent = syncCode;
            }
        }

        function getLocalData() {
            var stored = localStorage.getItem('quiz_last_modified');
            return {
                progress: Storage.loadProgress(),
                wrong: Storage.getWrongList(),
                history: Storage.loadHistory(),
                lastModified: stored || new Date().toISOString()
            };
        }

        function markLocalModified() {
            var now = new Date().toISOString();
            localStorage.setItem('quiz_last_modified', now);
            return now;
        }

        function applyCloudData(data) {
            if (data.progress) {
                localStorage.setItem('quiz_progress', JSON.stringify(data.progress));
            }
            if (data.wrong) {
                localStorage.setItem('quiz_wrong', JSON.stringify(data.wrong));
            }
            if (data.history) {
                localStorage.setItem('quiz_history', JSON.stringify(data.history));
            }
            if (data.lastModified) {
                localStorage.setItem('quiz_last_modified', data.lastModified);
            }
        }

        function showSyncDialog() {
            var overlay = document.getElementById('modalOverlay');
            var content = document.getElementById('modalContent');
            if (!overlay || !content) return;

            var currentCode = syncCode || '';

            var html = '<div class="modal-header">' +
                '<h2 class="modal-title">设备同步</h2>' +
                '<button class="modal-close-btn" id="syncDialogCloseBtn">&times;</button>' +
                '</div><div class="modal-body">' +
                '<div class="sync-current-section">' +
                '<div class="sync-current-label">当前同步码</div>' +
                '<div class="sync-current-code">' + currentCode + '</div>' +
                '<br><button class="sync-copy-btn" id="syncCopyBtn">复制同步码</button>' +
                '</div>' +
                '<hr class="sync-divider">' +
                '<div class="sync-join-section">' +
                '<div class="sync-join-label">输入另一设备的同步码进行连接</div>' +
                '<div class="sync-join-input-row">' +
                '<input type="text" class="sync-join-input" id="syncJoinInput" maxlength="6" placeholder="输入6位同步码" autocomplete="off" spellcheck="false">' +
                '<button class="sync-join-btn" id="syncJoinBtn">连接</button>' +
                '</div>' +
                '<div class="sync-feedback" id="syncFeedback"></div>' +
                '</div>' +
                '</div>';

            content.innerHTML = html;
            content.className = 'modal-content sync-dialog';
            overlay.classList.add('visible');

            // Bind close
            document.getElementById('syncDialogCloseBtn').addEventListener('click', function() {
                overlay.classList.remove('visible');
            });

            // Bind copy
            document.getElementById('syncCopyBtn').addEventListener('click', function() {
                var btn = this;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(currentCode).then(function() {
                        btn.textContent = '已复制';
                        btn.classList.add('copied');
                        setTimeout(function() {
                            btn.textContent = '复制同步码';
                            btn.classList.remove('copied');
                        }, 2000);
                    }).catch(function() {
                        fallbackCopy(currentCode, btn);
                    });
                } else {
                    fallbackCopy(currentCode, btn);
                }
            });

            // Bind join input - auto-uppercase
            var joinInput = document.getElementById('syncJoinInput');
            joinInput.addEventListener('input', function() {
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });

            // Bind join button
            document.getElementById('syncJoinBtn').addEventListener('click', function() {
                var code = joinInput.value.trim();
                var feedback = document.getElementById('syncFeedback');
                var result = joinSyncCode(code);
                if (result.ok) {
                    feedback.className = 'sync-feedback success';
                    feedback.textContent = '已切换到同步码: ' + syncCode;
                    // Update displayed code
                    document.querySelector('.sync-current-code').textContent = syncCode;
                    joinInput.value = '';
                } else {
                    feedback.className = 'sync-feedback error';
                    feedback.textContent = result.error;
                }
            });

            // Enter key on input
            joinInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('syncJoinBtn').click();
                }
            });

            // Focus input
            joinInput.focus();
        }

        function fallbackCopy(text, btn) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                btn.textContent = '已复制';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.textContent = '复制同步码';
                    btn.classList.remove('copied');
                }, 2000);
            } catch (e) {
                btn.textContent = '复制失败';
                setTimeout(function() {
                    btn.textContent = '复制同步码';
                }, 2000);
            }
            document.body.removeChild(ta);
        }

        return {
            init: function() {
                try {
                    if (!firebase.apps.length) {
                        app = firebase.initializeApp({
                            apiKey: "AIzaSyD4lbUsQFn496u8Hv6crhYvk_7paL47hLI",
                            authDomain: "ai-trainer-quiz-2777d.firebaseapp.com",
                            databaseURL: "https://ai-trainer-quiz-2777d-default-rtdb.asia-southeast1.firebasedatabase.app",
                            projectId: "ai-trainer-quiz-2777d",
                            storageBucket: "ai-trainer-quiz-2777d.firebasestorage.app",
                            messagingSenderId: "1017229865832",
                            appId: "1:1017229865832:web:075581ba26ac97ec2adcdd"
                        });
                    } else {
                        app = firebase.app();
                    }
                    auth = firebase.auth();
                    db = firebase.database();

                    // Connection status listener
                    db.ref('.info/connected').on('value', function(snap) {
                        connected = snap.val() === true;
                        updateStatusUI();
                    });

                    // Check for existing sync code or generate a new one
                    syncCode = getSyncCode();
                    if (!syncCode) {
                        syncCode = generateSyncCode();
                        localStorage.setItem(SYNC_CODE_KEY, syncCode);
                    }

                    // Sign in anonymously (needed for database rules)
                    auth.signInAnonymously().then(function() {
                        uid = auth.currentUser.uid;
                        initialized = true;
                        updateStatusUI();
                        Sync.loadFromCloud();
                    }).catch(function(err) {
                        console.warn('Firebase anonymous auth failed:', err);
                        updateStatusUI();
                    });

                    // Bind sync switch button
                    var switchBtn = document.getElementById('syncSwitchBtn');
                    if (switchBtn) {
                        switchBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            showSyncDialog();
                        });
                    }
                } catch (err) {
                    console.warn('Firebase init failed:', err);
                    updateStatusUI();
                }
            },

            loadFromCloud: function(forceCloud) {
                if (!db || !uid || !syncCode) return;
                var path = getDataPath();
                if (!path) return;

                try {
                    syncing = true;
                    updateStatusUI();

                    db.ref(path).once('value').then(function(snap) {
                        syncing = false;
                        var cloudData = snap.val();
                        var localData = getLocalData();
                        var localProgress = localData.progress;

                        if (cloudData && cloudData.progress) {
                            var cloudTime = cloudData.lastModified || '';
                            var localTime = localData.lastModified || '';

                            // Use cloud if: forced, cloud is newer, or local has no real data
                            var localHasData = localProgress && localProgress.totalAnswered > 0;
                            if (forceCloud || cloudTime > localTime || !localHasData) {
                                applyCloudData(cloudData);
                                State.init();
                                UI.render();
                            } else {
                                Sync.saveToCloud(true);
                            }
                        } else if (localProgress && localProgress.totalAnswered > 0) {
                            // No cloud data but local has real data - push to cloud
                            Sync.saveToCloud(true);
                        }
                        updateStatusUI();
                    }).catch(function(err) {
                        syncing = false;
                        console.warn('Firebase read failed:', err);
                        UI.showToast('同步失败: ' + (err.message || '网络错误'), 'error');
                        updateStatusUI();
                    });
                } catch (err) {
                    syncing = false;
                    console.warn('loadFromCloud failed:', err);
                    UI.showToast('同步初始化失败', 'error');
                    updateStatusUI();
                }
            },

            saveToCloud: function(immediate) {
                if (!db || !uid || !syncCode) return;
                var path = getDataPath();
                if (!path) return;

                if (saveTimer) {
                    clearTimeout(saveTimer);
                    saveTimer = null;
                }

                function doSave() {
                    try {
                        syncing = true;
                        updateStatusUI();
                        var data = getLocalData();
                        data.lastModified = markLocalModified();
                        db.ref(path).set(data).then(function() {
                            syncing = false;
                            updateStatusUI();
                        }).catch(function(err) {
                            syncing = false;
                            console.warn('Firebase write failed:', err);
                            UI.showToast('同步写入失败: ' + (err.message || '权限不足'), 'error');
                            updateStatusUI();
                        });
                    } catch (err) {
                        syncing = false;
                        console.warn('saveToCloud failed:', err);
                        updateStatusUI();
                    }
                }

                if (immediate) {
                    doSave();
                } else {
                    saveTimer = setTimeout(doSave, 500);
                }
            },

            isConnected: function() {
                return connected;
            },

            getStatus: function() {
                if (!initialized) return 'offline';
                if (syncing) return 'syncing';
                if (connected) return 'synced';
                return 'offline';
            },

            getUid: function() {
                return uid;
            },

            getSyncCode: function() {
                return syncCode;
            },

            setSyncCode: function(code) {
                setSyncCode(code);
            },

            joinSyncCode: function(code) {
                return joinSyncCode(code);
            },

            generateSyncCode: function() {
                return generateSyncCode();
            },

            showSyncDialog: function() {
                showSyncDialog();
            }
        };
    })();

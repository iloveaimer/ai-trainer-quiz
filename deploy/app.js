    /* ------- App Module (Task 4) ------- */
    var App = (function() {
        // --- Confirm Modal ---
        function showConfirm(icon, message, onConfirm) {
            var bodyHtml = '<div class="confirm-body">' +
                '<div class="confirm-icon">' + icon + '</div>' +
                '<div class="confirm-message">' + message + '</div>' +
                '<div class="confirm-btn-group">' +
                '<button class="confirm-btn confirm-btn-cancel" id="confirmCancelBtn">取消</button>' +
                '<button class="confirm-btn confirm-btn-confirm" id="confirmOkBtn">确定</button>' +
                '</div></div>';

            Modal.open('确认操作', bodyHtml);

            document.getElementById('confirmCancelBtn').addEventListener('click', function() {
                Modal.close();
            });
            document.getElementById('confirmOkBtn').addEventListener('click', function() {
                Modal.close();
                onConfirm();
            });
        }

        // --- Reset Handler ---
        function bindResetButton() {
            document.getElementById('btnReset').addEventListener('click', function() {
                showConfirm('⚠️', '确定要重置所有进度吗？此操作不可撤销。', function() {
                    State.reset();
                    UI.render();
                    UI.showToast('已重置所有进度', 'success');
                });
            });
        }

        // --- Mode Switch Confirmation ---
        function bindModeSwitchConfirmation() {
            document.getElementById('btnModeSwitch').addEventListener('click', function() {
                showModeSwitchModal();
            });
        }

        // --- Question List Button ---
        function bindQuestionListButton() {
            document.getElementById('btnQuestionList').addEventListener('click', function() {
                UI.showQuestionList();
            });
        }

        // --- Init ---
        async function init() {
            await loadQuestions();
            State.init();
            if (typeof Sync !== 'undefined') {
                try { Sync.init(); } catch (e) { /* ignore */ }
            }
            UI.render();
            Events.init();
            bindResetButton();
            bindModeSwitchConfirmation();
            bindQuestionListButton();

            // Pull latest from Firebase when tab becomes visible
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && typeof Sync !== 'undefined') {
                    try { Sync.loadFromCloud(); } catch (e) { /* ignore */ }
                }
            });
        }

        return { init: init, showConfirm: showConfirm };
    })();

    document.addEventListener('DOMContentLoaded', function() {
        App.init();
    });

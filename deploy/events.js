    /* ------- Events Module (Task 3) ------- */
    var Events = (function() {
        function toggleMultiChoice(label) {
            var state = State.getCurrent();
            var isExamActive = state.exam && state.exam.inExam;
            var isExamCompleted = state.exam && state.exam.isCompleted;

            var question = State.getCurrentQuestion();
            var qIndex = State.getCurrentQuestionIndex();
            if (!question) return;
            if ((!isExamActive || isExamCompleted) && State.isAnswered(qIndex)) return;

            var option = document.querySelector('#choiceOptions .choice-option[data-label="' + label + '"]');
            if (!option) return;

            option.classList.toggle('selected');
            var selected = document.querySelectorAll('#choiceOptions .choice-option.selected');
            document.getElementById('btnSubmit').disabled = selected.length === 0;
        }

        function handleAnswer(userAnswer) {
            var state = State.getCurrent();
            var isExamActive = state.exam && state.exam.inExam;
            var isExamCompleted = state.exam && state.exam.isCompleted;

            // 背题模式下禁止作答（答案已默认展示）
            if (state.mode === 'memorize') return;

            var question = State.getCurrentQuestion();
            var qIndex = State.getCurrentQuestionIndex();

            if (!isExamActive || isExamCompleted) {
                if (State.isAnswered(qIndex)) return;
            }

            var isCorrect = State.answerQuestion(userAnswer);
            UI.render();

            if (isExamActive && !isExamCompleted) {
                // 考试中未交卷，300ms 后自动跳下一题
                if (question.type === 'single' || question.type === 'judge') {
                    if (State.canGoNext()) {
                        setTimeout(function() {
                            var s = State.getCurrent();
                            if (s.exam && s.exam.inExam && !s.exam.isCompleted && s.order[s.currentIndex] === qIndex) {
                                State.goNext();
                                UI.render();
                            }
                        }, 300);
                    }
                }
            } else {
                if (isCorrect) {
                    UI.showToast('回答正确！', 'success');
                } else {
                    UI.showToast('回答错误', 'error');
                }

                if (State.getCategory() !== 'wrong') {
                    var stats = State.getCategoryStats();
                    if (stats.answered >= stats.total) {
                        setTimeout(function() {
                            UI.showCompletion();
                        }, 600);
                    }
                }
            }
        }

        return {
            init() {
                // Judge answer buttons
                document.getElementById('btnTrue').addEventListener('click', function() {
                    handleAnswer('√');
                });
                document.getElementById('btnFalse').addEventListener('click', function() {
                    handleAnswer('×');
                });

                // Category tab clicks (event delegation)
                document.getElementById('categoryTabs').addEventListener('click', function(e) {
                    var target = e.target;
                    if (target.classList.contains('cat-tab')) {
                        var cat = target.getAttribute('data-category');
                        State.setCategory(cat);
                        UI.render();
                    }
                });

                // Choice options (event delegation on choiceOptions container)
                document.getElementById('choiceOptions').addEventListener('click', function(e) {
                    var option = e.target.closest('.choice-option');
                    if (!option || option.classList.contains('disabled')) return;

                    var question = State.getCurrentQuestion();
                    var qIndex = State.getCurrentQuestionIndex();
                    
                    var state = State.getCurrent();
                    var isExamActive = state.exam && state.exam.inExam;
                    var isExamCompleted = state.exam && state.exam.isCompleted;

                    if (!question) return;
                    if ((!isExamActive || isExamCompleted) && State.isAnswered(qIndex)) return;

                    if (question.type === 'single') {
                        var label = option.getAttribute('data-label');
                        handleAnswer(label);
                    } else if (question.type === 'multi') {
                        option.classList.toggle('selected');
                        var selected = document.querySelectorAll('#choiceOptions .choice-option.selected');
                        document.getElementById('btnSubmit').disabled = selected.length === 0;
                    }
                });

                // Submit button for multi-choice
                document.getElementById('btnSubmit').addEventListener('click', function() {
                    var question = State.getCurrentQuestion();
                    var qIndex = State.getCurrentQuestionIndex();
                    
                    var state = State.getCurrent();
                    var isExamActive = state.exam && state.exam.inExam;
                    var isExamCompleted = state.exam && state.exam.isCompleted;

                    if (!question) return;
                    if ((!isExamActive || isExamCompleted) && State.isAnswered(qIndex)) return;

                    var selected = document.querySelectorAll('#choiceOptions .choice-option.selected');
                    if (selected.length === 0) return;

                    var answer = '';
                    for (var i = 0; i < selected.length; i++) {
                        answer += selected[i].getAttribute('data-label');
                    }
                    answer = answer.split('').sort().join('');
                    handleAnswer(answer);
                });

                // Navigation: previous
                document.getElementById('btnPrev').addEventListener('click', function() {
                    State.goPrev();
                    UI.render();
                });

                // Navigation: next
                document.getElementById('btnNext').addEventListener('click', function() {
                    State.goNext();
                    UI.render();
                });

                // Bottom bar: wrong book
                document.getElementById('btnWrongBook').addEventListener('click', function() {
                    UI.showWrongBook();
                });

                // Modal overlay click to close
                Modal.getOverlay().addEventListener('click', function(e) {
                    if (e.target === this) Modal.close();
                });

                // Event delegation for wrong book "重做" buttons
                document.getElementById('modalContent').addEventListener('click', function(e) {
                    var target = e.target;
                    if (target.classList.contains('btn-redo')) {
                        var qIndex = parseInt(target.getAttribute('data-question-index'), 10);
                        var state = State.getCurrent();
                        var orderIndex = state.order.indexOf(qIndex);
                        if (orderIndex !== -1) {
                            state.currentIndex = orderIndex;
                            State.clearAnswer(qIndex);
                            State.persist();
                        }
                        Modal.close();
                        UI.render();
                        UI.showToast('已清除答题记录，请重新作答', 'info');
                    }
                });

                // 交卷按钮
                document.getElementById('btnSubmitExam').addEventListener('click', function() {
                    var state = State.getCurrent();
                    if (!state || !state.exam || !state.exam.inExam || state.exam.isCompleted) return;

                    var totalQuestions = state.exam.questions.length;
                    var answeredCount = Object.keys(state.exam.userAnswers).length;
                    var unanswered = totalQuestions - answeredCount;

                    if (unanswered > 0) {
                        App.showConfirm('📝', '您还有 ' + unanswered + ' 道题未作答，确定现在交卷吗？', function() {
                            submitExam(false);
                        });
                    } else {
                        App.showConfirm('📝', '确定交卷并查看考试结果吗？', function() {
                            submitExam(false);
                        });
                    }
                });

                // 退出按钮
                document.getElementById('btnExitExam').addEventListener('click', function() {
                    var state = State.getCurrent();
                    if (!state || !state.exam || !state.exam.inExam) return;

                    if (!state.exam.isCompleted) {
                        App.showConfirm('⚠️', '退出考试将无法保存本次成绩，确认退出吗？', function() {
                            exitExamMode();
                        });
                    } else {
                        exitExamMode();
                    }
                });

                // Keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        if (Modal.getOverlay().classList.contains('visible')) {
                            e.preventDefault();
                            Modal.close();
                        }
                        return;
                    }

                    if (Modal.getOverlay().classList.contains('visible')) return;

                    // 背题模式：↑或↓切换显示全部/仅正确答案
                    var state = State.getCurrent();
                    if (state.mode === 'memorize' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                        e.preventDefault();
                        UI.toggleMemorizeShowAll();
                        UI.render();
                        return;
                    }

                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        if (State.canGoPrev()) { State.goPrev(); UI.render(); }
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        if (State.canGoNext()) { State.goNext(); UI.render(); }
                    } else if (e.key === 'Enter') {
                        var q = State.getCurrentQuestion();
                        var qIdx = State.getCurrentQuestionIndex();
                        
                        var state = State.getCurrent();
                        var isExamActive = state.exam && state.exam.inExam;
                        var isExamCompleted = state.exam && state.exam.isCompleted;

                        if (q && q.type === 'multi') {
                            if ((isExamActive && !isExamCompleted) || !State.isAnswered(qIdx)) {
                                var selected = document.querySelectorAll('#choiceOptions .choice-option.selected');
                                if (selected.length > 0) {
                                    var answer = '';
                                    for (var i = 0; i < selected.length; i++) answer += selected[i].getAttribute('data-label');
                                    handleAnswer(answer.split('').sort().join(''));
                                }
                            }
                        }
                    } else {
                        var keyMap = {'1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E'};
                        var label = keyMap[e.key];
                        if (!label) return;
                        var q = State.getCurrentQuestion();
                        if (!q) return;
                        var qIdx = State.getCurrentQuestionIndex();

                        var state = State.getCurrent();
                        var isExamActive = state.exam && state.exam.inExam;
                        var isExamCompleted = state.exam && state.exam.isCompleted;

                        if (q.type === 'judge') {
                            if ((isExamActive && !isExamCompleted) || !State.isAnswered(qIdx)) {
                                handleAnswer(label === 'A' ? '√' : '×');
                            }
                        } else if (q.type === 'single') {
                            if ((isExamActive && !isExamCompleted) || !State.isAnswered(qIdx)) {
                                handleAnswer(label);
                            }
                        } else if (q.type === 'multi') {
                            if ((isExamActive && !isExamCompleted) || !State.isAnswered(qIdx)) {
                                toggleMultiChoice(label);
                            }
                        }
                    }
                });

                // Favorite button (event delegation on questionNumber)
                document.getElementById('questionNumber').addEventListener('click', function(e) {
                    var target = e.target.nodeType === 3 ? e.target.parentElement : e.target;
                    var favBtn = target.closest('.fav-btn');
                    if (!favBtn) return;
                    e.stopPropagation();
                    var qIndex = parseInt(favBtn.getAttribute('data-question-index'));
                    if (isNaN(qIndex)) return;
                    var becameFav = State.toggleFavorite(qIndex);
                    if (becameFav) {
                        favBtn.classList.add('active');
                        favBtn.textContent = '⭐';
                        favBtn.title = '取消收藏';
                    } else {
                        favBtn.classList.remove('active');
                        favBtn.textContent = '☆';
                        favBtn.title = '收藏题目';
                    }
                });
            }
        };
    })();

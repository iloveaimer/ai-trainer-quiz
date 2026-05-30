    /* ------- UI Module (Task 3) ------- */
    var UI = (function() {
        return {
            render() {
                var state = State.getCurrent();
                var isExamActive = state.exam && state.exam.inExam;
                var isExamCompleted = state.exam && state.exam.isCompleted;

                this.updateModeBadge();
                this.renderStats();
                this.renderCategoryTabs();
                
                var currentCat = State.getCategory();
                if (currentCat === 'practice') {
                    // 实操模式下，动态给body增加类名，支持顶栏撑宽
                    document.body.classList.add('practice-mode');
                    
                    // 隐藏理论题答题区与底部控制栏
                    document.getElementById('questionContainer').style.display = 'none';
                    document.getElementById('feedbackContainer').style.display = 'none';
                    document.getElementById('navigationBar').style.display = 'none';
                    document.getElementById('bottomBar').style.display = 'none';
                    
                    var progressWrapper = document.querySelector('.progress-wrapper');
                    if (progressWrapper) progressWrapper.style.display = 'none';
                    var statsBar = document.getElementById('statsBar');
                    if (statsBar) statsBar.style.display = 'none';
                    
                    // 隐藏 1.2.x 容器
                    var practice12xContainer = document.getElementById('practice12xContainer');
                    if (practice12xContainer) {
                        practice12xContainer.style.display = 'none';
                        practice12xContainer.innerHTML = '';
                    }

                    // 显示实操题容器并渲染
                    var practiceContainer = document.getElementById('practiceContainer');
                    if (practiceContainer) practiceContainer.style.display = 'block';
                    
                    this.renderPractices();
                    return;
                } else if (currentCat === 'practice12x') {
                    // 1.2.x 方案设计实操模式下，动态给body增加类名
                    document.body.classList.add('practice-mode');
                    
                    // 隐藏理论题答题区与底部控制栏
                    document.getElementById('questionContainer').style.display = 'none';
                    document.getElementById('feedbackContainer').style.display = 'none';
                    document.getElementById('navigationBar').style.display = 'none';
                    document.getElementById('bottomBar').style.display = 'none';
                    
                    var progressWrapper = document.querySelector('.progress-wrapper');
                    if (progressWrapper) progressWrapper.style.display = 'none';
                    var statsBar = document.getElementById('statsBar');
                    if (statsBar) statsBar.style.display = 'none';
                    
                    // 隐藏原有实操容器
                    var practiceContainer = document.getElementById('practiceContainer');
                    if (practiceContainer) {
                        practiceContainer.style.display = 'none';
                        practiceContainer.innerHTML = '';
                    }

                    // 显示方案设计容器并渲染
                    var practice12xContainer = document.getElementById('practice12xContainer');
                    if (practice12xContainer) practice12xContainer.style.display = 'block';
                    
                    this.renderPractice12x();
                    return;
                } else {
                    // 非实操模式下，清除所有实操专属类名
                    document.body.classList.remove('practice-mode');
                    document.body.classList.remove('workspace-active');
                    
                    // 恢复理论题答题区与底部控制栏的显示状态
                    document.getElementById('questionContainer').style.display = '';
                    document.getElementById('feedbackContainer').style.display = '';
                    document.getElementById('navigationBar').style.display = '';
                    document.getElementById('bottomBar').style.display = '';
                    
                    var progressWrapper = document.querySelector('.progress-wrapper');
                    if (progressWrapper) progressWrapper.style.display = '';
                    var statsBar = document.getElementById('statsBar');
                    if (statsBar) statsBar.style.display = '';
                    
                    // 隐藏实操题容器
                    var practiceContainer = document.getElementById('practiceContainer');
                    if (practiceContainer) {
                        practiceContainer.style.display = 'none';
                        practiceContainer.innerHTML = '';
                    }
                    var practice12xContainer = document.getElementById('practice12xContainer');
                    if (practice12xContainer) {
                        practice12xContainer.style.display = 'none';
                        practice12xContainer.innerHTML = '';
                    }
                }

                var question = State.getCurrentQuestion();
                if (!question) {
                    if (State.getCategory() === 'wrong') {
                        document.getElementById('questionText').textContent = '暂无错题，继续保持！';
                        document.getElementById('judgeButtons').style.display = 'none';
                        document.getElementById('choiceOptions').style.display = 'none';
                        document.getElementById('btnSubmit').style.display = 'none';
                    } else {
                        document.getElementById('questionText').textContent = '题目加载失败，请刷新页面重试。';
                    }
                    document.getElementById('feedbackContainer').classList.remove('visible');
                    this.renderNavigation();
                    return;
                }

                var qIndex = State.getCurrentQuestionIndex();
                this.renderQuestion(question, qIndex);

                // 考试中未交卷，隐藏反馈区
                // 背题模式：自动展示正确答案和解析
                if (state.mode === 'memorize') {
                    this.renderFeedback(question, question.answer, true);
                } else if (isExamActive && !isExamCompleted) {
                    document.getElementById('feedbackContainer').classList.remove('visible');
                    this.renderExamTimer();
                } else {
                    if (State.isAnswered(qIndex)) {
                        var userAnswer = State.getAnswer(qIndex);
                        var isCorrect = (userAnswer === question.answer);
                        this.renderFeedback(question, userAnswer, isCorrect);
                    } else {
                        document.getElementById('feedbackContainer').classList.remove('visible');
                    }
                }
                this.renderNavigation();

                // 切题自动滚顶（仅长题目/选项过多时：综合题目+选项+解析判断）
                var totalLen = question.question.length;
                if (question.options) {
                    for (var oi = 0; oi < question.options.length; oi++) {
                        totalLen += question.options[oi].text.length;
                    }
                }
                if (question.explanation && (State.isAnswered(qIndex) || state.mode === 'memorize')) {
                    totalLen += question.explanation.length;
                }
                if (totalLen > 200) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },

            renderCategoryTabs() {
                var currentCat = State.getCategory();
                var tabs = document.querySelectorAll('.cat-tab');
                for (var i = 0; i < tabs.length; i++) {
                    var cat = tabs[i].getAttribute('data-category');
                    if (cat === currentCat) {
                        tabs[i].classList.add('active');
                    } else {
                        tabs[i].classList.remove('active');
                    }
                }
            },

            updateModeBadge() {
                var state = State.getCurrent();
                var badgeEl = document.getElementById('modeBadge');
                if (badgeEl) {
                    if (state.exam && state.exam.inExam) {
                        badgeEl.textContent = '模拟考试';
                    } else if (state.mode === 'memorize') {
                        badgeEl.textContent = '📖 背题模式';
                    } else {
                        badgeEl.textContent = state.mode === 'sequential' ? '顺序刷题' : '随机刷题';
                    }
                }
            },

            renderExamTimer() {
                var state = State.getCurrent();
                if (!state || !state.exam || !state.exam.inExam) return;

                var timerEl = document.getElementById('examTimer');
                var progressTextEl = document.getElementById('examProgressText');

                if (timerEl) {
                    var timeLeft = state.exam.timeLeft;
                    var mins = Math.floor(timeLeft / 60);
                    var secs = timeLeft % 60;
                    var timeStr = '⏱️ ' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
                    timerEl.textContent = timeStr;

                    if (timeLeft < 600) { // 小于10分钟变红并闪烁
                        timerEl.classList.add('urgent');
                    } else {
                        timerEl.classList.remove('urgent');
                    }
                }

                if (progressTextEl) {
                    var answeredCount = Object.keys(state.exam.userAnswers).length;
                    progressTextEl.textContent = '已答 ' + answeredCount + '/' + state.exam.questions.length;
                }
            },

            renderStats() {
                var state = State.getCurrent();
                var isExamActive = state.exam && state.exam.inExam;

                if (isExamActive) {
                    var answeredCount = Object.keys(state.exam.userAnswers).length;
                    var totalCount = state.exam.questions.length;
                    var pct = totalCount > 0 ? (answeredCount / totalCount * 100) : 0;
                    document.getElementById('progressBarFill').style.width = pct + '%';
                    return;
                }

                var stats = State.getCategoryStats();
                var wrongList = Storage.getWrongList();
                var wrongSet = new Set(wrongList);
                var categoryWrongFromBook = 0;
                for (var i = 0; i < state.order.length; i++) {
                    if (wrongSet.has(state.order[i])) {
                        categoryWrongFromBook++;
                    }
                }

                document.querySelector('#statTotal .stat-value').textContent = stats.answered + '/' + stats.total;
                document.querySelector('#statCorrect .stat-value').textContent = stats.correct;
                document.querySelector('#statWrong .stat-value').textContent = categoryWrongFromBook;

                var pct = stats.total > 0 ? (stats.answered / stats.total * 100) : 0;
                document.getElementById('progressBarFill').style.width = pct + '%';

                var countEl = document.getElementById('wrongBookCount');
                if (countEl) {
                    countEl.textContent = wrongList.length > 0 ? '(' + wrongList.length + ')' : '';
                }
            },

            renderQuestion(question, qIndex) {
                var state = State.getCurrent();
                var judgeButtons = document.getElementById('judgeButtons');
                var choiceOptions = document.getElementById('choiceOptions');
                var btnSubmit = document.getElementById('btnSubmit');

                // Build question number with type badge and favorite star
                var typeLabels = {judge: '判断题', single: '单选题', multi: '多选题'};
                var isFav = State.isFavorite(qIndex);
                var favBtn = '<button class="fav-btn' + (isFav ? ' active' : '') + '" id="btnFav" ' +
                    'data-question-index="' + qIndex + '" title="' + (isFav ? '取消收藏' : '收藏题目') + '">' +
                    (isFav ? '⭐' : '☆') + '</button>';
                var typeBadge = '<span class="question-type-badge type-' + question.type + '">' +
                    (typeLabels[question.type] || '') + '</span>';
                document.getElementById('questionNumber').innerHTML =
                    '第 ' + (state.currentIndex + 1) + ' 题' + typeBadge + favBtn;
                document.getElementById('questionText').textContent = question.question;

                // Show/hide based on question type
                if (question.type === 'judge') {
                    judgeButtons.style.display = 'flex';
                    choiceOptions.style.display = 'none';
                    btnSubmit.style.display = 'none';
                    this._renderJudgeButtons(question, qIndex);
                } else {
                    judgeButtons.style.display = 'none';
                    choiceOptions.style.display = 'flex';
                    this._renderChoiceOptions(question, qIndex);
                    
                    var isExamActive = state.exam && state.exam.inExam;
                    var isExamCompleted = state.exam && state.exam.isCompleted;

                    if (question.type === 'multi') {
                        if (isExamActive && !isExamCompleted) {
                            btnSubmit.style.display = 'block';
                            var selectedCount = choiceOptions.querySelectorAll('.choice-option.selected').length;
                            btnSubmit.disabled = selectedCount === 0;
                            btnSubmit.textContent = '确认选择';
                        } else {
                            if (!State.isAnswered(qIndex)) {
                                btnSubmit.style.display = 'block';
                                btnSubmit.disabled = true;
                                btnSubmit.textContent = '提交答案';
                            } else {
                                btnSubmit.style.display = 'none';
                            }
                        }
                    } else {
                        btnSubmit.style.display = 'none';
                    }
                }
            },

            _renderJudgeButtons(question, qIndex) {
                var btnTrue = document.getElementById('btnTrue');
                var btnFalse = document.getElementById('btnFalse');

                btnTrue.className = 'answer-btn btn-true';
                btnFalse.className = 'answer-btn btn-false';

                var state = State.getCurrent();
                var isExamActive = state.exam && state.exam.inExam;
                var isExamCompleted = state.exam && state.exam.isCompleted;

                if (isExamActive && !isExamCompleted) {
                    btnTrue.disabled = false;
                    btnFalse.disabled = false;

                    var userAnswer = State.getAnswer(qIndex);
                    if (userAnswer === '√') {
                        btnTrue.classList.add('selected');
                    } else if (userAnswer === '×') {
                        btnFalse.classList.add('selected');
                    }
                } else if (State.isAnswered(qIndex)) {
                    btnTrue.disabled = true;
                    btnFalse.disabled = true;

                    var userAnswer = State.getAnswer(qIndex);
                    if (userAnswer === question.answer) {
                        if (userAnswer === '√') {
                            btnTrue.classList.add('selected-correct');
                        } else {
                            btnFalse.classList.add('selected-correct');
                        }
                    } else {
                        if (userAnswer === '√') {
                            btnTrue.classList.add('selected-wrong');
                        } else {
                            btnFalse.classList.add('selected-wrong');
                        }
                        if (question.answer === '√') {
                            btnTrue.classList.add('correct-answer-highlight');
                        } else {
                            btnFalse.classList.add('correct-answer-highlight');
                        }
                    }
                } else {
                    btnTrue.disabled = false;
                    btnFalse.disabled = false;
                }
            },

            _renderChoiceOptions(question, qIndex) {
                var container = document.getElementById('choiceOptions');
                var state = State.getCurrent();
                var isExamActive = state.exam && state.exam.inExam;
                var isExamCompleted = state.exam && state.exam.isCompleted;

                var answered = State.isAnswered(qIndex);
                var userAnswer = answered ? State.getAnswer(qIndex) : null;
                var html = '';

                // 背题模式：只展示正确答案
                if (state.mode === 'memorize') {
                    for (var i = 0; i < question.options.length; i++) {
                        var opt = question.options[i];
                        var isAnswer = question.type === 'single'
                            ? (opt.label === question.answer)
                            : (question.answer.indexOf(opt.label) !== -1);
                        if (isAnswer) {
                            html += '<button class="choice-option correct-option" data-label="' + opt.label + '" disabled>' +
                                '<span class="option-label">' + opt.label + '</span>' +
                                '<span class="option-text">' + opt.text + '</span>' +
                                '</button>';
                        }
                    }
                    container.innerHTML = html;
                    return;
                }

                for (var i = 0; i < question.options.length; i++) {
                    var opt = question.options[i];
                    var isSelected = false;
                    var isCorrectOption = false;
                    var extraClass = '';

                    if (isExamActive && !isExamCompleted) {
                        if (question.type === 'single') {
                            isSelected = (opt.label === userAnswer);
                        } else {
                            isSelected = userAnswer && userAnswer.indexOf(opt.label) !== -1;
                        }
                        if (isSelected) {
                            extraClass = ' selected';
                        }
                    } else if (answered) {
                        if (question.type === 'single') {
                            isCorrectOption = (opt.label === question.answer);
                        } else {
                            isCorrectOption = question.answer.indexOf(opt.label) !== -1;
                        }

                        if (question.type === 'single') {
                            isSelected = (opt.label === userAnswer);
                        } else {
                            isSelected = userAnswer && userAnswer.indexOf(opt.label) !== -1;
                        }

                        if (isCorrectOption) {
                            extraClass = ' correct disabled';
                        } else if (isSelected && !isCorrectOption) {
                            extraClass = ' wrong disabled';
                        } else {
                            extraClass = ' disabled';
                        }
                    }

                    html += '<button class="choice-option' + extraClass + '" data-label="' + opt.label + '">' +
                        '<span class="option-label">' + opt.label + '</span>' +
                        '<span class="option-text">' + opt.text + '</span>' +
                        '</button>';
                }

                container.innerHTML = html;
            },

            renderFeedback(question, userAnswer, isCorrect) {
                var feedbackContainer = document.getElementById('feedbackContainer');
                var feedbackBox = document.getElementById('feedbackBox');
                var feedbackTitle = document.getElementById('feedbackTitle');
                var feedbackExplanation = document.getElementById('feedbackExplanation');

                feedbackContainer.classList.add('visible');
                feedbackBox.className = 'feedback-box';

                if (isCorrect) {
                    feedbackBox.classList.add('feedback-correct');
                    feedbackTitle.textContent = '✓ 回答正确';
                    feedbackExplanation.textContent = question.explanation;
                } else {
                    feedbackBox.classList.add('feedback-wrong');
                    feedbackTitle.textContent = '✗ 回答错误';
                    feedbackExplanation.innerHTML = question.explanation +
                        '<br><button class="btn-redo redo-btn">重做本题</button>';
                    feedbackExplanation.querySelector('.redo-btn').addEventListener('click', function() {
                        State.clearAnswer(State.getCurrentQuestionIndex());
                        State.persist();
                        UI.render();
                        UI.showToast('已清除答题记录，请重新作答', 'info');
                    });
                }
            },

            renderNavigation() {
                document.getElementById('btnPrev').disabled = !State.canGoPrev();
                document.getElementById('btnNext').disabled = !State.canGoNext();
            },

            showWrongBook() {
                var wrongIndices = Storage.getWrongList();
                var bodyHtml = '';

                if (wrongIndices.length === 0) {
                    bodyHtml += '<div class="wrong-book-empty">' +
                        '<div class="empty-icon">🎉</div>' +
                        '<div class="empty-text">暂无错题，继续保持！</div>' +
                        '</div>';
                } else {
                    for (var i = 0; i < wrongIndices.length; i++) {
                        var qIndex = wrongIndices[i];
                        var question = QUESTIONS[qIndex];
                        if (!question) continue;

                        var truncated = question.question.length > 40
                            ? question.question.substring(0, 40) + '...'
                            : question.question;

                        var answerDisplay = question.answer;
                        if (question.type === 'judge') {
                            answerDisplay = question.answer === '√' ? '√ 正确' : '× 错误';
                        } else if (question.options) {
                            var labels = question.answer.split('');
                            var answerTexts = [];
                            for (var j = 0; j < labels.length; j++) {
                                for (var k = 0; k < question.options.length; k++) {
                                    if (question.options[k].label === labels[j]) {
                                        answerTexts.push('<strong>' + labels[j] + '</strong>. ' + question.options[k].text);
                                        break;
                                    }
                                }
                            }
                            if (answerTexts.length > 0) {
                                answerDisplay = answerTexts.join('；');
                            }
                        }

                        var typeLabel = {judge: '判断', single: '单选', multi: '多选'}[question.type] || '';

                        bodyHtml += '<div class="wrong-book-item" data-question-index="' + qIndex + '">' +
                            '<div class="wb-question">[' + typeLabel + '] ' + truncated + '</div>' +
                            '<div class="wb-meta">' +
                            '<span>正确答案：<span class="wb-answer correct">' + answerDisplay + '</span></span>' +
                            '<button class="btn-redo btn-redo-sm" data-question-index="' + qIndex + '">重做</button>' +
                            '</div></div>';
                    }
                }

                Modal.open('错题本', bodyHtml);
            },

            showCompletion() {
                var stats = State.getCategoryStats();
                var accuracy = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
                var icon = accuracy >= 80 ? '🎉' : (accuracy >= 60 ? '👍' : '💪');

                var bodyHtml = '<div class="completion-summary">' +
                    '<div class="summary-icon">' + icon + '</div>' +
                    '<div class="summary-title">练习完成！</div>' +
                    '<div class="summary-subtitle">你已完成当前分类下所有 ' + stats.total + ' 道题目</div>' +
                    '<div class="summary-accuracy">' + accuracy + '%</div>' +
                    '<div class="summary-accuracy-label">正确率</div>' +
                    '<div class="summary-stats">' +
                    '<div class="summary-stat-item correct"><div class="summary-stat-value">' + stats.correct + '</div><div class="summary-stat-label">答对</div></div>' +
                    '<div class="summary-stat-item wrong"><div class="summary-stat-value">' + stats.wrong + '</div><div class="summary-stat-label">答错</div></div>' +
                    '<div class="summary-stat-item total"><div class="summary-stat-value">' + stats.total + '</div><div class="summary-stat-label">已答</div></div>' +
                    '</div>' +
                    '<div class="completion-btn-group">' +
                    '<button class="completion-btn btn-retry" id="btnRetry">重新开始</button>' +
                    '<button class="completion-btn btn-wrong-book" id="btnCompletionWrongBook">查看错题本</button>' +
                    '</div></div>';

                Modal.open('练习完成', bodyHtml);

                document.getElementById('btnRetry').addEventListener('click', function() {
                    Modal.close();
                    State.reset();
                    UI.render();
                    UI.showToast('已重新开始', 'success');
                });
                document.getElementById('btnCompletionWrongBook').addEventListener('click', function() {
                    Modal.close();
                    UI.showWrongBook();
                });
            },

            showToast(message, type) {
                var container = document.getElementById('toastContainer');
                var toast = document.createElement('div');
                toast.className = 'toast';

                if (type === 'success') {
                    toast.style.background = 'rgba(82, 196, 26, 0.9)';
                } else if (type === 'error') {
                    toast.style.background = 'rgba(255, 77, 79, 0.9)';
                } else if (type === 'info') {
                    toast.style.background = 'rgba(74, 144, 217, 0.9)';
                }

                toast.textContent = message;
                container.appendChild(toast);

                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 3000);
            },

            showQuestionList() {
                var state = State.getCurrent();
                var currentCategory = State.getCategory();
                var currentQIndex = State.getCurrentQuestionIndex();
                var categoryLabels = {all: '全部', judge: '判断题', single: '单选题', multi: '多选题'};

                var isExamActive = state.exam && state.exam.inExam;
                var isExamCompleted = state.exam && state.exam.isCompleted;

                var bodyHtml = '<div class="question-list-tabs">';
                var categories = ['all', 'judge', 'single', 'multi'];
                for (var i = 0; i < categories.length; i++) {
                    var cat = categories[i];
                    var activeClass = cat === currentCategory ? ' active' : '';
                    bodyHtml += '<button class="question-list-tab' + activeClass + '" data-category="' + cat + '">' +
                        categoryLabels[cat] + '</button>';
                }
                bodyHtml += '</div>';
                bodyHtml += '<div class="question-list-header">' +
                    '<span class="question-list-count">共 ' + state.order.length + ' 题</span></div>';
                bodyHtml += '<div class="question-grid" id="questionGrid">';

                for (var i = 0; i < state.order.length; i++) {
                    var qIndex = state.order[i];
                    var question = QUESTIONS[qIndex];
                    if (!question) continue;

                    var itemClass = 'question-grid-item';
                    var statusIcon = '';
                    if (qIndex === currentQIndex) itemClass += ' current';

                    if (isExamActive && !isExamCompleted) {
                        if (State.isAnswered(qIndex)) {
                            itemClass += ' answered-dot';
                        }
                    } else {
                        var userAns = State.getAnswer(qIndex);
                        if (userAns !== undefined) {
                            if (userAns === question.answer) {
                                itemClass += ' correct';
                                statusIcon = '<span class="item-status">✓</span>';
                            } else {
                                itemClass += ' wrong';
                                statusIcon = '<span class="item-status">✗</span>';
                            }
                        }
                    }
                    bodyHtml += '<div class="' + itemClass + '" data-question-index="' + qIndex +
                        '" data-order-pos="' + i + '">' + (i + 1) + statusIcon + '</div>';
                }
                bodyHtml += '</div>';

                var refs = Modal.open('题目目录', bodyHtml);

                var tabs = refs.content.querySelectorAll('.question-list-tab');
                for (var i = 0; i < tabs.length; i++) {
                    tabs[i].addEventListener('click', function() {
                        State.setCategory(this.getAttribute('data-category'));
                        UI.render();
                        UI.showQuestionList();
                    });
                }

                var gridItems = refs.content.querySelectorAll('.question-grid-item');
                for (var i = 0; i < gridItems.length; i++) {
                    gridItems[i].addEventListener('click', function() {
                        var position = parseInt(this.getAttribute('data-order-pos'), 10);
                        var s = State.getCurrent();
                        s.currentIndex = position;
                        State.persist();
                        Modal.close();
                        UI.render();
                    });
                }
            },

            // ==================================================================
            // PRACTICAL EXAM INTERACTION LOGIC
            // ==================================================================
            activePracticeId: null,
            activeWorkspaceTab: {}, // { "1.1.1": "code", ... }
            activePractice12xId: null,
            activeWorkspaceTab12x: {}, // { "1.2.1": "doc", ... }

            escapeHtml(text) {
                if (!text) return '';
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            },

            renderMarkdown(md, isDoc) {
                if (!md) return '';
                var lines = md.split('\n');
                var html = '';
                var inList = false;
                var inCodeBlock = false;
                var codeBlockLines = [];

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];

                    // Code blocks
                    if (line.trim().startsWith('```')) {
                        if (inCodeBlock) {
                            inCodeBlock = false;
                            html += '<pre class="language-python practice-code-block"><code class="language-python">' + this.escapeHtml(codeBlockLines.join('\n')) + '</code></pre>';
                            codeBlockLines = [];
                        } else {
                            inCodeBlock = true;
                        }
                        continue;
                    }
                    if (inCodeBlock) {
                        codeBlockLines.push(line);
                        continue;
                    }

                    // GitHub Alerts
                    if (line.trim().startsWith('> [!')) {
                        var type = 'note';
                        var title = 'NOTE';
                        if (line.includes('IMPORTANT')) { type = 'important'; title = '重要提示'; }
                        else if (line.includes('WARNING')) { type = 'warning'; title = '警告'; }
                        else if (line.includes('CAUTION')) { type = 'caution'; title = '注意'; }
                        else if (line.includes('TIP')) { type = 'tip'; title = '小提示'; }

                        html += '<div class="github-alert alert-' + type + '"><div class="alert-title">' + title + '</div>';
                        continue;
                    }
                    if (line.trim().startsWith('>') && html.lastIndexOf('github-alert') > html.lastIndexOf('github-alert-closed')) {
                        var content = line.trim().substring(1).trim();
                        html += '<p' + (isDoc ? ' class="doc-p"' : '') + '>' + this.renderMarkdownInline(content) + '</p>';
                        if (i === lines.length - 1 || !lines[i+1].trim().startsWith('>')) {
                            html += '<div class="github-alert-closed" style="display:none;"></div></div>';
                        }
                        continue;
                    }

                    // Headings
                    if (line.startsWith('#### ')) {
                        var hClass = isDoc ? ' class="doc-h2"' : '';
                        html += '<h4' + hClass + '>' + this.renderMarkdownInline(line.substring(5)) + '</h4>';
                    } else if (line.startsWith('### ')) {
                        var hClass = isDoc ? ' class="doc-h2"' : '';
                        html += '<h3' + hClass + '>' + this.renderMarkdownInline(line.substring(4)) + '</h3>';
                    } else if (line.startsWith('## ')) {
                        var hClass = isDoc ? ' class="doc-h2"' : '';
                        html += '<h2' + hClass + '>' + this.renderMarkdownInline(line.substring(3)) + '</h2>';
                    } else if (line.startsWith('# ')) {
                        var hClass = isDoc ? ' class="doc-h1"' : '';
                        html += '<h1' + hClass + '>' + this.renderMarkdownInline(line.substring(2)) + '</h1>';
                    }
                    // Unordered List
                    else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                        if (!inList) {
                            var uClass = isDoc ? ' class="doc-list"' : '';
                            html += '<ul' + uClass + '>';
                            inList = true;
                        }
                        var content = line.trim().substring(2);
                        html += '<li>' + this.renderMarkdownInline(content) + '</li>';
                        if (i === lines.length - 1 || (!lines[i+1].trim().startsWith('* ') && !lines[i+1].trim().startsWith('- '))) {
                            html += '</ul>';
                            inList = false;
                        }
                    } 
                    // Ordered List
                    else if (/^\d+\.\s/.test(line.trim())) {
                        if (!inList) {
                            var oClass = isDoc ? ' class="doc-list"' : '';
                            html += '<ol' + oClass + '>';
                            inList = true;
                        }
                        var match = line.trim().match(/^\d+\.\s(.*)/);
                        html += '<li>' + this.renderMarkdownInline(match[1]) + '</li>';
                        if (i === lines.length - 1 || !/^\d+\.\s/.test(lines[i+1].trim())) {
                            html += '</ol>';
                            inList = false;
                        }
                    }
                    // Regular paragraph
                    else {
                        if (line.trim() === '') {
                            html += '<br/>';
                        } else {
                            var pClass = isDoc ? ' class="doc-p"' : '';
                            html += '<p' + pClass + '>' + this.renderMarkdownInline(line) + '</p>';
                        }
                    }
                }
                return html;
            },

            renderMarkdownInline(text) {
                return this.escapeHtml(text)
                    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                    .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*([^\*]+)\*/g, '<em>$1</em>');
            },

            renderPractices() {
                var container = document.getElementById('practiceContainer');
                if (!container) return;

                if (!this.activePracticeId) {
                    var catTabs = document.getElementById('categoryTabs');
                    if (catTabs) catTabs.style.display = '';
                    var html = '<div class="practice-dashboard-header">';
                    html += '<h1 class="practice-main-title">🛠️ 人工智能训练师操作技能实操</h1>';
                    html += '<p class="practice-main-subtitle">集成 6 道核心高保真技能真题，大视区双栏练习，配备一键下载素材、暗黑参考代码、高保真标准范文与交互式评分自评</p>';
                    html += '</div>';

                    html += '<div class="practice-grid">';
                    var keys = Object.keys(PRACTICES);
                    var state = State.getCurrent();

                    for (var i = 0; i < keys.length; i++) {
                        var item = PRACTICES[keys[i]];
                        var record = state.practices[item.id] || { score: 0, checked: [], completed: false };
                        var percent = record.completed ? Math.round((record.score / item.score) * 100) : 0;

                        var cardClass = 'practice-card';
                        if (record.completed) cardClass += ' completed';

                        html += '<div class="' + cardClass + '" onclick="UI.enterPracticeWorkspace(\'' + item.id + '\')">';
                        html += '<div class="practice-card-glow"></div>';
                        html += '<div class="practice-card-header">';
                        html += '<span class="practice-code-badge">' + item.id + '</span>';
                        html += '<span class="practice-status-badge ' + (record.completed ? 'passed' : 'pending') + '">';
                        html += record.completed ? '✓ 已自测' : '待自评';
                        html += '</span>';
                        html += '</div>';

                        html += '<h3 class="practice-card-title">' + item.name + '</h3>';
                        
                        html += '<div class="practice-card-meta">';
                        html += '<div class="practice-meta-item">⏱️ ' + item.time + '</div>';
                        html += '<div class="practice-meta-item">🎯 配分 ' + item.score + '分</div>';
                        html += '</div>';

                        html += '<div class="practice-tags">';
                        for (var j = 0; j < item.tags.length; j++) {
                            html += '<span class="practice-tag">' + item.tags[j] + '</span>';
                        }
                        html += '</div>';

                        // 进度条
                        html += '<div class="practice-score-progress">';
                        html += '<div class="practice-score-label">';
                        html += '<span>自评进度</span>';
                        html += '<span>' + (record.completed ? record.score + ' / ' + item.score + ' 分' : '待自评') + '</span>';
                        html += '</div>';
                        html += '<div class="practice-progress-bg">';
                        html += '<div class="practice-progress-fill" style="width: ' + percent + '%"></div>';
                        html += '</div>';
                        html += '</div>';

                        html += '<button class="practice-start-btn">开始实操练习</button>';
                        html += '</div>';
                    }
                    html += '</div>';

                    container.innerHTML = html;
                } else {
                    var catTabs = document.getElementById('categoryTabs');
                    if (catTabs) catTabs.style.display = 'none';
                    var item = PRACTICES[this.activePracticeId];
                    var state = State.getCurrent();
                    var record = state.practices[item.id] || { score: 0, checked: [], completed: false };
                    var currentTab = this.activeWorkspaceTab[item.id] || 'code';

                    var html = '<div class="workspace-header">';
                    html += '<button class="back-btn" onclick="UI.exitPracticeWorkspace()">← 返回题目列表</button>';
                    html += '<div class="workspace-title-area">';
                    html += '<h1 class="workspace-title">[' + item.id + '] ' + item.name + '</h1>';
                    html += '<div class="practice-workspace-subtitle">⏱️ 推荐时间: ' + item.time + ' | 总配分: ' + item.score + '分</div>';
                    html += '</div>';
                    html += '</div>';

                    html += '<div class="practice-workspace">';
                    
                    // Left panel
                    html += '<div class="workspace-left">';
                    html += '<div class="panel-section">';
                    html += '<h2 class="task-title">📋 任务指导书</h2>';
                    html += '<div class="markdown-content">' + this.renderMarkdown(item.background) + '</div>';
                    html += '</div>';

                    html += '<div class="download-panel">';
                    html += '<h3 class="download-panel-title">📦 本地练习素材下载</h3>';
                    html += '<p class="task-text">请点击下载下方素材并在本地 Jupyter Notebook/Python 环境中补全代码及撰写答卷：</p>';
                    html += '<div class="download-buttons">';
                    for (var j = 0; j < item.downloads.length; j++) {
                        var dl = item.downloads[j];
                        var fileIcon = dl.type === 'csv' ? '📊' : '📓';
                        html += '<a href="' + dl.url + '" download class="download-link-btn" title="点击下载 ' + dl.name + '">';
                        html += '<span>' + fileIcon + ' ' + dl.name + '</span>';
                        html += '</a>';
                    }
                    html += '</div>';
                    if (item.extraResources && item.extraResources.length) {
                        html += '<p class="task-text extra-resources-tip">📌 以下资源由考试方现场提供 / 需考生自备，本系统不内置：</p>';
                        html += '<ul class="extra-resources-list">';
                        for (var k = 0; k < item.extraResources.length; k++) {
                            var ex = item.extraResources[k];
                            html += '<li><strong>' + this.escapeHtml(ex.name) + '</strong> — ' + this.escapeHtml(ex.note) + '</li>';
                        }
                        html += '</ul>';
                    }
                    html += '</div>';
                    html += '</div>';

                    // Right panel
                    html += '<div class="workspace-right">';
                    html += '<div class="workspace-tabs">';
                    var tabsInfo = [
                        { key: 'code', label: '💻 参考代码' },
                        { key: 'doc', label: '📄 规范范文' },
                        { key: 'checklist', label: '🎯 评分自测' }
                    ];
                    for (var t = 0; t < tabsInfo.length; t++) {
                        var tInfo = tabsInfo[t];
                        var activeClass = tInfo.key === currentTab ? 'active' : '';
                        html += '<button class="workspace-tab-btn ' + activeClass + '" onclick="UI.renderWorkspaceTab(\'' + item.id + '\', \'' + tInfo.key + '\')">' + tInfo.label + '</button>';
                    }
                    html += '</div>';

                    html += '<div class="workspace-content-pane active">';
                    
                    if (currentTab === 'code') {
                        html += '<div class="code-wrapper">';
                        html += '<button class="code-copy-btn copy-code-btn" onclick="UI.copyReferenceCode(\'' + item.id + '\')">📋 复制全部代码</button>';
                        html += '<pre class="language-python code-block"><code class="language-python" id="refCodeArea">' + this.escapeHtml(item.code) + '</code></pre>';
                        html += '</div>';
                    }
                    else if (currentTab === 'doc') {
                        html += '<div class="doc-viewer markdown-content">';
                        html += this.renderMarkdown(item.doc, true);
                        html += '</div>';
                    }
                    else if (currentTab === 'checklist') {
                        html += '<div class="checklist-tab-container">';
                        html += '<div class="score-control-panel">';
                        html += '<div class="score-display-row">';
                        html += '<span class="score-display-label">🏆 当前自评得分 / 总配分</span>';
                        html += '<div>';
                        html += '<span class="score-display-num" id="realtimeScore">0</span>';
                        html += '<span style="font-size: 1.2rem; color: #a0aec0;"> / ' + item.score + ' 分</span>';
                        html += '</div>';
                        html += '</div>';
                        html += '<div class="checklist-progress-bg">';
                        html += '<div class="checklist-progress-fill" id="scoreProgressBar" style="width: 0%"></div>';
                        html += '</div>';
                        html += '</div>';

                        html += '<p class="task-text" style="margin-bottom: 16px;">请对照你在本地运行的真实代码与产出的文档，在下方进行逐项自评得分：</p>';
                        html += '<div class="checklist-container">';
                        for (var c = 0; c < item.checklist.length; c++) {
                            var chk = item.checklist[c];
                            var isChecked = record.checked && record.checked.indexOf(c) !== -1;
                            
                            html += '<div class="checklist-item ' + (isChecked ? 'checked' : '') + '" onclick="UI.toggleChecklistItem(\'' + item.id + '\', ' + c + ')">';
                            html += '<div class="checklist-checkbox-wrapper">';
                            html += '<div class="checklist-checkbox"></div>';
                            html += '</div>';
                            html += '<span class="checklist-item-text">' + this.escapeHtml(chk.text) + '</span>';
                            html += '<span class="checklist-item-score">+' + chk.score + '分</span>';
                            html += '</div>';
                        }
                        html += '</div>';

                        html += '<div class="workspace-actions" style="margin-top: 24px;">';
                        html += '<button class="workspace-action-btn btn-back" onclick="UI.exitPracticeWorkspace()">← 返回</button>';
                        html += '<button class="workspace-action-btn btn-submit-score submit-score-btn" onclick="UI.submitPracticeScore(\'' + item.id + '\')">🎯 提交自评成绩</button>';
                        html += '</div>';
                        html += '</div>';
                    }

                    html += '</div>';
                    html += '</div>';

                    html += '</div>';

                    container.innerHTML = html;

                    if (typeof Prism !== 'undefined') {
                        Prism.highlightAll();
                    }

                    if (currentTab === 'checklist') {
                        this.updateRealtimeScoreDisplay(item.id);
                    }
                }
            },

            enterPracticeWorkspace(id) {
                this.activePracticeId = id;
                this.activeWorkspaceTab[id] = 'code';
                // 动态给body增加类名，支持大视区顶栏过渡和物理锁死大厅页签
                document.body.classList.add('workspace-active');
                this.renderPractices();
            },

            exitPracticeWorkspace() {
                this.activePracticeId = null;
                document.body.classList.remove('workspace-active');
                this.renderPractices();
            },

            renderWorkspaceTab(id, tabName) {
                this.activeWorkspaceTab[id] = tabName;
                this.renderPractices();
            },

            copyReferenceCode(id) {
                var item = PRACTICES[id];
                if (!item) return;

                navigator.clipboard.writeText(item.code).then(function() {
                    var btn = document.querySelector('.copy-code-btn');
                    if (btn) {
                        var originalText = btn.innerHTML;
                        btn.innerHTML = '✓ 已复制到剪贴板！';
                        btn.style.background = '#10b981';
                        setTimeout(function() {
                            btn.innerHTML = originalText;
                            btn.style.background = '';
                        }, 2000);
                    }
                }).catch(function(err) {
                    alert('复制失败，请手动选择复制：' + err);
                });
            },

            toggleChecklistItem(id, idx) {
                var state = State.getCurrent();
                if (!state.practices[id]) {
                    state.practices[id] = { score: 0, checked: [], completed: false };
                }
                var record = state.practices[id];
                var cIdx = record.checked.indexOf(idx);
                var isCheckedNow = false;
                if (cIdx === -1) {
                    record.checked.push(idx);
                    isCheckedNow = true;
                } else {
                    record.checked.splice(cIdx, 1);
                }

                // 局部 DOM 更新，保持节点稳定，不导致 Playwright element not attached 错误
                var items = document.querySelectorAll('.checklist-container .checklist-item');
                if (items && items[idx]) {
                    var itemNode = items[idx];
                    if (isCheckedNow) {
                        itemNode.classList.add('checked');
                    } else {
                        itemNode.classList.remove('checked');
                    }
                }

                this.updateRealtimeScoreDisplay(id);
            },

            updateRealtimeScoreDisplay(id) {
                var item = PRACTICES[id];
                if (!item) return;
                var state = State.getCurrent();
                var record = state.practices[id] || { score: 0, checked: [], completed: false };
                var totalScore = 0;
                if (record.checked) {
                    for (var i = 0; i < record.checked.length; i++) {
                        var chkIdx = record.checked[i];
                        if (item.checklist[chkIdx]) {
                            totalScore += item.checklist[chkIdx].score;
                        }
                    }
                }

                var scoreNum = document.getElementById('realtimeScore');
                var scoreBar = document.getElementById('scoreProgressBar');
                if (scoreNum && scoreBar) {
                    scoreNum.textContent = totalScore;
                    var percent = Math.min(100, Math.round((totalScore / item.score) * 100));
                    scoreBar.style.width = percent + '%';
                }
            },

            submitPracticeScore(id) {
                var item = PRACTICES[id];
                if (!item) return;
                var state = State.getCurrent();
                var record = state.practices[id] || { score: 0, checked: [], completed: false };
                var totalScore = 0;
                if (record.checked) {
                    for (var i = 0; i < record.checked.length; i++) {
                        var chkIdx = record.checked[i];
                        if (item.checklist[chkIdx]) {
                            totalScore += item.checklist[chkIdx].score;
                        }
                    }
                }

                record.score = totalScore;
                record.completed = true;

                State.persist();

                if (window.Sync && typeof Sync.uploadState === 'function') {
                    Sync.uploadState();
                }

                var modalHtml = '<div class="practice-submit-success-modal">';
                modalHtml += '<div class="success-icon">🎉</div>';
                modalHtml += '<h2 class="success-modal-title">自评提交成功！</h2>';
                modalHtml += '<p class="success-modal-desc">您的实操自测成绩已成功存入本地持久化记录。</p>';
                modalHtml += '<div class="success-score-box">';
                modalHtml += '<span class="label">本次自评得分</span>';
                modalHtml += '<span class="score">' + totalScore + ' <span class="total">/ ' + item.score + '</span></span>';
                modalHtml += '</div>';
                modalHtml += '<button class="success-modal-close-btn" onclick="Modal.close(); UI.exitPracticeWorkspace();">确定</button>';
                modalHtml += '</div>';

                Modal.open('实操自测归档', modalHtml);
            },

            // ==================================================================
            // PRACTICAL 1.2.X EXAM INTERACTION LOGIC
            // ==================================================================
            renderPractice12x() {
                var container = document.getElementById('practice12xContainer');
                if (!container) return;

                if (!this.activePractice12xId) {
                    var catTabs = document.getElementById('categoryTabs');
                    if (catTabs) catTabs.style.display = '';
                    var html = '<div class="practice-dashboard-header">';
                    html += '<h1 class="practice-main-title">📝 人工智能训练师方案设计与业务优化实操 (1.2.x)</h1>';
                    html += '<p class="practice-main-subtitle">深度集成四大解题模板，多维核心业务场景高保真满分示范，配备交互式评分自评与多端云同步</p>';
                    html += '</div>';

                    html += '<div class="practice-grid">';
                    var keys = Object.keys(PRACTICES_12X);
                    var state = State.getCurrent();

                    for (var i = 0; i < keys.length; i++) {
                        var item = PRACTICES_12X[keys[i]];
                        var record = state.practices[item.id] || { score: 0, checked: [], completed: false };
                        var percent = record.completed ? Math.round((record.score / item.score) * 100) : 0;

                        var cardClass = 'practice-card';
                        if (record.completed) cardClass += ' completed';

                        html += '<div class="' + cardClass + '" onclick="UI.enterPractice12xWorkspace(\'' + item.id + '\')">';
                        html += '<div class="practice-card-glow"></div>';
                        html += '<div class="practice-card-header">';
                        html += '<span class="practice-code-badge">' + item.id + '</span>';
                        html += '<span class="practice-status-badge ' + (record.completed ? 'passed' : 'pending') + '">';
                        html += record.completed ? '✓ 已自测' : '待自评';
                        html += '</span>';
                        html += '</div>';

                        html += '<h3 class="practice-card-title">' + item.name + '</h3>';
                        
                        html += '<div class="practice-card-meta">';
                        html += '<div class="practice-meta-item">⏱️ ' + item.time + '</div>';
                        html += '<div class="practice-meta-item">🎯 配分 ' + item.score + '分</div>';
                        html += '</div>';

                        html += '<div class="practice-tags">';
                        for (var j = 0; j < item.tags.length; j++) {
                            html += '<span class="practice-tag">' + item.tags[j] + '</span>';
                        }
                        html += '</div>';

                        // 进度条
                        html += '<div class="practice-score-progress">';
                        html += '<div class="practice-score-label">';
                        html += '<span>自评进度</span>';
                        html += '<span>' + (record.completed ? record.score + ' / ' + item.score + ' 分' : '待自评') + '</span>';
                        html += '</div>';
                        html += '<div class="practice-progress-bg">';
                        html += '<div class="practice-progress-fill" style="width: ' + percent + '%"></div>';
                        html += '</div>';
                        html += '</div>';

                        html += '<button class="practice-start-btn">查看标准范文并自测</button>';
                        html += '</div>';
                    }
                    html += '</div>';

                    container.innerHTML = html;
                } else {
                    var catTabs = document.getElementById('categoryTabs');
                    if (catTabs) catTabs.style.display = 'none';
                    var item = PRACTICES_12X[this.activePractice12xId];
                    var state = State.getCurrent();
                    var record = state.practices[item.id] || { score: 0, checked: [], completed: false };
                    var currentTab = this.activeWorkspaceTab12x[item.id] || 'doc';

                    var html = '<div class="workspace-header">';
                    html += '<button class="back-btn" onclick="UI.exitPractice12xWorkspace()">← 返回题目列表</button>';
                    html += '<div class="workspace-title-area">';
                    html += '<h1 class="workspace-title">[' + item.id + '] ' + item.name + '</h1>';
                    html += '<div class="practice-workspace-subtitle">⏱️ 推荐时间: ' + item.time + ' | 总配分: ' + item.score + '分</div>';
                    html += '</div>';
                    html += '</div>';

                    html += '<div class="practice-workspace">';
                    
                    // Left panel
                    html += '<div class="workspace-left">';
                    html += '<div class="panel-section">';
                    html += '<h2 class="task-title">📋 任务说明书</h2>';
                    html += '<div class="markdown-content">' + this.renderMarkdown(item.background) + '</div>';
                    html += '</div>';

                    html += '<div class="download-panel practice-12x-answer-sheet-panel">';
                    html += '<h3 class="download-panel-title">📝 答题要求说明</h3>';
                    html += '<p class="task-text">本题为<strong>"方案优化设计与业务分析"</strong>实操大题，考生需将答案撰写在答题卷文件中：</p>';
                    html += '<div class="practice-12x-doc-badge">';
                    html += '📁 答题卷文件名：<span class="file-name">' + item.id + '.docx</span>';
                    html += '</div>';
                    html += '<p class="task-text extra-resources-tip">📌 答题卡上对应题号：</p>';
                    html += '<ul class="extra-resources-list">';
                    html += '<li>第（1）题解答填在 <strong>"' + item.id + '-1"</strong> 区域</li>';
                    html += '<li>第（2）题解答填在 <strong>"' + item.id + '-2"</strong> 区域</li>';
                    html += '</ul>';
                    html += '</div>';
                    html += '</div>';

                    // Right panel
                    html += '<div class="workspace-right">';
                    html += '<div class="workspace-tabs">';
                    var tabsInfo = [
                        { key: 'doc', label: '📄 满分标准范文' },
                        { key: 'checklist', label: '🎯 评分自测' }
                    ];
                    for (var t = 0; t < tabsInfo.length; t++) {
                        var tInfo = tabsInfo[t];
                        var activeClass = tInfo.key === currentTab ? 'active' : '';
                        html += '<button class="workspace-tab-btn ' + activeClass + '" onclick="UI.renderWorkspace12xTab(\'' + item.id + '\', \'' + tInfo.key + '\')">' + tInfo.label + '</button>';
                    }
                    html += '</div>';

                    html += '<div class="workspace-content-pane active">';
                    
                    if (currentTab === 'doc') {
                        html += '<div class="doc-viewer markdown-content practice-12x-doc-viewer">';
                        html += '<div class="template-notice-bar">';
                        html += '💡 本参考范文已严格套用 <strong>' + this.escapeHtml(item.templateUsed1) + '</strong> 与 <strong>' + this.escapeHtml(item.templateUsed2) + '</strong> 满分模板格式。';
                        html += '</div>';
                        
                        html += '<div class="practice-12x-answer-section">';
                        html += '<div class="practice-12x-answer-header">';
                        html += '<span>（1）问题分析解答参考</span>';
                        html += '<span class="used-template-badge">' + this.escapeHtml(item.templateUsed1) + '</span>';
                        html += '</div>';
                        html += '<div class="practice-12x-answer-body">' + this.renderMarkdown(item.answer1, true) + '</div>';
                        html += '</div>';

                        html += '<div class="practice-12x-answer-section">';
                        html += '<div class="practice-12x-answer-header">';
                        html += '<span>（2）优化设计方案参考</span>';
                        html += '<span class="used-template-badge">' + this.escapeHtml(item.templateUsed2) + '</span>';
                        html += '</div>';
                        html += '<div class="practice-12x-answer-body">' + this.renderMarkdown(item.answer2, true) + '</div>';
                        html += '</div>';
                        
                        html += '</div>';
                    }
                    else if (currentTab === 'checklist') {
                        html += '<div class="checklist-tab-container">';
                        html += '<div class="score-control-panel">';
                        html += '<div class="score-display-row">';
                        html += '<span class="score-display-label">🏆 当前自评得分 / 总配分</span>';
                        html += '<div>';
                        html += '<span class="score-display-num" id="realtimeScore12x">0</span>';
                        html += '<span style="font-size: 1.2rem; color: #a0aec0;"> / ' + item.score + ' 分</span>';
                        html += '</div>';
                        html += '</div>';
                        html += '<div class="checklist-progress-bg">';
                        html += '<div class="checklist-progress-fill" id="scoreProgressBar12x" style="width: 0%"></div>';
                        html += '</div>';
                        html += '</div>';

                        html += '<p class="task-text" style="margin-bottom: 16px;">请对照你在本地答题卡中撰写的实际方案与文字，在下方进行逐项自评得分：</p>';
                        html += '<div class="checklist-container">';
                        for (var c = 0; c < item.checklist.length; c++) {
                            var chk = item.checklist[c];
                            var isChecked = record.checked && record.checked.indexOf(c) !== -1;
                            
                            html += '<div class="checklist-item ' + (isChecked ? 'checked' : '') + '" onclick="UI.toggleChecklistItem12x(\'' + item.id + '\', ' + c + ')">';
                            html += '<div class="checklist-checkbox-wrapper">';
                            html += '<div class="checklist-checkbox"></div>';
                            html += '</div>';
                            html += '<span class="checklist-item-text">' + this.escapeHtml(chk.text) + '</span>';
                            html += '<span class="checklist-item-score">+' + chk.score + '分</span>';
                            html += '</div>';
                        }
                        html += '</div>';

                        html += '<div class="workspace-actions" style="margin-top: 24px;">';
                        html += '<button class="workspace-action-btn btn-back" onclick="UI.exitPractice12xWorkspace()">← 返回列表</button>';
                        html += '<button class="workspace-action-btn btn-submit" onclick="UI.submitPractice12xScore(\'' + item.id + '\')">🎉 交卷并归档成绩</button>';
                        html += '</div>';
                        html += '</div>';
                    }

                    html += '</div>';
                    html += '</div>';
                    html += '</div>';

                    container.innerHTML = html;
                    
                    if (currentTab === 'checklist') {
                        this.updateRealtimeScoreDisplay12x(item.id);
                    }
                }
            },

            enterPractice12xWorkspace(id) {
                this.activePractice12xId = id;
                this.activeWorkspaceTab12x[id] = 'doc';
                document.body.classList.add('workspace-active');
                this.renderPractice12x();
            },

            exitPractice12xWorkspace() {
                this.activePractice12xId = null;
                document.body.classList.remove('workspace-active');
                this.renderPractice12x();
            },

            renderWorkspace12xTab(id, tabName) {
                this.activeWorkspaceTab12x[id] = tabName;
                this.renderPractice12x();
            },

            toggleChecklistItem12x(id, idx) {
                var state = State.getCurrent();
                if (!state.practices[id]) {
                    state.practices[id] = { score: 0, checked: [], completed: false };
                }
                var record = state.practices[id];
                var cIdx = record.checked.indexOf(idx);
                var isCheckedNow = false;
                if (cIdx === -1) {
                    record.checked.push(idx);
                    isCheckedNow = true;
                } else {
                    record.checked.splice(cIdx, 1);
                }

                var items = document.querySelectorAll('.checklist-container .checklist-item');
                if (items && items[idx]) {
                    var itemNode = items[idx];
                    if (isCheckedNow) {
                        itemNode.classList.add('checked');
                    } else {
                        itemNode.classList.remove('checked');
                    }
                }

                this.updateRealtimeScoreDisplay12x(id);
            },

            updateRealtimeScoreDisplay12x(id) {
                var item = PRACTICES_12X[id];
                if (!item) return;
                var state = State.getCurrent();
                var record = state.practices[id] || { score: 0, checked: [], completed: false };
                var totalScore = 0;
                if (record.checked) {
                    for (var i = 0; i < record.checked.length; i++) {
                        var chkIdx = record.checked[i];
                        if (item.checklist[chkIdx]) {
                            totalScore += item.checklist[chkIdx].score;
                        }
                    }
                }

                var scoreNum = document.getElementById('realtimeScore12x');
                var scoreBar = document.getElementById('scoreProgressBar12x');
                if (scoreNum && scoreBar) {
                    scoreNum.textContent = totalScore;
                    var percent = Math.min(100, Math.round((totalScore / item.score) * 100));
                    scoreBar.style.width = percent + '%';
                }
            },

            submitPractice12xScore(id) {
                var item = PRACTICES_12X[id];
                if (!item) return;
                var state = State.getCurrent();
                var record = state.practices[id] || { score: 0, checked: [], completed: false };
                var totalScore = 0;
                if (record.checked) {
                    for (var i = 0; i < record.checked.length; i++) {
                        var chkIdx = record.checked[i];
                        if (item.checklist[chkIdx]) {
                            totalScore += item.checklist[chkIdx].score;
                        }
                    }
                }

                record.score = totalScore;
                record.completed = true;

                State.persist();

                if (window.Sync && typeof Sync.uploadState === 'function') {
                    Sync.uploadState();
                }

                var modalHtml = '<div class="practice-submit-success-modal">';
                modalHtml += '<div class="success-icon">🏆</div>';
                modalHtml += '<h2 class="success-modal-title">设计自评提交成功！</h2>';
                modalHtml += '<p class="success-modal-desc">您的 1.2.x 方案设计自测成绩已成功存入本地持久化记录，并触发多端云同步。</p>';
                modalHtml += '<div class="success-score-box">';
                modalHtml += '<span class="label">本次自评得分</span>';
                modalHtml += '<span class="score">' + totalScore + ' <span class="total">/ ' + item.score + '</span></span>';
                modalHtml += '</div>';
                modalHtml += '<button class="success-modal-close-btn" onclick="Modal.close(); UI.exitPractice12xWorkspace();">确定</button>';
                modalHtml += '</div>';

                Modal.open('方案自测归档', modalHtml);
            }
        };
    })();

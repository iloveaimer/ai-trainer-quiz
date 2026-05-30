    /* ------- State Module (Task 2) ------- */
    var State = (function() {
        let current = null;
        let category = 'all';

        function createDefault() {
            return {
                mode: 'sequential',
                currentIndex: 0,
                order: Array.from({length: QUESTIONS.length}, (_, i) => i),
                answered: {},
                score: 0,
                totalAnswered: 0,
                startTime: new Date().toISOString(),
                completed: false,
                categoryIndex: {},
                practices: {},
                exam: {
                    inExam: false,
                    questions: [],
                    userAnswers: {},
                    startTime: null,
                    duration: 5400,
                    timeLeft: 5400,
                    isCompleted: false,
                    score: 0,
                    submitTime: null,
                    isReviewMode: false
                }
            };
        }

        function shuffleOrder(order) {
            const arr = [...order];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function getQuestionsByCategory(cat) {
            if (cat === 'all') return QUESTIONS;
            return QUESTIONS.filter(function(q) { return q.type === cat; });
        }

        function getFilteredIndices(cat) {
            if (cat === 'wrong') {
                return Storage.getWrongList().slice();
            }
            if (cat === 'favorite') {
                return Storage.getFavoriteList().slice();
            }
            var indices = [];
            for (var i = 0; i < QUESTIONS.length; i++) {
                if (cat === 'all' || QUESTIONS[i].type === cat) {
                    indices.push(i);
                }
            }
            return indices;
        }

        function persist() {
            Storage.saveProgress(current);
            if (typeof Sync !== 'undefined' && Sync.saveToCloud) Sync.saveToCloud();
        }

        return {
            init() {
                const saved = Storage.loadProgress();
                if (saved && typeof saved.currentIndex === 'number' && Array.isArray(saved.order)) {
                    current = Object.assign(createDefault(), saved);
                    if (!current.exam) {
                        current.exam = createDefault().exam;
                    }
                    if (!current.practices) {
                        current.practices = createDefault().practices;
                    }
                } else {
                    current = createDefault();
                }

                // If in exam and not finished, resume timer
                if (current.exam && current.exam.inExam && !current.exam.isCompleted) {
                    document.body.classList.add('exam-mode');
                    startExamTimer();
                } else if (current.exam && current.exam.inExam && current.exam.isCompleted) {
                    document.body.classList.add('exam-mode');
                    document.body.classList.add('review-mode');
                }
            },

            persist: persist,

            getCurrent() {
                return current;
            },

            getCategory() {
                return category;
            },

            setCategory(cat) {
                if (!current.categoryIndex) current.categoryIndex = {};
                current.categoryIndex[category] = current.currentIndex;

                category = cat;
                var indices = getFilteredIndices(cat);

                if (cat === 'wrong' || cat === 'favorite') {
                    for (var i = 0; i < indices.length; i++) {
                        this.clearAnswer(indices[i]);
                    }
                }

                if (current.mode === 'random') {
                    indices = shuffleOrder(indices);
                }
                current.order = indices;
                var savedIndex = current.categoryIndex[cat];
                current.currentIndex = (savedIndex !== undefined && savedIndex < indices.length) ? savedIndex : 0;
                persist();
            },

            setMode(mode) {
                var indices = getFilteredIndices(category);
                current.mode = mode;
                current.order = (mode === 'random') ? shuffleOrder(indices) : indices;
                current.currentIndex = 0;
                persist();
            },

            getCurrentQuestion() {
                var idx = current.order[current.currentIndex];
                var q = QUESTIONS[idx] || null;
                if (q && category === 'wrong') {
                    return getWrongShuffledQuestion(q, idx);
                }
                return q;
            },

            getFilteredQuestions() {
                return getQuestionsByCategory(category);
            },

            getCurrentQuestionIndex() {
                return current.order[current.currentIndex];
            },

            answerQuestion(userAnswer) {
                var qIndex = current.order[current.currentIndex];
                var question = this.getCurrentQuestion();

                if (current.exam && current.exam.inExam) {
                    if (current.exam.isCompleted) return false;
                    current.exam.userAnswers[qIndex] = userAnswer;
                    persist();
                    return true;
                }

                if (current.answered[qIndex] !== undefined) {
                    return current.answered[qIndex] === question.answer;
                }

                var isCorrect = (userAnswer === question.answer);
                current.answered[qIndex] = userAnswer;
                current.totalAnswered++;

                if (isCorrect) {
                    current.score++;
                    Storage.removeWrong(qIndex);
                } else {
                    Storage.saveWrong(qIndex);
                }

                Storage.saveHistory({
                    questionIndex: qIndex,
                    userAnswer: userAnswer,
                    correctAnswer: question.answer,
                    isCorrect: isCorrect,
                    timestamp: new Date().toISOString()
                });

                persist();
                return isCorrect;
            },

            clearAnswer(qIndex) {
                if (wrongShuffleCache[qIndex]) {
                    delete wrongShuffleCache[qIndex];
                }

                if (current.exam && current.exam.inExam) {
                    if (current.exam.userAnswers[qIndex] !== undefined) {
                        delete current.exam.userAnswers[qIndex];
                        persist();
                    }
                    return;
                }

                if (current.answered[qIndex] !== undefined) {
                    if (current.answered[qIndex] === QUESTIONS[qIndex].answer) {
                        current.score--;
                    }
                    current.totalAnswered--;
                    delete current.answered[qIndex];
                    persist();
                }
            },

            getCategoryStats() {
                var answered = 0, correct = 0;
                for (var i = 0; i < current.order.length; i++) {
                    var qIdx = current.order[i];
                    if (this.isAnswered(qIdx)) {
                        answered++;
                        // If exam mode, check exam answers, otherwise check normal answers
                        var userAns = this.getAnswer(qIdx);
                        var actualAns = QUESTIONS[qIdx].answer;
                        if (userAns === actualAns) {
                            correct++;
                        }
                    }
                }
                return { total: current.order.length, answered: answered, correct: correct, wrong: answered - correct };
            },

            goNext() {
                if (this.canGoNext()) {
                    current.currentIndex++;
                    persist();
                }
            },

            goPrev() {
                if (this.canGoPrev()) {
                    current.currentIndex--;
                    persist();
                }
            },

            canGoNext() {
                return current.currentIndex < current.order.length - 1;
            },

            canGoPrev() {
                return current.currentIndex > 0;
            },

            isAnswered(qIndex) {
                if (current.exam && current.exam.inExam) {
                    return current.exam.userAnswers.hasOwnProperty(qIndex);
                }
                return current.answered.hasOwnProperty(qIndex);
            },

            getAnswer(qIndex) {
                if (current.exam && current.exam.inExam) {
                    return current.exam.userAnswers[qIndex];
                }
                return current.answered[qIndex];
            },

            reset() {
                Storage.clearAll();
                wrongShuffleCache = {};
                current = createDefault();
                category = 'all';
                persist();
            },

            toggleFavorite(qIndex) {
                if (Storage.isFavorite(qIndex)) {
                    Storage.removeFavorite(qIndex);
                    return false;
                } else {
                    Storage.saveFavorite(qIndex);
                    return true;
                }
            },

            isFavorite(qIndex) {
                return Storage.isFavorite(qIndex);
            }
        };
    })();

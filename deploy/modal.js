    /* ------- Modal Helpers ------- */
    var Modal = (function() {
        var _overlay = null;
        var _content = null;

        function _getRefs() {
            if (!_overlay) _overlay = document.getElementById('modalOverlay');
            if (!_content) _content = document.getElementById('modalContent');
            return { overlay: _overlay, content: _content };
        }

        return {
            open: function(title, bodyHtml, extraClass) {
                var refs = _getRefs();
                var closeId = 'modalClose_' + Date.now();
                var html = '<div class="modal-header">' +
                    '<h2 class="modal-title">' + title + '</h2>' +
                    '<button class="modal-close-btn" id="' + closeId + '">&times;</button>' +
                    '</div><div class="modal-body">' + bodyHtml + '</div>';
                refs.content.innerHTML = html;
                refs.content.className = 'modal-content' + (extraClass ? ' ' + extraClass : '');
                refs.overlay.classList.add('visible');
                document.getElementById(closeId).addEventListener('click', function() {
                    Modal.close();
                });
                return refs;
            },
            close: function() {
                _getRefs().overlay.classList.remove('visible');
            },
            getOverlay: function() { return _getRefs().overlay; },
            getContent: function() { return _getRefs().content; }
        };
    })();

    /*

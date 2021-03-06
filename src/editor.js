/**
 * This file handles part of the editor which is related to:
 * * wrapping the text in a special way
 * * keyboard shortcuts and click actions
 */
function FastEditor(target_textarea, fast_editor_options) {
    var editor;
    var self = this;
    fast_editor_options = fast_editor_options || {};

    this.platform = new Object();
    this.platform.str = getPlatform();

    this.platform.isDesktop = this.platform.str === "Desktop";
    this.platform.isiOS = this.platform.str === "iOS";
    this.platform.isAndroid = this.platform.str === "Android";
    this.platform.isMobile = this.platform.isiOS || this.platform.isAndroid;
    this.platform.isBrowser = this.platform.str === "Browser";

    this.measureLineElement = function (elt) {
        var wrappingSpan = elt.firstElementChild;

        var finalSpan = document.createElement("span");
        elt.appendChild(finalSpan);

        var measure = editor.display.lineMeasure;
        for (let count = measure.childNodes.length; count > 0; --count)
            measure.removeChild(measure.firstChild);
        measure.appendChild(elt);

        var indentWidth = 0;
        var leadingSpaceRects = [];
        for (var i = 0; i < wrappingSpan.childNodes.length; i++) {
            var span = wrappingSpan.childNodes[i];
            var wrappedClassName = " " + span.className + " ";
            if (
                wrappedClassName.indexOf(" cm-leadingspace ") > -1 ||
                wrappedClassName.indexOf(" cm-comment-block-indentation ") > -1
            ) {
                leadingSpaceRects.push(span.getBoundingClientRect());
            } else {
                break;
            }
        }

        if (leadingSpaceRects.length) {
            indentWidth =
                leadingSpaceRects[leadingSpaceRects.length - 1].right -
                leadingSpaceRects[0].left;
        }

        var textMustWrap = wrappingSpan.offsetTop < finalSpan.offsetTop;

        measure.removeChild(elt);
        elt.removeChild(finalSpan);

        return { indentWidth: indentWidth, textMustWrap: textMustWrap };
    };

    this.selectionsToLineRanges = function (sels) {
        var lineRanges = [];
        for (var i = 0; i < sels.length; i++) {
            var anchor = sels[i].anchor;
            var head = sels[i].head;
            var startLine, endLine;
            if (anchor.line < head.line) {
                startLine = anchor.line;
                endLine = head.line;
            } else {
                startLine = head.line;
                endLine = anchor.line;
            }

            var lastPair = lineRanges[lineRanges.length - 1];
            if (lastPair && lastPair[1] + 1 >= startLine) {
                // The last pair ends on the line before this selection. We just group them together
                lastPair[1] = endLine;
            } else {
                lineRanges.push([startLine, endLine]);
            }
        }
        return lineRanges;
    };

    this.duplicate = function (cm) {
        var sels = cm.listSelections();
        for (var i = sels.length - 1; i >= 0; i--) {
            var anchor = sels[i].anchor;
            var head = sels[i].head;

            if (anchor.line == head.line && anchor.ch == head.ch) {
                // Nothing hightlighted, so copy whole line
                var line = anchor.line;
                var lineContent = cm.doc.getLine(line);
                cm.replaceRange(
                    lineContent + cm.doc.lineSeparator(),
                    { line: line, ch: 0 },
                    { line: line, ch: 0 },
                    "+input"
                );
            } else {
                // If something is highlighted, only copy that
                var start, end;
                if (
                    anchor.line < head.line ||
                    (anchor.line == head.line && anchor.ch < head.ch)
                ) {
                    start = anchor;
                    end = head;
                } else {
                    start = head;
                    end = anchor;
                }
                var content = cm.doc.getRange(start, end);
                cm.replaceRange(content, start, start, "+input");
            }
        }
    };

    this.insertLink = function (cm) {
        var sels = cm.listSelections();
        for (var i = sels.length - 1; i >= 0; i--) {
            var anchor = sels[i].anchor;
            var line = anchor.line;
            const date = new Date();
            const link = date
                .toLocaleString("fr-CA", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                .replace(/[^0-9]/g, "");

            cm.replaceRange(
                `[[${link}]]` + cm.doc.lineSeparator(),
                { line: line, ch: 0 },
                { line: line, ch: 0 },
                "+input"
            );
        }
    };

    this.insertTime = function (cm) {
        var sels = cm.listSelections();
        for (var i = sels.length - 1; i >= 0; i--) {
            var anchor = sels[i].anchor;
            var line = anchor.line;
            const date = new Date();
            cm.replaceRange(
                `# ${date.toLocaleDateString("ru-RU")}` + cm.doc.lineSeparator(),
                { line: line, ch: 0 },
                { line: line, ch: 0 },
                "+input"
            );
        }
    };

    this.markAsDone = function (cm) {
        var sels = cm.listSelections();
        for (var i = sels.length - 1; i >= 0; i--) {
            var anchor = sels[i].anchor;

            // Nothing hightlighted, so copy whole line
            var line = anchor.line;
            var lineContent = cm.doc.getLine(line);
            if (lineContent.match(/^\s*=/)) {
                cm.replaceRange(
                    lineContent.replace(/=/, "~"),
                    { line: line, ch: 0 },
                    { line: line, ch: lineContent.length }
                );
            } else if (lineContent.match(/^\s*~/)) {
                cm.replaceRange(
                    lineContent.replace(/~/, "/"),
                    { line: line, ch: 0 },
                    { line: line, ch: lineContent.length }
                );
            } else if (lineContent.match(/^\s*\//)) {
                cm.replaceRange(
                    lineContent.replace(/\//, "<"),
                    { line: line, ch: 0 },
                    { line: line, ch: lineContent.length }
                );
            } else if (lineContent.match(/^\s*</)) {
                cm.replaceRange(
                    lineContent.replace(/</, "="),
                    { line: line, ch: 0 },
                    { line: line, ch: lineContent.length }
                );
            }
        }
    };

    this.moveSelectedLinesUp = function (cm) {
        var sels = cm.listSelections();
        var lineRanges = this.selectionsToLineRanges(sels);
        var nbSelsTouchingFirstLine = 0;

        if (lineRanges[0][0] == 0) {
            var lastLineTouchingFirstLine = lineRanges[0][1];

            for (var i = 0; i < sels.length; i++) {
                var anchor = sels[i].anchor;
                var head = sels[i].head;
                if (
                    anchor.line <= lastLineTouchingFirstLine ||
                    head.line <= lastLineTouchingFirstLine
                ) {
                    nbSelsTouchingFirstLine += 1;
                } else {
                    break;
                }
            }
        }

        for (var i = 0; i < lineRanges.length; i++) {
            var lineRange = lineRanges[i];
            var startLine = lineRange[0];
            var endLine = lineRange[1];

            if (startLine == 0) {
                // This contains the first line of the file. Nothing to do!
                continue;
            }

            var prevLineContent = cm.doc.getLine(startLine - 1);
            var chOfEndLine = cm.doc.getLine(endLine).length;
            cm.replaceRange(
                cm.doc.lineSeparator() + prevLineContent,
                { line: endLine, ch: chOfEndLine },
                { line: endLine, ch: chOfEndLine },
                "+input"
            );
            cm.replaceRange(
                "",
                { line: startLine - 1, ch: 0 },
                { line: startLine, ch: 0 },
                "+input"
            );
        }

        var newSels = [];
        for (var i = 0; i < nbSelsTouchingFirstLine; i++) {
            newSels.push(sels[i]);
        }
        for (var i = nbSelsTouchingFirstLine; i < sels.length; i++) {
            var anchor = sels[i].anchor;
            var head = sels[i].head;
            newSels.push({
                anchor: { line: anchor.line - 1, ch: anchor.ch },
                head: { line: head.line - 1, ch: head.ch },
            });
        }
        cm.doc.setSelections(newSels);
    };

    this.moveSelectedLinesDown = function (cm) {
        var sels = cm.listSelections();
        var lineRanges = this.selectionsToLineRanges(sels);
        var nbSelsTouchingLastLine = 0;
        var lastLineNumber = cm.doc.lastLine();

        if (lineRanges[lineRanges.length - 1][1] == lastLineNumber) {
            var firstLineTouchingLastLine = lineRanges[lineRanges.length - 1][0];

            for (var i = sels.length - 1; i >= 0; i--) {
                var anchor = sels[i].anchor;
                var head = sels[i].head;
                if (
                    anchor.line >= firstLineTouchingLastLine ||
                    head.line >= firstLineTouchingLastLine
                ) {
                    nbSelsTouchingLastLine += 1;
                } else {
                    break;
                }
            }
        }

        for (var i = 0; i < lineRanges.length; i++) {
            var lineRange = lineRanges[i];
            var startLine = lineRange[0];
            var endLine = lineRange[1];

            if (endLine == lastLineNumber) {
                // This contains the last line of the file. Nothing to do!
                continue;
            }

            var nextLineContent = cm.doc.getLine(endLine + 1);
            cm.replaceRange(
                "",
                { line: endLine, ch: cm.doc.getLine(endLine).length },
                { line: endLine + 1, ch: cm.doc.getLine(endLine + 1).length },
                "+input"
            );
            cm.replaceRange(
                nextLineContent + cm.doc.lineSeparator(),
                { line: startLine, ch: 0 },
                { line: startLine, ch: 0 },
                "+input"
            );
        }

        var newSels = [];
        var nbLineRangetochange = sels.length - nbSelsTouchingLastLine;

        for (var i = 0; i < nbLineRangetochange; i++) {
            var anchor = sels[i].anchor;
            var head = sels[i].head;
            newSels.push({
                anchor: { line: anchor.line + 1, ch: anchor.ch },
                head: { line: head.line + 1, ch: head.ch },
            });
        }
        for (var i = nbLineRangetochange; i < sels.length; i++) {
            newSels.push(sels[i]);
        }
        cm.doc.setSelections(newSels);
    };

    this.setupEditor = function (target_textarea) {
        this.editor = editor = CodeMirror.fromTextArea(target_textarea, {
            mode: "indent_text",
            lineWrapping: true,
            tabSize: 2,
            indentUnit: 2,
            extraKeys: {
                "Alt-F": "findPersistent",
                Tab: "indentMore",
                "Shift-Tab": "indentLess",
                Enter: (cm) => {
                    var sels = cm.listSelections();
                    var tokens = [];
                    for (var i = sels.length - 1; i >= 0; i--) {
                        tokens.push(cm.getTokenAt(sels[i].anchor, true));
                        cm.replaceRange(
                            cm.doc.lineSeparator(),
                            sels[i].anchor,
                            sels[i].head,
                            "+input"
                        );
                    }

                    var new_indentation;
                    sels = cm.listSelections();
                    for (var i = 0; i < sels.length; i++) {
                        var state = tokens[i].state;
                        var prev_line = cm.doc.getLine(sels[i].anchor.line - 1);
                        if (state.inCodeBlock) {
                            if (state.codeBlockHasReadText) {
                                new_indentation = /^\s*/.exec(prev_line)[0];
                            } else {
                                new_indentation = /^[-*+>\s]*/.exec(prev_line)[0];
                                new_indentation = new_indentation.replace(/[-*+>]/g, " ");
                            }
                        } else {
                            // Need a space after the dot, or to reach the end of the line
                            var digits = /^\s*(\d+)\.($|\s+)/.exec(prev_line);
                            if (digits) {
                                prev_line = prev_line.replace(/\d+/, parseInt(digits, 10) + 1);
                            }
                            new_indentation = /^\s*(\d+)\.\s+|[-*+>=\s]*/.exec(prev_line)[0];
                        }
                        cm.replaceRange(
                            new_indentation,
                            sels[i].anchor,
                            sels[i].head,
                            "+input"
                        );
                    }
                    cm.scrollIntoView();
                },
                Home: "goLineLeftSmart",
                End: "goLineRight",
                "Ctrl-D": this.duplicate.bind(this),
                "Ctrl-K": this.markAsDone.bind(this),
                "Cmd-D": this.duplicate.bind(this),
                "Cmd-K": this.markAsDone.bind(this),
                // Shift has to be first for some reason...
                "Shift-Ctrl-L": this.insertLink.bind(this),
                "Shift-Ctrl-T": this.insertTime.bind(this),
                "Shift-Ctrl-Up": this.moveSelectedLinesUp.bind(this),
                "Shift-Ctrl-Down": this.moveSelectedLinesDown.bind(this),
                "Alt-Up": this.moveSelectedLinesUp.bind(this),
                "Alt-Down": this.moveSelectedLinesDown.bind(this),
            },
        });
        // only use CodeMirror markselection when not in contenteditable
        editor.setOption(
            "styleSelectedText",
            editor.getOption("inputStyle") != "contenteditable"
        );

        editor.setSize("100%", "100%");

        var linkify = require('linkify-it')({ 'ftp:': null, '//': null }, { fuzzyEmail: false });

        function setModalLink(address) {
            MicroModal.show("modal-open-link");

            var btn_link = document.getElementById("modal-link-button");
            btn_link.href = address;

            var desc_link = document.getElementById("modal-link-description");
            desc_link.textContent = address;
        }

        function checkLinkClickElement(e) {
            return e.target.className.includes("cm-link")
                && !(e.target.className.includes("CodeMirror-selectedtext"))
                && linkify.test(e.target.textContent);
        }

        // Use modal only on Mobile
        if (self.platform.isMobile) {
            MicroModal.init({
                awaitCloseAnimation: true,
            });
        }

        if (self.platform.isiOS) {
            editor.getWrapperElement().addEventListener("tap", function (e) {
                if (checkLinkClickElement(e)) {
                    var address = e.target.textContent;

                    if (!/^https?:\/\//.test(address)) {
                        address = "http://" + address;
                    }

                    setModalLink(address);

                    e.preventDefault();
                }
            })
        } else {
            editor.on("mousedown", function (cm, e) {
                if (e.ctrlKey || e.metaKey) {
                    if (checkLinkClickElement(e)) {
                        // We don't want to add an extra cursor in in the editor when ctrl-clicking a link
                        e.preventDefault();
                    }
                }
            });

            editor.getWrapperElement().addEventListener("click", function (e) {
                // Android tap actions are buggy. iOS webview does not support click event correctly
                if (e.ctrlKey || e.metaKey || self.platform.isAndroid) {
                    if (checkLinkClickElement(e)) {
                        var address = e.target.textContent;

                        if (!/^https?:\/\//.test(address)) {
                            address = "http://" + address;
                        }

                        if (self.platform.isAndroid) {
                            setModalLink(address);
                        } else {
                            // more compatible way to open links
                            var invisible_a = document.createElement("a");

                            invisible_a.style.display = "none";
                            invisible_a.href = address;
                            invisible_a.target = "_blank";

                            document.body.appendChild(invisible_a);

                            invisible_a.click();
                            invisible_a.remove();
                        }

                        e.preventDefault();
                    }
                }
            });
        }


        // This is the base padding in the css if I remember well
        var basePadding = 4;
        editor.on("renderLine", function (cm, line, elt) {
            var measures = self.measureLineElement(elt);
            var indentationWidth = measures.indentWidth;

            var scrollInfo = cm.getScrollInfo();
            var maxOff = scrollInfo.width - 150;
            if (maxOff < 30) {
                maxOff = 30;
            }

            var wrapOffset = indentationWidth;
            if (wrapOffset > maxOff) {
                wrapOffset = maxOff;
            }

            if (measures.textMustWrap) {
                elt.className += " cm-line-is-wrapped";
            }
            // Making the lines after the first have just the right indentation using padding.
            // And making the first line back to where it would be by removing that padding.
            elt.style.textIndent = "-" + wrapOffset + "px";
            elt.style.paddingLeft = basePadding + wrapOffset + "px";
        });

        this.setAllowLongerLinesNoRefresh(
            !!fast_editor_options.allow_longer_lines
        );
        this.setColorHeaders(!!fast_editor_options.color_headers);
        this.setMonospaceNoRefresh(!!fast_editor_options.monospace);

        editor.refresh();

        // Need to do refresh on the codemirror instance when there is resizing
        // This is necessary for to fix the max wrapping width in hte edge cases that it is necessary...
        var resize_timeout_handle;
        window.addEventListener("resize", function () {
            // We don't want to refresh instantly, to avoid making things too slow. So we only do it once it has
            // been 1s without resize
            clearTimeout(resize_timeout_handle);
            resize_timeout_handle = setTimeout(function () {
                editor.refresh();
            }, 1000);
        });
    };

    this.setAllowLongerLinesNoRefresh = function (true_false) {
        fast_editor_options.allow_longer_lines = true_false;
        if (true_false) {
            this.editor.getWrapperElement().classList.remove("remove-longer-lines");
        } else {
            this.editor.getWrapperElement().classList.add("remove-longer-lines");
        }
    };

    this.setAllowLongerLines = function (true_false) {
        this.setAllowLongerLinesNoRefresh(true_false);
        this.editor.refresh();
    };

    this.setColorHeaders = function (true_false) {
        fast_editor_options.color_headers = true_false;
        if (true_false) {
            this.editor.getWrapperElement().classList.add("cfg-color-headers");
        } else {
            this.editor.getWrapperElement().classList.remove("cfg-color-headers");
        }
    };

    this.setMonospaceNoRefresh = function (true_false) {
        fast_editor_options.monospace = true_false;
        if (true_false) {
            this.editor.getWrapperElement().classList.add("use-monospace-everywhere");
        } else {
            this.editor
                .getWrapperElement()
                .classList.remove("use-monospace-everywhere");
        }
    };

    this.setMonospace = function (true_false) {
        this.setMonospaceNoRefresh(true_false);
        this.editor.refresh();
    };

    this.setupEditor(target_textarea);
}

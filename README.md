### Standard Notes Fast Editor 

This is a text editor for the encrypted note-taking app https://standardnotes.org/.
A mobile-friendly and high-performance editor that makes it easy to write and read nested notes.

This is the fork of [Indent Editor](https://github.com/ghedamat/standard-notes-indent-editor) that is primarily based on [MaxLap's](https://github.com/MaxLap/standard-notes-indent-editor) work. 
I enjoy using Standard Notes, it's an awesome open source project. I was really skeptical about Electron-based apps until I have started using Standard Notes. 
The one thing that made me disappointed is that most of the editors don't have proper mobile support, so I've started to create my own editor. I've made many fixes and meaningless commits to test on the mobile so I have to clean up and reinitialize the repo.

Original Indent Editor features:
* Press `Tab` to indent the line (or selected lines) with 2 spaces (even if in the middle of the line).
* Press `Shift` + `Tab` removes 2 spaces from the beginning of the line (or selected lines).
* `Enter` creates a new line with the same indentation as the current line.
* Empty lines are smaller than a normal line, giving you more control over spacing.
* Lines can wrap.
* When lines wrap, they will align with the same indentation as the first line.
* Stars (*), dashes (-), greater than (>), and plus (+) are considered part of indentation. This means: 
* Lines wrap until after those characters too.
* Pressing `Enter` copies the *->+ along with the spaces.
* Indentation uses a fixed-width font, so it always aligns nicely.
* Numbered lists (lines starting with 1. then 2.) are also considered indentation, and numbers will auto-increment on "Enter".
* Lines that wrap are shown as paragraphs of around 50 characters wide. This keeps them from being super large and hard to read
* Lines that wrap are slightly closer together vertically.
* Lines starting with a number sign (#) are headers, shown as bold and bigger text.
* Things that look like web addresses are highlighted and can be ctrl+clicked to open in a new tab.
* You can use backticks (\`) to put code in a line, this will look similar to Markdown, but the backticks are not hidden: `` `code` `` 
* Text between triple backticks \``` (they must be at the end of lines) is shown as a block of code. Again, this will look similar to Markdown, but without the box:
````
```
function hello() {
    console.log('hello world')
}
```
````
* Pressing `Ctrl` + `D` duplicates the selection or the current line if no selection.
* Pressing `Ctrl` + `Shift` + `Up` and `Ctrl` + `Shift` + `Down` will move the selected lines up and down.

Fast Editor differences:
* First editor with clickable links with confirming popup on Android and iOS. Webview is slightly different on each platform, so it was required to make some tweaks.
* Updated dependencies.
* Optimized performance.
* Pressing `Alt` + `Up` and `Alt` + `Down` will move the selected lines up and down.
* Pressing `Shift` + `Ctrl`+ `L ` adds markdown link to note. (You could use [standardnotes-fs](https://github.com/tannercollin/standardnotes-fs) with [foam](https://github.com/foambubble/foam) to utilize Zettelkasten method in Standard Notes) 
* Pressing `Shift` + `Ctrl`+ `T` adds current date to the note. (Made by ghedamat)
* Simple todo editor. 
Type `=` at the beginning of the line to highlight the task.
Type `/` at the beginning of the line to mark the task as delegated.
Type `<`at the beginning of the line to postpone the task.
Type `~` at the beginning of the line to mark the task as complete. Or you could use it to strikethrough any text in your notes.


### How to install

In Standard Notes (either browser or desktop), click Extension, then Import Extension, paste this link: `https://listed.to/p/2U3G6NlEzk`, press Enter.

You should then be able to select the Fast Editor in your list of editors.

### The goals

* A mobile-friendly and high-performance editor that makes it easy to write and read nested notes.
* Be your main notes, todos, or code snippets editor for a desktop and mobile.

This means:
* Grouping things help: natural indentation, lists, and vertical spacing handling
* Splitting lines is troublesome: long lines wrap nicely.
* What you see comes from the text: no formatting buttons or commands.
* See your text: Every character is displayed, nothing is hidden.
* Not locked in: The text will look fine in any other editor, you wouldn't lose anything.

### Basic of how to dev:

Clone the repo.

Install the dependencies:

    npm install

To update dist/ files which are sent as an editor, run:

    grunt

To run the server to try out the editor:

    python3 -m http.server 8080

or:

    npm run build
    npm run serve

You can use the demo to just try out the editor:

    http://localhost:8080/demo.html

To refresh your editor with the modified version, the way that always works is to open the Chrome console, then right-click the refresh icon and do an "Empty cache and hard reload". Other ways of doing hard refreshes may work, but cache clearing has sometimes been necessary for me.

You can also try it in StandardNotes (but it's more painful to do so):

Import the local test extension if you didn't already. Do it from the desktop app because otherwise, it's a HTTP call within a HTTPS one which is refused by your browser. This is the link to the extension:

    http://localhost:8080/local_ext.json

Once the app is imported, you can test it from:
* the browser app: It's possible it won't work until you allow Mixed Content on the page page. Search online for how to enable it for your browser.
* the desktop app. To clear the cache find the "Clear Cache and Reload" button.
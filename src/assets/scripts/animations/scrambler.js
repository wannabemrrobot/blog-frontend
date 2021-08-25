class TextScramble {
    
    constructor(el, scrambleChars, color) {
      this.el = el;
      this.chars = scrambleChars;
    //   this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.update = this.update.bind(this, color);
    }

    setText(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise(resolve => this.resolve = resolve);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        this.queue.push({ from, to, start, end });
      }

      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }

    update(color) {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.randomChar();
            this.queue[i].char = char;
          }
          output += `<span class="scramblerOut" style="color: ${color}">${char}</span>`;
        } else {
          output += from;
        }
      }

      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }

    randomChar() {
      return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}
  
  
function callScramblerAnimation(phraseList, querySelector, scrambleChars) {

  let color = localStorage.getItem('@themeAccent')
    
  const el = document.querySelector(querySelector);
  const fx = new TextScramble(el, scrambleChars, color);
  
  let counter = 0;
  const next = () => {
    fx.setText(phraseList[counter]).then(() => {
      setTimeout(next, 800);
    });
    counter = (counter + 1) ;
  };
  
  next();
}
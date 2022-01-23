
class InGamePosition {
    constructor(setting, level,highestScore) {
        this.setting = setting;
        this.level = level;
        this.object = null;
        this.vaccine = null;
        this.bullets = [];
        this.highestScore = localStorage.getItem('highestScore');
        this.lastBulletTime = null;
        this.viruses = [];
        this.bombs = [];
    }
    entry(play) {
        this.vaccine_image = new Image();
        this.virus_image = new Image();
        this.upSec = this.setting.updateSeconds;
        this.turnAround = 1;
        this.horizontalMoving = 1;
        this.verticalMoving = 0;
        this.virusAreSinking = false;
        this.virusPresentSinkingValue = 0;
     
        let presentLevel = this.level < 11 ? this.level : 10;
      
        this.virusSpeed = this.setting.virusSpeed + (presentLevel * 7); 
       
        this.bombSpeed = this.setting.bombSpeed + (presentLevel * 10); 
   
        this.bombFrequency = this.setting.bombFrequency + (presentLevel * 0.05);
      
        this.vaccineSpeed = this.setting.vaccineSpeed;
        this.object = new Objects();
        this.vaccine = this.object.vaccine((play.width / 2), play.playBoundaries.bottom, this.vaccine_image);
     
        const lines = this.setting.virusLines;
        const columns = this.setting.virusColumns;
        const virusesInitial = [];
        let line, column;
        for (line = 0; line < lines; line++) {
            for (column = 0; column < columns; column++) {
                this.object = new Objects();
                let x, y;
                x = (play.width / 2) + (column * 50) - ((columns - 1) * 25);
                y = (play.playBoundaries.top + 30) + (line * 30);
                virusesInitial.push(this.object.virus(x, y, line, column, this.virus_image, this.level));
            }
        }
        this.viruses = virusesInitial;
    }
    update(play) {
        const vaccine = this.vaccine;
        const vaccineSpeed = this.vaccineSpeed;
        const upSec = this.setting.updateSeconds;
        const bullets = this.bullets;
        // Keyboard events
        if (play.pressedKeys[37]) {
            vaccine.x -= vaccineSpeed * upSec;
        }
        if (play.pressedKeys[39]) {
            vaccine.x += vaccineSpeed * upSec;
        }
        if (play.pressedKeys[32]) {
            this.shoot();
        }
        if (vaccine.x < play.playBoundaries.left) {
            vaccine.x = play.playBoundaries.left;
        }
        if (vaccine.x > play.playBoundaries.right) {
            vaccine.x = play.playBoundaries.right;
        }
        //  Moving bullets
        for (let i = 0; i < bullets.length; i++) {
            let bullet = bullets[i];
            bullet.y -= upSec * this.setting.bulletSpeed;
            // If our bullet flies out from the canvas it will be cleared
            if (bullet.y < 0) {
                bullets.splice(i--, 1);
            }
        }
      
        let reachedSide = false;
        for (let i = 0; i < this.viruses.length; i++) {
            let virus = this.viruses[i];
            let fresh_x = virus.x + this.virusSpeed * upSec * this.turnAround * this.horizontalMoving;
            let fresh_y = virus.y + this.virusSpeed * upSec * this.verticalMoving;
            if (fresh_x > play.playBoundaries.right || fresh_x < play.playBoundaries.left) {
                this.turnAround *= -1;
                reachedSide = true;
                this.horizontalMoving = 0;
                this.verticalMoving = 1;
                this.virusAreSinking = true;
            }
            if (reachedSide !== true) {
                virus.x = fresh_x;
                virus.y = fresh_y;
            }
        }
        if (this.virusAreSinking == true) {
            this.virusPresentSinkingValue += this.virusSpeed * upSec;
            if (this.virusPresentSinkingValue >= this.setting.virusSinkingValue) {
                this.virusAreSinking = false;
                this.verticalMoving = 0;
                this.horizontalMoving = 1;
                this.virusPresentSinkingValue = 0;
            }
        }
      
        const frontLineViruses = [];
        for (let i = 0; i < this.viruses.length; i++) {
            let virus = this.viruses[i];
            if (!frontLineViruses[virus.column] || frontLineViruses[virus.column].line < virus.line) {
                frontLineViruses[virus.column] = virus;
            }
        }
        // Give a chance for bombing
        for (let i = 0; i < this.setting.virusColumns; i++) {
            let virus = frontLineViruses[i];
            if (!virus)
                continue;
            let chance = this.bombFrequency * upSec;
            this.object = new Objects();
            if (chance > Math.random()) {
                // make a bomb object and put it into bombs array	
                this.bombs.push(this.object.bomb(virus.x, virus.y + virus.height / 2));
            }
        }
        // Moving bombs
        for (let i = 0; i < this.bombs.length; i++) {
            let bomb = this.bombs[i];
            bomb.y += upSec * this.bombSpeed;
            
            if (bomb.y > this.height) {
                this.bombs.splice(i--, 1);
            }
        }
       
        for (let i = 0; i < this.viruses.length; i++) {
            let virus = this.viruses[i];
            let collision = false;
            for (let j = 0; j < bullets.length; j++) {
                let bullet = bullets[j];
                // collision check
                if (bullet.x >= (virus.x - virus.width / 2) && bullet.x <= (virus.x + virus.width / 2) &&
                    bullet.y >= (virus.y - virus.height / 2) && bullet.y <= (virus.y + virus.height / 2)) {
                    // if there is collision we delete the bullet and set collision true
                    bullets.splice(j--, 1);
                    collision = true;
                    play.score += this.setting.pointsPerVirus;
                }
            }
          
            if (collision == true) {
                this.viruses.splice(i--, 1);
                play.sounds.playSound('virusDeath');
            }
        }
        // vaccine-bomb collision
        for (let i = 0; i < this.bombs.length; i++) {
            let bomb = this.bombs[i];
            if (bomb.x + 2 >= (vaccine.x - vaccine.width / 2) &&
                bomb.x - 2 <= (vaccine.x + vaccine.width / 2) &&
                bomb.y + 6 >= (vaccine.y - vaccine.height / 2) &&
                bomb.y <= (vaccine.y + vaccine.height / 2)) {
          
                this.bombs.splice(i--, 1);
                // effect on the vaccine
                play.sounds.playSound('explosion');
                play.shields--; //one hit
            }
        }
       
        for (let i = 0; i < this.viruses.length; i++) {
            let virus = this.viruses[i];
            if ((virus.x + virus.width / 2) > (vaccine.x - vaccine.width / 2) &&
                (virus.x - virus.width / 2) < (vaccine.x + vaccine.width / 2) &&
                (virus.y + virus.height / 2) > (vaccine.y - vaccine.height / 2) &&
                (virus.y - virus.height / 2) < (vaccine.y + vaccine.height / 2)) {
                // if there is collision the vaccine explodes
                play.sounds.playSound('explosion');
                play.shields = -1; //instant death
            }
        }
        // vaccine death check
        if (play.shields < 0) {
           if(play.score>this.highestScore){
               this.highestScore = play.score;
               localStorage.setItem('highestScore',play.score);
           }

           console.log(localStorage.getItem('highestScore'))
            play.goToPosition(new GameOverPosition());
        }
        // Level completed
        if (this.viruses.length == 0) {
            play.level += 1;
            play.goToPosition(new TransferPosition(play.level));
        }
    }
    shoot() {
        if (this.lastBulletTime === null || ((new Date()).getTime() - this.lastBulletTime) > (this.setting.bulletMaxFrequency)) {
            this.object = new Objects();
            this.bullets.push(this.object.bullet(this.vaccine.x, this.vaccine.y - this.vaccine.height / 2, this.setting.bulletSpeed));
            this.lastBulletTime = (new Date()).getTime();
            play.sounds.playSound('shot');
        }
    }
    draw(play) {
        // draw vaccine
        ctx.clearRect(0, 0, play.width, play.height);
        ctx.drawImage(this.vaccine_image, this.vaccine.x - (this.vaccine.width / 2), this.vaccine.y - (this.vaccine.height / 2));
        // draw Bullets 
        ctx.fillStyle = '#ff0000';
        for (let i = 0; i < this.bullets.length; i++) {
            let bullet = this.bullets[i];  
            ctx.fillRect(bullet.x - 1, bullet.y - 6, 2, 6);
        }
        // draw viruses    
        for (let i = 0; i < this.viruses.length; i++) {
            let virus = this.viruses[i];
            ctx.drawImage(this.virus_image, virus.x - (virus.width / 2), virus.y - (virus.height / 2));
        }
        // draw bombs
        ctx.fillStyle = "#FE2EF7";
        for (let i = 0; i < this.bombs.length; i++) {
            let bomb = this.bombs[i];
            ctx.fillRect(bomb.x - 2, bomb.y, 4, 6);
        }
        // draw Sound & Mute info
        ctx.font = "16px Comic Sans MS";
        ctx.fillStyle = "#edf2f4";
        ctx.textAlign = "left";
        ctx.fillText("Press S to switch sound effects ON/OFF.  Sound:", play.playBoundaries.left, play.playBoundaries.bottom + 70);
        let soundStatus = (play.sounds.muted === true) ? "OFF" : "ON";
        ctx.fillStyle = (play.sounds.muted === true) ? '#FF0000' : '#0B6121';
        ctx.fillText(soundStatus, play.playBoundaries.left + 375, play.playBoundaries.bottom + 70);
        ctx.fillStyle = '#ffb4a2';
        ctx.textAlign = "right";
        ctx.fillText("Press P to Pause.", play.playBoundaries.right, play.playBoundaries.bottom + 70);
        // draw Score & Level
        ctx.textAlign = "center";
        ctx.fillStyle = '#d9ed92';
        ctx.font = "bold 24px Comic Sans MS";
        ctx.fillText("Score", play.playBoundaries.right, play.playBoundaries.top - 75);

        ctx.font = "bold 24px Comic Sans MS";
        ctx.fillText("Highest Score", (play.width / 2)+125, play.playBoundaries.top - 75);
        ctx.font = "bold 24px Comic Sans MS";
        let val = localStorage.getItem("highestScore")==null ? 0 : localStorage.getItem("highestScore");
        ctx.fillText( val,(play.width / 2)+125, play.playBoundaries.top - 25);

        ctx.fillStyle = '#f7d1cd';
        ctx.font = "bold 30px Comic Sans MS";
        ctx.fillText(play.score, play.playBoundaries.right, play.playBoundaries.top - 25);
        ctx.font = "bold 24px Comic Sans MS";
        ctx.fillText("Level", play.playBoundaries.left, play.playBoundaries.top - 75);
        ctx.font = "bold 30px Comic Sans MS";
        ctx.fillText(play.level, play.playBoundaries.left, play.playBoundaries.top - 25);
        // draw Shields
        ctx.textAlign = "center";
        if (play.shields > 0) {
            ctx.fillStyle = '#c0fdff';
            ctx.font = "bold 24px Comic Sans MS";
            ctx.fillText("Covishield", (play.width / 2)-150, play.playBoundaries.top - 75);
            ctx.font = "bold 30px Comic Sans MS";
            ctx.fillText(play.shields, (play.width / 2)-150, play.playBoundaries.top - 25);
        }
        else {
            ctx.fillStyle = '#ff4d4d';
            ctx.font = "bold 24px Comic Sans MS";
            ctx.fillText("WARNING", (play.width / 2)-150, play.playBoundaries.top - 75);
            ctx.fillStyle = '#BDBDBD';
            ctx.fillText("No Covishield left!", (play.width / 2)-150, play.playBoundaries.top - 25);
        }
    }
    keyDown(play, keyboardCode) {
        if (keyboardCode == 83) { // Mute sound: S
            play.sounds.muteSwitch();
        }
        if (keyboardCode == 80) { // Pause: P
            play.pushPosition(new PausePosition());
        }
    }
}









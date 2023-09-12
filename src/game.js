import { init, setImagePath, load, SpriteSheet, imageAssets, SpriteClass, GameLoop, Sprite, initPointer, Button } from "../node_modules/kontra/kontra.mjs"
import CPlayer from "./player-small.js";
import sounds from "../assets/song.js";

init();
initPointer();
let scene = 0;
let mPlayers = [];
let mWave = [0, 0, 0, 0];
let mAudio = [];
let mReady = [false, false, false, false];
let mInt = [];
for (let i = 0; i < 4; i++) {
    let Player = new CPlayer();
    mPlayers.push(Player);
    Player.init(sounds[i]);
    let Audio = document.createElement("audio");
    mAudio.push(Audio);
    let prepare = setInterval(function () {
        if (mReady[i]) {
            mWave[i] = mPlayers[i].createWave();
            mAudio[i].src = URL.createObjectURL(new Blob([mWave[i]], { type: "audio/wav" }));
            if (i == 0) {
                mAudio[i].loop = true;
            }
            clearInterval(mInt[i]);
        }
        mReady[i] = mPlayers[i].generate() >= 1;
    });
    mInt.push(prepare);
}
setImagePath('assets/img/');
let riderSpriteSheet;
let riderSprite;
load('rider.png').then(() => {
    riderSpriteSheet = SpriteSheet({
        image: imageAssets['rider'],
        frameWidth: 24,
        frameHeight: 24,
        animations: {
            jump: {
                frames: '2..4',
                frameRate: 4,
                loop: false
            },
            run: {
                frames: '0..2',
                frameRate: 6
            }
        }
    });
    riderSprite = new SpriteClass({
        x: 50,
        y: 450,
        width: 96,
        height: 96,
        anchor: { x: 0, y: 0.5 },
        animations: riderSpriteSheet.animations
    });
});
let gerege;
let canGetGerege;
load('hurdle.png').then(() => {
    imageAssets['hurdle'].width = 64;
    imageAssets['hurdle'].height = 64;
});
load('arrow.png').then(() => {
    imageAssets['arrow'].width = 32;
    imageAssets['arrow'].height = 32;
});
let birdAni;
load('bird.png').then(() => {
    birdAni = SpriteSheet({
        image: imageAssets['bird'],
        frameHeight: 16,
        frameWidth: 32,
        animations: {
            fly: {
                frames: '0..3',
                frameRate: 9
            }
        }
    });
});
class Hurdle extends Sprite {
    constructor(props, lane) {
        super(props);
        this.lane = lane;
    }
}
class Bird extends SpriteClass {
    constructor(props, lane) {
        super(props);
        this.lane = lane;
        this.isShot = 30;
    }
}
let keyDownEvent = (event) => {
    if (!inAir) {
        switch (event.code) {
            case 'Space':
                riderSprite.playAnimation('jump');
                inAir = true;
                break;
            case 'ArrowUp':
                riderLane = Math.max(0, riderLane - 1);
                break;
            case 'ArrowDown':
                riderLane = Math.min(2, riderLane + 1);
                break;
            case 'ArrowRight':
                fireArrow(riderLane);
                mAudio[2].play();
                break;
            case 'ArrowLeft':
                break;
        }
        removeEventListener("keydown", keyDownEvent);
    }
};
addEventListener("keydown", keyDownEvent);
addEventListener("keyup", () => {
    addEventListener("keydown", keyDownEvent);
});
let inAir;
let isHit;
let airTime;
let riderLane;
let hurdleArr;
let birdArr;
let groundLane = [];
for (let i = 0; i < 3; i++) {
    groundLane.push([]);
    for (let j = 0; j < document.getElementById("game").width; j++) {
        groundLane[i].push(0);
    }
}
let skyLane = [];
for (let i = 0; i < 3; i++) {
    skyLane.push([]);
    for (let j = 0; j < document.getElementById("game").width; j++) {
        skyLane[i].push(0);
    }
}
let groundCanGen;
let skyCanGen;
let score;
function riderCollision(lane) {
    if (isHit == 0) {
        if (inAir) {
            if (airTime > 25 && airTime < 65) {
                for (let i = riderSprite.x; i < riderSprite.x + riderSprite.width; i++) {
                    if (skyLane[lane][i] == 1) {
                        isHit = 150;
                        mAudio[1].play();
                        gerege -= 1;
                        break;
                    }
                }
            }
        } else {
            for (let i = riderSprite.x; i < riderSprite.x + riderSprite.width; i++) {
                if (groundLane[lane][i] == 1) {
                    isHit = 150;
                    mAudio[1].play();
                    gerege -= 1;
                    break;
                } else if (groundLane[lane][i] == 2) {
                    speed = Math.floor((3 + Math.floor(score / 5000)) * 2 / 3);
                    speedTimer = 150;
                    break;
                } else if (groundLane[lane][i] == 3) {
                    speed = Math.floor((3 + Math.floor(score / 5000)) * 4 / 3);
                    speedTimer = 150;
                    break;
                }
            }
        }
    }
}
let arrowArr;
function fireArrow(lane) {
    let arr = new Sprite({
        x: 50,
        y: 320 + 70 * riderLane,
        anchor: { x: 0, y: 0 },
        image: imageAssets['arrow']
    });
    arr.lane = lane;
    arrowArr.push(arr);
    for (let i = birdArr.length - 1; i >= 0; i--) {
        if (birdArr[i].lane == lane) {
            if (arr.x + arr.width + 150 >= birdArr[i].x - 10 && arr.x + arr.width + 150 <= birdArr[i].x + birdArr[i].width + 10) {
                score += 500;
                canGetGerege -= 1;
                if (canGetGerege <= 0) {
                    gerege = Math.min(10, gerege + 1);
                    canGetGerege = gerege * Math.floor(Math.random() * 5 + 1);
                }
                birdArr[i].isShot -= 1;
            }
        }
    }
}
let speed;
let speedTimer;
let spZone;
let updateHurdles = (arr, lane, type) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].x > 0) {
            for (let j = 0; j < speed; j++) {
                lane[arr[i].lane][arr[i].x + arr[i].width + j] = 0;
                if (type == 1) {
                    lane[arr[i].lane][arr[i].x - j] = 1;
                } else {
                    lane[arr[i].lane][arr[i].x - j] = arr[i].spType;
                }
            }
            arr[i].x -= speed;
        } else {
            for (let j = 0; j < arr[i].width + speed; j++) {
                lane[arr[i].lane][j] = 0;
            }
            arr.splice(i, 1);
        }
    }
};
let button = Button({
    x: Math.floor(document.getElementById('game').width / 2),
    y: Math.floor(document.getElementById('game').height * 3 / 4),
    anchor: { x: 0.5, y: 0.5 },
    text: {
        text: 'Start Running',
        color: 'white',
        font: '20px Arial, sans-serif',
        anchor: { x: 0.5, y: 0.5 }
    },
    padX: 20,
    padY: 10,
    render() {
        if (this.pressed) {
            this.textNode.color = 'yellow';
            gerege = 3;
            canGetGerege = gerege * Math.floor(Math.random() * 5 + 1);
            scene = 1;
            inAir = false;
            isHit = 0;
            airTime = 0;
            riderLane = 1;
            hurdleArr = [];
            birdArr = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < document.getElementById("game").width; j++) {
                    skyLane[i][j] = 0;
                    groundLane[i][j] = 0;
                }
            }
            groundCanGen = [160, 120, 60];
            skyCanGen = [60, 120, 160];
            score = 0;
            arrowArr = [];
            speed = 3;
            speedTimer = 0;
            spZone = [];
            document.getElementById('game').style.cursor = 'initial';
            mAudio[0].play();
            this.pressed = false;
        }
        else if (this.hovered) {
            this.textNode.color = 'red';
            document.getElementById('game').style.cursor = 'pointer';
        }
        else {
            this.textNode.color = 'white';
            document.getElementById('game').style.cursor = 'initial';
        }
    }
});
let back = Button({
    x: Math.floor(document.getElementById('game').width / 2),
    y: Math.floor(document.getElementById('game').height * 3 / 4),
    anchor: { x: 0.5, y: 0.5 },
    text: {
        text: 'Back to Menu',
        color: 'white',
        font: '20px Arial, sans-serif',
        anchor: { x: 0.5, y: 0.5 }
    },
    padX: 20,
    padY: 10,
    render() {
        if (this.focused) {
            this.context.setLineDash([8, 10]);
            this.context.lineWidth = 3;
            this.context.strokeStyle = 'red';
            this.context.strokeRect(0, 0, this.width, this.height);
        }
        if (this.pressed) {
            this.textNode.color = 'yellow';
            scene = 0;
            this.pressed = false;
        }
        else if (this.hovered) {
            this.textNode.color = 'red';
            document.getElementById('game').style.cursor = 'pointer';
        }
        else {
            this.textNode.color = 'white';
            document.getElementById('game').style.cursor = 'initial';
        }
    }
});
let loop = GameLoop({
    update: function () {
        if (scene == 1) {
            if (!inAir) {
                riderSprite.playAnimation('run');
            } else {
                airTime += 1;
            }
            birdArr.forEach((b) => {
                b.playAnimation('fly');
                b.update();
            });
            // Only jump is not loop with 3 frame
            // Should use the position to change inAir
            if (airTime >= 90) {
                inAir = false;
                airTime = 0;
            }
            riderSprite.update();
            updateHurdles(hurdleArr, groundLane, 1);
            updateHurdles(birdArr, skyLane, 1);
            updateHurdles(spZone, groundLane, 2);
            for (let i = 0; i < groundLane.length; i++) {
                if (groundCanGen[i] >= 300 + Math.floor(200 * i / 5)) {
                    const scoAdj = Math.min(0.3, score / 10000) + 0.05 * (2 - i);
                    const prob = Math.random();
                    if (prob < (groundCanGen[i] / 1000 + scoAdj)) {
                        let newHur = new Hurdle({
                            x: 500,
                            y: 330 + 70 * i,
                            anchor: { x: 0, y: 0.5 },
                            image: imageAssets['hurdle']
                        }, i);
                        hurdleArr.push(newHur);
                        groundCanGen[i] = 0;
                    } else if (prob > 0.85) {
                        const zone = Sprite({
                            x: 500,
                            y: 353 + 67 * i,
                            anchor: { x: 0, y: 0.5 },
                            width: 64,
                            height: 48
                        });
                        if (Math.random() > 0.5) {
                            zone.color = 'red';
                            zone.spType = 2;
                        } else {
                            zone.color = 'green';
                            zone.spType = 3;
                        }
                        zone.lane = i;
                        spZone.push(zone);
                        groundCanGen[i] = 0;
                    } else {
                        groundCanGen[i] += i + 2;
                    }
                } else {
                    groundCanGen[i] += i + 1;
                }
                if (skyCanGen[i] >= 300 + Math.floor(200 * (2 - i) / 5)) {
                    const scoAdj = Math.min(0.3, score / 10000) + 0.05 * i;
                    const prob = Math.random();
                    if (2 * (i + 1) * prob < (skyCanGen[i] / (5000 * (2 * i + 1)) + scoAdj)) {
                        let newHur = new Bird({
                            x: 500,
                            y: 200 + 70 * i,
                            width: 96,
                            height: 48,
                            anchor: { x: 0, y: 0 },
                            animations: birdAni.animations
                        }, i);
                        birdArr.push(newHur);
                        skyCanGen[i] = 0;
                    } else {
                        skyCanGen[i] += i + 2;
                    }
                } else {
                    skyCanGen[i] += i + 1;
                }
            }
            for (let i = birdArr.length - 1; i >= 0; i--) {
                if (birdArr[i].isShot < 30) {
                    birdArr[i].isShot -= 2;
                    if (birdArr[i].isShot <= 0) {
                        mAudio[3].play();
                        for (let j = Math.max(0, birdArr[i].x - speed); j < birdArr[i].x + birdArr[i].width + speed; j++) {
                            skyLane[birdArr[i].lane][j] = 0;
                        }
                        birdArr.splice(i, 1);
                    }
                }
            }
            for (let i = arrowArr.length - 1; i >= 0; i--) {
                arrowArr[i].x += 5;
                arrowArr[i].y -= 5;
                if (arrowArr[i].y < 100)
                    arrowArr.splice(i, 1);
            }
            riderCollision(riderLane);
            score += speed;
            if (speedTimer > 0) {
                speedTimer -= 1;
            } else {
                speed = 3 + Math.floor(score / 5000);
            }
            if (isHit > 0) {
                isHit -= 1;
                riderSprite.color = `rgba(255,255,255,${0.5 * Math.sin(Math.PI * (50 - isHit % 50) / 50)})`;
            } else {
                riderSprite.color = "rgba(255,255,255,0)";
            }
            if (gerege <= 0) {
                mAudio[0].pause();
                mAudio[0].currentTime = 0;
                scene = 2;
            }
        }
    },
    render: function () {
        const canvas = document.getElementById("game");
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, Math.floor(canvas.height / 5));
        switch (scene) {
            case 0:
                ctx.font = "bold 72px Verdana";
                ctx.textAlign = "center";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("MongoRun", Math.floor(canvas.width / 2), 80);
                button.render();
                break;
            case 1:
                ctx.font = "bold 24px Verdana";
                ctx.textAlign = "right";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(`Score: ${Math.floor(score / 10)}`, 600, 80);
                ctx.fillStyle = "#FFD700";
                for (let i = 0; i < gerege; i++) {
                    ctx.fillRect(35 * i, 20, 26, 50);
                    ctx.beginPath();
                    ctx.arc(35 * i + 13, 20, 13, 0, Math.PI, true);
                    ctx.fill();
                    ctx.arc(35 * i + 13, 70, 13, 0, Math.PI);
                    ctx.fill();
                }
                if (Math.floor(score / 5000) % 2) {
                    ctx.fillStyle = "#111111";
                } else {
                    ctx.fillStyle = "#87CEEB";
                }
                ctx.fillRect(0, Math.floor(canvas.height / 5), canvas.width, Math.floor(canvas.height * 2 / 5));
                if (Math.floor(score / 5000) % 2) {
                    ctx.fillStyle = "#FFFFFF";
                } else {
                    ctx.fillStyle = "#FFD700";
                }
                ctx.beginPath();
                ctx.arc(580, 150, 20, 0, Math.PI * 2);
                ctx.fill();
                if (Math.floor(score / 5000) % 2) {
                    ctx.fillStyle = "#988558";
                } else {
                    ctx.fillStyle = "#966919";
                }
                ctx.beginPath();
                ctx.moveTo(Math.floor(canvas.width / 6), Math.floor(canvas.height * 3 / 5));
                ctx.lineTo(Math.floor(canvas.width / 2), Math.floor(canvas.height / 3));
                ctx.lineTo(Math.floor(canvas.width * 5 / 6), Math.floor(canvas.height * 3 / 5));
                ctx.fill();
                ctx.fillStyle = "#009A17";
                ctx.fillRect(0, Math.floor(canvas.height * 3 / 5), canvas.width, Math.floor(canvas.height * 3 / 5));
                ctx.fillStyle = "#F7B66D";
                ctx.fillRect(0, Math.floor(canvas.height * 3 / 5) + Math.floor(canvas.height / 60), canvas.width, Math.floor(canvas.height / 10));
                ctx.fillRect(0, Math.floor(canvas.height * 3 / 5) + Math.floor(canvas.height / 120) * 19, canvas.width, Math.floor(canvas.height / 10));
                ctx.fillRect(0, Math.floor(canvas.height * 3 / 5) + Math.floor(canvas.height / 60) * 18, canvas.width, Math.floor(canvas.height / 10));
                riderSprite.y = 325 + 70 * riderLane - Math.sin((airTime / 90) * Math.PI) * 100;
                for (let r = 0; r < 3; r++) {
                    for (let i = 0; i < hurdleArr.length; i++) {
                        if (hurdleArr[i].lane == r) {
                            hurdleArr[i].render();
                        }
                    }
                    for (let i = birdArr.length - 1; i >= 0; i--) {
                        if (birdArr[i].lane == r) {
                            birdArr[i].height = 36 + r * 6;
                            birdArr[i].width = 72 + r * 12;
                            birdArr[i].render();
                        }
                    }
                    for (let i = arrowArr.length - 1; i >= 0; i--) {
                        if (arrowArr[i].lane == r) {
                            arrowArr[i].render();
                        }
                    }
                    for (let i = spZone.length - 1; i >= 0; i--) {
                        if (spZone[i].lane == r) {
                            spZone[i].render();
                        }
                    }
                    if (riderLane == r) {
                        riderSprite.height = 72 + r * 12;
                        riderSprite.width = 72 + r * 12;
                        riderSprite.render();
                    }
                }
                break;
            case 2:
                ctx.font = "bold 48px Verdana";
                ctx.textAlign = "center";
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(`You score: ${Math.floor(score / 10)}`, Math.floor(canvas.width / 2), 180);
                back.render();
                break;
        }
    }
})

loop.start();
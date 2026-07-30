// تنظیمات بوم بازی Phaser
const config = {
    type: Phaser.AUTO,
    width: 650,
    height: 650,
    parent: 'game-container',
    backgroundColor: '#0d0f14',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

const GRID_SIZE = 6;
const TILE_SIZE = 100;
const OFFSET = 25;

// داده‌های بازی
let boardState = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
let selectedToken = null;

// ۱. تولید گرافیک‌های اختصاصی درون خود موتور بازی
function preload() {
    let graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // کاشی سنگ‌فرش
    graphics.fillStyle(0x1a1d26);
    graphics.fillRect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4);
    graphics.lineStyle(2, 0x2c3142);
    graphics.strokeRect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4);
    graphics.generateTexture('tile', TILE_SIZE - 4, TILE_SIZE - 4);
    graphics.clear();

    // چراغ گازی (Light Lamp)
    graphics.fillStyle(0xf39c12);
    graphics.fillCircle(20, 20, 15);
    graphics.lineStyle(3, 0xffffff);
    graphics.strokeCircle(20, 20, 15);
    graphics.generateTexture('lamp', 40, 40);
    graphics.clear();

    // دیوار / مانع پلیس (Police Barricade)
    graphics.fillStyle(0xe74c3c);
    graphics.fillRect(0, 0, 80, 12);
    graphics.fillStyle(0xffffff);
    graphics.fillRect(20, 0, 20, 12);
    graphics.fillRect(60, 0, 20, 12);
    graphics.generateTexture('wall', 80, 12);
    graphics.clear();

    // مهره‌های شخصیت‌ها (پرتره گرافیکی)
    const charColors = [0x3498db, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xf1c40f, 0xe74c3c];
    const charNames = ['sherlock', 'watson', 'lestrade', 'stealth', 'jefferson', 'gull'];

    charNames.forEach((name, idx) => {
        graphics.fillStyle(charColors[idx]);
        graphics.fillCircle(30, 30, 28);
        graphics.lineStyle(3, 0xffffff);
        graphics.strokeCircle(30, 30, 28);
        graphics.generateTexture(name, 60, 60);
        graphics.clear();
    });
}

// ۲. ساخت نقشه و چیدمان آبجکت‌ها
function create() {
    const scene = this;

    // رسم زمین بازی
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let x = c * TILE_SIZE + OFFSET + 50;
            let y = r * TILE_SIZE + OFFSET + 50;

            let tile = scene.add.image(x, y, 'tile').setInteractive();
            tile.gridX = c;
            tile.gridY = r;

            tile.on('pointerdown', () => onTileClick(c, r, scene));
        }
    }

    // قرار دادن چراغ‌های گازی روی نقشه
    scene.add.image(150, 50, 'lamp');
    scene.add.image(450, 50, 'lamp');
    scene.add.image(150, 550, 'lamp');
    scene.add.image(450, 550, 'lamp');

    // قرار دادن دیوارهای خروجی شهر (Barricades)
    scene.add.image(300, 20, 'wall');
    scene.add.image(300, 580, 'wall');

    // ساخت و چیدمان مهره‌های شخصیت‌ها
    createToken(scene, 'sherlock', 1, 1);
    createToken(scene, 'watson', 4, 1);
    createToken(scene, 'lestrade', 1, 4);
    createToken(scene, 'stealth', 4, 4);
}

function createToken(scene, key, gridX, gridY) {
    let x = gridX * TILE_SIZE + OFFSET + 50;
    let y = gridY * TILE_SIZE + OFFSET + 50;

    let token = scene.add.image(x, y, key).setInteractive();
    token.gridX = gridX;
    token.gridY = gridY;
    token.charKey = key;

    boardState[gridY][gridX] = token;

    token.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation();
        if (selectedToken) selectedToken.clearTint();
        selectedToken = token;
        token.setTint(0xd4af37); // هاله طلایی انتخاب
    });
}

// ۳. حرکت دادن انیمیشنی مهره به خانه جدید
function onTileClick(gridX, gridY, scene) {
    if (!selectedToken) return;

    // پاک کردن موقعیت قبلی
    boardState[selectedToken.gridY][selectedToken.gridX] = null;

    // به‌روزرسانی مختصات جدید
    selectedToken.gridX = gridX;
    selectedToken.gridY = gridY;
    boardState[gridY][gridX] = selectedToken;

    let targetX = gridX * TILE_SIZE + OFFSET + 50;
    let targetY = gridY * TILE_SIZE + OFFSET + 50;

    // انیمیشن جابه‌جایی روان
    scene.tweens.add({
        targets: selectedToken,
        x: targetX,
        y: targetY,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
            selectedToken.clearTint();
            selectedToken = null;
        }
    });
}

function update() {}

// شبکه آنلاین با PeerJS
const peer = new Peer();
peer.on('open', id => {
    document.getElementById('my-id').innerText = id;
    document.getElementById('conn-status').innerText = 'آماده اتصال';
});

function connectPeer() {
    const targetId = document.getElementById('target-id').value.trim();
    if (!targetId) return alert('کد حریف را وارد کنید');
    
    const conn = peer.connect(targetId);
    conn.on('open', () => {
        document.getElementById('conn-status').innerText = '🟢 متصل شد';
    });
}

function triggerWitness() {
    alert("🔍 فاز شاهد اجرا شد! وضعیت روشنایی مهره‌ها سنجیده شد.");
}

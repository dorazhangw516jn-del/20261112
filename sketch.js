// 宣告全域變數，用來存放四種狀態的圖片精靈圖檔
let stopSheet;
let walkSheet;
let magicSheet;
let effectSheet;

// 設定各圖片精靈的總張數（幀數）
let stopTotalFrames = 10;   // 待機圖為 10 張
let walkTotalFrames = 9;    // 走路圖改回正確的 9 張
let magicTotalFrames = 4;   // 魔法施展圖（magic comb.png）為 4 張
let effectTotalFrames = 5;  // 魔法特效圖（特效comb.png）為 5 張

// 宣告單張照片的原始寬度與高度變數（由圖片載入後自動讀取真實尺寸）
let stopFrameWidth, stopFrameHeight;
let walkFrameWidth, walkFrameHeight;
let magicFrameWidth, magicFrameHeight;
let effectFrameWidth, effectFrameHeight;

// 宣告角色 1 的中心點 X 座標變數
let charX;

// 宣告角色 1 的移動速度（每幀移動的像素距離）
let moveSpeed = 6;

// 宣告角色目前的朝向（1 代表朝右，-1 代表朝左）
let facing = 1;

// 設定目前正在播放的幀數索引（從第 0 張開始）
let currentFrame = 0;

// 記錄上一個影格的狀態（用來判斷狀態切換時重置幀數）
let lastState = 'stop';

// 走路步調時間控制變數（設定為 300 毫秒，即 0.3 秒走一步）
let lastStepTime = 0;
let stepInterval = 300;

// 魔法施展狀態控制變數（確保空白鍵觸發後只完整播放一次）
let isMagicPlaying = false;
let magicStartTime = 0;
let magicDuration = 400; // 魔法動作總播放時間（毫秒）

// 宣告陣列存放畫面上正在飛行的魔法特效物件
let effects = [];

// p5.js 的預載入函式，確保所有圖片精靈在程式開始執行前完全載入
function preload() {
  // 載入待機圖片精靈檔案
  stopSheet = loadImage('1/stop/stop comb.png');
  // 載入走路圖片精靈檔案（9 張）
  walkSheet = loadImage('1/walk/walk comb.png');
  // 載入魔法動作圖片精靈檔案（magic comb.png，4 張）
  magicSheet = loadImage('1/magic/magic comb.png');
  // 載入魔法特效圖片精靈檔案（特效comb.png，5 張）
  effectSheet = loadImage('1/特效/特效comb.png');
}

// p5.js 的初始化設定函式，只在程式啟動時執行一次
function setup() {
  // 建立一個符合瀏覽器視窗全螢幕寬高的畫布
  createCanvas(windowWidth, windowHeight);

  // 自動根據載入的圖片真實寬高計算單張照片尺寸
  stopFrameWidth = stopSheet.width / stopTotalFrames;
  stopFrameHeight = stopSheet.height;

  walkFrameWidth = walkSheet.width / walkTotalFrames;
  walkFrameHeight = walkSheet.height;

  magicFrameWidth = magicSheet.width / magicTotalFrames;
  magicFrameHeight = magicSheet.height;

  effectFrameWidth = effectSheet.width / effectTotalFrames;
  effectFrameHeight = effectSheet.height;

  // 初始化角色 1 的中心點 X 座標在整個畫布 X 軸的 2/3 位置上
  charX = width * (2 / 3);

  // 設定整體畫面更新率為每秒 24 幀，保持移動與渲染流暢
  frameRate(24);
}

// p5.js 的鍵盤單次按下事件監聽（用來偵測空白鍵發動魔法）
function keyPressed() {
  // 當按下空白鍵且目前沒有正在施法時，啟動魔法狀態
  if (key === ' ' && !isMagicPlaying) {
    isMagicPlaying = true;
    // 記錄開始施法的時間點
    magicStartTime = millis();
    // 將動畫幀數歸零，確保從第 1 張開始播放
    currentFrame = 0;
  }
}

// p5.js 的繪圖主迴圈函式，會依照 frameRate 設定的頻率重複執行
function draw() {
  // 設定畫布背景顏色為天空藍（RGB 色碼：135, 206, 235）
  background(135, 206, 235);

  // 宣告區域變數存放目前影格要使用的精靈圖與規格
  let currentSheet;
  let totalFrames;
  let frameWidth;
  let frameHeight;
  let currentState = 'stop';

  // 1. 狀態判定與動畫幀數更新
  if (isMagicPlaying) {
    // 若正在施展魔法，鎖定狀態為 magic（播放 magic comb.png）
    currentState = 'magic';
    // 計算從按下空白鍵到現在經過的時間
    let elapsed = millis() - magicStartTime;
    // 依照經過時間比例計算目前應該播放第幾張魔法照片（只執行一次）
    currentFrame = floor(map(elapsed, 0, magicDuration, 0, magicTotalFrames));

    // 當 magic comb.png 的 4 張魔法照片全部播放完畢時
    if (currentFrame >= magicTotalFrames) {
      // 結束魔法狀態並重置幀數
      isMagicPlaying = false;
      currentFrame = 0;

      // 計算特效產生的起始位置（從角色前方一點的位置發射，並對齊身體高度中心）
      let effX = charX + (facing * 40);
      let effY = height - (height / 2.3) / 2;

      // 建立一個新的魔法特效物件並加入陣列中（發射 特效comb.png）
      effects.push({
        x: effX,       // 特效目前 X 座標
        y: effY,       // 特效目前 Y 座標
        dir: facing,   // 記錄發射當下角色的朝向（1 往右，-1 往左）
        frame: 0       // 特效自身的動畫起始幀
      });
    }
  } else {
    // 非施法狀態時，偵測左右方向鍵控制移動
    if (keyIsDown(RIGHT_ARROW)) {
      // 按下右鍵：設定為走路狀態、朝向設為右（1）、X 座標往右增加
      currentState = 'walk';
      facing = 1;
      charX += moveSpeed;
    } else if (keyIsDown(LEFT_ARROW)) {
      // 按下左鍵：設定為走路狀態、朝向設為左（-1）、X 座標往左減少
      currentState = 'walk';
      facing = -1;
      charX -= moveSpeed;
    } else {
      // 沒有按鍵時：維持待機狀態
      currentState = 'stop';
    }

    // 若狀態剛發生切換（例如從待機變走路），將幀數索引歸零避免超出陣列範圍
    if (currentState !== lastState) {
      currentFrame = 0;
      lastState = currentState;
    }

    // 依據不同狀態更新精靈圖的播放速度
    if (currentState === 'walk') {
      // 走路狀態：每間隔 0.3 秒（300 毫秒）切換下一張走路照片（共 9 張循環）
      if (millis() - lastStepTime > stepInterval) {
        currentFrame = (currentFrame + 1) % walkTotalFrames;
        lastStepTime = millis();
      }
    } else if (currentState === 'stop') {
      // 待機狀態：每 6 個繪圖影格切換一次待機照片（共 10 張循環）
      if (frameCount % 6 === 0) {
        currentFrame = (currentFrame + 1) % stopTotalFrames;
      }
    }
  }

  // 2. 依據最終確定的狀態，指定對應的圖片精靈與裁切尺寸
  if (currentState === 'magic') {
    currentSheet = magicSheet;
    totalFrames = magicTotalFrames;
    frameWidth = magicFrameWidth;
    frameHeight = magicFrameHeight;
  } else if (currentState === 'walk') {
    currentSheet = walkSheet;
    totalFrames = walkTotalFrames;
    frameWidth = walkFrameWidth;
    frameHeight = walkFrameHeight;
  } else {
    currentSheet = stopSheet;
    totalFrames = stopTotalFrames;
    frameWidth = stopFrameWidth;
    frameHeight = stopFrameHeight;
  }

  // 計算角色 1 在畫布上顯示的高度（設定為整個畫布高度的 1/2.3，適應不同載具）
  let displayHeight = height / 2.3;

  // 計算縮放比例（顯示高度除以原圖高度，確保圖片等比例縮放不變形）
  let scaleRatio = displayHeight / frameHeight;

  // 依照原圖比例計算出角色 1 在畫布上應顯示的寬度
  let displayWidth = frameWidth * scaleRatio;

  // 限制角色 1 的 X 軸移動邊界（到達畫布最左端或最右端即停止位移，但動畫繼續播放）
  charX = constrain(charX, displayWidth / 2, width - displayWidth / 2);

  // 計算角色 1 的繪製起點 Y 座標（使角色最底端緊貼畫布最底端）
  let posY = height - displayHeight;

  // 3. 繪製角色 1
  // 儲存目前的畫布座標系狀態
  push();
  // 將畫布原點移動到角色的中心 X 軸與頂端 Y 軸位置
  translate(charX, posY);
  // 依據 facing 進行水平縮放（1 為原方向朝右，-1 為左右鏡像翻轉朝左）
  scale(facing, 1);

  // 計算目前要從圖片精靈中擷取的單張照片 X 軸起始裁切位置
  let sourceX = currentFrame * frameWidth;

  // 繪製裁切後的單張角色精靈圖
  image(
    currentSheet,      // 目前狀態的圖片精靈物件
    -displayWidth / 2, // 相對於新原點的目標 X 座標（置中對齊）
    0,                 // 相對於新原點的目標 Y 座標
    displayWidth,      // 畫布上的目標顯示寬度
    displayHeight,     // 畫布上的目標顯示高度
    sourceX,           // 來源圖片的裁切起始 X 座標
    0,                 // 來源圖片的裁切起始 Y 座標
    frameWidth,        // 來源圖片的裁切寬度
    frameHeight        // 來源圖片的裁切高度
  );
  // 恢復原本的畫布座標系狀態
  pop();

  // 4. 更新與繪製所有飛行中的魔法特效（特效comb.png）
  // 使用反向迴圈遍歷特效陣列，方便在特效飛出邊界時安全移除
  for (let i = effects.length - 1; i >= 0; i--) {
    let eff = effects[i];

    // 設定特效飛行速度（每幀移動 15 像素）並乘上發射方向（1 或 -1）
    let effSpeed = 15;
    eff.x += effSpeed * eff.dir;

    // 控制特效自身的 5 張精靈動畫循環播放
    if (frameCount % 3 === 0) {
      eff.frame = (eff.frame + 1) % effectTotalFrames;
    }

    // 計算特效在畫布上的自適應顯示寬高（高度設為角色高度的 1/2，寬度依原圖比例等比例縮放）
    let effDisplayH = displayHeight / 2;
    let effScale = effDisplayH / effectFrameHeight;
    let effDisplayW = effectFrameWidth * effScale;

    // 儲存座標系狀態並繪製特效
    push();
    translate(eff.x, eff.y);
    // 依據特效飛行方向決定是否左右鏡像翻轉
    scale(eff.dir, 1);

    // 計算目前特效影格的裁切 X 座標
    let effSourceX = eff.frame * effectFrameWidth;

    // 繪製裁切後的完整單張特效精靈圖
    image(
      effectSheet,       // 特效圖片精靈物件（1/特效/特效comb.png）
      0,                 // 相對於發射點的目標 X 座標
      -effDisplayH / 2,  // 相對於發射點的目標 Y 座標（垂直置中）
      effDisplayW,       // 畫布上的目標顯示寬度
      effDisplayH,       // 畫布上的目標顯示高度
      effSourceX,        // 來源圖片的裁切起始 X 座標
      0,                 // 來源圖片的裁切起始 Y 座標
      effectFrameWidth,  // 來源圖片的裁切寬度
      effectFrameHeight  // 來源圖片的裁切高度
    );
    pop();

    // 判斷特效是否已移動到畫布最右端（> width）或最左端（< 0），若是則移除使其消失
    if (eff.x < 0 || eff.x > width) {
      effects.splice(i, 1);
    }
  }
}

// 當瀏覽器視窗大小改變時自動觸發（確保 RWD 響應式自適應效果）
function windowResized() {
  // 記錄視窗縮放前的角色位置比例
  let xRatio = charX / width;
  // 重新調整畫布尺寸以符合新的全螢幕視窗寬高
  resizeCanvas(windowWidth, windowHeight);
  // 依據比例重新計算角色在畫布上的 X 座標
  charX = width * xRatio;
}
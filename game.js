// 游戏状态
const gameState = {
    speed: 150, // 默认中速
    selectedSpeed: null,
    isGameStarted: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    foodEaten: 0,
    snake: [],
    direction: 'right',
    food: null,
    specialFood: null,
    obstacles: [],
    speedMultiplier: 1,
    speedMultiplierTimer: null
};

// 游戏配置
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = 400;

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedSelection = document.getElementById('speedSelection');
const gameInterface = document.getElementById('gameInterface');
const confirmSpeedBtn = document.getElementById('confirmSpeed');
const speedBtns = document.querySelectorAll('.speed-btn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const speedDisplay = document.getElementById('speedDisplay');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');

// 速度名称映射
const speedNames = {
    200: '慢速',
    150: '中速',
    100: '快速',
    70: '超速',
    40: '极速'
};

// 初始化游戏
function initGame() {
    // 速度选择按钮事件
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => selectSpeed(btn));
    });

    // 确认速度按钮事件
    confirmSpeedBtn.addEventListener('click', confirmSpeed);

    // 游戏控制按钮事件
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
    returnBtn.addEventListener('click', returnToSpeedSelection);

    // 键盘事件
    document.addEventListener('keydown', handleKeyPress);

    // 显示最高分
    highScoreDisplay.textContent = gameState.highScore;
}

// 选择速度
function selectSpeed(btn) {
    speedBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.selectedSpeed = parseInt(btn.dataset.speed);
    confirmSpeedBtn.disabled = false;
}

// 确认速度
function confirmSpeed() {
    if (gameState.selectedSpeed) {
        gameState.speed = gameState.selectedSpeed;
        speedSelection.style.display = 'none';
        gameInterface.style.display = 'flex';
        speedDisplay.textContent = speedNames[gameState.speed];
        initSnake();
        drawGame();
    }
}

// 初始化蛇
function initSnake() {
    gameState.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    gameState.direction = 'right';
    gameState.foodEaten = 0;
    gameState.obstacles = [];
    gameState.specialFood = null;
    gameState.score = 0;
    gameState.isGameOver = false;
    gameState.isGameStarted = false;
    gameState.isPaused = false;
    gameState.speedMultiplier = 1;

    if (gameState.speedMultiplierTimer) {
        clearTimeout(gameState.speedMultiplierTimer);
        gameState.speedMultiplierTimer = null;
    }

    scoreDisplay.textContent = gameState.score;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    gameOverDiv.style.display = 'none';
}

// 开始游戏
function startGame() {
    if (gameState.isGameOver) return;

    gameState.isGameStarted = true;
    gameState.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    generateFood();
    gameLoop();
}

// 暂停/继续游戏
function togglePause() {
    if (gameState.isGameOver) return;

    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';

    if (!gameState.isPaused) {
        gameLoop();
    }
}

// 重置游戏
function resetGame() {
    initSnake();
    drawGame();
}

// 处理键盘输入
function handleKeyPress(e) {
    if (!gameState.isGameStarted || gameState.isPaused || gameState.isGameOver) return;

    switch(e.key) {
        case 'ArrowUp':
            if (gameState.direction !== 'down') gameState.direction = 'up';
            break;
        case 'ArrowDown':
            if (gameState.direction !== 'up') gameState.direction = 'down';
            break;
        case 'ArrowLeft':
            if (gameState.direction !== 'right') gameState.direction = 'left';
            break;
        case 'ArrowRight':
            if (gameState.direction !== 'left') gameState.direction = 'right';
            break;
    }
}

// 游戏主循环
function gameLoop() {
    if (gameState.isPaused || gameState.isGameOver) return;

    moveSnake();
    checkCollisions();
    drawGame();

    const actualSpeed = gameState.speed / gameState.speedMultiplier;
    setTimeout(gameLoop, actualSpeed);
}

// 移动蛇
function moveSnake() {
    const head = { ...gameState.snake[0] };

    switch(gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    gameState.snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        gameState.score += 10;
        gameState.foodEaten++;
        scoreDisplay.textContent = gameState.score;

        // 检查是否需要生成特殊食物
        if (gameState.foodEaten >= 5 && Math.random() < 1/8) {
            generateSpecialFood();
        }

        // 检查是否需要生成障碍物
        if (gameState.foodEaten >= 6) {
            generateObstacles();
        }

        generateFood();
    } else {
        gameState.snake.pop();
    }
}

// 生成食物
function generateFood() {
    let food;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        attempts++;
    } while (isPositionOccupied(food) && attempts < maxAttempts);

    gameState.food = food;
}

// 生成特殊食物
function generateSpecialFood() {
    let specialFood;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        specialFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
            type: Math.random() < 0.5 ? 'speed' : 'slow'
        };
        attempts++;
    } while (isPositionOccupied(specialFood) && attempts < maxAttempts);

    gameState.specialFood = specialFood;

    // 10秒后移除特殊食物
    setTimeout(() => {
        if (gameState.specialFood &&
            gameState.specialFood.x === specialFood.x &&
            gameState.specialFood.y === specialFood.y) {
            gameState.specialFood = null;
            drawGame();
        }
    }, 10000);
}

// 生成障碍物
function generateObstacles() {
    const obstacleCount = Math.floor((gameState.foodEaten - 6) / 5) + 1;
    const newObstacles = [];

    for (let i = 0; i < obstacleCount; i++) {
        let obstacle;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            obstacle = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            attempts++;
        } while (isPositionOccupied(obstacle) && attempts < maxAttempts);

        newObstacles.push(obstacle);
    }

    // 使用BFS检查路径是否可达
    if (hasPathToFood(newObstacles)) {
        gameState.obstacles = [...gameState.obstacles, ...newObstacles];
    }
}

// 检查位置是否被占用
function isPositionOccupied(pos) {
    // 检查蛇身
    for (let segment of gameState.snake) {
        if (segment.x === pos.x && segment.y === pos.y) return true;
    }

    // 检查食物
    if (gameState.food && gameState.food.x === pos.x && gameState.food.y === pos.y) return true;

    // 检查特殊食物
    if (gameState.specialFood &&
        gameState.specialFood.x === pos.x &&
        gameState.specialFood.y === pos.y) return true;

    // 检查障碍物
    for (let obstacle of gameState.obstacles) {
        if (obstacle.x === pos.x && obstacle.y === pos.y) return true;
    }

    return false;
}

// BFS路径检测
function hasPathToFood(newObstacles) {
    const tempObstacles = [...gameState.obstacles, ...newObstacles];
    const queue = [gameState.snake[0]];
    const visited = new Set();
    const directions = [
        { x: 0, y: -1, dir: 'up' },
        { x: 0, y: 1, dir: 'down' },
        { x: -1, y: 0, dir: 'left' },
        { x: 1, y: 0, dir: 'right' }
    ];

    visited.add(`${gameState.snake[0].x},${gameState.snake[0].y}`);

    while (queue.length > 0) {
        const current = queue.shift();

        // 检查是否到达食物
        if (current.x === gameState.food.x && current.y === gameState.food.y) {
            return true;
        }

        // 检查四个方向
        for (let dir of directions) {
            const next = {
                x: current.x + dir.x,
                y: current.y + dir.y
            };

            // 检查边界
            if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
                continue;
            }

            const key = `${next.x},${next.y}`;

            // 检查是否已访问或是有障碍物
            if (!visited.has(key) && !isPositionOccupied(next)) {
                visited.add(key);
                queue.push(next);
            }
        }
    }

    return false;
}

// 碰撞检测
function checkCollisions() {
    const head = gameState.snake[0];

    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame();
        return;
    }

    // 检查自身碰撞
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            endGame();
            return;
        }
    }

    // 检查障碍物碰撞
    for (let obstacle of gameState.obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            endGame();
            return;
        }
    }

    // 检查特殊食物
    if (gameState.specialFood) {
        if (head.x === gameState.specialFood.x && head.y === gameState.specialFood.y) {
            handleSpecialFood();
        }
    }
}

// 处理特殊食物
function handleSpecialFood() {
    const type = gameState.specialFood.type;

    if (type === 'speed') {
        // 加速10秒（速度变为当前速度的1/2）
        gameState.speedMultiplier = 0.5;
        speedDisplay.textContent = speedNames[gameState.speed] + ' (加速中)';

        if (gameState.speedMultiplierTimer) {
            clearTimeout(gameState.speedMultiplierTimer);
        }

        gameState.speedMultiplierTimer = setTimeout(() => {
            gameState.speedMultiplier = 1;
            speedDisplay.textContent = speedNames[gameState.speed];
        }, 10000);
    } else {
        // 减速10秒（速度变为当前速度的2倍）
        gameState.speedMultiplier = 2;
        speedDisplay.textContent = speedNames[gameState.speed] + ' (减速中)';

        if (gameState.speedMultiplierTimer) {
            clearTimeout(gameState.speedMultiplierTimer);
        }

        gameState.speedMultiplierTimer = setTimeout(() => {
            gameState.speedMultiplier = 1;
            speedDisplay.textContent = speedNames[gameState.speed];
        }, 10000);
    }

    gameState.specialFood = null;
}

// 返回到速度选择界面
function returnToSpeedSelection() {
    // 停止游戏循环
    gameState.isGameStarted = false;
    gameState.isPaused = false;
    gameState.isGameOver = true;

    if (gameState.speedMultiplierTimer) {
        clearTimeout(gameState.speedMultiplierTimer);
        gameState.speedMultiplierTimer = null;
    }

    // 隐藏游戏界面，显示速度选择界面
    gameInterface.style.display = 'none';
    speedSelection.style.display = 'flex';

    // 重置速度选择状态
    speedBtns.forEach(btn => btn.classList.remove('selected'));
    confirmSpeedBtn.disabled = true;
    gameState.selectedSpeed = null;

    // 重置游戏状态
    initSnake();
    drawGame();
}

// 结束游戏
function endGame() {
    gameState.isGameOver = true;
    gameState.isGameStarted = false;

    if (gameState.speedMultiplierTimer) {
        clearTimeout(gameState.speedMultiplierTimer);
        gameState.speedMultiplierTimer = null;
    }

    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        highScoreDisplay.textContent = gameState.highScore;
    }

    gameOverDiv.style.display = 'block';
    finalScoreDisplay.textContent = gameState.score;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制网格线（可选）
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }

    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#38a169' : '#48bb78';
        ctx.fillRect(
            segment.x * CELL_SIZE + 2,
            segment.y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
        );
    });

    // 绘制食物
    if (gameState.food) {
        ctx.fillStyle = '#f56565';
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * CELL_SIZE + CELL_SIZE / 2,
            gameState.food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // 绘制特殊食物
    if (gameState.specialFood) {
        ctx.fillStyle = gameState.specialFood.type === 'speed' ? '#f56565' : '#4299e1';
        ctx.fillRect(
            gameState.specialFood.x * CELL_SIZE + 2,
            gameState.specialFood.y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
        );
    }

    // 绘制障碍物
    ctx.fillStyle = '#718096';
    gameState.obstacles.forEach(obstacle => {
        ctx.fillRect(
            obstacle.x * CELL_SIZE + 2,
            obstacle.y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
        );
    });
}

// 初始化游戏
initGame();
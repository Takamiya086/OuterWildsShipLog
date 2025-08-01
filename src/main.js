import Konva from "konva"
import graphData from './assets/data/graph-data.json'

// 1. 初始化舞台
const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
});
const layer = new Konva.Layer();
stage.add(layer);

// 内容组：统一承载节点和边（用于平移缩放）
const contentGroup = new Konva.Group({
    x: stage.width() / 2, // 初始居中
    y: stage.height() / 2,
    scaleX: 1,
    scaleY: 1,
})

// 节点组 和 连线组（边组）
const edgesGroup = new Konva.Group()
const nodesGroup = new Konva.Group()
contentGroup.add(edgesGroup)
contentGroup.add(nodesGroup)

// 2. 数据定义（按照颜色分区）
const nodeTypes = {
    purple: { color: '#8e44ad', label: '量子卫星探索' },
    orange: { color: '#f39c12', label: '灰烬双星计划' },
    green: { color: '#27ae60', label: '寻找宇宙之眼' },
    red: { color: '#e74c3c', label: '挪麦科技' },
    gray: { color: '#95a5a6', label: '过渡记录' },
};

const nodes = graphData.nodes.map(node => ({
    ...node,
    img: new URL(node.img, import.meta.url).href
}))
const edges = graphData.edges

// 3. 绘制网格背景方法
function drawGrid() {
    const gridSize = 50;
    const gridColor = '#1e2a3a';
    const lines = [];
    for (let x = 0; x < stage.width(); x += gridSize)
        lines.push(new Konva.Line({ points: [x, 0, x, stage.height()], stroke: gridColor, strokeWidth: 1 }));
    for (let y = 0; y < stage.height(); y += gridSize)
        lines.push(new Konva.Line({ points: [0, y, stage.width(), y], stroke: gridColor, strokeWidth: 1 }));
    layer.add(...lines);
}

// 4. 绘制节点方法
// 图片加载工具函数
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`图片加载失败：${src}`))
        img.src = src
    })
}

// 预加载所有节点图片
async function preloadNodeImages() {
    try {
        // 批量加载所有图片
        const imagePromises = nodes.map(node => loadImage(node.img))
        const images = await Promise.all(imagePromises)

        // 将加载好的图片绑定到对应节点
        nodes.forEach((node, index) => {
            node.image = images[index]
        })

        // 图片加载完成后绘制节点和边
        drawNodes()
        drawEdges()
    } catch (err) {
        console.error('图片预加载失败：', err)
    }
}
function drawNodes() {
    nodes.forEach(node => {
        // 节点容器组（位置由 node.x/node.y 决定）
        const group = new Konva.Group({
            x: node.x,
            y: node.y,
            id: node.id,
            cursor: 'pointer',
        })

        // ---------------------- 1. 标题栏区域 ----------------------
        const titleHeight = 24 // 标题栏高度
        const titleRect = new Konva.Rect({
            width: 120,          // 节点总宽度（可调整）
            height: titleHeight,
            fill: nodeTypes[node.type].color, // 标题栏背景色（匹配节点类型）
            stroke: '#fff',      // 白色边框
            strokeWidth: 1,
            shadowColor: nodeTypes[node.type].color, // 阴影颜色
            shadowBlur: 12,      // 阴影模糊度
            shadowOpacity: 0.6,  // 阴影透明度
            shadowOffsetX: 2,    // 阴影偏移（增强立体感）
            shadowOffsetY: 2,
        })

        const titleText = new Konva.Text({
            text: node.label,    // 标题文字（如“灰烬双星计划”）
            fontSize: 14,
            fill: '#fff',        // 文字白色
            align: 'center',     // 水平居中
            verticalAlign: 'middle', // 垂直居中
            width: 120,
            height: titleHeight,
            fontStyle: 'bold',   // 加粗
            fontFamily: '微软雅黑, sans-serif', // 中文适配字体
        })

        // ---------------------- 2. 内容区域（图片容器） ----------------------
        const contentHeight = 56 // 内容区高度（总节点高度=24+56=80）
        const contentRect = new Konva.Rect({
            y: titleHeight,      // 内容区在标题栏下方
            width: 120,
            height: contentHeight,
            fill: '#1a1a1a',     // 深色背景（匹配示例图风格）
            stroke: '#fff',      // 白色边框
            strokeWidth: 1,
        })

        // ---------------------- 3. 内容图片（适配+黑白滤镜） ----------------------
        const img = node.image // 预加载好的图片对象
        const containerW = 120 // 内容区宽度
        const containerH = contentHeight // 内容区高度

        // 计算图片缩放比例（保持比例，避免拉伸）
        const scale = Math.min(containerW / img.width, containerH / img.height)
        const drawW = img.width * scale // 图片绘制宽度
        const drawH = img.height * scale // 图片绘制高度
        const offsetX = (containerW - drawW) / 2 // 水平居中偏移
        const offsetY = (containerH - drawH) / 2 // 垂直居中偏移

        const contentImage = new Konva.Image({
            x: offsetX,          // 图片水平居中
            y: titleHeight + offsetY, // 图片垂直居中（在标题栏下方）
            width: drawW,
            height: drawH,
            image: img,
            filters: [Konva.Filters.Grayscale], // 黑白滤镜（匹配示例图风格）
            grayscale: 1,        // 全黑白（0=彩色，1=全灰）
            opacity: 0.9,        // 轻微透明（增强质感）
        })

        // ---------------------- 4. 交互效果（可选） ----------------------
        // 鼠标悬浮：阴影放大
        group.on('mouseover', () => {
            titleRect.shadowBlur(18)
            layer.batchDraw()
        })
        group.on('mouseout', () => {
            titleRect.shadowBlur(12)
            layer.batchDraw()
        })

        // 点击事件（保持原逻辑：显示详情）
        group.on('click', (e) => {
            e.cancelBubble = true
            showDetail(node)
        })

        // ---------------------- 5. 组装节点 ----------------------
        group.add(titleRect)
        group.add(titleText)
        group.add(contentRect)
        group.add(contentImage)
        nodesGroup.add(group)
    })
}


// 5. 绘制边方法
function drawEdges() {
    edges.forEach(edge => {
        const fromNode = contentGroup.findOne(`#${edge.from}`);
        const toNode = contentGroup.findOne(`#${edge.to}`);
        if (!fromNode || !toNode) return;

        // 节点中心坐标：用x()/y()获取位置（对应接口）
        const fromRect = fromNode.getClientRect();
        const toRect = toNode.getClientRect();
        const fromCenter = {
            x: fromNode.x() + fromRect.width / 2, // 对应接口：x(x)
            y: fromNode.y() + fromRect.height / 2, // 对应接口：y(y)
        };
        const toCenter = {
            x: toNode.x() + toRect.width / 2,
            y: toNode.y() + toRect.height / 2,
        };

        // 绘制边（不变）
        const line = new Konva.Line({
            points: [fromCenter.x, fromCenter.y, toCenter.x, toCenter.y],
            stroke: '#bfbfbf',
            strokeWidth: 2,
            lineCap: 'round',
            opacity: 0.7,
        });
        edgesGroup.add(line);
    });
}

// 统一绘制
drawGrid();
layer.add(contentGroup);
preloadNodeImages()

// 6. 平移交互
contentGroup.draggable(true)

// 7. 缩放交互（核心调整：手动实现鼠标中心缩放）
stage.on('wheel', (e) => {
    e.evt.preventDefault(); // 阻止页面滚动
    const stagePos = stage.getPointerPosition();
    if (!stagePos) return; // 防止鼠标位置为空

    // 1. 获取内容组当前状态（用接口获取）
    const contentPos = contentGroup.position(); // 当前位置
    const currentScaleX = contentGroup.scaleX(); // 当前X缩放（对应接口：scaleX(x)）
    const currentScaleY = contentGroup.scaleY(); // 当前Y缩放（对应接口：scaleY(y)）

    // 2. 计算鼠标在内容组内的**本地坐标**（去除缩放影响）
    const localX = (stagePos.x - contentPos.x) / currentScaleX;
    const localY = (stagePos.y - contentPos.y) / currentScaleY;

    // 3. 计算缩放因子（向上滚放大，向下缩小）
    const scaleFactor = e.evt.deltaY < 0 ? 1.1 : 0.9;
    const newScaleX = currentScaleX * scaleFactor;
    const newScaleY = currentScaleY * scaleFactor;

    // 4. 计算新位置：保持鼠标本地坐标不变（视觉上以鼠标为中心缩放）
    const newX = stagePos.x - localX * newScaleX;
    const newY = stagePos.y - localY * newScaleY;

    // 5. 应用新状态（用接口设置）
    contentGroup.scaleX(newScaleX); // 对应接口：scaleX(x)
    contentGroup.scaleY(newScaleY); // 对应接口：scaleY(y)
    contentGroup.position({ x: newX, y: newY }); // 对应接口：position(pos)

    layer.batchDraw();
});


// 8. 详情弹窗（用absolutePosition()接口获取绝对位置）
const popup = document.getElementById('detailPopup');
const popupContent = document.getElementById('popupContent');
function showDetail(node) {
    const popupY = window.innerHeight * 0.6;

    if (popupContent.textContent != node.content) {
        popupContent.textContent = node.content;
        popup.style.top = `${popupY}px`;
        popup.style.display = 'block'
    } else {
        popup.style.display = 'none'
        popupContent.textContent = ''
    }
}

// 点击空白处关闭弹窗
stage.on('click', () => { popup.style.display = 'none'; popupContent.textContent = '' });

// 9. 窗口resize适配
window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    layer.batchDraw();
});


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, RegularPolygon, Line, Star, Transformer } from 'react-konva';
import './App.css';

function App() {
  const stageRef = useRef();
  const transformerRef = useRef();
  const shapeRefs = useRef({});
  const shapeCounterRef = useRef({ rect: 1, circle: 1, text: 1, diamond: 1, triangle: 1, arrow: 1, star: 1 });
  const isSpacePressed = useRef(false);
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  useEffect(() => {
    if (selectedShapeId && transformerRef.current && shapeRefs.current[selectedShapeId]) {
      const node = shapeRefs.current[selectedShapeId];
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeId]);

  const [stageConfig, setStageConfig] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [shapes, setShapes] = useState([]);

  // 获取视口中心在画布坐标系中的位置
  const getViewportCenter = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 将屏幕中心点转换为画布坐标
    const centerX = (width / 2 - stage.x()) / stage.scaleX();
    const centerY = (height / 2 - stage.y()) / stage.scaleY();

    return { x: centerX, y: centerY };
  }, []);

  // 检查位置是否与其他图形重叠
  const checkOverlap = useCallback((x, y, width, height, excludeId = null) => {
    const padding = 20; // 图形之间的最小间距

    for (const shape of shapes) {
      if (shape.id === excludeId) continue;

      let shapeLeft, shapeRight, shapeTop, shapeBottom;

      if (shape.type === 'rect') {
        shapeLeft = shape.x - shape.width / 2;
        shapeRight = shape.x + shape.width / 2;
        shapeTop = shape.y - shape.height / 2;
        shapeBottom = shape.y + shape.height / 2;
      } else if (shape.type === 'circle') {
        shapeLeft = shape.x - shape.radius;
        shapeRight = shape.x + shape.radius;
        shapeTop = shape.y - shape.radius;
        shapeBottom = shape.y + shape.radius;
      } else if (shape.type === 'text') {
        shapeLeft = shape.x;
        shapeRight = shape.x + (shape.width || 100);
        shapeTop = shape.y;
        shapeBottom = shape.y + (shape.height || 30);
      } else if (shape.type === 'diamond') {
        shapeLeft = shape.x - shape.width / 2;
        shapeRight = shape.x + shape.width / 2;
        shapeTop = shape.y - shape.height / 2;
        shapeBottom = shape.y + shape.height / 2;
      } else if (shape.type === 'triangle') {
        shapeLeft = shape.x - shape.radius;
        shapeRight = shape.x + shape.radius;
        shapeTop = shape.y - shape.radius;
        shapeBottom = shape.y + shape.radius;
      } else if (shape.type === 'arrow') {
        shapeLeft = shape.x - shape.width / 2;
        shapeRight = shape.x + shape.width / 2;
        shapeTop = shape.y - shape.height / 2;
        shapeBottom = shape.y + shape.height / 2;
      } else if (shape.type === 'star') {
        shapeLeft = shape.x - shape.radius;
        shapeRight = shape.x + shape.radius;
        shapeTop = shape.y - shape.radius;
        shapeBottom = shape.y + shape.radius;
      }

      const newLeft = x - width / 2;
      const newRight = x + width / 2;
      const newTop = y - height / 2;
      const newBottom = y + height / 2;

      // 检查是否重叠
      if (
        newLeft < shapeRight + padding &&
        newRight > shapeLeft - padding &&
        newTop < shapeBottom + padding &&
        newBottom > shapeTop - padding
      ) {
        return true;
      }
    }
    return false;
  }, [shapes]);

  // 寻找不重叠的位置
  const findNonOverlappingPosition = useCallback((centerX, centerY, width, height) => {
    let x = centerX;
    let y = centerY;
    let offset = 0;
    let angle = 0;

    // 螺旋搜索，寻找不重叠的位置
    while (checkOverlap(x, y, width, height)) {
      offset += 30; // 每次增加偏移量
      angle += Math.PI / 4; // 每次旋转45度
      x = centerX + offset * Math.cos(angle);
      y = centerY + offset * Math.sin(angle);

      // 限制最大搜索范围
      if (offset > 500) break;
    }

    return { x, y };
  }, [checkOverlap]);

  // 添加矩形
  const addRectangle = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const width = 100;
    const height = 100;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.rect += 1;
    const newShape = {
      id: `rect${shapeCounterRef.current.rect}`,
      type: 'rect',
      x,
      y,
      width,
      height,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 添加圆形
  const addCircle = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const radius = 50;
    const width = radius * 2;
    const height = radius * 2;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.circle += 1;
    const newShape = {
      id: `circle${shapeCounterRef.current.circle}`,
      type: 'circle',
      x,
      y,
      radius,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 添加文本框
  const addText = useCallback((clickX, clickY) => {
    const x = clickX;
    const y = clickY;

    shapeCounterRef.current.text += 1;
    const newShape = {
      id: `text${shapeCounterRef.current.text}`,
      type: 'text',
      x,
      y,
      text: '双击编辑文本',
      fontSize: 16,
      fill: '#333',
      draggable: true,
      width: 150,
    };

    setShapes((prev) => [...prev, newShape]);
  }, []);

  // 添加菱形
  const addDiamond = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const width = 100;
    const height = 100;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.diamond += 1;
    const newShape = {
      id: `diamond${shapeCounterRef.current.diamond}`,
      type: 'diamond',
      x,
      y,
      width,
      height,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 添加三角形
  const addTriangle = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const radius = 60;
    const width = radius * 2;
    const height = radius * 2;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.triangle += 1;
    const newShape = {
      id: `triangle${shapeCounterRef.current.triangle}`,
      type: 'triangle',
      x,
      y,
      radius,
      sides: 3,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 添加箭头
  const addArrow = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const width = 120;
    const height = 60;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.arrow += 1;
    const newShape = {
      id: `arrow${shapeCounterRef.current.arrow}`,
      type: 'arrow',
      x,
      y,
      width,
      height,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 添加星形
  const addStar = useCallback(() => {
    const { x: centerX, y: centerY } = getViewportCenter();
    const radius = 60;
    const width = radius * 2;
    const height = radius * 2;

    const { x, y } = findNonOverlappingPosition(centerX, centerY, width, height);

    shapeCounterRef.current.star += 1;
    const newShape = {
      id: `star${shapeCounterRef.current.star}`,
      type: 'star',
      x,
      y,
      radius,
      numPoints: 5,
      innerRadius: radius / 2,
      outerRadius: radius,
      stroke: '#333',
      strokeWidth: 2,
      draggable: true,
    };

    setShapes((prev) => [...prev, newShape]);
  }, [getViewportCenter, findNonOverlappingPosition]);

  // 处理画布点击事件（添加文本框）
  const [isTextMode, setIsTextMode] = useState(false);
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedShapeId(null);
      if (isTextMode) {
        const stage = stageRef.current;
        const pointer = stage.getPointerPosition();
        const x = (pointer.x - stage.x()) / stage.scaleX();
        const y = (pointer.y - stage.y()) / stage.scaleY();
        addText(x, y);
        setIsTextMode(false);
      }
    }
  }, [isTextMode, addText]);

  // 处理文本编辑
  const handleTextDblClick = useCallback((shape) => {
    const textNode = shape;
    const stage = stageRef.current;

    // 创建 textarea 进行编辑
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const textPosition = textNode.absolutePosition();
    const areaPosition = {
      x: stage.container().offsetLeft + textPosition.x,
      y: stage.container().offsetTop + textPosition.y,
    };

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() * stage.scaleX()}px`;
    textarea.style.height = `${textNode.height() * stage.scaleY()}px`;
    textarea.style.fontSize = `${textNode.fontSize() * stage.scaleX()}px`;
    textarea.style.border = '1px solid #333';
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    textarea.style.zIndex = '10000';

    textarea.focus();

    const removeTextarea = () => {
      const newText = textarea.value;
      document.body.removeChild(textarea);
      setShapes((prev) =>
        prev.map((s) =>
          s.id === shape.id() ? { ...s, text: newText } : s
        )
      );
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        textarea.blur();
      }
    });
  }, []);

  // --- 无限画布核心逻辑 ---
  const [isPanning, setIsPanning] = useState(false); // 是否正在平移
  const lastPointerPosition = useRef({ x: 0, y: 0 }); // 记录平移开始时的鼠标位置

  // 鼠标滚轮缩放
  const handleWheel = (e) => {
    e.evt.preventDefault(); // 阻止页面滚动

    const scaleBy = 1.1; // 缩放因子
    const stage = stageRef.current;
    const oldScale = stage.scaleX(); // 当前缩放值

    // 获取鼠标在 Stage 上的绝对坐标
    const pointer = stage.getPointerPosition();

    // 计算鼠标在 Stage 上的相对坐标 (相对于当前缩放和平移)
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // 根据滚轮方向确定新缩放值
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // 计算新的 Stage 位置，以保持鼠标位置不变
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageConfig({
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
  };

  // 鼠标按下事件 (用于平移)
  const handleMouseDown = (e) => {
    // 只有在按下空格键时才开始平移
    if (isSpacePressed.current) {
      setIsPanning(true);
      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      // 阻止默认行为，避免拖拽图形
      e.evt.preventDefault();
    }
  };

  // 鼠标移动事件 (用于平移)
  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastPointerPosition.current.x;
      const dy = e.evt.clientY - lastPointerPosition.current.y;

      setStageConfig((prevConfig) => ({
        ...prevConfig,
        x: prevConfig.x + dx,
        y: prevConfig.y + dy,
      }));

      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  };

  // 鼠标抬起事件 (结束平移)
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // 鼠标离开 Stage 区域时，也结束平移
  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // 监听键盘事件，当按下空格键时，改变鼠标样式
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = true;
        if (!isPanning) {
          document.body.style.cursor = 'grab'; // 变成抓手图标
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        document.body.style.cursor = 'default'; // 恢复默认图标
        setIsPanning(false); // 确保松开空格键时平移停止
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]); // isPanning 变化时重新绑定，确保状态正确

  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <div className="toolbar">
        <div className="toolbar-title">InfiniteBoard</div>
        <div className="toolbar-buttons">
          <button className="toolbar-btn" onClick={addRectangle}>
            <span className="btn-icon">▭</span>
            矩形
          </button>
          <button className="toolbar-btn" onClick={addCircle}>
            <span className="btn-icon">○</span>
            圆形
          </button>
          <button className="toolbar-btn" onClick={addDiamond}>
            <span className="btn-icon">◊</span>
            菱形
          </button>
          <button className="toolbar-btn" onClick={addTriangle}>
            <span className="btn-icon">△</span>
            三角形
          </button>
          <button className="toolbar-btn" onClick={addArrow}>
            <span className="btn-icon">→</span>
            箭头
          </button>
          <button className="toolbar-btn" onClick={addStar}>
            <span className="btn-icon">★</span>
            星形
          </button>
          <button
            className={`toolbar-btn ${isTextMode ? 'active' : ''}`}
            onClick={() => setIsTextMode(!isTextMode)}
          >
            <span className="btn-icon">T</span>
            {isTextMode ? '点击画布添加文本' : '文本'}
          </button>
        </div>
        <div className="toolbar-hint">按住空格键拖拽画布</div>
      </div>

      <Stage
        ref={stageRef} // 绑定 ref
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        x={stageConfig.x}
        y={stageConfig.y}
        onWheel={handleWheel} // 监听滚轮事件
        onMouseDown={handleMouseDown} // 监听鼠标按下
        onMouseMove={handleMouseMove} // 监听鼠标移动
        onMouseUp={handleMouseUp} // 监听鼠标抬起
        onMouseLeave={handleMouseLeave} // 监听鼠标离开
        onClick={handleStageClick} // 监听点击事件（用于添加文本）
        // 根据是否在平移或文本模式，设置 Stage 的样式
        style={{ cursor: isPanning ? 'grabbing' : isTextMode ? 'crosshair' : 'default' }}
      >
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === 'rect') {
              return (
                <Rect
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, node.width() * scaleX),
                            height: Math.max(5, node.height() * scaleY),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            radius: Math.max(5, s.radius * Math.max(scaleX, scaleY)),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'text') {
              return (
                <Text
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={shape.fontSize}
                  fill={shape.fill}
                  draggable={shape.draggable}
                  width={shape.width}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDblClick={(e) => handleTextDblClick(e.target)}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, node.width() * scaleX),
                            fontSize: Math.max(5, Math.round(s.fontSize * scaleY)),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'diamond') {
              const diamondPoints = [
                0, -shape.height / 2,
                shape.width / 2, 0,
                0, shape.height / 2,
                -shape.width / 2, 0,
              ];
              return (
                <Line
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  points={diamondPoints}
                  closed={true}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, s.width * scaleX),
                            height: Math.max(5, s.height * scaleY),
                            rotation: node.rotation(),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'triangle') {
              return (
                <RegularPolygon
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  sides={3}
                  radius={shape.radius}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            radius: Math.max(5, s.radius * Math.max(scaleX, scaleY)),
                            rotation: node.rotation(),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'arrow') {
              const arrowPoints = [
                -shape.width / 2, -shape.height / 4,
                shape.width / 4, -shape.height / 4,
                shape.width / 4, -shape.height / 2,
                shape.width / 2, 0,
                shape.width / 4, shape.height / 2,
                shape.width / 4, shape.height / 4,
                -shape.width / 2, shape.height / 4,
              ];
              return (
                <Line
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  points={arrowPoints}
                  closed={true}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, s.width * scaleX),
                            height: Math.max(5, s.height * scaleY),
                            rotation: node.rotation(),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            } else if (shape.type === 'star') {
              return (
                <Star
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  numPoints={shape.numPoints}
                  innerRadius={shape.innerRadius}
                  outerRadius={shape.outerRadius}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={shape.draggable}
                  onClick={(e) => {
                    if (!isPanning) {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedShapeId(shape.id);
                  }}
                  onDragEnd={(e) => {
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? { ...s, x: e.target.x(), y: e.target.y() }
                          : s
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes((prevShapes) =>
                      prevShapes.map((s) =>
                        s.id === shape.id
                          ? {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            innerRadius: Math.max(5, s.innerRadius * Math.max(scaleX, scaleY)),
                            outerRadius: Math.max(5, s.outerRadius * Math.max(scaleX, scaleY)),
                            rotation: node.rotation(),
                          }
                          : s
                      )
                    );
                  }}
                  onMouseDown={(e) => {
                    if (isPanning) {
                      e.cancelBubble = true;
                    }
                  }}
                />
              );
            }
            return null;
          })}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'middle-left',
              'middle-right',
              'top-center',
              'bottom-center',
            ]}
            rotateEnabled={true}
            anchorSize={10}
            anchorCornerRadius={3}
            anchorStroke="#00A3FF"
            anchorFill="#FFFFFF"
            anchorStrokeWidth={2}
            borderStroke="#00A3FF"
            borderStrokeWidth={2}
            borderDash={[4, 4]}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
import { useState, useRef, useEffect, useCallback } from 'react';

// 自动计算合适的缩放限制
const getScaleLimits = () => {
  // 根据屏幕大小调整缩放限制
  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  // 最小缩放：确保能看到足够大的区域（约 10 倍屏幕大小）
  const MIN_SCALE = Math.max(0.05, 100 / minDimension);
  // 最大缩放：限制在 500%，避免过度放大
  const MAX_SCALE = 5;
  return { MIN_SCALE, MAX_SCALE };
};

// 自动计算合适的画布大小（基于屏幕尺寸）
const getCanvasExtent = () => {
  const baseSize = Math.max(window.innerWidth, window.innerHeight);
  // 画布范围：屏幕尺寸的 5 倍，提供足够的工作空间
  return baseSize * 5;
};

export const useCanvas = (stageRef) => {
  const { MIN_SCALE, MAX_SCALE } = getScaleLimits();
  const CANVAS_EXTENT = getCanvasExtent();

  const [stageConfig, setStageConfig] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [canvasExtent] = useState(CANVAS_EXTENT);
  const isSpacePressed = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const constrainPosition = useCallback((x, y, scale) => {
    // 计算画布边界（考虑缩放后）
    const halfExtent = canvasExtent / 2;
    const viewportWidth = window.innerWidth / scale;
    const viewportHeight = window.innerHeight / scale;

    // 允许视口中心在画布范围内移动
    const minX = -halfExtent * scale + viewportWidth * 0.1;
    const maxX = halfExtent * scale - viewportWidth * 0.1;
    const minY = -halfExtent * scale + viewportHeight * 0.1;
    const maxY = halfExtent * scale - viewportHeight * 0.1;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, [canvasExtent]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // 限制缩放范围
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    // 如果缩放没有变化（到达边界），则不更新
    if (newScale === oldScale) return;

    let newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // 限制位置在画布范围内
    newPos = constrainPosition(newPos.x, newPos.y, newScale);

    setStageConfig({
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
  }, [MIN_SCALE, MAX_SCALE, constrainPosition]);

  const handleMouseDown = useCallback((e) => {
    if (isSpacePressed.current) {
      setIsPanning(true);
      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastPointerPosition.current.x;
      const dy = e.evt.clientY - lastPointerPosition.current.y;

      setStageConfig((prevConfig) => {
        const newX = prevConfig.x + dx;
        const newY = prevConfig.y + dy;

        // 限制平移范围
        const constrained = constrainPosition(newX, newY, prevConfig.scale);

        return {
          ...prevConfig,
          x: constrained.x,
          y: constrained.y,
        };
      });

      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }, [isPanning, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = true;
        if (!isPanning) {
          document.body.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        document.body.style.cursor = 'default';
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  // 重置视图到中心
  const resetView = useCallback(() => {
    setStageConfig({
      scale: 1,
      x: 0,
      y: 0,
    });
  }, []);

  // 适应全部内容
  const fitToContent = useCallback((shapes) => {
    if (!shapes || shapes.length === 0) {
      resetView();
      return;
    }

    // 计算所有形状的边界框
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    shapes.forEach((shape) => {
      const size = Math.max(shape.width || 100, shape.height || 100, shape.radius * 2 || 100);
      minX = Math.min(minX, shape.x - size / 2);
      minY = Math.min(minY, shape.y - size / 2);
      maxX = Math.max(maxX, shape.x + size / 2);
      maxY = Math.max(maxY, shape.y + size / 2);
    });

    // 添加边距
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // 计算合适的缩放比例
    const scaleX = window.innerWidth / contentWidth;
    const scaleY = window.innerHeight / contentHeight;
    let newScale = Math.min(scaleX, scaleY);

    // 限制缩放范围
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    // 最小缩放为 0.1，确保不会缩得太小
    newScale = Math.max(0.1, Math.min(newScale, 1));

    // 计算居中位置
    const newX = (window.innerWidth - contentWidth * newScale) / 2 - minX * newScale;
    const newY = (window.innerHeight - contentHeight * newScale) / 2 - minY * newScale;

    setStageConfig({
      scale: newScale,
      x: newX,
      y: newY,
    });
  }, [MIN_SCALE, MAX_SCALE, resetView]);

  return {
    stageConfig,
    isPanning,
    isSpacePressed,
    canvasExtent,
    scaleLimits: { MIN_SCALE, MAX_SCALE },
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetView,
    fitToContent,
  };
};

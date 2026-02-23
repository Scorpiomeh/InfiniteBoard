import React from 'react';
import { Layer, Rect, Circle, Line } from 'react-konva';

export const BACKGROUND_TYPES = {
  DOT: 'dot',
  GRID: 'grid',
  BLANK: 'blank',
};

const Background = ({ stageConfig, type = BACKGROUND_TYPES.DOT }) => {
  const scale = stageConfig.scale;
  const offsetX = stageConfig.x;
  const offsetY = stageConfig.y;

  // 根据缩放级别动态调整网格大小，避免过于密集
  let baseGridSize = 20;
  if (scale < 0.3) {
    baseGridSize = 60;
  } else if (scale < 0.6) {
    baseGridSize = 40;
  } else if (scale > 2) {
    baseGridSize = 10;
  }
  const gridSize = baseGridSize * scale;
  
  // 计算可见区域
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 计算起始和结束位置（考虑偏移和缩放）
  const startX = Math.floor(-offsetX / gridSize) * gridSize + offsetX;
  const startY = Math.floor(-offsetY / gridSize) * gridSize + offsetY;
  const endX = startX + viewportWidth + gridSize * 2;
  const endY = startY + viewportHeight + gridSize * 2;

  if (type === BACKGROUND_TYPES.BLANK) {
    return (
      <Layer listening={false}>
        <Rect
          x={-offsetX / scale}
          y={-offsetY / scale}
          width={viewportWidth / scale}
          height={viewportHeight / scale}
          fill="#f5f5f5"
        />
      </Layer>
    );
  }

  if (type === BACKGROUND_TYPES.DOT) {
    const dots = [];
    const dotRadius = 1.5;
    const dotColor = '#cccccc';
    
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        // 将屏幕坐标转换为画布坐标
        const canvasX = (x - offsetX) / scale;
        const canvasY = (y - offsetY) / scale;
        
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            x={canvasX}
            y={canvasY}
            radius={dotRadius}
            fill={dotColor}
            listening={false}
          />
        );
      }
    }
    
    return (
      <Layer listening={false}>
        <Rect
          x={-offsetX / scale}
          y={-offsetY / scale}
          width={viewportWidth / scale}
          height={viewportHeight / scale}
          fill="#f5f5f5"
        />
        {dots}
      </Layer>
    );
  }

  if (type === BACKGROUND_TYPES.GRID) {
    const lines = [];
    const lineColor = '#e0e0e0';
    const lineWidth = 1;
    
    // 垂直线
    for (let x = startX; x < endX; x += gridSize) {
      const canvasX = (x - offsetX) / scale;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[
            canvasX,
            (-offsetY) / scale,
            canvasX,
            (viewportHeight - offsetY) / scale,
          ]}
          stroke={lineColor}
          strokeWidth={lineWidth}
          listening={false}
        />
      );
    }
    
    // 水平线
    for (let y = startY; y < endY; y += gridSize) {
      const canvasY = (y - offsetY) / scale;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[
            (-offsetX) / scale,
            canvasY,
            (viewportWidth - offsetX) / scale,
            canvasY,
          ]}
          stroke={lineColor}
          strokeWidth={lineWidth}
          listening={false}
        />
      );
    }
    
    return (
      <Layer listening={false}>
        <Rect
          x={-offsetX / scale}
          y={-offsetY / scale}
          width={viewportWidth / scale}
          height={viewportHeight / scale}
          fill="#f5f5f5"
        />
        {lines}
      </Layer>
    );
  }

  return null;
};

export default Background;

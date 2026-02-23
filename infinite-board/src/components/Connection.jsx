import React, { memo } from 'react';
import { Line, Arrow } from 'react-konva';
import {
  CONNECTION_TYPES,
  getConnectionAnchorPoint,
  getAngleBetweenPoints,
  getArrowHeadPoints,
} from '../utils/shapeUtils';

const Connection = memo(({ connection, shapes, isSelected, onSelect, isDrawing = false }) => {
  const fromShape = shapes.find((s) => s.id === connection.fromShapeId);
  const toShape = shapes.find((s) => s.id === connection.toShapeId);

  if (!fromShape || !toShape) return null;

  const fromPoint = getConnectionAnchorPoint(fromShape, connection.fromAnchor);
  const toPoint = getConnectionAnchorPoint(toShape, connection.toAnchor);

  const points = [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y];

  const handleClick = (e) => {
    if (!isDrawing) {
      e.cancelBubble = true;
      onSelect?.(connection.id);
    }
  };

  // 如果是箭头类型，计算箭头角度
  const angle = getAngleBetweenPoints(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
  const arrowPoints = getArrowHeadPoints(toPoint.x, toPoint.y, angle, 12);

  return (
    <>
      {/* 连接线主体 */}
      <Line
        points={points}
        stroke={isSelected ? '#00A3FF' : connection.stroke}
        strokeWidth={connection.strokeWidth}
        hitStrokeWidth={10}
        onClick={handleClick}
        onTap={handleClick}
        listening={!isDrawing}
      />
      
      {/* 如果是箭头类型，绘制箭头头部 */}
      {connection.type === CONNECTION_TYPES.ARROW && (
        <Line
          points={arrowPoints}
          closed={true}
          fill={isSelected ? '#00A3FF' : connection.stroke}
          stroke={isSelected ? '#00A3FF' : connection.stroke}
          strokeWidth={1}
          listening={false}
        />
      )}
      
      {/* 选中时显示高亮效果 */}
      {isSelected && (
        <Line
          points={points}
          stroke="#00A3FF"
          strokeWidth={connection.strokeWidth + 4}
          opacity={0.3}
          listening={false}
        />
      )}
    </>
  );
});

Connection.displayName = 'Connection';

export default Connection;

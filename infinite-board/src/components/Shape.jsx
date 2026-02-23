import React, { useCallback, forwardRef, memo, useMemo } from 'react';
import { Rect, Circle, Text, RegularPolygon, Line, Star, Group } from 'react-konva';
import { SHAPE_TYPES, getDiamondPoints, getArrowPoints, CONNECTION_ANCHORS, getShapeBounds } from '../utils/shapeUtils';

const ANCHOR_SIZE = 6;
const ANCHOR_COLOR = '#00A3FF';
const ANCHOR_HOVER_COLOR = '#FF6B6B';

const Shape = memo(forwardRef(({ 
  shape, 
  onSelect, 
  onDragEnd, 
  onTransformEnd, 
  onDblClick, 
  isPanning,
  isConnectionMode,
  isSelected,
  onAnchorClick,
  hoveredAnchor,
  onAnchorHover,
}, ref) => {
  const handleClick = useCallback((e) => {
    if (!isPanning && !isConnectionMode) {
      e.cancelBubble = true;
      onSelect(shape.id);
    }
  }, [isPanning, isConnectionMode, onSelect, shape.id]);

  const handleDragEnd = useCallback((e) => {
    onDragEnd(shape.id, e.target.x(), e.target.y());
  }, [shape.id, onDragEnd]);

  const handleTransformEnd = useCallback((e) => {
    onTransformEnd(shape.id, e.target);
  }, [shape.id, onTransformEnd]);

  const handleMouseDown = useCallback((e) => {
    if (isPanning) {
      e.cancelBubble = true;
    }
  }, [isPanning]);

  // 获取图形的边界
  const bounds = useMemo(() => getShapeBounds(shape), [shape]);

  // 计算锚点位置
  const anchors = useMemo(() => {
    return {
      [CONNECTION_ANCHORS.TOP]: { x: shape.x, y: bounds.top },
      [CONNECTION_ANCHORS.BOTTOM]: { x: shape.x, y: bounds.bottom },
      [CONNECTION_ANCHORS.LEFT]: { x: bounds.left, y: shape.y },
      [CONNECTION_ANCHORS.RIGHT]: { x: bounds.right, y: shape.y },
      [CONNECTION_ANCHORS.CENTER]: { x: shape.x, y: shape.y },
    };
  }, [shape, bounds]);

  // 渲染锚点
  const renderAnchors = () => {
    if (!isConnectionMode) return null;

    return Object.entries(anchors).map(([anchor, pos]) => {
      const isHovered = hoveredAnchor?.shapeId === shape.id && hoveredAnchor?.anchor === anchor;
      return (
        <Circle
          key={anchor}
          x={pos.x}
          y={pos.y}
          radius={ANCHOR_SIZE / (anchor === CONNECTION_ANCHORS.CENTER ? 1.5 : 1)}
          fill={isHovered ? ANCHOR_HOVER_COLOR : ANCHOR_COLOR}
          stroke="white"
          strokeWidth={2}
          listening={true}
          onClick={(e) => {
            e.cancelBubble = true;
            onAnchorClick(shape.id, anchor);
          }}
          onMouseEnter={() => onAnchorHover(shape.id, anchor)}
          onMouseLeave={() => onAnchorHover(null, null)}
        />
      );
    });
  };

  const commonProps = {
    ref,
    id: shape.id,
    x: shape.x,
    y: shape.y,
    draggable: shape.draggable && !isConnectionMode,
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onMouseDown: handleMouseDown,
  };

  // 渲染选中状态的边框
  const renderSelection = () => {
    if (!isSelected || isConnectionMode) return null;
    
    const padding = 4;
    const width = bounds.right - bounds.left + padding * 2;
    const height = bounds.bottom - bounds.top + padding * 2;
    
    return (
      <Rect
        x={bounds.left - padding}
        y={bounds.top - padding}
        width={width}
        height={height}
        stroke="#00A3FF"
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
      />
    );
  };

  const renderShape = () => {
    switch (shape.type) {
      case SHAPE_TYPES.RECT:
        return (
          <Rect
            {...commonProps}
            width={shape.width}
            height={shape.height}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
          />
        );

      case SHAPE_TYPES.CIRCLE:
        return (
          <Circle
            {...commonProps}
            radius={shape.radius}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      case SHAPE_TYPES.TEXT:
        return (
          <Text
            {...commonProps}
            text={shape.text}
            fontSize={shape.fontSize}
            fill={shape.fill}
            width={shape.width}
            onDblClick={(e) => onDblClick(e.target)}
          />
        );

      case SHAPE_TYPES.DIAMOND:
        return (
          <Line
            {...commonProps}
            points={getDiamondPoints(shape.width, shape.height)}
            closed={true}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      case SHAPE_TYPES.TRIANGLE:
        return (
          <RegularPolygon
            {...commonProps}
            sides={3}
            radius={shape.radius}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      case SHAPE_TYPES.ARROW:
        return (
          <Line
            {...commonProps}
            points={getArrowPoints(shape.width, shape.height)}
            closed={true}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      case SHAPE_TYPES.STAR:
        return (
          <Star
            {...commonProps}
            numPoints={shape.numPoints}
            innerRadius={shape.innerRadius}
            outerRadius={shape.outerRadius}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderSelection()}
      {renderShape()}
      {renderAnchors()}
    </>
  );
}));

Shape.displayName = 'Shape';

export default Shape;

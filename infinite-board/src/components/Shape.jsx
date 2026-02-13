import React, { useCallback, forwardRef } from 'react';
import { Rect, Circle, Text, RegularPolygon, Line, Star } from 'react-konva';
import { SHAPE_TYPES, getDiamondPoints, getArrowPoints } from '../utils/shapeUtils';

const Shape = forwardRef(({ shape, onSelect, onDragEnd, onTransformEnd, onDblClick, isPanning }, ref) => {
  const handleClick = useCallback((e) => {
    if (!isPanning) {
      e.cancelBubble = true;
      onSelect(shape.id);
    }
  }, [isPanning, onSelect, shape.id]);

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

  const commonProps = {
    ref,
    id: shape.id,
    x: shape.x,
    y: shape.y,
    draggable: shape.draggable,
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onMouseDown: handleMouseDown,
  };

  switch (shape.type) {
    case SHAPE_TYPES.RECT:
      return (
        <Rect
          {...commonProps}
          width={shape.width}
          height={shape.height}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
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
});

Shape.displayName = 'Shape';

export default Shape;

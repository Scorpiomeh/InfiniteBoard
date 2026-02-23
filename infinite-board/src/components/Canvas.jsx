import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Stage, Layer, Transformer, Rect, Line } from 'react-konva';
import Shape from './Shape';
import Connection from './Connection';
import Background from './Background';
import DrawingLayer from './DrawingLayer';
import { SHAPE_TYPES, isShapeInViewport, getConnectionAnchorPoint } from '../utils/shapeUtils';

const Canvas = forwardRef(({
  stageConfig,
  isPanning,
  shapes,
  connections,
  selectedShapeId,
  selectedConnectionId,
  isTextMode,
  isConnectionMode,
  connectionStart,
  tempConnection,
  backgroundType,
  canvasSize,
  canvasExtent,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onStageClick,
  onSelectShape,
  onSelectConnection,
  onDragEnd,
  onTransformEnd,
  onTextDblClick,
  onAnchorClick,
  isDrawingMode,
  strokes,
  onStrokesChange,
  strokeColor,
  strokeWidth,
}, ref) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const shapeRefs = useRef({});
  const [hoveredAnchor, setHoveredAnchor] = useState(null);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    getPointerPosition: () => stageRef.current?.getPointerPosition(),
    getScale: () => stageRef.current?.scaleX(),
    getPosition: () => ({ x: stageRef.current?.x(), y: stageRef.current?.y() }),
    getViewportCenter: () => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const width = canvasSize.width;
      const height = canvasSize.height;
      const centerX = (width / 2 - stage.x()) / stage.scaleX();
      const centerY = (height / 2 - stage.y()) / stage.scaleY();
      return { x: centerX, y: centerY };
    },
  }));

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

  const handleTextDblClick = useCallback((textNode) => {
    const stage = stageRef.current;

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
      onTextDblClick(textNode.id(), newText);
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        textarea.blur();
      }
    });
  }, [onTextDblClick]);

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage() && !isDrawingMode) {
      onStageClick(e);
    }
  }, [onStageClick, isDrawingMode]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (isDrawingMode) return;
    onMouseMove(e);
  }, [onMouseMove, isDrawingMode]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e) => {
    if (isDrawingMode) return;
    onMouseDown(e);
  }, [onMouseDown, isDrawingMode]);

  // 处理鼠标松开
  const handleMouseUp = useCallback((e) => {
    if (isDrawingMode) return;
    onMouseUp(e);
  }, [onMouseUp, isDrawingMode]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback((e) => {
    if (isDrawingMode) return;
    onMouseLeave(e);
  }, [onMouseLeave, isDrawingMode]);

  // 获取临时连线的点
  const getTempConnectionPoints = useCallback(() => {
    if (!tempConnection || !connectionStart) return null;
    
    const fromShape = shapes.find((s) => s.id === connectionStart.shapeId);
    if (!fromShape) return null;
    
    const fromPoint = getConnectionAnchorPoint(fromShape, connectionStart.anchor);
    return [fromPoint.x, fromPoint.y, tempConnection.x, tempConnection.y];
  }, [tempConnection, connectionStart, shapes]);

  const viewport = useMemo(() => {
    const scale = stageConfig.scale;
    const stageX = stageConfig.x;
    const stageY = stageConfig.y;
    const width = canvasSize.width;
    const height = canvasSize.height;

    return {
      left: -stageX / scale,
      right: (width - stageX) / scale,
      top: -stageY / scale,
      bottom: (height - stageY) / scale,
    };
  }, [stageConfig, canvasSize]);

  const visibleShapes = useMemo(() => {
    return shapes.filter((shape) => isShapeInViewport(shape, viewport));
  }, [shapes, viewport]);

  useEffect(() => {
    const currentIds = new Set(shapes.map((s) => s.id));
    Object.keys(shapeRefs.current).forEach((id) => {
      if (!currentIds.has(id)) {
        delete shapeRefs.current[id];
      }
    });
  }, [shapes]);

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      scaleX={stageConfig.scale}
      scaleY={stageConfig.scale}
      x={stageConfig.x}
      y={stageConfig.y}
      onWheel={onWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleStageClick}
      style={{
        cursor: isPanning ? 'grabbing' : isTextMode ? 'crosshair' : isConnectionMode ? 'crosshair' : isDrawingMode ? 'crosshair' : 'default',
      }}
    >
      <Background stageConfig={stageConfig} type={backgroundType} />
      {/* 画布边界指示器 */}
      <Layer listening={false}>
        <Rect
          x={-canvasExtent / 2}
          y={-canvasExtent / 2}
          width={canvasExtent}
          height={canvasExtent}
          stroke="#00A3FF"
          strokeWidth={2 / stageConfig.scale}
          dash={[10 / stageConfig.scale, 5 / stageConfig.scale]}
          opacity={0.3}
        />
      </Layer>
      
      {/* 画笔图层 */}
      <DrawingLayer
        isDrawingMode={isDrawingMode}
        stageConfig={stageConfig}
        strokes={strokes}
        onStrokesChange={onStrokesChange}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      <Layer>
        {/* 渲染连接线 */}
        {connections.map((connection) => (
          <Connection
            key={connection.id}
            connection={connection}
            shapes={shapes}
            isSelected={connection.id === selectedConnectionId}
            onSelect={onSelectConnection}
          />
        ))}
        
        {/* 渲染临时连线（拖拽中） */}
        {isConnectionMode && tempConnection && (
          <Line
            points={getTempConnectionPoints()}
            stroke="#00A3FF"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
        )}
        
        {visibleShapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            ref={(node) => {
              if (node) {
                shapeRefs.current[shape.id] = node;
              }
            }}
            onSelect={onSelectShape}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
            onDblClick={shape.type === SHAPE_TYPES.TEXT ? handleTextDblClick : undefined}
            isPanning={isPanning}
            isConnectionMode={isConnectionMode}
            isSelected={shape.id === selectedShapeId}
            onAnchorClick={onAnchorClick}
            hoveredAnchor={hoveredAnchor}
            onAnchorHover={setHoveredAnchor}
          />
        ))}
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
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

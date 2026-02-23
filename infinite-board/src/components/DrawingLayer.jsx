import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layer, Line, Rect } from 'react-konva';

const DrawingLayer = ({
  isDrawingMode,
  stageConfig,
  strokes,
  onStrokesChange,
  strokeColor,
  strokeWidth,
}) => {
  const [currentStroke, setCurrentStroke] = useState(null);
  const isDrawingRef = useRef(false);
  const layerRef = useRef(null);

  const getPointerPosition = useCallback((stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current || !isDrawingMode) return;
    
    const layer = layerRef.current;
    const stage = layer.getStage();
    
    const handleMouseDown = () => {
      const pos = getPointerPosition(stage);
      if (!pos) return;
      
      isDrawingRef.current = true;
      setCurrentStroke({
        points: [pos.x, pos.y],
        color: strokeColor,
        width: strokeWidth,
        id: `stroke-${Date.now()}`,
      });
    };
    
    const handleMouseMove = () => {
      if (!isDrawingRef.current) return;
      
      const pos = getPointerPosition(stage);
      if (!pos) return;
      
      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, pos.x, pos.y],
        };
      });
    };
    
    const handleMouseUp = () => {
      if (!isDrawingRef.current) return;
      
      isDrawingRef.current = false;
      setCurrentStroke((prev) => {
        if (prev && prev.points.length > 2) {
          onStrokesChange((strokes) => [...strokes, prev]);
        }
        return null;
      });
    };
    
    stage.on('mousedown.drawing', handleMouseDown);
    stage.on('mousemove.drawing', handleMouseMove);
    stage.on('mouseup.drawing', handleMouseUp);
    
    return () => {
      stage.off('mousedown.drawing');
      stage.off('mousemove.drawing');
      stage.off('mouseup.drawing');
    };
  }, [isDrawingMode, strokeColor, strokeWidth, getPointerPosition, onStrokesChange]);

  if (!isDrawingMode && strokes.length === 0 && !currentStroke) {
    return null;
  }

  // 计算覆盖整个画布的矩形
  const canvasExtent = 10000;

  return (
    <Layer ref={layerRef} listening={false}>
      {/* 透明背景矩形用于接收事件 */}
      {isDrawingMode && (
        <Rect
          x={-canvasExtent / 2}
          y={-canvasExtent / 2}
          width={canvasExtent}
          height={canvasExtent}
          fill="transparent"
          listening={true}
        />
      )}
      {strokes.map((stroke) => (
        <Line
          key={stroke.id}
          points={stroke.points}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
      {currentStroke && (
        <Line
          points={currentStroke.points}
          stroke={currentStroke.color}
          strokeWidth={currentStroke.width}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </Layer>
  );
};

export default DrawingLayer;

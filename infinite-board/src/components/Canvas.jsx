import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Shape from './Shape';
import { SHAPE_TYPES } from '../utils/shapeUtils';

const Canvas = forwardRef(({
  stageConfig,
  isPanning,
  shapes,
  selectedShapeId,
  isTextMode,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onStageClick,
  onSelectShape,
  onDragEnd,
  onTransformEnd,
  onTextDblClick,
}, ref) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const shapeRefs = useRef({});

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    getPointerPosition: () => stageRef.current?.getPointerPosition(),
    getScale: () => stageRef.current?.scaleX(),
    getPosition: () => ({ x: stageRef.current?.x(), y: stageRef.current?.y() }),
    getViewportCenter: () => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const width = window.innerWidth;
      const height = window.innerHeight;
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
    if (e.target === e.target.getStage()) {
      onStageClick(e);
    }
  }, [onStageClick]);

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={stageConfig.scale}
      scaleY={stageConfig.scale}
      x={stageConfig.x}
      y={stageConfig.y}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={handleStageClick}
      style={{
        cursor: isPanning ? 'grabbing' : isTextMode ? 'crosshair' : 'default',
      }}
    >
      <Layer>
        {shapes.map((shape) => (
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

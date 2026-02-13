import React, { useRef, useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { useCanvas } from './hooks/useCanvas';
import { useShapes } from './hooks/useShapes';
import { SHAPE_TYPES } from './utils/shapeUtils';
import './App.css';

function App() {
  const canvasRef = useRef();
  const [isTextMode, setIsTextMode] = useState(false);

  const {
    stageConfig,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useCanvas(canvasRef);

  const {
    shapes,
    selectedShapeId,
    addShape,
    updateShapePosition,
    handleTransformEnd,
    updateTextContent,
    selectShape,
    clearSelection,
  } = useShapes();

  const handleAddShape = useCallback((type) => {
    addShape(type, canvasRef);
  }, [addShape]);

  const handleToggleTextMode = useCallback(() => {
    setIsTextMode((prev) => !prev);
  }, []);

  const handleStageClick = useCallback(() => {
    clearSelection();

    if (isTextMode && canvasRef.current) {
      const pointer = canvasRef.current.getPointerPosition();
      const stage = canvasRef.current.getStage();
      const x = (pointer.x - stage.x()) / stage.scaleX();
      const y = (pointer.y - stage.y()) / stage.scaleY();
      addShape(SHAPE_TYPES.TEXT, canvasRef, { x, y });
      setIsTextMode(false);
    }
  }, [clearSelection, isTextMode, addShape]);

  return (
    <div className="app-container">
      <Toolbar
        onAddShape={handleAddShape}
        isTextMode={isTextMode}
        onToggleTextMode={handleToggleTextMode}
      />
      <Canvas
        ref={canvasRef}
        stageConfig={stageConfig}
        isPanning={isPanning}
        shapes={shapes}
        selectedShapeId={selectedShapeId}
        isTextMode={isTextMode}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onStageClick={handleStageClick}
        onSelectShape={selectShape}
        onDragEnd={updateShapePosition}
        onTransformEnd={handleTransformEnd}
        onTextDblClick={updateTextContent}
      />
    </div>
  );
}

export default App;

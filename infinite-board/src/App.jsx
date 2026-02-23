import React, { useRef, useState, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import DraggableToolbar from './components/DraggableToolbar';
import Canvas from './components/Canvas';
import { BACKGROUND_TYPES } from './components/Background';
import { useCanvas } from './hooks/useCanvas';
import { useShapes } from './hooks/useShapes';
import { SHAPE_TYPES, CONNECTION_TYPES, CONNECTION_ANCHORS, getConnectionAnchorPoint } from './utils/shapeUtils';
import './App.css';

const STROKE_COLORS = ['#333333', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#000000'];
const STROKE_WIDTHS = [2, 4, 6, 8];

function App() {
  const canvasRef = useRef();
  const [isTextMode, setIsTextMode] = useState(false);
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [connectionType, setConnectionType] = useState(CONNECTION_TYPES.LINE);
  const [connectionStart, setConnectionStart] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [backgroundType, setBackgroundType] = useState(BACKGROUND_TYPES.DOT);
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 画笔相关状态
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const strokeHistoryRef = useRef([]);
  const strokeHistoryIndexRef = useRef(-1);

  const {
    stageConfig,
    isPanning,
    canvasExtent,
    scaleLimits,
    handleWheel,
    handleMouseDown,
    handleMouseMove: handleMouseMoveCanvas,
    handleMouseUp,
    handleMouseLeave,
    resetView,
    fitToContent,
  } = useCanvas(canvasRef);

  const {
    shapes,
    connections,
    selectedShapeId,
    selectedConnectionId,
    canUndo,
    canRedo,
    addShape,
    deleteSelectedShape,
    deleteSelectedConnection,
    copyShape,
    pasteShape,
    undo,
    redo,
    updateShapePosition,
    handleTransformEnd,
    updateTextContent,
    selectShape,
    selectConnection,
    clearSelection,
    addConnection,
    exportShapes,
    importShapes,
  } = useShapes();

  const handleAddShape = useCallback((type) => {
    addShape(type, canvasRef);
  }, [addShape]);

  const handleToggleTextMode = useCallback(() => {
    setIsTextMode((prev) => !prev);
    setIsConnectionMode(false);
    setIsDrawingMode(false);
    setConnectionStart(null);
    setTempConnection(null);
  }, []);

  const handleToggleDrawingMode = useCallback(() => {
    setIsDrawingMode((prev) => !prev);
    setIsTextMode(false);
    setIsConnectionMode(false);
    setConnectionStart(null);
    setTempConnection(null);
    clearSelection();
  }, [clearSelection]);

  // 画笔历史记录管理
  const saveStrokesToHistory = useCallback((newStrokes) => {
    const history = strokeHistoryRef.current;
    const currentIndex = strokeHistoryIndexRef.current;

    // 删除当前位置之后的历史记录
    if (currentIndex < history.length - 1) {
      strokeHistoryRef.current = history.slice(0, currentIndex + 1);
    }

    // 添加新状态
    strokeHistoryRef.current.push([...newStrokes]);

    // 限制历史记录数量
    if (strokeHistoryRef.current.length > 50) {
      strokeHistoryRef.current.shift();
    } else {
      strokeHistoryIndexRef.current += 1;
    }
  }, []);

  const undoStroke = useCallback(() => {
    if (strokeHistoryIndexRef.current > 0) {
      strokeHistoryIndexRef.current -= 1;
      const previousStrokes = strokeHistoryRef.current[strokeHistoryIndexRef.current];
      setStrokes([...previousStrokes]);
    }
  }, []);

  const redoStroke = useCallback(() => {
    if (strokeHistoryIndexRef.current < strokeHistoryRef.current.length - 1) {
      strokeHistoryIndexRef.current += 1;
      const nextStrokes = strokeHistoryRef.current[strokeHistoryIndexRef.current];
      setStrokes([...nextStrokes]);
    }
  }, []);

  const canUndoStrokes = strokeHistoryIndexRef.current > 0;
  const canRedoStrokes = strokeHistoryIndexRef.current < strokeHistoryRef.current.length - 1;

  // 初始化历史记录
  useEffect(() => {
    if (strokeHistoryRef.current.length === 0 && strokes.length === 0) {
      strokeHistoryRef.current = [[]];
      strokeHistoryIndexRef.current = 0;
    }
  }, []);

  // 处理画笔strokes变化
  const handleStrokesChange = useCallback((updater) => {
    setStrokes((prev) => {
      const newStrokes = typeof updater === 'function' ? updater(prev) : updater;
      saveStrokesToHistory(newStrokes);
      return newStrokes;
    });
  }, [saveStrokesToHistory]);

  const handleToggleConnectionMode = useCallback((type) => {
    if (isConnectionMode && connectionType === type) {
      setIsConnectionMode(false);
      setConnectionType(CONNECTION_TYPES.LINE);
    } else {
      setIsConnectionMode(true);
      setConnectionType(type);
    }
    setIsTextMode(false);
    setIsDrawingMode(false);
    setConnectionStart(null);
    setTempConnection(null);
    clearSelection();
  }, [isConnectionMode, connectionType, clearSelection]);

  const handleChangeBackground = useCallback((type) => {
    setBackgroundType(type);
  }, []);

  const handleStageClick = useCallback((e) => {
    // 如果在连线模式，点击空白处取消连线
    if (isConnectionMode && connectionStart) {
      setConnectionStart(null);
      setTempConnection(null);
      return;
    }

    clearSelection();

    if (isTextMode && canvasRef.current) {
      const pointer = canvasRef.current.getPointerPosition();
      const stage = canvasRef.current.getStage();
      const x = (pointer.x - stage.x()) / stage.scaleX();
      const y = (pointer.y - stage.y()) / stage.scaleY();
      addShape(SHAPE_TYPES.TEXT, canvasRef, { x, y });
      setIsTextMode(false);
    }
  }, [clearSelection, isTextMode, isConnectionMode, connectionStart, addShape]);

  const handleImport = useCallback(async (file) => {
    try {
      const count = await importShapes(file);
      alert(`成功导入 ${count} 个图形`);
    } catch (error) {
      alert('导入失败: ' + error.message);
    }
  }, [importShapes]);

  // 处理锚点点击（用于连线模式）
  const handleAnchorClick = useCallback((shapeId, anchor) => {
    if (!isConnectionMode) return;

    if (!connectionStart) {
      // 开始连线
      setConnectionStart({ shapeId, anchor });
      const stage = canvasRef.current?.getStage();
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const x = (pointer.x - stage.x()) / stage.scaleX();
          const y = (pointer.y - stage.y()) / stage.scaleY();
          setTempConnection({ x, y });
        }
      }
    } else {
      // 结束连线，不能连自己
      if (connectionStart.shapeId !== shapeId) {
        addConnection(
          connectionStart.shapeId,
          shapeId,
          connectionStart.anchor,
          anchor,
          connectionType
        );
      }
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [isConnectionMode, connectionStart, connectionType, addConnection]);

  // 处理图形点击（普通选择模式）
  const handleShapeClick = useCallback((shapeId, e) => {
    if (!isConnectionMode) {
      selectShape(shapeId);
    }
  }, [isConnectionMode, selectShape]);

  // 处理鼠标移动（更新临时连线 + 画布平移）
  const handleMouseMove = useCallback((e) => {
    // 先处理画布平移
    handleMouseMoveCanvas(e);

    // 再处理临时连线更新
    if (isConnectionMode && connectionStart && canvasRef.current) {
      const stage = canvasRef.current.getStage();
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const x = (pointer.x - stage.x()) / stage.scaleX();
        const y = (pointer.y - stage.y()) / stage.scaleY();
        setTempConnection({ x, y });
      }
    }
  }, [isConnectionMode, connectionStart, handleMouseMoveCanvas]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 'c') {
        e.preventDefault();
        copyShape();
      } else if (ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteShape(canvasRef);
      } else if (ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedConnectionId) {
          deleteSelectedConnection();
        } else {
          deleteSelectedShape();
        }
      } else if (e.key === 'Escape') {
        // ESC 退出连线模式或画笔模式
        if (isConnectionMode) {
          setIsConnectionMode(false);
          setConnectionStart(null);
          setTempConnection(null);
        }
        if (isDrawingMode) {
          setIsDrawingMode(false);
        }
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyShape, pasteShape, undo, redo, deleteSelectedShape, deleteSelectedConnection, selectedConnectionId, isConnectionMode, isDrawingMode, clearSelection]);

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-container">
      <DraggableToolbar
        onAddShape={handleAddShape}
        isTextMode={isTextMode}
        onToggleTextMode={handleToggleTextMode}
        isConnectionMode={isConnectionMode}
        connectionType={connectionType}
        onToggleConnectionMode={handleToggleConnectionMode}
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={handleToggleDrawingMode}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        strokeColors={STROKE_COLORS}
        strokeWidths={STROKE_WIDTHS}
        onUndoStroke={undoStroke}
        onRedoStroke={redoStroke}
        canUndoStrokes={canUndoStrokes}
        canRedoStrokes={canRedoStrokes}
      />
      <Toolbar
        backgroundType={backgroundType}
        onChangeBackground={handleChangeBackground}
        onDelete={selectedConnectionId ? deleteSelectedConnection : deleteSelectedShape}
        onCopy={copyShape}
        onPaste={() => pasteShape(canvasRef)}
        onUndo={undo}
        onRedo={redo}
        onResetView={resetView}
        onFitToContent={() => fitToContent(shapes)}
        onExport={exportShapes}
        onImport={handleImport}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={!!selectedShapeId || !!selectedConnectionId}
        currentScale={stageConfig.scale}
        scaleLimits={scaleLimits}
      />
      <Canvas
        ref={canvasRef}
        stageConfig={stageConfig}
        isPanning={isPanning}
        shapes={shapes}
        connections={connections}
        selectedShapeId={selectedShapeId}
        selectedConnectionId={selectedConnectionId}
        isTextMode={isTextMode}
        isConnectionMode={isConnectionMode}
        connectionStart={connectionStart}
        tempConnection={tempConnection}
        backgroundType={backgroundType}
        canvasSize={canvasSize}
        canvasExtent={canvasExtent}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onStageClick={handleStageClick}
        onSelectShape={handleShapeClick}
        onSelectConnection={selectConnection}
        onDragEnd={updateShapePosition}
        onTransformEnd={handleTransformEnd}
        onTextDblClick={updateTextContent}
        onAnchorClick={handleAnchorClick}
        isDrawingMode={isDrawingMode}
        strokes={strokes}
        onStrokesChange={handleStrokesChange}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
    </div>
  );
}

export default App;

import { useState, useRef, useCallback } from 'react';
import {
  SHAPE_TYPES,
  createShape,
  findNonOverlappingPosition,
  getShapeDimensions,
  createConnection,
} from '../utils/shapeUtils';

const HISTORY_LIMIT = 50;
const HISTORY_THROTTLE_MS = 500;

export const useShapes = () => {
  const [shapes, setShapes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const shapeCounterRef = useRef({
    rect: 0,
    circle: 0,
    text: 0,
    diamond: 0,
    triangle: 0,
    arrow: 0,
    star: 0,
  });

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const clipboardRef = useRef(null);
  const pendingHistoryRef = useRef(null);
  const historyTimeoutRef = useRef(null);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const flushPendingHistory = useCallback(() => {
    if (pendingHistoryRef.current !== null) {
      const history = historyRef.current;
      const currentIndex = historyIndexRef.current;

      if (currentIndex < history.length - 1) {
        historyRef.current = history.slice(0, currentIndex + 1);
      }

      historyRef.current.push(JSON.parse(JSON.stringify(pendingHistoryRef.current)));

      if (historyRef.current.length > HISTORY_LIMIT) {
        historyRef.current.shift();
      } else {
        historyIndexRef.current += 1;
      }

      pendingHistoryRef.current = null;
      updateHistoryState();
    }
  }, [updateHistoryState]);

  const saveToHistory = useCallback((newShapes, newConnections, immediate = false) => {
    pendingHistoryRef.current = { shapes: newShapes, connections: newConnections };

    if (immediate) {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
        historyTimeoutRef.current = null;
      }
      flushPendingHistory();
    } else if (!historyTimeoutRef.current) {
      historyTimeoutRef.current = setTimeout(() => {
        flushPendingHistory();
        historyTimeoutRef.current = null;
      }, HISTORY_THROTTLE_MS);
    }
  }, [flushPendingHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const previousState = historyRef.current[historyIndexRef.current];
      setShapes(JSON.parse(JSON.stringify(previousState.shapes)));
      setConnections(JSON.parse(JSON.stringify(previousState.connections)));
      setSelectedShapeId(null);
      setSelectedConnectionId(null);
      updateHistoryState();
    }
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextState = historyRef.current[historyIndexRef.current];
      setShapes(JSON.parse(JSON.stringify(nextState.shapes)));
      setConnections(JSON.parse(JSON.stringify(nextState.connections)));
      setSelectedShapeId(null);
      setSelectedConnectionId(null);
      updateHistoryState();
    }
  }, [updateHistoryState]);

  const addShape = useCallback((type, canvasRef, customPosition = null) => {
    let x, y;

    if (customPosition) {
      x = customPosition.x;
      y = customPosition.y;
    } else {
      const viewportCenter = canvasRef.current?.getViewportCenter() || { x: 0, y: 0 };
      const { x: centerX, y: centerY } = viewportCenter;
      const { width, height } = getShapeDimensions(type);
      const position = findNonOverlappingPosition(centerX, centerY, width, height, shapes);
      x = position.x;
      y = position.y;
    }

    shapeCounterRef.current[type] += 1;
    const newShape = createShape(type, x, y, shapeCounterRef.current[type]);

    setShapes((prev) => {
      const newShapes = [...prev, newShape];
      saveToHistory(newShapes, connections, true);
      return newShapes;
    });
    return newShape;
  }, [shapes, connections, saveToHistory]);

  const deleteShape = useCallback((id) => {
    setShapes((prev) => {
      const newShapes = prev.filter((shape) => shape.id !== id);
      // 同时删除与该图形相关的连接线
      const newConnections = connections.filter(
        (conn) => conn.fromShapeId !== id && conn.toShapeId !== id
      );
      setConnections(newConnections);
      saveToHistory(newShapes, newConnections, true);
      return newShapes;
    });
    setSelectedShapeId(null);
  }, [connections, saveToHistory]);

  const deleteSelectedShape = useCallback(() => {
    if (selectedShapeId) {
      deleteShape(selectedShapeId);
    }
  }, [selectedShapeId, deleteShape]);

  const copyShape = useCallback(() => {
    if (selectedShapeId) {
      const shapeToCopy = shapes.find((s) => s.id === selectedShapeId);
      if (shapeToCopy) {
        clipboardRef.current = JSON.parse(JSON.stringify(shapeToCopy));
      }
    }
  }, [selectedShapeId, shapes]);

  const pasteShape = useCallback((canvasRef) => {
    if (clipboardRef.current) {
      const shapeToPaste = JSON.parse(JSON.stringify(clipboardRef.current));

      shapeCounterRef.current[shapeToPaste.type] += 1;
      shapeToPaste.id = `${shapeToPaste.type}${shapeCounterRef.current[shapeToPaste.type]}`;

      const { width, height } = getShapeDimensions(shapeToPaste.type);
      const position = findNonOverlappingPosition(
        shapeToPaste.x + 20,
        shapeToPaste.y + 20,
        width,
        height,
        shapes
      );
      shapeToPaste.x = position.x;
      shapeToPaste.y = position.y;

      setShapes((prev) => {
        const newShapes = [...prev, shapeToPaste];
        saveToHistory(newShapes, connections, true);
        return newShapes;
      });
      setSelectedShapeId(shapeToPaste.id);
      return shapeToPaste;
    }
    return null;
  }, [shapes, connections, saveToHistory]);

  const updateShape = useCallback((id, updates) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );
  }, []);

  const updateShapePosition = useCallback((id, x, y) => {
    setShapes((prev) => {
      const newShapes = prev.map((shape) =>
        shape.id === id ? { ...shape, x, y } : shape
      );
      saveToHistory(newShapes, connections);
      return newShapes;
    });
  }, [connections, saveToHistory]);

  const handleTransformEnd = useCallback((id, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const updates = {
      x: node.x(),
      y: node.y(),
    };

    switch (shape.type) {
      case SHAPE_TYPES.RECT:
      case SHAPE_TYPES.DIAMOND:
      case SHAPE_TYPES.ARROW:
        updates.width = Math.max(5, shape.width * scaleX);
        updates.height = Math.max(5, shape.height * scaleY);
        break;
      case SHAPE_TYPES.CIRCLE:
      case SHAPE_TYPES.TRIANGLE:
        updates.radius = Math.max(5, shape.radius * Math.max(scaleX, scaleY));
        break;
      case SHAPE_TYPES.TEXT:
        updates.width = Math.max(5, node.width() * scaleX);
        updates.fontSize = Math.max(5, Math.round(shape.fontSize * scaleY));
        break;
      case SHAPE_TYPES.STAR:
        updates.innerRadius = Math.max(5, shape.innerRadius * Math.max(scaleX, scaleY));
        updates.outerRadius = Math.max(5, shape.outerRadius * Math.max(scaleX, scaleY));
        break;
    }

    if (node.rotation() !== undefined) {
      updates.rotation = node.rotation();
    }

    setShapes((prev) => {
      const newShapes = prev.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      saveToHistory(newShapes, connections, true);
      return newShapes;
    });
  }, [shapes, connections, saveToHistory]);

  const updateTextContent = useCallback((id, text) => {
    setShapes((prev) => {
      const newShapes = prev.map((shape) =>
        shape.id === id ? { ...shape, text } : shape
      );
      saveToHistory(newShapes, connections, true);
      return newShapes;
    });
  }, [connections, saveToHistory]);

  const selectShape = useCallback((id) => {
    setSelectedShapeId(id);
    setSelectedConnectionId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedShapeId(null);
    setSelectedConnectionId(null);
  }, []);

  const selectConnection = useCallback((id) => {
    setSelectedConnectionId(id);
    setSelectedShapeId(null);
  }, []);

  const clearConnectionSelection = useCallback(() => {
    setSelectedConnectionId(null);
  }, []);

  const exportShapes = useCallback(() => {
    const exportData = {
      version: '1.1',
      exportTime: new Date().toISOString(),
      shapes: shapes,
      connections: connections,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `infinite-board-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [shapes, connections]);

  const importShapes = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          if (importData.shapes && Array.isArray(importData.shapes)) {
            const maxCounters = {};
            importData.shapes.forEach((shape) => {
              const type = shape.type;
              const match = shape.id.match(/\\d+$/);
              if (match) {
                const num = parseInt(match[0], 10);
                if (!maxCounters[type] || num > maxCounters[type]) {
                  maxCounters[type] = num;
                }
              }
            });
            Object.keys(maxCounters).forEach((type) => {
              if (shapeCounterRef.current[type] !== undefined) {
                shapeCounterRef.current[type] = Math.max(
                  shapeCounterRef.current[type],
                  maxCounters[type]
                );
              }
            });
            const importedConnections = importData.connections || [];
            setShapes(importData.shapes);
            setConnections(importedConnections);
            historyRef.current = [{
              shapes: JSON.parse(JSON.stringify(importData.shapes)),
              connections: JSON.parse(JSON.stringify(importedConnections))
            }];
            historyIndexRef.current = 0;
            setSelectedShapeId(null);
            setSelectedConnectionId(null);
            updateHistoryState();
            resolve(importData.shapes.length);
          } else {
            reject(new Error('无效的文件格式'));
          }
        } catch (error) {
          reject(new Error('解析文件失败: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }, [updateHistoryState]);

  const loadShapes = useCallback((newShapes, newConnections = []) => {
    const maxCounters = {};
    newShapes.forEach((shape) => {
      const type = shape.type;
      const match = shape.id.match(/\\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!maxCounters[type] || num > maxCounters[type]) {
          maxCounters[type] = num;
        }
      }
    });
    Object.keys(maxCounters).forEach((type) => {
      if (shapeCounterRef.current[type] !== undefined) {
        shapeCounterRef.current[type] = Math.max(
          shapeCounterRef.current[type],
          maxCounters[type]
        );
      }
    });
    setShapes(newShapes);
    setConnections(newConnections);
    saveToHistory(newShapes, newConnections, true);
    setSelectedShapeId(null);
    setSelectedConnectionId(null);
  }, [saveToHistory]);

  // 连接线相关方法
  const addConnection = useCallback((fromShapeId, toShapeId, fromAnchor, toAnchor, type) => {
    const newConnection = createConnection(fromShapeId, toShapeId, fromAnchor, toAnchor, type);
    setConnections((prev) => {
      const newConnections = [...prev, newConnection];
      saveToHistory(shapes, newConnections, true);
      return newConnections;
    });
    return newConnection;
  }, [shapes, saveToHistory]);

  const deleteConnection = useCallback((id) => {
    setConnections((prev) => {
      const newConnections = prev.filter((conn) => conn.id !== id);
      saveToHistory(shapes, newConnections, true);
      return newConnections;
    });
    setSelectedConnectionId(null);
  }, [shapes, saveToHistory]);

  const deleteSelectedConnection = useCallback(() => {
    if (selectedConnectionId) {
      deleteConnection(selectedConnectionId);
    }
  }, [selectedConnectionId, deleteConnection]);

  const updateConnection = useCallback((id, updates) => {
    setConnections((prev) => {
      const newConnections = prev.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      );
      saveToHistory(shapes, newConnections, true);
      return newConnections;
    });
  }, [shapes, saveToHistory]);

  return {
    shapes,
    connections,
    selectedShapeId,
    selectedConnectionId,
    canUndo,
    canRedo,
    addShape,
    deleteShape,
    deleteSelectedShape,
    copyShape,
    pasteShape,
    undo,
    redo,
    updateShape,
    updateShapePosition,
    handleTransformEnd,
    updateTextContent,
    selectShape,
    clearSelection,
    setSelectedShapeId,
    exportShapes,
    importShapes,
    loadShapes,
    // 连接线相关
    addConnection,
    deleteConnection,
    deleteSelectedConnection,
    updateConnection,
    selectConnection,
    clearConnectionSelection,
    setSelectedConnectionId,
  };
};

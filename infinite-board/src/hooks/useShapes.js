import { useState, useRef, useCallback } from 'react';
import {
  SHAPE_TYPES,
  createShape,
  findNonOverlappingPosition,
  getShapeDimensions,
} from '../utils/shapeUtils';

export const useShapes = () => {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const shapeCounterRef = useRef({
    rect: 0,
    circle: 0,
    text: 0,
    diamond: 0,
    triangle: 0,
    arrow: 0,
    star: 0,
  });

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

    setShapes((prev) => [...prev, newShape]);
    return newShape;
  }, [shapes]);

  const updateShape = useCallback((id, updates) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );
  }, []);

  const updateShapePosition = useCallback((id, x, y) => {
    updateShape(id, { x, y });
  }, [updateShape]);

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

    updateShape(id, updates);
  }, [shapes, updateShape]);

  const updateTextContent = useCallback((id, text) => {
    updateShape(id, { text });
  }, [updateShape]);

  const selectShape = useCallback((id) => {
    setSelectedShapeId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedShapeId(null);
  }, []);

  return {
    shapes,
    selectedShapeId,
    addShape,
    updateShape,
    updateShapePosition,
    handleTransformEnd,
    updateTextContent,
    selectShape,
    clearSelection,
    setSelectedShapeId,
  };
};

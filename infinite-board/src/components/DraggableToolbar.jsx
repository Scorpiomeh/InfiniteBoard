import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SHAPE_TYPES, CONNECTION_TYPES } from '../utils/shapeUtils';

const SHAPE_ITEMS = [
  { type: SHAPE_TYPES.RECT, icon: '▭', label: '矩形' },
  { type: SHAPE_TYPES.CIRCLE, icon: '○', label: '圆形' },
  { type: SHAPE_TYPES.DIAMOND, icon: '◊', label: '菱形' },
  { type: SHAPE_TYPES.TRIANGLE, icon: '△', label: '三角形' },
  { type: SHAPE_TYPES.ARROW, icon: '→', label: '箭头' },
  { type: SHAPE_TYPES.STAR, icon: '★', label: '星形' },
];

const CONNECTION_ITEMS = [
  { type: CONNECTION_TYPES.LINE, icon: '—', label: '连线' },
  { type: CONNECTION_TYPES.ARROW, icon: '→', label: '箭头' },
];

const DraggableToolbar = ({
  onAddShape,
  isTextMode,
  onToggleTextMode,
  isConnectionMode,
  connectionType,
  onToggleConnectionMode,
  isDrawingMode,
  onToggleDrawingMode,
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  strokeColors,
  strokeWidths,
  onUndoStroke,
  onRedoStroke,
  canUndoStrokes,
  canRedoStrokes,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const toolbarRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.toolbar-content') && !e.target.closest('.drag-handle')) {
      return;
    }

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setPosition({
      x: Math.max(0, dragRef.current.initialX + deltaX),
      y: Math.max(0, dragRef.current.initialY + deltaY),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={toolbarRef}
      className={`draggable-toolbar ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="drag-handle" onMouseDown={handleMouseDown}>
        <div className="drag-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <button
          className="toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '◀' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="toolbar-content">
          <div className="toolbar-section">
            <div className="section-title">图形</div>
            <div className="shape-buttons">
              {SHAPE_ITEMS.map((item) => (
                <button
                  key={item.type}
                  className="shape-btn"
                  onClick={() => onAddShape(item.type)}
                  title={item.label}
                >
                  <span className="shape-icon">{item.icon}</span>
                  <span className="shape-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-section">
            <div className="section-title">连线</div>
            <div className="shape-buttons">
              {CONNECTION_ITEMS.map((item) => (
                <button
                  key={item.type}
                  className={`shape-btn ${isConnectionMode && connectionType === item.type ? 'active' : ''}`}
                  onClick={() => onToggleConnectionMode(item.type)}
                  title={item.label}
                >
                  <span className="shape-icon">{item.icon}</span>
                  <span className="shape-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-divider" />

          <div className="toolbar-section">
            <div className="section-title">画笔</div>
            <button
              className={`shape-btn drawing-btn ${isDrawingMode ? 'active' : ''}`}
              onClick={onToggleDrawingMode}
            >
              <span className="shape-icon">✎</span>
              <span className="shape-label">
                {isDrawingMode ? '绘画中' : '画笔'}
              </span>
            </button>

            {isDrawingMode && (
              <div className="drawing-options">
                <div className="color-options">
                  {strokeColors.map((color) => (
                    <button
                      key={color}
                      className={`color-btn ${strokeColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => onStrokeColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="width-options">
                  {strokeWidths.map((width) => (
                    <button
                      key={width}
                      className={`width-btn ${strokeWidth === width ? 'active' : ''}`}
                      onClick={() => onStrokeWidthChange(width)}
                      title={`${width}px`}
                    >
                      <span
                        className="width-line"
                        style={{ height: `${width}px` }}
                      />
                    </button>
                  ))}
                </div>
                <div className="stroke-actions">
                  <button
                    className="stroke-action-btn"
                    onClick={onUndoStroke}
                    disabled={!canUndoStrokes}
                    title="撤回笔画"
                  >
                    <span>↶</span>
                  </button>
                  <button
                    className="stroke-action-btn"
                    onClick={onRedoStroke}
                    disabled={!canRedoStrokes}
                    title="重做笔画"
                  >
                    <span>↷</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-section">
            <button
              className={`shape-btn text-btn ${isTextMode ? 'active' : ''}`}
              onClick={onToggleTextMode}
            >
              <span className="shape-icon">T</span>
              <span className="shape-label">
                {isTextMode ? '点击画布添加' : '文本'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableToolbar;

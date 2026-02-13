import React from 'react';
import { SHAPE_TYPES } from '../utils/shapeUtils';

const TOOLBAR_ITEMS = [
  { type: SHAPE_TYPES.RECT, icon: '▭', label: '矩形' },
  { type: SHAPE_TYPES.CIRCLE, icon: '○', label: '圆形' },
  { type: SHAPE_TYPES.DIAMOND, icon: '◊', label: '菱形' },
  { type: SHAPE_TYPES.TRIANGLE, icon: '△', label: '三角形' },
  { type: SHAPE_TYPES.ARROW, icon: '→', label: '箭头' },
  { type: SHAPE_TYPES.STAR, icon: '★', label: '星形' },
];

const Toolbar = ({ onAddShape, isTextMode, onToggleTextMode }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-title">InfiniteBoard</div>
      <div className="toolbar-buttons">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.type}
            className="toolbar-btn"
            onClick={() => onAddShape(item.type)}
          >
            <span className="btn-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          className={`toolbar-btn ${isTextMode ? 'active' : ''}`}
          onClick={onToggleTextMode}
        >
          <span className="btn-icon">T</span>
          {isTextMode ? '点击画布添加文本' : '文本'}
        </button>
      </div>
      <div className="toolbar-hint">按住空格键拖拽画布</div>
    </div>
  );
};

export default Toolbar;

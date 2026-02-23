import React, { useRef } from 'react';
import { BACKGROUND_TYPES } from './Background';

const BACKGROUND_OPTIONS = [
  { type: BACKGROUND_TYPES.DOT, icon: '•', label: '点阵' },
  { type: BACKGROUND_TYPES.GRID, icon: '⊞', label: '方格' },
  { type: BACKGROUND_TYPES.BLANK, icon: '☐', label: '空白' },
];

const Toolbar = ({
  backgroundType,
  onChangeBackground,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onResetView,
  onFitToContent,
  onExport,
  onImport,
  canUndo,
  canRedo,
  hasSelection,
  currentScale,
  scaleLimits,
}) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-main">
        <div className="toolbar-title">InfiniteBoard</div>
        
        <div className="toolbar-groups">
          {/* 编辑操作组 */}
          <div className="toolbar-group">
            <span className="group-label">编辑</span>
            <div className="group-buttons">
              <button
                className="toolbar-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="撤销 (Ctrl+Z)"
              >
                <span className="btn-icon">↶</span>
                <span className="btn-text">撤销</span>
              </button>
              <button
                className="toolbar-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="重做 (Ctrl+Y 或 Ctrl+Shift+Z)"
              >
                <span className="btn-icon">↷</span>
                <span className="btn-text">重做</span>
              </button>
            </div>
          </div>

          {/* 剪贴板操作组 */}
          <div className="toolbar-group">
            <span className="group-label">剪贴板</span>
            <div className="group-buttons">
              <button
                className="toolbar-btn"
                onClick={onCopy}
                disabled={!hasSelection}
                title="复制 (Ctrl+C)"
              >
                <span className="btn-icon">⎘</span>
                <span className="btn-text">复制</span>
              </button>
              <button
                className="toolbar-btn"
                onClick={onPaste}
                title="粘贴 (Ctrl+V)"
              >
                <span className="btn-icon">⎗</span>
                <span className="btn-text">粘贴</span>
              </button>
              <button
                className="toolbar-btn delete-btn"
                onClick={onDelete}
                disabled={!hasSelection}
                title="删除 (Delete)"
              >
                <span className="btn-icon">🗑</span>
                <span className="btn-text">删除</span>
              </button>
            </div>
          </div>

          {/* 视图操作组 */}
          <div className="toolbar-group">
            <span className="group-label">视图</span>
            <div className="group-buttons">
              <button
                className="toolbar-btn"
                onClick={onResetView}
                title="重置视图"
              >
                <span className="btn-icon">⌖</span>
                <span className="btn-text">重置</span>
              </button>
              <button
                className="toolbar-btn"
                onClick={onFitToContent}
                title="适应内容"
              >
                <span className="btn-icon">⛶</span>
                <span className="btn-text">适应</span>
              </button>
            </div>
          </div>

          {/* 文件操作组 */}
          <div className="toolbar-group">
            <span className="group-label">文件</span>
            <div className="group-buttons">
              <button
                className="toolbar-btn"
                onClick={onExport}
                title="导出画布"
              >
                <span className="btn-icon">⬇</span>
                <span className="btn-text">导出</span>
              </button>
              <button
                className="toolbar-btn"
                onClick={handleImportClick}
                title="导入画布"
              >
                <span className="btn-icon">⬆</span>
                <span className="btn-text">导入</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 背景设置组 */}
          <div className="toolbar-group">
            <span className="group-label">背景</span>
            <div className="group-buttons background-buttons">
              {BACKGROUND_OPTIONS.map((item) => (
                <button
                  key={item.type}
                  className={`toolbar-btn ${backgroundType === item.type ? 'active' : ''}`}
                  onClick={() => onChangeBackground(item.type)}
                  title={item.label}
                >
                  <span className="btn-icon">{item.icon}</span>
                  <span className="btn-text">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-info">
        <span className="scale-indicator">
          {Math.round(currentScale * 100)}%
        </span>
      </div>
    </div>
  );
};

export default Toolbar;

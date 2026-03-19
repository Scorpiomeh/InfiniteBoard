import React, { useState, useCallback, useRef, useEffect } from 'react';

const AIAssistantPanel = ({
  isOpen,
  onClose,
  onGenerateFlowchart,
  onGenerateDiagram,
  isLoading,
  error,
  apiKey,
  apiEndpoint,
  modelName,
  onConfigureAPI,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('flowchart');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: apiKey || '',
    endpoint: apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
    model: modelName || 'deepseek-chat',
  });
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const toolbarElement = document.querySelector('.draggable-toolbar');
        const aiButton = document.querySelector('.ai-btn');
        if (toolbarElement && toolbarElement.contains(e.target)) return;
        if (aiButton && aiButton.contains(e.target)) return;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (!settings.apiKey.trim()) {
      setShowSettings(true);
      return;
    }

    onConfigureAPI({
      apiKey: settings.apiKey,
      endpoint: settings.endpoint,
      model: settings.model,
    });

    if (mode === 'flowchart') {
      await onGenerateFlowchart(inputText);
    } else {
      await onGenerateDiagram(inputText);
    }
  }, [inputText, mode, settings, onConfigureAPI, onGenerateFlowchart, onGenerateDiagram]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSubmit, onClose]);

  const handleSaveSettings = useCallback(() => {
    onConfigureAPI({
      apiKey: settings.apiKey,
      endpoint: settings.endpoint,
      model: settings.model,
    });
    setShowSettings(false);
  }, [settings, onConfigureAPI]);

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-panel" ref={panelRef}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span>AI 智能绘图助手</span>
        </div>
        <button className="ai-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="ai-mode-tabs">
        <button
          className={`ai-mode-tab ${mode === 'flowchart' ? 'active' : ''}`}
          onClick={() => setMode('flowchart')}
        >
          流程图
        </button>
        <button
          className={`ai-mode-tab ${mode === 'diagram' ? 'active' : ''}`}
          onClick={() => setMode('diagram')}
        >
          示意图
        </button>
        <button
          className="ai-settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="API 设置"
        >
          ⚙️
        </button>
      </div>

      {showSettings ? (
        <div className="ai-settings-form">
          <div className="ai-settings-row">
            <label>API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="输入 API Key"
            />
          </div>
          <div className="ai-settings-row">
            <label>API Endpoint</label>
            <input
              type="text"
              value={settings.endpoint}
              onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
              placeholder="https://api.deepseek.com/v1/chat/completions"
            />
          </div>
          <div className="ai-settings-row">
            <label>模型名称</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder="deepseek-chat"
            />
          </div>
          <button className="ai-save-settings-btn" onClick={handleSaveSettings}>
            保存设置
          </button>
        </div>
      ) : (
        <>
          <form className="ai-input-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="ai-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'flowchart'
                  ? '描述你的流程，例如：用户注册 -> 填写信息 -> 验证手机号 -> 注册成功'
                  : '描述你想要创建的图表'
              }
              rows={3}
            />
            <div className="ai-input-hint">
              按 Ctrl + Enter 快速生成
            </div>
            <button
              type="submit"
              className="ai-generate-btn"
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <>
                  <span className="ai-loading-spinner"></span>
                  生成中...
                </>
              ) : (
                <>
                
                  生成 {mode === 'flowchart' ? '流程图' : '示意图'}
                </>
              )}
            </button>
          </form>
        </>
      )}

      {error && (
        <div className="ai-error">
          <span className="ai-error-icon">⚠️</span>
          <span className="ai-error-text">{error}</span>
          {!settings.apiKey && (
            <button
              className="ai-setup-btn"
              onClick={() => setShowSettings(true)}
            >
              去设置 API
            </button>
          )}
        </div>
      )}

      <div className="ai-panel-footer">
        <div className="ai-tip">
          提示：描述越详细，生成结果越准确
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
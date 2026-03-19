import { useState, useCallback } from 'react';

const AI_PROMPT_TEMPLATES = {
  flowchart: `分析以下自然语言描述，生成流程图数据结构。
要求：
1. 识别流程中的步骤和决策点
2. 步骤用矩形表示
3. 决策点用菱形表示
4. 开始/结束用圆角矩形表示
5. 生成节点和连接关系

返回JSON格式：
{
  "nodes": [
    {
      "id": "node1",
      "type": "rect|circle|diamond|terminator",
      "text": "步骤描述",
      "x": 0,
      "y": 0
    }
  ],
  "connections": [
    {
      "from": "node1",
      "to": "node2",
      "label": "条件（如有）"
    }
  ]
}

用户描述：`,

  diagram: `分析以下自然语言描述，生成图表数据结构。
支持图形：矩形、圆形、菱形、三角形、星形、箭头

返回JSON格式：
{
  "nodes": [
    {
      "id": "node1",
      "type": "rect|circle|diamond|triangle|star",
      "text": "图形描述",
      "x": 0,
      "y": 0
    }
  ],
  "connections": [
    {
      "from": "node1",
      "to": "node2",
      "label": "关系描述"
    }
  ]
}

用户描述：`,
};

const NODE_TYPE_MAP = {
  rect: 'rect',
  circle: 'circle',
  diamond: 'diamond',
  terminator: 'circle',
  triangle: 'triangle',
  star: 'star',
  arrow: 'arrow',
};

const HORIZONTAL_SPACING = 200;
const VERTICAL_SPACING = 120;
const LAYOUT_START_X = 0;
const LAYOUT_START_Y = 0;

const calculateAutoLayout = (nodes, connections) => {
  if (!nodes || nodes.length === 0) return [];

  const nodeMap = new Map();
  nodes.forEach((node) => nodeMap.set(node.id, { ...node, connections: [] }));

  connections.forEach((conn) => {
    const fromNode = nodeMap.get(conn.from);
    const toNode = nodeMap.get(conn.to);
    if (fromNode) fromNode.connections.push({ target: conn.to, label: conn.label });
    if (toNode) toNode.connections.push({ target: conn.from, label: conn.label, isReverse: true });
  });

  const levels = new Map();
  const visited = new Set();
  const rootNodes = nodes.filter((n) => {
    const incoming = connections.filter((c) => c.to === n.id);
    return incoming.length === 0;
  });

  const assignLevel = (nodeId, level) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push(node);

    node.connections.forEach((conn) => {
      if (!conn.isReverse) {
        assignLevel(conn.target, level + 1);
      }
    });
  };

  if (rootNodes.length > 0) {
    rootNodes.forEach((root) => assignLevel(root.id, 0));
  }

  const unvisitedNodes = nodes.filter((n) => !visited.has(n.id));
  let maxLevel = levels.size > 0 ? Math.max(...levels.keys()) + 1 : 0;
  unvisitedNodes.forEach((node) => {
    if (!levels.has(maxLevel)) levels.set(maxLevel, []);
    levels.get(maxLevel).push(node);
    visited.add(node.id);
  });

  const layoutNodes = [];
  levels.forEach((levelNodes, level) => {
    const y = LAYOUT_START_Y + level * (VERTICAL_SPACING + 80);
    const totalWidth = levelNodes.length * HORIZONTAL_SPACING;
    const startX = LAYOUT_START_X - totalWidth / 2 + HORIZONTAL_SPACING / 2;

    levelNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: startX + index * HORIZONTAL_SPACING,
        y,
        level,
      });
    });
  });

  const orphanedNodes = nodes.filter((n) => !layoutNodes.find((ln) => ln.id === n.id));
  let orphanY = layoutNodes.length > 0 ? Math.max(...layoutNodes.map((n) => n.y)) + VERTICAL_SPACING + 80 : LAYOUT_START_Y;
  orphanedNodes.forEach((node, index) => {
    layoutNodes.push({
      ...node,
      x: LAYOUT_START_X + (index - orphanedNodes.length / 2) * HORIZONTAL_SPACING,
      y: orphanY,
    });
  });

  return layoutNodes;
};

const parseErrorResponse = async (response) => {
  let errorMessage = `API请求失败: ${response.status} ${response.statusText || ''}`;

  try {
    const responseText = await response.text();
    if (responseText) {
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        if (responseText.length < 300 && responseText.includes('error')) {
          errorMessage = responseText;
        }
      }
    }
  } catch {
  }

  if (response.status === 401) {
    errorMessage = 'API Key 无效或已过期，请检查设置';
  } else if (response.status === 403) {
    errorMessage = 'API Key 权限不足，请检查 API Key 设置';
  } else if (response.status === 429) {
    errorMessage = '请求过于频繁，请稍后再试';
  } else if (response.status >= 500) {
    errorMessage = 'DeepSeek 服务器错误，请稍后再试';
  }

  return errorMessage;
};

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.deepseek.com/v1/chat/completions');
  const [modelName, setModelName] = useState('deepseek-chat');

  const generateFlowchart = useCallback(async (userInput) => {
    if (!userInput.trim()) {
      setError('请输入描述内容');
      return null;
    }

    if (!apiKey.trim()) {
      setError('请先设置 API Key');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的流程图生成助手。用户输入自然语言描述，你返回结构化的JSON数据来生成流程图。',
            },
            {
              role: 'user',
              content: AI_PROMPT_TEMPLATES.flowchart + userInput,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorMsg = await parseErrorResponse(response);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('未收到有效的响应');
      }

      const jsonMatch = assistantMessage.match(/```json\n?([\s\S]*?)\n?```/) || assistantMessage.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('无法解析AI响应，请尝试更详细的描述');
      }

      const jsonStr = jsonMatch[1]?.startsWith('{') ? jsonMatch[1] : jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('AI返回的数据格式不正确');
      }

      const nodes = parsed.nodes.map((node, index) => ({
        id: node.id || `node${index + 1}`,
        type: NODE_TYPE_MAP[node.type] || 'rect',
        text: node.text || node.label || `节点${index + 1}`,
        x: node.x || 0,
        y: node.y || 0,
      }));

      const connections = (parsed.connections || []).map((conn, index) => ({
        id: `conn${index + 1}`,
        fromShapeId: conn.from,
        toShapeId: conn.to,
        fromAnchor: 'center',
        toAnchor: 'center',
        type: 'line',
        label: conn.label || '',
      }));

      const layoutNodes = calculateAutoLayout(nodes, connections);

      const result = {
        nodes: layoutNodes,
        connections,
      };

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || '生成流程图时发生未知错误';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, apiEndpoint, modelName]);

  const generateDiagram = useCallback(async (userInput) => {
    if (!userInput.trim()) {
      setError('请输入描述内容');
      return null;
    }

    if (!apiKey.trim()) {
      setError('请先设置 API Key');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的图表生成助手。用户输入自然语言描述，你返回结构化的JSON数据来生成图表。',
            },
            {
              role: 'user',
              content: AI_PROMPT_TEMPLATES.diagram + userInput,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorMsg = await parseErrorResponse(response);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('未收到有效的响应');
      }

      const jsonMatch = assistantMessage.match(/```json\n?([\s\S]*?)\n?```/) || assistantMessage.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('无法解析AI响应，请尝试更详细的描述');
      }

      const jsonStr = jsonMatch[1]?.startsWith('{') ? jsonMatch[1] : jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('AI返回的数据格式不正确');
      }

      const nodes = parsed.nodes.map((node, index) => ({
        id: node.id || `node${index + 1}`,
        type: NODE_TYPE_MAP[node.type] || 'rect',
        text: node.text || node.label || `节点${index + 1}`,
        x: node.x || 0,
        y: node.y || 0,
      }));

      const connections = (parsed.connections || []).map((conn, index) => ({
        id: `conn${index + 1}`,
        fromShapeId: conn.from,
        toShapeId: conn.to,
        fromAnchor: 'center',
        toAnchor: 'center',
        type: 'line',
        label: conn.label || '',
      }));

      const layoutNodes = calculateAutoLayout(nodes, connections);

      const result = {
        nodes: layoutNodes,
        connections,
      };

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || '生成图表时发生未知错误';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, apiEndpoint, modelName]);

  const configureAPI = useCallback((config) => {
    if (config.apiKey !== undefined) setApiKey(config.apiKey);
    if (config.endpoint !== undefined) setApiEndpoint(config.endpoint);
    if (config.model !== undefined) setModelName(config.model);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    lastResult,
    apiKey,
    apiEndpoint,
    modelName,
    generateFlowchart,
    generateDiagram,
    configureAPI,
    clearError,
  };
};
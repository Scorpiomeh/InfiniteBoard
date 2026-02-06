import { useState } from 'react';
import './App.css'; // 你可以自己随便写点样式

function App() {
  // 状态是一个数组，存所有方块的 ID
  const [rectangles, setRectangles] = useState([]);

  const addRect = () => {
    // 创建一个新对象
    const newRect = { id: Date.now(), color: 'skyblue' };
    // 更新状态：复制旧数组，加上新对象
    setRectangles([...rectangles, newRect]);
  };

  return (
    <div>
      <button onClick={addRect}>添加矩形</button>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {/* 循环渲染数组 */}
        {rectangles.map((rect) => (
          <div
            key={rect.id} // React 列表渲染必须有唯一的 key
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: rect.color,
              border: '1px solid black'
            }}
          >
            {rect.id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
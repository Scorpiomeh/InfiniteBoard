import { useState } from 'react'; // 1. 引入

function App() {
  // 2. 定义状态
  // count 是当前的值，setCount 是修改它的函数，0 是初始值
  const [count, setCount] = useState(0);

  // 3. 定义操作函数
  const handleClick = () => {
    setCount(count + 1); // 告诉 React：数据变了，请重新渲染界面
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>当前图形数量: {count}</h1>
      {/* 4. 绑定事件 */}
      <button onClick={handleClick}>添加图形</button>
    </div>
  );
}
export default App;
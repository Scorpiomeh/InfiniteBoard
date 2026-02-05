import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>当前图形数量:{count}</h1>
      <button onClick={handleClick}>添加图形</button>
    </div>
  );
}
export default App;

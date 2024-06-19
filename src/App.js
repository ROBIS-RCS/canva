import './App.css';
import CanvasComponent from './CanvasComponent';
import imageFile from './Pic/Map.png';

function App() {
  return (
    <div >
      <h1 className='head' >R-Asset Beacon and Gateway Tracking</h1>
      <CanvasComponent imageSource={imageFile} />
    </div>
  );
}

export default App;

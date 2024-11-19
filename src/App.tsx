// src/App.tsx
import React, { useEffect, useState } from 'react';
import { WarehouseData, MeshData } from './types';
import { saveData, getData } from './indexDB';
import ViewerCanvas from './ThreeViewer';

const App: React.FC = () => {
  const [data, setData] = useState<WarehouseData>([]);
  const [modifiedData, setModifiedData] = useState<WarehouseData>([]);

  useEffect(() => {
    // Load data from IndexedDB on mount
    const fetchData = async () => {
      const storedData = await getData();
      setData(storedData);
      setModifiedData(storedData);
    };
    fetchData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileContent = await file.text();
    const jsonData: WarehouseData = JSON.parse(fileContent);
    setData(jsonData);
    setModifiedData(jsonData);
    await saveData(jsonData); // Save initial data to IndexedDB
  };

  const handleAttributeChange = (index: number, field: keyof MeshData, value: string | number) => {
    setModifiedData((prevData) =>
      prevData.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveChanges = async () => {
    await saveData(modifiedData);
    alert('Changes saved locally!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Warehouse 3D Viewer and Editor</h1>
      <label htmlFor="file-upload">Upload JSON File:</label>
      <input id="file-upload" type="file" accept=".json" onChange={handleFileUpload} />

      {data.length > 0 && (
        <>
         <ViewerCanvas data={modifiedData} />
          <div style={{ marginTop: '20px' }}>
            <h2>Edit Mesh Data</h2>
            {modifiedData.map((mesh, index) => (
              <div key={mesh.Index}>
                <label>
                  Name:
                  <input
                    type="text"
                    value={mesh.Name}
                    onChange={(e) => handleAttributeChange(index, 'Name', e.target.value)}
                  />
                </label>
              </div>
            ))}
            <button onClick={handleSaveChanges} style={{ marginTop: '20px' }}>
              Save Changes Locally
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;

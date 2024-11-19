// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {   loadJSONToIndexedDB, getItems } from './indexeddb-old';

const App: React.FC = () => {
 
  // const [numItems, setNumItems] = useState<number>(1000);
  // const [dataSize, setDataSize] = useState<number>(1024);
  // const [batchSize, setBatchSize] = useState<number>(500); // Add batch size
  interface Item {
    id?: number;
    value: string;
  }

  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const BATCH_SIZE = 100; // Number of items to load per batch
  const [startIndex, setStartIndex] = useState<number>(0); // Track the current starting index
  const loader = useRef<HTMLDivElement | null>(null); // Ref for intersection observer



  // useEffect(() => {
  //   fetchItems();
  // }, []);

  // const fetchItems = async () => {
  //   const storedItems = await getItems();
  //   setItems(storedItems);
  // };

  // const handleStressTest = async () => {
  //   try {
  //     if (navigator.storage && navigator.storage.estimate) {
  //       const quota = await navigator.storage.estimate();
  //       console.log(`Using ${quota.usage} out of ${quota.quota} bytes`);
  //     }
  //     console.log(`Starting stress test with ${numItems} items, each of ${dataSize} characters, batch size: ${batchSize}`);
  //     await stressTestAddItems(numItems, dataSize, batchSize);
  //     console.log('Stress test completed');
  //     // fetchItems();
  //   } catch (error) {
  //     console.error('Stress test failed:', error);
  //   }
  // };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      let jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData)) {
        jsonData = [jsonData];
      }

      await loadJSONToIndexedDB(jsonData);
      console.log('Data successfully loaded into IndexedDB');
      setStartIndex(0); // Reset start index on new upload
      setItems([]); // Clear current items
      loadMore(); // Load the first batch
    } catch (error) {
      console.error('Failed to load JSON data into IndexedDB:', error);
      setError('Failed to load JSON data into IndexedDB');
    }
  };

  const loadMore = async () => {
    try {
      const nextBatch = await getItems(startIndex, BATCH_SIZE);
      setItems((prevItems) => [...prevItems, ...nextBatch]); // Append new items to the existing list
      setStartIndex(startIndex + BATCH_SIZE); // Update startIndex for the next batch
    } catch (error) {
      console.error('Failed to fetch items from IndexedDB:', error);
      setError('Failed to fetch items from IndexedDB');
    }
  };

  useEffect(() => {
    loadMore(); // Load the first batch on component mount
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [loader]);

  

  return (
    <div style={{ padding: '20px' }}>
      <h1>IndexedDB Stress Test</h1>
      {/* <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Enter data"
      />
      <button onClick={handleAddItem}>Add to IndexedDB</button> */}

      {/* <div style={{ marginTop: '20px' }}>
        <h2>Stress Test Parameters</h2>
        <label>
          Number of Items:
          <input
            type="number"
            value={numItems}
            onChange={(e) => setNumItems(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Size of Each Item (in characters):
          <input
            type="number"
            value={dataSize}
            onChange={(e) => setDataSize(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Batch Size:
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
          />
        </label>
        <br />
        <button onClick={handleStressTest}>Run Stress Test</button>
      </div> */}

      {/* <h2>Stored Items</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.value}{' '}
            <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
          </li>
        ))}
      </ul> */}
        <div style={{ padding: '20px' }}>
      <h1>Load JSON Data to IndexedDB</h1>
      <label htmlFor="fileUpload">Upload JSON File:</label>
      <input id="fileUpload" type="file" accept=".json" onChange={handleFileUpload} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Stored Items (lazy loaded in batches of 100)</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{JSON.stringify(item)}</li>
        ))}
      </ul>
      {/* Loader div at the bottom for triggering Intersection Observer */}
      <div ref={loader} style={{ height: '20px' }} />
    </div>
    </div>
  );
};

export default App;

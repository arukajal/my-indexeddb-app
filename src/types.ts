// src/types.ts
export interface MeshData {
    Name: string;
    Index: number;
    mesh_obj_base64: string;
  }
  
  export type WarehouseData = MeshData[];

  export interface Database {
    run(arg0: string): unknown;
    prepare(arg0: string): unknown;
    export(): Uint8Array;
  }

  export interface Geometry {
    vertices: number[];
    indices: number[];
  }
  
  export interface DisplayAttributes {
    color?: number;
  }
  
  export interface IndexedDBItem {
    id: number;
    name: string;
    geometry: Geometry;
    displayAttributes: DisplayAttributes;
    hash: string;
    geometryBlob: Blob;
  }
  
  export interface SQLiteItem extends IndexedDBItem {
    metadata?: string;
    name: string;
    layerIndex: number;
    visible: boolean;
  }
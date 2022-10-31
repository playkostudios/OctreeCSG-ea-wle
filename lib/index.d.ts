declare module 'octreecsg-ea-wle/conversion/add-octree-to-object' {
  /// <reference path="../../../../home/rafael/Projects/JS/OctreeCSG-ea-wle/types/globals.d.ts" />
  import type { OctreeCSG } from 'octreecsg-ea';
  export default function wleAddOctreeCSGToObject(object: WL.Object, octree: OctreeCSG, materialMap: Readonly<Map<number, WL.Material>>): void;

}
declare module 'octreecsg-ea-wle/conversion/mesh-to-octree' {
  /// <reference path="../../../../home/rafael/Projects/JS/OctreeCSG-ea-wle/types/globals.d.ts" />
  import { OctreeCSG } from 'octreecsg-ea';
  export default function wleMeshToOctreeCSG(mesh: WL.Mesh, materialID?: number): OctreeCSG;

}
declare module 'octreecsg-ea-wle/conversion/octree-to-mesh' {
  /// <reference path="../../../../home/rafael/Projects/JS/OctreeCSG-ea-wle/types/globals.d.ts" />
  import type { OctreeCSG } from 'octreecsg-ea';
  export default function wleOctreeCSGToMesh(octree: OctreeCSG, materialMap: Readonly<Map<number, WL.Material>>): Map<WL.Material, WL.Mesh>;

}
declare module 'octreecsg-ea-wle/index' {
  export { default as wleMeshToOctreeCSG } from 'octreecsg-ea-wle/conversion/mesh-to-octree';
  export { default as wleOctreeCSGToMesh } from 'octreecsg-ea-wle/conversion/octree-to-mesh';
  export { default as wleAddOctreeCSGToObject } from 'octreecsg-ea-wle/conversion/add-octree-to-object';

}
declare module 'octreecsg-ea-wle' {
  import main = require('octreecsg-ea-wle/index');
  export = main;
}
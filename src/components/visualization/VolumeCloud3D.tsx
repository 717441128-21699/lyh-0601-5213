import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CloudData } from '../../types';

/**
 * 场类型定义
 */
export type FieldType = 'volumeFraction' | 'concentration' | 'velocity' | 'temperature' | 'pressure';

/**
 * 切片轴类型
 */
export type SliceAxis = 'x' | 'y' | 'z';

/**
 * 渲染模式
 */
export type RenderMode = 'volume' | 'isosurface' | 'slice' | 'streamline';

/**
 * 颜色映射名称
 */
export type ColormapName = 'viridis' | 'plasma' | 'rainbow' | 'coolwarm' | 'jet' | 'grayscale';

/**
 * 云图数据扩展接口
 * 扩展自 CloudData，支持多场数据
 */
export interface SimulationCloudData extends CloudData {
  velocityData?: { u: number[][][]; v: number[][][]; w: number[][][] };
  concentrationData?: Record<string, number[][][]>;
  fieldName?: string;
  unit?: string;
}

/**
 * VolumeCloud3D 组件属性
 */
export interface VolumeCloud3DProps {
  data: SimulationCloudData;
  fieldType: FieldType;
  elementIndex?: number;
  colormap?: ColormapName;
  opacity?: number;
  threshold?: number;
  showSlice?: boolean;
  sliceAxis?: SliceAxis;
  slicePosition?: number;
  renderMode?: RenderMode;
  showAxes?: boolean;
  showGrid?: boolean;
  showColorBar?: boolean;
  cameraPosition?: [number, number, number];
  style?: React.CSSProperties;
  className?: string;
  valueRange?: [number, number];
  raymarchingSteps?: number;
}

/**
 * 颜色映射函数定义
 */
const COLORMAPS: Record<ColormapName, (t: number) => THREE.Color> = {
  viridis: (t: number) => new THREE.Color().setHSL(0.3 + t * 0.4, 0.8, 0.3 + t * 0.5),
  plasma: (t: number) => new THREE.Color().setHSL(0.8 - t * 0.6, 0.9, 0.4 + t * 0.4),
  rainbow: (t: number) => new THREE.Color().setHSL(1 - t, 1, 0.5),
  coolwarm: (t: number) => {
    const c = new THREE.Color();
    if (t < 0.5) c.setRGB(0, t * 2, 1);
    else c.setRGB((t - 0.5) * 2, 1 - (t - 0.5) * 2, 0);
    return c;
  },
  jet: (t: number) => {
    const c = new THREE.Color();
    if (t < 0.25) c.setRGB(0, t * 4, 1);
    else if (t < 0.5) c.setRGB(0, 1, 1 - (t - 0.25) * 4);
    else if (t < 0.75) c.setRGB((t - 0.5) * 4, 1, 0);
    else c.setRGB(1, 1 - (t - 0.75) * 4, 0);
    return c;
  },
  grayscale: (t: number) => new THREE.Color(t, t, t),
};

/**
 * 创建颜色纹理
 */
function createColormapTexture(colormap: ColormapName, size: number = 256): THREE.DataTexture {
  const data = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const color = COLORMAPS[colormap](t);
    data[i * 4] = Math.floor(color.r * 255);
    data[i * 4 + 1] = Math.floor(color.g * 255);
    data[i * 4 + 2] = Math.floor(color.b * 255);
    data[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 将三维数组转换为Three.js 3D纹理
 */
function create3DTexture(
  data: number[][][],
  dimensions: { x: number; y: number; z: number }
): THREE.Data3DTexture {
  const { x, y, z } = dimensions;
  const size = x * y * z;
  const array = new Float32Array(size);

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < z; k++) {
        const index = i * y * z + j * z + k;
        array[index] = data[i][j][k];
      }
    }
  }

  const texture = new THREE.Data3DTexture(array, x, y, z);
  texture.format = THREE.RedFormat;
  texture.type = THREE.FloatType;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * 体绘制顶点着色器
 */
const volumeVertexShader = `
  varying vec3 vOrigin;
  varying vec3 vDirection;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vDirection = position - vOrigin;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * 体绘制片元着色器 - 使用光线步进算法
 */
const volumeFragmentShader = `
  precision highp float;
  precision highp sampler3D;

  uniform sampler3D uVolume;
  uniform sampler2D uColormap;
  uniform float uOpacity;
  uniform float uMinValue;
  uniform float uMaxValue;
  uniform int uSteps;
  uniform vec3 uBoxSize;

  varying vec3 vOrigin;
  varying vec3 vDirection;

  vec2 hitBox(vec3 orig, vec3 dir, vec3 boxMin, vec3 boxMax) {
    vec3 invDir = 1.0 / dir;
    vec3 tmin0 = (boxMin - orig) * invDir;
    vec3 tmax0 = (boxMax - orig) * invDir;
    vec3 tmin1 = min(tmin0, tmax0);
    vec3 tmax1 = max(tmin0, tmax0);
    float tmin = max(tmin1.x, max(tmin1.y, tmin1.z));
    float tmax = min(tmax1.x, min(tmax1.y, tmax1.z));
    return vec2(tmin, tmax);
  }

  void main() {
    vec3 boxMin = -uBoxSize * 0.5;
    vec3 boxMax = uBoxSize * 0.5;

    vec2 t = hitBox(vOrigin, normalize(vDirection), boxMin, boxMax);
    if (t.x > t.y) discard;

    t.x = max(t.x, 0.0);

    vec3 start = vOrigin + vDirection * t.x;
    vec3 end = vOrigin + vDirection * t.y;
    float len = length(end - start);
    vec3 step = normalize(vDirection) * (len / float(uSteps));

    vec4 color = vec4(0.0);
    vec3 pos = start;

    for (int i = 0; i < 500; i++) {
      if (i >= uSteps) break;
      if (color.a >= 0.95) break;

      vec3 uvw = (pos - boxMin) / uBoxSize;
      float value = texture(uVolume, uvw).r;
      float normalizedValue = (value - uMinValue) / (uMaxValue - uMinValue);
      normalizedValue = clamp(normalizedValue, 0.0, 1.0);

      vec4 sampledColor = texture2D(uColormap, vec2(normalizedValue, 0.5));
      float alpha = normalizedValue * uOpacity * 0.1;

      color.rgb = color.rgb + (1.0 - color.a) * sampledColor.rgb * alpha;
      color.a = color.a + (1.0 - color.a) * alpha;

      pos += step;
    }

    if (color.a < 0.01) discard;

    gl_FragColor = color;
  }
`;

/**
 * 体绘制组件
 */
const VolumeRendering: React.FC<{
  volumeTexture: THREE.Data3DTexture;
  colormapTexture: THREE.DataTexture;
  boxSize: [number, number, number];
  opacity: number;
  minValue: number;
  maxValue: number;
  steps: number;
}> = ({ volumeTexture, colormapTexture, boxSize, opacity, minValue, maxValue, steps }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uVolume: { value: volumeTexture },
      uColormap: { value: colormapTexture },
      uOpacity: { value: opacity },
      uMinValue: { value: minValue },
      uMaxValue: { value: maxValue },
      uSteps: { value: steps },
      uBoxSize: { value: new THREE.Vector3(...boxSize) },
    }),
    [volumeTexture, colormapTexture, opacity, minValue, maxValue, steps]
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
  }, [opacity]);

  return (
    <mesh>
      <boxGeometry args={boxSize} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={volumeVertexShader}
        fragmentShader={volumeFragmentShader}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

/**
 * 等值面顶点着色器
 */
const isosurfaceVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/**
 * 等值面片元着色器
 */
const isosurfaceFragmentShader = `
  precision highp float;

  uniform sampler2D uColormap;
  uniform float uThreshold;
  uniform float uMinValue;
  uniform float uMaxValue;
  uniform vec3 uLightDirection;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    float normalizedValue = (uThreshold - uMinValue) / (uMaxValue - uMinValue);
    normalizedValue = clamp(normalizedValue, 0.0, 1.0);

    vec4 baseColor = texture2D(uColormap, vec2(normalizedValue, 0.5));

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDirection);
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    vec3 ambient = 0.3 * baseColor.rgb;
    vec3 diffuseColor = 0.7 * diffuse * baseColor.rgb;
    vec3 specularColor = 0.5 * specular * vec3(1.0);

    vec3 finalColor = ambient + diffuseColor + specularColor;

    gl_FragColor = vec4(finalColor, 0.8);
  }
`;

/**
 * 线性插值计算等值面顶点
 */
function interpolate(
  v1: number,
  v2: number,
  p1: [number, number, number],
  p2: [number, number, number],
  threshold: number
): [number, number, number] {
  if (Math.abs(v2 - v1) < 1e-10) return p1;
  const t = (threshold - v1) / (v2 - v1);
  return [
    p1[0] + t * (p2[0] - p1[0]),
    p1[1] + t * (p2[1] - p1[1]),
    p1[2] + t * (p2[2] - p1[2]),
  ];
}

/**
 * 等值面组件 - 使用简化的Marching Cubes算法
 */
const Isosurface: React.FC<{
  data: number[][][];
  dimensions: { x: number; y: number; z: number };
  colormapTexture: THREE.DataTexture;
  threshold: number;
  minValue: number;
  maxValue: number;
  boxSize: [number, number, number];
}> = ({ data, dimensions, colormapTexture, threshold, minValue, maxValue, boxSize }) => {
  const geometry = useMemo(() => {
    const { x, y, z } = dimensions;
    const positions: number[] = [];
    const normals: number[] = [];

    const scaleX = boxSize[0] / (x - 1);
    const scaleY = boxSize[1] / (y - 1);
    const scaleZ = boxSize[2] / (z - 1);

    for (let i = 0; i < x - 1; i++) {
      for (let j = 0; j < y - 1; j++) {
        for (let k = 0; k < z - 1; k++) {
          const v000 = data[i][j][k];
          const v100 = data[i + 1][j][k];
          const v010 = data[i][j + 1][k];
          const v110 = data[i + 1][j + 1][k];
          const v001 = data[i][j][k + 1];
          const v101 = data[i + 1][j][k + 1];
          const v011 = data[i][j + 1][k + 1];
          const v111 = data[i + 1][j + 1][k + 1];

          let cubeIndex = 0;
          if (v000 < threshold) cubeIndex |= 1;
          if (v100 < threshold) cubeIndex |= 2;
          if (v110 < threshold) cubeIndex |= 4;
          if (v010 < threshold) cubeIndex |= 8;
          if (v001 < threshold) cubeIndex |= 16;
          if (v101 < threshold) cubeIndex |= 32;
          if (v111 < threshold) cubeIndex |= 64;
          if (v011 < threshold) cubeIndex |= 128;

          if (cubeIndex === 0 || cubeIndex === 255) continue;

          const px = (i - x / 2) * scaleX;
          const py = (j - y / 2) * scaleY;
          const pz = (k - z / 2) * scaleZ;

          const verts: [number, number, number][] = [
            [px, py, pz],
            [px + scaleX, py, pz],
            [px + scaleX, py + scaleY, pz],
            [px, py + scaleY, pz],
            [px, py, pz + scaleZ],
            [px + scaleX, py, pz + scaleZ],
            [px + scaleX, py + scaleY, pz + scaleZ],
            [px, py + scaleY, pz + scaleZ],
          ];

          const values = [v000, v100, v110, v010, v001, v101, v111, v011];

          const edgeVerts: ([number, number, number] | null)[] = [];

          const edgeTable = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
          ];

          for (let e = 0; e < 12; e++) {
            if ((cubeIndex >> e) & 1) {
              const [a, b] = edgeTable[e];
              edgeVerts[e] = interpolate(values[a], values[b], verts[a], verts[b], threshold);
            } else {
              edgeVerts[e] = null;
            }
          }

          const triTable = [
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            9, 2, 10, 9, 1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
            3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            0, 11, 2, 0, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
            3, 10, 1, 10, 2, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            3, 10, 1, 3, 8, 10, 1, 0, 10, -1, -1, -1, -1, -1, -1, -1,
            2, 9, 0, 2, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
            6, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          ];

          const triIndex = cubeIndex * 16;
          for (let t = 0; t < 16; t += 3) {
            const idx1 = triTable[triIndex + t];
            const idx2 = triTable[triIndex + t + 1];
            const idx3 = triTable[triIndex + t + 2];
            if (idx1 < 0) break;

            const v1 = edgeVerts[idx1];
            const v2 = edgeVerts[idx2];
            const v3 = edgeVerts[idx3];
            if (!v1 || !v2 || !v3) continue;

            positions.push(...v1, ...v2, ...v3);

            const nx1 = v2[0] - v1[0];
            const ny1 = v2[1] - v1[1];
            const nz1 = v2[2] - v1[2];
            const nx2 = v3[0] - v1[0];
            const ny2 = v3[1] - v1[1];
            const nz2 = v3[2] - v1[2];

            const nxn = ny1 * nz2 - nz1 * ny2;
            const nyn = nz1 * nx2 - nx1 * nz2;
            const nzn = nx1 * ny2 - ny1 * nx2;
            const nlen = Math.sqrt(nxn * nxn + nyn * nyn + nzn * nzn);
            if (nlen > 0) {
              normals.push(
                nxn / nlen, nyn / nlen, nzn / nlen,
                nxn / nlen, nyn / nlen, nzn / nlen,
                nxn / nlen, nyn / nlen, nzn / nlen
              );
            }
          }
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length > 0) {
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    }
    return geom;
  }, [data, dimensions, threshold, boxSize]);

  const uniforms = useMemo(
    () => ({
      uColormap: { value: colormapTexture },
      uThreshold: { value: threshold },
      uMinValue: { value: minValue },
      uMaxValue: { value: maxValue },
      uLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    }),
    [colormapTexture, threshold, minValue, maxValue]
  );

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={isosurfaceVertexShader}
        fragmentShader={isosurfaceFragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/**
 * 切片平面片元着色器
 */
const sliceFragmentShader = `
  precision highp float;
  precision highp sampler3D;

  uniform sampler3D uVolume;
  uniform sampler2D uColormap;
  uniform float uMinValue;
  uniform float uMaxValue;
  uniform int uAxis;
  uniform float uPosition;
  uniform vec3 uBoxSize;

  varying vec3 vPosition;

  void main() {
    vec3 boxMin = -uBoxSize * 0.5;
    vec3 boxMax = uBoxSize * 0.5;

    vec3 uvw = (vPosition - boxMin) / uBoxSize;
    uvw = clamp(uvw, 0.0, 1.0);

    float value = texture(uVolume, uvw).r;
    float normalizedValue = (value - uMinValue) / (uMaxValue - uMinValue);
    normalizedValue = clamp(normalizedValue, 0.0, 1.0);

    vec4 color = texture2D(uColormap, vec2(normalizedValue, 0.5));
    gl_FragColor = vec4(color.rgb, 0.95);
  }
`;

/**
 * 切片平面顶点着色器
 */
const sliceVertexShader = `
  varying vec3 vPosition;

  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * 切片平面组件
 */
const SlicePlane: React.FC<{
  volumeTexture: THREE.Data3DTexture;
  colormapTexture: THREE.DataTexture;
  axis: SliceAxis;
  position: number;
  minValue: number;
  maxValue: number;
  boxSize: [number, number, number];
}> = ({ volumeTexture, colormapTexture, axis, position, minValue, maxValue, boxSize }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    let geom: THREE.BufferGeometry;
    const [bx, by, bz] = boxSize;

    if (axis === 'x') {
      geom = new THREE.PlaneGeometry(by, bz);
      geom.translate((position - 0.5) * bx, 0, 0);
      geom.rotateY(Math.PI / 2);
    } else if (axis === 'y') {
      geom = new THREE.PlaneGeometry(bx, bz);
      geom.translate(0, (position - 0.5) * by, 0);
      geom.rotateX(-Math.PI / 2);
    } else {
      geom = new THREE.PlaneGeometry(bx, by);
      geom.translate(0, 0, (position - 0.5) * bz);
    }
    return geom;
  }, [axis, position, boxSize]);

  const uniforms = useMemo(
    () => ({
      uVolume: { value: volumeTexture },
      uColormap: { value: colormapTexture },
      uMinValue: { value: minValue },
      uMaxValue: { value: maxValue },
      uAxis: { value: axis === 'x' ? 0 : axis === 'y' ? 1 : 2 },
      uPosition: { value: position },
      uBoxSize: { value: new THREE.Vector3(...boxSize) },
    }),
    [volumeTexture, colormapTexture, minValue, maxValue, axis, position, boxSize]
  );

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={sliceVertexShader}
        fragmentShader={sliceFragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/**
 * 流线组件 - 可视化速度场
 */
const Streamlines: React.FC<{
  velocityData: { u: number[][][]; v: number[][][]; w: number[][][] };
  dimensions: { x: number; y: number; z: number };
  minValue: number;
  maxValue: number;
  colormapTexture: THREE.DataTexture;
  boxSize: [number, number, number];
}> = ({ velocityData, dimensions, minValue, maxValue, colormapTexture, boxSize }) => {
  const linesGeometry = useMemo(() => {
    const { x, y, z } = dimensions;
    const positions: number[] = [];

    const scaleX = boxSize[0] / (x - 1);
    const scaleY = boxSize[1] / (y - 1);
    const scaleZ = boxSize[2] / (z - 1);

    const seedCount = 20;
    const steps = 50;
    const stepSize = 0.05;

    for (let s = 0; s < seedCount; s++) {
      let ix = Math.floor(Math.random() * (x - 2)) + 1;
      let iy = Math.floor(Math.random() * (y - 2)) + 1;
      let iz = Math.floor(Math.random() * (z - 2)) + 1;

      for (let step = 0; step < steps; step++) {
        const px = (ix - x / 2) * scaleX;
        const py = (iy - y / 2) * scaleY;
        const pz = (iz - z / 2) * scaleZ;

        positions.push(px, py, pz);

        const u = velocityData.u[ix][iy][iz];
        const v = velocityData.v[ix][iy][iz];
        const w = velocityData.w[ix][iy][iz];

        ix = Math.max(0, Math.min(x - 1, ix + u * stepSize));
        iy = Math.max(0, Math.min(y - 1, iy + v * stepSize));
        iz = Math.max(0, Math.min(z - 1, iz + w * stepSize));

        if (ix < 1 || ix >= x - 1 || iy < 1 || iy >= y - 1 || iz < 1 || iz >= z - 1) {
          break;
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [velocityData, dimensions, boxSize]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
    });
  }, []);

  return <lineSegments geometry={linesGeometry} material={material} />;
};

/**
 * 坐标轴组件
 */
const Axes: React.FC<{ size: number }> = ({ size }) => {
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, size, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, size, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="green" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, size])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="blue" />
      </line>
      <Html position={[size + 0.1, 0, 0]} center>
        <span style={{ color: 'red', fontSize: 12, fontWeight: 'bold' }}>X</span>
      </Html>
      <Html position={[0, size + 0.1, 0]} center>
        <span style={{ color: 'green', fontSize: 12, fontWeight: 'bold' }}>Y</span>
      </Html>
      <Html position={[0, 0, size + 0.1]} center>
        <span style={{ color: 'blue', fontSize: 12, fontWeight: 'bold' }}>Z</span>
      </Html>
    </group>
  );
};

/**
 * 颜色条组件
 */
const ColorBar: React.FC<{
  colormap: ColormapName;
  minValue: number;
  maxValue: number;
  unit?: string;
  fieldName?: string;
}> = ({ colormap, minValue, maxValue, unit, fieldName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i < height; i++) {
      const t = 1 - i / height;
      const color = COLORMAPS[colormap](t);
      ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
      ctx.fillRect(0, i, width, 1);
    }
  }, [colormap]);

  return (
    <div style={{
      position: 'absolute',
      right: 20,
      top: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      borderRadius: 8,
      color: 'white',
      fontFamily: 'monospace',
      zIndex: 100,
    } as React.CSSProperties}>
      {fieldName && (
        <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 'bold' }}>{fieldName}</div>
      )}
      <canvas ref={canvasRef} width={30} height={200} style={{ borderRadius: 4 }} />
      <div style={{ fontSize: 11, marginTop: 8, textAlign: 'right', width: '100%' }}>
        <div>{maxValue.toFixed(4)}</div>
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {unit && <span style={{ fontSize: 10 }}>{unit}</span>}
        </div>
        <div>{minValue.toFixed(4)}</div>
      </div>
    </div>
  );
};

/**
 * 边界框组件
 */
const BoundingBox: React.FC<{ size: [number, number, number]; color?: string }> = ({
  size,
  color = '#ffffff',
}) => {
  const [sx, sy, sz] = size;
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;

  const points = useMemo(() => {
    return new Float32Array([
      -hx, -hy, -hz, hx, -hy, -hz,
      hx, -hy, -hz, hx, hy, -hz,
      hx, hy, -hz, -hx, hy, -hz,
      -hx, hy, -hz, -hx, -hy, -hz,
      -hx, -hy, hz, hx, -hy, hz,
      hx, -hy, hz, hx, hy, hz,
      hx, hy, hz, -hx, hy, hz,
      -hx, hy, hz, -hx, -hy, hz,
      -hx, -hy, -hz, -hx, -hy, hz,
      hx, -hy, -hz, hx, -hy, hz,
      hx, hy, -hz, hx, hy, hz,
      -hx, hy, -hz, -hx, hy, hz,
    ]);
  }, [sx, sy, sz]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={24}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </lineSegments>
  );
};

/**
 * 获取场数据的显示名称
 */
const getFieldDisplayName = (fieldType: FieldType): string => {
  const names: Record<FieldType, string> = {
    volumeFraction: '体积分数',
    concentration: '浓度分布',
    velocity: '速度场',
    temperature: '温度场',
    pressure: '压力场',
  };
  return names[fieldType];
};

/**
 * 获取场数据的单位
 */
const getFieldUnit = (fieldType: FieldType): string => {
  const units: Record<FieldType, string> = {
    volumeFraction: '',
    concentration: 'mol/L',
    velocity: 'm/s',
    temperature: '°C',
    pressure: 'Pa',
  };
  return units[fieldType];
};

/**
 * 3D场景内容组件
 */
const SceneContent: React.FC<{
  data: SimulationCloudData;
  fieldType: FieldType;
  elementIndex?: number;
  colormap: ColormapName;
  opacity: number;
  threshold: number;
  showSlice: boolean;
  sliceAxis: SliceAxis;
  slicePosition: number;
  renderMode: RenderMode;
  showAxes: boolean;
  showGrid: boolean;
  cameraPosition: [number, number, number];
  valueRange?: [number, number];
  raymarchingSteps: number;
}> = ({
  data,
  fieldType,
  elementIndex,
  colormap,
  opacity,
  threshold,
  showSlice,
  sliceAxis,
  slicePosition,
  renderMode,
  showAxes,
  showGrid,
  cameraPosition,
  valueRange,
  raymarchingSteps,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...cameraPosition);
    camera.lookAt(0, 0, 0);
  }, [camera, cameraPosition]);

  const activeData = useMemo(() => {
    if (fieldType === 'concentration' && data.concentrationData) {
      const keys = Object.keys(data.concentrationData);
      const idx = elementIndex ?? 0;
      if (idx >= 0 && idx < keys.length) {
        const elementData = data.concentrationData[keys[idx]];
        let minV = Infinity;
        let maxV = -Infinity;
        for (let i = 0; i < elementData.length; i++) {
          for (let j = 0; j < elementData[i].length; j++) {
            for (let k = 0; k < elementData[i][j].length; k++) {
              minV = Math.min(minV, elementData[i][j][k]);
              maxV = Math.max(maxV, elementData[i][j][k]);
            }
          }
        }
        return {
          data: elementData,
          dimensions: data.dimensions,
          minValue: minV,
          maxValue: maxV,
        };
      }
    }
    return {
      data: data.data,
      dimensions: data.dimensions,
      minValue: data.minValue,
      maxValue: data.maxValue,
    };
  }, [data, fieldType, elementIndex]);

  const minValue = valueRange?.[0] ?? activeData.minValue;
  const maxValue = valueRange?.[1] ?? activeData.maxValue;

  const boxSize: [number, number, number] = useMemo(() => {
    const { x, y, z } = activeData.dimensions;
    const maxDim = Math.max(x, y, z);
    return [x / maxDim * 4, y / maxDim * 4, z / maxDim * 4];
  }, [activeData.dimensions]);

  const volumeTexture = useMemo(
    () => create3DTexture(activeData.data, activeData.dimensions),
    [activeData.data, activeData.dimensions]
  );

  const colormapTexture = useMemo(
    () => createColormapTexture(colormap),
    [colormap]
  );

  const thresholdValue = useMemo(() => {
    return minValue + threshold * (maxValue - minValue);
  }, [minValue, maxValue, threshold]);

  const gridSize = Math.max(...boxSize);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <BoundingBox size={boxSize} />

      {renderMode === 'volume' && (
        <VolumeRendering
          volumeTexture={volumeTexture}
          colormapTexture={colormapTexture}
          boxSize={boxSize}
          opacity={opacity}
          minValue={minValue}
          maxValue={maxValue}
          steps={raymarchingSteps}
        />
      )}

      {renderMode === 'isosurface' && (
        <Isosurface
          data={activeData.data}
          dimensions={activeData.dimensions}
          colormapTexture={colormapTexture}
          threshold={thresholdValue}
          minValue={minValue}
          maxValue={maxValue}
          boxSize={boxSize}
        />
      )}

      {renderMode === 'slice' && showSlice && (
        <SlicePlane
          volumeTexture={volumeTexture}
          colormapTexture={colormapTexture}
          axis={sliceAxis}
          position={slicePosition}
          minValue={minValue}
          maxValue={maxValue}
          boxSize={boxSize}
        />
      )}

      {renderMode === 'streamline' && data.velocityData && (
        <Streamlines
          velocityData={data.velocityData}
          dimensions={activeData.dimensions}
          minValue={minValue}
          maxValue={maxValue}
          colormapTexture={colormapTexture}
          boxSize={boxSize}
        />
      )}

      {showSlice && renderMode !== 'slice' && (
        <SlicePlane
          volumeTexture={volumeTexture}
          colormapTexture={colormapTexture}
          axis={sliceAxis}
          position={slicePosition}
          minValue={minValue}
          maxValue={maxValue}
          boxSize={boxSize}
        />
      )}

      {showAxes && <Axes size={gridSize * 0.6} />}

      {showGrid && (
        <Grid
          args={[gridSize, 20]}
          position={[0, -boxSize[1] / 2 - 0.01, 0]}
          cellSize={gridSize / 20}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={gridSize / 4}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />
    </>
  );
};

/**
 * 主组件：VolumeCloud3D
 * 3D云图可视化组件，支持多种标量场的可视化
 */
export const VolumeCloud3D: React.FC<VolumeCloud3DProps> = ({
  data,
  fieldType,
  elementIndex = 0,
  colormap = 'viridis',
  opacity = 0.5,
  threshold = 0.5,
  showSlice = false,
  sliceAxis = 'z',
  slicePosition = 0.5,
  renderMode = 'volume',
  showAxes = true,
  showGrid = true,
  showColorBar = true,
  cameraPosition = [3, 3, 3],
  style,
  className,
  valueRange,
  raymarchingSteps = 128,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = data.fieldName || getFieldDisplayName(fieldType);
  const displayUnit = data.unit || getFieldUnit(fieldType);

  const minValue = valueRange?.[0] ?? data.minValue;
  const maxValue = valueRange?.[1] ?? data.maxValue;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: cameraPosition, fov: 45 }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 5, 30]} />
        <SceneContent
          data={data}
          fieldType={fieldType}
          elementIndex={elementIndex}
          colormap={colormap}
          opacity={opacity}
          threshold={threshold}
          showSlice={showSlice}
          sliceAxis={sliceAxis}
          slicePosition={slicePosition}
          renderMode={renderMode}
          showAxes={showAxes}
          showGrid={showGrid}
          cameraPosition={cameraPosition}
          valueRange={valueRange}
          raymarchingSteps={raymarchingSteps}
        />
      </Canvas>

      {showColorBar && (
        <ColorBar
          colormap={colormap}
          minValue={minValue}
          maxValue={maxValue}
          unit={displayUnit}
          fieldName={displayName}
        />
      )}

      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '8px 12px',
        borderRadius: 6,
        color: 'white',
        fontSize: 11,
        fontFamily: 'monospace',
        zIndex: 100,
      }}>
        <div>
          <strong>{displayName}</strong>
          {displayUnit && ` (${displayUnit})`}
        </div>
        <div style={{ marginTop: 4, opacity: 0.8 }}>
          分辨率: {data.dimensions.x} × {data.dimensions.y} × {data.dimensions.z}
        </div>
        <div style={{ opacity: 0.8 }}>
          范围: [{minValue.toFixed(4)}, {maxValue.toFixed(4)}]
        </div>
      </div>
    </div>
  );
};

export default VolumeCloud3D;

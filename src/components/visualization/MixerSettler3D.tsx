import React, { useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MixerSettlerGeometry, SimulationResults, ImpellerType } from '../../types';

/**
 * 混合澄清槽3D可视化组件属性接口
 */
interface MixerSettler3DProps {
  /** 几何参数 */
  geometry: MixerSettlerGeometry;
  /** 模拟结果数据 */
  simulationResult?: SimulationResults;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 是否显示坐标轴 */
  showAxes?: boolean;
  /** 是否自动旋转 */
  autoRotate?: boolean;
  /** 剖切平面 */
  sectionPlane?: 'x' | 'y' | 'z' | null;
  /** 点击某级的回调函数 */
  onStageClick?: (stageIndex: number) => void;
}

/**
 * 搅拌桨组件属性接口
 */
interface ImpellerProps {
  /** 搅拌桨类型 */
  type: ImpellerType;
  /** 搅拌桨直径 */
  diameter: number;
  /** 搅拌转速 */
  speed: number;
  /** 位置 */
  position: [number, number, number];
}

/**
 * 单个级组件属性接口
 */
interface StageProps {
  /** 级索引 */
  index: number;
  /** 几何参数 */
  geometry: MixerSettlerGeometry;
  /** X轴偏移量 */
  xOffset: number;
  /** 模拟结果数据 */
  simulationResult?: SimulationResults;
  /** 剖切平面 */
  sectionPlane?: 'x' | 'y' | 'z' | null;
  /** 点击回调 */
  onClick?: (stageIndex: number) => void;
}

/**
 * 颜色插值函数：根据体积分数计算颜色
 * 水相(0)为蓝色，有机相(1)为橙色
 * @param fraction - 有机相体积分数 (0-1)
 * @returns 三维颜色向量
 */
const getVolumeFractionColor = (fraction: number): THREE.Color => {
  const blue = new THREE.Color(0x2563eb);
  const orange = new THREE.Color(0xf97316);
  return blue.clone().lerp(orange, fraction);
};

/**
 * 搅拌桨组件
 * 支持多种类型的搅拌桨，并实现旋转动画
 */
const Impeller: React.FC<ImpellerProps> = ({ type, diameter, speed, position }) => {
  const groupRef = useRef<THREE.Group>(null);

  /**
   * 每帧更新搅拌桨旋转角度
   */
  useFrame((_, delta) => {
    if (groupRef.current) {
      const rotationSpeed = (speed * Math.PI * 2) / 60;
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  /**
   * 根据搅拌桨类型渲染不同的几何体
   */
  const renderImpeller = useMemo(() => {
    const radius = diameter / 2;
    const height = diameter * 0.15;

    switch (type) {
      case ImpellerType.TURBINE:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[radius * 0.1, radius * 0.1, height * 2, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
                <boxGeometry args={[radius * 0.8, height, radius * 0.12]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );

      case ImpellerType.PADDLE:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[radius * 0.1, radius * 0.1, height * 2, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            {[0, 1].map((i) => (
              <mesh key={i} rotation={[0, i * Math.PI, 0]}>
                <boxGeometry args={[radius * 0.9, height * 0.8, radius * 0.15]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );

      case ImpellerType.PROPELLER:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[radius * 0.12, radius * 0.12, height * 2, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, Math.PI / 6]} position={[radius * 0.4, 0, 0]}>
                <boxGeometry args={[radius * 0.6, height * 0.3, radius * 0.08]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );

      case ImpellerType.RUSHTON:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[radius * 0.7, radius * 0.7, height * 0.3, 24]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={i} position={[radius * 0.55 * Math.cos((i * Math.PI) / 3), 0, radius * 0.55 * Math.sin((i * Math.PI) / 3)]}>
                <boxGeometry args={[radius * 0.2, height * 0.8, radius * 0.08]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );

      case ImpellerType.HElical:
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[radius * 0.1, radius * 0.1, height * 3, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, -height + i * height * 0.6, 0]} rotation={[0, i * Math.PI / 4, 0]}>
                <torusGeometry args={[radius * 0.8, radius * 0.06, 8, 32, Math.PI]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );

      default:
        return (
          <mesh>
            <cylinderGeometry args={[radius * 0.1, radius * 0.1, height * 2, 16]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        );
    }
  }, [type, diameter]);

  return (
    <group ref={groupRef} position={position}>
      {renderImpeller}
    </group>
  );
};

/**
 * 体积分数可视化组件
 * 使用顶点颜色显示两相分布（水相蓝色在下，有机相橙色在上）
 */
const VolumeFractionBox: React.FC<{
  size: [number, number, number];
  simulationResult?: SimulationResults;
  clippingPlanes: THREE.Plane[];
  phaseRatio: number;
}> = ({ size, simulationResult, clippingPlanes, phaseRatio }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const vertexCount = positionAttribute.count;
    const colors = new Float32Array(vertexCount * 3);

    const minY = positionAttribute.getY(0);
    let maxY = minY;
    for (let i = 1; i < vertexCount; i++) {
      const y = positionAttribute.getY(i);
      if (y > maxY) maxY = y;
    }

    const height = maxY - minY;
    const interfaceY = minY + height * phaseRatio;

    for (let i = 0; i < vertexCount; i++) {
      const y = positionAttribute.getY(i);
      let fraction: number;

      if (simulationResult?.volumeFractionCloud) {
        const { dimensions, data } = simulationResult.volumeFractionCloud;
        const xIdx = Math.min(Math.floor((positionAttribute.getX(i) + size[0] / 2) / size[0] * dimensions.x), dimensions.x - 1);
        const yIdx = Math.min(Math.floor((y - minY) / height * dimensions.y), dimensions.y - 1);
        const zIdx = Math.min(Math.floor((positionAttribute.getZ(i) + size[2] / 2) / size[2] * dimensions.z), dimensions.z - 1);
        fraction = data[zIdx]?.[yIdx]?.[xIdx] ?? (y > interfaceY ? 1 : 0);
      } else {
        fraction = y > interfaceY ? 1 : 0;
      }

      const color = getVolumeFractionColor(fraction);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
  }, [simulationResult, phaseRatio, size]);

  return (
    <mesh ref={meshRef} position={[0, -0.01, 0]}>
      <boxGeometry args={size} />
      <meshBasicMaterial vertexColors clippingPlanes={clippingPlanes} transparent opacity={0.8} />
    </mesh>
  );
};

/**
 * 单个混合澄清级组件
 * 包含混合室、澄清室、搅拌桨、挡板、溢流堰等结构
 */
const Stage: React.FC<StageProps> = ({ index, geometry, xOffset, simulationResult, sectionPlane, onClick }) => {
  const { mixerLength, mixerWidth, mixerHeight, settlerLength, settlerWidth, settlerHeight } = geometry;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(index);
    }
  }, [index, onClick]);

  /**
   * 创建剖切平面对象
   */
  const clippingPlanes = useMemo(() => {
    if (!sectionPlane) return [];
    switch (sectionPlane) {
      case 'x':
        return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), xOffset)];
      case 'y':
        return [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)];
      case 'z':
        return [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
      default:
        return [];
    }
  }, [sectionPlane, xOffset]);

  const mixerX = xOffset + mixerLength / 2;
  const settlerX = xOffset + mixerLength + settlerLength / 2;
  const totalHeight = Math.max(mixerHeight, settlerHeight);
  const wallThickness = 0.02;

  return (
    <group onClick={handleClick}>
      <group position={[mixerX, mixerHeight / 2, 0]}>
        <mesh>
          <boxGeometry args={[mixerLength, mixerHeight, mixerWidth]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            transparent
            opacity={0.15}
            roughness={0.1}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>

        <VolumeFractionBox
          size={[mixerLength * 0.95, mixerHeight * 0.95, mixerWidth * 0.95]}
          simulationResult={simulationResult}
          clippingPlanes={clippingPlanes}
          phaseRatio={geometry.phaseRatio}
        />

        {[-1, 1].map((side) => (
          <mesh key={`baffle-${side}`} position={[side * (mixerLength / 2 - 0.08), 0, 0]}>
            <boxGeometry args={[wallThickness * 2, mixerHeight * 0.8, mixerWidth * 0.15]} />
            <meshStandardMaterial color="#94a3b8" clippingPlanes={clippingPlanes} />
          </mesh>
        ))}

        <Impeller
          type={geometry.impellerType}
          diameter={geometry.impellerDiameter}
          speed={geometry.stirringSpeed}
          position={[0, mixerHeight * 0.3, 0]}
        />

        {[-1, 1].map((side) => (
          <mesh key={`mixer-wall-${side}`} position={[side * mixerLength / 2, 0, 0]}>
            <boxGeometry args={[wallThickness, mixerHeight, mixerWidth]} />
            <meshPhysicalMaterial
              color="#cbd5e1"
              transparent
              opacity={0.3}
              roughness={0.2}
              metalness={0.1}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        ))}
      </group>

      <group position={[mixerX + mixerLength / 2 + 0.01, mixerHeight / 2, 0]}>
        <mesh>
          <boxGeometry args={[wallThickness, mixerHeight * 0.7, mixerWidth]} />
          <meshStandardMaterial color="#64748b" clippingPlanes={clippingPlanes} />
        </mesh>
        <mesh position={[0, mixerHeight * 0.15, 0]}>
          <boxGeometry args={[wallThickness, mixerHeight * 0.3, mixerWidth]} />
          <meshStandardMaterial color="#64748b" clippingPlanes={clippingPlanes} />
        </mesh>
      </group>

      <group position={[settlerX, settlerHeight / 2, 0]}>
        <mesh>
          <boxGeometry args={[settlerLength, settlerHeight, settlerWidth]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            transparent
            opacity={0.15}
            roughness={0.1}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>

        <VolumeFractionBox
          size={[settlerLength * 0.95, settlerHeight * 0.95, settlerWidth * 0.95]}
          simulationResult={simulationResult}
          clippingPlanes={clippingPlanes}
          phaseRatio={geometry.phaseRatio}
        />

        {[-1, 1].map((side) => (
          <mesh key={`settler-wall-${side}`} position={[side * settlerLength / 2, 0, 0]}>
            <boxGeometry args={[wallThickness, settlerHeight, settlerWidth]} />
            <meshPhysicalMaterial
              color="#cbd5e1"
              transparent
              opacity={0.3}
              roughness={0.2}
              metalness={0.1}
              clippingPlanes={clippingPlanes}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[xOffset + mixerLength / 2, totalHeight + 0.3, 0]}>
        <Html center distanceFactor={10}>
          <div
            className="px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg cursor-pointer hover:bg-slate-700 transition-colors whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick(index);
            }}
          >
            第 {index + 1} 级
          </div>
        </Html>
      </mesh>
    </group>
  );
};

/**
 * 出入口组件
 * 渲染水相和有机相的入口、出口管道
 */
const InletOutlet: React.FC<{
  position: [number, number, number];
  type: 'aqueous-in' | 'organic-in' | 'aqueous-out' | 'organic-out';
  sectionPlane?: 'x' | 'y' | 'z' | null;
}> = ({ position, type, sectionPlane }) => {
  const colors: Record<string, string> = {
    'aqueous-in': '#2563eb',
    'organic-in': '#f97316',
    'aqueous-out': '#3b82f6',
    'organic-out': '#fb923c',
  };

  const labels: Record<string, string> = {
    'aqueous-in': '水相入口',
    'organic-in': '有机相入口',
    'aqueous-out': '水相出口',
    'organic-out': '有机相出口',
  };

  const clippingPlanes = useMemo(() => {
    if (!sectionPlane) return [];
    switch (sectionPlane) {
      case 'x':
        return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), position[0])];
      case 'y':
        return [new THREE.Plane(new THREE.Vector3(0, -1, 0), position[1])];
      case 'z':
        return [new THREE.Plane(new THREE.Vector3(0, 0, -1), position[2])];
      default:
        return [];
    }
  }, [sectionPlane, position]);

  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={colors[type]} metalness={0.6} roughness={0.3} clippingPlanes={clippingPlanes} />
      </mesh>
      <mesh position={[0, 0, 0.25]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color={colors[type]} metalness={0.5} roughness={0.4} clippingPlanes={clippingPlanes} />
      </mesh>
      <Html position={[0, 0.3, 0]} center distanceFactor={15}>
        <div className="px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap" style={{ pointerEvents: 'none' }}>
          {labels[type]}
        </div>
      </Html>
    </group>
  );
};

/**
 * 混合澄清槽场景组件
 * 负责组装所有3D元素并处理场景级别的配置
 */
const MixerSettlerScene: React.FC<MixerSettler3DProps> = ({
  geometry,
  simulationResult,
  showGrid = true,
  showAxes = false,
  autoRotate = false,
  sectionPlane = null,
  onStageClick,
}) => {
  const totalWidth = (geometry.mixerLength + geometry.settlerLength) * geometry.stages;
  const totalHeight = Math.max(geometry.mixerHeight, geometry.settlerHeight);
  const totalDepth = Math.max(geometry.mixerWidth, geometry.settlerWidth);

  const clippingPlanes = useMemo(() => {
    if (!sectionPlane) return [];
    switch (sectionPlane) {
      case 'x':
        return [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)];
      case 'y':
        return [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
      case 'z':
        return [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
      default:
        return [];
    }
  }, [sectionPlane]);

  const stages = useMemo(() => {
    const stageElements: React.ReactElement[] = [];
    const stageWidth = geometry.mixerLength + geometry.settlerLength;

    for (let i = 0; i < geometry.stages; i++) {
      const xOffset = i * stageWidth - totalWidth / 2 + geometry.mixerLength / 2;
      stageElements.push(
        <Stage
          key={`stage-${i}`}
          index={i}
          geometry={geometry}
          xOffset={xOffset - geometry.mixerLength / 2}
          simulationResult={simulationResult}
          sectionPlane={sectionPlane}
          onClick={onStageClick}
        />
      );
    }

    return stageElements;
  }, [geometry, simulationResult, sectionPlane, onStageClick, totalWidth]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, totalHeight + 2, 0]} intensity={0.5} />

      {showGrid && (
        <Grid
          args={[Math.max(totalWidth * 1.5, 20), Math.max(totalDepth * 1.5, 10)]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#475569"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#334155"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
          position={[0, -0.01, 0]}
        />
      )}

      {showAxes && <axesHelper position={[-totalWidth / 2 - 1, 0, -totalDepth / 2 - 1]} args={[2]} />}

      <group position={[0, totalDepth / 2 + 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <boxGeometry args={[totalWidth + 0.2, totalDepth + 0.2, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.7} clippingPlanes={clippingPlanes} />
        </mesh>
      </group>

      {stages}

      <InletOutlet
        position={[-totalWidth / 2 - 0.3, geometry.mixerHeight * 0.3, -geometry.mixerWidth / 3]}
        type="aqueous-in"
        sectionPlane={sectionPlane}
      />
      <InletOutlet
        position={[-totalWidth / 2 - 0.3, geometry.mixerHeight * 0.6, geometry.mixerWidth / 3]}
        type="organic-in"
        sectionPlane={sectionPlane}
      />
      <InletOutlet
        position={[totalWidth / 2 + 0.3, geometry.settlerHeight * 0.3, -geometry.settlerWidth / 3]}
        type="aqueous-out"
        sectionPlane={sectionPlane}
      />
      <InletOutlet
        position={[totalWidth / 2 + 0.3, geometry.settlerHeight * 0.6, geometry.settlerWidth / 3]}
        type="organic-out"
        sectionPlane={sectionPlane}
      />

      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={50}
        target={[0, totalHeight / 2, 0]}
      />
    </>
  );
};

/**
 * 混合澄清槽3D可视化主组件
 * 提供响应式的3D场景容器
 */
const MixerSettler3D: React.FC<MixerSettler3DProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          localClippingEnabled: true,
        }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 20, 60]} />
        <MixerSettlerScene {...props} />
      </Canvas>
    </div>
  );
};

export default MixerSettler3D;

import React, { useState, useCallback } from 'react';
import {
  Collapse,
  Switch,
  Slider,
  Select,
  Button,
  Space,
  InputNumber,
  Radio,
  Row,
  Col,
  Divider,
  Tooltip,
  Drawer,
  Badge,
} from 'antd';
import {
  Grid3X3,
  Axis3D,
  RotateCcw,
  RefreshCw,
  Maximize2,
  Eye,

  Layers,
  Scissors,
  Palette,
  Droplets,
  Thermometer,
  Gauge,
  Waves,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Camera,
  Download,
  Film,
  FileJson,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  Target,
  X,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** 显示模式枚举 */
export type DisplayMode = 'solid' | 'wireframe' | 'transparent' | 'clip';

/** 剖切轴枚举 */
export type ClipAxis = 'x' | 'y' | 'z';

/** 场类型枚举 */
export type FieldType =
  | 'volumeFraction'
  | 'concentration'
  | 'velocity'
  | 'temperature'
  | 'pressure';

/** 颜色映射枚举 */
export type ColorMap =
  | 'viridis'
  | 'plasma'
  | 'rainbow'
  | 'coolwarm'
  | 'jet';

/** 预设视角枚举 */
export type PresetView =
  | 'front'
  | 'top'
  | 'side'
  | 'isometric';

/** 切片轴枚举 */
export type SliceAxis = 'x' | 'y' | 'z';

/** 播放速度枚举 */
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

/** 稀土元素类型 */
export type RareEarthElement =
  | 'La' | 'Ce' | 'Pr' | 'Nd' | 'Pm' | 'Sm' | 'Eu'
  | 'Gd' | 'Tb' | 'Dy' | 'Ho' | 'Er' | 'Tm' | 'Yb' | 'Lu' | 'Y' | 'Sc';

/** 视图控制状态接口 */
export interface ViewControls {
  showGrid: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
}

/** 剖切控制状态接口 */
export interface ClipControls {
  enabled: boolean;
  axis: ClipAxis;
  position: number;
  reverse: boolean;
}

/** 云图控制状态接口 */
export interface ContourControls {
  enabled: boolean;
  fieldType: FieldType;
  elements: RareEarthElement[];
  colorMap: ColorMap;
  opacity: number;
  minValue: number | null;
  maxValue: number | null;
}

/** 显示选项状态接口 */
export interface DisplayOptions {
  showIsosurface: boolean;
  isosurfaceThreshold: number;
  showStreamlines: boolean;
  streamlineCount: number;
  showSlicePlane: boolean;
  sliceAxis: SliceAxis;
  slicePosition: number;
  showGridLines: boolean;
}

/** 播放控制状态接口 */
export interface PlaybackControls {
  isPlaying: boolean;
  currentTime: number;
  totalTime: number;
  speed: PlaybackSpeed;
  currentFrame: number;
  totalFrames: number;
}

/** 可视化控制面板属性接口 */
export interface VisualizationControlsProps {
  /** 是否为动画数据 */
  isAnimationData?: boolean;
  /** 面板是否展开 */
  defaultOpen?: boolean;
  /** 视图控制回调 */
  onViewChange?: (controls: ViewControls) => void;
  /** 显示模式变化回调 */
  onDisplayModeChange?: (mode: DisplayMode) => void;
  /** 剖切控制回调 */
  onClipChange?: (controls: ClipControls) => void;
  /** 云图控制回调 */
  onContourChange?: (controls: ContourControls) => void;
  /** 显示选项回调 */
  onDisplayOptionsChange?: (options: DisplayOptions) => void;
  /** 播放控制回调 */
  onPlaybackChange?: (controls: PlaybackControls) => void;
  /** 重置视角回调 */
  onResetView?: () => void;
  /** 预设视角回调 */
  onPresetView?: (view: PresetView) => void;
  /** 截图回调 */
  onScreenshot?: () => void;
  /** 导出VTK回调 */
  onExportVTK?: () => void;
  /** 导出动画回调 */
  onExportAnimation?: (format: 'gif' | 'mp4') => void;
  /** 自定义类名 */
  className?: string;
  /** 稀土元素列表（用于浓度场选择） */
  availableElements?: RareEarthElement[];
}

/** 稀土元素标签映射 */
const RARE_EARTH_ELEMENT_LABELS: Record<RareEarthElement, string> = {
  La: '镧 (La)',
  Ce: '铈 (Ce)',
  Pr: '镨 (Pr)',
  Nd: '钕 (Nd)',
  Pm: '钷 (Pm)',
  Sm: '钐 (Sm)',
  Eu: '铕 (Eu)',
  Gd: '钆 (Gd)',
  Tb: '铽 (Tb)',
  Dy: '镝 (Dy)',
  Ho: '钬 (Ho)',
  Er: '铒 (Er)',
  Tm: '铥 (Tm)',
  Yb: '镱 (Yb)',
  Lu: '镥 (Lu)',
  Y: '钇 (Y)',
  Sc: '钪 (Sc)',
};

/** 场类型标签映射 */
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  volumeFraction: '体积分数',
  concentration: '浓度',
  velocity: '速度',
  temperature: '温度',
  pressure: '压力',
};

/** 颜色映射标签映射 */
const COLOR_MAP_LABELS: Record<ColorMap, string> = {
  viridis: 'Viridis',
  plasma: 'Plasma',
  rainbow: 'Rainbow',
  coolwarm: 'CoolWarm',
  jet: 'Jet',
};

/** 预设视角标签映射 */
const PRESET_VIEW_LABELS: Record<PresetView, string> = {
  front: '正视图',
  top: '俯视图',
  side: '侧视图',
  isometric: '等轴测',
};

/** 显示模式标签映射 */
const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  solid: '实体模式',
  wireframe: '线框模式',
  transparent: '透明模式',
  clip: '剖切模式',
};

/**
 * 可视化控制面板组件
 * 提供3D可视化的完整控制界面，包括视图控制、显示模式、剖切、云图、动画播放等功能
 */
const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  isAnimationData = false,
  defaultOpen = true,
  onViewChange,
  onDisplayModeChange,
  onClipChange,
  onContourChange,
  onDisplayOptionsChange,
  onPlaybackChange,
  onResetView,
  onPresetView,
  onScreenshot,
  onExportVTK,
  onExportAnimation,
  className,
  availableElements = ['La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Y'],
}) => {
  /** 面板展开/收起状态 */
  const [panelOpen, setPanelOpen] = useState(defaultOpen);
  /** 移动端抽屉显示状态 */
  const [drawerVisible, setDrawerVisible] = useState(false);

  /** 视图控制状态 */
  const [viewControls, setViewControls] = useState<ViewControls>({
    showGrid: true,
    showAxes: true,
    autoRotate: false,
    rotationSpeed: 1,
  });

  /** 显示模式状态 */
  const [displayMode, setDisplayMode] = useState<DisplayMode>('solid');

  /** 剖切控制状态 */
  const [clipControls, setClipControls] = useState<ClipControls>({
    enabled: false,
    axis: 'z',
    position: 50,
    reverse: false,
  });

  /** 云图控制状态 */
  const [contourControls, setContourControls] = useState<ContourControls>({
    enabled: false,
    fieldType: 'concentration',
    elements: ['La', 'Ce'],
    colorMap: 'viridis',
    opacity: 0.8,
    minValue: null,
    maxValue: null,
  });

  /** 显示选项状态 */
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showIsosurface: false,
    isosurfaceThreshold: 50,
    showStreamlines: false,
    streamlineCount: 20,
    showSlicePlane: false,
    sliceAxis: 'x',
    slicePosition: 50,
    showGridLines: false,
  });

  /** 播放控制状态 */
  const [playbackControls, setPlaybackControls] = useState<PlaybackControls>({
    isPlaying: false,
    currentTime: 0,
    totalTime: 100,
    speed: 1,
    currentFrame: 0,
    totalFrames: 100,
  });

  /** 当前激活的折叠面板 */
  const [activeKeys, setActiveKeys] = useState<string[]>(['view', 'display']);

  /**
   * 更新视图控制状态
   */
  const updateViewControls = useCallback(
    (updates: Partial<ViewControls>) => {
      const newControls = { ...viewControls, ...updates };
      setViewControls(newControls);
      onViewChange?.(newControls);
    },
    [viewControls, onViewChange]
  );

  /**
   * 更新显示模式
   */
  const updateDisplayMode = useCallback(
    (mode: DisplayMode) => {
      setDisplayMode(mode);
      onDisplayModeChange?.(mode);
      if (mode === 'clip') {
        const newClip = { ...clipControls, enabled: true };
        setClipControls(newClip);
        onClipChange?.(newClip);
      } else {
        const newClip = { ...clipControls, enabled: false };
        setClipControls(newClip);
        onClipChange?.(newClip);
      }
    },
    [clipControls, onDisplayModeChange, onClipChange]
  );

  /**
   * 更新剖切控制状态
   */
  const updateClipControls = useCallback(
    (updates: Partial<ClipControls>) => {
      const newControls = { ...clipControls, ...updates };
      setClipControls(newControls);
      onClipChange?.(newControls);
    },
    [clipControls, onClipChange]
  );

  /**
   * 更新云图控制状态
   */
  const updateContourControls = useCallback(
    (updates: Partial<ContourControls>) => {
      const newControls = { ...contourControls, ...updates };
      setContourControls(newControls);
      onContourChange?.(newControls);
    },
    [contourControls, onContourChange]
  );

  /**
   * 更新显示选项状态
   */
  const updateDisplayOptions = useCallback(
    (updates: Partial<DisplayOptions>) => {
      const newOptions = { ...displayOptions, ...updates };
      setDisplayOptions(newOptions);
      onDisplayOptionsChange?.(newOptions);
    },
    [displayOptions, onDisplayOptionsChange]
  );

  /**
   * 更新播放控制状态
   */
  const updatePlaybackControls = useCallback(
    (updates: Partial<PlaybackControls>) => {
      const newControls = { ...playbackControls, ...updates };
      setPlaybackControls(newControls);
      onPlaybackChange?.(newControls);
    },
    [playbackControls, onPlaybackChange]
  );

  /**
   * 切换播放/暂停
   */
  const togglePlay = useCallback(() => {
    updatePlaybackControls({ isPlaying: !playbackControls.isPlaying });
  }, [playbackControls.isPlaying, updatePlaybackControls]);

  /**
   * 跳转到上一帧
   */
  const prevFrame = useCallback(() => {
    const newFrame = Math.max(0, playbackControls.currentFrame - 1);
    updatePlaybackControls({
      currentFrame: newFrame,
      currentTime: (newFrame / playbackControls.totalFrames) * playbackControls.totalTime,
    });
  }, [playbackControls, updatePlaybackControls]);

  /**
   * 跳转到下一帧
   */
  const nextFrame = useCallback(() => {
    const newFrame = Math.min(
      playbackControls.totalFrames - 1,
      playbackControls.currentFrame + 1
    );
    updatePlaybackControls({
      currentFrame: newFrame,
      currentTime: (newFrame / playbackControls.totalFrames) * playbackControls.totalTime,
    });
  }, [playbackControls, updatePlaybackControls]);

  /**
   * 处理时间进度条变化
   */
  const handleTimeChange = useCallback(
    (value: number) => {
      const newTime = value;
      const newFrame = Math.round(
        (newTime / playbackControls.totalTime) * playbackControls.totalFrames
      );
      updatePlaybackControls({
        currentTime: newTime,
        currentFrame: newFrame,
      });
    },
    [playbackControls, updatePlaybackControls]
  );

  /**
   * 渲染视图控制折叠面板
   */
  const renderViewControls = () => (
    <Collapse.Panel
      key="view"
      header={
        <Space>
          <Eye className="w-4 h-4 text-primary-600" />
          <span className="font-medium">视图控制</span>
        </Space>
      }
    >
      <div className="space-y-4">
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space>
              <Grid3X3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm">显示网格</span>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Switch
              size="small"
              checked={viewControls.showGrid}
              onChange={(checked) => updateViewControls({ showGrid: checked })}
            />
          </Col>
        </Row>

        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space>
              <Axis3D className="w-4 h-4 text-gray-500" />
              <span className="text-sm">显示坐标轴</span>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Switch
              size="small"
              checked={viewControls.showAxes}
              onChange={(checked) => updateViewControls({ showAxes: checked })}
            />
          </Col>
        </Row>

        <Divider className="my-2" />

        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space>
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span className="text-sm">自动旋转</span>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Switch
              size="small"
              checked={viewControls.autoRotate}
              onChange={(checked) => updateViewControls({ autoRotate: checked })}
            />
          </Col>
        </Row>

        {viewControls.autoRotate && (
          <div className="pl-8">
            <div className="text-xs text-gray-500 mb-1">旋转速度</div>
            <Slider
              min={0.1}
              max={5}
              step={0.1}
              value={viewControls.rotationSpeed}
              onChange={(value) => updateViewControls({ rotationSpeed: value })}
              tooltip={{ formatter: (value) => `${value}x` }}
            />
          </div>
        )}

        <Divider className="my-2" />

        <Button
          block
          icon={<Maximize2 className="w-4 h-4" />}
          onClick={onResetView}
          size="small"
        >
          重置视角
        </Button>

        <div className="text-xs text-gray-500 mb-2">预设视角</div>
        <Row gutter={[4, 4]}>
          {(Object.keys(PRESET_VIEW_LABELS) as PresetView[]).map((view) => (
            <Col span={12} key={view}>
              <Button
                size="small"
                block
                icon={
                  view === 'front' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : view === 'top' ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : view === 'side' ? (
                    <ArrowRight className="w-3 h-3" />
                  ) : (
                    <Box className="w-3 h-3" />
                  )
                }
                onClick={() => onPresetView?.(view)}
              >
                {PRESET_VIEW_LABELS[view]}
              </Button>
            </Col>
          ))}
        </Row>
      </div>
    </Collapse.Panel>
  );

  /**
   * 渲染显示模式折叠面板
   */
  const renderDisplayMode = () => (
    <Collapse.Panel
      key="display"
      header={
        <Space>
          <Box className="w-4 h-4 text-primary-600" />
          <span className="font-medium">显示模式</span>
        </Space>
      }
    >
      <div className="space-y-3">
        <Radio.Group
          value={displayMode}
          onChange={(e) => updateDisplayMode(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" className="w-full">
            {(Object.keys(DISPLAY_MODE_LABELS) as DisplayMode[]).map((mode) => (
              <Radio.Button
                key={mode}
                value={mode}
                className={cn(
                  'w-full rounded-md mb-1 px-3 py-2',
                  displayMode === mode
                    ? 'bg-primary-50 border-primary-300'
                    : 'hover:bg-gray-50'
                )}
              >
                <Space>
                  {mode === 'solid' && <Layers className="w-4 h-4" />}
                  {mode === 'wireframe' && <Grid3X3 className="w-4 h-4" />}
                  {mode === 'transparent' && <Eye className="w-4 h-4" />}
                  {mode === 'clip' && <Scissors className="w-4 h-4" />}
                  <span>{DISPLAY_MODE_LABELS[mode]}</span>
                </Space>
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>

        {displayMode === 'clip' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              剖切设置
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">剖切轴</div>
                <Radio.Group
                  value={clipControls.axis}
                  onChange={(e) => updateClipControls({ axis: e.target.value })}
                  size="small"
                >
                  <Radio.Button value="x">X轴</Radio.Button>
                  <Radio.Button value="y">Y轴</Radio.Button>
                  <Radio.Button value="z">Z轴</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>剖切位置</span>
                  <span>{clipControls.position}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={clipControls.position}
                  onChange={(value) => updateClipControls({ position: value })}
                />
              </div>

              <Row align="middle" justify="space-between">
                <Col span={18}>
                  <span className="text-sm">反转剖切方向</span>
                </Col>
                <Col span={6} className="text-right">
                  <Switch
                    size="small"
                    checked={clipControls.reverse}
                    onChange={(checked) => updateClipControls({ reverse: checked })}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    </Collapse.Panel>
  );

  /**
   * 渲染云图控制折叠面板
   */
  const renderContourControls = () => (
    <Collapse.Panel
      key="contour"
      header={
        <Space>
          <Palette className="w-4 h-4 text-primary-600" />
          <span className="font-medium">云图显示</span>
          {contourControls.enabled && (
            <Badge color="green" size="small" />
          )}
        </Space>
      }
    >
      <div className="space-y-4">
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space>
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm">启用云图</span>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Switch
              size="small"
              checked={contourControls.enabled}
              onChange={(checked) => updateContourControls({ enabled: checked })}
            />
          </Col>
        </Row>

        {contourControls.enabled && (
          <>
            <Divider className="my-2" />

            <div>
              <div className="text-xs text-gray-500 mb-1">场类型</div>
              <Select
                size="small"
                className="w-full"
                value={contourControls.fieldType}
                onChange={(value) => updateContourControls({ fieldType: value })}
                options={(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map(
                  (type) => ({
                    value: type,
                    label: (
                      <Space>
                        {type === 'volumeFraction' && (
                          <Droplets className="w-3 h-3" />
                        )}
                        {type === 'concentration' && (
                          <Droplets className="w-3 h-3" />
                        )}
                        {type === 'velocity' && <Waves className="w-3 h-3" />}
                        {type === 'temperature' && (
                          <Thermometer className="w-3 h-3" />
                        )}
                        {type === 'pressure' && <Gauge className="w-3 h-3" />}
                        {FIELD_TYPE_LABELS[type]}
                      </Space>
                    ),
                  })
                )}
              />
            </div>

            {contourControls.fieldType === 'concentration' && (
              <div>
                <div className="text-xs text-gray-500 mb-1">稀土元素</div>
                <Select
                  mode="multiple"
                  size="small"
                  className="w-full"
                  placeholder="选择元素"
                  value={contourControls.elements}
                  onChange={(value) =>
                    updateContourControls({ elements: value as RareEarthElement[] })
                  }
                  options={availableElements.map((el) => ({
                    value: el,
                    label: RARE_EARTH_ELEMENT_LABELS[el],
                  }))}
                  maxTagCount={3}
                  maxTagTextLength={4}
                />
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 mb-1">颜色映射</div>
              <Select
                size="small"
                className="w-full"
                value={contourControls.colorMap}
                onChange={(value) => updateContourControls({ colorMap: value })}
                options={(Object.keys(COLOR_MAP_LABELS) as ColorMap[]).map(
                  (cmap) => ({
                    value: cmap,
                    label: COLOR_MAP_LABELS[cmap],
                  })
                )}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>透明度</span>
                <span>{contourControls.opacity.toFixed(2)}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={contourControls.opacity}
                onChange={(value) => updateContourControls({ opacity: value })}
              />
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">显示范围</div>
              <Row gutter={8}>
                <Col span={12}>
                  <InputNumber
                    size="small"
                    className="w-full"
                    placeholder="最小值"
                    value={contourControls.minValue}
                    onChange={(value) =>
                      updateContourControls({
                        minValue: value as number | null,
                      })
                    }
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    size="small"
                    className="w-full"
                    placeholder="最大值"
                    value={contourControls.maxValue}
                    onChange={(value) =>
                      updateContourControls({
                        maxValue: value as number | null,
                      })
                    }
                  />
                </Col>
              </Row>
            </div>
          </>
        )}
      </div>
    </Collapse.Panel>
  );

  /**
   * 渲染显示选项折叠面板
   */
  const renderDisplayOptions = () => (
    <Collapse.Panel
      key="options"
      header={
        <Space>
          <Settings className="w-4 h-4 text-primary-600" />
          <span className="font-medium">显示选项</span>
        </Space>
      }
    >
      <div className="space-y-4">
        <div>
          <Row align="middle" justify="space-between">
            <Col span={16}>
              <Space>
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm">显示等值面</span>
              </Space>
            </Col>
            <Col span={8} className="text-right">
              <Switch
                size="small"
                checked={displayOptions.showIsosurface}
                onChange={(checked) =>
                  updateDisplayOptions({ showIsosurface: checked })
                }
              />
            </Col>
          </Row>
          {displayOptions.showIsosurface && (
            <div className="pl-8 mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>阈值</span>
                <span>{displayOptions.isosurfaceThreshold}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                value={displayOptions.isosurfaceThreshold}
                onChange={(value) =>
                  updateDisplayOptions({ isosurfaceThreshold: value })
                }
              />
            </div>
          )}
        </div>

        <Divider className="my-1" />

        <div>
          <Row align="middle" justify="space-between">
            <Col span={16}>
              <Space>
                <Waves className="w-4 h-4 text-gray-500" />
                <span className="text-sm">显示流线</span>
              </Space>
            </Col>
            <Col span={8} className="text-right">
              <Switch
                size="small"
                checked={displayOptions.showStreamlines}
                onChange={(checked) =>
                  updateDisplayOptions({ showStreamlines: checked })
                }
              />
            </Col>
          </Row>
          {displayOptions.showStreamlines && (
            <div className="pl-8 mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>流线数量</span>
                <span>{displayOptions.streamlineCount}</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={5}
                value={displayOptions.streamlineCount}
                onChange={(value) =>
                  updateDisplayOptions({ streamlineCount: value })
                }
              />
            </div>
          )}
        </div>

        <Divider className="my-1" />

        <div>
          <Row align="middle" justify="space-between">
            <Col span={16}>
              <Space>
                <Scissors className="w-4 h-4 text-gray-500" />
                <span className="text-sm">显示切片平面</span>
              </Space>
            </Col>
            <Col span={8} className="text-right">
              <Switch
                size="small"
                checked={displayOptions.showSlicePlane}
                onChange={(checked) =>
                  updateDisplayOptions({ showSlicePlane: checked })
                }
              />
            </Col>
          </Row>
          {displayOptions.showSlicePlane && (
            <div className="pl-8 mt-2 space-y-2">
              <div>
                <div className="text-xs text-gray-500 mb-1">切片轴</div>
                <Radio.Group
                  size="small"
                  value={displayOptions.sliceAxis}
                  onChange={(e) =>
                    updateDisplayOptions({ sliceAxis: e.target.value })
                  }
                >
                  <Radio.Button value="x">X</Radio.Button>
                  <Radio.Button value="y">Y</Radio.Button>
                  <Radio.Button value="z">Z</Radio.Button>
                </Radio.Group>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>切片位置</span>
                  <span>{displayOptions.slicePosition}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={displayOptions.slicePosition}
                  onChange={(value) =>
                    updateDisplayOptions({ slicePosition: value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <Divider className="my-1" />

        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space>
              <Grid3X3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm">显示网格线</span>
            </Space>
          </Col>
          <Col span={8} className="text-right">
            <Switch
              size="small"
              checked={displayOptions.showGridLines}
              onChange={(checked) =>
                updateDisplayOptions({ showGridLines: checked })
              }
            />
          </Col>
        </Row>
      </div>
    </Collapse.Panel>
  );

  /**
   * 渲染播放控制折叠面板（仅动画数据时显示）
   */
  const renderPlaybackControls = () => {
    if (!isAnimationData) return null;

    return (
      <Collapse.Panel
        key="playback"
        header={
          <Space>
            <Play className="w-4 h-4 text-primary-600" />
            <span className="font-medium">播放控制</span>
            {playbackControls.isPlaying && (
              <Badge status="processing" text="播放中" size="small" />
            )}
          </Space>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Tooltip title="上一帧">
              <Button
                icon={<SkipBack className="w-4 h-4" />}
                onClick={prevFrame}
                size="small"
                shape="circle"
                disabled={playbackControls.currentFrame === 0}
              />
            </Tooltip>
            <Tooltip title={playbackControls.isPlaying ? '暂停' : '播放'}>
              <Button
                icon={
                  playbackControls.isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )
                }
                onClick={togglePlay}
                size="large"
                type="primary"
                shape="circle"
              />
            </Tooltip>
            <Tooltip title="下一帧">
              <Button
                icon={<SkipForward className="w-4 h-4" />}
                onClick={nextFrame}
                size="small"
                shape="circle"
                disabled={
                  playbackControls.currentFrame ===
                  playbackControls.totalFrames - 1
                }
              />
            </Tooltip>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>
                {playbackControls.currentTime.toFixed(1)}s /{' '}
                {playbackControls.totalTime.toFixed(1)}s
              </span>
              <span>
                帧 {playbackControls.currentFrame + 1} /{' '}
                {playbackControls.totalFrames}
              </span>
            </div>
            <Slider
              min={0}
              max={playbackControls.totalTime}
              step={0.1}
              value={playbackControls.currentTime}
              onChange={handleTimeChange}
              tooltip={{
                formatter: (value) => `${value?.toFixed(1)}s`,
              }}
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">播放速度</div>
            <Radio.Group
              size="small"
              value={playbackControls.speed}
              onChange={(e) =>
                updatePlaybackControls({ speed: e.target.value })
              }
              className="w-full"
            >
              <Row gutter={[4, 4]}>
                {([0.25, 0.5, 1, 2, 4] as PlaybackSpeed[]).map((speed) => (
                  <Col span={Math.floor(24 / 5)} key={speed}>
                    <Radio.Button value={speed} className="w-full text-center">
                      {speed}x
                    </Radio.Button>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
          </div>
        </div>
      </Collapse.Panel>
    );
  };

  /**
   * 渲染数据导出折叠面板
   */
  const renderExportOptions = () => (
    <Collapse.Panel
      key="export"
      header={
        <Space>
          <Download className="w-4 h-4 text-primary-600" />
          <span className="font-medium">数据导出</span>
        </Space>
      }
    >
      <div className="space-y-2">
        <Button
          block
          icon={<Camera className="w-4 h-4" />}
          onClick={onScreenshot}
          size="small"
        >
          截图保存
        </Button>
        <Button
          block
          icon={<FileJson className="w-4 h-4" />}
          onClick={onExportVTK}
          size="small"
        >
          导出VTK文件
        </Button>
        <Button
          block
          icon={<Film className="w-4 h-4" />}
          onClick={() => onExportAnimation?.('gif')}
          size="small"
        >
          导出动画 (GIF)
        </Button>
        <Button
          block
          icon={<Film className="w-4 h-4" />}
          onClick={() => onExportAnimation?.('mp4')}
          size="small"
        >
          导出动画 (MP4)
        </Button>
      </div>
    </Collapse.Panel>
  );

  /**
   * 渲染侧边面板内容
   */
  const renderPanelContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-gray-800">可视化控制</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip title={panelOpen ? '收起面板' : '展开面板'}>
            <Button
              type="text"
              size="small"
              icon={panelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              onClick={() => setPanelOpen(!panelOpen)}
              className="hidden md:flex"
            />
          </Tooltip>
          <Tooltip title="关闭">
            <Button
              type="text"
              size="small"
              icon={<X className="w-4 h-4" />}
              onClick={() => setDrawerVisible(false)}
              className="md:hidden"
            />
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(keys as string[])}
          ghost
          size="small"
          className="controls-collapse"
        >
          {renderViewControls()}
          {renderDisplayMode()}
          {renderContourControls()}
          {renderDisplayOptions()}
          {renderPlaybackControls()}
          {renderExportOptions()}
        </Collapse>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'hidden md:block bg-white border-r border-gray-200 shadow-lg transition-all duration-300',
          'z-20',
          panelOpen ? 'w-72' : 'w-0 overflow-hidden',
          className
        )}
      >
        {panelOpen && renderPanelContent()}
      </div>

      <div className="md:hidden">
        <Button
          type="primary"
          size="small"
          icon={<Settings className="w-4 h-4" />}
          onClick={() => setDrawerVisible(true)}
          className="fixed bottom-4 right-4 z-30 rounded-full shadow-lg"
        >
          控制面板
        </Button>
        <Drawer
          title="可视化控制"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={320}
          styles={{ body: { padding: 0 } }}
          extra={
            <Button
              type="text"
              size="small"
              icon={<X className="w-4 h-4" />}
              onClick={() => setDrawerVisible(false)}
            />
          }
        >
          {renderPanelContent()}
        </Drawer>
      </div>

      <Tooltip title={panelOpen ? '收起控制面板' : '展开控制面板'}>
        <Button
          type="default"
          size="small"
          shape="circle"
          icon={
            panelOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          }
          onClick={() => setPanelOpen(!panelOpen)}
          className={cn(
            'hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-300',
            panelOpen ? 'ml-72' : 'ml-0'
          )}
        />
      </Tooltip>
    </>
  );
};

export default VisualizationControls;

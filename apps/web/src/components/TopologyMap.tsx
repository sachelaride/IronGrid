import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Monitor, Check, X, Plus, Minus, Maximize, Trash2, Activity, Info, Loader2, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ReactFlow,
    Background,
    Panel,
    useNodesState,
    useEdgesState,
    Edge,
    Handle,
    Position,
    NodeProps,
    Node,
    OnSelectionChangeParams,
    XYPosition,
    useStore,
    getSmoothStepPath,
    getStraightPath,
    BaseEdge,
    EdgeProps,
    useReactFlow,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { trpc } from '../utils/trpc';
import { DeviceEditModal } from './DeviceEditModal';
import { useLanguage } from '../context/LanguageContext';

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
    constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) return (
            <div className="absolute inset-0 bg-error/20 flex flex-col items-center justify-center p-8 z-50 text-on-error-container backdrop-blur-xl">
                <h1 className="font-display-lg text-2xl uppercase mb-4">{this.props.t('MAP_RENDERING_CRASHED')}</h1>
                <pre className="bg-black/50 p-6 rounded font-data-mono text-xs overflow-auto max-w-full border border-white/5">{this.state.error?.message}</pre>
            </div>
        );
        return this.props.children;
    }
}

// --- Types ---

interface DeviceNodeData extends Record<string, unknown> {
    id: string;
    label: string;
    type: string;
    status: 'ok' | 'warning' | 'error';
    ip?: string;
    latency?: number;
    lastLatency?: number;
    parentId?: string | null;
    agentId?: string;
    vlan?: number;
    purchaseValue?: number;
    portSpeed?: string;
    hiddenChildrenCount?: number;
    hiddenSwitchesCount?: number;
    isStatic?: boolean;
    isSwitchGroup?: boolean;
    layer?: string;
    connectedPort?: number | null;
    hasChildren?: boolean;
    isCollapsed?: boolean;
    topologyRole?: string;
    latencyThresholds?: any[];
    additionalParents?: string[];
    hiddenSecSwitchesCount?: number;
    toggleCollapse?: (id: string) => void;
}

// --- Custom Components ---

const NodeIcon = ({ type, size = 24, className = "" }: { type: string, size?: number, className?: string }) => {
    const getIconPath = (t: string) => {
        const basePath = '/icons/topology/mission_control';
        switch (t.toLowerCase()) {
            case 'router':
            case 'gateway': return `${basePath}/router.png`;
            case 'internet': return `${basePath}/cloud.png`;
            case 'firewall': return `${basePath}/firewall.png`;
            case 'switch': return `${basePath}/switch.png`;
            case 'server': return `${basePath}/server.png`;
            case 'storage':
            case 'nas': return `${basePath}/nas.png`;
            case 'db':
            case 'database': return `${basePath}/database.png`;
            case 'workstation':
            case 'pc':
            case 'computer':
            case 'desktop':
            case 'laptop':
            case 'endpoint': return `${basePath}/computer.png`;
            case 'printer': return `${basePath}/printer.png`;
            case 'voip':
            case 'phone': return `${basePath}/voip.png`;
            case 'camera': return `${basePath}/camera.png`;
            case 'ap':
            case 'wifi':
            case 'access_point': return `${basePath}/access-point.png`;
            default: return `${basePath}/server.png`;
        }
    };

    return (
        <img
            src={`${getIconPath(type)}?v=${Date.now()}`}
            className={className}
            style={{ width: size, height: size, mixBlendMode: 'screen' }}
            alt={type}
        />
    );
};

const getStatusColor = (status: string, latency?: number) => {
    if (status === 'error') return 'rgb(var(--error))';
    if (status === 'warning' || (latency && latency > 50)) return 'rgb(var(--secondary-fixed))';
    return 'rgb(var(--primary))';
};

const getLatencyColor = (latency: number) => {
    if (latency <= 10) return 'rgb(var(--primary))'; // Verde
    if (latency <= 50) return 'rgb(var(--secondary-fixed))'; // Amarelo
    if (latency <= 150) return '#FF8C00'; // Laranja Forte
    return 'rgb(var(--error))'; // Vermelho
};

const DeviceNode = ({ data, selected }: NodeProps<Node<DeviceNodeData>>) => {
    const statusColor = getStatusColor(data.status, data.latency);
    const iconSize = data.isSwitchGroup ? 48 : 32;

    const l1Threshold = data.latencyThresholds?.find((c: any) => c.level === 1)?.latencyThreshold || 50;
    const l2Threshold = data.latencyThresholds?.find((c: any) => c.level === 2)?.latencyThreshold || 100;
    
    const isL1Alert = data.lastLatency != null && data.lastLatency >= l1Threshold && data.lastLatency < l2Threshold;
    const isL2Alert = data.lastLatency != null && data.lastLatency >= l2Threshold;

    return (
        <div className={`relative flex flex-col items-center group transition-all duration-500 ${selected ? 'scale-110' : 'hover:scale-105'}`}>
            <Handle type="target" position={Position.Top} className="opacity-0" />

            {/* Selection Glow Matrix */}
            {selected && (
                <div className="absolute inset-x-0 top-0 flex items-center justify-center -translate-y-1/2 pointer-events-none">
                    <div className="w-[140%] h-[140%] border border-primary/40 border-dashed rounded-full animate-[spin_20s_linear_infinite] opacity-30" />
                    <div className="absolute w-[120%] h-[120%] border border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-20" />
                </div>
            )}

            {/* Offline Pulse Forensic */}
            {data.status !== 'ok' && (
                <div className="absolute inset-0 bg-error/10 rounded-full animate-ping blur-2xl opacity-40 pointer-events-none" />
            )}

            {/* Latency Alert Matrix */}
            {isL1Alert && !isL2Alert && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                        className="rounded-full border-2 border-secondary-fixed/50 animate-pulse shadow-[0_0_30px_rgba(var(--secondary-fixed),0.4)]" 
                        style={{ width: iconSize + 20, height: iconSize + 20 }}
                    />
                </div>
            )}
            {isL2Alert && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                        className="rounded-full border-4 border-error/50 animate-pulse shadow-[0_0_40px_rgba(var(--error),0.5)]" 
                        style={{ width: iconSize + 30, height: iconSize + 30 }}
                    />
                </div>
            )}

            {/* Offline Pulse Forensic - Pure Red for High Intensity */}
            {data.status !== 'ok' && (
                <div 
                    className="absolute inset-0 rounded-full animate-pulse blur-xl opacity-100 pointer-events-none" 
                    style={{ backgroundColor: '#ff0000' }}
                />
            )}

            {/* Icon Container */}
            <div className="relative flex flex-col items-center z-10">
                <div className={`p-1 transition-all ${selected ? 'scale-110' : ''}`}>
                    <NodeIcon type={data.type} size={iconSize} className="drop-shadow-[0_0_20px_rgba(0,242,255,0.3)] brightness-125 contrast-125" />
                </div>
            </div>

            {/* Labels - Forensic Display */}
            <div className={`mt-[-12px] flex flex-col items-center pointer-events-none z-20 space-y-1 transition-all duration-500 ${isL2Alert ? 'scale-125' : ''}`}>
                <div className={`glass-panel px-3 py-1 border-white/10 bg-surface-container/80 backdrop-blur-none shadow-2xl flex flex-col items-center min-w-[100px] ${isL2Alert ? 'border-error/50 shadow-[0_0_30px_rgba(var(--error),0.3)]' : selected ? 'border-primary/50' : ''}`}>
                    <span className="font-display-lg text-[9px] text-on-surface uppercase tracking-wider whitespace-nowrap italic font-black">
                        {data.label}
                    </span>
                    <div className="flex items-center gap-3">
                        {data.ip && (
                            <span className="font-data-mono text-[8px] text-on-surface-variant/60 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <span className={selected ? 'text-primary' : ''}>{data.ip}</span>
                            </span>
                        )}
                        {data.lastLatency != null && (
                            <span className="font-data-mono text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: getLatencyColor(data.lastLatency) }}>
                                {data.lastLatency.toFixed(1)}ms
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {data.isCollapsed && ((data.hiddenSwitchesCount ?? 0) > 0 || (data.hiddenSecSwitchesCount ?? 0) > 0) && (
                <div className="mt-3 px-4 py-1 bg-primary text-black rounded-lg shadow-[0_0_25px_rgba(var(--primary-fixed),0.4)] animate-pulse border border-primary/50">
                    <span className="font-display-lg text-[9px] font-black uppercase tracking-tighter italic">
                        {data.hiddenSwitchesCount ? `+${data.hiddenSwitchesCount} ${(data as any).t('NODE_GROUPS')}` : ''}{data.hiddenSwitchesCount && (data.hiddenSecSwitchesCount) ? ' ' : ''}{data.hiddenSecSwitchesCount ? `+${data.hiddenSecSwitchesCount} ${(data as any).t('AUX_LINKS')}` : ''}
                    </span>
                </div>
            )}

            {/* Expand/Collapse Toggle Button - Forensic Styled */}
            {data.hasChildren && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.toggleCollapse) data.toggleCollapse(data.id);
                    }}
                    className={`mt-4 w-10 h-10 rounded-xl border-2 border-white/10 flex items-center justify-center shadow-2xl transition-all z-50 pointer-events-auto backdrop-blur-xl ${data.isCollapsed
                            ? 'bg-primary text-black border-primary/50 shadow-[0_0_20px_rgba(var(--primary-fixed),0.4)] scale-110'
                            : 'bg-surface-container-high hover:bg-white/10 text-on-surface-variant hover:text-primary hover:border-primary/30'
                        }`}
                >
                    {data.isCollapsed ? (
                        <Plus size={18} strokeWidth={4} className="animate-pulse" />
                    ) : (
                        <Minus size={18} strokeWidth={4} />
                    )}
                </button>
            )}

            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

// --- Smart Edge Routing ---
function getNodeIntersection(intersectionNode: any, targetNode: any) {
    const x = intersectionNode.internals?.positionAbsolute?.x || intersectionNode.position?.x || 0;
    const y = intersectionNode.internals?.positionAbsolute?.y || intersectionNode.position?.y || 0;
    const w = intersectionNode.measured?.width || 120;
    const cx = x + w / 2;

    const iconSize = intersectionNode.data?.isSwitchGroup ? 70 : 54;
    const iconCy = y + iconSize / 2 + 5;

    const tx = targetNode.internals?.positionAbsolute?.x || targetNode.position?.x || 0;
    const ty = targetNode.internals?.positionAbsolute?.y || targetNode.position?.y || 0;
    const tw = targetNode.measured?.width || 120;
    const tcx = tx + tw / 2;

    const targetIconSize = targetNode.data?.isSwitchGroup ? 70 : 54;
    const targetIconCy = ty + targetIconSize / 2 + 5;

    const dx = tcx - cx;
    const dy = targetIconCy - iconCy;

    const r = iconSize / 2;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) return { x: cx + r, y: iconCy, pos: Position.Right };
        return { x: cx - r, y: iconCy, pos: Position.Left };
    } else {
        if (dy > 0) return { x: cx, y: iconCy + r, pos: Position.Bottom };
        return { x: cx, y: iconCy - r, pos: Position.Top };
    }
}

function getEdgeParams(source: any, target: any) {
    const sourceIntersection = getNodeIntersection(source, target);
    const targetIntersection = getNodeIntersection(target, source);

    return {
        sx: sourceIntersection.x,
        sy: sourceIntersection.y,
        tx: targetIntersection.x,
        ty: targetIntersection.y,
        sourcePos: sourceIntersection.pos,
        targetPos: targetIntersection.pos,
    };
}

const SmartEdge = ({
    id,
    source,
    target,
    style,
    className,
    markerEnd,
    markerStart,
    interactionWidth
}: EdgeProps & { className?: string }) => {
    const nodeLookup = useStore(useCallback((store: any) => store.nodeLookup, []));
    const edges = useStore(useCallback((store: any) => store.edges, []));

    const sourceNode = nodeLookup.get(source);
    const targetNode = nodeLookup.get(target);

    const edgeProps = { id, style, className, markerEnd, markerStart, interactionWidth };

    if (!sourceNode || !targetNode) return <BaseEdge path="" {...edgeProps} />;

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    const siblingEdges = edges.filter((e: any) => e.source === source);

    const sortedSiblings = [...siblingEdges].sort((a: any, b: any) => {
        const nA = nodeLookup.get(a.target);
        const nB = nodeLookup.get(b.target);
        const xA = nA?.internals?.positionAbsolute?.x || nA?.position?.x || 0;
        const xB = nB?.internals?.positionAbsolute?.x || nB?.position?.x || 0;
        return xA - xB;
    });

    const siblingIndex = sortedSiblings.findIndex((e: any) => e.id === id);
    const siblingCount = sortedSiblings.length;

    const maxSpread = 40;
    let offset = 0;

    if (siblingCount > 1) {
        const gap = Math.min(10, maxSpread / (siblingCount - 1));
        offset = (siblingIndex - (siblingCount - 1) / 2) * gap;
    }

    const sxAdj = (sourcePos === Position.Top || sourcePos === Position.Bottom) ? sx + offset : sx;
    const syAdj = (sourcePos === Position.Left || sourcePos === Position.Right) ? sy + offset : sy;

    const [edgePath] = getSmoothStepPath({
        sourceX: sxAdj,
        sourceY: syAdj,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
        borderRadius: 16,
    });

    return <BaseEdge path={edgePath} {...edgeProps} />;
};

const ZabbixEdge = ({
    id,
    source,
    target,
    style,
    className,
    markerEnd,
    markerStart,
    interactionWidth
}: EdgeProps & { className?: string }) => {
    const nodeLookup = useStore(useCallback((store: any) => store.nodeLookup, []));

    const sourceNode = nodeLookup.get(source);
    const targetNode = nodeLookup.get(target);

    const edgeProps = { id, style, className, markerEnd, markerStart, interactionWidth };

    if (!sourceNode || !targetNode) return <BaseEdge path="" {...edgeProps} />;

    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

    const [edgePath] = getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
    });

    return <BaseEdge path={edgePath} {...edgeProps} />;
};

const edgeTypes = {
    smart: SmartEdge,
    zabbix: ZabbixEdge,
};

const nodeTypes = {
    device: DeviceNode,
} as const;

// --- Custom Top Bar ---

const TopControls = ({ 
    onBack, edgeStyle, setEdgeStyle
}: any) => {
    const { t } = useLanguage();
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const [showLegend, setShowLegend] = useState(false);

    return (
        <Panel position="top-right" className="m-10 flex items-center pointer-events-auto z-[60]">
            <div className="flex items-center glass-panel p-2 shadow-2xl border-white/10 bg-surface-container gap-3">
                
                {/* 1. Legend Tool */}
                <div className="relative">
                    <button 
                        onMouseEnter={() => setShowLegend(true)}
                        onMouseLeave={() => setShowLegend(false)}
                        onClick={() => setShowLegend(!showLegend)}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border border-transparent ${showLegend ? 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-fixed),0.4)]' : 'text-on-surface-variant hover:text-primary hover:bg-white/5'}`}
                    >
                        <Info size={16} strokeWidth={3} />
                    </button>

                    <AnimatePresence>
                        {showLegend && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-6 p-8 glass-panel z-[150] min-w-[280px] border-white/20 bg-surface-container shadow-3xl backdrop-blur-none"
                            >
                                <h4 className="font-display-lg text-[13px] text-primary uppercase tracking-tighter mb-8 border-b border-white/5 pb-4 italic">{t('BANDWIDTH_METRICS_LEGEND')}</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-12 h-2 bg-[#00FFFF] rounded shadow-[0_0_15px_#00FFFF]"></div>
                                        <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest font-black">{t('40_GBPS_BACKBONE')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-12 h-1 bg-[#FF00FF] rounded shadow-[0_0_15px_#FF00FF]"></div>
                                        <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest font-black">{t('10_GBPS_UPLINK')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-12 h-0.5 bg-[#00FF00] rounded shadow-[0_0_15px_#00FF00]"></div>
                                        <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest font-black">{t('1_GBPS_OPERATIONAL')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-12 h-0.5 bg-[#FF8C00] rounded shadow-[0_0_15px_#FF8C00]"></div>
                                        <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest font-black">{t('100_MBPS_THROTTLED')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-12 h-0.5 border-t border-primary/40 border-dashed"></div>
                                        <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest font-black">{t('WIRELESS_RF_LINK')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-px h-6 bg-white/10"></div>

                {/* 2. Edge Style Toggle */}
                <button 
                    onClick={() => setEdgeStyle(edgeStyle === 'curved' ? 'zabbix' : 'curved')} 
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border border-transparent ${edgeStyle === 'curved' ? 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-fixed),0.4)]' : 'text-on-surface-variant hover:text-primary hover:bg-white/5'}`}
                    title={edgeStyle === 'curved' ? `${t('STATUS')}: ${t('SMOOTH_ROUTING')}` : `${t('STATUS')}: ${t('LINEAR_MATRIX')}`}
                >
                    <Activity size={16} strokeWidth={3} />
                </button>

                <div className="w-px h-6 bg-white/10"></div>

                {/* 3. Zoom Controls */}
                <div className="flex items-center gap-1.5 px-1">
                    <button onClick={() => zoomOut()} className="w-11 h-11 flex items-center justify-center hover:bg-white/5 rounded-xl text-on-surface-variant hover:text-on-surface transition-all" title={t('ZOOM_OUT')}>
                        <Minus size={16} strokeWidth={3} />
                    </button>
                    <button onClick={() => zoomIn()} className="w-11 h-11 flex items-center justify-center hover:bg-white/5 rounded-xl text-on-surface-variant hover:text-on-surface transition-all" title={t('ZOOM_IN')}>
                        <Plus size={16} strokeWidth={3} />
                    </button>
                    <button onClick={() => fitView({ duration: 800 })} className="w-11 h-11 flex items-center justify-center hover:bg-white/5 rounded-xl text-primary hover:bg-primary hover:text-black transition-all border border-transparent hover:border-primary/50" title={t('AUTO_FRAME_SECTOR')}>
                        <Maximize size={16} strokeWidth={3} />
                    </button>
                </div>

                {onBack && (
                    <>
                        <div className="w-px h-6 bg-white/10"></div>
                        <button
                            onClick={onBack}
                            className="cyber-button px-6 h-11 flex items-center gap-3 !bg-error text-on-error border-error shadow-lg font-display-lg text-[13px] uppercase tracking-tighter italic"
                        >
                            <X size={16} strokeWidth={4} />
                            {t('EXIT_MATRIX')}
                        </button>
                    </>
                )}
            </div>
        </Panel>
    );
};

// --- Main Component ---

export function TopologyMap({ onBack }: { onBack?: () => void }) {
    const { t } = useLanguage();
    const { data: devices = [] } = trpc.scan.getDevices.useQuery(undefined, {
        refetchInterval: 3000,
        staleTime: 0
    });
    const { data: monitoringConfigs } = trpc.monitoring.getMonitoringConfigs.useQuery(undefined, {
        staleTime: 30000
    });
    const utils = (trpc as any).useContext();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<DeviceNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    const [viewMode] = useState<'all' | 'infra'>('infra');
    const [edgeStyle, setEdgeStyle] = useState<'curved' | 'zabbix' | 'focus'>('zabbix');
    const [showGrid] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [hasInitializedCollapse, setHasInitializedCollapse] = useState(false);
    const [settingsVersion, setSettingsVersion] = useState(0);

    useEffect(() => {
        const handleUpdate = () => setSettingsVersion(v => v + 1);
        window.addEventListener('topology_settings_updated', handleUpdate);
        return () => window.removeEventListener('topology_settings_updated', handleUpdate);
    }, []);

    const [pendingRole, setPendingRole] = useState<string>('');
    const [pendingParentId, setPendingParentId] = useState<string>('');
    const [pendingAdditionalParents, setPendingAdditionalParents] = useState<string[]>([]);
    const [pendingPortSpeed, setPendingPortSpeed] = useState<string>('10G');

    const updateDevice = (trpc.scan as any).updateDevice.useMutation({
        onSuccess: () => {
            (utils.scan as any).getDevices.invalidate();
        }
    });

    const updateDevicePosition = (trpc.scan as any).updateDevicePosition.useMutation({
        onSuccess: () => {
            (utils.scan as any).getDevices.invalidate();
        }
    });

    const toggleCollapse = useCallback((id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    useEffect(() => {
        if (!devices || devices.length === 0) return;

        const newNodes: Node<DeviceNodeData>[] = [];
        const newEdges: Edge[] = [];

        const ipCounts: Record<string, number> = {};
        const devicesList = Array.isArray(devices) ? devices : (devices as any)?.devices ?? [];
        if (devicesList && Array.isArray(devicesList)) {
            devicesList.forEach((d: any) => { if (d.ip) ipCounts[d.ip] = (ipCounts[d.ip] || 0) + 1; });
        }

        const getRole = (d: any): string | null => {
            if (!d) return null;
            if (d.topologyRole) return d.topologyRole;
            const n = (d.name || d.label || d.hostname || '').toUpperCase();
            if (n.includes('WAN') || n.includes('INTERNET')) return 'WAN';
            if (n.includes('GATEWAY') || n.includes('FIREWALL') || n === 'FW') return 'GATEWAY';
            if (n.includes('CORE')) return 'CORE';
            if (n.includes('BACKBONE')) return n.includes('SEC') ? 'BACKBONE_SEC' : 'BACKBONE';
            if (n.includes('ACCESS') || n.includes('ACESSO')) return n.includes('SEC') ? 'ACCESS_SEC' : 'ACCESS';
            if (String(d.type || '').toUpperCase() === 'SWITCH') return 'ACCESS';
            return null;
        };

        const byRole: Record<string, any[]> = { WAN: [], GATEWAY: [], CORE: [], BACKBONE: [], BACKBONE_SEC: [], ACCESS: [], ACCESS_SEC: [], OTHER: [] };
        devices.forEach((d: any) => {
            const r = getRole(d);
            if (r && byRole[r]) byRole[r].push(d);
            else byRole.OTHER.push(d);
        });

        const rootDevice = byRole.WAN[0] || byRole.GATEWAY[0] || byRole.CORE[0] || devices.find((d: any) => d.ip === '192.168.0.1') || devices.find((d: any) => !d.parentId) || devices[0];
        const rootId = rootDevice?.id || null;

        const findClosestParent = (device: any, candidates: any[]): string | null => {
            if (!candidates || candidates.length === 0) return null;
            if (candidates.length === 1) return candidates[0].id;
            const myName = (device.name || '').toUpperCase();
            const prefixMatch = candidates.find(c => {
                const cn = (c.name || '').toUpperCase();
                return myName.startsWith(cn.split('_').slice(0, 3).join('_'));
            });
            if (prefixMatch) return prefixMatch.id;
            const buildingMatch = myName.match(/[_-]B(\d+)[_-]/);
            if (buildingMatch) {
                const building = buildingMatch[0];
                const sameBuilding = candidates.find(c => (c.name || '').toUpperCase().includes(building));
                if (sameBuilding) return sameBuilding.id;
            }
            return candidates[0].id;
        };

        const allBackbones = [...byRole.BACKBONE, ...byRole.BACKBONE_SEC];
        const allAccess = [...byRole.ACCESS, ...byRole.ACCESS_SEC];

        const processedDevices = devices.map((device: any) => {
            let parentId = device.parentId;
            if (parentId === device.id) parentId = null;

            const role = getRole(device);

            if (!parentId && device.id !== rootId) {
                if (role === 'WAN' || role === 'WAN_SEC') {
                    parentId = null;
                } else if (role === 'GATEWAY') {
                    parentId = byRole.WAN[0]?.id || null;
                } else if (role === 'CORE') {
                    parentId = byRole.GATEWAY[0]?.id || byRole.WAN[0]?.id || null;
                } else if (role === 'BACKBONE' || role === 'BACKBONE_SEC') {
                    const coreParents = byRole.CORE.length > 0 ? byRole.CORE : (rootDevice ? [rootDevice] : []);
                    parentId = findClosestParent(device, coreParents);
                } else if (role === 'ACCESS' || role === 'ACCESS_SEC') {
                    parentId = findClosestParent(device, allBackbones) || byRole.CORE[0]?.id || rootId;
                } else {
                    const deviceType = device.type?.toLowerCase() || '';
                    const isSwitch = ['switch', 'router', 'firewall', 'gateway'].includes(deviceType);
                    if (isSwitch && allAccess.length > 0) {
                        parentId = findClosestParent(device, allAccess);
                    } else if (allBackbones.length > 0) {
                        parentId = findClosestParent(device, allBackbones);
                    } else if (byRole.CORE.length > 0) {
                        parentId = byRole.CORE[0].id;
                    } else {
                        parentId = rootId;
                    }
                }
            }

            if (!['WAN', 'WAN_SEC'].includes(role || '')) {
                const reverseWan = devices.find((d: any) => {
                    const r = getRole(d);
                    return d.parentId === device.id && (r === 'WAN' || r === 'WAN_SEC');
                });
                if (reverseWan) parentId = reverseWan.id;
            }

            if (parentId === device.id || device.id === rootId) parentId = null;

            return { ...device, computedParentId: parentId };
        });

        const parentSet = new Set<string>();
        devices.forEach((d: any) => {
            if (d.parentId) parentSet.add(d.parentId);
        });
        processedDevices.forEach((d: any) => {
            if (d.computedParentId) parentSet.add(d.computedParentId);
        });

        let currentCollapsedIds = collapsedIds;
        if (!hasInitializedCollapse && parentSet.size > 0 && processedDevices.length > 0) {
            setCollapsedIds(new Set());
            currentCollapsedIds = new Set();
            setHasInitializedCollapse(true);
        }

        const isCollapsedByAncestor = (parentId: string | null, visited = new Set<string>()): boolean => {
            if (!parentId || visited.has(parentId)) return false;
            visited.add(parentId);

            const parentNode = processedDevices.find((d: any) => d.id === parentId);
            if (!parentNode) return false;

            const parentType = parentNode.type?.toLowerCase() || '';
            const parentRole = getRole(parentNode) || '';

            const visibleTypes = ['switch', 'firewall', 'router', 'gateway', 'wan', 'core', 'backbone', 'server', 'access_point', 'ap'];
            const isVisible = viewMode === 'all' || visibleTypes.includes(parentType);

            if (isVisible && currentCollapsedIds.has(parentId)) return true;

            const parentIsEssential =
                ['firewall', 'router', 'gateway'].includes(parentType) ||
                ['CORE', 'BACKBONE', 'BACKBONE_SEC', 'GATEWAY', 'FIREWALL', 'WAN', 'WAN_SEC'].includes(parentRole);
            if (parentIsEssential && !currentCollapsedIds.has(parentId)) return false;

            return isCollapsedByAncestor(parentNode.computedParentId, visited);
        };

        const hiddenCounts: Record<string, { dev: number, sw: number, secSw: number }> = {};
        if (currentCollapsedIds.size > 0) {
            currentCollapsedIds.forEach(cid => {
                let devCount = 0;
                let swCount = 0;
                let secSwCount = 0;
                const visited = new Set<string>();

                const countDescendants = (pid: string) => {
                    if (visited.has(pid)) return;
                    visited.add(pid);
                    processedDevices.filter((d: any) => d.computedParentId === pid).forEach((child: any) => {
                        const role = getRole(child);
                        const type = child.type?.toLowerCase() || '';
                        
                        const isMainSw = ['FIREWALL', 'ROUTER', 'GATEWAY', 'WAN', 'CORE', 'BACKBONE', 'ACCESS'].includes(role || '') ||
                                         (['firewall', 'router', 'gateway', 'switch'].includes(type) && role !== 'ACCESS_SEC' && role !== 'BACKBONE_SEC');
                        
                        const isSecSw = (role === 'ACCESS_SEC' || role === 'BACKBONE_SEC') || 
                                        (['access_point', 'ap'].includes(type));

                        if (isMainSw) swCount++; 
                        else if (isSecSw) secSwCount++;
                        else devCount++;

                        countDescendants(child.id);
                    });
                };
                countDescendants(cid);
                hiddenCounts[cid] = { dev: devCount, sw: swCount, secSw: secSwCount };
            });
        }
        processedDevices.forEach((device: any) => {
            const role = getRole(device);
            let type = device.type?.toLowerCase() || '';
            
            // Logic to determine if a node is part of the core infrastructure
            const checkIsInfra = () => {
                if (device.id === rootId) return true;

                // Normalize type for comparison with settings
                let normType = type;
                if (normType === 'router') normType = 'gateway';
                if (normType === 'access_point') normType = 'ap';
                if (normType === 'pc' || normType === 'desktop' || normType === 'laptop') normType = 'workstation';
                if (normType === 'nas') normType = 'storage';

                // Check user preferences in localStorage
                try {
                    const saved = localStorage.getItem('irongrid_topology_infra_types');
                    if (saved) {
                        const allowed = JSON.parse(saved);
                        if (allowed.includes(normType)) return true;
                        
                        // Also check role-based mapping
                        const roleLower = (role || '').toLowerCase();
                        if (allowed.includes('switch') && roleLower.includes('switch')) return true;
                        if (allowed.includes('gateway') && (roleLower.includes('router') || roleLower.includes('gateway'))) return true;
                        if (allowed.includes('firewall') && roleLower.includes('firewall')) return true;

                        return false; // User has a list, and this type isn't in it
                    } else {
                        // Default fallback if no settings yet (Core infrastructure only)
                        const defaultVisible = ['gateway', 'firewall', 'switch'];
                        if (defaultVisible.includes(normType)) return true;
                        if (['SWITCH', 'FIREWALL', 'ROUTER', 'GATEWAY'].includes(role || '')) return true;
                    }
                } catch (e) {
                    console.error('Topology Settings Parse Error');
                }

                return device.isInfrastructure === true;
            };

            const isInfra = checkIsInfra();
            
            if (viewMode === 'infra' && !isInfra) {
                return;
            }

            const parentId = device.computedParentId;

            // type is already declared above
            const nameLower = (device.name || '').toLowerCase();
            if (!type || type === 'endpoint' || type === 'other') {
                if (nameLower.includes('pc') || nameLower.includes('desktop')) type = 'pc';
                else if (nameLower.includes('cam')) type = 'camera';
                else if (nameLower.includes('ap') || nameLower.includes('unifi') || nameLower.includes('wifi')) type = 'access_point';
                else if (nameLower.includes('voip') || nameLower.includes('tel') || nameLower.includes('phone')) type = 'voip';
                else if (nameLower.includes('nas') || nameLower.includes('storage')) type = 'nas';
                else if (nameLower.includes('print')) type = 'printer';
                else if (nameLower.includes('srv') || nameLower.includes('server')) type = 'server';
                else if (nameLower.includes('db') || nameLower.includes('banco')) type = 'database';
                else type = 'endpoint';
            }

            const isEssentialDevice =
                ['firewall', 'router', 'gateway'].includes(type) ||
                ['CORE', 'BACKBONE', 'BACKBONE_SEC', 'GATEWAY', 'FIREWALL', 'WAN', 'WAN_SEC'].includes(role || '');

            if (!isEssentialDevice && isCollapsedByAncestor(parentId)) return;

            const isSwitchGroup = ['switch', 'firewall', 'router', 'gateway', 'access_point', 'voip', 'nas'].includes(type) || !!getRole(device);

            const isWireless = type === 'ap' || type === 'wifi' || type === 'access_point' || device.portSpeed === 'Wireless';
            let strokeColor = '#00FF00';
            if (device.portSpeed === '40G') strokeColor = '#00FFFF';
            if (device.portSpeed === '10G') strokeColor = '#FF00FF';
            if (device.portSpeed === '1G') strokeColor = '#00FF00';
            if (device.portSpeed === '100M') strokeColor = '#FF8C00';
            if (isWireless) strokeColor = 'rgba(0, 255, 255, 0.4)';
            
            // Override status for virtual gateway nodes (0.0.0.0)
            const effectiveStatus = device.ip === '0.0.0.0' ? 'online' : device.status;
            if (effectiveStatus !== 'online') strokeColor = 'rgb(var(--error))';

            const newNode: Node<DeviceNodeData> = {
                id: device.id,
                type: 'device',
                position: device.topoX && device.topoY ? { x: device.topoX, y: device.topoY } : { x: 1500, y: 600 },
                data: {
                    ...device,
                    id: device.id,
                    type,
                    label: device.name || device.ip,
                    status: (device.ip === '0.0.0.0') ? 'ok' : ((ipCounts[device.ip] > 1) ? 'error' : (device.status === 'online' ? 'ok' : 'error')),
                    isSwitchGroup,
                    parentId,
                    hasChildren: parentSet.has(device.id),
                    isCollapsed: collapsedIds.has(device.id),
                    hiddenChildrenCount: hiddenCounts[device.id]?.dev || 0,
                    hiddenSwitchesCount: hiddenCounts[device.id]?.sw || 0,
                    hiddenSecSwitchesCount: hiddenCounts[device.id]?.secSw || 0,
                    latencyThresholds: monitoringConfigs,
                    toggleCollapse,
                    t: t
                }
            };
            newNodes.push(newNode);

            let showEdge = true;
            if (edgeStyle === 'focus') {
                showEdge = selectedNodeId ? selectedNodeId === parentId : false;
            }

            if (parentId) {
                (newEdges as any).push({
                    id: `e-${parentId}-${device.id}`,
                    source: parentId,
                    target: device.id,
                    type: edgeStyle === 'zabbix' ? 'zabbix' : 'smart',
                    hidden: !showEdge,
                    style: {
                        stroke: strokeColor,
                        strokeWidth: device.portSpeed === '40G' ? (edgeStyle === 'zabbix' ? 3 : 1.8) : (edgeStyle === 'zabbix' ? 2 : 0.8),
                        opacity: edgeStyle === 'focus' ? 0.8 : 0.5
                    },
                    className: isWireless ? 'react-flow__edge-path-wireless' : '',
                    animated: effectiveStatus === 'online'
                });
            }

            if (device.additionalParents && Array.isArray(device.additionalParents)) {
                device.additionalParents.forEach((apId: string, idx: number) => {
                    if (apId && apId !== device.id) {
                        (newEdges as any).push({
                            id: `e-extra-${apId}-${device.id}-${idx}`,
                            source: apId,
                            target: device.id,
                            type: edgeStyle === 'zabbix' ? 'zabbix' : 'smart',
                            hidden: !showEdge,
                            style: {
                                stroke: strokeColor,
                                strokeWidth: device.portSpeed === '40G' ? (edgeStyle === 'zabbix' ? 2 : 1.2) : (edgeStyle === 'zabbix' ? 1.5 : 0.6),
                                opacity: edgeStyle === 'focus' ? 0.7 : 0.4,
                                strokeDasharray: '5,5'
                            },
                            animated: effectiveStatus === 'online'
                        });
                    }
                });
            }
        });

        const H_SPACING = 400;
        const V_SPACING = 500;

        const layoutSubtree = (parentId: string, startX: number, startY: number, visited = new Set<string>()) => {
            if (visited.has(parentId)) return;
            visited.add(parentId);

            const children = newNodes.filter(n => n.data.parentId === parentId && n.position.x === 1500 && n.position.y === 600);
            if (children.length === 0) return;

            const totalW = (children.length - 1) * H_SPACING;
            let currentX = startX - (totalW / 2);

            children.forEach(child => {
                child.position = { x: currentX, y: startY };
                layoutSubtree(child.id, currentX, startY + V_SPACING, new Set(visited));
                currentX += H_SPACING;
            });
        };

        const newNodeIds = new Set(newNodes.map(n => n.id));
        const roots = newNodes.filter(n => !n.data.parentId || !newNodeIds.has(n.data.parentId));
        if (roots.length > 0) {
            const ROOT_H_SPACING = 1000;
            const totalWidth = (roots.length - 1) * ROOT_H_SPACING;
            let currentRootX = 1500 - (totalWidth / 2);

            roots.forEach(rootNode => {
                if (rootNode.position.x === 1500 && rootNode.position.y === 600) {
                    rootNode.position = { x: currentRootX, y: 100 };
                    layoutSubtree(rootNode.id, currentRootX, 100 + V_SPACING);
                } else {
                    layoutSubtree(rootNode.id, rootNode.position.x, rootNode.position.y + V_SPACING);
                }
                currentRootX += ROOT_H_SPACING;
            });
        }

        setNodes(currentNodes => {
            const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
            return newNodes.map(newNode => {
                const existing = nodeMap.get(newNode.id);
                if (existing) {
                    return {
                        ...existing,
                        data: newNode.data,
                    };
                }
                return newNode;
            });
        });
        setEdges(newEdges);
    }, [devices, viewMode, collapsedIds, setNodes, setEdges, edgeStyle, selectedNodeId, hasInitializedCollapse, monitoringConfigs, settingsVersion]);

    const onNodeDragStop = useCallback((_event: any, node: Node) => {
        const selectedNodes = nodes.filter(n => n.selected && !n.data.isStatic);
        const nodesToUpdate = selectedNodes.length > 0 ? selectedNodes : [node];

        nodesToUpdate.forEach(n => {
            if (n.data.isStatic) return;
            updateDevicePosition.mutate({
                deviceId: n.id,
                x: Math.round(n.position.x),
                y: Math.round(n.position.y)
            });
        });
    }, [updateDevicePosition, nodes]);

    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selected = params.nodes[0];
        setSelectedNodeId(selected ? selected.id : null);
    }, []);

    const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<DeviceNodeData>) => {
        event.preventDefault();
        if (!node.data.isStatic) {
            setEditingNodeId(node.id);
        }
    }, []);

    const selectedDevice = useMemo(() => {
        if (!selectedNodeId) return null;
        const node = nodes.find(n => n.id === selectedNodeId);
        return node?.data || null;
    }, [selectedNodeId, nodes]);

    useEffect(() => {
        if (selectedDevice) {
            setPendingRole(selectedDevice.topologyRole || '');
            setPendingParentId(selectedDevice.parentId || '');
            setPendingAdditionalParents(Array.isArray(selectedDevice.additionalParents) ? selectedDevice.additionalParents : []);
            setPendingPortSpeed(selectedDevice.portSpeed || '10G');
            setHasUnsavedChanges(false);
        }
    }, [selectedNodeId]);

    return (
        <div className="relative w-full h-full bg-surface overflow-hidden select-none">
            <div className="w-full h-full">
                <ErrorBoundary t={t}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeDragStop={onNodeDragStop}
                        onSelectionChange={onSelectionChange}
                        onPaneClick={() => setSelectedNodeId(null)}
                        onNodeContextMenu={handleNodeContextMenu as any}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes as any}
                        fitView
                        minZoom={0.1}
                        maxZoom={2}
                        defaultEdgeOptions={{ type: 'smart', zIndex: 0 }}
                        elevateNodesOnSelect={true}
                        selectNodesOnDrag={false}
                        multiSelectionKeyCode="Control"
                        proOptions={{ hideAttribution: true }}
                    >
                        {showGrid && <Background variant={BackgroundVariant.Dots} color="rgba(255, 255, 255, 0.15)" gap={30} size={1.5} />}
                        <Background variant={BackgroundVariant.Lines} color="rgba(255, 255, 255, 0.04)" gap={30} lineWidth={1} />
                        <TopControls 
                            onBack={onBack} 
                            edgeStyle={edgeStyle} 
                            setEdgeStyle={setEdgeStyle} 
                        />
                    </ReactFlow>
                </ErrorBoundary>
            </div>

            {/* Info Panel Lateral - Mission Control Edition */}
            <AnimatePresence>
                {selectedDevice && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className="absolute bottom-10 right-10 glass-panel p-10 w-[420px] shadow-3xl z-[70] border-white/5 bg-surface-container/95 backdrop-blur-none overflow-hidden group/panel"
                    >
                        {/* Background Scanning Aesthetic */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan" />

                        <div className="flex justify-between items-start mb-12 relative z-10">
                            <div className="space-y-2">
                                <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic">{t('NODE_TELEMETRY')}</h3>
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic opacity-60">{t('SYNC_MATRIX_LINK')}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedNodeId(null)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-error hover:text-white transition-all text-on-surface-variant"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-6 p-6 bg-surface-container/40 rounded-2xl border border-white/5 shadow-inner">
                                <div className="p-4 bg-primary/10 text-primary rounded-xl shadow-lg">
                                    <NodeIcon type={selectedDevice.type} size={32} />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <p className="font-display-lg text-xl text-on-surface uppercase tracking-tight truncate italic">{selectedDevice.label}</p>
                                    <p className="font-data-mono text-[11px] text-primary/60 uppercase tracking-widest font-black">{selectedDevice.ip}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-surface-container/40 p-5 rounded-2xl border border-white/5 shadow-inner group/stat">
                                    <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block mb-3 tracking-[0.2em] opacity-40">{t('INTEGRITY_STATUS')}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: getStatusColor(selectedDevice.status, selectedDevice.latency) }}></div>
                                        <span className="font-display-lg text-sm text-on-surface uppercase italic">{selectedDevice.status === 'ok' ? t('NOMINAL') : t('CRITICAL_FAILURE')}</span>
                                    </div>
                                </div>
                                <div className="bg-surface-container/40 p-5 rounded-2xl border border-white/5 shadow-inner group/stat">
                                    <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block mb-3 tracking-[0.2em] opacity-40">{t('HIERARCHY_LAYER')}</span>
                                    <span className="font-display-lg text-sm text-primary uppercase italic tracking-tighter">{selectedDevice.layer || t('LEVEL_0_CORE')}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center px-2">
                                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 italic">{t('ASSET_CLASS')}</span>
                                    <span className="font-label-caps text-[10px] text-on-surface uppercase tracking-widest font-black">{selectedDevice.type}</span>
                                </div>
                                {selectedDevice.ip && (
                                    <div className="flex justify-between items-center px-2">
                                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 italic">{t('LOGICAL_ADDRESS')}</span>
                                        <span className="font-data-mono text-[11px] text-primary uppercase tracking-widest font-black">{selectedDevice.ip}</span>
                                    </div>
                                )}
                                {selectedDevice.lastLatency != null && (
                                    <div className="flex justify-between items-center px-2">
                                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 italic">{t('MATRIX_LATENCY')}</span>
                                        <span className="font-data-mono text-[11px] text-secondary-fixed uppercase tracking-widest font-black">{selectedDevice.lastLatency.toFixed(1)} ms</span>
                                    </div>
                                )}
                            </div>

                            {!selectedDevice.isStatic && (
                                <div className="pt-8 space-y-6 border-t border-white/5">
                                    <div className="space-y-3">
                                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] ml-2 italic font-black opacity-60">{t('TOPOLOGY_ROLE_OVERRIDE')}</label>
                                        <select
                                            className="w-full h-14 !bg-surface-container-high border-white/5 px-6 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary transition-all rounded-xl"
                                            value={pendingRole}
                                            onChange={(e) => { setPendingRole(e.target.value); setHasUnsavedChanges(true); }}
                                        >
                                            <option value="">{t('UNCATEGORIZED')}</option>
                                            <option value="CORE">{t('CORE_HUB')}</option>
                                            <option value="BACKBONE">{t('BACKBONE')}</option>
                                            <option value="BACKBONE_SEC">{t('SECONDARY_BACKBONE')}</option>
                                            <option value="WAN">{t('WAN_INTERNET')}</option>
                                            <option value="WAN_SEC">{t('SECONDARY_INTERNET')}</option>
                                            <option value="GATEWAY">{t('GATEWAY_FIREWALL')}</option>
                                            <option value="ACCESS">{t('ACCESS_LAYER')}</option>
                                            <option value="ACCESS_SEC">{t('SECONDARY_ACCESS')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between px-3">
                                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest opacity-40">{t('PRIMARY_UPLINK')}</label>
                                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest opacity-40">{t('PORT_SPEED')}</label>
                                        </div>
                                        <div className="flex gap-3">
                                            <select
                                                className="w-2/3 h-14 !bg-surface-container-high border-white/5 px-6 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary transition-all rounded-xl"
                                                value={pendingParentId || 'null'}
                                                onChange={(e) => { setPendingParentId(e.target.value === 'null' ? '' : e.target.value); setHasUnsavedChanges(true); }}
                                            >
                                                <option value="null">{t('AUTO_DISCOVER')}</option>
                                                {nodes
                                                    .map(n => n.data)
                                                    .filter((d: any) => d.id !== (selectedDevice as any).id)
                                                    .sort((a: any, b: any) => (a.label || '').toUpperCase().localeCompare((b.label || '').toUpperCase()))
                                                    .map((sw: any) => (
                                                        <option key={sw.id} value={sw.id}>{sw.label.toUpperCase()}</option>
                                                    ))}
                                            </select>

                                            <select
                                                className="w-1/3 h-14 !bg-surface-container-high border-white/5 px-4 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary transition-all rounded-xl text-center"
                                                value={pendingPortSpeed}
                                                onChange={(e) => { setPendingPortSpeed(e.target.value); setHasUnsavedChanges(true); }}
                                            >
                                                <option value="40G">40G</option>
                                                <option value="10G">10G</option>
                                                <option value="1G">1G</option>
                                                <option value="100M">100M</option>
                                                <option value="Wireless">WIFI</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3 mt-6">
                                            {pendingAdditionalParents.map((apId, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <select
                                                        className="flex-1 h-14 !bg-surface-container-high border-white/5 px-6 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary transition-all rounded-xl"
                                                        value={apId || 'null'}
                                                        onChange={(e) => {
                                                            const newVal = e.target.value === 'null' ? '' : e.target.value;
                                                            const next = [...pendingAdditionalParents];
                                                            next[idx] = newVal;
                                                            setPendingAdditionalParents(next);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    >
                                                        <option value="null">{t('AUX_UPLINK')} {idx + 2}</option>
                                                        {nodes
                                                            .map(n => n.data)
                                                            .filter((d: any) => d.id !== (selectedDevice as any).id && d.id !== pendingParentId)
                                                            .sort((a: any, b: any) => (a.label || '').toUpperCase().localeCompare((b.label || '').toUpperCase()))
                                                            .map((sw: any) => (
                                                                <option key={sw.id} value={sw.id}>{sw.label.toUpperCase()}</option>
                                                            ))}
                                                    </select>
                                                    <button 
                                                        onClick={() => {
                                                            const next = pendingAdditionalParents.filter((_, i) => i !== idx);
                                                            setPendingAdditionalParents(next);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                        className="w-14 h-14 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all border border-error/20"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            {pendingAdditionalParents.length < 3 && (
                                                <button
                                                    onClick={() => setPendingAdditionalParents([...pendingAdditionalParents, ''])}
                                                    className="w-full flex items-center justify-center gap-3 h-14 bg-surface-container/20 border border-dashed border-white/10 rounded-xl font-display-lg text-[11px] text-on-surface-variant/40 hover:text-primary hover:border-primary/40 transition-all uppercase tracking-[0.3em] italic"
                                                >
                                                    <Plus size={16} /> {t('ADD_REDUNDANT_LINK')}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {hasUnsavedChanges && (
                                            <button
                                                disabled={updateDevice.isLoading}
                                                onClick={() => {
                                                    updateDevice.mutate({
                                                        id: (selectedDevice as any).id,
                                                        portSpeed: pendingPortSpeed,
                                                        parentId: pendingParentId || null,
                                                        topologyRole: pendingRole || null,
                                                        additionalParents: pendingAdditionalParents.filter(id => !!id),
                                                    }, {
                                                        onSuccess: () => {
                                                            toast.success(t('MATRIX_SYNCHRONIZED'), {
                                                                style: {
                                                                    background: 'rgba(0,0,0,0.8)',
                                                                    color: 'var(--primary)',
                                                                    border: '1px solid var(--primary-fixed)',
                                                                    fontSize: '10px',
                                                                    fontFamily: 'var(--font-data-mono)'
                                                                }
                                                            });
                                                            setHasUnsavedChanges(false);
                                                        }
                                                    });
                                                }}
                                                className="cyber-button w-full h-16 flex items-center justify-center gap-4 !bg-primary text-black border-primary shadow-[0_0_30px_rgba(var(--primary-fixed),0.3)] mt-10 font-display-lg text-lg uppercase italic tracking-tighter"
                                            >
                                                {updateDevice.isLoading ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
                                                {t('COMMIT_MATRIX_CHANGES')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 grid grid-cols-2 gap-4 border-t border-white/5">
                                <button onClick={() => setEditingNodeId(selectedNodeId)} className="cyber-button h-14 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] font-black italic bg-surface-container border-white/10 hover:border-primary">
                                    {t('EDIT_ASSET')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {editingNodeId && (() => {
                const node = nodes.find(n => n.id === editingNodeId);
                if (!node) return null;
                const d = node.data;
                return <DeviceEditModal deviceId={d.id} deviceName={d.label} deviceIp={d.ip || ''} deviceType={d.type as any} parentId={d.parentId} connectedPort={d.connectedPort} portSpeed={d.portSpeed} topologyRole={d.topologyRole} vlan={d.vlan ? d.vlan.toString() : undefined} purchaseValue={d.purchaseValue} onClose={() => setEditingNodeId(null)} />;
            })()}

            <style>{`
                .react-flow__edge-path {
                    stroke-dasharray: 0;
                    transition: stroke-width 0.3s, stroke 0.3s;
                }
                .react-flow__edge.selected .react-flow__edge-path {
                    stroke: var(--primary) !important;
                    stroke-width: 6 !important;
                    opacity: 0.8 !important;
                }
                .react-flow__edge-path-wireless {
                    stroke-dasharray: 5,5;
                }
                .react-flow__controls {
                    display: none;
                }
                .react-flow__handle {
                    width: 8px;
                    height: 8px;
                    background: var(--primary);
                    border: 2px solid var(--surface);
                }
            `}</style>
        </div>
    );
}

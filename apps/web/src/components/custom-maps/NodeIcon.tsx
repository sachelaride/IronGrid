import React from 'react';
interface NodeIconProps {
    type: string;
    size?: number;
    className?: string;
}

export const NodeIcon: React.FC<NodeIconProps> = ({ type, size = 24, className = "" }) => {
    const getIconPath = (t: string) => {
        const typeLower = t.toLowerCase();
        let iconName = 'server';

        if (typeLower.includes('cloud')) iconName = 'cloud';
        else if (typeLower.includes('internet') || typeLower.includes('wan') || typeLower.includes('adsl')) iconName = 'router';
        else if (typeLower.includes('router') || typeLower.includes('gateway')) iconName = 'router';
        else if (typeLower.includes('firewall') || typeLower.includes('shield') || typeLower.includes('security')) iconName = 'firewall';
        else if (typeLower.includes('switch')) iconName = 'switch';
        else if (typeLower.includes('server')) iconName = 'server';
        else if (typeLower.includes('storage') || typeLower.includes('nas')) iconName = 'nas';
        else if (typeLower.includes('db') || typeLower.includes('database')) iconName = 'database';
        else if (typeLower.includes('pc') || typeLower.includes('computer') || typeLower.includes('desktop') || typeLower.includes('laptop') || typeLower.includes('endpoint') || typeLower.includes('workstation') || typeLower.includes('monitor') || typeLower.includes('terminal')) iconName = 'computer';
        else if (typeLower.includes('printer')) iconName = 'printer';
        else if (typeLower.includes('voip') || typeLower.includes('phone')) iconName = 'voip';
        else if (typeLower.includes('camera')) iconName = 'camera';
        else if (typeLower.includes('ap') || typeLower.includes('wifi') || typeLower.includes('access_point')) iconName = 'access-point';
        
        return `/icons/topology/mission_control/${iconName}.png`;
    };

    return (
        <img
            src={`${getIconPath(type)}?v=2`}
            className={className}
            style={{ 
                width: size, 
                height: size, 
                objectFit: 'contain',
                mixBlendMode: 'screen',
                filter: 'brightness(1.2) contrast(1.1)'
            }}
            alt={type}
        />
    );
};

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { OIcon, XIcon } from './Icons';

type CellProps = {
    cell: any;
    onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ cell, onClick }) => {
    const controls = useAnimation();

    useEffect(() => {
        let timeoutId: any;
        let isMounted = true;

        const triggerAnimation = async () => {
            if (!isMounted) return;
            const randomDelay = Math.random() * 10000 + 5000;

            await new Promise(resolve => {
                timeoutId = setTimeout(resolve, randomDelay);
            });

            if (!isMounted) return;

            await controls.start({
                scaleX: [1, 1.15, 0.9, 1.05, 1],
                scaleY: [1, 0.85, 1.1, 0.95, 1],
                transition: {
                    duration: 0.6,
                    ease: "easeInOut"
                }
            });

            triggerAnimation();
        };

        triggerAnimation();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            controls.stop();
        };
    }, [controls]);

    return (
        <motion.div
            className="cell"
            onClick={onClick}
            animate={controls}
        >
            {cell === 'X' && <XIcon />}
            {cell === 'O' && <OIcon />}
        </motion.div>
    )
}

export default Cell;
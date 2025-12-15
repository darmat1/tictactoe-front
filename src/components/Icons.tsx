import { motion, type Variants } from 'framer-motion';

export const XIcon = () => {
    const duration = 0.15;

    const pathVariants: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (i: number) => {
            const delay = i * duration;
            return {
                pathLength: 1,
                opacity: 1,
                transition: {
                    pathLength: {
                        delay,
                        type: "tween",
                        duration: duration,
                        ease: "linear"
                    },
                    opacity: { duration: 0.01, delay }
                }
            };
        }
    };

    return (
        <motion.svg
            width="63"
            height="61"
            viewBox="0 0 63 61"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate="visible"
        >
            <motion.path
                d="M10.8809 10.6055L51.6057 49.9545"
                stroke="#0088CC"
                strokeWidth="15"
                strokeLinecap="square"
                variants={pathVariants}
                custom={0}
            />
            <motion.path
                d="M50.78 10.6055L10.6055 50.2296"
                stroke="#0088CC"
                strokeWidth="15"
                strokeLinecap="square"
                variants={pathVariants}
                custom={1}
            />
        </motion.svg>

    );
};

export const OIcon = () => {
    return (
        <motion.svg
            width="70"
            height="70"
            viewBox="0 0 70 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate="visible"
        >
            <motion.circle
                cx="35"
                cy="35"
                r="27.5"
                stroke="#E91E63"
                strokeWidth="15"
                initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                animate={{ pathLength: 1, rotate: -90, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            />
        </motion.svg>
    );
};
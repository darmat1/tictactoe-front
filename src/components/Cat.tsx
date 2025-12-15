import { useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import catAnimation from "../assets/cat.json";
import { Howl } from 'howler';
import meowSound from '../assets/sounds/meow.mp3';

const meow = new Howl({ src: [meowSound], volume: 0.5 });

const Cat = () => {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    const handleClick = () => {
        if (isInteracting) return;

        setIsInteracting(true);
        meow.play();

        lottieRef.current?.setSpeed(2);

        setTimeout(() => {
            lottieRef.current?.setSpeed(1);
            setIsInteracting(false);
        }, 1000);
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '-52px',
                right: '0',
                width: '150px',
                cursor: 'pointer',
                zIndex: 100
            }}
            onClick={handleClick}
        >
            <Lottie
                lottieRef={lottieRef}
                animationData={catAnimation}
                loop={true}
            />
        </div>
    );
};

export default Cat;
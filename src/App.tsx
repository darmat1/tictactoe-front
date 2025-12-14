import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import WebApp from '@twa-dev/sdk';
import { Howl, Howler } from 'howler';
import './App.scss';

import bgm from './assets/sounds/bgm.mp3';
import whoosh from './assets/sounds/whoosh.mp3';
import swish from './assets/sounds/swish.mp3';
import draw from './assets/sounds/draw.mp3';
import notify from './assets/sounds/notify.mp3';
import win from './assets/sounds/win.mp3';
import lose from './assets/sounds/lose.mp3';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

type NotificationType = { msg: string; type: 'error' | 'info' } | null;
type GameOverType = { result: 'win' | 'lose' | 'draw'; winLine?: number[] } | null;
type PlayerProfile = { name: string; avatar: string | null };

const getMyProfile = (): PlayerProfile => {
  const user = WebApp.initDataUnsafe?.user;
  return {
    name: user?.first_name || 'Noname',
    avatar: user?.photo_url || null
  };
};

const sounds = {
  bgm: new Howl({ src: [bgm], loop: true, volume: 0.2, html5: false }),
  moveX: new Howl({ src: [whoosh], volume: 0.5 }),
  move0: new Howl({ src: [swish], volume: 0.5 }),
  win: new Howl({ src: [win], volume: 0.6 }),
  lose: new Howl({ src: [lose], volume: 0.6 }),
  draw: new Howl({ src: [draw], volume: 0.6 }),
  notify: new Howl({ src: [notify], volume: 0.5 }),
};

function App() {
  const [roomId, setRoomId] = useState('');
  const [symbol, setSymbol] = useState<'X' | 'O' | null>(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('Введите ID комнаты');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isInGame, setIsInGame] = useState(false);

  const [notification, setNotification] = useState<NotificationType>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverType>(null);
  const [waitingForRematch, setWaitingForRematch] = useState(false);

  const [myProfile] = useState<PlayerProfile>(getMyProfile());
  const [opponentProfile, setOpponentProfile] = useState<PlayerProfile | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const timerRef = useRef<any>(null);

  const showNotification = (msg: string, type: 'error' | 'info', autoHide: boolean = true) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setNotification({ msg, type });
    if (type === 'info') playSfx('notify');
    if (autoHide) timerRef.current = setTimeout(() => setNotification(null), 3000);
  };

  const playSfx = (name: keyof typeof sounds) => {
    if (isMuted) return;
    if (name !== 'bgm') sounds[name].play();
  };

  useEffect(() => {
    Howler.mute(isMuted);
    if (!isMuted && !sounds.bgm.playing()) {
      sounds.bgm.play();
    }
  }, [isMuted]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => { setIsConnected(false); setIsInGame(false); setRoomId(''); };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    socket.on('created', () => {
      setSymbol(null);
      setIsInGame(true);
      setStatus('Ждем второго игрока...');
      setOpponentProfile(null);
    });

    socket.on('game_start', ({ symbol, opponentProfile, turn }) => {
      setIsInGame(true);
      setSymbol(symbol);
      setOpponentProfile(opponentProfile);

      const amIStarting = turn === symbol;
      setIsMyTurn(amIStarting);
      setStatus(amIStarting ? 'Ваш ход!' : 'Ждем соперника...');

      playSfx('notify');
      showNotification(`Вы играете за ${symbol === 'X' ? '❌' : '⭕'}`, 'info');
    });

    socket.on('opponent_joined', ({ profile }) => {
      setOpponentProfile(profile);
      showNotification(`${profile.name} присоединился!`, 'info');
    });

    socket.on('update_board', ({ board, turn }) => {
      setBoard(board);
      const myTurn = turn === symbol;
      setIsMyTurn(myTurn);
      setStatus(myTurn ? 'Ваш ход!' : 'Ждем соперника...');
      const whoJustMoved = turn === 'X' ? 'move0' : 'moveX';
      playSfx(whoJustMoved);
    });

    socket.on('game_over', ({ winner, winLine }) => {
      if (winner === 'Draw') {
        setGameOverResult({ result: 'draw' });
        playSfx('draw');
      } else {
        const isWin = winner === symbol;
        setGameOverResult({ result: isWin ? 'win' : 'lose', winLine });
        playSfx(isWin ? 'win' : 'lose');
      }
      setIsMyTurn(false);
    });

    socket.on('game_restarted', ({ board, turn, newSymbol }) => {
      setBoard(board);
      setGameOverResult(null);
      setWaitingForRematch(false);
      setNotification(null);

      if (newSymbol) setSymbol(newSymbol);

      const effectiveSymbol = newSymbol || symbol;
      const amIStarting = turn === effectiveSymbol;

      setIsMyTurn(amIStarting);
      setStatus(amIStarting ? 'Ваш ход!' : 'Ждем соперника...');

      showNotification(`Игра началась! Вы: ${effectiveSymbol === 'X' ? '❌' : '⭕'}`, 'info');
      playSfx('notify');
    });

    socket.on('opponent_wants_rematch', () => {
      showNotification('Соперник предлагает сыграть еще!', 'info', false);
    });

    socket.on('opponent_left', () => {
      showNotification('Соперник вышел', 'error');
      setTimeout(() => resetGame(), 2000);
    });

    socket.on('error', (err) => showNotification(err, 'error'));

    return () => { socket.off(); };
  }, [symbol]);

  const getStrikeClass = (line: number[]) => {
    const s = line.join('');
    if (s === '012') return 'strike-row-0';
    if (s === '345') return 'strike-row-1';
    if (s === '678') return 'strike-row-2';
    if (s === '036') return 'strike-col-0';
    if (s === '147') return 'strike-col-1';
    if (s === '258') return 'strike-col-2';
    if (s === '048') return 'strike-diag-0';
    if (s === '246') return 'strike-diag-1';
    return '';
  };

  const handleExit = () => { socket.emit('leave_game', roomId); resetGame(); };
  const handlePlayAgain = () => { socket.emit('request_rematch', roomId); setWaitingForRematch(true); showNotification('Предложение отправлено...', 'info', false); };
  const resetGame = () => { setIsInGame(false); setBoard(Array(9).fill(null)); setSymbol(null); setRoomId(''); setStatus('Введите ID комнаты'); setGameOverResult(null); setWaitingForRematch(false); setOpponentProfile(null); };
  const createRoom = () => { if (!roomId) return showNotification('Введите название комнаты', 'error'); socket.emit('create_game', { roomId, profile: myProfile }); };
  const joinRoom = () => { if (!roomId) return showNotification('Введите название комнаты', 'error'); socket.emit('join_game', { roomId, profile: myProfile }); };
  const handleCellClick = (index: number) => { if (!isMyTurn || board[index] !== null) return; socket.emit('make_move', { roomId, index, symbol }); };
  const toggleSound = () => { setIsMuted(!isMuted); };
  const renderAvatar = (profile: PlayerProfile | null) => {
    if (!profile) return <div className="avatar">?</div>;
    if (profile.avatar) return <div className="avatar"><img src={profile.avatar} alt="avatar" /></div>;
    return <div className="avatar">{profile.name.charAt(0).toUpperCase()}</div>;
  };

  if (!isConnected) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Подключение...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className='header'>
        {isInGame && <span>Room: {roomId}</span>}
        {!!symbol && <div style={{ fontWeight: 'bold', color: symbol === 'X' ? '#0088cc' : '#e91e63' }}>
          {symbol}
        </div>}
        <button className="sound-btn" style={!isInGame ? { marginLeft: 'auto' } : {}} onClick={toggleSound}>
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.msg}</div>}

      {!isInGame ? (
        <div className="lobby">
          <h1>Tic Tac Toe</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
            {renderAvatar(myProfile)}
            <span style={{ color: '#888', marginTop: 5 }}>{myProfile.name}</span>
          </div>
          <input placeholder="Придумайте ID комнаты" value={roomId} onChange={e => setRoomId(e.target.value)} />
          <div className="actions">
            <button onClick={createRoom}>Создать</button>
            <button onClick={joinRoom} style={{ background: '#444' }}>Войти</button>
          </div>
        </div>
      ) : (
        <>
          <div className="players-info">
            <div className={`player-card ${isMyTurn ? 'active' : ''}`}>
              {renderAvatar(myProfile)}
              <div className="player-name">{myProfile.name}</div>
            </div>

            <div className="vs-badge">VS</div>

            <div className={`player-card reversed ${!isMyTurn && opponentProfile && !gameOverResult ? 'active' : ''}`}>
              {renderAvatar(opponentProfile)}
              <div className="player-name">{opponentProfile ? opponentProfile.name : 'Ждем...'}</div>
            </div>
          </div>

          <div style={{ fontSize: '1rem', color: '#ccc', marginBottom: '15px' }}>{!gameOverResult && status}</div>

          <div className="board">
            {gameOverResult && gameOverResult.winLine && (
              <div className={`strike-line ${getStrikeClass(gameOverResult.winLine)}`}></div>
            )}
            {board.map((cell, idx) => (
              <div key={idx} className="cell" onClick={() => handleCellClick(idx)}>
                {cell && <span style={{ color: cell === 'X' ? '#0088cc' : '#e91e63' }}>{cell}</span>}
              </div>
            ))}
          </div>

          {gameOverResult && (
            <div className="game-result">
              {gameOverResult.result === 'win' && <h2 style={{ color: '#4caf50' }}>Победа! 🎉</h2>}
              {gameOverResult.result === 'lose' && <h2 style={{ color: '#d32f2f' }}>Поражение 😞</h2>}
              {gameOverResult.result === 'draw' && <h2 style={{ color: '#ffeb3b' }}>Ничья 🤝</h2>}

              <div className="actions">
                <button onClick={handlePlayAgain} disabled={waitingForRematch} style={{ background: waitingForRematch ? '#555' : '#0088cc' }}>
                  {waitingForRematch ? 'Ждем...' : 'Еще раз'}
                </button>
                <button onClick={handleExit} style={{ background: '#444' }}>Выйти</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
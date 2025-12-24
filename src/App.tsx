import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import WebApp from '@twa-dev/sdk';
import { Howl, Howler } from 'howler';
import { useTranslation } from 'react-i18next';
import './App.scss';

import bgm from './assets/sounds/bgm.mp3';
import whoosh from './assets/sounds/whoosh.mp3';
import swish from './assets/sounds/swish.mp3';
import draw from './assets/sounds/draw.mp3';
import notify from './assets/sounds/notify.mp3';
import win from './assets/sounds/win.mp3';
import lose from './assets/sounds/lose.mp3';
import Cell from './components/Cell';
import Cat from './components/Cat';
import Settings from './components/Settings';
import RoomList from './components/RoomList';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

export type NotificationType = { msg: string; type: 'error' | 'info' } | null;
export type GameOverType = { result: 'win' | 'lose' | 'draw'; winLine?: number[] } | null;
export type PlayerProfile = { id: string; name: string; avatar: string | null };
export type Room = { id: string; creatorProfile: PlayerProfile; createdAt: string };
export type AvailableRooms = { rooms: Room[] };

const getMyProfile = (): PlayerProfile => {
  const user = WebApp.initDataUnsafe?.user;
  return {
    id: user?.id?.toString() || Math.random().toString(36).substr(2, 9),
    name: user?.first_name || 'Noname',
    avatar: user?.photo_url || null
  };
};

const createSounds = (volume: number) => ({
  bgm: new Howl({ src: [bgm], loop: true, volume: volume * 0.2, html5: false }),
  moveX: new Howl({ src: [whoosh], volume: volume * 0.5 }),
  move0: new Howl({ src: [swish], volume: volume * 0.5 }),
  win: new Howl({ src: [win], volume: volume * 0.6 }),
  lose: new Howl({ src: [lose], volume: volume * 0.6 }),
  draw: new Howl({ src: [draw], volume: volume * 0.6 }),
  notify: new Howl({ src: [notify], volume: volume * 0.5 }),
});

let sounds = createSounds(0.5);

function App() {
  const { t, i18n } = useTranslation();
  const [roomId, setRoomId] = useState('');
  const [symbol, setSymbol] = useState<'X' | 'O' | null>(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState(t('game.enterRoomId'));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isInGame, setIsInGame] = useState(false);

  const [notification, setNotification] = useState<NotificationType>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverType>(null);
  const [waitingForRematch, setWaitingForRematch] = useState(false);

  const [myProfile] = useState<PlayerProfile>(getMyProfile());
  const [opponentProfile, setOpponentProfile] = useState<PlayerProfile | null>(null);

  const loadSettings = () => ({
    volume: parseFloat(localStorage.getItem('tictactoe-volume') || '0.5'),
    isMuted: localStorage.getItem('tictactoe-muted') === 'true',
    language: localStorage.getItem('tictactoe-language') || 'en'
  });

  const savedSettings = loadSettings();

  const [volume, setVolume] = useState(savedSettings.volume);
  const [isMuted, setIsMuted] = useState(savedSettings.isMuted);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);


  const timerRef = useRef<any>(null);

  const showNotification = useCallback((msgKey: string, params?: any, type: 'error' | 'info' = 'info', autoHide: boolean = true) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const msg = params ? t(msgKey, params) : t(msgKey);
    setNotification({ msg: msg as string, type });
    if (type === 'info') playSfx('notify');
    if (autoHide) timerRef.current = setTimeout(() => setNotification(null), 3000);
  }, [t, i18n.language]);

  useEffect(() => {
    localStorage.setItem('tictactoe-language', i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (savedSettings.language !== i18n.language) {
      i18n.changeLanguage(savedSettings.language);
    }
  }, []);

  const mapBackendError = (errorKey: string): string => {
    const errorMap: Record<string, string> = {
      'ROOM_OCCUPIED': 'errors.roomOccupied',
      'ROOM_NOT_FOUND': 'errors.roomNotFound',
      'ROOM_FULL': 'errors.roomFull',
      'GAME_NOT_FOUND': 'errors.gameNotFound',
      'NOT_YOUR_TURN': 'errors.notYourTurn',
      'CELL_OCCUPIED': 'errors.cellOccupied',
      'NOT_PLAYING_AS_X': 'errors.notPlayingAsX',
      'NOT_PLAYING_AS_O': 'errors.notPlayingAsO'
    };
    return errorMap[errorKey] || `errors.unknown.${errorKey}`;
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
    const onConnect = () => {
      setIsConnected(true);
      socket.emit('get_rooms');
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setIsInGame(false);
      setRoomId('');
      setAvailableRooms([]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!isInGame) {
      setStatus('game.enterRoomId');
    }
  }, [t, isInGame]);

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
    if (!isInGame) {
      setStatus('game.enterRoomId');
    }
  }, [i18n.language, isInGame]);

  useEffect(() => {
    socket.on('created', () => {
      setSymbol(null);
      setIsInGame(true);
      setStatus('game.waitingForPlayer');
      setOpponentProfile(null);
    });

    socket.on('game_start', ({ symbol, opponentProfile, turn }) => {
      setIsInGame(true);
      setSymbol(symbol);
      setOpponentProfile(opponentProfile);

      const amIStarting = turn === symbol;
      setIsMyTurn(amIStarting);
      setStatus(amIStarting ? 'game.yourTurn' : 'game.waitingForOpponent');

      playSfx('notify');
      showNotification('notifications.youArePlayingAs', { symbol: symbol === 'X' ? '❌' : '⭕' }, 'info');
    });

    socket.on('opponent_joined', ({ profile }) => {
      setOpponentProfile(profile);
      showNotification(t('notifications.opponentJoined', { name: profile.name }), 'info');
    });

    socket.on('update_board', ({ board, turn }) => {
      setBoard(board);
      const myTurn = turn === symbol;
      setIsMyTurn(myTurn);
      setStatus(myTurn ? 'game.yourTurn' : 'game.waitingForOpponent');
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
      setStatus(amIStarting ? 'game.yourTurn' : 'game.waitingForOpponent');

      showNotification('notifications.gameStarted', { symbol: effectiveSymbol === 'X' ? '❌' : '⭕' }, 'info');
      playSfx('notify');
    });

    socket.on('opponent_wants_rematch', () => {
      showNotification('notifications.rematchRequested', undefined, 'info', false);
    });

    socket.on('opponent_left', () => {
      showNotification(t('notifications.opponentLeft'), 'error');
      socket.emit('get_rooms');
      setTimeout(() => resetGame(), 2000);
    });

    socket.on('rooms_updated', (data: AvailableRooms) => {
      setAvailableRooms(data.rooms);
    });

    socket.on('error', (err) => {
      const errorKey = typeof err === 'string' && err.includes('[')
        ? err.split('[')[0].trim()
        : err;
      const translatedErrorKey = mapBackendError(errorKey);

      if (['ROOM_NOT_FOUND', 'ROOM_FULL', 'ROOM_OCCUPIED'].includes(errorKey) && roomId) {
        setAvailableRooms(prev => prev.filter(room => room.id !== roomId));
      }

      setTimeout(() => {
        showNotification(translatedErrorKey, undefined, 'error');
      }, 50);
    });

    return () => {
      socket.off('created');
      socket.off('game_start');
      socket.off('opponent_joined');
      socket.off('update_board');
      socket.off('game_over');
      socket.off('game_restarted');
      socket.off('opponent_wants_rematch');
      socket.off('opponent_left');
      socket.off('error');
    };
  }, [symbol, i18n.language]);

  useEffect(() => {
    if (notification) {
      setNotification({
        ...notification,
        msg: t(notification.msg as string)
      });
    }
  }, [i18n.language, t]);

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

  const handleExit = () => {
    socket.emit('leave_game', roomId);
    socket.emit('get_rooms');
    resetGame();
  };
  const handlePlayAgain = () => { socket.emit('request_rematch', roomId); setWaitingForRematch(true); showNotification('notifications.rematchSent', undefined, 'info', false); };
  const resetGame = () => { setIsInGame(false); setBoard(Array(9).fill(null)); setSymbol(null); setRoomId(''); setStatus('game.enterRoomId'); setGameOverResult(null); setWaitingForRematch(false); setOpponentProfile(null); };
  const createRoom = () => { if (!roomId) return showNotification('notifications.enterRoomName', undefined, 'error'); socket.emit('create_game', { roomId, profile: myProfile }); };
  const joinRoomFromList = (roomIdToList: string) => {
    setRoomId(roomIdToList);
    socket.emit('join_game', { roomId: roomIdToList, profile: myProfile });
  };

  const handleCellClick = (index: number) => { if (!isMyTurn || board[index] !== null) return; socket.emit('make_move', { roomId, index, symbol }); };
  const toggleSound = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('tictactoe-muted', newMutedState.toString());
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('tictactoe-volume', newVolume.toString());
    sounds = createSounds(newVolume);
    Howler.volume(newVolume);
  };
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
          <h2>{t('game.connecting')}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className='header'>
        {isInGame ? <span className='room'>{t('common.room').replace('{{roomId}}', '').trim()} <strong>{roomId}</strong></span> : <span className='room'></span>}
        {!!symbol ? <div style={{ fontWeight: 'bold', color: symbol === 'X' ? '#0088cc' : '#e91e63' }}>
          {symbol}
        </div> : <div></div>}
        <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
          ⚙️
        </button>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.msg}</div>}

      {!isInGame ? (
        <div className="lobby">
          <h1>{t('lobby.title')}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
            {renderAvatar(myProfile)}
            <span style={{ color: '#888', marginTop: 5 }}>{myProfile.name}</span>
          </div>
          <input placeholder={t('lobby.roomInputPlaceholder')} value={roomId} onChange={e => setRoomId(e.target.value)} />
          <div className="actions">
            <button onClick={createRoom}>{t('lobby.create')}</button>
          </div>
          <RoomList
            rooms={availableRooms}
            onJoinRoom={joinRoomFromList}
            myProfile={myProfile}
          />
        </div>
      ) : (
        <>
          <div className="players-info">
            <div className={`player-card ${isMyTurn ? 'active' : ''}`}>
              {renderAvatar(myProfile)}
              <div className="player-name">{myProfile.name}</div>
            </div>

            <div className="vs-badge">{t('common.vs')}</div>

            <div className={`player-card reversed ${!isMyTurn && opponentProfile && !gameOverResult ? 'active' : ''}`}>
              {renderAvatar(opponentProfile)}
              <div className="player-name">{opponentProfile ? opponentProfile.name : t('game.waitingForOpponentName')}</div>
            </div>
          </div>

          <div style={{ fontSize: '1rem', color: '#ccc', marginBottom: '15px' }}>{!gameOverResult && t(status)}</div>
          <div style={{ position: "relative", width: "260px" }}>
            <Cat />
          </div>
          <div className="board">
            {gameOverResult && gameOverResult.winLine && (
              <div className={`strike-line ${getStrikeClass(gameOverResult.winLine)}`}></div>
            )}
            {board.map((cell, idx) => (
              <Cell key={idx} cell={cell} onClick={() => handleCellClick(idx)} />
            ))}
          </div>

          {gameOverResult && (
            <div className="game-result">
              {gameOverResult.result === 'win' && <h2 style={{ color: '#4caf50' }}>{t('gameOver.win')}</h2>}
              {gameOverResult.result === 'lose' && <h2 style={{ color: '#d32f2f' }}>{t('gameOver.lose')}</h2>}
              {gameOverResult.result === 'draw' && <h2 style={{ color: '#ffeb3b' }}>{t('gameOver.draw')}</h2>}

              <div className="actions">
                <button onClick={handlePlayAgain} disabled={waitingForRematch} style={{ background: waitingForRematch ? '#555' : '#0088cc' }}>
                  {waitingForRematch ? t('common.waiting') : t('gameOver.playAgain')}
                </button>
                <button onClick={handleExit} style={{ background: '#444' }}>{t('gameOver.exit')}</button>
              </div>
            </div>
          )}
        </>
      )}

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        toggleSound={toggleSound}
        volume={volume}
        setVolume={updateVolume}
      />
    </div>
  );
}

export default App;
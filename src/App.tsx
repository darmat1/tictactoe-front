import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import WebApp from '@twa-dev/sdk';
import './App.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

type NotificationType = { msg: string; type: 'error' | 'info' } | null;
type GameOverType = { result: 'win' | 'lose' | 'draw'; winLine?: number[] } | null;

function App() {
  const [roomId, setRoomId] = useState('');
  const [symbol, setSymbol] = useState<'X' | 'O' | null>(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('Введите ID комнаты');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isInGame, setIsInGame] = useState(false);
  const [notification, setNotification] = useState<NotificationType>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverType>(null);

  const showNotification = (msg: string, type: 'error' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    socket.on('created', ({ symbol }) => {
      setSymbol(symbol);
      setIsInGame(true);
      setStatus('Ждем второго игрока...');
    });

    socket.on('joined', ({ symbol }) => {
      setSymbol(symbol);
      setIsInGame(true);
      setStatus('Игра началась! Ходят крестики.');
    });

    socket.on('game_start', ({ turn }) => {
      const amIStarting = turn === symbol;
      setIsMyTurn(amIStarting);
      setStatus(amIStarting ? 'Ваш ход!' : 'Ждем соперника...');
    });

    socket.on('update_board', ({ board, turn }) => {
      setBoard(board);
      const myTurn = turn === symbol;
      setIsMyTurn(myTurn);
      setStatus(myTurn ? 'Ваш ход!' : 'Ждем соперника...');
    });

    socket.on('game_over', ({ winner, winLine }) => {
      if (winner === 'Draw') {
        setGameOverResult({ result: 'draw' });
      } else {
        const isWin = winner === symbol;
        setGameOverResult({ result: isWin ? 'win' : 'lose', winLine });
      }
      setIsMyTurn(false);
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

  const resetGame = () => {
    setIsInGame(false);
    setBoard(Array(9).fill(null));
    setSymbol(null);
    setRoomId('');
    setStatus('Введите ID комнаты');
    setGameOverResult(null);
  };

  const createRoom = () => {
    if (!roomId) return showNotification('Введите название комнаты', 'error');
    socket.emit('create_game', roomId);
  };

  const joinRoom = () => {
    if (!roomId) return showNotification('Введите название комнаты', 'error');
    socket.emit('join_game', roomId);
  };

  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] !== null) return;
    socket.emit('make_move', { roomId, index, symbol });
  };

  return (
    <div className="container">
      {notification && <div className={`notification ${notification.type}`}>{notification.msg}</div>}

      {!isInGame ? (
        <>
          <h1>Tic Tac Toe</h1>
          <input placeholder="ID комнаты" value={roomId} onChange={e => setRoomId(e.target.value)} />
          <div>
            <button onClick={createRoom}>Создать</button>
            <button onClick={joinRoom}>Войти</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '10px', fontSize: '1.2rem' }}>
            Вы: <span style={{ fontWeight: 'bold', color: symbol === 'X' ? '#0088cc' : '#e91e63' }}>{symbol}</span>
            <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>{!gameOverResult && status}</div>
          </div>

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
              {gameOverResult.result === 'win' && <h2 style={{ color: '#4caf50', margin: 0 }}>Победа! 🎉</h2>}
              {gameOverResult.result === 'lose' && <h2 style={{ color: '#d32f2f', margin: 0 }}>Проигрыш 😞</h2>}
              {gameOverResult.result === 'draw' && <h2 style={{ color: '#ffeb3b', margin: 0 }}>Ничья 🤝</h2>}

              <button onClick={resetGame} style={{ marginTop: '15px', background: '#444' }}>
                Меню
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
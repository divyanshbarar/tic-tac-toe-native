import { Ionicons } from '@expo/vector-icons';
import React, { JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width * 0.9;

type Player = 'X' | 'O';
type CellValue = Player | null;
type GameResult = Player | 'draw' | null;
type BoardSize = 3 | 4;

interface GameHistory {
  boardSize: BoardSize;
  board: CellValue[];
  winner: GameResult;
  date: string;
}

interface Scores {
  x: number;
  o: number;
  draws: number;
}

const TicTacToe: React.FC = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [scores, setScores] = useState<Scores>({ x: 0, o: 0, draws: 0 });
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [winner, setWinner] = useState<GameResult>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  
  // Animation refs
  const fadeInValue = useRef(new Animated.Value(0)).current;
  const boardScaleValue = useRef(new Animated.Value(1)).current;
  const cellScaleValues = useRef<Animated.Value[]>(Array(9).fill(null).map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Initialize animations
    Animated.timing(fadeInValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Update cell animations when board size changes
    const newSize = boardSize * boardSize;
    cellScaleValues.splice(newSize);
    for (let i = cellScaleValues.length; i < newSize; i++) {
      cellScaleValues[i] = new Animated.Value(1);
    }
    resetGame();
  }, [boardSize]);

  const resetGame = (): void => {
    // Add current game to history before resetting
    if (board.some(cell => cell !== null)) {
      setGameHistory(prev => [
        ...prev,
        {
          boardSize,
          board: [...board],
          winner: winner || (isBoardFull(board) ? 'draw' : null),
          date: new Date().toLocaleString()
        }
      ]);
    }

    // Reset game state
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinner(null);
    setGameOver(false);
    setWinningCells([]);
    
    // Reset animations
    cellScaleValues.forEach((val) => {
      Animated.spring(val, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const calculateWinner = (squares: CellValue[]): Player | null => {
    const size = boardSize;
    const requiredToWin = size === 3 ? 3 : 4;
    const winningLines: number[][] = [];

    // Generate all possible winning lines
    // Rows
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - requiredToWin; col++) {
        winningLines.push(
          Array.from({length: requiredToWin}, (_, i) => row * size + col + i)
        );
      }
    }

    // Columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - requiredToWin; row++) {
        winningLines.push(
          Array.from({length: requiredToWin}, (_, i) => (row + i) * size + col)
        );
      }
    }

    // Diagonals
    for (let row = 0; row <= size - requiredToWin; row++) {
      for (let col = 0; col <= size - requiredToWin; col++) {
        winningLines.push(
          Array.from({length: requiredToWin}, (_, i) => (row + i) * size + col + i)
        );
      }
      for (let col = requiredToWin - 1; col < size; col++) {
        winningLines.push(
          Array.from({length: requiredToWin}, (_, i) => (row + i) * size + col - i)
        );
      }
    }

    // Check all possible winning lines
    for (const line of winningLines) {
      const firstCell = squares[line[0]];
      if (!firstCell) continue;

      if (line.every(index => squares[index] === firstCell)) {
        setWinningCells(line);
        return firstCell;
      }
    }

    return null;
  };

  const isBoardFull = (squares: CellValue[]): boolean => {
    return squares.every(square => square !== null);
  };

  const handlePress = (index: number): void => {
    if (board[index] || gameOver) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(cellScaleValues[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cellScaleValues[index], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cellScaleValues[index], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const currentWinner = calculateWinner(newBoard);
    if (currentWinner) {
      setWinner(currentWinner);
      setGameOver(true);
      setScores(prev => ({
        ...prev,
        [currentWinner.toLowerCase()]: prev[currentWinner.toLowerCase() as keyof Scores] + 1
      }));
      celebrateWinner();
    } else if (isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner('draw');
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const celebrateWinner = (): void => {
    Animated.sequence([
      Animated.timing(boardScaleValue, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(boardScaleValue, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(boardScaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();

    // Animate winning cells
    winningCells.forEach((cellIndex) => {
      Animated.sequence([
        Animated.timing(cellScaleValues[cellIndex], {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cellScaleValues[cellIndex], {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const changeBoardSize = (size: BoardSize): void => {
    setBoardSize(size);
  };

  const renderCell = (index: number): JSX.Element => {
    const cellValue = board[index];
    const isWinningCell = winningCells.includes(index);
    const cellSize = BOARD_SIZE / boardSize;

    return (
      <TouchableOpacity
        key={`cell-${index}`}
        style={[
          styles.cell, 
          { 
            width: cellSize,
            height: cellSize,
          },
          isWinningCell && styles.winningCell,
        ]}
        onPress={() => handlePress(index)}
        disabled={gameOver}
      >
        <Animated.View style={{ transform: [{ scale: cellScaleValues[index] }] }}>
          {cellValue && (
            <Text style={[
              styles.cellText, 
              cellValue === 'X' ? styles.xText : styles.oText,
              { fontSize: boardSize === 3 ? 48 : 36 }
            ]}>
              {cellValue}
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderBoard = (): JSX.Element => {
    const size = boardSize;
    return (
      <Animated.View style={[
        styles.board, 
        { 
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          transform: [{ scale: boardScaleValue }] 
        }
      ]}>
        {Array.from({length: size}).map((_, row) => (
          <View key={`row-${row}`} style={styles.row}>
            {Array.from({length: size}).map((_, col) => (
              renderCell(row * size + col)
            ))}
          </View>
        ))}
      </Animated.View>
    );
  };

  const shareScores = async (): Promise<void> => {
    try {
      await Share.share({
        message: `Tic Tac Toe Scores (${boardSize}x${boardSize}):\n\nPlayer X: ${scores.x}\nPlayer O: ${scores.o}\nDraws: ${scores.draws}\n\nCurrent game: ${winner ? `${winner === 'draw' ? 'Draw' : `${winner} wins!`}` : 'In progress'}`,
        title: 'Tic Tac Toe Scores'
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusMessage = (): string => {
    if (winner) {
      return winner === 'draw' ? 'Game ended in a draw!' : `Player ${winner} wins!`;
    }
    return `Next player: ${isXNext ? 'X' : 'O'}`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeInValue }]}>
      <Text style={styles.title}>Tic Tac Toe</Text>
      
      <View style={styles.sizeSelector}>
        <TouchableOpacity 
          style={[styles.sizeButton, boardSize === 3 && styles.activeSizeButton]}
          onPress={() => changeBoardSize(3)}
        >
          <Text style={[styles.sizeButtonText, boardSize === 3 && styles.activeSizeButtonText]}>
            3×3
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity 
          style={[styles.sizeButton, boardSize === 4 && styles.activeSizeButton]}
          onPress={() => changeBoardSize(4)}
        >
          <Text style={[styles.sizeButtonText, boardSize === 4 && styles.activeSizeButtonText]}>
            4×4
          </Text>
        </TouchableOpacity> */}
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, styles.xText]}>X: {scores.x}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>Draws: {scores.draws}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, styles.oText]}>O: {scores.o}</Text>
        </View>
      </View>
      
      <Text style={styles.statusText}>{getStatusMessage()}</Text>
      
      {renderBoard()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={resetGame}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.shareButton]}
          onPress={shareScores}
        >
          <Ionicons name="share-social" size={20} color="white" />
          <Text style={styles.buttonText}>Share Scores</Text>
        </TouchableOpacity>
      </View>
      
      {gameHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Game History</Text>
          {gameHistory.slice(0, 5).reverse().map((game, index) => (
            <View key={`history-${index}-${game.date}`} style={styles.historyItem}>
              <Text style={styles.historyText}>
                {game.boardSize}x{game.boardSize}: {game.winner === 'draw' ? 'Draw' : `${game.winner} won`} - {game.date}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sizeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeSizeButton: {
    backgroundColor: '#4CAF50',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeSizeButtonText: {
    color: 'white',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  scoreBox: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  xText: {
    color: '#ff5e5e',
  },
  oText: {
    color: '#5e8cff',
  },
  statusText: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: '600',
    color: '#555',
  },
  board: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  winningCell: {
    backgroundColor: '#e6f7ff',
  },
  cellText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    width: '100%',
    marginTop: 10,
    maxHeight: 150,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  historyItem: {
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyText: {
    fontSize: 14,
    color: '#666',
  },
});

export default TicTacToe;
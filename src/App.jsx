import React, { useEffect, useMemo, useRef, useState } from 'react'

const BOARD_SIZE = 20
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]
const INITIAL_DIR = { x: 1, y: 0 } // 向右
const TICK_MS = 120

function randomFood(excludeCells) {
  while (true) {
    const x = Math.floor(Math.random() * BOARD_SIZE)
    const y = Math.floor(Math.random() * BOARD_SIZE)
    const hit = excludeCells.some((c) => c.x === x && c.y === y)
    if (!hit) return { x, y }
  }
}

function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0
}

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [dir, setDir] = useState(INITIAL_DIR)
  const [food, setFood] = useState(() => randomFood(INITIAL_SNAKE))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [running, setRunning] = useState(true)

  const dirRef = useRef(dir)
  const foodRef = useRef(food)
  useEffect(() => {
    dirRef.current = dir
  }, [dir])
  useEffect(() => {
    foodRef.current = food
  }, [food])

  // 键盘控制: 方向键/WASD
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase()
      let next
      if (key === 'arrowup' || key === 'w') next = { x: 0, y: -1 }
      else if (key === 'arrowdown' || key === 's') next = { x: 0, y: 1 }
      else if (key === 'arrowleft' || key === 'a') next = { x: -1, y: 0 }
      else if (key === 'arrowright' || key === 'd') next = { x: 1, y: 0 }
      else if (key === ' ') {
        // 空格暂停/继续
        setRunning((r) => !r)
        return
      } else {
        return
      }
      // 禁止直接 180° 掉头
      if (!isOpposite(dirRef.current, next)) {
        setDir(next)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 游戏主循环
  useEffect(() => {
    if (gameOver || !running) return
    const timer = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0]
        const nextHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y }
        // 撞墙
        if (
          nextHead.x < 0 ||
          nextHead.y < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y >= BOARD_SIZE
        ) {
          setGameOver(true)
          setRunning(false)
          return prev
        }
        // 吃到食物（使用最新食物位置）
        const eating = nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y
        // 撞到自己（非吃食物时允许移动到尾巴位置）
        const bodyToCheck = eating ? prev : prev.slice(0, prev.length - 1)
        const hitSelf = bodyToCheck.some((c) => c.x === nextHead.x && c.y === nextHead.y)
        if (hitSelf) {
          setGameOver(true)
          setRunning(false)
          return prev
        }
        let nextSnake
        if (eating) {
          nextSnake = [nextHead, ...prev] // 变长
          setScore((s) => s + 1)
          setFood(randomFood(nextSnake))
        } else {
          nextSnake = [nextHead, ...prev.slice(0, prev.length - 1)] // 正常移动
        }
        return nextSnake
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [gameOver, running])

  const cells = useMemo(() => {
    const arr = []
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        arr.push({ x, y })
      }
    }
    return arr
  }, [])

  const snakeSet = useMemo(() => {
    const s = new Set()
    for (const c of snake) s.add(`${c.x},${c.y}`)
    return s
  }, [snake])

  const headKey = `${snake[0].x},${snake[0].y}`
  const foodKey = `${food.x},${food.y}`

  const restart = () => {
    setSnake(INITIAL_SNAKE)
    setDir(INITIAL_DIR)
    setFood(randomFood(INITIAL_SNAKE))
    setScore(0)
    setGameOver(false)
    setRunning(true)
  }

  return (
    <div className="page">
      <h1 className="title">贪吃蛇</h1>
      <div className="hud">
        <div>分数：{score}</div>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? '暂停' : '继续'}
        </button>
        <button className="btn" onClick={restart}>重新开始</button>
      </div>

      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {cells.map((c) => {
          const key = `${c.x},${c.y}`
          const isHead = key === headKey
          const isFood = key === foodKey
          const isSnake = snakeSet.has(key)
          return (
            <div
              key={key}
              className={
                isHead ? 'cell snake-head' : isSnake ? 'cell snake' : isFood ? 'cell food' : 'cell'
              }
            />
          )
        })}
        {gameOver && (
          <div className="overlay">
            <div className="dialog">
              <div className="over-title">游戏结束</div>
              <div className="over-score">最终分数：{score}</div>
              <button className="btn primary" onClick={restart}>重新开始</button>
              <div className="tip">方向键/WASD 控制，空格暂停/继续</div>
            </div>
          </div>
        )}
      </div>
      <div className="tip footer">方向键/WASD 控制，空格暂停/继续</div>
    </div>
  )
}

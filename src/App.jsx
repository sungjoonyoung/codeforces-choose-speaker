import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rawData, setRawData] = useState('')
  const [participants, setParticipants] = useState([])
  const [problems, setProblems] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  const [assignments, setAssignments] = useState({})

  const parseData = () => {
    const lines = rawData.split('\n').map(l => l.trim())
    const participantBlocks = []
    let currentBlock = null

    // 1. 블록 단위 분리 (순위와 이름이 있는 라인 기준)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue

      // 순위 매칭 (예: "1 (1308)" 또는 "10 (123)")
      const rankMatch = line.match(/^(\d+)\s+\((\d+)\)(.*)$/)
      if (rankMatch) {
        if (currentBlock) participantBlocks.push(currentBlock)
        currentBlock = {
          rank: rankMatch[1],
          rating: rankMatch[2],
          nameContent: rankMatch[3],
          extraLines: []
        }
      } else if (currentBlock) {
        // 하단 요약 정보(Accepted/Tried 등)가 나오면 중단
        if (line.startsWith('Accepted') || line.startsWith('Tried')) {
          participantBlocks.push(currentBlock)
          currentBlock = null
          break
        }
        currentBlock.extraLines.push(line)
      }
    }
    if (currentBlock) participantBlocks.push(currentBlock)

    // 2. 블록별 토큰 추출 및 파싱
    let maxTokenCount = 8
    const countries = ['South Korea', 'Korea, Republic of', 'United States', 'China', 'Russia', 'Japan', 'India', 'Kazakhstan', 'Vietnam', 'Ukraine', 'Poland', 'Germany', 'France', 'United Kingdom', 'Brazil', 'Canada', 'Belarus', 'Taiwan', 'Hong Kong', 'Singapore', 'Uzbekistan', 'Kyrgyzstan']
    const countryRegex = new RegExp(`^(${countries.join('|')})`, 'i')

    const parsedParticipants = participantBlocks.map(block => {
      let name = block.nameContent.trim()
      const tokens = []

      // 이름 라인 끝에 붙은 토큰(+나 점수) 확인
      const trailingTokenMatch = name.match(/^(.*?)\s+([\+\-]\d+|[\+\-]|\d{3,})$/)
      if (trailingTokenMatch) {
        name = trailingTokenMatch[1].trim()
        tokens.push(trailingTokenMatch[2])
      } else {
        // 끝에 공백 없이 +가 붙은 경우 처리
        const simplePlusMatch = name.match(/^(.*?)(\+)$/)
        if (simplePlusMatch) {
          name = simplePlusMatch[1].trim()
          tokens.push('+')
        }
      }

      // 국가명 제거
      name = name.replace(countryRegex, '').trim()
      // 이름에 포함된 별표나 특수문자 정리
      name = name.replace(/^\*\s+/, '').trim()

      // 추가 라인에서 토큰 추출
      block.extraLines.forEach(line => {
        if (line.match(/^\d{2}:\d{2}$/)) return // 시간 정보 무시
        
        // Case 2: "-31348" 같이 합쳐진 토큰 처리
        const mergedMatch = line.match(/^(-\d+)(\d{3,})$/)
        if (mergedMatch) {
          tokens.push(mergedMatch[1])
          tokens.push(mergedMatch[2])
        } else if (line.startsWith('+') || line.startsWith('-') || line.match(/^-?\d+$/)) {
          tokens.push(line)
        }
      })

      if (tokens.length > maxTokenCount) maxTokenCount = tokens.length

      // 토큰을 해결 여부로 변환 (최대 20문제까지 일단 저장)
      const solved = new Array(20).fill(false)
      tokens.forEach((token, idx) => {
        if (idx < 20) {
          if (token.startsWith('+') || parseInt(token) >= 100) {
            solved[idx] = true
          }
        }
      })

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || `User ${block.rank}`,
        solved
      }
    })

    // 문제 수에 맞게 배열 슬라이싱
    const finalProblemCount = Math.max(maxTokenCount, 8)
    const newProblems = Array.from({ length: finalProblemCount }, (_, i) => String.fromCharCode(65 + i))
    
    setProblems(newProblems)
    setParticipants(parsedParticipants.map(p => ({
      ...p,
      solved: p.solved.slice(0, finalProblemCount)
    })))
    setAssignments({})
  }

  const toggleSolve = (pId, probIdx) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = [...p.solved]
        newSolved[probIdx] = !newSolved[probIdx]
        return { ...p, solved: newSolved }
      }
      return p
    }))
  }

  // 특정 위치부터 오른쪽으로 한 칸 밀기 (중간에 푼 문제가 비어있는 경우 대응)
  const shiftFrom = (pId, startIdx) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = [...p.solved]
        newSolved.splice(startIdx, 0, false) // 해당 위치에 false 삽입
        return { ...p, solved: newSolved.slice(0, problems.length) }
      }
      return p
    }))
  }

  const shiftRow = (pId, direction) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = new Array(problems.length).fill(false)
        for (let i = 0; i < problems.length; i++) {
          const newIdx = i + direction
          if (newIdx >= 0 && newIdx < problems.length) {
            newSolved[newIdx] = p.solved[i]
          }
        }
        return { ...p, solved: newSolved }
      }
      return p
    }))
  }

  const removeParticipant = (pId) => {
    setParticipants(participants.filter(p => p.id !== pId))
  }

  const addProblem = () => {
    const nextChar = String.fromCharCode(65 + problems.length)
    setProblems([...problems, nextChar])
    setParticipants(participants.map(p => ({
      ...p,
      solved: [...p.solved, false]
    })))
  }

  const removeProblem = () => {
    if (problems.length <= 1) return
    setProblems(problems.slice(0, -1))
    setParticipants(participants.map(p => ({
      ...p,
      solved: p.solved.slice(0, -1)
    })))
  }

  const selectSpeakers = () => {
    const newAssignments = {}
    const usedSpeakers = new Set()
    
    // 문제별로 푼 사람 수 계산 (적게 푼 문제부터 우선 할당하여 유니크함 극대화)
    const probInfo = problems.map((name, idx) => ({
      name,
      idx,
      solvers: participants.filter(p => p.solved[idx])
    })).sort((a, b) => a.solvers.length - b.solvers.length)
    
    // 1차: 중복 없이 할당 시도
    for (const prob of probInfo) {
      const potentialSolvers = prob.solvers
        .filter(p => !usedSpeakers.has(p.id))
        .sort(() => Math.random() - 0.5)
      
      if (potentialSolvers.length > 0) {
        const selected = potentialSolvers[0]
        newAssignments[prob.name] = selected.name
        usedSpeakers.add(selected.id)
      }
    }

    // 2차: 할당 안 된 문제에 대해 중복 허용하여 할당
    for (const prob of probInfo) {
      if (!newAssignments[prob.name]) {
        const potentialSolvers = prob.solvers
          .sort(() => Math.random() - 0.5)
        
        if (potentialSolvers.length > 0) {
          newAssignments[prob.name] = potentialSolvers[0].name
        } else {
          newAssignments[prob.name] = '해결자 없음'
        }
      }
    }

    setAssignments(newAssignments)
  }

  return (
    <div className="container">
      <header>
        <h1>Codeforces Speaker Selector</h1>
        <p className="subtitle">순위표를 복사해 붙여넣으면 문제별 발표자를 정해줍니다.</p>
      </header>
      
      <section className="input-section">
        <textarea 
          placeholder="Friends standing 페이지에서 Ctrl+A -> Ctrl+V 하세요..."
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          rows={6}
        />
        <div className="actions">
          <button onClick={() => {setParticipants([]); setAssignments({}); setRawData('')}}>초기화</button>
          <button onClick={parseData} className="primary-btn">데이터 파싱 및 로드</button>
        </div>
      </section>

      {participants.length > 0 && (
        <section className="table-section">
          <div className="table-header-flex">
            <h2>대진표 관리</h2>
            <div className="table-controls">
              <button onClick={addProblem}>문제 추가</button>
              <button onClick={removeProblem}>문제 삭제</button>
              <button onClick={selectSpeakers} className="success-btn">발표자 랜덤 선정</button>
            </div>
          </div>
          <p className="hint">💡 <b>셀의 화살표(→)</b>를 클릭하면 해당 위치부터 오른쪽으로 밀립니다 (건너뛴 문제 보정용)</p>
          <div className="table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {problems.map(p => <th key={p}>{p}</th>)}
                  <th>전체 이동</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.name}</td>
                    {p.solved.map((isSolved, idx) => (
                      <td 
                        key={idx} 
                        className={`solve-cell ${isSolved ? 'solved' : 'not-solved'}`}
                      >
                        <div className="cell-content">
                          <span className="check" onClick={() => toggleSolve(p.id, idx)}>
                            {isSolved ? '✔' : ''}
                          </span>
                          <button 
                            className="mini-shift" 
                            onClick={() => shiftFrom(p.id, idx)}
                            title="여기서부터 오른쪽으로 밀기"
                          >
                            →
                          </button>
                        </div>
                      </td>
                    ))}
                    <td>
                      <div className="shift-btns">
                        <button onClick={() => shiftRow(p.id, -1)}>←</button>
                        <button onClick={() => shiftRow(p.id, 1)}>→</button>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => removeParticipant(p.id)} className="danger-text">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {Object.keys(assignments).length > 0 && (
        <section className="results-section">
          <h2>최종 발표자 명단</h2>
          <div className="assignment-grid">
            {problems.map(p => (
              <div key={p} className="assignment-card">
                <span className="prob-label">Problem {p}</span>
                <span className="speaker-name">{assignments[p]}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App

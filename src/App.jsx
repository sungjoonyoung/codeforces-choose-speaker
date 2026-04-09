import { useState, useRef, useEffect } from 'react'
import './App.css'

const t = {
  ko: {
    title: '코드포스 발표자 선정기',
    subtitle: '순위표를 복사해 붙여넣으면 문제별 발표자를 정해줍니다.',
    placeholder: 'Friends standing 페이지에서 Ctrl+A -> Ctrl+V 하세요...',
    clear: '초기화',
    parse: '데이터 파싱 및 로드',
    manage: '대진표 관리',
    addProb: '문제 추가',
    delProb: '문제 삭제',
    pick: '발표자 랜덤 선정',
    hint: '💡 셀 하단의 회색 화살표(→)를 클릭하면 해당 위치부터 오른쪽으로 밀립니다.',
    shiftTitle: '여기서부터 오른쪽으로 밀기',
    delete: '삭제',
    results: '최종 발표자 명단',
    noSolver: '해결자 없음',
    addUser: '참여자 수동 추가',
    addBtn: '추가',
    namePlace: '이름 입력...',
    langLabel: '🇺🇸 English'
  },
  en: {
    title: 'CF Speaker Selector',
    subtitle: 'Paste standings to choose speakers for each problem.',
    placeholder: 'Ctrl+A -> Ctrl+V your friends standings here...',
    clear: 'Clear',
    parse: 'Parse & Load',
    manage: 'Manage Standings',
    addProb: 'Add Prob',
    delProb: 'Del Prob',
    pick: 'Pick Speakers',
    hint: '💡 Click gray arrow (→) in a cell to shift solves from that position.',
    shiftTitle: 'Shift right from here',
    delete: 'Del',
    results: 'Speaker Assignments',
    noSolver: 'No Solver',
    addUser: 'Add Participant',
    addBtn: 'Add',
    namePlace: 'Enter name...',
    langLabel: '🇰🇷 한국어'
  }
}

function App() {
  const [lang, setLang] = useState('ko')
  const [rawData, setRawData] = useState('')
  const [participants, setParticipants] = useState([])
  const [problems, setProblems] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  const [assignments, setAssignments] = useState({})
  const [newName, setNewName] = useState('')
  
  const resultsRef = useRef(null)
  const curT = t[lang]

  // 결과 창이 업데이트될 때마다 자동으로 스크롤
  useEffect(() => {
    if (Object.keys(assignments).length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [assignments])

  const parseData = () => {
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l)
    const participantBlocks = []
    let currentBlock = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('*')) break;

      const rankMatch = line.match(/^\s*(\d+)\s*\(\s*(\d+)\s*\)\s*(.*)$/)
      if (rankMatch) {
        if (currentBlock) participantBlocks.push(currentBlock)
        currentBlock = { rank: rankMatch[1], header: rankMatch[3], extra: [] }
      } else if (currentBlock) {
        if (line.startsWith('Accepted') || line.startsWith('Tried') || line.includes('Copyright')) {
          participantBlocks.push(currentBlock)
          currentBlock = null
          break
        }
        currentBlock.extra.push(line)
      }
    }
    if (currentBlock) participantBlocks.push(currentBlock)

    const countries = ['South Korea', 'Korea, Republic of', 'United States', 'China', 'Russia', 'Japan', 'India', 'Kazakhstan', 'Vietnam', 'Ukraine', 'Poland', 'Germany', 'France', 'United Kingdom', 'Brazil', 'Canada', 'Belarus', 'Taiwan', 'Hong Kong', 'Singapore', 'Uzbekistan', 'Kyrgyzstan']
    const countryRegex = new RegExp(`^(${countries.join('|')})`, 'i')

    let maxSolveTokens = 8

    const parsed = participantBlocks.map(block => {
      let headerText = block.header.trim().replace(countryRegex, '').trim();
      const hashIdx = headerText.indexOf('#');
      let name = "";
      let remainingHeader = "";

      if (hashIdx !== -1) {
        name = headerText.substring(0, hashIdx).trim();
        const afterHash = headerText.substring(hashIdx + 1);
        const firstSpace = afterHash.indexOf(' ');
        remainingHeader = firstSpace !== -1 ? afterHash.substring(firstSpace) : "";
      } else {
        const words = headerText.split(/\s+/);
        name = words[0];
        remainingHeader = words.slice(1).join(' ');
      }

      const combinedSolveText = [remainingHeader, ...block.extra].join(' ');
      let cleaned = combinedSolveText.replace(/\d{2}:\d{2}/g, ' ');
      cleaned = cleaned.replace(/(-\d+)(\d{3,})/g, '$1 $2');
      
      const allTokens = cleaned.match(/([\+\-]\d+|[\+\-]|(?<![:\d])\d{3,}(?![:\d])|\b\d+\b)/g) || [];
      const solveTokens = (hashIdx === -1 && allTokens.length > 0) ? allTokens.slice(1) : allTokens;

      if (solveTokens.length > maxSolveTokens) maxSolveTokens = solveTokens.length

      const solved = new Array(20).fill(false)
      solveTokens.forEach((token, idx) => {
        if (idx < 20) {
          if (token.startsWith('+') || parseInt(token) >= 100) {
            solved[idx] = true
          }
        }
      })

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || `User${block.rank}`,
        solved
      }
    })

    const finalCount = Math.max(maxSolveTokens, 8)
    setProblems(Array.from({ length: finalCount }, (_, i) => String.fromCharCode(65 + i)))
    setParticipants(parsed.map(p => ({ ...p, solved: p.solved.slice(0, finalCount) })))
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

  const shiftFrom = (pId, startIdx) => {
    setParticipants(participants.map(p => {
      if (p.id === pId) {
        const newSolved = [...p.solved]
        newSolved.splice(startIdx, 0, false)
        return { ...p, solved: newSolved.slice(0, problems.length) }
      }
      return p
    }))
  }

  const addManualParticipant = () => {
    if (!newName.trim()) return
    setParticipants([...participants, {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      solved: new Array(problems.length).fill(false)
    }])
    setNewName('')
  }

  const selectSpeakers = () => {
    const newAssignments = {}
    const used = new Set()
    const probInfo = problems.map((name, idx) => ({
      name, idx, solvers: participants.filter(p => p.solved[idx])
    })).sort((a, b) => a.solvers.length - b.solvers.length)
    
    probInfo.forEach(prob => {
      const potential = prob.solvers.filter(p => !used.has(p.id)).sort(() => Math.random() - 0.5)
      if (potential.length > 0) {
        newAssignments[prob.name] = potential[0].name
        used.add(potential[0].id)
      }
    })

    probInfo.forEach(prob => {
      if (!newAssignments[prob.name]) {
        const potential = prob.solvers.sort(() => Math.random() - 0.5)
        newAssignments[prob.name] = potential.length > 0 ? potential[0].name : curT.noSolver
      }
    })
    setAssignments(newAssignments)
  }

  return (
    <div className="container">
      <div className="lang-toggle">
        <button className="lang-btn" onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>
          {curT.langLabel}
        </button>
      </div>
      <header>
        <h1>{curT.title}</h1>
        <p className="subtitle">{curT.subtitle}</p>
      </header>
      
      <section className="input-section">
        <textarea 
          placeholder={curT.placeholder}
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          rows={5}
        />
        <div className="actions">
          <button onClick={() => {setParticipants([]); setAssignments({}); setRawData('')}}>{curT.clear}</button>
          <button onClick={parseData} className="primary-btn">{curT.parse}</button>
        </div>
      </section>

      {participants.length > 0 && (
        <section className="table-section">
          <div className="table-header-flex">
            <h2>{curT.manage}</h2>
            <div className="table-controls">
              <button onClick={() => {
                setProblems([...problems, String.fromCharCode(65 + problems.length)])
                setParticipants(participants.map(p => ({ ...p, solved: [...p.solved, false] })))
              }}>{curT.addProb}</button>
              <button onClick={() => {
                if (problems.length <= 1) return
                setProblems(problems.slice(0, -1))
                setParticipants(participants.map(p => ({ ...p, solved: p.solved.slice(0, -1) })))
              }}>{curT.delProb}</button>
              <button onClick={selectSpeakers} className="success-btn">{curT.pick}</button>
            </div>
          </div>
          <p className="hint">{curT.hint}</p>
          <div className="table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {problems.map(p => <th key={p}>{p}</th>)}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.name}</td>
                    {p.solved.map((isSolved, idx) => (
                      <td key={idx} className={`solve-cell ${isSolved ? 'solved' : 'not-solved'}`}>
                        <div className="cell-content">
                          <span className="check" onClick={() => toggleSolve(p.id, idx)}>
                            {isSolved ? '✔' : '-'}
                          </span>
                          <button className="mini-shift" onClick={() => shiftFrom(p.id, idx)} title={curT.shiftTitle}>→</button>
                        </div>
                      </td>
                    ))}
                    <td>
                      <button onClick={() => setParticipants(participants.filter(pt => pt.id !== p.id))} className="danger-text">{curT.delete}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="add-user-form">
            <h4>{curT.addUser}</h4>
            <input 
              type="text" 
              placeholder={curT.namePlace} 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && addManualParticipant()}
            />
            <button onClick={addManualParticipant}>{curT.addBtn}</button>
          </div>
        </section>
      )}

      {Object.keys(assignments).length > 0 && (
        <section className="results-section" ref={resultsRef}>
          <h2>{curT.results}</h2>
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

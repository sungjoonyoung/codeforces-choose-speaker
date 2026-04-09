import { useState, useRef, useEffect } from 'react'
import './App.css'

// 고해상도 최적화 태극기 (표준 S자 곡선 및 4괘 반영)
const FlagKR = () => (
  <svg width="24" height="16" viewBox="0 0 36 24" className="flag-icon">
    <rect width="36" height="24" fill="#fff" rx="1"/>
    <g transform="translate(18,12) rotate(-33.7)">
      {/* 태극 문양 (S자 곡선) */}
      <circle r="6" fill="#0047A0"/>
      <path d="M-6 0a6 6 0 1 1 12 0a3 3 0 1 1-6 0a3 3 0 1 0-6 0" fill="#CD2E3A"/>
      
      <g fill="#000">
        {/* 건 (왼쪽 위) */}
        <g transform="translate(-11, 0)">
          <rect x="-0.5" y="-3.5" width="1.1" height="7"/>
          <rect x="-2.1" y="-3.5" width="1.1" height="7"/>
          <rect x="1.1" y="-3.5" width="1.1" height="7"/>
        </g>
        {/* 곤 (오른쪽 아래) */}
        <g transform="translate(11, 0)">
          <rect x="-0.5" y="-3.5" width="1.1" height="3.2"/><rect x="-0.5" y="0.3" width="1.1" height="3.2"/>
          <rect x="-2.1" y="-3.5" width="1.1" height="3.2"/><rect x="-2.1" y="0.3" width="1.1" height="3.2"/>
          <rect x="1.1" y="-3.5" width="1.1" height="3.2"/><rect x="1.1" y="0.3" width="1.1" height="3.2"/>
        </g>
        {/* 이 (왼쪽 아래) */}
        <g transform="rotate(67.4) translate(-11, 0)">
          <rect x="-0.5" y="-3.5" width="1.1" height="7"/>
          <rect x="-2.1" y="-3.5" width="1.1" height="3.2"/><rect x="-2.1" y="0.3" width="1.1" height="3.2"/>
          <rect x="1.1" y="-3.5" width="1.1" height="7"/>
        </g>
        {/* 감 (오른쪽 위) */}
        <g transform="rotate(67.4) translate(11, 0)">
          <rect x="-0.5" y="-3.5" width="1.1" height="7"/>
          <rect x="-2.1" y="-3.5" width="1.1" height="3.2"/><rect x="-2.1" y="0.3" width="1.1" height="3.2"/>
          <rect x="1.1" y="-3.5" width="1.1" height="3.2"/><rect x="1.1" y="0.3" width="1.1" height="3.2"/>
        </g>
      </g>
    </g>
  </svg>
)

// 단순화된 성조기 SVG
const FlagUS = () => (
  <svg width="24" height="16" viewBox="0 0 741 390" className="flag-icon">
    <rect width="741" height="390" fill="#bf0a30" rx="2"/>
    <path d="M0 30h741M0 90h741M0 150h741M0 210h741M0 270h741M0 330h741" stroke="#fff" strokeWidth="30"/>
    <rect width="296" height="210" fill="#002868"/>
    <g fill="#fff">
      {[0, 60, 120, 180, 240].map(x => [30, 90, 150].map(y => <circle key={`${x}-${y}`} cx={x + 30} cy={y} r="10" />))}
    </g>
  </svg>
)

const t = {
  ko: {
    title: '코드포스 발표자 선정기',
    subtitle: 'FRIENDS STANDING에서 Ctrl+A 후 복사해 붙여넣으면 문제별 발표자를 정해줍니다.',
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
    langLabel: 'English'
  },
  en: {
    title: 'CF Speaker Selector',
    subtitle: 'Ctrl+A and copy-paste from FRIENDS STANDING to choose speakers.',
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
    langLabel: '한국어'
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
          {lang === 'ko' ? <FlagUS /> : <FlagKR />}
          <span>{curT.langLabel}</span>
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
